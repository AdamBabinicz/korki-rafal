import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // 'admin' | 'student'
  name: text("name").notNull(),
});

export const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false).notNull(),
  studentId: integer("student_id").references(() => users.id),
  isPaid: boolean("is_paid").default(false).notNull(),
  topic: text("topic"),
  notes: text("notes"), // Private admin notes
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
});

export const insertSlotSchema = createInsertSchema(slots).omit({
  id: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Slot = typeof slots.$inferSelect;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;

// Custom types for API
export const generateSlotsSchema = z.object({
  startDate: z.string(), // ISO date
  endDate: z.string(), // ISO date
  startTime: z.string(), // "16:00"
  endTime: z.string(), // "20:00"
  duration: z.number(), // minutes
});
