import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, restaurantRequestsTable, restaurantsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { name, cuisine, address, phone, email, description, ownerName, password } = req.body;
    if (!name || !cuisine || !address || !email || !ownerName || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existing = await db.select({ id: restaurantRequestsTable.id })
      .from(restaurantRequestsTable)
      .where(and(eq(restaurantRequestsTable.email, email.toLowerCase()), eq(restaurantRequestsTable.status, "pending")))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "A pending request already exists for this email" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [request] = await db.insert(restaurantRequestsTable).values({
      name,
      cuisine,
      address,
      phone: phone || null,
      email: email.toLowerCase(),
      description: description || null,
      ownerName,
      passwordHash,
      status: "pending",
    }).returning();

    res.status(201).json({
      id: request.id,
      name: request.name,
      cuisine: request.cuisine,
      address: request.address,
      phone: request.phone,
      email: request.email,
      description: request.description,
      ownerName: request.ownerName,
      status: request.status,
      reviewerNotes: request.reviewerNotes,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const whereClause = status ? eq(restaurantRequestsTable.status, status) : undefined;

    const [rows, countResult] = await Promise.all([
      db.select({
        id: restaurantRequestsTable.id,
        name: restaurantRequestsTable.name,
        cuisine: restaurantRequestsTable.cuisine,
        address: restaurantRequestsTable.address,
        phone: restaurantRequestsTable.phone,
        email: restaurantRequestsTable.email,
        description: restaurantRequestsTable.description,
        ownerName: restaurantRequestsTable.ownerName,
        status: restaurantRequestsTable.status,
        reviewerNotes: restaurantRequestsTable.reviewerNotes,
        createdAt: restaurantRequestsTable.createdAt,
        reviewedAt: restaurantRequestsTable.reviewedAt,
      })
        .from(restaurantRequestsTable)
        .where(whereClause)
        .orderBy(desc(restaurantRequestsTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(restaurantRequestsTable)
        .where(whereClause),
    ]);

    res.json({ data: rows, total: Number(countResult[0].count), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reviewerNotes } = req.body;

    if (!status || !["approved", "declined"].includes(status)) {
      res.status(400).json({ error: "Status must be 'approved' or 'declined'" });
      return;
    }

    const [requestRow] = await db.select().from(restaurantRequestsTable).where(eq(restaurantRequestsTable.id, id)).limit(1);
    if (!requestRow) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (requestRow.status !== "pending") {
      res.status(409).json({ error: "Request already reviewed" });
      return;
    }

    const [updated] = await db.update(restaurantRequestsTable)
      .set({ status, reviewerNotes: reviewerNotes || null, reviewedAt: new Date() })
      .where(eq(restaurantRequestsTable.id, id))
      .returning();

    if (status === "approved") {
      const [newRestaurant] = await db.insert(restaurantsTable).values({
        name: requestRow.name,
        cuisine: requestRow.cuisine,
        address: requestRow.address,
        phone: requestRow.phone,
        email: requestRow.email,
        isActive: true,
      }).returning({ id: restaurantsTable.id });

      await db.insert(usersTable).values({
        email: requestRow.email,
        passwordHash: requestRow.passwordHash,
        role: "restaurant",
        restaurantId: newRestaurant.id,
      });
    }

    res.json({
      id: updated.id,
      name: updated.name,
      cuisine: updated.cuisine,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      description: updated.description,
      ownerName: updated.ownerName,
      status: updated.status,
      reviewerNotes: updated.reviewerNotes,
      createdAt: updated.createdAt,
      reviewedAt: updated.reviewedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
