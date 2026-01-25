import express from "express";
import { getAnalytics } from "../controllers/analyticsController.js";
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

// Get analytics (requires admin authentication)
router.get("/", verifyToken, getAnalytics);

export default router;
