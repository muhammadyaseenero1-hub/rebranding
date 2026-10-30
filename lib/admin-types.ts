export type WatchInput = {
  id?: string;
  name: string;
  description: string;
  price: string;
  collection: string;
  movementType: string;
  caseMaterial: string;
  dialColour: string;
  strapMaterial: string;
  referenceNumber: string;
  caseSize: string;
  edition: string;
  availability: boolean;
  specifications: Record<string, string>;
  imagePaths: string[];
  newImagePaths?: string[];
};

export type AdminActionResult =
  | { success: true; id?: string }
  | { success: false; error: string };
