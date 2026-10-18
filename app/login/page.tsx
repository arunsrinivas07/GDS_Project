"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  BadgeAlert,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/authContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");
  const nextUrl = searchParams.get("next") || "/dashboard";

  const { loginWithGoogle, user, loading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError || "");

  useEffect(() => {
    if (initialError) {
      setErrorMessage(decodeURIComponent(initialError));
    }
  }, [initialError]);

  // If already logged in, redirect to dashboard or nextUrl
  useEffect(() => {
    if (!loading && user) {
      router.push(nextUrl);
    }
  }, [user, loading, router, nextUrl]);

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setIsLoading(true);
    const res = await loginWithGoogle(nextUrl);
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
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-gray-200/90 shadow-xl text-center">
          {/* Header */}
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100/80 text-brand-red mb-3">
              <Sparkles size={13} />
              Student Portal
            </span>
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-gray-500 mt-2 text-xs sm:text-sm max-w-xs mx-auto">
              Fast, secure one-click sign in with your Google account.
            </p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-brand-red text-xs flex items-start gap-2.5 text-left animate-scale-in">
              <BadgeAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-charcoal border-2 border-gray-200 hover:border-gray-300 font-bold text-sm py-3.5 px-4 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-60 mb-6 group"
          >
            {isLoading ? (
              <RefreshCw size={18} className="animate-spin text-brand-red" />
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
            <span>{isLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Benefits */}
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Instant access without passwords or OTP codes</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Direct access to video classes, PDF notes & mock tests</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Google 2-Factor Authentication secured</span>
            </div>
          </div>

          {/* Bottom link */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              New student?{" "}
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-warm" />}>
      <LoginContent />
    </Suspense>
  );
}

