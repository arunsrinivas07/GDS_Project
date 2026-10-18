"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  state: string;
  enrollment_status: string;
  plan_name: string;
  amount_paid: number;
}

interface AuthContextType {
  user: StudentProfile | null;
  loading: boolean;
  loginWithPassword: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  sendEmailOtp: (
    email: string
  ) => Promise<{ success: boolean; error?: string; demoCode?: string }>;
  verifyEmailOtp: (
    email: string,
    token: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (nextPath?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUserProfile: (profile: StudentProfile) => void;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithPassword: async () => ({ success: false }),
  sendEmailOtp: async () => ({ success: false }),
  verifyEmailOtp: async () => ({ success: false }),
  loginWithGoogle: async () => ({ success: false }),
  logout: async () => {},
  setUserProfile: () => {},
  isConfigured: false,
});

const LOCAL_STORAGE_KEY = "dop_student_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile & enrollment helper
  const syncUserData = async (authUser: any) => {
    if (!authUser || !supabase) return null;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("status, courses(title, price_inr)")
        .eq("student_id", authUser.id)
        .eq("status", "active")
        .maybeSingle();

      const courseInfo: any = enrollment?.courses;

      const student: StudentProfile = {
        id: authUser.id,
        full_name:
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "GDS Aspirant",
        email: authUser.email || profile?.email || "",
        phone: profile?.phone || authUser.user_metadata?.phone || "",
        state: profile?.state || authUser.user_metadata?.state || "Uttar Pradesh",
        enrollment_status: enrollment ? "enrolled" : "unregistered",
        plan_name: courseInfo?.title || "GDS Starter Pass (₹999)",
        amount_paid: courseInfo?.price_inr || 999,
      };

      setUser(student);
      return student;
    } catch (e) {
      console.warn("syncUserData exception:", e);
      return null;
    }
  };

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await syncUserData(session.user);
          }

          // Listen for live auth events (e.g. Google OAuth redirect, OTP verify)
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
              if (currentSession?.user) {
                await syncUserData(currentSession.user);
              } else if (event === "SIGNED_OUT") {
                setUser(null);
                try {
                  localStorage.removeItem(LOCAL_STORAGE_KEY);
                } catch {}
              }
            }
          );

          setLoading(false);
          return () => {
            authListener?.subscription.unsubscribe();
          };
        } catch (err) {
          console.warn("Supabase auth check error:", err);
        }
      } else {
        // Local demo fallback check
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (stored) {
            setUser(JSON.parse(stored));
          }
        } catch (e) {
          console.warn("Failed to load local session", e);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  // 1. Password Login
  const loginWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const cleanEmail = email.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          await syncUserData(data.user);
          setLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || "Failed to sign in" };
      }
    }

    // Demo mode fallback
    const demoStudent: StudentProfile = {
      id: "demo-student-id",
      full_name: cleanEmail.split("@")[0].toUpperCase() || "Aspirant",
      email: cleanEmail,
      phone: "+91 98765 43210",
      state: "Uttar Pradesh",
      enrollment_status: "enrolled",
      plan_name: "GDS Starter Pass (₹999)",
      amount_paid: 999,
    };
    setUser(demoStudent);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoStudent));
    } catch {}
    setLoading(false);
    return { success: true };
  };

  // 2. Email OTP Sign In / Send
  const sendEmailOtp = async (email: string) => {
    const cleanEmail = email.trim();
    if (isSupabaseConfigured && supabase) {
      try {
        // Do NOT pass emailRedirectTo — this prevents the OTP email from
        // containing a magic link. Only the 6-digit code is sent.
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Failed to send OTP" };
      }
    }

    // Demo fallback: generate a test OTP code
    const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
    return { success: true, demoCode };
  };

  // 3. Verify Email OTP
  const verifyEmailOtp = async (email: string, token: string) => {
    setLoading(true);
    const cleanEmail = email.trim();
    const cleanToken = token.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "email",
        });

        if (error) {
          // Attempt signup type if email type failed
          const fallback = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: "signup",
          });

          if (fallback.error) {
            setLoading(false);
            return { success: false, error: error.message };
          }
          if (fallback.data.user) {
            await syncUserData(fallback.data.user);
            setLoading(false);
            return { success: true };
          }
        }

        if (data.user) {
          await syncUserData(data.user);
          setLoading(false);
          return { success: true };
        }

        setLoading(false);
        return { success: false, error: "Verification failed. Please try again." };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || "Invalid OTP verification" };
      }
    }

    // Supabase is not configured — cannot verify OTP without a real backend.
    // Do NOT auto-login the user here.
    setLoading(false);
    return {
      success: false,
      error: "Authentication service is not configured. Please contact the administrator.",
    };
  };

  // 4. Google OAuth Sign In
  const loginWithGoogle = async (nextPath = "/dashboard") => {
    if (isSupabaseConfigured && supabase) {
      try {
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Google Sign-In failed" };
      }
    }

    // Demo fallback Google profile
    const demoStudent: StudentProfile = {
      id: "demo-google-student",
      full_name: "Google Aspirant",
      email: "student@gmail.com",
      phone: "+91 98765 43210",
      state: "Uttar Pradesh",
      enrollment_status: "enrolled",
      plan_name: "GDS Starter Pass (₹999)",
      amount_paid: 999,
    };
    setUser(demoStudent);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoStudent));
    } catch {}
    return { success: true };
  };

  // Logout
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  };

  const setUserProfile = (profile: StudentProfile) => {
    setUser(profile);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithPassword,
        sendEmailOtp,
        verifyEmailOtp,
        loginWithGoogle,
        logout,
        setUserProfile,
        isConfigured: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
