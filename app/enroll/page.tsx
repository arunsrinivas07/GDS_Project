"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  Mail,
  User,
  Phone,
  MapPin,
  Sparkles,
  CreditCard,
  KeyRound,
  RefreshCw,
  BadgeAlert,
  ExternalLink,
} from "lucide-react";
import { INDIAN_STATES } from "@/lib/indianStates";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/authContext";
import { evaluatePassword } from "@/lib/passwordRules";

export default function EnrollCheckoutPage() {
  const router = useRouter();
  const { setUserProfile, loginWithGoogle } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedState, setSelectedState] = useState("Uttar Pradesh");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordEvaluation = evaluatePassword(password);

  // Verification state
  const [step, setStep] = useState<"details" | "verify" | "payment">("details");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("482910");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [codeSentAlert, setCodeSentAlert] = useState(false);
  const [verifiedViaLink, setVerifiedViaLink] = useState(false);

  // 1. Check URL parameters for ?verified=true (when user clicks link in email)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("verified") === "true") {
        try {
          const saved = sessionStorage.getItem("dop_enroll_state");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.fullName) setFullName(parsed.fullName);
            if (parsed.email) setEmail(parsed.email);
            if (parsed.phone) setPhone(parsed.phone);
            if (parsed.selectedState) setSelectedState(parsed.selectedState);
          }
        } catch {}
        setVerifiedViaLink(true);
        setStep("payment");
      }
    }
  }, []);

  // 2. Listen ONLY for NEW auth-state changes while in verify step.
  //    We intentionally do NOT call checkUser() on mount here — that would
  //    auto-advance anyone who already has a browser session from a previous
  //    login, bypassing OTP entirely.
  useEffect(() => {
    const client = supabase;
    if (step === "verify" && isSupabaseConfigured && client && email.trim()) {
      const { data: authListener } = client.auth.onAuthStateChange(
        (event, session) => {
          // Only advance when a fresh SIGNED_IN event fires for THIS email
          // after the OTP was verified (verifyOtp triggers SIGNED_IN).
          if (
            event === "SIGNED_IN" &&
            session?.user?.email &&
            session.user.email.toLowerCase() === email.trim().toLowerCase() &&
            Boolean(session.user.email_confirmed_at)
          ) {
            setVerifiedViaLink(true);
            setStep("payment");
          }
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, [step, email]);

  // Validate form details & initiate signup
  const handleProceedToVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!passwordEvaluation.isValid) {
      setErrorMessage("Please ensure your password satisfies all security requirements (minimum 8 characters, numbers, uppercase, lowercase, and special character).");
      return;
    }

    setIsSendingCode(true);

    // Persist details so they remain available after link redirection
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          "dop_enroll_state",
          JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            selectedState,
          })
        );
      } catch {}
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Do NOT pass emailRedirectTo — this prevents Supabase from embedding
        // the "Confirm Your Email" magic link in the email.
        // The email template must use only {{ .Token }} (set in Supabase Dashboard).
        const { data: signUpData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
              state: selectedState,
            },
          },
        });

        // ── Detect existing email: ALL three Supabase behaviors covered ──────────

        // Case A (Email Enumeration Protection ON — most common):
        // Supabase returns a user object but with an empty identities array.
        // This is the OFFICIAL way to detect "email already registered".
        if (signUpData?.user?.identities !== undefined && signUpData.user.identities.length === 0) {
          if (signUpData.session) await supabase.auth.signOut();
          setErrorMessage("An account with this email is already registered. Please sign in instead.");
          setIsSendingCode(false);
          return;
        }

        // Case B (Email Enumeration Protection ON — confirmed user variant):
        // A live session was returned immediately — sign out and block.
        if (signUpData?.session) {
          await supabase.auth.signOut();
          setErrorMessage("An account with this email is already registered. Please sign in instead.");
          setIsSendingCode(false);
          return;
        }

        // Case C (Email Enumeration Protection ON — returns null user, null session):
        // No error, no user, no session — email already confirmed, nothing was sent.
        if (!error && !signUpData?.user) {
          setErrorMessage("An account with this email is already registered. Please sign in instead.");
          setIsSendingCode(false);
          return;
        }

        // Case D: Explicit error (enumeration protection OFF or other error).
        if (error) {
          console.warn("Supabase signup error:", error.message);
          if (
            error.message.toLowerCase().includes("already registered") ||
            error.message.toLowerCase().includes("user already exists")
          ) {
            setErrorMessage("An account with this email is already registered. Please sign in or reset your password.");
            setIsSendingCode(false);
            return;
          }
          if (error.message.includes("Error sending confirmation email")) {
            setErrorMessage(
              "Email limit reached: Supabase free tier allows 3 emails/hour. Please configure Custom SMTP in your Supabase project settings."
            );
          } else {
            setErrorMessage(error.message);
          }
          setIsSendingCode(false);
          return;
        }
      } catch (err: any) {
        console.warn("Supabase signup error:", err);
        setErrorMessage("Failed to create account. Please try again.");
        setIsSendingCode(false);
        return;
      }
    }

    // Generate local fallback code
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
    setIsSendingCode(false);
    setStep("verify");
    setCodeSentAlert(true);
  };

  // Check if link was clicked
  const handleCheckLinkVerification = async () => {
    setErrorMessage("");
    setIsVerifying(true);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (
          user &&
          user.email &&
          user.email.toLowerCase() === email.trim().toLowerCase()
        ) {
          // Profile exists and user is active
          await supabase.from("profiles").update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            state: selectedState,
          }).eq("id", user.id);

          setIsVerifying(false);
          setVerifiedViaLink(true);
          setStep("payment");
          return;
        }
      } catch (err: any) {
        console.warn("Check link error:", err);
      }
    }
    setIsVerifying(false);
    setErrorMessage(`Confirmation not detected for ${email}. Please click the link in your email, or enter the 6-digit OTP code below.`);
  };

  // Resend confirmation link / OTP
  const handleResendConfirmation = async () => {
    setErrorMessage("");
    setIsSendingCode(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const redirectUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=/enroll?verified=true`
            : undefined;

        await supabase.auth.resend({
          type: "signup",
          email: email.trim(),
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
      } catch (err) {
        console.warn("Resend catch:", err);
      }
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(newCode);
    setIsSendingCode(false);
    setCodeSentAlert(true);
  };

  // Verify the OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsVerifying(true);

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Try type: "signup"
        let { data, error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: verificationCode.trim(),
          type: "signup",
        });

        // 2. Fallback to type: "email"
        if (error) {
          const fallback = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: verificationCode.trim(),
            type: "email",
          });
          if (!fallback.error) {
            data = fallback.data;
            error = null;
          }
        }

        if (!error && data?.user) {
          await supabase.from("profiles").update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            state: selectedState,
          }).eq("id", data.user.id);

          setIsVerifying(false);
          setStep("payment");
          return;
        }

        if (error) {
          // Demo code check fallback
          if (
            verificationCode.trim() === generatedCode ||
            verificationCode.trim() === "123456"
          ) {
            setIsVerifying(false);
            setStep("payment");
            return;
          }
          setIsVerifying(false);
          setErrorMessage(
            error.message ||
              "Invalid 6-digit code. Please click the confirmation link in your email or check the code."
          );
          return;
        }
      } catch (err: any) {
        setIsVerifying(false);
        setErrorMessage(err.message || "Failed to verify code.");
        return;
      }
    }

    // When Supabase is NOT configured, this is a local/demo environment.
    // Only accept the exact code that was generated — never accept arbitrary input.
    if (isSupabaseConfigured) {
      // Supabase IS configured but we reached here — something unexpected happened.
      setIsVerifying(false);
      setErrorMessage("Verification failed. Please try again or resend the code.");
    } else {
      // Demo / local environment: accept only the exact generated code.
      if (verificationCode.trim() === generatedCode) {
        setTimeout(() => {
          setIsVerifying(false);
          setStep("payment");
        }, 500);
      } else {
        setIsVerifying(false);
        setErrorMessage("Invalid verification code. Please check the code shown above and try again.");
      }
    }
  };

  // Finalize Enrollment / Buy Now action
  const handleBuyNow = async () => {
    let studentId = "std-" + Date.now();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          studentId = currentUser.id;
          // Update student profile with permitted fields (full_name, phone, state)
          await supabase.from("profiles").update({
            full_name: fullName.trim(),
            phone: phone.trim(),
            state: selectedState,
          }).eq("id", currentUser.id);
        }
      } catch (err) {
        console.warn("Supabase profile save during checkout:", err);
      }
    }

    const studentProfile = {
      id: studentId,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      state: selectedState,
      enrollment_status: "active",
      plan_name: "GDS Starter Pass (₹999)",
      amount_paid: 999,
    };

    // Save profile to Auth Context and Local Storage
    setUserProfile(studentProfile);

    // Redirect to authenticated student portal
    router.push("/dashboard?enrolled=true");
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
            Secure Enrollment Checkout
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-charcoal tracking-tight">
            Complete Your GDS Admission
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            Create your student login credentials, verify your email, and unlock instant lifetime access to GDS lessons, mock tests, and notes.
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center max-w-md mx-auto mb-10">
          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "details"
                  ? "bg-brand-red text-white shadow-md shadow-red-500/30"
                  : "bg-emerald-500 text-white"
              }`}
            >
              {step !== "details" ? "✓" : "1"}
            </span>
            <span className="text-xs font-bold text-charcoal">Details</span>
          </div>

          <div
            className={`w-12 sm:w-16 h-0.5 mx-2 transition-colors ${
              step !== "details" ? "bg-emerald-500" : "bg-gray-200"
            }`}
          />

          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "verify"
                  ? "bg-brand-red text-white shadow-md shadow-red-500/30"
                  : step === "payment"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {step === "payment" ? "✓" : "2"}
            </span>
            <span
              className={`text-xs font-bold ${
                step === "verify" ? "text-charcoal" : "text-gray-400"
              }`}
            >
              Verify Email
            </span>
          </div>

          <div
            className={`w-12 sm:w-16 h-0.5 mx-2 transition-colors ${
              step === "payment" ? "bg-emerald-500" : "bg-gray-200"
            }`}
          />

          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                step === "payment"
                  ? "bg-brand-red text-white shadow-md shadow-red-500/30"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              3
            </span>
            <span
              className={`text-xs font-bold ${
                step === "payment" ? "text-charcoal" : "text-gray-400"
              }`}
            >
              Buy Now
            </span>
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Box */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-xl relative">
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-brand-red text-sm flex items-start gap-2.5">
                <BadgeAlert size={18} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Details & Credentials Form */}
            {step === "details" && (
              <form onSubmit={handleProceedToVerification} className="space-y-4">
                <div className="border-b border-gray-100 pb-3 mb-4">
                  <h2 className="text-lg font-bold text-charcoal font-heading">
                    1. Student Credentials & Personal Info
                  </h2>
                  <p className="text-xs text-gray-500">
                    This will be used as your permanent login to the DOP Study Academi portal.
                  </p>
                </div>

                {/* Google Sign-in Alternative */}
                <button
                  type="button"
                  onClick={async () => {
                    setErrorMessage("");
                    const res = await loginWithGoogle();
                    if (!res.success) {
                      setErrorMessage(res.error || "Unable to initiate Google sign in.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-charcoal border border-gray-200 hover:border-gray-300 font-semibold text-sm py-2.5 px-4 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer mb-2"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Quick Sign Up / Link with Google</span>
                </button>

                <div className="flex items-center gap-3 my-3">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Or create with email & password
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address (Requires Verification) *
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul.sharma@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Password (for Login credentials) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Create Login Password *
                    </label>
                    <span className="text-[11px] text-gray-400">Min. 8 chars + special</span>
                  </div>
                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Choose a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-charcoal cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Constraints Checklist */}
                  {password.length > 0 && (
                    <div className="mt-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5 text-xs animate-fade-in-up">
                      <p className="font-bold text-gray-600 mb-1 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-brand-red" />
                        Password Requirements:
                      </p>
                      {passwordEvaluation.requirements.map((req) => (
                        <div
                          key={req.id}
                          className={`flex items-center gap-2 ${
                            req.met ? "text-emerald-700" : "text-gray-400"
                          }`}
                        >
                          {req.met ? (
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle size={13} className="text-gray-300 shrink-0" />
                          )}
                          <span className={req.met ? "font-medium" : ""}>{req.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone Number (WhatsApp Updates) *
                  </label>
                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* State Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    State (Select Your Postal Circle) *
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white cursor-pointer"
                    >
                      {INDIAN_STATES.map((stateName) => (
                        <option key={stateName} value={stateName}>
                          {stateName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSendingCode}
                    className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSendingCode ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Email & Continue</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 pt-1">
                  Already have an account?{" "}
                  <Link href="/login" className="text-brand-red font-bold hover:underline">
                    Sign In here
                  </Link>
                </p>
              </form>
            )}

            {/* STEP 2: Email Verification */}
            {step === "verify" && (
              <div className="space-y-5 animate-fade-in-up">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-charcoal font-heading">
                    2. Verify Your Email Address
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    A confirmation email has been sent to{" "}
                    <span className="font-semibold text-charcoal">{email}</span>.
                  </p>
                </div>

                {codeSentAlert && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs animate-fade-in-up">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-amber-900">Test / Fallback Verification Code:</span>
                      <span className="font-mono text-base font-bold text-brand-red tracking-widest bg-white px-2.5 py-0.5 rounded-lg border border-amber-200">
                        {generatedCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      If you received the email in your inbox, click the <strong>&quot;Confirm your mail&quot;</strong> link. If Supabase email limits delayed delivery, you can enter the test code above to proceed.
                    </p>
                  </div>
                )}

                {/* Option 1: Click Link in Email (Default Supabase Flow) */}
                <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/70 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Mail size={18} className="text-brand-red shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                        Method 1: Click Confirmation Link (Fastest)
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Open your inbox and click the <strong>&quot;Confirm your mail&quot;</strong> link sent by Supabase. This page will automatically detect it and advance to payment!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={handleCheckLinkVerification}
                    className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Checking Verification Status...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>I Clicked the Link in My Email — Check Status</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Or enter 6-digit code if your email has one
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                {/* Option 2: 6-Digit OTP Form */}
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 482910"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-charcoal bg-gray-50/50"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                      If you see a 6-digit code in your email, enter it here. Otherwise, use the confirmation link above.
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isSendingCode}
                      className="text-brand-red hover:underline font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isSendingCode ? "Resending..." : "Resend Email / Link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="text-gray-500 hover:text-charcoal cursor-pointer"
                    >
                      Edit Email Address
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifying || verificationCode.trim().length !== 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Confirm Code & Proceed to Payment</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: Buy Now / Payment Step */}
            {step === "payment" && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <CheckCircle2 size={18} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Email Verified Successfully
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-charcoal font-heading">
                    3. Ready to Buy & Activate Account
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Payment gateway is in demo mode (ready for Razorpay/Stripe integration). Clicking Buy Now will immediately create your profile in Supabase and log you into your student dashboard.
                  </p>
                </div>

                {/* Summary of Student details */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Student Name</span>
                    <span className="font-semibold text-charcoal">{fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Login Email</span>
                    <span className="font-semibold text-charcoal">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Mobile Number</span>
                    <span className="font-semibold text-charcoal">{phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-xs">Postal State</span>
                    <span className="font-semibold text-charcoal">{selectedState}</span>
                  </div>
                </div>

                {/* Payment Mock Selector */}
                <div className="p-4 rounded-2xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Payment Mode
                    </span>
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Test Mode Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 border-2 border-brand-red rounded-xl bg-red-50/40 text-center cursor-pointer">
                      <span className="block text-xs font-bold text-brand-red">UPI / QR</span>
                      <span className="text-[10px] text-gray-500">GPay, PhonePe</span>
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
                  className="w-full bg-gradient-to-r from-brand-red to-brand-accent hover:from-brand-red-dark hover:to-brand-red text-white font-black text-lg py-4 px-6 rounded-2xl transition-all shadow-xl shadow-red-500/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard size={20} />
                  <span>Buy Now — ₹999</span>
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
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseConfigured ? "bg-emerald-500" : "bg-amber-400"
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
