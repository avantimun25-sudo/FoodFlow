import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { paymentsTable, ordersTable, customersTable, restaurantsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const whereClause = status ? eq(paymentsTable.status, status) : undefined;

  const [payments, countResult] = await Promise.all([
    db
      .select({
        id: paymentsTable.id,
        orderId: paymentsTable.orderId,
        amount: paymentsTable.amount,
        method: paymentsTable.method,
        status: paymentsTable.status,
        transactionId: paymentsTable.transactionId,
        createdAt: paymentsTable.createdAt,
        customerName: customersTable.name,
        restaurantName: restaurantsTable.name,
      })
      .from(paymentsTable)
      .leftJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .leftJoin(restaurantsTable, eq(ordersTable.restaurantId, restaurantsTable.id))
      .where(whereClause)
      .orderBy(paymentsTable.id)
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(paymentsTable).where(whereClause),
  ]);

  res.json({ data: payments, total: countResult[0]?.count ?? 0, page, limit });
});

export default router;
