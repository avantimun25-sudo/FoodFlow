import { Router } from "express";
import { db, restaurantsTable, ordersTable, customersTable, menuItemsTable } from "@workspace/db";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { requireRestaurant } from "../middlewares/auth";

const router = Router();

router.use(requireRestaurant);

router.get("/profile", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId)).limit(1);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }
    res.json({
      ...restaurant,
      totalOrders: restaurant.totalOrders ?? 0,
      totalRevenue: Number(restaurant.totalRevenue ?? 0),
      rating: restaurant.rating ? Number(restaurant.rating) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [restaurant] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId)).limit(1);

    const [currentPeriod] = await db.select({
      revenue: sql<number>`coalesce(sum(total_amount), 0)`,
      orders: sql<number>`count(*)`,
    }).from(ordersTable).where(and(
      eq(ordersTable.restaurantId, restaurantId),
      eq(ordersTable.status, "delivered"),
      gte(ordersTable.createdAt, thirtyDaysAgo),
    ));

    const [prevPeriod] = await db.select({
      revenue: sql<number>`coalesce(sum(total_amount), 0)`,
      orders: sql<number>`count(*)`,
    }).from(ordersTable).where(and(
      eq(ordersTable.restaurantId, restaurantId),
      eq(ordersTable.status, "delivered"),
      gte(ordersTable.createdAt, sixtyDaysAgo),
    ));

    const [activeResult] = await db.select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(and(eq(ordersTable.restaurantId, restaurantId), sql`status NOT IN ('delivered', 'cancelled')`));

    const [customerResult] = await db.select({ count: sql<number>`count(distinct customer_id)` })
      .from(ordersTable)
      .where(and(eq(ordersTable.restaurantId, restaurantId), eq(ordersTable.status, "delivered")));

    const [menuResult] = await db.select({ count: sql<number>`count(*)` })
      .from(menuItemsTable)
      .where(eq(menuItemsTable.restaurantId, restaurantId));

    const currentRevenue = Number(currentPeriod.revenue);
    const prevRevenue = Number(prevPeriod.revenue);
    const currentOrders = Number(currentPeriod.orders);
    const prevOrders = Number(prevPeriod.orders);

    const revenueGrowth = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;
    const avgOrderValue = currentOrders > 0 ? currentRevenue / currentOrders : 0;

    res.json({
      totalRevenue: Number(restaurant?.totalRevenue ?? 0),
      totalOrders: Number(restaurant?.totalOrders ?? 0),
      totalCustomers: Number(customerResult.count),
      totalMenuItems: Number(menuResult.count),
      activeOrders: Number(activeResult.count),
      avgOrderValue,
      rating: restaurant?.rating ? Number(restaurant.rating) : null,
      revenueGrowth,
      ordersGrowth,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const whereClause = status
      ? and(eq(ordersTable.restaurantId, restaurantId), eq(ordersTable.status, status))
      : eq(ordersTable.restaurantId, restaurantId);

    const [rows, countResult] = await Promise.all([
      db.select({
        id: ordersTable.id,
        customerId: ordersTable.customerId,
        restaurantId: ordersTable.restaurantId,
        driverId: ordersTable.driverId,
        status: ordersTable.status,
        totalAmount: ordersTable.totalAmount,
        deliveryAddress: ordersTable.deliveryAddress,
        notes: ordersTable.notes,
        createdAt: ordersTable.createdAt,
        updatedAt: ordersTable.updatedAt,
        customerName: customersTable.name,
        restaurantName: restaurantsTable.name,
      })
        .from(ordersTable)
        .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
        .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
        .where(whereClause)
        .orderBy(desc(ordersTable.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable).where(whereClause),
    ]);

    res.json({
      data: rows.map(r => ({
        ...r,
        totalAmount: Number(r.totalAmount),
        customerName: r.customerName ?? "",
        restaurantName: r.restaurantName ?? "",
        driverName: null,
      })),
      total: Number(countResult[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const id = parseInt(req.params.id);
    const { status } = req.body;

    const VALID_STATUSES = ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!status || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
      return;
    }

    const [existing] = await db.select({ id: ordersTable.id, restaurantId: ordersTable.restaurantId, status: ordersTable.status })
      .from(ordersTable).where(eq(ordersTable.id, id)).limit(1);

    if (!existing || existing.restaurantId !== restaurantId) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (existing.status === "delivered" || existing.status === "cancelled") {
      res.status(400).json({ error: "Cannot update a completed or cancelled order" });
      return;
    }

    const [updated] = await db.update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();

    const [customer] = await db.select({ name: customersTable.name }).from(customersTable).where(eq(customersTable.id, updated.customerId)).limit(1);
    const [restaurant] = await db.select({ name: restaurantsTable.name }).from(restaurantsTable).where(eq(restaurantsTable.id, updated.restaurantId)).limit(1);

    res.json({
      ...updated,
      totalAmount: Number(updated.totalAmount),
      customerName: customer?.name ?? "",
      restaurantName: restaurant?.name ?? "",
      driverName: null,
      items: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/customers", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [rows, countResult] = await Promise.all([
      db.select({
        id: customersTable.id,
        name: customersTable.name,
        email: customersTable.email,
        phone: customersTable.phone,
        ordersFromRestaurant: sql<number>`count(${ordersTable.id})`,
        spentAtRestaurant: sql<number>`coalesce(sum(${ordersTable.totalAmount}), 0)`,
        lastOrderAt: sql<string>`max(${ordersTable.createdAt})`,
      })
        .from(ordersTable)
        .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
        .where(and(eq(ordersTable.restaurantId, restaurantId), eq(ordersTable.status, "delivered")))
        .groupBy(customersTable.id, customersTable.name, customersTable.email, customersTable.phone)
        .orderBy(desc(sql`count(${ordersTable.id})`))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(distinct ${ordersTable.customerId})` })
        .from(ordersTable)
        .where(and(eq(ordersTable.restaurantId, restaurantId), eq(ordersTable.status, "delivered"))),
    ]);

    res.json({
      data: rows.map(r => ({
        ...r,
        ordersFromRestaurant: Number(r.ordersFromRestaurant),
        spentAtRestaurant: Number(r.spentAtRestaurant),
        lastOrderAt: r.lastOrderAt,
      })),
      total: Number(countResult[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/menu", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [restaurant] = await db.select({ name: restaurantsTable.name })
      .from(restaurantsTable)
      .where(eq(restaurantsTable.id, restaurantId))
      .limit(1);

    const [rows, countResult] = await Promise.all([
      db.select().from(menuItemsTable).where(eq(menuItemsTable.restaurantId, restaurantId)).orderBy(menuItemsTable.category, menuItemsTable.name).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(menuItemsTable).where(eq(menuItemsTable.restaurantId, restaurantId)),
    ]);

    res.json({
      data: rows.map(r => ({
        ...r,
        price: Number(r.price),
        restaurantName: restaurant?.name ?? "",
      })),
      total: Number(countResult[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/menu", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const { name, description, price, category, imageUrl } = req.body;
    if (!name || !price) {
      res.status(400).json({ error: "Name and price are required" });
      return;
    }

    const [restaurant] = await db.select({ name: restaurantsTable.name }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId)).limit(1);

    const [item] = await db.insert(menuItemsTable).values({
      restaurantId, name, description: description || null, price: String(price), category: category || null, imageUrl: imageUrl || null,
    }).returning();

    res.status(201).json({ ...item, price: Number(item.price), restaurantName: restaurant?.name ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/menu/:id", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const id = parseInt(req.params.id);

    const [existing] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, id)).limit(1);
    if (!existing || existing.restaurantId !== restaurantId) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    const { name, description, price, category, isAvailable, imageUrl } = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = String(price);
    if (category !== undefined) updateData.category = category;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;

    await db.update(menuItemsTable).set(updateData).where(eq(menuItemsTable.id, id));

    const [restaurant] = await db.select({ name: restaurantsTable.name }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId)).limit(1);
    const [updated] = await db.select().from(menuItemsTable).where(eq(menuItemsTable.id, id)).limit(1);

    res.json({ ...updated, price: Number(updated.price), restaurantName: restaurant?.name ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/menu/:id", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const id = parseInt(req.params.id);

    const [existing] = await db.select({ id: menuItemsTable.id, restaurantId: menuItemsTable.restaurantId }).from(menuItemsTable).where(eq(menuItemsTable.id, id)).limit(1);
    if (!existing || existing.restaurantId !== restaurantId) {
      res.status(404).json({ error: "Menu item not found" });
      return;
    }

    await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/revenue-trend", async (req, res) => {
  try {
    const restaurantId = req.user!.restaurantId!;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const rows = await db.select({
      date: sql<string>`date_trunc('day', created_at)::date`,
      revenue: sql<number>`coalesce(sum(total_amount), 0)`,
      orders: sql<number>`count(*)`,
    })
      .from(ordersTable)
      .where(and(eq(ordersTable.restaurantId, restaurantId), eq(ordersTable.status, "delivered"), gte(ordersTable.createdAt, thirtyDaysAgo)))
      .groupBy(sql`date_trunc('day', created_at)::date`)
      .orderBy(sql`date_trunc('day', created_at)::date`);

    res.json(rows.map(r => ({ date: r.date, revenue: Number(r.revenue), orders: Number(r.orders) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
