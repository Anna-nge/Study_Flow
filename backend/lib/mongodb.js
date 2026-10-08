import mongoose from "mongoose";

const cached = global._mongoose || (global._mongoose = { conn: null });

export default async function connectDB() {
  if (cached.conn) return cached.conn;
  cached.conn = await mongoose.connect(process.env.MONGODB_URI);
  return cached.conn;
}