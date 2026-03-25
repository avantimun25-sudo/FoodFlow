import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, restaurantsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    let restaurantName: string | null = null;
    if (user.restaurantId) {
      const [restaurant] = await db.select({ name: restaurantsTable.name }).from(restaurantsTable).where(eq(restaurantsTable.id, user.restaurantId)).limit(1);
      restaurantName = restaurant?.name ?? null;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurantName,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json(req.user);
});

router.post("/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
