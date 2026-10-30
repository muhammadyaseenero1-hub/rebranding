import { watches, type Watch } from "@/lib/watches";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { storagePublicUrl, supabaseFetch } from "@/lib/supabase/http";

type WatchRow = {
  id: string;
  slug: string;
  name: string;
  collection: string;
  price: number | string;
  description: string;
  images: string[] | null;
  specifications: Record<string, string> | null;
  movement_type: string;
  case_material: string;
  dial_colour: string;
  strap_material: string;
  reference_number: string;
  case_size: string;
  edition: string;
  availability: boolean;
};

function formatPrice(value: number | string) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 ? 2 : 0,
  }).format(amount);
}

export function mapWatchRow(row: WatchRow): Watch {
  const imagePaths = Array.isArray(row.images) ? row.images : [];
  const images = imagePaths.map(storagePublicUrl);
  const caseMaterial = row.case_material ?? "";
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    collection: row.collection,
    price: formatPrice(row.price),
    description: row.description,
    image: images[0] ?? "",
    images,
    imagePaths,
    material: caseMaterial,
    caseMaterial,
    movement: row.movement_type,
    movementType: row.movement_type,
    dialColour: row.dial_colour,
    strapMaterial: row.strap_material,
    referenceNumber: row.reference_number,
    size: row.case_size,
    edition: row.edition,
    availability: row.availability,
    specifications: row.specifications ?? {},
  };
}

export async function getWatches(): Promise<Watch[]> {
  if (!getSupabaseConfig()) return watches;
  try {
    const response = await supabaseFetch(
      "/rest/v1/watches?select=*&order=created_at.desc",
    );
    if (!response.ok) return watches;
    const rows = (await response.json()) as WatchRow[];
    return rows.map(mapWatchRow);
  } catch {
    return watches;
  }
}

export async function getWatchBySlug(slug: string) {
  const items = await getWatches();
  return items.find((watch) => watch.slug === slug) ?? null;
}

export async function getAdminWatches(accessToken: string): Promise<Watch[]> {
  const response = await supabaseFetch(
    "/rest/v1/watches?select=*&order=created_at.desc",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) throw new Error("Could not load watches from Supabase.");
  const rows = (await response.json()) as WatchRow[];
  return rows.map(mapWatchRow);
}
