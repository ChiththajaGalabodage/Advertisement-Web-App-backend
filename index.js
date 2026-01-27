import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";

// Load all models first (before routes and controllers)
import User from "./models/user.js";
import Listing from "./models/listing.js";
import Contact from "./models/contact.js";
import OTP from "./models/otp.js";

// Then load routes
import userRouter from "./routes/userRoute.js";
import listingRouter from "./routes/listingRoute.js";
import contactRouter from "./routes/contactRoute.js";
//import analyticsRouter from "./routes/analyticsRoute.js";

dotenv.config();

const app = express();
app.use(cors());

app.use(bodyParser.json());

app.use((req, res, next) => {
  const tokenString = req.header("Authorization");

  if (tokenString != null) {
    const token = tokenString.replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        console.error("JWT verification error:", err.message);
        return res.status(403).json({
          message: "Invalid token",
          error: err.message,
        });
      }

      if (decoded != null) {
        req.user = decoded; // decoded contains user info from JWT payload
        console.log("User authenticated:", decoded); // Debug log
        return next();
      } else {
        return res.status(403).json({
          message: "Invalid token",
        });
      }
    });
  } else {
    // No token provided - continue without authentication
    next();
  }
});

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("Connected to the database");
  })
  .catch(() => {
    console.log("Database connection failed");
  });

app.use("/api/users", userRouter);
app.use("/admin/users", userRouter);
app.use("/api/listings", listingRouter);
app.use("/api/contacts", contactRouter);
//app.use("/api/analytics", analyticsRouter);

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
