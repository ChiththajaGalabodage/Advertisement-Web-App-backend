import express from "express";

import {
  createListing,
  deleteListing,
  getListingBySlug,
  getListings,
  saveListing,
  searchListings,
  updateListing,
} from "../controllers/listingController.js";

const listingRouter = express.Router();

listingRouter.get("/", getListings);
listingRouter.post("/create", createListing); // Requires JWT token
listingRouter.post("/", saveListing);
listingRouter.delete("/:productId", deleteListing);
listingRouter.put("/:productId", updateListing);
listingRouter.get("/search/:query", searchListings);
listingRouter.get("/:listingId", getListingBySlug);

export default listingRouter;
