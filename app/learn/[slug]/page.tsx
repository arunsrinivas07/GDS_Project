"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  Loader2,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface LessonData {
  lessonId: string;
  title: string;
  description: string | null;
  durationSec: number | null;
  playerUrl: string | null;
  pdfUrl: string | null;
  progress: {
    lastPosition: number | null;
    completed: boolean;
    completedAt: string | null;
  };
  expiresAt: number;
}

type PageState =
  | { status: "loading" }
  | { status: "unauthorized"; reason: string }
  | { status: "error"; message: string }
  | { status: "ready"; data: LessonData };

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

// ── Page component ────────────────────────────────────────────────────────────

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const lessonSlug = params?.slug as string | undefined;

  const { user, loading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [pdfTab, setPdfTab] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Track last saved position to avoid spamming the progress API.
  const lastSavedPosition = useRef<number | null>(null);
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenExpiresAt = useRef<number>(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch signed URLs from the server ──────────────────────────────────────

  const fetchLessonToken = useCallback(
    async (slug: string): Promise<void> => {
      if (!isSupabaseConfigured || !supabase) {
        setPageState({
          status: "unauthorized",
          reason: "Supabase is not configured. Check your environment variables.",
        });
        return;
      }

      // Get the current Supabase access token to send to our server route.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setPageState({
          status: "unauthorized",
          reason: "Please sign in to access this lesson.",
        });
        return;
      }

      try {
        const res = await fetch("/api/learn/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonSlug: slug,
            accessToken: session.access_token,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            setPageState({
              status: "unauthorized",
              reason: "Please sign in to continue.",
            });
            return;
          }
          if (res.status === 403) {
            setPageState({
              status: "unauthorized",
              reason: json.error ?? "You do not have access to this lesson.",
            });
            return;
          }
          if (res.status === 404) {
            setPageState({
              status: "error",
              message: "Lesson not found.",
            });
            return;
          }
          setPageState({
            status: "error",
            message: json.error ?? "Failed to load lesson.",
          });
          return;
        }

        tokenExpiresAt.current = json.expiresAt;
        setPageState({ status: "ready", data: json as LessonData });

        // Schedule a proactive token refresh 10 minutes before expiry.
        const msUntilRefresh = (json.expiresAt - Math.floor(Date.now() / 1000) - 600) * 1000;
        if (msUntilRefresh > 0) {
          refreshTimer.current = setTimeout(() => {
            fetchLessonToken(slug);
          }, msUntilRefresh);
        }
      } catch {
        setPageState({
          status: "error",
          message: "Network error. Please check your connection.",
        });
      }
    },
    []
  );

  // ── Auth guard + initial load ──────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace(`/login?next=/learn/${lessonSlug ?? ""}`);
      return;
    }

    if (!lessonSlug) {
      setPageState({ status: "error", message: "No lesson specified." });
      return;
    }

    fetchLessonToken(lessonSlug);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
    };
  }, [authLoading, user, lessonSlug, fetchLessonToken, router]);

  // ── Save progress (debounced, via server route) ───────────────────────────

  const saveProgress = useCallback(
    async (opts: { lastPosition?: number; completed?: boolean }) => {
      if (pageState.status !== "ready") return;
      if (!isSupabaseConfigured || !supabase) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: pageState.data.lessonId,
          accessToken: session.access_token,
          ...opts,
        }),
      }).catch(() => {
        // Silent fail — non-critical path.
      });
    },
    [pageState]
  );

  // ── Message listener for Bunny iframe playback events ─────────────────────
  // Bunny Stream iframes emit postMessage events: "timeupdate", "ended", etc.

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (pageState.status !== "ready") return;

      const { event, currentTime } = e.data ?? {};

      if (event === "timeupdate" && typeof currentTime === "number") {
        const posInt = Math.floor(currentTime);
        // Debounce: save at most once every 15 seconds.
        if (
          lastSavedPosition.current === null ||
          Math.abs(posInt - lastSavedPosition.current) >= 15
        ) {
          lastSavedPosition.current = posInt;
          if (progressSaveTimer.current)
            clearTimeout(progressSaveTimer.current);
          progressSaveTimer.current = setTimeout(() => {
            saveProgress({ lastPosition: posInt });
          }, 2000);
        }
      }

      if (event === "ended") {
        handleMarkComplete();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pageState, saveProgress]);

  // ── Mark lesson as complete ───────────────────────────────────────────────

  const handleMarkComplete = useCallback(async () => {
    if (markingComplete) return;
    if (pageState.status !== "ready") return;
    if (pageState.data.progress.completed) return;

    setMarkingComplete(true);
    await saveProgress({ completed: true });
    setMarkingComplete(false);
    setJustCompleted(true);

    // Update local state so the UI reflects completion instantly.
    setPageState((prev) =>
      prev.status === "ready"
        ? {
            ...prev,
            data: {
              ...prev.data,
              progress: {
                ...prev.data.progress,
                completed: true,
                completedAt: new Date().toISOString(),
              },
            },
          }
        : prev
    );
  }, [markingComplete, pageState, saveProgress]);

  // ── Iframe src with autostart-at position ─────────────────────────────────

  const playerSrc = (() => {
    if (pageState.status !== "ready") return "";
    const { playerUrl, progress } = pageState.data;
    if (!playerUrl) return "";
    const startAt = progress.lastPosition ?? 0;
    if (startAt > 10) {
      return `${playerUrl}&start=${startAt}`;
    }
    return playerUrl;
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  // Loading state
  if (authLoading || pageState.status === "loading") {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-warm flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto">
            <Loader2 className="text-brand-red animate-spin" size={28} />
          </div>
          <p className="text-gray-500 font-medium text-sm">Loading your lesson…</p>
        </div>
      </div>
    );
  }

  // Unauthorized / access denied
  if (pageState.status === "unauthorized") {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-warm flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-amber-500" size={28} />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl text-charcoal mb-2">
              Access Restricted
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              {pageState.reason}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 bg-brand-red text-white text-sm font-bold rounded-xl hover:bg-brand-red-dark transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState.status === "error") {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-warm flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
            <AlertTriangle className="text-brand-red" size={28} />
          </div>
          <div>
            <h1 className="font-heading font-black text-2xl text-charcoal mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-500 text-sm">{pageState.message}</p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-sm font-bold rounded-xl hover:bg-brand-red-dark transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Ready: main learning UI ───────────────────────────────────────────────

  const { data } = pageState;
  const isCompleted = data.progress.completed;

  return (
    <div className="min-h-screen pb-20 bg-warm">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-charcoal transition-colors"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate min-w-0">
            <BookOpen size={13} />
            <span className="hidden sm:inline">GDS Starter Pass</span>
            <ChevronRight size={12} className="hidden sm:block shrink-0" />
            <span className="text-charcoal font-semibold truncate">{data.title}</span>
          </div>

          {/* Completion badge or button */}
          {isCompleted ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
              <CheckCircle2 size={13} />
              <span className="hidden sm:inline">Completed</span>
            </div>
          ) : (
            <button
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-600 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {markingComplete ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              <span className="hidden sm:inline">Mark Complete</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Completion celebration */}
        {justCompleted && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-scale-in">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Lesson Marked Complete!</p>
              <p className="text-xs text-emerald-700">Great work. Your progress has been saved.</p>
            </div>
          </div>
        )}

        {/* Lesson header */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <h1 className="font-heading font-black text-xl sm:text-2xl text-charcoal leading-tight">
                {data.title}
              </h1>
              {data.description && (
                <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                  {data.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {data.durationSec && (
                <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                  <Clock size={12} />
                  {formatDuration(data.durationSec)}
                </span>
              )}
              {isCompleted && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 size={12} />
                  Done
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        {data.pdfUrl && (
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1 w-fit">
            <button
              onClick={() => setPdfTab(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !pdfTab
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Video Lesson
            </button>
            <button
              onClick={() => setPdfTab(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                pdfTab
                  ? "bg-white text-charcoal shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText size={12} />
              PDF Notes
            </button>
          </div>
        )}

        {/* ── Video Player ── */}
        {!pdfTab && (
          <div className="bg-black rounded-2xl overflow-hidden shadow-xl border border-gray-900">
            {data.playerUrl ? (
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={playerSrc}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={data.title}
                  loading="lazy"
                  // Security: restrict what the embed can do
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
                />
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-white/60 space-y-3 p-8">
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <p className="text-sm font-medium">Video not yet available for this lesson.</p>
                <p className="text-xs text-white/40">Check back soon or contact support.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PDF Viewer ── */}
        {pdfTab && data.pdfUrl && (
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <div className="flex items-center gap-2 text-sm font-semibold text-charcoal">
                <FileText size={15} className="text-brand-red" />
                <span>Chapter Notes — {data.title}</span>
              </div>
              {/* Note: no download button per user preference (view only) */}
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                View Only
              </span>
            </div>
            <div className="w-full" style={{ height: "78vh" }}>
              <iframe
                src={`${data.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full h-full border-0"
                title={`PDF Notes — ${data.title}`}
                loading="lazy"
                // Block right-click / browser download via sandbox restrictions
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}

        {/* No PDF available note */}
        {pdfTab && !data.pdfUrl && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
              <FileText size={22} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 font-medium">
              PDF notes for this lesson are not yet available.
            </p>
          </div>
        )}

        {/* Resume position notice */}
        {!pdfTab && data.progress.lastPosition && data.progress.lastPosition > 10 && !data.progress.completed && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl">
            <Clock size={13} className="text-blue-400 shrink-0" />
            <span>
              Resuming from{" "}
              <strong>{formatDuration(data.progress.lastPosition)}</strong> where you left off.
            </span>
          </div>
        )}

        {/* Mark complete footer */}
        {!isCompleted && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-charcoal">Finished watching?</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Mark this lesson complete to track your progress.
              </p>
            </div>
            <button
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {markingComplete ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <CheckCircle2 size={15} />
              )}
              {markingComplete ? "Saving…" : "Mark as Complete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
