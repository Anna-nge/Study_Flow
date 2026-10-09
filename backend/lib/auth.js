import jwt from "jsonwebtoken";
import User from "@/models/User";
import { ApiError } from "./api";
 
const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return process.env.JWT_SECRET;
};
 
export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
 
// Reads "Authorization: Bearer <token>", verifies it and loads the user.
// Loading from the DB means a deleted user or a changed role takes effect
// immediately instead of when the token expires.
export async function requireUser(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Not authenticated");
  let payload;
  try {
    payload = jwt.verify(token, secret());
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "User no longer exists");
  if (user.active === false) throw new ApiError(401, "Account has been deactivated");
  return user;
}
 
export async function requireAdmin(req) {
  const user = await requireUser(req);
  if (user.role !== "Admin") throw new ApiError(403, "Admin access required");
  return user;
}
 
 