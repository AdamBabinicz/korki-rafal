import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  adminNotes: text("admin_notes"),
  defaultPrice: integer("default_price"),
});

export const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isBooked: boolean("is_booked").default(false).notNull(),
  studentId: integer("student_id").references(() => users.id),
  bookedAt: timestamp("booked_at"),
  isPaid: boolean("is_paid").default(false).notNull(),
  topic: text("topic"),
  locationType: text("location_type").default("onsite"),
  travelMinutes: integer("travel_minutes").default(0),
  notes: text("notes"),
  price: integer("price"),
  adminNotes: text("admin_notes"),
});

export const weeklySchedule = pgTable("weekly_schedule", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  studentId: integer("student_id").references(() => users.id),
  price: integer("price").notNull().default(0),
  locationType: text("location_type").default("onsite"),
  travelMinutes: integer("travel_minutes").default(0),
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  note: text("note"),
});

export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    role: true,
    name: true,
    phone: true,
    address: true,
    adminNotes: true,
    defaultPrice: true,
  })
  .extend({
    email: z.string().email("Nieprawidłowy format adresu email"),
  });

export const insertSlotSchema = createInsertSchema(slots, {
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  bookedAt: z.coerce.date().nullable(),
})
  .omit({
    id: true,
  })
  .partial({
    studentId: true,
    isBooked: true,
    bookedAt: true,
    isPaid: true,
    topic: true,
    locationType: true,
    travelMinutes: true,
    notes: true,
    price: true,
    adminNotes: true,
  });

export const insertWeeklyScheduleSchema = createInsertSchema(
  weeklySchedule
).omit({
  id: true,
});

// POPRAWKA: Dodano z.coerce.date(), aby naprawić błąd "Invalid request"
export const insertWaitlistSchema = createInsertSchema(waitlist, {
  date: z.coerce.date(),
}).omit({
  id: true,
});

export const generateSlotsSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number(),
});

export const generateFromTemplateSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const bookSlotSchema = z.object({
  topic: z.string().optional(),
  durationMinutes: z.number().min(30).max(180).default(60),
  locationType: z.enum(["onsite", "commute"]).default("onsite"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Slot = typeof slots.$inferSelect;
export type InsertSlot = z.infer<typeof insertSlotSchema>;
export type WeeklySchedule = typeof weeklySchedule.$inferSelect;
export type InsertWeeklySchedule = z.infer<typeof insertWeeklyScheduleSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
