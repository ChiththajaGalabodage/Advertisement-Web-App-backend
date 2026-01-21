import Listing from "../models/listing.js";
import { isAdmin } from "./userController.js";

// 🔹 Create a new listing (requires JWT token)
export async function createListing(req, res) {
  try {
    // Check if user is authenticated (JWT token validated by middleware)
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please login to create a listing.",
      });
    }

    // Validate required fields
    const { title, description, price, category, country, image } = req.body;
    if (!title || !description || !price || !category || !country) {
      return res.status(400).json({
        message: "Title, description, price, category, and country are required",
      });
    }

    // Generate listing ID
    let listingId = "LST00001";
    const lastListing = await Listing.findOne().sort({ _id: -1 });

    if (lastListing && lastListing.listingId) {
      const lastListingNumber = parseInt(lastListing.listingId.replace("LST", ""));
      const newListingNumber = lastListingNumber + 1;
      const newListingNumberString = String(newListingNumber).padStart(5, "0");
      listingId = "LST" + newListingNumberString;
    }

    // Create new listing with user reference
    const newListing = new Listing({
      listingId,
      title,
      description,
      price,
      category,
      country,
      image: image || [], // Accept string or array of image URLs from Supabase
      userRef: req.user.id, // Associate listing with authenticated user
      featured: false,
      urgent: req.body.urgent || false,
      badge: req.body.badge || null,
      currency: req.body.currency || "LKR",
      postedAgo: "just now",
    });

    await newListing.save();

    res.status(201).json({
      message: "Listing created successfully",
      listing: {
        _id: newListing._id,
        listingId: newListing.listingId,
        title: newListing.title,
        price: newListing.price,
        category: newListing.category,
        image: newListing.image,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create listing",
      error: error.message,
    });
  }
}

// 🔹 Get all listings (Admins see all, normal users see only available ones)
export async function getListings(req, res) {
  try {
    if (isAdmin(req)) {
      const listings = await Listing.find();
      res.json(listings);
    } else {
      const listings = await Listing.find({ featured: true }); // example filter for users
      res.json(listings);
    }
  } catch (err) {
    res.json({
      message: "Failed to get listings",
      error: err,
    });
  }
}

// GET all listings (with a filter)

// 🔹 Save a new listing
// 🔹 Save a new listing (all users allowed)

export async function saveListing(req, res) {
  try {
    let listingId = "LST00001";

    // Find the latest listing by _id (MongoDB ObjectId increases with time)
    const lastListing = await Listing.findOne().sort({ _id: -1 });

    if (lastListing) {
      const lastListingId = lastListing.listingId; // e.g., "LST00551"
      const lastListingNumber = parseInt(lastListingId.replace("LST", "")); // 551
      const newListingNumber = lastListingNumber + 1;
      const newListingNumberString = String(newListingNumber).padStart(5, "0");
      listingId = "LST" + newListingNumberString; // e.g., "LST00552"
    }

    // Create new listing
    const listing = new Listing({
      ...req.body,
      listingId,
    });

    await listing.save();

    res.json({
      message: "Listing added successfully",
      listingId: listingId,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Error adding listing",
      error: e.message,
    });
  }
}

// 🔹 Delete a listing
// 🔹 Delete a listing (admin or owner)
export async function deleteListing(req, res) {
  const slug = req.params.slug;

  try {
    const listing = await Listing.findOne({ slug: slug });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if user is admin or owner
    if (!isAdmin(req) && listing.userId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to delete this listing",
      });
    }

    await Listing.deleteOne({ slug: slug });

    res.json({
      message: "Listing deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete listing",
      error: err,
    });
  }
}

// 🔹 Update a listing
export async function updateListing(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "You are not authorized to update a listing",
    });
    return;
  }

  const slug = req.params.slug;
  const updatingData = req.body;

  try {
    await Listing.updateOne({ slug: slug }, updatingData);

    res.json({
      message: "Listing updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
}

// 🔹 Get a single listing by slug
export async function getListingBySlug(req, res) {
  try {
    const listing = await Listing.findOne({ listingId: req.params.listingId });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
}

// 🔹 Search listings by title, category, or badge
export async function searchListings(req, res) {
  const searchQuery = req.params.query;
  try {
    const listings = await Listing.find({
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { category: { $regex: searchQuery, $options: "i" } },
        { badge: { $regex: searchQuery, $options: "i" } },
      ],
      featured: true, // show only featured/available for users
    }).populate(
      // 2. Chain .populate() to the find() query
      "userRef", // The field in the Listing model to populate
      "username email profilePicture phoneNumber" // The specific fields from the User model to include
    );
    res.json(listings);
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
}
