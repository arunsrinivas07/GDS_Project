# DOP Study Academi — GDS Exam Preparation Platform

Modern web application for India Post Gramin Dak Sevak (GDS) exam preparation, featuring secure video learning, protected PDF study notes, student progress tracking, enrollment workflows, and authentication.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL, Auth with Google OAuth & OTP)
- **Video Delivery**: Bunny Stream (token-authenticated signed iframe embeds)
- **PDF & Notes Storage**: Bunny CDN / Storage (signed secure delivery)
- **Emails**: Resend (Transactional Welcome Email on enrollment)
- **Icons**: Lucide React

---

## 🚀 Key Features

1. **Course Study & Video Portal (`/learn/[slug]`)**:
   - Clean, light-mode interface matching the student dashboard.
   - **Collapsible Course Curriculum Sidebar**: Show/Hide curriculum toggle.
   - **Continue Watching**: Remembers playback position across sessions and resumes automatically.
   - **Interactive Lesson Checkboxes**: Students can mark individual lessons as completed or incomplete.
   - **Lesson & Notes Search**: Filter lessons by title, video, or PDF notes.
   - **Protected PDF Notes Viewer**: View chapter notes directly inside the portal without raw file exposure.

2. **Student Dashboard (`/dashboard`)**:
   - Active student status, circular progress statistics, and study metrics.
   - Enrolled curriculum overview with direct "Resume Lesson" quick action.
   - Clean top navigation bar with user profile details, direct **Sign Out**, and **My Lessons** buttons.

3. **Enrollment & Checkout (`/enroll`)**:
   - Single-click Google Sign-Up and state selection for all 28 states & 8 UTs.
   - Seamless account activation and instant confirmation email via Resend.

4. **Authentication (`/login`, `/auth/callback`)**:
   - Google OAuth with multi-environment redirect handling (works seamlessly across localhost and production deployments like Vercel).

---

## 📦 Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Optional site origin (e.g. `http://localhost:3000` or production domain) |
| `BUNNY_STREAM_LIBRARY_ID` | Bunny Stream Library ID |
| `BUNNY_STREAM_SIGNING_KEY` | Token authentication signing key for video embeds |
| `BUNNY_CDN_BASE_URL` | Base URL for Bunny CDN / Storage (e.g. `https://dop-study.b-cdn.net/`) |
| `BUNNY_CDN_SIGNING_KEY` | Optional token auth signing key for PDF URLs |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `RESEND_FROM_EMAIL` | Sender address (e.g. `onboarding@resend.dev`) |

### 3. Database Migration
Run the SQL scripts in your Supabase SQL Editor:
1. `supabase-schema.sql`: Core schema (profiles, courses, enrollments, payments).
2. `supabase-lessons-migration.sql`: Lessons table, progress tracking RLS policies, and course chapter seeds (Chapters 1–6).

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Production Deployment

When deploying to Vercel or any hosting provider:
1. Add environment variables in your hosting dashboard.
2. In Supabase Dashboard &rarr; **Authentication** &rarr; **URL Configuration**:
   - Set **Site URL** to your production domain: `https://your-domain.com`
   - Add both redirect URIs under **Redirect URLs**:
     - `http://localhost:3000/**` (for local development)
     - `https://your-domain.com/**` (for production)
