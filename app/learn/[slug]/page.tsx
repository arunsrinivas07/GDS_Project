"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  Search,
  PanelRightClose,
  PanelRightOpen,
  PlayCircle,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

// ── Types ────────────────────────────────────────────────────────────────────

interface PlaylistItem {
  id: string;
  slug: string;
  title: string;
  durationSec: number | null;
  sortOrder: number;
  hasPdf: boolean;
  completed: boolean;
  lastPosition: number | null;
}

interface LessonData {
  lessonId: string;
  slug?: string;
  title: string;
  description: string | null;
  durationSec: number | null;
  playerUrl: string | null;
  pdfUrl: string | null;
  courseId?: string;
  playlist?: PlaylistItem[];
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
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
  return `${s}s`;
}

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const lessonSlug = params?.slug as string | undefined;

  const { user, loading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<"video" | "notes">("video");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "videos" | "notes">("all");
  const [markingCompleteId, setMarkingCompleteId] = useState<string | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Track last saved position to avoid spamming the progress API
  const lastSavedPosition = useRef<number | null>(null);
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenExpiresAt = useRef<number>(0);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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

        // Remember last watched lesson for Continue Watching
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("dop_last_watched_slug", slug);
            localStorage.setItem(
              `dop_pos_${slug}`,
              String(json.progress?.lastPosition ?? 0)
            );
          } catch {
            // fallback
          }
        }

        setPageState({ status: "ready", data: json as LessonData });

        // Proactive token refresh 10 min before expiry
        const msUntilRefresh =
          (json.expiresAt - Math.floor(Date.now() / 1000) - 600) * 1000;
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
    async (targetLessonId: string, opts: { lastPosition?: number; completed?: boolean }) => {
      if (!isSupabaseConfigured || !supabase) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch("/api/learn/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: targetLessonId,
          accessToken: session.access_token,
          ...opts,
        }),
      }).catch(() => {
        // Silent fail
      });
    },
    []
  );

  // ── Message listener for Bunny iframe playback events ─────────────────────
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (pageState.status !== "ready") return;

      const { event, currentTime } = e.data ?? {};

      if (event === "timeupdate" && typeof currentTime === "number") {
        const posInt = Math.floor(currentTime);

        if (lessonSlug) {
          try {
            localStorage.setItem(`dop_pos_${lessonSlug}`, String(posInt));
          } catch { }
        }

        // Debounce: save at most once every 12 seconds
        if (
          lastSavedPosition.current === null ||
          Math.abs(posInt - lastSavedPosition.current) >= 12
        ) {
          lastSavedPosition.current = posInt;
          if (progressSaveTimer.current)
            clearTimeout(progressSaveTimer.current);
          progressSaveTimer.current = setTimeout(() => {
            saveProgress(pageState.data.lessonId, { lastPosition: posInt });
          }, 1500);
        }
      }

      if (event === "ended") {
        handleToggleComplete(pageState.data.lessonId, true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [pageState, saveProgress, lessonSlug]);

  // ── Toggle Completion Status for any lesson in course ─────────────────────
  const handleToggleComplete = useCallback(
    async (targetLessonId: string, explicitState?: boolean) => {
      if (pageState.status !== "ready") return;
      const currentLesson = pageState.data;

      const isCurrent = currentLesson.lessonId === targetLessonId;
      const currentCompleted = isCurrent
        ? currentLesson.progress.completed
        : currentLesson.playlist?.find((p) => p.id === targetLessonId)?.completed ?? false;

      const nextCompleted = explicitState !== undefined ? explicitState : !currentCompleted;

      setMarkingCompleteId(targetLessonId);

      // Optimistic update in UI
      setPageState((prev) => {
        if (prev.status !== "ready") return prev;

        const updatedPlaylist = prev.data.playlist?.map((p) =>
          p.id === targetLessonId ? { ...p, completed: nextCompleted } : p
        );

        const isCurrentTarget = prev.data.lessonId === targetLessonId;
        const updatedProgress = isCurrentTarget
          ? {
            ...prev.data.progress,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          }
          : prev.data.progress;

        return {
          ...prev,
          data: {
            ...prev.data,
            playlist: updatedPlaylist,
            progress: updatedProgress,
          },
        };
      });

      if (isCurrent && nextCompleted) {
        setJustCompleted(true);
      }
      setToastMessage(
        nextCompleted
          ? "Lesson marked as completed! 🎉"
          : "Lesson marked as incomplete."
      );

      // Persist to server
      await saveProgress(targetLessonId, { completed: nextCompleted });
      setMarkingCompleteId(null);
    },
    [pageState, saveProgress]
  );

  // ── Compute course progress stats ─────────────────────────────────────────
  const { playlistItems, completedCount, totalCount, progressPercent } = useMemo(() => {
    if (pageState.status !== "ready") {
      return { playlistItems: [], completedCount: 0, totalCount: 1, progressPercent: 0 };
    }

    const list =
      pageState.data.playlist && pageState.data.playlist.length > 0
        ? pageState.data.playlist
        : [
          {
            id: pageState.data.lessonId,
            slug: lessonSlug || "gds-chapter-1-introduction",
            title: pageState.data.title,
            durationSec: pageState.data.durationSec,
            sortOrder: 1,
            hasPdf: Boolean(pageState.data.pdfUrl),
            completed: pageState.data.progress.completed,
            lastPosition: pageState.data.progress.lastPosition,
          },
        ];

    const completed = list.filter((i) => i.completed).length;
    const total = list.length;
    const pct = Math.round((completed / Math.max(1, total)) * 100);

    return { playlistItems: list, completedCount: completed, totalCount: total, progressPercent: pct };
  }, [pageState, lessonSlug]);

  // ── Filtered items based on Search Query and Type ──────────────────────────
  const filteredPlaylist = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return playlistItems.filter((item) => {
      if (filterType === "videos" && !item.durationSec && !item.id) return false;
      if (filterType === "notes" && !item.hasPdf) return false;

      if (!q) return true;
      const titleMatch = item.title.toLowerCase().includes(q);
      const noteMatch = item.hasPdf && "pdf notes chapter study".includes(q);
      return titleMatch || noteMatch;
    });
  }, [playlistItems, searchQuery, filterType]);

  // ── Iframe src with Continue Watching autostart position ──────────────────
  const playerSrc = useMemo(() => {
    if (pageState.status !== "ready") return "";
    const { playerUrl, progress } = pageState.data;
    if (!playerUrl) return "";

    let startAt = progress.lastPosition ?? 0;
    if (typeof window !== "undefined" && lessonSlug) {
      const localPos = parseInt(localStorage.getItem(`dop_pos_${lessonSlug}`) || "0", 10);
      if (localPos > startAt) {
        startAt = localPos;
      }
    }

    if (startAt > 5) {
      return `${playerUrl}&start=${startAt}`;
    }
    return playerUrl;
  }, [pageState, lessonSlug]);

  // ── Render States ─────────────────────────────────────────────────────────

  if (authLoading || pageState.status === "loading") {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-warm flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center mx-auto">
            <Loader2 className="text-brand-red animate-spin" size={28} />
          </div>
          <p className="text-gray-500 font-medium text-sm">Loading your study portal…</p>
        </div>
      </div>
    );
  }

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
            <p className="text-gray-500 text-sm leading-relaxed">{pageState.reason}</p>
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

  // ── Ready State: Clean White / Warm Dashboard-Matching UI ─────────────────
  const { data } = pageState;
  const isCurrentCompleted = data.progress.completed;
  const lastPos = data.progress.lastPosition ?? 0;

  return (
    <div className="min-h-screen bg-warm text-charcoal flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-charcoal border border-gray-200 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-up">
          <Sparkles className="text-brand-red shrink-0" size={18} />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-charcoal ml-2 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header Bar — Clean White Glassmorphism matching Dashboard */}
      <header className="h-16 border-b border-gray-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-brand-red transition-colors bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-xl border border-gray-200/80 shrink-0 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <div className="h-4 w-px bg-gray-200 hidden sm:block shrink-0" />

          {/* Course Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0 text-xs">
            <span className="text-gray-400 hidden md:inline truncate font-medium">
              GDS Postal Curriculum
            </span>
            <ChevronRight size={12} className="text-gray-300 hidden md:block shrink-0" />
            <span className="font-bold text-charcoal truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {data.title}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Progress bar pill */}
          <div className="hidden lg:flex items-center gap-2.5 bg-gray-50 border border-gray-200/80 px-3.5 py-1.5 rounded-xl">
            <div className="text-right">
              <span className="text-[11px] font-bold text-gray-600">
                {completedCount} / {totalCount} Completed
              </span>
            </div>
            <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-red h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-black text-brand-red">
              {progressPercent}%
            </span>
          </div>

          {/* Quick Mark Complete Button */}
          <button
            onClick={() => handleToggleComplete(data.lessonId)}
            disabled={markingCompleteId === data.lessonId}
            className={`flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${isCurrentCompleted
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-white text-gray-700 border-gray-200 hover:border-brand-red hover:text-brand-red"
              }`}
          >
            {markingCompleteId === data.lessonId ? (
              <Loader2 size={13} className="animate-spin text-brand-red" />
            ) : (
              <CheckCircle2
                size={14}
                className={isCurrentCompleted ? "text-emerald-600" : "text-gray-400"}
              />
            )}
            <span className="hidden sm:inline">
              {isCurrentCompleted ? "Completed" : "Mark as Completed"}
            </span>
          </button>

          {/* The ONLY Curriculum Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-xs ${sidebarOpen
              ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-charcoal"
              : "bg-brand-red text-white border-brand-red hover:bg-brand-red-dark"
              }`}
            title={sidebarOpen ? "Hide Curriculum" : "Show Curriculum"}
          >
            {sidebarOpen ? (
              <>
                <PanelRightClose size={15} />
                <span className="hidden md:inline">Hide Curriculum</span>
              </>
            ) : (
              <>
                <PanelRightOpen size={15} />
                <span className="hidden md:inline">Show Curriculum</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Study Screen: Video/Content Area + Collapsible Right Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Main Viewing Pane */}
        <div
          className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${sidebarOpen ? "lg:mr-96" : "mr-0"
            }`}
        >
          {/* Continue Watching Banner Alert */}
          {lastPos > 10 && !isCurrentCompleted && (
            <div className="bg-blue-50/80 border-b border-blue-100 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-blue-600 shrink-0" />
                <span>
                  <strong>Continue Watching:</strong> Resuming from{" "}
                  <span className="font-mono font-bold text-blue-950">
                    {formatDuration(lastPos)}
                  </span>{" "}
                  where you stopped previously.
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                Auto-saved
              </span>
            </div>
          )}

          {/* Player or Notes Container */}
          <div className="bg-black flex-1 flex flex-col justify-center items-center relative min-h-[380px] lg:min-h-[520px]">
            {activeTab === "video" ? (
              <div className="w-full h-full flex flex-col bg-white">
                <div className="h-11 border-b border-gray-200 bg-gray-50 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                    <PlayCircle size={14} className="text-brand-red" />
                    <span>Official Video Lesson: {data.title}</span>
                  </div>

                </div>
                {data.playerUrl ? (
                  <div className="relative w-full flex-1 min-h-[360px] md:min-h-[480px] lg:min-h-[580px] flex items-center justify-center bg-black">
                    <iframe
                      src={playerSrc}
                      className="w-full h-full min-h-[360px] md:min-h-[480px] lg:min-h-[580px] border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={data.title}
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
                    />
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3 bg-white w-full h-full flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                      <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-base font-bold text-charcoal">Video Lesson In Production</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      This video will be uploaded soon. You can open and read the PDF Chapter Notes below in the meantime.
                    </p>
                    {data.pdfUrl && (
                      <button
                        onClick={() => setActiveTab("notes")}
                        className="mt-3 inline-flex items-center gap-2 bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-red-dark transition-colors cursor-pointer"
                      >
                        <FileText size={14} />
                        <span>Switch to PDF Notes</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* PDF Notes Viewer */
              <div className="w-full h-full min-h-[600px] flex flex-col bg-white">
                <div className="h-11 border-b border-gray-200 bg-gray-50 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                    <FileText size={14} className="text-brand-red" />
                    <span>Official Notes Viewer: {data.title}</span>
                  </div>

                </div>
                {data.pdfUrl ? (
                  <iframe
                    src={`${data.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full flex-1 border-0 min-h-[600px]"
                    title={`Notes — ${data.title}`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                    <FileText size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-500">
                      No PDF Notes attached to this lesson yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lesson Details & Sub-Tabs Bar (Clean White Card Layout) */}
          <div className="bg-white border-t border-gray-200/90 p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-charcoal">
                  {data.title}
                </h1>
                {data.durationSec && (
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock size={13} className="text-brand-red" />
                      {formatDuration(data.durationSec)}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 font-semibold">
                      Official GDS 2026 Syllabus
                    </span>
                  </div>
                )}
              </div>

              {/* Tab Selector between Video & PDF Notes */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 shrink-0">
                <button
                  onClick={() => setActiveTab("video")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "video"
                    ? "bg-white text-charcoal shadow-xs"
                    : "text-gray-500 hover:text-charcoal"
                    }`}
                >
                  <PlayCircle size={14} className={activeTab === "video" ? "text-brand-red" : ""} />
                  <span>Video Lesson</span>
                </button>
                {data.pdfUrl && (
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "notes"
                      ? "bg-white text-charcoal shadow-xs"
                      : "text-gray-500 hover:text-charcoal"
                      }`}
                  >
                    <FileText size={14} className={activeTab === "notes" ? "text-brand-red" : ""} />
                    <span>PDF Notes</span>
                  </button>
                )}
              </div>
            </div>

            {/* Description & Overview */}
            {data.description && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  About this Lesson
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
                  {data.description}
                </p>
              </div>
            )}

            {/* Completion Status Card */}
            <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCurrentCompleted
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-white border border-gray-200 text-gray-400"
                    }`}
                >
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-charcoal">
                    {isCurrentCompleted
                      ? "Completed! Your progress is saved."
                      : "Have you completed this lesson?"}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isCurrentCompleted
                      ? "You can rewatch or review PDF notes at any time."
                      : "Marking it complete updates your overall progress toward the verified certificate."}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleComplete(data.lessonId)}
                disabled={markingCompleteId === data.lessonId}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-center shrink-0 ${isCurrentCompleted
                  ? "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs"
                  : "bg-brand-red hover:bg-brand-red-dark text-white shadow-sm"
                  }`}
              >
                {markingCompleteId === data.lessonId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>
                  {isCurrentCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── White/Light Course Curriculum Sidebar ── */}
        <aside
          className={`fixed top-16 bottom-0 right-0 w-full sm:w-96 bg-white border-l border-gray-200/90 z-30 flex flex-col transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${sidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* Sidebar Top: Header + Search Bar (NO duplicate close button) */}
          <div className="p-4 border-b border-gray-200/80 bg-gray-50/60 space-y-3">
            <div>
              <h3 className="font-heading font-black text-sm text-charcoal flex items-center gap-2">
                <BookOpen size={16} className="text-brand-red" />
                <span>Course Content</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {completedCount} / {totalCount} lessons completed ({progressPercent}%)
              </p>
            </div>

            {/* Overall Course Progress Bar */}
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-red h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Feature 3: Search Lessons and Notes */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lessons, topics, or PDFs…"
                className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-8 py-2 text-xs text-charcoal placeholder-gray-400 focus:outline-none focus:border-brand-red transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Search Filter Pills */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setFilterType("all")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${filterType === "all"
                  ? "bg-brand-red text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-charcoal"
                  }`}
              >
                All ({playlistItems.length})
              </button>
              <button
                onClick={() => setFilterType("videos")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${filterType === "videos"
                  ? "bg-brand-red text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-charcoal"
                  }`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType("notes")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${filterType === "notes"
                  ? "bg-brand-red text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:text-charcoal"
                  }`}
              >
                PDF Notes
              </button>
            </div>
          </div>

          {/* Sidebar Section Title */}
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200/70 flex items-center justify-between text-xs font-bold text-gray-600">
            <span>Section 1: GDS Foundation & Rules</span>
            <span className="text-[10px] text-gray-400 font-normal">
              {filteredPlaylist.length} items
            </span>
          </div>

          {/* Sidebar Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
            {filteredPlaylist.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Search size={22} className="text-gray-400 mx-auto" />
                <p className="text-xs font-semibold text-gray-500">
                  No lessons match &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="text-xs text-brand-red hover:underline cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              filteredPlaylist.map((item, idx) => {
                const isSelected = item.slug === lessonSlug;
                const isItemCompleted = item.completed;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 transition-colors group flex items-start gap-3 relative ${isSelected
                      ? "bg-red-50/70 border-l-4 border-brand-red"
                      : "hover:bg-gray-50/80"
                      }`}
                  >
                    {/* Feature 2: Interactive Checkbox to Mark as Completed */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleComplete(item.id);
                      }}
                      disabled={markingCompleteId === item.id}
                      className="mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                      title={
                        isItemCompleted
                          ? "Mark as incomplete"
                          : "Mark lesson as completed"
                      }
                    >
                      {markingCompleteId === item.id ? (
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                      ) : isItemCompleted ? (
                        <CheckCircle2 size={18} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded border border-gray-300 hover:border-emerald-500 transition-colors bg-white" />
                      )}
                    </button>

                    {/* Lesson Link (Navigates to lesson) */}
                    <Link
                      href={`/learn/${item.slug}`}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs font-semibold leading-snug line-clamp-2 ${isSelected
                            ? "text-brand-red font-bold"
                            : isItemCompleted
                              ? "text-gray-400 line-through decoration-gray-300"
                              : "text-charcoal group-hover:text-brand-red"
                            }`}
                        >
                          {idx + 1}. {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                        {item.durationSec && (
                          <span className="flex items-center gap-1 font-mono">
                            <PlayCircle size={11} className="text-brand-red" />
                            {formatDuration(item.durationSec)}
                          </span>
                        )}

                        {item.hasPdf && (
                          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            <FileText size={10} className="text-amber-600" />
                            PDF Notes
                          </span>
                        )}

                        {isSelected && (
                          <span className="text-[10px] font-bold text-brand-red ml-auto uppercase tracking-wider">
                            Now Playing
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-gray-200/80 bg-gray-50 flex items-center justify-between text-[11px] text-gray-500">
            <span>DOP Study Academi</span>
            <button
              onClick={() => {
                if (playlistItems[0]) router.push(`/learn/${playlistItems[0].slug}`);
              }}
              className="text-brand-red hover:underline font-semibold cursor-pointer"
            >
              First Lesson
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
