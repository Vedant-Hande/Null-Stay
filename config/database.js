import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("DB connected");
  } catch (err) {
    console.log("DB connection failed", err);
  }
};
export default connectDB;
