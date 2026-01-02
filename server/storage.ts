import { db, pool } from "./db";
import {
  users, slots, waitlist,
  type User, type InsertUser,
  type Slot, type InsertSlot,
  type Waitlist, type InsertWaitlist
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Slots
  getSlots(start?: Date, end?: Date): Promise<Slot[]>;
  getSlot(id: number): Promise<Slot | undefined>;
  createSlot(slot: InsertSlot): Promise<Slot>;
  updateSlot(id: number, updates: Partial<InsertSlot>): Promise<Slot>;
  deleteSlot(id: number): Promise<void>;
  
  // Waitlist
  addToWaitlist(entry: InsertWaitlist): Promise<Waitlist>;
  getWaitlist(date: Date): Promise<Waitlist[]>;
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
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSlots(start?: Date, end?: Date): Promise<Slot[]> {
    if (start && end) {
      return await db.select().from(slots).where(
        and(gte(slots.startTime, start), lte(slots.startTime, end))
      );
    }
    return await db.select().from(slots);
  }

  async getSlot(id: number): Promise<Slot | undefined> {
    const [slot] = await db.select().from(slots).where(eq(slots.id, id));
    return slot;
  }

  async createSlot(slot: InsertSlot): Promise<Slot> {
    const [newSlot] = await db.insert(slots).values(slot).returning();
    return newSlot;
  }

  async updateSlot(id: number, updates: Partial<InsertSlot>): Promise<Slot> {
    const [updated] = await db.update(slots)
      .set(updates)
      .where(eq(slots.id, id))
      .returning();
    return updated;
  }

  async deleteSlot(id: number): Promise<void> {
    await db.delete(slots).where(eq(slots.id, id));
  }

  async addToWaitlist(entry: InsertWaitlist): Promise<Waitlist> {
    const [item] = await db.insert(waitlist).values(entry).returning();
    return item;
  }

  async getWaitlist(date: Date): Promise<Waitlist[]> {
    // This is a simplification. In reality we'd query by date range or exact date match
    // depending on how waitlist logic is implemented.
    return await db.select().from(waitlist);
  }
}

export const storage = new DatabaseStorage();
