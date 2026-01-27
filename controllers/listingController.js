import Listing from "../models/listing.js";

// 🔹 Create a new listing (requires registered user - JWT token)
export async function createListing(req, res) {
  try {
    // Check if user is authenticated (registered user)
    if (!req.user) {
      console.error("❌ User not authenticated - req.user is undefined");
      return res.status(401).json({
        message: "Unauthorized. Please login to create a listing.",
        error: "No authentication token provided or token is invalid",
      });
    }

    // Extract and validate user ID
    const userId = req.user._id || req.user.id;
    if (!userId) {
      console.error("❌ User ID missing from token:", req.user);
      return res.status(400).json({
        message: "Invalid authentication data",
        error: "User ID not found in token",
      });
    }

    console.log("✅ User authenticated:", {
      id: userId,
      email: req.user.email,
    });

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
      userRef: userId, // Explicitly assign authenticated user ID to userRef
      featured: false,
      urgent: req.body.urgent || false,
      badge: req.body.badge || null,
      currency: req.body.currency || "LKR",
      postedAgo: "just now",
    });

    console.log("📝 Listing object created with userRef:", newListing.userRef);

    await newListing.save();

    console.log("✅ Listing saved successfully:", newListing._id);

    res.status(201).json({
      message: "Listing created successfully",
      listing: {
        _id: newListing._id,
        listingId: newListing.listingId,
        title: newListing.title,
        price: newListing.price,
        category: newListing.category,
        image: newListing.image,
        userRef: newListing.userRef,
      },
    });
  } catch (error) {
    console.error("❌ Error creating listing:", error);
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
      .populate("userRef", "firstName lastName email phoneNumber img") // Include user details, exclude password
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
// 🔹 Delete a listing (logged-in user - owner only)
export async function deleteListing(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please login to delete a listing.",
      });
    }

    const { productId } = req.params;

    // Find the listing
    const listing = await Listing.findById(productId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check if user is the owner
    if (listing.userRef.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to delete this listing",
      });
    }

    await Listing.findByIdAndDelete(productId);

    res.status(200).json({
      message: "Listing deleted successfully",
      deletedListing: {
        _id: listing._id,
        listingId: listing.listingId,
        title: listing.title,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to delete listing",
      error: err.message,
    });
  }
}

// 🔹 Update a listing (logged-in user - owner only)
export async function updateListing(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please login to update a listing.",
      });
    }

    const { productId } = req.params;

    // Validate if id is a valid MongoDB ObjectId
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid listing ID format",
      });
    }

    // Find the listing
    const listing = await Listing.findById(productId);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    // Check if user is the owner
    if (listing.userRef.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to update this listing",
      });
    }

    // Define updatable fields
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
    const updatedListing = await Listing.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true },
    ).populate("userRef", "firstName lastName email phoneNumber img");

    res.status(200).json({
      message: "Listing updated successfully",
      listing: updatedListing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to update listing",
      error: err.message,
    });
  }
}

// 🔹 Get a single listing by slug
export async function getListingBySlug(req, res) {
  try {
    const listing = await Listing.findOne({
      listingId: req.params.listingId,
    }).populate("userRef", "firstName lastName email phoneNumber img");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json({
      message: "Listing retrieved successfully",
      listing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
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

    const listing = await Listing.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true },
    ).populate("userRef", "firstName lastName email phoneNumber img");

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

// 🔹 Search listings by title, description, category, or price range
export async function searchListings(req, res) {
  try {
    const searchQuery = req.params.query || "";
    const { category, minPrice, maxPrice } = req.query;

    // Build search filter
    let filter = {};

    // Search by query in title and description
    if (searchQuery.trim()) {
      filter.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
        { category: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Filter by category if provided
    if (category && category.trim()) {
      filter.category = { $regex: category, $options: "i" };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = parseInt(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = parseInt(maxPrice);
      }
    }

    // Execute query with population
    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate("userRef", "firstName lastName email phoneNumber img")
      .exec();

    // Return response
    res.status(200).json({
      message: "Search results fetched successfully",
      count: listings.length,
      listings: listings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
}

// 🔹 Delete a listing (logged-in user - owner only)
export async function deleteListingByAdmin(req, res) {
  try {
    // Check if user is authenticated (JWT token validated by middleware)
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please login to delete a listing.",
      });
    }

    const listingId = req.params.id;

    // Validate listing ID format
    if (!listingId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid listing ID format",
      });
    }

    // Find the listing
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found",
      });
    }

    // Check if user is the owner
    if (listing.userRef.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You are not authorized to delete this listing",
      });
    }

    // Find and delete the listing
    await Listing.findByIdAndDelete(listingId);

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
    }).populate("userRef", "firstName lastName email phoneNumber img");

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
