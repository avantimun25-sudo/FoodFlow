import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { driversTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const whereClause = status ? eq(driversTable.status, status) : undefined;

  const [drivers, countResult] = await Promise.all([
    db.select().from(driversTable).where(whereClause).orderBy(driversTable.id).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(driversTable).where(whereClause),
  ]);

  res.json({ data: drivers, total: countResult[0]?.count ?? 0, page, limit });
});

router.get("/:id", async (req, res) => {
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, Number(req.params.id)));
  if (!driver) return res.status(404).json({ error: "Driver not found" });
  res.json(driver);
});

router.post("/", async (req, res) => {
  const { name, email, phone, vehicle, licensePlate, rating } = req.body;
  const [driver] = await db.insert(driversTable).values({
    name, email, phone, vehicle, licensePlate, rating: rating ? String(rating) : null, status: "available",
  }).returning();
  res.status(201).json(driver);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, vehicle, licensePlate, status, rating } = req.body;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (vehicle !== undefined) updateData.vehicle = vehicle;
  if (licensePlate !== undefined) updateData.licensePlate = licensePlate;
  if (status !== undefined) updateData.status = status;
  if (rating !== undefined) updateData.rating = String(rating);

  const [updated] = await db.update(driversTable).set(updateData).where(eq(driversTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Driver not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await db.delete(driversTable).where(eq(driversTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
