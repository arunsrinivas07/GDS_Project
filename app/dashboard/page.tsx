"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  PenTool,
  BarChart3,
  Award,
  LogOut,
  PlayCircle,
  FileCheck2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justEnrolled = searchParams.get("enrolled") === "true";

  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "tests" | "profile">("overview");

  useEffect(() => {
    if (!loading && !user && !justEnrolled) {
      // If user isn't logged in, redirect to login
      // but in demo, allow viewing fallback
    }
  }, [user, loading, justEnrolled]);

  const studentName = user?.full_name || "Rahul Sharma";
  const studentEmail = user?.email || "rahul.sharma@example.com";
  const studentPhone = user?.phone || "+91 98765 43210";
  const studentState = user?.state || "Uttar Pradesh";
  const planName = user?.plan_name || "GDS Starter Pass (₹999)";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const modules = [
    {
      title: "Mathematics & Numerical Ability",
      lessons: 24,
      completed: 12,
      duration: "18h 40m",
      progress: 50,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "General Knowledge & Current Affairs",
      lessons: 18,
      completed: 14,
      duration: "12h 15m",
      progress: 78,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "English & Hindi Language Skills",
      lessons: 15,
      completed: 8,
      duration: "9h 30m",
      progress: 53,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Postal Knowledge & Office Rules",
      lessons: 20,
      completed: 16,
      duration: "14h 50m",
      progress: 80,
      color: "from-red-500 to-rose-600",
    },
  ];

  const recentMockTests = [
    { name: "Full Length Mock #14 (2026 Pattern)", score: "88/100", date: "Yesterday", status: "Passed" },
    { name: "Postal Department Rules Revision Test", score: "94/100", date: "3 days ago", status: "Passed" },
    { name: "Maths Speed & Accuracy Sprint #8", score: "76/100", date: "5 days ago", status: "Passed" },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-warm">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner Alert for Fresh Enrollment */}
        {justEnrolled && (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">
                  Enrollment Successful! Welcome to DOP Study Academi.
                </h4>
                <p className="text-xs sm:text-sm text-emerald-700">
                  Your student account has been registered. You now have full lifetime access.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-200/60 px-3 py-1.5 rounded-xl self-start sm:self-center">
              Account Active
            </span>
          </div>
        )}

        {/* Dashboard Header Bar */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-red text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-red-500/30 shrink-0">
              {studentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-charcoal tracking-tight">
                  Welcome back, {studentName}!
                </h1>
                <span className="hidden sm:inline-block text-xs font-bold text-brand-red bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                  Active Student
                </span>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                GDS Aspirant • {studentState} Postal Circle • {planName}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Overall Progress
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 size={15} />
              </div>
            </div>
            <p className="font-heading text-2xl sm:text-3xl font-black text-charcoal">68%</p>
            <p className="text-xs text-gray-500 mt-1">50 of 77 Lessons Done</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Study Streak
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
                <TrendingUp size={15} />
              </div>
            </div>
            <p className="font-heading text-2xl sm:text-3xl font-black text-charcoal">14 Days</p>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Top 5% among peers</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Mock Average
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PenTool size={15} />
              </div>
            </div>
            <p className="font-heading text-2xl sm:text-3xl font-black text-charcoal">86.4%</p>
            <p className="text-xs text-gray-500 mt-1">12 Full Tests Taken</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Study Hours
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={15} />
              </div>
            </div>
            <p className="font-heading text-2xl sm:text-3xl font-black text-charcoal">54.5 hrs</p>
            <p className="text-xs text-gray-500 mt-1">Target: 80 hrs for exam</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Course Modules */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading font-extrabold text-xl text-charcoal">
                    Your Enrolled Curriculum
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Continue learning from where you left off.
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-red hover:underline cursor-pointer">
                  View Syllabus PDF
                </span>
              </div>

              <div className="space-y-4">
                {modules.map((mod) => (
                  <div
                    key={mod.title}
                    className="p-5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-white transition-all card-hover"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-charcoal">
                          {mod.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {mod.completed} of {mod.lessons} lessons • {mod.duration} total
                        </p>
                      </div>
                      <Link
                        href="/learn/gds-chapter-1-introduction"
                        className="self-start sm:self-center bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <PlayCircle size={14} />
                        <span>Resume Lesson</span>
                      </Link>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-red h-full rounded-full transition-all duration-500"
                        style={{ width: `${mod.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Mock Tests */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading font-extrabold text-xl text-charcoal">
                    Recent Mock Test Performances
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Latest attempts under official 2026 GDS exam conditions.
                  </p>
                </div>
                <button className="text-xs font-bold bg-brand-red text-white px-3.5 py-2 rounded-xl hover:bg-brand-red-dark transition-colors cursor-pointer">
                  Start New Test
                </button>
              </div>

              <div className="space-y-3">
                {recentMockTests.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/40 text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-bold text-charcoal">{t.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{t.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-heading font-black text-brand-red text-base">
                        {t.score}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Student Profile & Circle Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs">
              <h3 className="font-heading font-extrabold text-lg text-charcoal mb-4 pb-3 border-b border-gray-100">
                Registered Profile Details
              </h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-400 text-xs block mb-1">Student Name</span>
                  <div className="flex items-center gap-2 font-bold text-charcoal">
                    <span>{studentName}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 text-xs block mb-1">Email ID</span>
                  <div className="flex items-center gap-2 text-charcoal font-medium">
                    <Mail size={14} className="text-gray-400" />
                    <span>{studentEmail}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 text-xs block mb-1">WhatsApp / Phone</span>
                  <div className="flex items-center gap-2 text-charcoal font-medium">
                    <Phone size={14} className="text-gray-400" />
                    <span>{studentPhone}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 text-xs block mb-1">Postal Circle (State)</span>
                  <div className="flex items-center gap-2 text-charcoal font-medium">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{studentState}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 text-xs block mb-1">Subscription Plan</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-red">{planName}</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-md">
                      Lifetime
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-warm" />}>
      <DashboardContent />
    </Suspense>
  );
}
