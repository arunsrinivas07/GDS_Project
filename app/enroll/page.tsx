"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  CreditCard,
  RefreshCw,
  BadgeAlert,
  User,
  Phone,
  MapPin,
  Mail,
  ArrowRight,
} from "lucide-react";
import { INDIAN_STATES } from "@/lib/indianStates";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";

export default function EnrollCheckoutPage() {
  const router = useRouter();
  const { user, loading, loginWithGoogle, setUserProfile } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedState, setSelectedState] = useState("Uttar Pradesh");

  // Step state: "signup" (Google auth) | "payment" (Buy Now)
  const [step, setStep] = useState<"signup" | "payment">("signup");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Auto-fill student data if already authenticated with Google
  useEffect(() => {
    if (user) {
      if (user.full_name) setFullName(user.full_name);
      if (user.phone) setPhone(user.phone);
      if (user.state) setSelectedState(user.state);
      setStep("payment");
    }
  }, [user]);

  // Initiate Google Sign-Up with redirect back to /enroll
  const handleGoogleSignUp = async () => {
    setErrorMessage("");
    setIsProcessing(true);
    const res = await loginWithGoogle("/enroll");
    if (!res.success) {
      setIsProcessing(false);
      setErrorMessage(res.error || "Unable to initiate Google Sign-Up.");
    }
  };

  // Buy Now Handler
  const handleBuyNow = async () => {
    setErrorMessage("");
    setIsProcessing(true);

    try {
      // 1. Get access token from Supabase session
      let accessToken = "";
      let currentUserId = user?.id || "";

      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || "";
        if (session?.user?.id) {
          currentUserId = session.user.id;
        }

        // Update additional student profile details (phone, state) if changed
        if (currentUserId) {
          await supabase.from("profiles").update({
            full_name: fullName.trim() || user?.full_name,
            phone: phone.trim(),
            state: selectedState,
          }).eq("id", currentUserId);
        }
      }

      if (!accessToken) {
        throw new Error("Your session could not be verified. Please sign in with Google again.");
      }

      // 2. Call activation API (activates enrollment in DB + sends Welcome email via Resend)
      const res = await fetch("/api/enroll/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete purchase.");
      }

      // 3. Directly verify or insert enrollment client-side as fallback if needed
      if (isSupabaseConfigured && supabase && currentUserId) {
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("slug", "gds-starter-pass")
          .maybeSingle();

        if (course?.id) {
          await supabase.from("enrollments").upsert({
            student_id: currentUserId,
            course_id: course.id,
            status: "active",
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "student_id,course_id" });
        }
      }

      // Update local auth context
      if (user) {
        setUserProfile({
          ...user,
          full_name: fullName.trim() || user.full_name,
          phone: phone.trim() || user.phone,
          state: selectedState,
          enrollment_status: "enrolled",
        });
      }

      setSuccessMessage("Course activated! A welcome email has been sent to your Gmail.");

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard?enrolled=true");
      }, 1200);
    } catch (err: any) {
      console.error("Buy now error:", err);
      setErrorMessage(err.message || "Failed to process enrollment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-warm">
      {/* Decorative background glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Breadcrumb / Back Link */}
        <div className="mb-6">
          <Link
            href="/#pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-red transition-colors"
          >
            ← Back to Course Plans
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100/80 text-brand-red mb-3">
            <Sparkles size={13} />
            Quick 1-Click Enrollment
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-charcoal tracking-tight">
            Complete Your GDS Admission
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            Sign up with Google to instantly secure your admission and unlock all lessons, notes, and tests.
          </p>
        </div>

        {/* Progress Stepper (2 Simple Steps) */}
        <div className="flex items-center justify-center max-w-xs mx-auto mb-10">
          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === "signup"
                ? "bg-brand-red text-white shadow-md shadow-red-500/30"
                : "bg-emerald-500 text-white"
                }`}
            >
              {step === "payment" ? "✓" : "1"}
            </span>
            <span className="text-xs font-bold text-charcoal">Sign Up</span>
          </div>

          <div
            className={`w-16 h-0.5 mx-3 transition-colors ${step === "payment" ? "bg-emerald-500" : "bg-gray-200"
              }`}
          />

          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === "payment"
                ? "bg-brand-red text-white shadow-md shadow-red-500/30"
                : "bg-gray-200 text-gray-500"
                }`}
            >
              2
            </span>
            <span
              className={`text-xs font-bold ${step === "payment" ? "text-charcoal" : "text-gray-400"
                }`}
            >
              Buy Now
            </span>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Box */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xl relative">
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-brand-red text-sm flex items-start gap-2.5 animate-scale-in">
                <BadgeAlert size={18} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5 animate-scale-in">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* STEP 1: GOOGLE SIGN UP */}
            {step === "signup" && !user && (
              <div className="space-y-6 text-center py-4">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-charcoal font-heading">
                    1. Create Student Account
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Sign up with your Google account to automatically link your email and proceed directly to course enrollment.
                  </p>
                </div>

                <div className="py-4">
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={isProcessing || loading}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-charcoal border-2 border-gray-200 hover:border-gray-300 font-bold text-base py-4 px-6 rounded-2xl transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-60 group"
                  >
                    {isProcessing ? (
                      <RefreshCw size={20} className="animate-spin text-brand-red" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>
                      {isProcessing ? "Connecting with Google..." : "Sign Up with Google"}
                    </span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>No password or OTP verification required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Instant access to Buy Now page after sign-up</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Automatic welcome email sent to your Gmail inbox</span>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Already enrolled?{" "}
                    <Link href="/login" className="text-brand-red font-bold hover:underline">
                      Sign In here
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: BUY NOW PAGE (Shown once signed in with Google) */}
            {(step === "payment" || user) && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Google Account Connected
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-charcoal font-heading">
                    2. Confirm Details & Buy Now
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Clicking <strong>Buy Now</strong> will activate your enrollment for 1 year and send a welcome email to your Gmail.
                  </p>
                </div>

                {/* Student Details Summary / Optional Phone & State */}
                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/80 space-y-4">
                  <div className="flex items-center justify-between text-sm pb-3 border-b border-gray-200/60">
                    <span className="text-gray-500 text-xs font-medium">Logged in as</span>
                    <span className="font-bold text-charcoal flex items-center gap-1.5">
                      <Mail size={14} className="text-brand-red" />
                      {user?.email || "Google Account"}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Student Name"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:border-brand-red focus:ring-1 focus:ring-red-500/20 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 Mobile Number"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:border-brand-red focus:ring-1 focus:ring-red-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      State
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:border-brand-red focus:ring-1 focus:ring-red-500/20 outline-none cursor-pointer"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Payment Mode
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Instant Access Mode
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 border-2 border-brand-red rounded-xl bg-red-50/40 text-center cursor-pointer">
                      <span className="block text-xs font-bold text-brand-red">UPI / Direct</span>
                      <span className="text-[10px] text-gray-500">Auto Active</span>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-xl bg-white text-center opacity-70">
                      <span className="block text-xs font-bold text-charcoal">Card</span>
                      <span className="text-[10px] text-gray-500">Debit / Credit</span>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-xl bg-white text-center opacity-70">
                      <span className="block text-xs font-bold text-charcoal">NetBanking</span>
                      <span className="text-[10px] text-gray-500">All Banks</span>
                    </div>
                  </div>
                </div>

                {/* BUY NOW BUTTON */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-brand-red to-brand-accent hover:from-brand-red-dark hover:to-brand-red text-white font-black text-lg py-4 px-6 rounded-2xl transition-all shadow-xl shadow-red-500/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Activating & Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      <span>Buy Now — ₹999</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  🔒 256-Bit SSL Encrypted • 7-Day Money-Back Guarantee
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-lg">
              <h3 className="font-heading font-extrabold text-xl text-charcoal mb-4 pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-charcoal text-base">GDS Starter Pass</h4>
                  <p className="text-xs text-gray-500">Full 2026 GDS Syllabus Course</p>
                </div>
                <div className="text-right">
                  <span className="font-heading font-extrabold text-xl text-charcoal">₹999</span>
                  <span className="block text-xs text-gray-400 line-through">₹1,999</span>
                </div>
              </div>

              {/* What's included checklist */}
              <div className="space-y-2.5 py-4 border-y border-gray-100 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>180+ HD Video Lessons (Maths, English, GK, Postal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>200+ Full-Length Exam Mock Tests</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Chapter-wise PDF Notes & Formula Sheets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>5-Year Solved Question Papers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Verified Course Completion Certificate</span>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 pt-4 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Course MRP</span>
                  <span className="line-through">₹1,999</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Special Launch Discount (50% OFF)</span>
                  <span>- ₹1,000</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-charcoal pt-2 border-t border-gray-100">
                  <span>Total Payable</span>
                  <span className="text-brand-red text-xl">₹999</span>
                </div>
              </div>

              <div className="mt-6 p-3.5 bg-red-50/60 rounded-xl border border-red-100 flex items-center gap-3">
                <ShieldCheck size={24} className="text-brand-red shrink-0" />
                <p className="text-[11px] text-gray-600 leading-tight">
                  <strong className="text-charcoal block">100% Risk-Free Guarantee</strong>
                  If not satisfied with the course, get a complete refund within 7 days.
                </p>
              </div>
            </div>

            {/* Supabase Status Pill */}
            <div className="p-4 rounded-2xl bg-white/70 border border-gray-200/60 text-xs text-gray-500 flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                />
                Backend Database:
              </span>
              <span className="font-mono font-semibold text-charcoal">
                {isSupabaseConfigured ? "Supabase Connected" : "Local Mock Active"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
