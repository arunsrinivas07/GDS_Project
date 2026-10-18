
-- ============================================================================
-- DOP STUDY ACADEMY
-- Fresh Supabase Setup: Profiles, Courses, Enrollments, Payments and Security
--
-- Run once in a NEW Supabase project.
-- Payment verification must be performed by your trusted FastAPI/Next.js backend.
-- Never expose the Supabase service_role key to the browser.
-- ============================================================================


-- ============================================================================
-- PART 1: SHARED TIMESTAMP FUNCTION
-- ============================================================================

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;


-- ============================================================================
-- PART 2: PROFILES
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  state text,
  role text not null default 'student'
    check (role in ('student', 'admin', 'instructor')),
  avatar_url text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

alter table public.profiles enable row level security;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_current_timestamp_updated_at();

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Automatically provision a student profile when a user registers via
-- Email OTP, Password, or Google OAuth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    state,
    avatar_url
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'state', 'Uttar Pradesh'),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      ''
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = pg_catalog.now();

  return new;
end;
$$;

-- Drop trigger if exists and attach to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();



-- ============================================================================
-- PART 3: COURSES
-- ============================================================================

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (pg_catalog.btrim(slug) <> ''),
  title text not null,
  description text,
  price_inr integer not null check (price_inr >= 0),
  mrp_inr integer check (mrp_inr >= price_inr),
  validity_days integer not null default 365
    check (validity_days > 0),
  is_published boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create index idx_courses_published
on public.courses(is_published);

alter table public.courses enable row level security;

create trigger set_courses_updated_at
before update on public.courses
for each row
execute function public.set_current_timestamp_updated_at();

create policy courses_select_published
on public.courses
for select
to anon, authenticated
using (is_published = true);

-- Seed the initial course without overwriting existing prices.
insert into public.courses (
  slug,
  title,
  description,
  price_inr,
  mrp_inr,
  validity_days,
  is_published
)
values (
  'gds-starter-pass',
  'GDS Starter Pass (2026 Exam Pattern)',
  'Complete preparation batch for Gramin Dak Sevak exam: video lessons, 200+ full mock tests, chapter-wise notes, and certificate.',
  999,
  1999,
  365,
  true
)
on conflict (slug) do nothing;


-- ============================================================================
-- PART 4: ENROLLMENTS
-- ============================================================================

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null
    references public.profiles(id) on delete cascade,
  course_id uuid not null
    references public.courses(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'expired', 'suspended', 'cancelled')),
  started_at timestamptz not null default pg_catalog.now(),
  expires_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),

  constraint uq_student_course unique (student_id, course_id)
);

create index idx_enrollments_student
on public.enrollments(student_id);

create index idx_enrollments_course
on public.enrollments(course_id);

create index idx_enrollments_status
on public.enrollments(status);

alter table public.enrollments enable row level security;

create trigger set_enrollments_updated_at
before update on public.enrollments
for each row
execute function public.set_current_timestamp_updated_at();

create policy enrollments_select_own
on public.enrollments
for select
to authenticated
using ((select auth.uid()) = student_id);


-- ============================================================================
-- PART 5: PAYMENTS
-- ============================================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null
    references public.profiles(id) on delete cascade,
  course_id uuid not null
    references public.courses(id) on delete restrict,

  order_id text not null unique
    check (pg_catalog.btrim(order_id) <> ''),

  provider text not null default 'razorpay'
    check (provider = 'razorpay'),

  amount_inr integer not null
    check (amount_inr > 0),

  currency text not null default 'INR'
    check (currency = 'INR'),

  status text not null default 'pending'
    check (status in ('pending', 'captured', 'failed', 'refunded')),

  provider_payment_id text
    check (
      provider_payment_id is null
      or pg_catalog.btrim(provider_payment_id) <> ''
    ),

  provider_signature text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

-- A gateway payment ID can only be recorded once per provider.
create unique index uq_payments_provider_payment
on public.payments(provider, provider_payment_id)
where provider_payment_id is not null;

create index idx_payments_student
on public.payments(student_id);

create index idx_payments_status
on public.payments(status);

alter table public.payments enable row level security;

create trigger set_payments_updated_at
before update on public.payments
for each row
execute function public.set_current_timestamp_updated_at();

create policy payments_select_own
on public.payments
for select
to authenticated
using ((select auth.uid()) = student_id);


-- ============================================================================
-- PART 6: AUTOMATIC PROFILE CREATION
-- Supports Email OTP and Google OAuth.
-- The user's role is always initialized as student.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
  v_phone text;
  v_state text;
  v_avatar text;
begin
  v_full_name := coalesce(
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), ''),
    pg_catalog.split_part(
      coalesce(new.email, 'Aspirant'),
      '@',
      1
    )
  );

  v_phone := nullif(
    pg_catalog.btrim(new.raw_user_meta_data ->> 'phone'),
    ''
  );

  v_state := nullif(
    pg_catalog.btrim(new.raw_user_meta_data ->> 'state'),
    ''
  );

  v_avatar := coalesce(
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'picture'), '')
  );

  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    state,
    role,
    avatar_url
  )
  values (
    new.id,
    v_full_name,
    new.email,
    v_phone,
    v_state,
    'student',
    v_avatar
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = pg_catalog.now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ============================================================================
-- PART 7: SERVER-ONLY PAYMENT COMPLETION
--
-- Call only after the backend verifies:
-- 1. The gateway signature.
-- 2. The gateway's authoritative captured payment status.
-- 3. The order belongs to the expected student.
-- 4. The captured amount and currency.
-- 5. The payment ID and order ID from the gateway.
--
-- This database function does NOT contact Razorpay or verify its signature.
-- ============================================================================

create or replace function public.complete_payment_and_enroll(
  p_student_id uuid,
  p_course_slug text,
  p_order_id text,
  p_provider text,
  p_provider_payment_id text,
  p_amount_inr integer,
  p_currency text default 'INR',
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course record;
  v_existing_payment record;
  v_existing_enrollment record;
  v_payment_by_id record;

  v_course_slug text;
  v_order_id text;
  v_provider text;
  v_payment_id_clean text;
  v_currency text;

  v_expiry timestamptz;
  v_payment_id uuid;
  v_enrollment_id uuid;
begin
  -- 1. Validate required identifiers and payment inputs.

  if p_student_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Student ID is required'
    );
  end if;

  v_course_slug := nullif(pg_catalog.btrim(p_course_slug), '');
  v_order_id := nullif(pg_catalog.btrim(p_order_id), '');
  v_provider := pg_catalog.lower(pg_catalog.btrim(p_provider));
  v_payment_id_clean :=
    nullif(pg_catalog.btrim(p_provider_payment_id), '');
  v_currency := pg_catalog.upper(pg_catalog.btrim(p_currency));

  if v_course_slug is null or v_order_id is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Course slug and order ID are required'
    );
  end if;

  if v_provider is distinct from 'razorpay' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Unsupported payment provider'
    );
  end if;

  if v_payment_id_clean is null then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'A non-empty gateway payment ID is required'
    );
  end if;

  if p_amount_inr is null or p_amount_inr <= 0 then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Payment amount must be a positive integer'
    );
  end if;

  if v_currency is distinct from 'INR' then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Only INR payments are supported'
    );
  end if;

  -- 2. Serialize concurrent requests for this order, payment ID,
  --    and student/course combination.

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('order:' || v_order_id, 0)
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'payment:razorpay:' || v_payment_id_clean, 0
    )
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'enrollment:' || p_student_id::text || ':' || v_course_slug, 0
    )
  );

  -- 3. Fetch the official course price and validity.

  select id, price_inr, validity_days
  into v_course
  from public.courses
  where slug = v_course_slug
    and is_published = true;

  if not found then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Course not found or not published'
    );
  end if;

  -- 4. Compare the amount with the database price.

  if p_amount_inr <> v_course.price_inr then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Payment amount does not match the official course price'
    );
  end if;

  -- 5. Prevent a gateway payment ID from being reused across orders.

  select *
  into v_payment_by_id
  from public.payments
  where provider = v_provider
    and provider_payment_id = v_payment_id_clean;

  if found and v_payment_by_id.order_id <> v_order_id then
    return pg_catalog.jsonb_build_object(
      'success', false,
      'error', 'Gateway payment ID is already associated with another order'
    );
  end if;

  -- 6. Lock and validate an existing order.

  select *
  into v_existing_payment
  from public.payments
  where order_id = v_order_id
  for update;

  if found then
    if v_existing_payment.student_id is distinct from p_student_id
       or v_existing_payment.course_id is distinct from v_course.id
       or v_existing_payment.amount_inr is distinct from p_amount_inr
       or v_existing_payment.provider is distinct from v_provider
       or v_existing_payment.currency is distinct from 'INR' then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'Existing order details do not match'
      );
    end if;

    if v_existing_payment.status = 'refunded' then
      return pg_catalog.jsonb_build_object(
        'success', false,
        'error', 'A refunded order cannot be captured again'
      );
    end if;

    -- 7. An identical captured payment is idempotent.
    if v_existing_payment.status = 'captured' then
      if v_existing_payment.provider_payment_id
         is distinct from v_payment_id_clean then
        return pg_catalog.jsonb_build_object(
          'success', false,
          'error', 'Order is already captured with a different payment ID'
        );
      end if;

      select id, expires_at
      into v_existing_enrollment
      from public.enrollments
      where student_id = p_student_id
        and course_id = v_course.id;

      if not found then
        return pg_catalog.jsonb_build_object(
          'success', false,
          'error', 'Payment is captured but enrollment is missing; reconciliation is required'
        );
      end if;

      return pg_catalog.jsonb_build_object(
        'success', true,
        'message', 'Payment already processed',
        'payment_id', v_existing_payment.id,
        'enrollment_id', v_existing_enrollment.id,
        'expires_at', v_existing_enrollment.expires_at
      );
    end if;
  end if;

  -- 8. Calculate the new expiry date.
  --    Extend a currently valid enrollment; otherwise start from now.

  select expires_at
  into v_existing_enrollment
  from public.enrollments
  where student_id = p_student_id
    and course_id = v_course.id
  for update;

  if found
     and v_existing_enrollment.expires_at is not null
     and v_existing_enrollment.expires_at > pg_catalog.now() then
    v_expiry := v_existing_enrollment.expires_at
                + pg_catalog.make_interval(days => v_course.validity_days);
  else
    v_expiry := pg_catalog.now()
                + pg_catalog.make_interval(days => v_course.validity_days);
  end if;

  -- 9. Insert or update the verified payment record.

  insert into public.payments (
    student_id,
    course_id,
    order_id,
    provider,
    amount_inr,
    currency,
    status,
    provider_payment_id,
    metadata
  )
  values (
    p_student_id,
    v_course.id,
    v_order_id,
    v_provider,
    p_amount_inr,
    'INR',
    'captured',
    v_payment_id_clean,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (order_id) do update set
    status = 'captured',
    provider_payment_id = excluded.provider_payment_id,
    metadata = public.payments.metadata || excluded.metadata,
    updated_at = pg_catalog.now()
  returning id into v_payment_id;

  -- 10. Create or extend the enrollment atomically.

  insert into public.enrollments (
    student_id,
    course_id,
    status,
    started_at,
    expires_at
  )
  values (
    p_student_id,
    v_course.id,
    'active',
    pg_catalog.now(),
    v_expiry
  )
  on conflict (student_id, course_id) do update set
    status = 'active',
    expires_at = excluded.expires_at,
    updated_at = pg_catalog.now()
  returning id into v_enrollment_id;

  -- 11. Return the result.

  return pg_catalog.jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'enrollment_id', v_enrollment_id,
    'expires_at', v_expiry
  );
end;
$$;


-- ============================================================================
-- PART 8: EXPLICIT PERMISSIONS
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Remove direct client access, including any default PUBLIC table grants.
revoke all privileges on table
  public.profiles,
  public.courses,
  public.enrollments,
  public.payments
from PUBLIC, anon, authenticated;

-- Public and logged-in users can read published courses (RLS still applies).
grant select on public.courses to anon, authenticated;

-- Logged-in users can read their own profile, enrollment, and payments.
grant select on public.profiles to authenticated;
grant select on public.enrollments to authenticated;
grant select on public.payments to authenticated;

-- Students may update only non-sensitive profile columns.
grant update (full_name, phone, state, avatar_url)
on public.profiles to authenticated;

-- ── Trigger functions: revoke direct execution from all roles. ────────────────
-- These functions are invoked automatically by Postgres triggers only.
-- No user, anon client, or service role should ever call them directly.
revoke all on function public.handle_new_user() from PUBLIC, anon, authenticated, service_role;
revoke all on function public.set_current_timestamp_updated_at() from PUBLIC, anon, authenticated, service_role;

-- rls_auto_enable is a Supabase-internal helper that landed in the public schema.
-- Revoke direct execution so it cannot be called via PostgREST.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke all on function public.rls_auto_enable() from PUBLIC, anon, authenticated, service_role;
  end if;
end;
$$;

-- ── Payment function: backend service_role only. ──────────────────────────────
revoke all on function public.complete_payment_and_enroll(
  uuid, text, text, text, text, integer, text, jsonb
) from PUBLIC, anon, authenticated;

grant execute on function public.complete_payment_and_enroll(
  uuid, text, text, text, text, integer, text, jsonb
) to service_role;

-- The backend service role needs table privileges for the payment workflow.
grant all privileges on table
  public.profiles,
  public.courses,
  public.enrollments,
  public.payments
to service_role;

-- ============================================================================
-- END OF FRESH SUPABASE SETUP
-- ============================================================================
