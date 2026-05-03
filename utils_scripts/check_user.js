import mongoose from "mongoose";
import connectDB from "../config/database.js";

const User = mongoose.model("User", new mongoose.Schema({ username: String }));

async function checkUser() {
  await connectDB();
  const user = await User.findById("69f7203cc1d74f9aa260b16a");
  if (!user) {
    console.log("No user found with ID 69f7203cc1d74f9aa260b16a");
    const allUsers = await User.find({});
    console.log("All available users:", allUsers.map(u => ({ id: u._id, username: u.username })));
  } else {
    console.log("User found:", user);
  }
  process.exit();
}

checkUser();
