import "dotenv/config";
import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./db.js";


import auth from "./routes/auth.js";
import properties from "./routes/properties.js";
import contact from "./routes/contact.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", auth);
app.use("/api/properties", properties);
app.use("/api/contact", contact);

await connectDb();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Maison server running at http://localhost:${PORT}`)
)
