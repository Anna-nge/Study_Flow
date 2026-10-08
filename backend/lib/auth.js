import jwt from "jsonwebtoken";
import connectDB from "./mongodb";
import User from "../models/User";

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// Returns the logged-in user, or null
export async function getCurrentUser(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return null;
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    await connectDB();
    return await User.findById(id).select("-password");
  } catch {
    return null;
  }
}