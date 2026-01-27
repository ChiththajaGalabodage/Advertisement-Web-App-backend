import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Middleware to verify the JWT and attach the user to req.user
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"]; // handle case variations
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    // Verify token and decode payload
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      return res.status(403).json({ message: "Invalid token." });
    }

    const userId = decoded?.id;
    if (!userId) {
      return res.status(403).json({ message: "Invalid token payload." });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found in database." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res
      .status(500)
      .json({ message: "Authentication failed due to server error." });
  }
};

// Alias commonly used name in routes
export const protect = authenticateToken;

// Middleware to ensure the authenticated user is an admin
export const admin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Access denied. Not authenticated." });
  }

  const isAdmin = req.user.role === "admin" || req.user.isAdmin === true;
  if (!isAdmin) {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }

  next();
};
