import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

const ACCESS = "velmont_admin_access";
const REFRESH = "velmont_admin_refresh";
const EXPIRES = "velmont_admin_expires";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/admin/login") return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH)?.value;
  const expiresAt = Number(request.cookies.get(EXPIRES)?.value ?? 0);
  if (!refreshToken || expiresAt > Date.now() + 60_000) return NextResponse.next();

  const config = getSupabaseConfig();
  if (!config) return NextResponse.next();

  try {
    const refreshResponse = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!refreshResponse.ok) {
      const response = path.startsWith("/api/")
        ? NextResponse.json({ error: "Admin session expired." }, { status: 401 })
        : NextResponse.redirect(new URL("/admin/login", request.url));
      [ACCESS, REFRESH, EXPIRES].forEach((name) => response.cookies.delete(name));
      return response;
    }

    const session = await refreshResponse.json();
    const maxAge = Math.max(60, Number(session.expires_in) || 3600);
    request.cookies.set(ACCESS, session.access_token);
    request.cookies.set(REFRESH, session.refresh_token);
    request.cookies.set(EXPIRES, String(Date.now() + maxAge * 1000));
    const response = NextResponse.next({ request });
    const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
    response.cookies.set(ACCESS, session.access_token, { ...options, maxAge });
    response.cookies.set(REFRESH, session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set(EXPIRES, String(Date.now() + maxAge * 1000), { ...options, maxAge });
    return response;
  } catch {
    return NextResponse.next();
  }
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
