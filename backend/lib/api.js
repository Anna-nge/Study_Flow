import { NextResponse } from "next/server";
import { connectDB } from "./db";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

// Parse the JSON body, returning {} for an empty body.
export async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

// Keep only the listed keys from an object (prevents mass assignment,
// e.g. a client sending userId or role in a body).
export function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

// Wraps a route handler: connects to MongoDB and turns thrown errors
// into consistent JSON responses: { error: "message" }.
export function handler(fn) {
  return async (req, ctx) => {
    try {
      await connectDB();
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return json({ error: err.message }, err.status);
      if (err.name === "ValidationError") {
        const msg = Object.values(err.errors).map((e) => e.message).join(", ");
        return json({ error: msg }, 400);
      }
      if (err.name === "CastError") return json({ error: `Invalid ${err.path}` }, 400);
      if (err.code === 11000) return json({ error: "Already exists" }, 409);
      console.error(err);
      return json({ error: "Internal server error" }, 500);
    }
  };
}

// Escape user input before putting it inside a RegExp (search boxes).
export function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
