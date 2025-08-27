import mongoose from "mongoose";

const OTPSchema = mongoose.Schema({
  email: {
    required: true,
    type: String,
  },
  otp: {
    required: true,
    type: Number,
  },
});

const OTP = mongoose.model("Otp", OTPSchema);
export default OTP;
