import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password || password.length < 6)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await connectDB();
  if (await User.findOne({ email: email.toLowerCase() }))
    return NextResponse.json({ error: "Email already used" }, { status: 409 });

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
  });

  const res = NextResponse.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
  res.cookies.set("token", signToken(user), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}