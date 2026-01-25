import Listing from "../models/listing.js";
import User from "../models/user.js";

// 🔹 Get admin analytics
export async function getAnalytics(req, res) {
  try {
    // Check if user is authenticated and admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden. Only admins can access analytics.",
      });
    }

    // Total users
    const totalUsers = await User.countDocuments();

    // Total listings
    const totalListings = await Listing.countDocuments();

    // Total views (sum of views on all listings)
    const totalViewsResult = await Listing.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } },
    ]);
    const totalViews =
      totalViewsResult.length > 0 ? totalViewsResult[0].totalViews : 0;

    // Category distribution
    const categoryStats = await Listing.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      message: "Analytics retrieved successfully",
      analytics: {
        totalUsers,
        totalListings,
        totalViews,
        categoryStats,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to retrieve analytics",
      error: error.message,
    });
  }
}
