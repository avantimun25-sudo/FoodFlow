import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { menuItemsTable, restaurantsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const restaurantId = req.query.restaurantId ? Number(req.query.restaurantId) : undefined;

  const whereClause = restaurantId ? eq(menuItemsTable.restaurantId, restaurantId) : undefined;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: menuItemsTable.id,
        restaurantId: menuItemsTable.restaurantId,
        name: menuItemsTable.name,
        description: menuItemsTable.description,
        price: menuItemsTable.price,
        category: menuItemsTable.category,
        imageUrl: menuItemsTable.imageUrl,
        isAvailable: menuItemsTable.isAvailable,
        restaurantName: restaurantsTable.name,
      })
      .from(menuItemsTable)
      .leftJoin(restaurantsTable, eq(menuItemsTable.restaurantId, restaurantsTable.id))
      .where(whereClause)
      .orderBy(menuItemsTable.restaurantId, menuItemsTable.name)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(menuItemsTable).where(whereClause),
  ]);

  res.json({ data: items, total: countResult[0]?.count ?? 0, page, limit });
});

router.post("/", async (req, res) => {
  const { restaurantId, name, description, price, category, imageUrl } = req.body;
  const [item] = await db.insert(menuItemsTable).values({
    restaurantId, name, description, price: String(price), category, imageUrl: imageUrl || null,
  }).returning();

  const [result] = await db.select({
    id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId, name: menuItemsTable.name,
    description: menuItemsTable.description, price: menuItemsTable.price, category: menuItemsTable.category,
    imageUrl: menuItemsTable.imageUrl, isAvailable: menuItemsTable.isAvailable, restaurantName: restaurantsTable.name,
  }).from(menuItemsTable)
    .leftJoin(restaurantsTable, eq(menuItemsTable.restaurantId, restaurantsTable.id))
    .where(eq(menuItemsTable.id, item.id));

  res.status(201).json(result);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, category, isAvailable, imageUrl } = req.body;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = String(price);
  if (category !== undefined) updateData.category = category;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

  await db.update(menuItemsTable).set(updateData).where(eq(menuItemsTable.id, id));

  const [updated] = await db.select({
    id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId, name: menuItemsTable.name,
    description: menuItemsTable.description, price: menuItemsTable.price, category: menuItemsTable.category,
    imageUrl: menuItemsTable.imageUrl, isAvailable: menuItemsTable.isAvailable, restaurantName: restaurantsTable.name,
  }).from(menuItemsTable)
    .leftJoin(restaurantsTable, eq(menuItemsTable.restaurantId, restaurantsTable.id))
    .where(eq(menuItemsTable.id, id));

  if (!updated) return res.status(404).json({ error: "Menu item not found" });
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, Number(req.params.id)));
  res.status(204).send();
});

export default router;
