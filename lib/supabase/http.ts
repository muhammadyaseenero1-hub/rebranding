import { getSupabaseConfig } from "@/lib/supabase/config";

export function supabaseHeaders(accessToken?: string) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${accessToken ?? config.anonKey}`,
  };
}

export async function supabaseFetch(path: string, init: RequestInit = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  return fetch(`${config.url}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...supabaseHeaders(),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
}

export function storagePublicUrl(path: string) {
  const config = getSupabaseConfig();
  if (!config || /^https?:\/\//i.test(path)) return path;
  return `${config.url}/storage/v1/object/public/watch-images/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
