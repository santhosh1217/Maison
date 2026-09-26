import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

export async function protect(req, res, next) {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const db = getDb();
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(decoded.id) },
        { projection: { password: 0 } }
      );
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
}

export function landlordOnly(req, res, next) {
  if (req.user?.role === "landlord") {
    next();
  } else {
    res.status(403).json({ message: "Access restricted to landlords only" });
  }
}
