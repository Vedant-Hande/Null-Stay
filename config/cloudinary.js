import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "../.env") });
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// console.log("[Cloudinary config]", {
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY ? "***set***" : "MISSING",
//   api_secret: process.env.CLOUDINARY_API_SECRET ? "***set***" : "MISSING",
// });

export default cloudinary;