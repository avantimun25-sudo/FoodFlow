import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, customersTable, restaurantsTable, menuItemsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth";

const router = Router();

// ─── Customer Register ────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const [existingUser] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
    if (existingUser) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with role "customer"
    const [user] = await db.insert(usersTable).values({
      email: normalizedEmail,
      passwordHash,
      role: "customer",
      restaurantId: null,
    }).returning();

    // Create customer record
    const [customer] = await db.insert(customersTable).values({
      name,
      email: normalizedEmail,
      phone: phone || null,
      address: address || null,
    }).returning();

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: null,
    });

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Customer Login ───────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const normalizedEmail = email.toLowerCase();

    const [user] = await db.select().from(usersTable).where(
      and(eq(usersTable.email, normalizedEmail), eq(usersTable.role, "customer"))
    ).limit(1);

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, normalizedEmail)).limit(1);
    if (!customer) {
      res.status(401).json({ error: "Customer record not found" });
      return;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      restaurantId: null,
    });

    res.json({
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── List Restaurants ─────────────────────────────────────────────────────────
router.get("/restaurants", async (req, res) => {
  try {
    const { search, cuisine } = req.query;

    let query = db.select().from(restaurantsTable).where(eq(restaurantsTable.isActive, true));

    const conditions = [eq(restaurantsTable.isActive, true)];

    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(restaurantsTable.name, `%${search}%`),
          ilike(restaurantsTable.cuisine, `%${search}%`)
        ) as any
      );
    }

    if (cuisine && typeof cuisine === "string" && cuisine !== "All") {
      conditions.push(ilike(restaurantsTable.cuisine, `%${cuisine}%`));
    }

    const restaurants = await db.select().from(restaurantsTable).where(
      conditions.length > 1 ? and(...conditions) : conditions[0]
    );

    res.json({
      data: restaurants.map(r => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        phone: r.phone,
        rating: r.rating ? parseFloat(r.rating) : null,
        isActive: r.isActive,
        totalOrders: r.totalOrders,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Get Restaurant Menu ──────────────────────────────────────────────────────
router.get("/restaurants/:id/menu", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid restaurant id" });
      return;
    }

    const [restaurant] = await db.select().from(restaurantsTable).where(
      and(eq(restaurantsTable.id, id), eq(restaurantsTable.isActive, true))
    ).limit(1);

    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }

    const items = await db.select().from(menuItemsTable).where(
      and(eq(menuItemsTable.restaurantId, id), eq(menuItemsTable.isAvailable, true))
    );

    res.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        phone: restaurant.phone,
        rating: restaurant.rating ? parseFloat(restaurant.rating) : null,
        isActive: restaurant.isActive,
        totalOrders: restaurant.totalOrders,
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        category: item.category,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Customer auth middleware ─────────────────────────────────────────────────
function requireCustomer(req: any, res: any, next: any) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "customer") {
      res.status(403).json({ error: "Customer access required" });
      return;
    }
    next();
  });
}

// ─── Place Order ──────────────────────────────────────────────────────────────
router.post("/orders", requireCustomer, async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, notes } = req.body;

    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      res.status(400).json({ error: "restaurantId, items, and deliveryAddress are required" });
      return;
    }

    // Find the customer record
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, req.user!.email)).limit(1);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // Create order
    const [order] = await db.insert(ordersTable).values({
      customerId: customer.id,
      restaurantId,
      status: "pending",
      totalAmount: totalAmount.toFixed(2),
      deliveryAddress,
      notes: notes || null,
    }).returning();

    // Create order items
    await db.insert(orderItemsTable).values(
      items.map((item: any) => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price.toFixed(2),
      }))
    );

    // Update customer totals
    await db.update(customersTable).set({
      totalOrders: sql`${customersTable.totalOrders} + 1`,
      totalSpent: sql`${customersTable.totalSpent} + ${totalAmount.toFixed(2)}`,
    }).where(eq(customersTable.id, customer.id));

    // Update restaurant totals
    await db.update(restaurantsTable).set({
      totalOrders: sql`${restaurantsTable.totalOrders} + 1`,
      totalRevenue: sql`${restaurantsTable.totalRevenue} + ${totalAmount.toFixed(2)}`,
    }).where(eq(restaurantsTable.id, restaurantId));

    // Fetch restaurant name
    const [restaurant] = await db.select({ name: restaurantsTable.name }).from(restaurantsTable).where(eq(restaurantsTable.id, restaurantId)).limit(1);

    res.json({
      id: order.id,
      restaurantId: order.restaurantId,
      restaurantName: restaurant?.name ?? "",
      status: order.status,
      totalAmount: parseFloat(order.totalAmount),
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      items: items.map((item: any) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Get My Orders ────────────────────────────────────────────────────────────
router.get("/orders", requireCustomer, async (req, res) => {
  try {
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, req.user!.email)).limit(1);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const orders = await db.select().from(ordersTable).where(eq(ordersTable.customerId, customer.id));

    const restaurantIds = [...new Set(orders.map(o => o.restaurantId))];
    const restaurants = restaurantIds.length > 0
      ? await db.select({ id: restaurantsTable.id, name: restaurantsTable.name }).from(restaurantsTable)
      : [];
    const restaurantMap = new Map(restaurants.map(r => [r.id, r.name]));

    const orderIds = orders.map(o => o.id);
    const allItems = orderIds.length > 0
      ? await db.select().from(orderItemsTable).where(
          sql`${orderItemsTable.orderId} = ANY(${sql.raw(`ARRAY[${orderIds.join(",")}]::integer[]`)})`
        )
      : [];

    const itemsByOrder = new Map<number, typeof allItems>();
    for (const item of allItems) {
      if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
      itemsByOrder.get(item.orderId)!.push(item);
    }

    const data = orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(order => ({
        id: order.id,
        restaurantId: order.restaurantId,
        restaurantName: restaurantMap.get(order.restaurantId) ?? "",
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        items: (itemsByOrder.get(order.id) ?? []).map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
        createdAt: order.createdAt.toISOString(),
      }));

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Get Single Order ─────────────────────────────────────────────────────────
router.get("/orders/:id", requireCustomer, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    if (isNaN(orderId)) {
      res.status(400).json({ error: "Invalid order id" });
      return;
    }

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.email, req.user!.email)).limit(1);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const [order] = await db.select().from(ordersTable).where(
      and(eq(ordersTable.id, orderId), eq(ordersTable.customerId, customer.id))
    ).limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const [restaurant] = await db.select({ name: restaurantsTable.name }).from(restaurantsTable).where(eq(restaurantsTable.id, order.restaurantId)).limit(1);
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

    res.json({
      id: order.id,
      restaurantId: order.restaurantId,
      restaurantName: restaurant?.name ?? "",
      status: order.status,
      totalAmount: parseFloat(order.totalAmount),
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
      })),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
