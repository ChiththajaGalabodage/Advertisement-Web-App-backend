import mongoose from "mongoose";

const listingSchema = mongoose.Schema(
  {
    listingId: { type: String, required: true }, // e.g., "LST00551"
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    slug: { type: String, index: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "LKR" },
    category: {
      type: String,
      required: true,
      enum: [
        "Vehicles",
        "Hobbies",
        "Home & Living",
        "Business & Industry",
        "Property",
        "Women's Fashion & Beauty",
        "Men's Fashion & Grooming",
        "Essentials",
        "Education",
      ],
    },
    image: {
      type: [String], // Array of image URLs from Supabase
      default: [],
    },
    country: { type: String, required: true },
    postedAgo: { type: String, default: "1 month ago" },
    featured: { type: Boolean, default: false },
    urgent: { type: Boolean, default: false },
    badge: { type: String }, // e.g., "NEW", "HOT", "DEAL"
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
  },
  { timestamps: true }
);

const Listing = mongoose.model("listings", listingSchema);
export default Listing;
