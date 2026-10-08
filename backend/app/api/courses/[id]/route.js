import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(req, { params }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  const { courseName, courseCode, instructor, schedule } = await req.json();

  await connectDB();
  const course = await Course.findOneAndUpdate(
    { _id: id, userId: user._id }, // only the owner can edit
    { courseName, courseCode, instructor, schedule },
    { new: true, runValidators: true }
  );
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ course });
}

export async function DELETE(req, { params }) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { id } = await params;
  await connectDB();
  const course = await Course.findOneAndDelete({ _id: id, userId: user._id });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}