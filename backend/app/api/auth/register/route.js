import User from "@/models/User";
import { handler, json, readBody, ApiError } from "@/lib/api";
import { signToken } from "@/lib/auth";

// POST /api/auth/register  { name, email, password }
// Public sign-up always creates a Student; Admins are created by the
// seed script or promoted by another Admin.
export const POST = handler(async (req) => {
  const { name, email, password } = await readBody(req);
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");
  if (await User.exists({ email: String(email).toLowerCase() })) {
    throw new ApiError(409, "Email is already registered");
  }
  const user = await User.create({ name, email, password, role: "Student" });
  return json({ token: signToken(user), user }, 201);
});
