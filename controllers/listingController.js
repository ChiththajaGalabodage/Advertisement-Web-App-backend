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
        message:
          "Title, description, price, category, and country are required",
      });
    }

    // Generate listing ID
    let listingId = "LST00001";
    const lastListing = await Listing.findOne().sort({ _id: -1 });

    if (lastListing && lastListing.listingId) {
      const lastListingNumber = parseInt(
        lastListing.listingId.replace("LST", ""),
      );
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

// 🔹 Get all listings (ordered by creation date - newest first)
export async function getListings(req, res) {
  try {
    // Fetch all listings, sorted by creation date (newest first)
    const listings = await Listing.find()
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .populate("userRef", "firstName lastName email img") // Include user details
      .exec();

    res.status(200).json({
      message: "Listings fetched successfully",
      count: listings.length,
      listings: listings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch listings",
      error: err.message,
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

// 🔹 Get a single listing by MongoDB ID
export async function getListingById(req, res) {
  try {
    const { id } = req.params;

    // Validate if id is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid listing ID format",
      });
    }

    const listing = await Listing.findById(id).populate(
      "userRef",
      "firstName lastName email img",
    );

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    res.status(200).json({
      message: "Listing retrieved successfully",
      listing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to retrieve listing",
      error: err.message,
    });
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
      "username email profilePicture phoneNumber", // The specific fields from the User model to include
    );
    res.json(listings);
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
}

// 🔹 Delete a listing by admin (requires JWT token and admin role)
export async function deleteListingByAdmin(req, res) {
  try {
    // Check if user is authenticated (JWT token validated by middleware)
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please login to delete a listing.",
      });
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden. Only admins can delete listings.",
      });
    }

    const listingId = req.params.id;

    // Validate listing ID format
    if (!listingId) {
      return res.status(400).json({
        message: "Listing ID is required",
      });
    }

    // Find and delete the listing
    const listing = await Listing.findByIdAndDelete(listingId);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    res.status(200).json({
      message: "Listing deleted successfully",
      deletedListing: {
        _id: listing._id,
        listingId: listing.listingId,
        title: listing.title,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to delete listing",
      error: error.message,
    });
  }
}

// 🔹 Update a listing by owner (requires JWT token and ownership verification)
export async function updateListingByOwner(req, res) {
  try {
    // Check if user is authenticated (JWT token validated by middleware)
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please login to update a listing.",
      });
    }

    const { id } = req.params;

    // Validate if id is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid listing ID format",
      });
    }

    // Find the listing
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    // Verify ownership - check if the authenticated user is the listing owner
    if (listing.userRef.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to update this listing",
      });
    }

    // Define updatable fields (prevent userRef and listingId changes)
    const updatableFields = [
      "title",
      "description",
      "price",
      "category",
      "country",
      "image",
      "urgent",
      "badge",
      "currency",
      "featured",
    ];

    const updateData = {};
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Validate required fields if they're being updated
    if (
      (updateData.title && !updateData.title.trim()) ||
      (updateData.description && !updateData.description.trim()) ||
      (updateData.price && updateData.price <= 0) ||
      (updateData.category && !updateData.category.trim())
    ) {
      return res.status(400).json({
        message: "Invalid field values provided",
      });
    }

    // Update the listing
    const updatedListing = await Listing.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    }).populate("userRef", "firstName lastName email img");

    res.status(200).json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update listing",
      error: error.message,
    });
  }
}
