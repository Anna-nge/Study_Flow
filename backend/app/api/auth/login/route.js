import User from "@/models/User";
import { handler, json, readBody, ApiError } from "@/lib/api";
import { signToken } from "@/lib/auth";
 
// POST /api/auth/login  { email, password }
export const POST = handler(async (req) => {
  const { email, password } = await readBody(req);
  if (!email || !password) throw new ApiError(400, "Email and password are required");
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (user.active === false) throw new ApiError(403, "This account has been deactivated. Contact an admin.");
  return json({ token: signToken(user), user });
});
 
 
