import Listing from "../models/listing.js";
import User from "../models/user.js";

export async function getAnalytics(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const totalListings = await Listing.countDocuments();

    // Aggregate listings by category for the bar chart
    const categoryData = await Listing.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get top viewed listings (shows which ads are being looked at)
    const topViewedListings = await Listing.find()
      .sort({ views: -1 })
      .limit(10)
      .select("title views listingId");

    res.status(200).json({
      totalUsers,
      totalListings,
      categoryData,
      topViewedListings,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch analytics", error: error.message });
  }
}
