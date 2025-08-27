import Listing from "../models/listing.js";
import { isAdmin } from "./userController.js";

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

// 🔹 Save a new listing
export function saveListing(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "You are not authorized to add a listing",
    });
    return;
  }

  const listing = new Listing(req.body);

  listing
    .save()
    .then(() => {
      res.json({
        message: "Listing added successfully",
      });
    })
    .catch((e) => {
      console.log(e);
      res.json({
        message: "Error adding listing",
      });
    });
}

// 🔹 Delete a listing
export async function deleteListing(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "You are not authorized to delete a listing",
    });
    return;
  }
  try {
    await Listing.deleteOne({ slug: req.params.slug });

    res.json({
      message: "Listing deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete listing",
      err: err,
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
  const slug = req.params.slug;

  try {
    const listing = await Listing.findOne({ slug: slug });

    if (listing == null) {
      res.status(404).json({
        message: "Listing not found",
      });
      return;
    }
    if (listing.featured || isAdmin(req)) {
      res.json(listing);
    } else {
      res.status(404).json({
        message: "Listing not found",
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
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
    });
    res.json(listings);
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err,
    });
  }
}
