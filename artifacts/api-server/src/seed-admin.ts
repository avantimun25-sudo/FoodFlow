import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  await db.insert(usersTable).values({
    email: "admin@foodadmin.com",
    passwordHash: hash,
    role: "admin",
    restaurantId: null,
  }).onConflictDoNothing();
  console.log("Admin seeded: admin@foodadmin.com / admin123");
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
