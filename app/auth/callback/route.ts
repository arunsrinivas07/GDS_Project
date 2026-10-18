import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (supabaseUrl && supabaseAnonKey) {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if cookie store already sent
          }
        },
      },
    });

    if (code) {
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(new URL(next, request.url));
        }
        console.error("Auth callback code exchange error:", error.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
        );
      } catch (err: any) {
        console.error("Auth callback exception:", err);
      }
    }

    if (token_hash && type) {
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });
        if (!error) {
          return NextResponse.redirect(new URL(next, request.url));
        }
        console.error("Auth callback token_hash verify error:", error.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
        );
      } catch (err: any) {
        console.error("Auth callback token_hash exception:", err);
      }
    }
  }

  // Redirect to dashboard or designated next path
  return NextResponse.redirect(new URL(next, request.url));
}


