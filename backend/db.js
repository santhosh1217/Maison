import { MongoClient } from "mongodb";

let db;

export async function connectDb() {

  const Mongo_Uri = process.env.MONGO_URI;

  if (!Mongo_Uri) {
    throw new Error("Missing Mongo_Uri in environment variables");
  }

  const client = new MongoClient(Mongo_Uri);

  await client.connect();
  db = client.db("maison");
  return db;
}

export function getDb() {
  if (!db) throw new Error("DB not initialized. Call connectDb() first.");
  return db;
}
