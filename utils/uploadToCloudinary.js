import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

export function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "null-stay/listings",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          console.error("[uploadToCloudinary] error:", error);
          return reject(error);
        }
        resolve(result);
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}
