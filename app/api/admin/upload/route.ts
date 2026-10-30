import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-session";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { storagePublicUrl, supabaseHeaders } from "@/lib/supabase/http";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Cross-origin upload rejected." }, { status: 403 });
  }
  const session = await getAdminSession();
  const config = getSupabaseConfig();
  if (!session || !config) return NextResponse.json({ error: "Administrator authentication required." }, { status: 401 });

  let formData: FormData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "The image upload could not be read." }, { status: 400 }); }
  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length || files.length > 8) return NextResponse.json({ error: "Choose between one and eight images." }, { status: 400 });
  if (files.some((file) => !allowedTypes[file.type] || file.size > 20 * 1024 * 1024)) {
    return NextResponse.json({ error: "Use JPG, PNG or WebP images under 20 MB each." }, { status: 400 });
  }

  const uploaded: string[] = [];
  for (const file of files) {
    const path = `watches/${crypto.randomUUID()}.${allowedTypes[file.type]}`;
    const response = await fetch(`${config.url}/storage/v1/object/watch-images/${path}`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(session.accessToken),
        "Content-Type": file.type,
        "x-upsert": "false",
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: await file.arrayBuffer(),
      cache: "no-store",
    });
    if (!response.ok) {
      if (uploaded.length) {
        await fetch(`${config.url}/storage/v1/object/watch-images`, {
          method: "DELETE",
          headers: { ...supabaseHeaders(session.accessToken), "Content-Type": "application/json" },
          body: JSON.stringify({ prefixes: uploaded }),
          cache: "no-store",
        }).catch(() => undefined);
      }
      return NextResponse.json({ error: "Supabase Storage could not save an image. Check the bucket setup and try again." }, { status: 502 });
    }
    uploaded.push(path);
  }
  return NextResponse.json({ images: uploaded.map((path) => ({ path, url: storagePublicUrl(path) })) });
}
