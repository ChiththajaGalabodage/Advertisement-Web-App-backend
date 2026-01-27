import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// GET /dashboard/stats - protected admin route
router.get("/stats", protect, admin, getDashboardStats);

export default router;
