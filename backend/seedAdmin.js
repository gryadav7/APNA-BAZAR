import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import connectDB from "./src/config/db.js";
import User from "./src/models/User.js";

async function seedAdmin() {
  try {
    await connectDB();
    const hashedPassword = await bcrypt.hash("123456", 10);

    const adminAccounts = [
      {
        name: "Prashant",
        email: "prashant@gmail.com",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE"
      },
      {
        name: "Platform Administrator",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE"
      }
    ];

    for (const acc of adminAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (existing) {
        existing.role = "ADMIN";
        existing.status = "ACTIVE";
        existing.password = hashedPassword;
        existing.name = acc.name;
        await existing.save();
        console.log(`Updated admin account: ${acc.email} (Role: ADMIN, Status: ACTIVE)`);
      } else {
        const created = await User.create(acc);
        console.log(`Created admin account: ${created.email} (Role: ADMIN, Status: ACTIVE)`);
      }
    }

    console.log("\nADMIN SEED SUCCESSFUL!");
    console.log("Credentials:");
    console.log("  Email: prashant@gmail.com");
    console.log("  Password: 123456");
    console.log("  Role: ADMIN");
    process.exit(0);
  } catch (err) {
    console.error("Seed admin error:", err);
    process.exit(1);
  }
}

seedAdmin();
