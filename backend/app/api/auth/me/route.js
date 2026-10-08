import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  return NextResponse.json({ user });
}