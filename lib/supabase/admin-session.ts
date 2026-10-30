import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { supabaseHeaders } from "@/lib/supabase/http";

export type AdminSession = {
  accessToken: string;
  user: { id: string; email?: string; app_metadata?: Record<string, unknown> };
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const config = getSupabaseConfig();
  if (!config) return null;
  const jar = await cookies();
  const accessToken = jar.get("velmont_admin_access")?.value;
  if (!accessToken) return null;

  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {
      headers: supabaseHeaders(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as AdminSession["user"];
    if (user.app_metadata?.role !== "admin") return null;
    return { accessToken, user };
  } catch {
    return null;
  }
}
