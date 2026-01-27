import express from "express";
import {
  createUser,
  getAllUser,
  loginUser,
  loginWithGoogle,
  registerUser,
  resetPassword,
  sendOTP,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginWithGoogle);
userRouter.post("/send-otp", sendOTP);
userRouter.post("/reset-password", resetPassword);
/*userRouter.get("/", getUser);*/
userRouter.get("/all", getAllUser); // Protected route - requires authentication

// Protected profile route example

// Admin-only create user route example (reuses controller)

export default userRouter;
