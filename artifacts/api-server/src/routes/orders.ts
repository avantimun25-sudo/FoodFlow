import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, customersTable, restaurantsTable, driversTable, paymentsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const restaurantId = req.query.restaurantId ? Number(req.query.restaurantId) : undefined;

  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (restaurantId) conditions.push(eq(ordersTable.restaurantId, restaurantId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [orders, countResult] = await Promise.all([
    db
      .select({
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
        driverName: driversTable.name,
      })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
      .leftJoin(driversTable, eq(ordersTable.driverId, driversTable.id))
      .where(whereClause)
      .orderBy(desc(ordersTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(whereClause),
  ]);

  res.json({ data: orders, total: countResult[0]?.count ?? 0, page, limit });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [order] = await db
    .select({
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
      driverName: driversTable.name,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
    .leftJoin(driversTable, eq(ordersTable.driverId, driversTable.id))
    .where(eq(ordersTable.id, id));

  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

router.post("/", async (req, res) => {
  const { customerId, restaurantId, driverId, totalAmount, deliveryAddress, notes } = req.body;
  const [order] = await db
    .insert(ordersTable)
    .values({ customerId, restaurantId, driverId: driverId ?? null, totalAmount: String(totalAmount), deliveryAddress, notes, status: "pending" })
    .returning();

  await db.insert(paymentsTable).values({ orderId: order.id, amount: String(totalAmount), method: "card", status: "pending" });

  await db.update(customersTable)
    .set({ totalOrders: sql`${customersTable.totalOrders} + 1`, updatedAt: new Date() })
    .where(eq(customersTable.id, customerId));

  await db.update(restaurantsTable)
    .set({ totalOrders: sql`${restaurantsTable.totalOrders} + 1`, updatedAt: new Date() })
    .where(eq(restaurantsTable.id, restaurantId));

  const [result] = await db.select({
    id: ordersTable.id, customerId: ordersTable.customerId, restaurantId: ordersTable.restaurantId,
    driverId: ordersTable.driverId, status: ordersTable.status, totalAmount: ordersTable.totalAmount,
    deliveryAddress: ordersTable.deliveryAddress, notes: ordersTable.notes,
    createdAt: ordersTable.createdAt, updatedAt: ordersTable.updatedAt,
    customerName: customersTable.name, restaurantName: restaurantsTable.name, driverName: driversTable.name,
  }).from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
    .leftJoin(driversTable, eq(ordersTable.driverId, driversTable.id))
    .where(eq(ordersTable.id, order.id));

  res.status(201).json(result);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status, driverId } = req.body;

  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (driverId !== undefined) updateData.driverId = driverId;

  const [prevOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!prevOrder) return res.status(404).json({ error: "Order not found" });

  await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, id));

  if (status === "delivered" && prevOrder.status !== "delivered") {
    await db.update(restaurantsTable)
      .set({ totalRevenue: sql`${restaurantsTable.totalRevenue} + ${prevOrder.totalAmount}`, updatedAt: new Date() })
      .where(eq(restaurantsTable.id, prevOrder.restaurantId));

    await db.update(customersTable)
      .set({ totalSpent: sql`${customersTable.totalSpent} + ${prevOrder.totalAmount}`, updatedAt: new Date() })
      .where(eq(customersTable.id, prevOrder.customerId));

    if (prevOrder.driverId) {
      const commission = Number(prevOrder.totalAmount) * 0.1;
      await db.update(driversTable)
        .set({
          totalDeliveries: sql`${driversTable.totalDeliveries} + 1`,
          totalEarnings: sql`${driversTable.totalEarnings} + ${commission}`,
          updatedAt: new Date(),
        })
        .where(eq(driversTable.id, prevOrder.driverId));
    }

    await db.update(paymentsTable)
      .set({ status: "completed" })
      .where(eq(paymentsTable.orderId, id));
  }

  if (status === "cancelled" && prevOrder.status !== "cancelled") {
    await db.update(paymentsTable)
      .set({ status: "refunded" })
      .where(eq(paymentsTable.orderId, id));

    await db.update(customersTable)
      .set({ totalOrders: sql`${customersTable.totalOrders} - 1`, updatedAt: new Date() })
      .where(eq(customersTable.id, prevOrder.customerId));

    await db.update(restaurantsTable)
      .set({ totalOrders: sql`${restaurantsTable.totalOrders} - 1`, updatedAt: new Date() })
      .where(eq(restaurantsTable.id, prevOrder.restaurantId));
  }

  const [updated] = await db.select({
    id: ordersTable.id, customerId: ordersTable.customerId, restaurantId: ordersTable.restaurantId,
    driverId: ordersTable.driverId, status: ordersTable.status, totalAmount: ordersTable.totalAmount,
    deliveryAddress: ordersTable.deliveryAddress, notes: ordersTable.notes,
    createdAt: ordersTable.createdAt, updatedAt: ordersTable.updatedAt,
    customerName: customersTable.name, restaurantName: restaurantsTable.name, driverName: driversTable.name,
  }).from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
    .leftJoin(driversTable, eq(ordersTable.driverId, driversTable.id))
    .where(eq(ordersTable.id, id));

  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(paymentsTable).where(eq(paymentsTable.orderId, id));
  await db.delete(ordersTable).where(eq(ordersTable.id, id));
  res.status(204).send();
});

export default router;
