import express from "express";

import {
  createListing,
  deleteListingByAdmin,
  deleteListing,
  getListingById,
  getListingBySlug,
  getListings,
  //saveListing,
  searchListings,
  updateListing,
  updateListingByOwner,
} from "../controllers/listingController.js";

const listingRouter = express.Router();

listingRouter.get("/", getListings);
listingRouter.post("/create", createListing); // Requires JWT token
//listingRouter.post("/", saveListing);
listingRouter.put("/:id", updateListingByOwner); // Update by owner - Requires JWT token + ownership verification
listingRouter.delete("/delete/:id", deleteListingByAdmin); // Requires JWT token + admin role
listingRouter.delete("/:productId", deleteListing);
listingRouter.put("/:productId", updateListing);
listingRouter.get("/search/:query", searchListings);
listingRouter.get("/:id", getListingById); // Get listing by MongoDB ID
listingRouter.get("/:listingId", getListingBySlug); // Get listing by listingId

export default listingRouter;
