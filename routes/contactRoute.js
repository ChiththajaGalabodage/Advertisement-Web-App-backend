import express from "express";
import {
  createContact,
  getContacts,
} from "../controllers/contactController.js";

const router = express.Router();

// Note: Ensure authentication middleware is applied to these routes in your main server file
router.post("/", createContact);
router.get("/", getContacts);

export default router;
