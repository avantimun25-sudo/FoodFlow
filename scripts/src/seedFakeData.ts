import {
  db,
  restaurantsTable,
  usersTable,
  customersTable,
  driversTable,
  menuItemsTable,
  ordersTable,
  paymentsTable,
  restaurantRequestsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// ─── Restaurant definitions ───────────────────────────────────────────────────
const RESTAURANTS = [
  {
    name: "Burger Palace",
    cuisine: "American",
    address: "142 Main Street, Brooklyn, NY 11201",
    phone: "718-555-0101",
    email: "hello@burgerpalace.com",
    rating: "4.7",
    ownerEmail: "sarah@burgerpalace.com",
    ownerName: "Sarah",
    ownerPassword: "burger2024",
    menu: [
      { name: "Classic Smash Burger", description: "Double smash patty, American cheese, pickles, special sauce", price: "13.99", category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
      { name: "BBQ Bacon Burger", description: "Smoky BBQ sauce, crispy bacon, cheddar, fried onions", price: "15.99", category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400" },
      { name: "Mushroom Swiss Burger", description: "Sautéed mushrooms, Swiss cheese, garlic aioli", price: "14.99", category: "Burgers", imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400" },
      { name: "Loaded Cheese Fries", description: "Crispy fries, cheddar sauce, jalapeños, sour cream", price: "7.99", category: "Sides", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
      { name: "Onion Rings", description: "Beer-battered thick-cut onion rings", price: "5.99", category: "Sides", imageUrl: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400" },
      { name: "Chocolate Milkshake", description: "Thick hand-spun chocolate milkshake", price: "6.99", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400" },
    ],
  },
  {
    name: "Sakura Sushi",
    cuisine: "Japanese",
    address: "88 Cherry Blossom Ave, San Francisco, CA 94103",
    phone: "415-555-0202",
    email: "info@sakurasushi.com",
    rating: "4.9",
    ownerEmail: "kenji@sakurasushi.com",
    ownerName: "Kenji",
    ownerPassword: "sushi2024",
    menu: [
      { name: "Dragon Roll", description: "Shrimp tempura, avocado, cucumber, topped with fresh tuna", price: "17.99", category: "Rolls", imageUrl: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400" },
      { name: "Salmon Nigiri (2pc)", description: "Fresh Atlantic salmon over seasoned sushi rice", price: "8.99", category: "Nigiri", imageUrl: "https://images.unsplash.com/photo-1617196034738-26c5f7c977ce?w=400" },
      { name: "Spicy Tuna Roll", description: "Fresh tuna, spicy mayo, cucumber, sesame", price: "13.99", category: "Rolls", imageUrl: "https://images.unsplash.com/photo-1617196034099-bec8f935b6b3?w=400" },
      { name: "Edamame", description: "Steamed salted edamame pods", price: "4.99", category: "Starters", imageUrl: "https://images.unsplash.com/photo-1551248429-40975aa4de74?w=400" },
      { name: "Miso Soup", description: "Traditional miso broth with tofu and wakame", price: "3.99", category: "Starters", imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" },
      { name: "Matcha Ice Cream", description: "Premium Japanese matcha ice cream", price: "5.99", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=400" },
    ],
  },
  {
    name: "Bella Italia",
    cuisine: "Italian",
    address: "22 Via Roma, Chicago, IL 60601",
    phone: "312-555-0303",
    email: "ciao@bellaitalia.com",
    rating: "4.6",
    ownerEmail: "marco@bellaitalia.com",
    ownerName: "Marco",
    ownerPassword: "pizza2024",
    menu: [
      { name: "Margherita Pizza", description: "San Marzano tomatoes, fresh mozzarella, basil, olive oil", price: "14.99", category: "Pizza", imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400" },
      { name: "Truffle Carbonara", description: "Spaghetti, guanciale, eggs, pecorino, black truffle", price: "19.99", category: "Pasta", imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400" },
      { name: "Penne Arrabbiata", description: "Penne, spicy tomato sauce, garlic, parsley", price: "13.99", category: "Pasta", imageUrl: "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400" },
      { name: "Bruschetta al Pomodoro", description: "Grilled bread, Roma tomatoes, garlic, fresh basil", price: "8.99", category: "Starters", imageUrl: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400" },
      { name: "Tiramisu", description: "Classic Italian tiramisu with mascarpone and espresso", price: "7.99", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400" },
      { name: "Panna Cotta", description: "Vanilla panna cotta with mixed berry coulis", price: "6.99", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400" },
    ],
  },
  {
    name: "Spice Garden",
    cuisine: "Indian",
    address: "55 Curry Lane, Houston, TX 77002",
    phone: "713-555-0404",
    email: "namaste@spicegarden.com",
    rating: "4.8",
    ownerEmail: "priya@spicegarden.com",
    ownerName: "Priya",
    ownerPassword: "spice2024",
    menu: [
      { name: "Butter Chicken", description: "Tender chicken in rich tomato-butter sauce, served with naan", price: "16.99", category: "Mains", imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400" },
      { name: "Lamb Biryani", description: "Fragrant basmati rice with slow-cooked spiced lamb", price: "18.99", category: "Mains", imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400" },
      { name: "Palak Paneer", description: "Cottage cheese cubes in creamy spinach gravy", price: "14.99", category: "Vegetarian", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400" },
      { name: "Samosa (4pc)", description: "Crispy pastry filled with spiced potatoes and peas", price: "6.99", category: "Starters", imageUrl: "https://images.unsplash.com/photo-1601050690117-94f5f7a89b69?w=400" },
      { name: "Garlic Naan", description: "Tandoor-baked flatbread with garlic and butter", price: "3.99", category: "Bread", imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400" },
      { name: "Mango Lassi", description: "Chilled yogurt drink blended with Alphonso mangoes", price: "4.99", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400" },
    ],
  },
  {
    name: "Taco Fiesta",
    cuisine: "Mexican",
    address: "9 Calle Jalisco, Los Angeles, CA 90012",
    phone: "213-555-0505",
    email: "hola@tacofiesta.com",
    rating: "4.5",
    ownerEmail: "carlos@tacofiesta.com",
    ownerName: "Carlos",
    ownerPassword: "taco2024",
    menu: [
      { name: "Al Pastor Tacos (3pc)", description: "Marinated pork, pineapple, cilantro, onion, salsa verde", price: "12.99", category: "Tacos", imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400" },
      { name: "Carne Asada Burrito", description: "Grilled steak, rice, beans, cheese, guacamole, pico de gallo", price: "14.99", category: "Burritos", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400" },
      { name: "Chicken Quesadilla", description: "Grilled chicken, Oaxaca cheese, peppers, sour cream", price: "11.99", category: "Quesadillas", imageUrl: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400" },
      { name: "Guacamole & Chips", description: "Fresh hand-mashed guacamole with tortilla chips", price: "7.99", category: "Starters", imageUrl: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400" },
      { name: "Elote (Street Corn)", description: "Grilled corn, cotija cheese, chili, lime, crema", price: "5.99", category: "Sides", imageUrl: "https://images.unsplash.com/photo-1600454301822-0dd57f7e8ed5?w=400" },
      { name: "Horchata", description: "Chilled rice milk with cinnamon and vanilla", price: "3.99", category: "Drinks", imageUrl: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=400" },
    ],
  },
];

// ─── Customers ────────────────────────────────────────────────────────────────
const CUSTOMERS = [
  { name: "Emily Chen", email: "emily.chen@example.com", phone: "212-555-1001", address: "45 Park Ave, New York, NY" },
  { name: "James Walker", email: "james.walker@example.com", phone: "310-555-1002", address: "12 Sunset Blvd, Los Angeles, CA" },
  { name: "Sofia Martinez", email: "sofia.m@example.com", phone: "415-555-1003", address: "88 Haight St, San Francisco, CA" },
  { name: "Liam Johnson", email: "liam.j@example.com", phone: "312-555-1004", address: "30 Michigan Ave, Chicago, IL" },
  { name: "Ava Williams", email: "ava.w@example.com", phone: "713-555-1005", address: "77 Travis St, Houston, TX" },
  { name: "Noah Brown", email: "noah.b@example.com", phone: "602-555-1006", address: "200 Central Ave, Phoenix, AZ" },
  { name: "Isabella Davis", email: "isabella.d@example.com", phone: "215-555-1007", address: "1 Market St, Philadelphia, PA" },
  { name: "Mason Wilson", email: "mason.w@example.com", phone: "210-555-1008", address: "500 Alamo St, San Antonio, TX" },
  { name: "Charlotte Taylor", email: "charlotte.t@example.com", phone: "619-555-1009", address: "300 Harbor Dr, San Diego, CA" },
  { name: "Ethan Anderson", email: "ethan.a@example.com", phone: "214-555-1010", address: "100 Commerce St, Dallas, TX" },
  { name: "Mia Thomas", email: "mia.t@example.com", phone: "408-555-1011", address: "350 Stevens Creek, San Jose, CA" },
  { name: "Alexander Harris", email: "alex.h@example.com", phone: "512-555-1012", address: "600 Congress Ave, Austin, TX" },
];

// ─── Drivers ──────────────────────────────────────────────────────────────────
const DRIVERS = [
  { name: "Marcus Reid", email: "marcus.r@driver.com", phone: "646-555-2001", vehicle: "Toyota Prius", licensePlate: "NYK-4821", status: "available", rating: "4.9" },
  { name: "Jasmine Park", email: "jasmine.p@driver.com", phone: "424-555-2002", vehicle: "Honda Civic", licensePlate: "CAL-7743", status: "on_delivery", rating: "4.8" },
  { name: "Derek Nguyen", email: "derek.n@driver.com", phone: "415-555-2003", vehicle: "Ford Fusion", licensePlate: "SFO-1192", status: "available", rating: "4.7" },
  { name: "Tanya Brooks", email: "tanya.b@driver.com", phone: "312-555-2004", vehicle: "Chevy Malibu", licensePlate: "CHI-5530", status: "offline", rating: "4.6" },
  { name: "Raj Patel", email: "raj.p@driver.com", phone: "713-555-2005", vehicle: "Nissan Altima", licensePlate: "TEX-8812", status: "available", rating: "4.9" },
  { name: "Chloe Bennett", email: "chloe.b@driver.com", phone: "602-555-2006", vehicle: "Toyota Corolla", licensePlate: "ARZ-3341", status: "on_delivery", rating: "4.8" },
];

const ORDER_STATUSES = ["delivered", "delivered", "delivered", "delivered", "preparing", "out_for_delivery", "confirmed", "cancelled"] as const;
const PAYMENT_METHODS = ["card", "card", "card", "apple_pay", "google_pay", "cash"] as const;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(randomBetween(10, 22)), Math.floor(randomBetween(0, 59)), 0, 0);
  return d;
}

async function main() {
  // Guard: skip if data already exists
  const existing = await db.select({ id: restaurantsTable.id }).from(restaurantsTable).limit(1);
  if (existing.length > 0) {
    console.log("✅ Fake data already seeded, skipping.");
    process.exit(0);
  }

  console.log("🌱 Seeding fake data...\n");

  // ── 1. Restaurants + portal users ────────────────────────────────────────
  const restaurantIds: number[] = [];
  const credLines: string[] = [
    "=== FOODADMIN RESTAURANT CREDENTIALS ===",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "ADMIN",
    "  Email:    admin@foodadmin.com",
    "  Password: admin123",
    "  URL:      /login",
    "",
    "─".repeat(46),
    "RESTAURANTS (login at /login)",
    "─".repeat(46),
  ];

  for (const r of RESTAURANTS) {
    const [restaurant] = await db
      .insert(restaurantsTable)
      .values({
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        phone: r.phone,
        email: r.email,
        isActive: true,
        rating: r.rating,
      })
      .returning({ id: restaurantsTable.id });

    restaurantIds.push(restaurant.id);

    const passwordHash = await bcrypt.hash(r.ownerPassword, 10);
    const existingUser = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, r.ownerEmail)).limit(1);
    if (existingUser.length === 0) {
      await db.insert(usersTable).values({
        email: r.ownerEmail,
        passwordHash,
        role: "restaurant",
        restaurantId: restaurant.id,
      });
    }

    await db.insert(restaurantRequestsTable).values({
      name: r.name,
      cuisine: r.cuisine,
      address: r.address,
      phone: r.phone,
      email: r.email,
      description: `${r.cuisine} restaurant`,
      ownerName: r.ownerName,
      passwordHash,
      status: "approved",
      reviewedAt: new Date(),
    });

    credLines.push(
      "",
      `${r.name}`,
      `  Cuisine:  ${r.cuisine}`,
      `  Address:  ${r.address}`,
      `  Email:    ${r.ownerEmail}`,
      `  Password: ${r.ownerPassword}`,
    );

    console.log(`  ✓ Restaurant: ${r.name} (id=${restaurant.id})`);
  }

  // ── 2. Menu items ─────────────────────────────────────────────────────────
  for (let i = 0; i < RESTAURANTS.length; i++) {
    for (const item of RESTAURANTS[i].menu) {
      await db.insert(menuItemsTable).values({
        restaurantId: restaurantIds[i],
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        isAvailable: true,
      });
    }
    console.log(`  ✓ Menu items: ${RESTAURANTS[i].name} (${RESTAURANTS[i].menu.length} items)`);
  }

  // ── 3. Customers ──────────────────────────────────────────────────────────
  const CUSTOMER_PASSWORD = "customer123";
  const customerPasswordHash = await bcrypt.hash(CUSTOMER_PASSWORD, 10);
  const customerIds: number[] = [];
  for (const c of CUSTOMERS) {
    const existing = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.email, c.email)).limit(1);
    if (existing.length > 0) {
      customerIds.push(existing[0].id);
      // Ensure user record exists for login
      const existingUser = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, c.email)).limit(1);
      if (existingUser.length === 0) {
        await db.insert(usersTable).values({ email: c.email, passwordHash: customerPasswordHash, role: "customer", restaurantId: null });
      }
    } else {
      const [customer] = await db.insert(customersTable).values(c).returning({ id: customersTable.id });
      customerIds.push(customer.id);
      await db.insert(usersTable).values({ email: c.email, passwordHash: customerPasswordHash, role: "customer", restaurantId: null });
    }
  }
  console.log(`  ✓ Customers: ${CUSTOMERS.length} (password: ${CUSTOMER_PASSWORD})`);

  // ── 4. Drivers ────────────────────────────────────────────────────────────
  const driverIds: number[] = [];
  for (const d of DRIVERS) {
    const existing = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.email, d.email)).limit(1);
    if (existing.length > 0) {
      driverIds.push(existing[0].id);
    } else {
      const [driver] = await db.insert(driversTable).values(d).returning({ id: driversTable.id });
      driverIds.push(driver.id);
    }
  }
  console.log(`  ✓ Drivers: ${DRIVERS.length}`);

  // ── 5. Orders + Payments ──────────────────────────────────────────────────
  const ORDERS_PER_RESTAURANT = 20;
  const deliveryAddresses = CUSTOMERS.map((c) => c.address!);

  for (let ri = 0; ri < restaurantIds.length; ri++) {
    const restaurantId = restaurantIds[ri];
    let restaurantRevenue = 0;
    let restaurantOrders = 0;

    for (let o = 0; o < ORDERS_PER_RESTAURANT; o++) {
      const customerId = pickRandom(customerIds);
      const driverId = pickRandom(driverIds);
      const status = pickRandom(ORDER_STATUSES);
      const totalAmount = parseFloat(randomBetween(12, 65).toFixed(2));
      const createdAt = daysAgo(Math.floor(randomBetween(0, 30)));

      const [order] = await db
        .insert(ordersTable)
        .values({
          customerId,
          restaurantId,
          driverId,
          status,
          totalAmount: totalAmount.toString(),
          deliveryAddress: pickRandom(deliveryAddresses),
          createdAt,
          updatedAt: createdAt,
        })
        .returning({ id: ordersTable.id });

      const paymentStatus = status === "delivered" ? "completed" : status === "cancelled" ? "refunded" : "pending";
      await db.insert(paymentsTable).values({
        orderId: order.id,
        amount: totalAmount.toString(),
        method: pickRandom(PAYMENT_METHODS),
        status: paymentStatus,
        transactionId: `txn_${Math.random().toString(36).slice(2, 14)}`,
        createdAt,
      });

      if (status === "delivered") {
        restaurantRevenue += totalAmount;
        restaurantOrders++;

        // update customer totals
        await db
          .update(customersTable)
          .set({
            totalOrders: sql`${customersTable.totalOrders} + 1`,
            totalSpent: sql`${customersTable.totalSpent} + ${totalAmount}`,
          })
          .where(eq(customersTable.id, customerId));

        // update driver totals
        const driverEarnings = parseFloat((totalAmount * 0.15).toFixed(2));
        await db
          .update(driversTable)
          .set({
            totalDeliveries: sql`${driversTable.totalDeliveries} + 1`,
            totalEarnings: sql`${driversTable.totalEarnings} + ${driverEarnings}`,
          })
          .where(eq(driversTable.id, driverId));
      }
    }

    // update restaurant totals
    await db
      .update(restaurantsTable)
      .set({
        totalOrders: restaurantOrders,
        totalRevenue: restaurantRevenue.toFixed(2),
      })
      .where(eq(restaurantsTable.id, restaurantId));

    console.log(`  ✓ Orders: ${RESTAURANTS[ri].name} (${ORDERS_PER_RESTAURANT} orders, ${restaurantOrders} delivered, $${restaurantRevenue.toFixed(2)} revenue)`);
  }

  // ── 6. Write credentials file ─────────────────────────────────────────────
  credLines.push("", "─".repeat(46));
  const credContent = credLines.join("\n") + "\n";
  const credPath = path.join(process.cwd(), "..", "restaurant-credentials.txt");
  fs.writeFileSync(credPath, credContent, "utf8");
  console.log(`\n  ✓ Credentials written to: restaurant-credentials.txt`);

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
