import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { protect, landlordOnly } from "../middleware/auth.js";
import {
  getAllProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../services/properties.js";

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Multer stays in route — it's transport/infrastructure, not business logic
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase()))
      cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

// GET /api/properties
router.get("/", async (req, res) => {
  try {
    const data = await getAllProperties(req.query);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/properties/my
router.get("/my", protect, landlordOnly, async (req, res) => {
  try {
    const data = await getMyProperties(req.user._id);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/properties/:id
router.get("/:id", async (req, res) => {
  // Validate frontend field
  if (!req.params.id)
    return res.status(400).json({ message: "Property ID is required" });

  try {
    const data = await getPropertyById(req.params.id);
    res.status(200).json(data);
  } catch (err) {
    const status = err.message === "Property not found" ? 404
      : err.message === "Invalid property ID" ? 400 : 500;
    res.status(status).json({ message: err.message });
  }
});

// POST /api/properties
router.post("/", protect, landlordOnly, upload.array("images", 6), async (req, res) => {
  const { title, description, address, city, price, bedrooms, bathrooms } = req.body;

  // Validate frontend fields
  if (!title || !description || !address || !city || !price || !bedrooms || !bathrooms)
    return res.status(400).json({ message: "Please fill all required fields" });

  try {
    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];
    const data = await createProperty({ ...req.body, images }, req.user._id);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/properties/:id
router.put("/:id", protect, landlordOnly, upload.array("images", 6), async (req, res) => {
  // Validate frontend field
  if (!req.params.id)
    return res.status(400).json({ message: "Property ID is required" });

  try {
    const images = req.files?.length > 0
      ? req.files.map((f) => `/uploads/${f.filename}`)
      : undefined;
    const updates = images ? { ...req.body, images } : req.body;
    const data = await updateProperty(req.params.id, req.user._id, updates);
    res.status(200).json(data);
  } catch (err) {
    const status = err.message === "Not authorized" ? 403
      : err.message === "Property not found" ? 404 : 500;
    res.status(status).json({ message: err.message });
  }
});

// DELETE /api/properties/:id
router.delete("/:id", protect, landlordOnly, async (req, res) => {
  // Validate frontend field
  if (!req.params.id)
    return res.status(400).json({ message: "Property ID is required" });

  try {
    const data = await deleteProperty(req.params.id, req.user._id);
    res.status(200).json(data);
  } catch (err) {
    const status = err.message === "Not authorized" ? 403
      : err.message === "Property not found" ? 404 : 500;
    res.status(status).json({ message: err.message });
  }
});

export default router;
