import cloudinary from "../config/cloudinary.js";
import { uploadToCloudinary } from "./uploadToCloudinary.js";

const isCloudinaryPublicId = (id) =>
  typeof id === "string" && id.length > 0 && !id.startsWith("listingimage");

export async function uploadFilesToCloudinary(files = []) {
  if (!files.length) return [];

  const uploads = files.map((file) =>
    uploadToCloudinary(file.buffer).then((result) => ({
      url: result.secure_url,
      filename: result.public_id,
    })),
  );

  return Promise.all(uploads);
}

export async function destroyCloudinaryImages(publicIds = []) {
  await Promise.all(publicIds.map((id) => destroyCloudinaryImage(id)));
}

export async function destroyCloudinaryImage(publicId) {
  if (!isCloudinaryPublicId(publicId)) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // ignore missing assets from seed data
  }
}

export async function destroyListingImages(listing) {
  if (!listing) return;
  const galleryIds = (listing.images || []).map((img) => img.filename);
  await Promise.all([
    destroyCloudinaryImage(listing.image?.filename),
    destroyCloudinaryImages(galleryIds),
  ]);
}

export function normalizeRemoveIds(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
