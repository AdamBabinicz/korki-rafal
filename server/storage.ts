import {
  users,
  slots,
  weeklySchedule,
  waitlist,
  type User,
  type InsertUser,
  type Slot,
  type InsertSlot,
  type WeeklySchedule,
  type InsertWeeklySchedule,
  type Waitlist,
  type InsertWaitlist,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  getSlot(id: number): Promise<Slot | undefined>;
  getSlots(start?: Date, end?: Date): Promise<Slot[]>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  updateSlot(id: number, slot: Partial<InsertSlot>): Promise<Slot>;
  deleteSlot(id: number): Promise<void>;

  getWeeklySchedule(): Promise<(WeeklySchedule & { student?: User | null })[]>;
  createWeeklyScheduleItem(item: InsertWeeklySchedule): Promise<WeeklySchedule>;
  deleteWeeklyScheduleItem(id: number): Promise<void>;

  addToWaitlist(item: InsertWaitlist): Promise<Waitlist>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    // 1. Zwalniamy sloty przypisane do ucznia
    await db
      .update(slots)
      .set({ isBooked: false, studentId: null, isPaid: false, topic: null })
      .where(eq(slots.studentId, id));

    // 2. Usuwamy z szablonu tygodniowego
    await db.delete(weeklySchedule).where(eq(weeklySchedule.studentId, id));

    // 3. Usuwamy z listy rezerwowej
    await db.delete(waitlist).where(eq(waitlist.userId, id));

    // 4. Usuwamy ucznia
    await db.delete(users).where(eq(users.id, id));
  }

  async getSlot(id: number): Promise<Slot | undefined> {
    const [slot] = await db.select().from(slots).where(eq(slots.id, id));
    return slot;
  }

  async getSlots(start?: Date, end?: Date): Promise<Slot[]> {
    let query = db
      .select({
        id: slots.id,
        startTime: slots.startTime,
        endTime: slots.endTime,
        isBooked: slots.isBooked,
        isPaid: slots.isPaid,
        studentId: slots.studentId,
        topic: slots.topic,
        notes: slots.notes,
        price: slots.price,
        adminNotes: slots.adminNotes,
        student: {
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        },
      })
      .from(slots)
      .leftJoin(users, eq(slots.studentId, users.id));

    if (start && end) {
      // @ts-ignore
      query.where(and(gte(slots.startTime, start), lte(slots.startTime, end)));
    }

    // @ts-ignore
    const result = await query.orderBy(slots.startTime);
    return result.map((row) => ({
      ...row,
      student: row.student,
    })) as unknown as Slot[];
  }

  async createSlot(insertSlot: InsertSlot): Promise<Slot> {
    const [slot] = await db.insert(slots).values(insertSlot).returning();
    return slot;
  }

  async updateSlot(id: number, updateSlot: Partial<InsertSlot>): Promise<Slot> {
    const [slot] = await db
      .update(slots)
      .set(updateSlot)
      .where(eq(slots.id, id))
      .returning();
    return slot;
  }

  async deleteSlot(id: number): Promise<void> {
    await db.delete(slots).where(eq(slots.id, id));
  }

  async getWeeklySchedule(): Promise<
    (WeeklySchedule & { student?: User | null })[]
  > {
    const result = await db
      .select({
        id: weeklySchedule.id,
        dayOfWeek: weeklySchedule.dayOfWeek,
        startTime: weeklySchedule.startTime,
        durationMinutes: weeklySchedule.durationMinutes,
        studentId: weeklySchedule.studentId,
        price: weeklySchedule.price,
        student: {
          id: users.id,
          name: users.name,
          username: users.username,
        },
      })
      .from(weeklySchedule)
      .leftJoin(users, eq(weeklySchedule.studentId, users.id));

    return result as (WeeklySchedule & { student?: User | null })[];
  }

  async createWeeklyScheduleItem(
    item: InsertWeeklySchedule
  ): Promise<WeeklySchedule> {
    const [newItem] = await db.insert(weeklySchedule).values(item).returning();
    return newItem;
  }

  async deleteWeeklyScheduleItem(id: number): Promise<void> {
    await db.delete(weeklySchedule).where(eq(weeklySchedule.id, id));
  }

  async addToWaitlist(item: InsertWaitlist): Promise<Waitlist> {
    const [entry] = await db.insert(waitlist).values(item).returning();
    return entry;
  }
}

export const storage = new DatabaseStorage();
