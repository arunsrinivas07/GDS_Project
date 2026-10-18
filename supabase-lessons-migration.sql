-- ============================================================================
-- MIGRATION: Lessons and Learning Progress
-- Run AFTER the main supabase-schema.sql in Supabase SQL Editor.
-- Safe to run on existing databases (uses IF NOT EXISTS / ON CONFLICT).
-- ============================================================================

-- ─── 1. Lessons ─────────────────────────────────────────────────────────────

create table if not exists public.lessons (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null
                    references public.courses(id) on delete cascade,
  slug            text not null unique
                    check (pg_catalog.btrim(slug) <> ''),
  title           text not null
                    check (pg_catalog.btrim(title) <> ''),
  description     text,
  bunny_video_id  text
                    check (bunny_video_id is null or pg_catalog.btrim(bunny_video_id) <> ''),
  pdf_path        text
                    check (pdf_path is null or pdf_path like '/%'),
  sort_order      integer not null default 0,
  is_published    boolean not null default true,
  duration_sec    integer check (duration_sec is null or duration_sec > 0),
  created_at      timestamptz not null default pg_catalog.now(),
  updated_at      timestamptz not null default pg_catalog.now()
);

create index if not exists idx_lessons_course
  on public.lessons(course_id, sort_order);

alter table public.lessons enable row level security;

create trigger set_lessons_updated_at
  before update on public.lessons
  for each row
  execute function public.set_current_timestamp_updated_at();

create policy lessons_select_enrolled
  on public.lessons
  for select
  to authenticated
  using (
    is_published = true
    and exists (
      select 1 from public.enrollments e
      where e.student_id = (select auth.uid())
        and e.course_id = public.lessons.course_id
        and e.status = 'active'
        and (e.expires_at is null or e.expires_at > pg_catalog.now())
    )
  );


-- ─── 2. Lesson Progress ──────────────────────────────────────────────────────

create table if not exists public.lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null
                    references public.profiles(id) on delete cascade,
  lesson_id       uuid not null
                    references public.lessons(id) on delete cascade,
  last_position   integer check (last_position is null or last_position >= 0),
  completed       boolean not null default false,
  completed_at    timestamptz,
  updated_at      timestamptz not null default pg_catalog.now(),

  constraint uq_student_lesson unique (student_id, lesson_id)
);

create index if not exists idx_lesson_progress_student
  on public.lesson_progress(student_id);

create index if not exists idx_lesson_progress_lesson
  on public.lesson_progress(lesson_id);

alter table public.lesson_progress enable row level security;

create trigger set_lesson_progress_updated_at
  before update on public.lesson_progress
  for each row
  execute function public.set_current_timestamp_updated_at();

create policy lesson_progress_select_own
  on public.lesson_progress
  for select
  to authenticated
  using ((select auth.uid()) = student_id);

create policy lesson_progress_insert_own
  on public.lesson_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = student_id);

create policy lesson_progress_update_own
  on public.lesson_progress
  for update
  to authenticated
  using ((select auth.uid()) = student_id)
  with check ((select auth.uid()) = student_id);


-- ─── 3. Permissions ──────────────────────────────────────────────────────────

grant select on public.lessons to authenticated, anon;
grant select, insert, update on public.lesson_progress to authenticated;
grant all on public.lessons, public.lesson_progress to service_role;


-- ─── 4. Seed: sample lessons ───────────────────────────────────────────────
-- Uses the same Bunny video and notes for demonstration until new videos are ready.

insert into public.lessons (
  course_id, slug, title, description,
  bunny_video_id, pdf_path, sort_order, is_published, duration_sec
)
select
  c.id,
  'gds-chapter-1-introduction',
  'Chapter 1: Introduction to GDS Exam',
  'Overview of the Gramin Dak Sevak recruitment process, eligibility criteria, and exam pattern for 2026.',
  'REPLACE_WITH_YOUR_BUNNY_VIDEO_ID',
  '/notes/gds-chapter-1-introduction.pdf',
  1, true, 2700
from public.courses c
where c.slug = 'gds-starter-pass'
on conflict (slug) do nothing;

insert into public.lessons (
  course_id, slug, title, description,
  bunny_video_id, pdf_path, sort_order, is_published, duration_sec
)
select
  c.id,
  'gds-chapter-2-post-office-guide-part-1',
  'Chapter 2: Post Office Guide Part 1 & Basic Terminology',
  'Comprehensive breakdown of Post Office Guide Part 1, postal articles, sorting rules, and organizational setup.',
  'REPLACE_WITH_YOUR_BUNNY_VIDEO_ID',
  '/notes/gds-chapter-1-introduction.pdf',
  2, true, 3150
from public.courses c
where c.slug = 'gds-starter-pass'
on conflict (slug) do nothing;

insert into public.lessons (
  course_id, slug, title, description,
  bunny_video_id, pdf_path, sort_order, is_published, duration_sec
)
select
  c.id,
  'gds-chapter-3-postal-manual-volume-5',
  'Chapter 3: Postal Manual Volume V (Definitions & Duties)',
  'In-depth study of Postal Manual Volume V definitions, mail transmission rules, and Branch Post Master (BPM) duties.',
  'REPLACE_WITH_YOUR_BUNNY_VIDEO_ID',
  '/notes/gds-chapter-1-introduction.pdf',
  3, true, 2880
from public.courses c
where c.slug = 'gds-starter-pass'
on conflict (slug) do nothing;

insert into public.lessons (
  course_id, slug, title, description,
  bunny_video_id, pdf_path, sort_order, is_published, duration_sec
)
select
  c.id,
  'gds-chapter-4-mail-products-services',
  'Chapter 4: Premium Mail Products & Financial Services',
  'Speed Post, Registered Mail, Parcel, POSB (Savings Bank), Sukanya Samriddhi Account, and IPPB integration.',
  'REPLACE_WITH_YOUR_BUNNY_VIDEO_ID',
  '/notes/gds-chapter-1-introduction.pdf',
  4, true, 3420
from public.courses c
where c.slug = 'gds-starter-pass'
on conflict (slug) do nothing;

insert into public.lessons (
  course_id, slug, title, description,
  bunny_video_id, pdf_path, sort_order, is_published, duration_sec
)
select
  c.id,
  'gds-chapter-5-mathematics-basics',
  'Chapter 5: Arithmetic & Quantitative Aptitude for GDS',
  'Core mathematical concepts: Number Systems, Percentages, Profit & Loss, Simple Interest, and Time & Work.',
  'REPLACE_WITH_YOUR_BUNNY_VIDEO_ID',
  '/notes/gds-chapter-1-introduction.pdf',
  5, true, 2520
from public.courses c
where c.slug = 'gds-starter-pass'
on conflict (slug) do nothing;

insert into public.lessons (
  course_id, slug, title, description,
  bunny_video_id, pdf_path, sort_order, is_published, duration_sec
)
select
  c.id,
  'gds-chapter-6-mock-exam-walkthrough',
  'Chapter 6: Previous Year Question Paper Analysis & Mock Strategy',
  'Step-by-step solution walkthrough of recent circle exam papers and time-saving shortcut strategies.',
  'REPLACE_WITH_YOUR_BUNNY_VIDEO_ID',
  '/notes/gds-chapter-1-introduction.pdf',
  6, true, 3600
from public.courses c
where c.slug = 'gds-starter-pass'
on conflict (slug) do nothing;
