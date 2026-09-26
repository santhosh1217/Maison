import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { registerUser, loginUser, getUser } from "../services/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role || !phone)
      return res.status(400).json({ message: "Mandatory fields are missing" });

    const data = await registerUser({ name, email, password, role, phone });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Mandatory fields are missing" });

    const data = await loginUser({ email, password });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/user", protect, async (req, res) => {
  try {
    const data = await getUser(req.user);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
