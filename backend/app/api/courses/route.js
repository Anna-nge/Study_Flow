import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await connectDB();
  const courses = await Course.find({ userId: user._id }).sort({ createdAt: -1 });
  return NextResponse.json({ courses });
}

export async function POST(req) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { courseName, courseCode, instructor, schedule } = await req.json();
  if (!courseName)
    return NextResponse.json({ error: "courseName is required" }, { status: 400 });

  await connectDB();
  const course = await Course.create({
    userId: user._id,
    courseName,
    courseCode,
    instructor,
    schedule,
  });
  return NextResponse.json({ course }, { status: 201 });
}