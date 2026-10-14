import type {
  ReferenceImage,
  QuotationRequestPolicy,
} from "../types/quotation";
import { isRecord, isUUID } from "../utils/quotation";
const types = ["image/jpeg", "image/png", "image/webp"] as const;
export function validateReferenceMetadata(
  value: unknown,
  policy: QuotationRequestPolicy,
): asserts value is ReferenceImage {
  if (
    !isRecord(value) ||
    !isUUID(value.id) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 160 ||
    !types.includes(value.type as (typeof types)[number]) ||
    !(value.blob instanceof Blob) ||
    !Number.isSafeInteger(value.size) ||
    (value.size as number) <= 0 ||
    (value.size as number) > policy.maximumImageBytes ||
    value.blob.size !== value.size ||
    value.blob.type !== value.type
  )
    throw new Error(
      `Choose a JPEG, PNG or WebP image within the ${policy.maximumImageBytes / 1024 / 1024} MB size limit.`,
    );
  const extensions = {
    "image/jpeg": /\.jpe?g$/i,
    "image/png": /\.png$/i,
    "image/webp": /\.webp$/i,
  };
  if (!extensions[value.type as (typeof types)[number]].test(value.name))
    throw new Error(
      "Choose a JPEG, PNG or WebP file with a matching file extension.",
    );
}
export async function validateReferenceContents(
  image: ReferenceImage,
  policy: QuotationRequestPolicy,
): Promise<void> {
  validateReferenceMetadata(image, policy);
  const header = new Uint8Array(await image.blob.slice(0, 12).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (byte, index) => header[index] === byte,
  );
  const jpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...header.slice(start, end));
  const webp = ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (
    !(image.type === "image/png"
      ? png
      : image.type === "image/jpeg"
        ? jpeg
        : webp)
  )
    throw new Error(
      `${image.name}: the file contents do not match a supported image. Choose a different image.`,
    );
}
export function validateReferenceCollection(
  images: ReferenceImage[],
  policy: QuotationRequestPolicy,
) {
  if (
    !Array.isArray(images) ||
    images.length > policy.maximumImages ||
    new Set(images.map((image) => image.id)).size !== images.length
  )
    throw new Error(
      `Attach up to ${policy.maximumImages} different reference images.`,
    );
  images.forEach((image) => validateReferenceMetadata(image, policy));
  if (
    images.reduce((sum, image) => sum + image.size, 0) >
    policy.maximumTotalImageBytes
  )
    throw new Error(
      `Reference images must total no more than ${policy.maximumTotalImageBytes / 1024 / 1024} MB.`,
    );
}
export async function makeReferenceImage(
  file: File,
  policy: QuotationRequestPolicy,
): Promise<ReferenceImage> {
  if (!types.includes(file.type as (typeof types)[number]))
    throw new Error("Choose a JPEG, PNG or WebP image.");
  if (!file.size || file.size > policy.maximumImageBytes)
    throw new Error(
      `${file.name}: choose an image up to ${policy.maximumImageBytes / 1024 / 1024} MB.`,
    );
  const image: ReferenceImage = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type as ReferenceImage["type"],
    size: file.size,
    blob: file.slice(0, file.size, file.type),
  };
  await validateReferenceContents(image, policy);
  return image;
}
export async function verifyImageDecodes(blob: Blob): Promise<void> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    bitmap.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error(
            "This image could not be opened. Try another JPEG, PNG or WebP image.",
          ),
        );
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
