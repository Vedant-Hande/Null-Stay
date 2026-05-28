import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

export function uploadToCloudinary(buffer) {
  console.log("[uploadToCloudinary] buffer size:", buffer?.length);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "null-stay/listings" },
      (error, result) => {
        if (error) {
          console.error("[uploadToCloudinary] error:", error);
          return reject(error);
        }
        console.log("[uploadToCloudinary] success:", {
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
        resolve(result);
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}