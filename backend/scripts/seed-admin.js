// Creates (or promotes) an Admin account. Usage: npm run seed:admin
import mongoose from "mongoose";
import User from "../models/User.js";

const { MONGODB_URI, ADMIN_NAME = "Admin", ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env.local");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);
let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
if (user) {
  user.role = "Admin";
  await user.save();
  console.log(`Promoted ${user.email} to Admin`);
} else {
  user = await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "Admin" });
  console.log(`Created admin ${user.email}`);
}
await mongoose.disconnect();
