import User from "@/models/User";
import { handler, json, readBody, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { deleteUserData } from "@/lib/cascade";

// GET /api/auth/me — current user profile
export const GET = handler(async (req) => {
  const user = await requireUser(req);
  return json({ user });
});

// PUT /api/auth/me  { name?, email?, currentPassword?, newPassword? }
export const PUT = handler(async (req) => {
  const me = await requireUser(req);
  const { name, email, currentPassword, newPassword } = await readBody(req);
  const user = await User.findById(me._id).select("+password");

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (newPassword) {
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw new ApiError(400, "Current password is incorrect");
    }
    user.password = newPassword;
  }
  await user.save();
  return json({ user });
});

// DELETE /api/auth/me — delete own account and all its data
export const DELETE = handler(async (req) => {
  const me = await requireUser(req);
  await deleteUserData(me._id);
  await User.deleteOne({ _id: me._id });
  return json({ message: "Account deleted" });
});
