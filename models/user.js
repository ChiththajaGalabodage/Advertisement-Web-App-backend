import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: "customer",
    },

    isBlocked: {
      type: Boolean,
      required: true,
      default: false,
    },
    img: {
      type: String,
      required: false,
      default: "https://avatar.iran.liara.run/public/boy?username=Ash",
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  },
);

const User = mongoose.model("users", userSchema);

export default User;
