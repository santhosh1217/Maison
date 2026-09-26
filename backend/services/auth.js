import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export async function registerUser({ name, email, password, role, phone }) {

  const db = getDb();

  const existing = await db.collection("users").findOne({ email: email.toLowerCase() });
  if (existing) throw new Error("Email already registered");

  const hashed = await bcrypt.hash(password, 10);
  const now = new Date();

  const result = await db.collection("users").insertOne({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role: role,
    phone: phone,
    createdAt: now,
    updatedAt: now,
  });

  const userId = result.insertedId.toString();
  return {
    _id: userId,
    name,
    email: email.toLowerCase(),
    role: role,
    token: generateToken(userId),
  };
}

export async function loginUser({ email, password }) {
  const db = getDb();

  const user = await db.collection("users").findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("Invalid email or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid email or password");

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    token: generateToken(user._id.toString()),
  };
}

export async function getUser(user) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
}
