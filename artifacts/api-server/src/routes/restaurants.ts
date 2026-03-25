import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { restaurantsTable } from "@workspace/db";
import { eq, sql, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  const whereClause = search
    ? or(ilike(restaurantsTable.name, `%${search}%`), ilike(restaurantsTable.cuisine, `%${search}%`))
    : undefined;

  const [restaurants, countResult] = await Promise.all([
    db.select().from(restaurantsTable).where(whereClause).orderBy(restaurantsTable.id).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(restaurantsTable).where(whereClause),
  ]);

  res.json({ data: restaurants, total: countResult[0]?.count ?? 0, page, limit });
});

router.get("/:id", async (req, res) => {
  const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, Number(req.params.id)));
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
  res.json(restaurant);
});

router.post("/", async (req, res) => {
  const { name, cuisine, address, phone, email, rating } = req.body;
  const [restaurant] = await db.insert(restaurantsTable).values({
    name, cuisine, address, phone, email, rating: rating ? String(rating) : null,
  }).returning();
  res.status(201).json(restaurant);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, cuisine, address, phone, email, isActive, rating } = req.body;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (cuisine !== undefined) updateData.cuisine = cuisine;
  if (address !== undefined) updateData.address = address;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (rating !== undefined) updateData.rating = String(rating);

  const [updated] = await db.update(restaurantsTable).set(updateData).where(eq(restaurantsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Restaurant not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await db.delete(restaurantsTable).where(eq(restaurantsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
