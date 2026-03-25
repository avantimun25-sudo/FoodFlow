import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable } from "@workspace/db";
import { eq, sql, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string | undefined;

  const whereClause = search
    ? or(ilike(customersTable.name, `%${search}%`), ilike(customersTable.email, `%${search}%`))
    : undefined;

  const [customers, countResult] = await Promise.all([
    db.select().from(customersTable).where(whereClause).orderBy(customersTable.id).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(customersTable).where(whereClause),
  ]);

  res.json({ data: customers, total: countResult[0]?.count ?? 0, page, limit });
});

router.get("/:id", async (req, res) => {
  const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, Number(req.params.id)));
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

router.post("/", async (req, res) => {
  const { name, email, phone, address } = req.body;
  const [customer] = await db.insert(customersTable).values({ name, email, phone, address }).returning();
  res.status(201).json(customer);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, address } = req.body;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;

  const [updated] = await db.update(customersTable).set(updateData).where(eq(customersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Customer not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await db.delete(customersTable).where(eq(customersTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
