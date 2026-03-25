import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurantRequestsTable = pgTable("restaurant_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cuisine: text("cuisine").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  email: text("email").notNull(),
  description: text("description"),
  ownerName: text("owner_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("pending"),
  reviewerNotes: text("reviewer_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertRestaurantRequestSchema = createInsertSchema(restaurantRequestsTable).omit({ id: true, createdAt: true, reviewedAt: true });
export type InsertRestaurantRequest = z.infer<typeof insertRestaurantRequestSchema>;
export type RestaurantRequestRecord = typeof restaurantRequestsTable.$inferSelect;
