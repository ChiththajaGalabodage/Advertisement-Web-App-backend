import mongoose from "mongoose";

const listingSchema = mongoose.Schema(
  {
    listingId: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    slug: { type: String, index: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "LKR" },
    image: [{ type: String }], // main image URL
    country: { type: String, required: true },
    category: { type: String, required: true }, // e.g., Vehicles, Electronics
    postedAgo: { type: String, default: "1 month ago" },
    featured: { type: Boolean, default: false },
    urgent: { type: Boolean, default: false },
    badge: { type: String }, // e.g., "NEW", "HOT", "DEAL"
  },
  { timestamps: true }
);

const Listing = mongoose.model("listings", listingSchema);
export default Listing;
