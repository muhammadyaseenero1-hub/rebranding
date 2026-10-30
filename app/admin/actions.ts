"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AdminActionResult, WatchInput } from "@/lib/admin-types";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getAdminSession } from "@/lib/supabase/admin-session";
import { supabaseFetch, supabaseHeaders } from "@/lib/supabase/http";
import { collections } from "@/lib/watches";

const accessCookie = "velmont_admin_access";
const refreshCookie = "velmont_admin_refresh";
const expiryCookie = "velmont_admin_expires";

export async function signInAdmin(
  _previous: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const config = getSupabaseConfig();
  if (!config) return { error: "Admin access is not configured yet. Add the Supabase URL and anon key to the server environment." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your administrator email and password." };

  try {
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    if (!response.ok) return { error: "The email or password could not be verified." };
    const session = await response.json();
    if (session.user?.app_metadata?.role !== "admin") {
      await fetch(`${config.url}/auth/v1/logout`, {
        method: "POST",
        headers: supabaseHeaders(session.access_token),
        cache: "no-store",
      });
      return { error: "This account does not have VELMONT administrator access." };
    }

    const jar = await cookies();
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    const maxAge = Math.max(60, Number(session.expires_in) || 3600);
    jar.set(accessCookie, session.access_token, { ...options, maxAge });
    jar.set(refreshCookie, session.refresh_token, { ...options, maxAge: 60 * 60 * 24 * 30 });
    jar.set(expiryCookie, String(Date.now() + maxAge * 1000), { ...options, maxAge });
  } catch {
    return { error: "Unable to reach Supabase. Check the project URL and try again." };
  }
  redirect("/admin");
}

export async function signOutAdmin() {
  const config = getSupabaseConfig();
  const jar = await cookies();
  const accessToken = jar.get(accessCookie)?.value;
  if (config && accessToken) {
    await fetch(`${config.url}/auth/v1/logout`, {
      method: "POST",
      headers: supabaseHeaders(accessToken),
      cache: "no-store",
    }).catch(() => undefined);
  }
  jar.delete(accessCookie);
  jar.delete(refreshCookie);
  jar.delete(expiryCookie);
  redirect("/admin/login");
}

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function validateWatch(input: WatchInput): string | null {
  const required: Array<[string, string, number]> = [
    ["Watch name", input.name, 120], ["Description", input.description, 3000],
    ["Movement type", input.movementType, 120], ["Case material", input.caseMaterial, 120],
    ["Dial colour", input.dialColour, 80], ["Strap material", input.strapMaterial, 120],
    ["Case size", input.caseSize, 40], ["Series note", input.edition, 100],
  ];
  for (const [label, value, max] of required) {
    if (!value?.trim()) return `${label} is required.`;
    if (value.trim().length > max) return `${label} must be ${max} characters or fewer.`;
  }
  const price = Number(input.price);
  if (!Number.isFinite(price) || price < 0 || price > 999999999) return "Enter a valid non-negative price.";
  if (!collections.some((item) => item.name === input.collection)) return "Choose a valid collection.";
  if (!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(input.referenceNumber.trim().toUpperCase())) return "Reference numbers must use 3–40 letters, numbers, or hyphens.";
  if (!Array.isArray(input.imagePaths) || input.imagePaths.length < 1 || input.imagePaths.length > 8) return "Add between one and eight watch images.";
  const config = getSupabaseConfig();
  const publicStoragePrefix = config ? `${config.url}/storage/v1/object/public/watch-images/` : "";
  if (input.imagePaths.some((path) => !/^watches\/[a-zA-Z0-9._-]+$/.test(path) && !path.startsWith("https://images.unsplash.com/") && !(publicStoragePrefix && path.startsWith(publicStoragePrefix)))) return "One or more image references are invalid.";
  if ((input.newImagePaths ?? []).some((path) => !/^watches\/[a-zA-Z0-9._-]+$/.test(path) || !input.imagePaths.includes(path))) return "One or more newly uploaded image references are invalid.";
  const specs = Object.entries(input.specifications ?? {});
  if (specs.length < 1 || specs.length > 20 || specs.some(([key, value]) => !key.trim() || key.length > 60 || !value.trim() || value.length > 200)) return "Add 1–20 valid specification pairs. Each label is limited to 60 characters and each value to 200.";
  return null;
}

async function deleteStorageImages(paths: string[], token: string) {
  const safePaths = paths.filter((path) => /^watches\/[a-zA-Z0-9._-]+$/.test(path));
  if (!safePaths.length) return;
  await fetch(`${getSupabaseConfig()!.url}/storage/v1/object/watch-images`, {
    method: "DELETE",
    headers: { ...supabaseHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: safePaths }),
    cache: "no-store",
  });
}

export async function saveWatch(input: WatchInput): Promise<AdminActionResult> {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Your admin session has expired. Sign in again." };
  const validationError = validateWatch(input);
  if (validationError) { await deleteStorageImages(input.newImagePaths ?? [], session.accessToken); return { success: false, error: validationError }; }

  const config = getSupabaseConfig();
  if (!config) return { success: false, error: "Supabase is not configured." };
  const payload = {
    slug: slugify(input.name),
    name: input.name.trim(),
    description: input.description.trim(),
    price: Number(input.price),
    collection: input.collection,
    specifications: input.specifications,
    movement_type: input.movementType.trim(),
    case_material: input.caseMaterial.trim(),
    dial_colour: input.dialColour.trim(),
    strap_material: input.strapMaterial.trim(),
    reference_number: input.referenceNumber.trim().toUpperCase(),
    case_size: input.caseSize.trim(),
    edition: input.edition.trim(),
    availability: Boolean(input.availability),
    images: input.imagePaths,
  };

  try {
    let oldImages: string[] = [];
    let oldSlug = "";
    let response: Response;
    const headers = { Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" };
    if (input.id) {
      if (!/^[0-9a-f-]{36}$/i.test(input.id)) return { success: false, error: "Invalid watch identifier." };
      const currentResponse = await fetch(`${config.url}/rest/v1/watches?id=eq.${encodeURIComponent(input.id)}&select=images,slug`, { headers: { ...supabaseHeaders(session.accessToken) }, cache: "no-store" });
      const current = currentResponse.ok ? await currentResponse.json() : [];
      oldImages = current[0]?.images ?? [];
      oldSlug = current[0]?.slug ?? "";
      response = await fetch(`${config.url}/rest/v1/watches?id=eq.${encodeURIComponent(input.id)}`, {
        method: "PATCH", headers: { ...headers, apikey: config.anonKey, Prefer: "return=representation" }, body: JSON.stringify(payload), cache: "no-store",
      });
    } else {
      response = await fetch(`${config.url}/rest/v1/watches`, {
        method: "POST", headers: { ...headers, apikey: config.anonKey, Prefer: "return=representation" }, body: JSON.stringify(payload), cache: "no-store",
      });
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body.code === "23505" ? "That name or reference number is already in use." : "Supabase could not save this watch. Check the database setup and try again.";
      await deleteStorageImages(input.newImagePaths ?? [], session.accessToken);
      return { success: false, error: message };
    }
    const saved = await response.json();
    if (input.id && !saved.length) {
      await deleteStorageImages(input.newImagePaths ?? [], session.accessToken);
      return { success: false, error: "This watch no longer exists. Refresh the catalogue and try again." };
    }
    const id = saved[0]?.id ?? input.id;
    await deleteStorageImages(oldImages.filter((path: string) => !input.imagePaths.includes(path)), session.accessToken);
    revalidatePath("/"); revalidatePath("/watches"); revalidatePath("/collections"); revalidatePath("/admin");
    if (oldSlug) revalidatePath(`/watches/${oldSlug}`);
    revalidatePath(`/watches/${payload.slug}`);
    return { success: true, id };
  } catch {
    await deleteStorageImages(input.newImagePaths ?? [], session.accessToken);
    return { success: false, error: "A network error prevented this watch from being saved." };
  }
}

export async function deleteWatch(id: string): Promise<AdminActionResult> {
  const session = await getAdminSession();
  if (!session) return { success: false, error: "Your admin session has expired. Sign in again." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { success: false, error: "Invalid watch identifier." };
  const config = getSupabaseConfig();
  if (!config) return { success: false, error: "Supabase is not configured." };
  try {
    const selected = await fetch(`${config.url}/rest/v1/watches?id=eq.${encodeURIComponent(id)}&select=images`, { headers: supabaseHeaders(session.accessToken), cache: "no-store" });
    const rows = selected.ok ? await selected.json() : [];
    const response = await fetch(`${config.url}/rest/v1/watches?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE", headers: { ...supabaseHeaders(session.accessToken), Prefer: "return=minimal" }, cache: "no-store",
    });
    if (!response.ok) return { success: false, error: "Supabase could not delete this watch." };
    await deleteStorageImages(rows[0]?.images ?? [], session.accessToken);
    revalidatePath("/"); revalidatePath("/watches"); revalidatePath("/collections"); revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "A network error prevented this watch from being deleted." };
  }
}
