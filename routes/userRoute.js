import express from "express";
import {
  createUser,
  getAllUser,
  getUser,
  loginUser,
  loginWithGoogle,
  resetPassword,
  sendOTP,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginWithGoogle);
userRouter.post("/send-otp", sendOTP);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/", getUser);
userRouter.get("/gau", getAllUser); // Assuming you want to get user by ID as well

export default userRouter;
