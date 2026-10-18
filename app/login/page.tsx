"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  RefreshCw,
  BadgeAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { evaluatePassword } from "@/lib/passwordRules";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const { loginWithPassword, sendEmailOtp, verifyEmailOtp, loginWithGoogle } = useAuth();
  const nextUrl = searchParams.get("next") || "/learn/gds-chapter-1-introduction";

  // Mode: "password" | "otp"
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [demoOtpDisplay, setDemoOtpDisplay] = useState<string | null>(null);

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError || "");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordEvaluation = evaluatePassword(password);

  useEffect(() => {
    if (initialError) {
      setErrorMessage(decodeURIComponent(initialError));
    }
  }, [initialError]);

  // Handle Password Sign-In
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!passwordEvaluation.isValid) {
      setErrorMessage("Password must satisfy all security requirements (minimum 8 characters, numbers, uppercase, lowercase, and special character).");
      return;
    }

    setIsLoading(true);
    const res = await loginWithPassword(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      router.push(nextUrl);
    } else {
      setErrorMessage(res.error || "Invalid email or password. Please try again.");
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    const res = await sendEmailOtp(email.trim());
    setIsLoading(false);

    if (res.success) {
      setOtpSent(true);
      setSuccessMessage(`A login email has been sent to ${email}. You can click the link in your email to sign in instantly, or enter the 6-digit code below.`);
      if (res.demoCode) {
        setDemoOtpDisplay(res.demoCode);
      }
    } else {
      setErrorMessage(res.error || "Failed to send verification code. Please try again.");
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (otpCode.trim().length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    const res = await verifyEmailOtp(email.trim(), otpCode.trim());
    setIsLoading(false);

    if (res.success) {
      router.push(nextUrl);
    } else {
      setErrorMessage(res.error || "Invalid verification code. Please try again.");
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setIsLoading(true);
    const res = await loginWithGoogle();
    if (!res.success) {
      setIsLoading(false);
      setErrorMessage(res.error || "Unable to initiate Google sign in.");
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-warm flex items-center justify-center">
      {/* Background soft glows */}
      <div className="absolute top-20 left-1/4 w-[450px] h-[450px] bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-200/90 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100/80 text-brand-red mb-3">
              <Sparkles size={13} />
              Student Portal
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-gray-500 mt-1.5 text-xs sm:text-sm">
              Use your Email OTP, Password, or connected Google Account.
            </p>
          </div>

          {/* Social Sign In (Google) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-charcoal border border-gray-200 hover:border-gray-300 font-semibold text-sm py-3 px-4 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-60 mb-5"
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
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Or with email
            </span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          {/* Toggle Tab: Password vs Email OTP */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === "password"
                  ? "bg-white text-charcoal shadow-xs"
                  : "text-gray-500 hover:text-charcoal"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === "otp"
                  ? "bg-white text-charcoal shadow-xs"
                  : "text-gray-500 hover:text-charcoal"
              }`}
            >
              Email OTP
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-brand-red text-xs flex items-start gap-2.5 animate-scale-in">
              <BadgeAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-scale-in">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {demoOtpDisplay && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <span className="font-semibold block mb-0.5">Test Verification OTP:</span>
              <span className="font-mono text-base font-bold text-brand-red tracking-widest">
                {demoOtpDisplay}
              </span>
            </div>
          )}

          {/* MODE 1: PASSWORD LOGIN */}
          {authMode === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    required
                    placeholder="e.g. aspirant@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setSuccessMessage("Switched to Email OTP. You can sign in passwordless!");
                    }}
                    className="text-xs text-brand-red hover:underline font-semibold cursor-pointer"
                  >
                    Forgot / Login with OTP?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white"
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
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-1.5 text-xs animate-fade-in-up">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: EMAIL OTP LOGIN */}
          {authMode === "otp" && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="email"
                        required
                        placeholder="e.g. aspirant@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none text-sm transition-all text-charcoal bg-gray-50/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Sending 6-Digit Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Login OTP</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in-up">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Enter 6-Digit Code *
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-brand-red hover:underline font-semibold cursor-pointer"
                      >
                        Change Email
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 582194"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full text-center text-2xl font-mono font-bold tracking-widest py-2.5 rounded-xl border border-gray-200 focus:border-brand-red focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-charcoal bg-gray-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Bottom link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              New to DOP Study Academi?{" "}
              <Link href="/enroll" className="text-brand-red font-bold hover:underline">
                Enroll Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
