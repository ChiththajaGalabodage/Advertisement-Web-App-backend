import Contact from "../models/contact.js";

export async function createContact(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    const { receiverId, listingId, subject, message } = req.body;

    const newContact = new Contact({
      senderId: req.user.id,
      receiverId,
      listingId,
      subject,
      message,
    });

    await newContact.save();

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to send message", error: error.message });
  }
}

export async function getContacts(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const contacts = await Contact.find({ receiverId: req.user.id })
      .populate("senderId", "firstName lastName email")
      .populate("listingId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to fetch messages", error: error.message });
  }
}
