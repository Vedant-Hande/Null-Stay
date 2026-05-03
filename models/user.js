import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import { REGEX, ERROR_MESSAGES } from "../utils/constants.js";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, ERROR_MESSAGES.VALIDATION.EMAIL_REQUIRED],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      REGEX.EMAIL,
      ERROR_MESSAGES.VALIDATION.EMAIL_INVALID,
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

export default User;
