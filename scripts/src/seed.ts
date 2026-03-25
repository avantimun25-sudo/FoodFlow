import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function seed() {
  const adminEmail = "admin@foodadmin.com";
  const adminPassword = "admin123";

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);

  if (existing.length > 0) {
    console.log("Admin user already exists:", adminEmail);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.insert(usersTable).values({
      email: adminEmail,
      passwordHash,
      role: "admin",
      restaurantId: null,
    });
    console.log("Admin user created:", adminEmail, "/ password:", adminPassword);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
