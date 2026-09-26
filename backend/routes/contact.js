import { Router } from "express";
import { protect, landlordOnly } from "../middleware/auth.js";
import { sendMessage, getInbox, markMessageRead, } from "../services/contact.js";

const router = Router();

router.post("/:propertyId", async (req, res) => {
  const { tenantName, tenantEmail, message } = req.body;

  if (!tenantName || !tenantEmail || !message)
    return res.status(400).json({ message: "Name, email and message are required" });

  try {
    const data = await sendMessage(req.params.propertyId, req.body);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get("/inbox", protect, landlordOnly, async (req, res) => {
  try {
    const data = await getInbox(req.user._id);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/read", protect, landlordOnly, async (req, res) => {
  if (!req.params.id)
    return res.status(400).json({ message: "Message ID is required" });

  try {
    const data = await markMessageRead(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
