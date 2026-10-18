// app/api/learn/progress/route.ts
//
// Server-side API route for saving lesson progress.
// Students can only write their own progress — never another student's.
//
// POST body: { lessonId, lastPosition?, completed?, accessToken }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const lessonId = body?.lessonId as string | undefined;
    const accessToken = body?.accessToken as string | undefined;
    const lastPosition =
      typeof body?.lastPosition === "number" ? body.lastPosition : null;
    const markCompleted = Boolean(body?.completed);

    if (!lessonId || !accessToken) {
      return NextResponse.json(
        { error: "lessonId and accessToken are required" },
        { status: 400 }
      );
    }

    // Validate the session.
    const supabase = createClient(
      requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );

    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const studentId = authData.user.id;

    // Handle composite virtual lesson IDs (e.g. {uuid}-{slug})
    const actualLessonId = lessonId.includes("-gds-chapter-")
      ? lessonId.split("-gds-chapter-")[0]
      : lessonId;

    // Verify the lesson exists and is published (prevents phantom lesson IDs).
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, course_id")
      .eq("id", actualLessonId)
      .eq("is_published", true)
      .maybeSingle();

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Verify enrollment is still active.
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id, expires_at")
      .eq("student_id", studentId)
      .eq("course_id", lesson.course_id)
      .eq("status", "active")
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "No active enrollment" }, { status: 403 });
    }

    if (enrollment.expires_at && new Date(enrollment.expires_at) < new Date()) {
      return NextResponse.json({ error: "Enrollment expired" }, { status: 403 });
    }

    // Upsert progress — student_id is always the authenticated user.
    const now = new Date().toISOString();
    const hasCompletedField = typeof body?.completed === "boolean";
    const completedVal = Boolean(body?.completed);

    const { error: upsertError } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          student_id: studentId,
          lesson_id: lessonId,
          ...(lastPosition !== null && { last_position: lastPosition }),
          ...(hasCompletedField && {
            completed: completedVal,
            completed_at: completedVal ? now : null,
          }),
          updated_at: now,
        },
        { onConflict: "student_id,lesson_id" }
      );

    if (upsertError) {
      console.error("[learn/progress] Upsert error:", upsertError.message);
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[learn/progress] Internal error:", err?.message ?? "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
