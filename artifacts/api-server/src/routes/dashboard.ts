import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ordersTable, customersTable, restaurantsTable, driversTable, paymentsTable } from "@workspace/db";
import { sql, gte, lt, and, eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalRevenueResult,
    totalOrdersResult,
    totalCustomersResult,
    totalRestaurantsResult,
    totalDriversResult,
    activeOrdersResult,
    avgOrderResult,
    thisMonthRevenueResult,
    lastMonthRevenueResult,
    thisMonthOrdersResult,
    lastMonthOrdersResult,
    thisMonthCustomersResult,
    lastMonthCustomersResult,
  ] = await Promise.all([
    db.select({ v: sql<number>`coalesce(sum(amount)::numeric, 0)` }).from(paymentsTable).where(eq(paymentsTable.status, "completed")),
    db.select({ v: sql<number>`count(*)::int` }).from(ordersTable),
    db.select({ v: sql<number>`count(*)::int` }).from(customersTable),
    db.select({ v: sql<number>`count(*)::int` }).from(restaurantsTable),
    db.select({ v: sql<number>`count(*)::int` }).from(driversTable),
    db.select({ v: sql<number>`count(*)::int` }).from(ordersTable).where(
      sql`${ordersTable.status} in ('pending', 'confirmed', 'preparing', 'out_for_delivery')`
    ),
    db.select({ v: sql<number>`coalesce(avg(total_amount)::numeric, 0)` }).from(ordersTable),
    db.select({ v: sql<number>`coalesce(sum(amount)::numeric, 0)` }).from(paymentsTable).where(and(eq(paymentsTable.status, "completed"), gte(paymentsTable.createdAt, thisMonthStart))),
    db.select({ v: sql<number>`coalesce(sum(amount)::numeric, 0)` }).from(paymentsTable).where(and(eq(paymentsTable.status, "completed"), gte(paymentsTable.createdAt, lastMonthStart), lt(paymentsTable.createdAt, thisMonthStart))),
    db.select({ v: sql<number>`count(*)::int` }).from(ordersTable).where(gte(ordersTable.createdAt, thisMonthStart)),
    db.select({ v: sql<number>`count(*)::int` }).from(ordersTable).where(and(gte(ordersTable.createdAt, lastMonthStart), lt(ordersTable.createdAt, thisMonthStart))),
    db.select({ v: sql<number>`count(*)::int` }).from(customersTable).where(gte(customersTable.createdAt, thisMonthStart)),
    db.select({ v: sql<number>`count(*)::int` }).from(customersTable).where(and(gte(customersTable.createdAt, lastMonthStart), lt(customersTable.createdAt, thisMonthStart))),
  ]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Number((((curr - prev) / prev) * 100).toFixed(1));
  };

  res.json({
    totalRevenue: Number(totalRevenueResult[0]?.v ?? 0),
    totalOrders: totalOrdersResult[0]?.v ?? 0,
    totalCustomers: totalCustomersResult[0]?.v ?? 0,
    totalRestaurants: totalRestaurantsResult[0]?.v ?? 0,
    totalDrivers: totalDriversResult[0]?.v ?? 0,
    activeOrders: activeOrdersResult[0]?.v ?? 0,
    avgOrderValue: Number(Number(avgOrderResult[0]?.v ?? 0).toFixed(2)),
    revenueGrowth: pctChange(Number(thisMonthRevenueResult[0]?.v ?? 0), Number(lastMonthRevenueResult[0]?.v ?? 0)),
    ordersGrowth: pctChange(thisMonthOrdersResult[0]?.v ?? 0, lastMonthOrdersResult[0]?.v ?? 0),
    customersGrowth: pctChange(thisMonthCustomersResult[0]?.v ?? 0, lastMonthCustomersResult[0]?.v ?? 0),
  });
});

router.get("/revenue-trend", async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [revenueRows, orderRows] = await Promise.all([
    db.execute(sql`
      SELECT date_trunc('day', created_at)::date::text as date,
             coalesce(sum(amount), 0)::numeric as revenue
      FROM payments
      WHERE created_at >= ${thirtyDaysAgo} AND status = 'completed'
      GROUP BY 1 ORDER BY 1
    `),
    db.execute(sql`
      SELECT date_trunc('day', created_at)::date::text as date,
             count(*)::int as orders
      FROM orders
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY 1 ORDER BY 1
    `),
  ]);

  const revenueMap = new Map<string, number>();
  const orderMap = new Map<string, number>();

  for (const row of revenueRows.rows) {
    revenueMap.set(row.date as string, Number(row.revenue));
  }
  for (const row of orderRows.rows) {
    orderMap.set(row.date as string, Number(row.orders));
  }

  const allDates = new Set([...revenueMap.keys(), ...orderMap.keys()]);
  const result = Array.from(allDates).sort().map(date => ({
    date,
    revenue: revenueMap.get(date) ?? 0,
    orders: orderMap.get(date) ?? 0,
  }));

  res.json(result);
});

router.get("/order-status-distribution", async (req, res) => {
  const rows = await db.execute(sql`
    SELECT status, count(*)::int as count
    FROM orders
    GROUP BY status
    ORDER BY count DESC
  `);

  res.json(rows.rows.map(r => ({ status: r.status, count: r.count })));
});

router.get("/top-restaurants", async (req, res) => {
  const rows = await db.execute(sql`
    SELECT r.id, r.name, r.total_revenue::numeric as revenue, r.total_orders as orders
    FROM restaurants r
    ORDER BY r.total_revenue DESC
    LIMIT 10
  `);

  res.json(rows.rows.map(r => ({
    id: r.id,
    name: r.name,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  })));
});

router.get("/orders-by-hour", async (req, res) => {
  const rows = await db.execute(sql`
    SELECT extract(hour from created_at)::int as hour, count(*)::int as orders
    FROM orders
    GROUP BY 1
    ORDER BY 1
  `);

  const hourMap = new Map<number, number>();
  for (const row of rows.rows) {
    hourMap.set(Number(row.hour), Number(row.orders));
  }

  const result = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    orders: hourMap.get(h) ?? 0,
  }));

  res.json(result);
});

export default router;
