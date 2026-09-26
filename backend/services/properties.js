import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

function toObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function getAllProperties(filters = {}) {
  const { city, minPrice, maxPrice, bedrooms, propertyType, search } = filters;
  const match = { available: true };

  if (city) match.city = { $regex: city, $options: "i" };
  if (bedrooms) match.bedrooms = parseInt(bedrooms);
  if (propertyType) match.propertyType = propertyType;
  if (minPrice || maxPrice) {
    match.price = {};
    if (minPrice) match.price.$gte = parseInt(minPrice);
    if (maxPrice) match.price.$lte = parseInt(maxPrice);
  }
  if (search) {
    match.$or = [
      { title: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const db = getDb();
  const properties = await db
    .collection("properties")
    .aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "landlordId",
          foreignField: "_id",
          as: "landlordArr",
        },
      },
      { $addFields: { landlord: { $arrayElemAt: ["$landlordArr", 0] } } },
      { $project: { landlordArr: 0, "landlord.password": 0 } },
    ])
    .toArray();

  return properties.map((p) => ({
    ...p,
    _id: p._id.toString(),
    landlordId: p.landlordId?.toString(),
    landlord: p.landlord ? { ...p.landlord, _id: p.landlord._id.toString() } : null,
  }));
}

export async function getMyProperties(landlordId) {
  const db = getDb();
  const properties = await db
    .collection("properties")
    .find({ landlordId })
    .sort({ createdAt: -1 })
    .toArray();

  return properties.map((p) => ({
    ...p,
    _id: p._id.toString(),
    landlordId: p.landlordId?.toString(),
  }));
}

export async function getPropertyById(id) {
  const oid = toObjectId(id);
  if (!oid) throw new Error("Invalid property ID");

  const db = getDb();
  const results = await db
    .collection("properties")
    .aggregate([
      { $match: { _id: oid } },
      {
        $lookup: {
          from: "users",
          localField: "landlordId",
          foreignField: "_id",
          as: "landlordArr",
        },
      },
      { $addFields: { landlord: { $arrayElemAt: ["$landlordArr", 0] } } },
      { $project: { landlordArr: 0, "landlord.password": 0 } },
    ])
    .toArray();

  if (!results.length) throw new Error("Property not found");

  const p = results[0];
  return {
    ...p,
    _id: p._id.toString(),
    landlordId: p.landlordId?.toString(),
    landlord: p.landlord ? { ...p.landlord, _id: p.landlord._id.toString() } : null,
  };
}

export async function createProperty(data, landlordId) {
  const {
    title, description, address, city, state,
    price, bedrooms, bathrooms, area, propertyType, amenities, images,
  } = data;

  const amenitiesArr = amenities
    ? Array.isArray(amenities)
      ? amenities
      : amenities.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  const now = new Date();
  const doc = {
    title, description, address,
    city, state: state || "",
    price: parseFloat(price),
    bedrooms: parseInt(bedrooms),
    bathrooms: parseInt(bathrooms),
    area: parseFloat(area) || 0,
    propertyType: propertyType || "apartment",
    amenities: amenitiesArr,
    images: images || [],
    available: true,
    landlordId,
    createdAt: now,
    updatedAt: now,
  };

  const db = getDb();
  const result = await db.collection("properties").insertOne(doc);
  return { ...doc, _id: result.insertedId.toString(), landlordId: landlordId.toString() };
}

export async function updateProperty(id, landlordId, updates) {
  const oid = toObjectId(id);
  if (!oid) throw new Error("Invalid ID");

  const db = getDb();
  const existing = await db.collection("properties").findOne({ _id: oid });
  if (!existing) throw new Error("Property not found");
  if (existing.landlordId.toString() !== landlordId.toString())
    throw new Error("Not authorized");

  const set = { ...updates, updatedAt: new Date() };
  if (set.amenities && !Array.isArray(set.amenities))
    set.amenities = set.amenities.split(",").map((a) => a.trim()).filter(Boolean);
  if (set.price) set.price = parseFloat(set.price);
  if (set.bedrooms) set.bedrooms = parseInt(set.bedrooms);
  if (set.bathrooms) set.bathrooms = parseInt(set.bathrooms);
  if (set.area) set.area = parseFloat(set.area);
  if (set.available !== undefined)
    set.available = set.available === "true" || set.available === true;
  delete set.landlordId;
  delete set._id;

  await db.collection("properties").updateOne({ _id: oid }, { $set: set });
  const updated = await db.collection("properties").findOne({ _id: oid });
  return { ...updated, _id: updated._id.toString(), landlordId: updated.landlordId?.toString() };
}

export async function deleteProperty(id, landlordId) {
  const oid = toObjectId(id);
  if (!oid) throw new Error("Invalid ID");

  const db = getDb();
  const existing = await db.collection("properties").findOne({ _id: oid });
  if (!existing) throw new Error("Property not found");
  if (existing.landlordId.toString() !== landlordId.toString())
    throw new Error("Not authorized");

  await db.collection("properties").deleteOne({ _id: oid });
  return { message: "Property deleted" };
}
