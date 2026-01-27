import User from "../models/user.js";
import Listing from "../models/listing.js";

export async function getDashboardStats(req, res) {
  try {
    const [
      totalUsers,
      totalAdvertisements,
      adsByCategory,
      recentUsers,
      recentAdvertisements,
    ] = await Promise.all([
      User.countDocuments(),
      Listing.countDocuments(),
      Listing.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email img createdAt")
        .lean(),
      Listing.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title price category image status createdAt userRef")
        .populate({
          path: "userRef",
          select: "name email firstName lastName img",
        })
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        totals: {
          users: totalUsers,
          advertisements: totalAdvertisements,
        },
        adsByCategory,
        recentUsers,
        recentAdvertisements,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats", error });
  }
}
