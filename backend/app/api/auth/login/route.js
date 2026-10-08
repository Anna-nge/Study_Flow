import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();
  await connectDB();
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(password || "", user.password)))
    return NextResponse.json({ error: "Wrong email or password" }, { status: 401 });

  const res = NextResponse.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
  res.cookies.set("token", signToken(user), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}