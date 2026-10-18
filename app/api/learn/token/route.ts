// app/api/learn/token/route.ts
//
// Server-only API route — generates a Bunny Stream signed embed token and
// (optionally) a signed Bunny CDN URL for PDF notes.
//
// Required environment variables (server-side only, no NEXT_PUBLIC_ prefix):
//   BUNNY_STREAM_LIBRARY_ID   — your Bunny Stream library ID (numeric string)
//   BUNNY_STREAM_SIGNING_KEY  — Token Auth signing key from Stream > Library > Security
//   BUNNY_CDN_BASE_URL        — base CDN/pull-zone URL (e.g. https://dop-study.b-cdn.net)
//   BUNNY_CDN_SIGNING_KEY     — optional: your CDN signed URL security key
//   SUPABASE_SERVICE_ROLE_KEY — service role key for server-side DB reads
//   NEXT_PUBLIC_SUPABASE_URL  — your Supabase project URL
//
// This route is called by the learning page client after it receives the lesson slug.
// It validates enrollment, then returns a signed player embed URL and a signed PDF URL.
// No secrets or raw asset paths are ever returned in plain form.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Read a required server env var; throw a clear error if missing. */
function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

/**
 * Generate a Bunny Stream signed embed token.
 * Docs: https://docs.bunny.net/docs/stream-security-token-authentication
 *
 * token = base64url( sha256( signingKey + videoId + expiry + "" ) )
 */
function generateStreamToken(
  signingKey: string,
  videoId: string,
  expiresAt: number
): string {
  const raw = signingKey + videoId + expiresAt + "";
  const hash = createHmac("sha256", "")
    .update(Buffer.from(raw, "utf-8"))
    .digest("base64");
  // Bunny expects base64url (replace +, /, =)
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Generate a Bunny CDN signed URL for the PDF.
 * Docs: https://docs.bunny.net/docs/cdn-token-authentication
 *
 * If BUNNY_CDN_SIGNING_KEY is not set, return the unsigned base URL.
 * The PDF will still be served but without time-limited access.
 */
function generateSignedCdnUrl(
  cdnBaseUrl: string,
  filePath: string,
  signingKey: string | undefined,
  expiresAt: number
): string {
  const cleanBase = cdnBaseUrl.replace(/\/$/, "");
  const normalizedPath = filePath.startsWith("/") ? filePath : "/" + filePath;
  // Encode each segment for URL query compatibility, preserving slashes
  const encodedPath = normalizedPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");

  if (!signingKey) {
    return `${cleanBase}${encodedPath}`;
  }

  // Bunny CDN token: MD5( signingKey + url_path + expires )
  // Note: Bunny validates against the URL path before query parameters
  const tokenInput = signingKey + normalizedPath + expiresAt;
  const { createHash } = require("crypto") as typeof import("crypto");
  const token = createHash("md5")
    .update(tokenInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${cleanBase}${encodedPath}?token=${token}&expires=${expiresAt}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Parse request body.
    const body = await req.json().catch(() => null);
    const lessonSlug = body?.lessonSlug as string | undefined;
    const supabaseAccessToken = body?.accessToken as string | undefined;

    if (!lessonSlug || !supabaseAccessToken) {
      return NextResponse.json(
        { error: "lessonSlug and accessToken are required" },
        { status: 400 }
      );
    }

    // 2. Verify the student's Supabase session using the access token they sent.
    //    This uses the service role client so we can read auth.users.
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authError } =
      await supabase.auth.getUser(supabaseAccessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Unauthorized: invalid or expired session" },
        { status: 401 }
      );
    }

    const studentId = authData.user.id;

    // 3. Load the lesson — including the server-only bunny_video_id and pdf_path.
    const { data: lesson, error: lessonError } = await supabase
      .from("lessons")
      .select("id, title, description, bunny_video_id, pdf_path, duration_sec, course_id")
      .eq("slug", lessonSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // 4. Verify the student has an active enrollment for this lesson's course.
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollments")
      .select("id, status, expires_at")
      .eq("student_id", studentId)
      .eq("course_id", lesson.course_id)
      .eq("status", "active")
      .maybeSingle();

    if (enrollError || !enrollment) {
      return NextResponse.json(
        { error: "Access denied: no active enrollment for this course" },
        { status: 403 }
      );
    }

    // Check enrollment expiry.
    if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Access denied: your enrollment has expired" },
        { status: 403 }
      );
    }

    // 5. Load the student's existing progress for this lesson.
    const { data: progress } = await supabase
      .from("lesson_progress")
      .select("last_position, completed, completed_at")
      .eq("student_id", studentId)
      .eq("lesson_id", lesson.id)
      .maybeSingle();

    // 6. Generate Bunny Stream signed player URL.
    //    Token expires in 4 hours — enough for a full session.
    const TOKEN_TTL_SECONDS = 4 * 60 * 60;
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

    let playerUrl: string | null = null;

    if (lesson.bunny_video_id) {
      const libraryId = requireEnv("BUNNY_STREAM_LIBRARY_ID");
      const streamSigningKey = requireEnv("BUNNY_STREAM_SIGNING_KEY");
      const token = generateStreamToken(
        streamSigningKey,
        lesson.bunny_video_id,
        expiresAt
      );
      playerUrl =
        `https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.bunny_video_id}` +
        `?autoplay=false&loop=false&muted=false&responsive=true&token=${token}&expires=${expiresAt}`;
    }

    // 7. Generate signed Bunny CDN URL for PDF notes.
    let pdfUrl: string | null = null;

    if (lesson.pdf_path) {
      const cdnBase = requireEnv("BUNNY_CDN_BASE_URL");
      const cdnSigningKey = process.env.BUNNY_CDN_SIGNING_KEY; // optional
      pdfUrl = generateSignedCdnUrl(
        cdnBase,
        lesson.pdf_path,
        cdnSigningKey,
        expiresAt
      );
    }

    // 8. Return the safe payload — no raw keys, signing secrets, or file paths.
    return NextResponse.json({
      lessonId: lesson.id,
      title: lesson.title,
      description: lesson.description ?? null,
      durationSec: lesson.duration_sec ?? null,
      playerUrl,   // signed embed URL only
      pdfUrl,      // signed CDN URL or null
      progress: {
        lastPosition: progress?.last_position ?? null,
        completed: progress?.completed ?? false,
        completedAt: progress?.completed_at ?? null,
      },
      expiresAt,   // client can refresh before this unix timestamp
    });
  } catch (err: any) {
    // Never log signing keys or student tokens.
    console.error("[learn/token] Internal error:", err?.message ?? "unknown");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
