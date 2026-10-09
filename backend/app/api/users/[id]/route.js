import User from "@/models/User";
import { handler, json, readBody, pick, ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteUserData } from "@/lib/cascade";
 
async function load(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");
  return user;
}
 
// GET /api/users/:id — Admin
export const GET = handler(async (req, { params }) => {
  await requireAdmin(req);
  const { id } = await params;
  return json({ user: await load(id) });
});
 
// PUT /api/users/:id  { name?, email?, role?, password?, active? } — Admin
export const PUT = handler(async (req, { params }) => {
  const admin = await requireAdmin(req);
  const { id } = await params;
  const user = await load(id);
  const body = pick(await readBody(req), ["name", "email", "role", "password", "active"]);
  if (admin._id.equals(user._id) && body.role && body.role !== "Admin") {
    throw new ApiError(400, "You cannot remove your own Admin role");
  }
  if (admin._id.equals(user._id) && body.active === false) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }
  Object.assign(user, body);
  await user.save();
  return json({ user });
});
 
// DELETE /api/users/:id — Admin
export const DELETE = handler(async (req, { params }) => {
  const admin = await requireAdmin(req);
  const { id } = await params;
  const user = await load(id);
  if (admin._id.equals(user._id)) throw new ApiError(400, "Use your profile page to delete your own account");
  await deleteUserData(user._id);
  await user.deleteOne();
  return json({ message: "User deleted" });
});
 
 