import { ObjectId } from "mongodb";
import { getDb } from "../db.js";

function toObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function sendMessage(propertyId, { tenantName, tenantEmail, tenantPhone, message }) {
  const oid = toObjectId(propertyId);
  if (!oid) throw new Error("Invalid property ID");

  const db = getDb();
  const property = await db.collection("properties").findOne({ _id: oid });
  if (!property) throw new Error("Property not found");

  const result = await db.collection("contactmessages").insertOne({
    propertyId: property._id,
    landlordId: property.landlordId,
    tenantName,
    tenantEmail,
    tenantPhone: tenantPhone || "",
    message,
    read: false,
    createdAt: new Date(),
  });

  return { message: "Message sent successfully!", _id: result.insertedId.toString() };
}

export async function getInbox(landlordId) {
  const db = getDb();
  const messages = await db
    .collection("contactmessages")
    .aggregate([
      { $match: { landlordId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "properties",
          localField: "propertyId",
          foreignField: "_id",
          as: "propertyArr",
        },
      },
      { $addFields: { property: { $arrayElemAt: ["$propertyArr", 0] } } },
      { $project: { propertyArr: 0 } },
    ])
    .toArray();

  return messages.map((m) => ({
    ...m,
    _id: m._id.toString(),
    propertyId: m.propertyId?.toString(),
    landlordId: m.landlordId?.toString(),
    property: m.property ? { ...m.property, _id: m.property._id.toString() } : null,
  }));
}

export async function markMessageRead(id) {
  const oid = toObjectId(id);
  if (!oid) throw new Error("Invalid ID");

  const db = getDb();
  await db.collection("contactmessages").updateOne({ _id: oid }, { $set: { read: true } });
  return { message: "Marked as read" };
}
