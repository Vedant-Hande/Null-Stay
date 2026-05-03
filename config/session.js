import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const store = MongoStore.create({
  mongoUrl: process.env.DB_URL,
  crypto: {
    secret: process.env.SESSION_SECRET,
  },
  touchAfter: 3 * 24 * 60 * 60, // 3 days in seconds
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

export default store;
