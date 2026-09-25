import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Only load .env file in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "../.env") });
}

const mongoUrl =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI
    : process.env.DB_URL;

if (!mongoUrl) {
  throw new Error(
    `MongoDB URL missing! Set ${
      process.env.NODE_ENV === "production" ? "MONGODB_URI" : "DB_URL"
    } in environment variables.`,
  );
}

const store = MongoStore.create({
  mongoUrl: mongoUrl,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
  touchAfter: 3 * 24 * 60 * 60, // 3 days in seconds
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

export default store;
