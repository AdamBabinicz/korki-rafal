import type { Express } from "express";
import type { Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import {
  broadcastFreeSlot,
  sendBookingConfirmation,
  sendNewBookingNotificationToAdmin,
  sendCancellationConfirmation,
  sendCancellationNotificationToAdmin,
  sendWaitlistNotificationToAdmin,
} from "./services/email";
import { sendSafeTelegramAlert } from "./services/telegram";
import {
  insertSlotSchema,
  generateSlotsSchema,
  insertWaitlistSchema,
  insertWeeklyScheduleSchema,
  generateFromTemplateSchema,
  insertUserSchema,
  bookSlotSchema,
  type User,
  type InsertUser,
} from "@shared/schema";
import { z } from "zod";
import {
  addDays,
  differenceInHours,
  differenceInMinutes,
  format,
  getYear,
  getDay,
  addMinutes,
  isBefore,
  isAfter,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { pl } from "date-fns/locale";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq, and, gte, lte, lt, ne, sql, desc } from "drizzle-orm";
import { db } from "./db";
import { slots, waitlist, users, weeklySchedule } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

function getWarsawDate(date: Date): Date {
  return date;
}

function getWarsawHourMinute(date: Date) {
  const plTimeStr = date.toLocaleString("en-US", {
    timeZone: "Europe/Warsaw",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const [h, m] = plTimeStr.split(":").map(Number);
  return { h: h === 24 ? 0 : h, m };
}

function createWarsawDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);

  const target = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

  const warsawStr = target.toLocaleString("en-US", {
    timeZone: "Europe/Warsaw",
  });
  const warsawDate = new Date(warsawStr);
  const diffMs = target.getTime() - warsawDate.getTime();

  return new Date(target.getTime() + diffMs);
}

function anonymizeName(name: string, id: number): string {
  if (!name) return `Uczeń (ID: ${id})`;
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    const firstName = parts[0];
    const lastInitial = parts[parts.length - 1][0];
    return `${firstName} ${lastInitial}. (ID: ${id})`;
  }
  return `${name} (ID: ${id})`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  // --- AUTOMATYCZNA MIGRACJA BAZY DANYCH & AKTUALIZACJA CEN NA 100 PLN ---
  try {
    console.log("[DB] Sprawdzanie struktury tabel i aktualizacja cennika...");
    await db.execute(
      sql`ALTER TABLE slots ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP;`,
    );
    await db.execute(
      sql`ALTER TABLE slots ADD COLUMN IF NOT EXISTS location_type TEXT;`,
    );
    await db.execute(
      sql`ALTER TABLE slots ADD COLUMN IF NOT EXISTS travel_minutes INTEGER DEFAULT 0;`,
    );
    await db.execute(
      sql`ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'onsite';`,
    );
    await db.execute(
      sql`ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS travel_minutes INTEGER DEFAULT 0;`,
    );
    await db.execute(
      sql`ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS note TEXT;`,
    );

    // Automatyczna aktualizacja starych wpisów z 80 zł na 100 zł
    await db.execute(
      sql`UPDATE slots SET price = 100 WHERE price = 80 OR price IS NULL;`,
    );
    await db.execute(
      sql`UPDATE weekly_schedule SET price = 100 WHERE price = 80 OR price = 0;`,
    );
    await db.execute(
      sql`UPDATE users SET default_price = 100 WHERE default_price = 80 OR default_price IS NULL;`,
    );

    console.log("[DB] Struktura i ceny zaktualizowane do 100 PLN.");
  } catch (err) {
    console.error("[DB] Błąd auto-migracji:", err);
  }

  // --- UŻYTKOWNICY ---

  app.get("/api/users", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    res.header("Cache-Control", "no-store, max-age=0");

    try {
      const allUsers = await storage.getAllUsers();
      const unpaidSlots = await db
        .select()
        .from(slots)
        .where(and(eq(slots.isBooked, true), eq(slots.isPaid, false)));

      const usersWithBalance = allUsers.map((u) => {
        const studentSlots = unpaidSlots.filter((s) => s.studentId === u.id);
        const balance = studentSlots.reduce((sum, s) => {
          const price = s.price ?? u.defaultPrice ?? 100;
          return sum + price;
        }, 0);

        return {
          ...u,
          balance,
          unpaidCount: studentSlots.length,
        };
      });

      res.json(usersWithBalance);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Błąd pobierania użytkowników" });
    }
  });

  app.get("/api/users/:id/unpaid", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    const studentId = parseInt(req.params.id);

    try {
      const unpaidSlots = await db
        .select()
        .from(slots)
        .where(
          and(
            eq(slots.studentId, studentId),
            eq(slots.isBooked, true),
            eq(slots.isPaid, false),
          ),
        )
        .orderBy(desc(slots.startTime));

      res.json(unpaidSlots);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Błąd pobierania lekcji" });
    }
  });

  app.post("/api/users/:id/settle", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    const studentId = parseInt(req.params.id);

    try {
      const result = await db
        .update(slots)
        .set({ isPaid: true })
        .where(
          and(
            eq(slots.studentId, studentId),
            eq(slots.isBooked, true),
            eq(slots.isPaid, false),
          ),
        )
        .returning();

      res.json({ message: "Rozliczono", count: result.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Błąd rozliczania ucznia" });
    }
  });

  app.post("/api/users", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Użytkownik już istnieje." });
      }
      const hashedPassword = await hashPassword(userData.password);
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: "student",
      });
      res.status(201).json(newUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Błąd serwera" });
      }
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);

      if (userData.password && userData.password.trim() !== "") {
        userData.password = await hashPassword(userData.password);
      } else {
        delete userData.password;
      }
      const updatedUser = await storage.updateUser(id, userData);
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ message: "Błąd serwera" });
    }
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      const updateSchema = z.object({
        email: z
          .string()
          .email("Nieprawidłowy format adresu e-mail")
          .optional()
          .or(z.literal("")),
        phone: z.string().optional(),
        password: z.string().optional(),
      });

      const { email, phone, password } = updateSchema.parse(req.body);
      const updateData: Partial<InsertUser> = {};

      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (password && password.trim().length > 0) {
        updateData.password = await hashPassword(password);
      }

      const updatedUser = await storage.updateUser(user.id, updateData);

      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Błąd aktualizacji sesji:", err);
          return res.status(500).json({ message: "Błąd sesji" });
        }
        res.json(updatedUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Nie udało się zaktualizować danych" });
      }
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    const id = parseInt(req.params.id);
    await storage.deleteUser(id);
    res.sendStatus(204);
  });

  // --- SLOTY ---

  app.get("/api/slots", async (req, res) => {
    try {
      const start = req.query.start
        ? new Date(req.query.start as string)
        : undefined;
      const end = req.query.end ? new Date(req.query.end as string) : undefined;
      if (end) end.setHours(23, 59, 59, 999);
      const slots = await storage.getSlots(start, end);
      res.json(slots);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Błąd pobierania slotów" });
    }
  });

  app.post("/api/slots", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const input = insertSlotSchema.parse(req.body);
      const cleanStart = setMilliseconds(
        setSeconds(new Date(input.startTime), 0),
        0,
      );
      const cleanEnd = setMilliseconds(
        setSeconds(new Date(input.endTime), 0),
        0,
      );

      const slot = await storage.createSlot({
        ...input,
        startTime: cleanStart,
        endTime: cleanEnd,
        price: input.price ?? 100,
      });
      res.status(201).json(slot);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Błąd tworzenia slotu" });
    }
  });

  app.patch("/api/slots/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const id = parseInt(req.params.id);
      const input = insertSlotSchema.partial().parse(req.body);

      const updateData = { ...input };
      if (input.startTime) {
        updateData.startTime = setMilliseconds(
          setSeconds(new Date(input.startTime), 0),
          0,
        );
      }
      if (input.endTime) {
        updateData.endTime = setMilliseconds(
          setSeconds(new Date(input.endTime), 0),
          0,
        );
      }

      const updated = await storage.updateSlot(id, updateData);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Błąd aktualizacji slotu" });
    }
  });

  app.delete("/api/slots/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    const id = parseInt(req.params.id);
    await storage.deleteSlot(id);
    res.sendStatus(204);
  });

  // --- SZABLON TYGODNIOWY ---

  app.get("/api/weekly-schedule", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const schedule = await storage.getWeeklySchedule();
    res.json(schedule);
  });

  app.post("/api/weekly-schedule", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const input = insertWeeklyScheduleSchema.parse(req.body);
      const item = await storage.createWeeklyScheduleItem({
        ...input,
        price: input.price ?? 100,
      });
      res.status(201).json(item);
    } catch (err) {
      console.error("[POST Template Error]", err);
      res.status(500).json({ message: "Błąd serwera przy dodawaniu szablonu" });
    }
  });

  app.patch("/api/weekly-schedule/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const id = parseInt(req.params.id);
      const input = insertWeeklyScheduleSchema.partial().parse(req.body);
      const updated = await storage.updateWeeklyScheduleItem(id, input);
      res.json(updated);
    } catch (err) {
      console.error("[PATCH Template Error]", err);
      res.status(500).json({ message: "Błąd aktualizacji elementu szablonu" });
    }
  });

  app.delete("/api/weekly-schedule/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    const id = parseInt(req.params.id);
    await storage.deleteWeeklyScheduleItem(id);
    res.sendStatus(204);
  });

  // --- WAITLIST ---

  app.get("/api/waitlist", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const items = await db
        .select({
          id: waitlist.id,
          date: waitlist.date,
          note: waitlist.note,
          userId: waitlist.userId,
          studentName: users.name,
          studentPhone: users.phone,
          studentEmail: users.email,
        })
        .from(waitlist)
        .leftJoin(users, eq(waitlist.userId, users.id))
        .orderBy(desc(waitlist.date));
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Błąd pobierania listy oczekujących" });
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      const input = insertWaitlistSchema.parse({
        ...req.body,
        userId: user.id,
      });
      const entry = await storage.addToWaitlist(input);

      res.status(201).json(entry);

      (async () => {
        try {
          const allUsers = await storage.getAllUsers();
          const admin = allUsers.find((u) => u.role === "admin");
          const adminEmail = admin?.email || process.env.EMAIL_USER;
          const warsawDate = getWarsawDate(new Date(input.date));

          if (adminEmail) {
            await sendWaitlistNotificationToAdmin(
              adminEmail,
              user.name,
              warsawDate,
              input.note,
            );
          }
          const safeName = anonymizeName(user.name, user.id);
          const noteText = input.note ? `\n📝 <i>"${input.note}"</i>` : "";
          await sendSafeTelegramAlert(
            warsawDate,
            `🔔 <b>Lista Rezerwowa</b>\nUczeń <b>${safeName}</b> zgłasza chęć lekcji.${noteText}`,
          );
        } catch (error) {
          console.error("Background Error (Waitlist):", error);
        }
      })();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.issues[0].message });
      }
      if (!res.headersSent) res.status(500).json({ message: "Błąd serwera" });
    }
  });

  app.delete("/api/waitlist/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    const id = parseInt(req.params.id);
    await db.delete(waitlist).where(eq(waitlist.id, id));
    res.sendStatus(204);
  });

  // --- GENERATORY ---

  app.post("/api/slots/generate", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    try {
      const { startDate, endDate, startTime, endTime, duration } =
        generateSlotsSchema.parse(req.body);

      const [sY, sM, sD] = startDate.split("-").map(Number);
      const [eY, eM, eD] = endDate.split("-").map(Number);

      let currentDay = new Date(sY, sM - 1, sD, 12, 0, 0);
      const endDay = new Date(eY, eM - 1, eD, 12, 0, 0);

      const existingSlots = await storage.getSlots(
        new Date(sY, sM - 1, sD, 0, 0, 0),
        new Date(eY, eM - 1, eD, 23, 59, 59),
      );
      const existingTimestamps = new Set(
        existingSlots.map((s) => s.startTime.getTime()),
      );
      const weeklyScheduleList = await storage.getWeeklySchedule();

      let count = 0;

      while (currentDay <= endDay) {
        const dateStr = format(currentDay, "yyyy-MM-dd");
        const dayOfWeek = currentDay.getDay();

        const fixedLessons = weeklyScheduleList.filter(
          (l) => l.dayOfWeek === dayOfWeek,
        );

        let daySlotStart = createWarsawDateTime(dateStr, startTime);
        const daySlotEnd = createWarsawDateTime(dateStr, endTime);

        while (daySlotStart < daySlotEnd) {
          const slotEnd = addMinutes(daySlotStart, duration);
          if (slotEnd > daySlotEnd) break;

          const { h: slotH, m: slotM } = getWarsawHourMinute(daySlotStart);
          const slotStartMin = slotH * 60 + slotM;
          const slotEndMin = slotStartMin + duration;

          const isCollision = fixedLessons.some((lesson) => {
            const [lh, lm] = lesson.startTime.split(":").map(Number);
            const lessonStartMin = lh * 60 + lm;
            const lessonEndMin = lessonStartMin + lesson.durationMinutes;

            const extraTime =
              lesson.locationType === "commute" ? lesson.travelMinutes || 0 : 0;
            const lessonBusyStart = lessonStartMin - extraTime;

            return slotStartMin < lessonEndMin && slotEndMin > lessonBusyStart;
          });

          if (!isCollision && !existingTimestamps.has(daySlotStart.getTime())) {
            await storage.createSlot({
              startTime: daySlotStart,
              endTime: slotEnd,
              isBooked: false,
              isPaid: false,
              price: 100,
              locationType: "onsite",
              travelMinutes: 0,
            });
            existingTimestamps.add(daySlotStart.getTime());
            count++;
          }
          daySlotStart = slotEnd;
        }

        currentDay = addDays(currentDay, 1);
      }

      res.status(201).json({ count });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Błąd generowania slotów" });
    }
  });

  app.post("/api/slots/generate-from-template", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Brak dostępu");
    }
    console.log("[GENERATOR] Start generowania z szablonu...");
    try {
      const { startDate, endDate } = generateFromTemplateSchema.parse(req.body);

      const [sY, sM, sD] = startDate.split("-").map(Number);
      const [eY, eM, eD] = endDate.split("-").map(Number);

      let currentDay = new Date(sY, sM - 1, sD, 12, 0, 0);
      const endDay = new Date(eY, eM - 1, eD, 12, 0, 0);

      const weeklyScheduleList = await storage.getWeeklySchedule();
      console.log(
        `[GENERATOR] Pobrano ${weeklyScheduleList.length} elementów szablonu.`,
      );

      const existingSlots = await storage.getSlots(
        new Date(sY, sM - 1, sD, 0, 0, 0),
        new Date(eY, eM - 1, eD, 23, 59, 59),
      );

      let count = 0;
      let updatedCount = 0;

      while (currentDay <= endDay) {
        const dateStr = format(currentDay, "yyyy-MM-dd");
        const dayOfWeek = currentDay.getDay();

        const dayTemplates = weeklyScheduleList.filter(
          (t) => t.dayOfWeek === dayOfWeek,
        );
        const processedTimes = new Set<string>();

        for (const item of dayTemplates) {
          const slotStart = createWarsawDateTime(dateStr, item.startTime);
          const timeKey = slotStart.getTime().toString();
          if (processedTimes.has(timeKey)) continue;
          processedTimes.add(timeKey);

          const slotEnd = addMinutes(slotStart, item.durationMinutes);

          const existingSlot = existingSlots.find(
            (s) => Math.abs(differenceInMinutes(s.startTime, slotStart)) < 2,
          );

          const isBooked = !!item.studentId;
          const topic = isBooked
            ? item.student?.name || "Matematyka"
            : undefined;

          const slotData: Partial<typeof slots.$inferInsert> = {
            isBooked: isBooked,
            studentId: item.studentId,
            topic: topic,
            endTime: slotEnd,
            price: item.price || 100,
            locationType: item.locationType || "onsite",
            travelMinutes: item.travelMinutes || 0,
          };

          if (existingSlot) {
            await storage.updateSlot(existingSlot.id, slotData);
            updatedCount++;
          } else {
            await storage.createSlot({
              ...slotData,
              startTime: slotStart,
              isPaid: false,
              endTime: slotEnd,
            } as typeof slots.$inferInsert);
            count++;
          }
        }

        currentDay = addDays(currentDay, 1);
      }

      console.log(
        `[GENERATOR] Zakończono. Nowe: ${count}, Zaktualizowane: ${updatedCount}`,
      );
      res.status(201).json({
        count,
        message: `Zaktualizowano ${updatedCount}, utworzono ${count} lekcji.`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Błąd generowania" });
    }
  });

  // --- BOOKING (REZERWACJA) ---
  app.post("/api/slots/:id/book", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      const id = parseInt(req.params.id);
      const { topic, durationMinutes, locationType } = bookSlotSchema.parse(
        req.body,
      );
      const slot = await storage.getSlot(id);
      if (!slot) return res.status(404).send("Termin nie znaleziony");
      if (slot.isBooked) return res.status(409).send("Termin już zajęty");

      const travelBuffer = locationType === "commute" ? 30 : 0;

      const baseStart = setMilliseconds(
        setSeconds(new Date(slot.startTime), 0),
        0,
      );

      const busyStart = addMinutes(baseStart, -travelBuffer);
      const busyEnd = addMinutes(baseStart, durationMinutes);
      const lessonEnd = addMinutes(baseStart, durationMinutes);

      const searchStart = addMinutes(busyStart, -180);
      const searchEnd = addMinutes(busyEnd, 180);

      const potentialCollisions = await db
        .select()
        .from(slots)
        .where(
          and(
            gte(slots.startTime, searchStart),
            lte(slots.endTime, searchEnd),
            ne(slots.id, id),
          ),
        );

      const isBlockage = potentialCollisions.some((s) => {
        if (!s.isBooked) return false;

        const sStart = setMilliseconds(setSeconds(new Date(s.startTime), 0), 0);
        const sEnd = setMilliseconds(setSeconds(new Date(s.endTime), 0), 0);

        const sExtra = s.locationType === "commute" ? s.travelMinutes || 0 : 0;
        const sBusyStart = addMinutes(sStart, -sExtra);
        const sBusyEnd = sEnd;

        return (
          busyStart.getTime() < sBusyEnd.getTime() &&
          busyEnd.getTime() > sBusyStart.getTime()
        );
      });

      if (isBlockage) {
        return res.status(409).json({
          message: "Wybrany czas (z dojazdem) koliduje z inną lekcją.",
        });
      }

      const chosenTopic = topic && topic.trim() !== "" ? topic : "Matematyka";

      const updated = await storage.updateSlot(id, {
        isBooked: true,
        studentId: user.id,
        topic: chosenTopic,
        endTime: lessonEnd,
        bookedAt: new Date(),
        locationType: locationType,
        travelMinutes: travelBuffer,
      });

      for (const collision of potentialCollisions) {
        if (collision.isBooked) continue;
        const cStart = setMilliseconds(
          setSeconds(new Date(collision.startTime), 0),
          0,
        );

        if (
          cStart.getTime() >= busyStart.getTime() &&
          cStart.getTime() < busyEnd.getTime()
        ) {
          await storage.deleteSlot(collision.id);
        }
      }

      res.json(updated);

      (async () => {
        try {
          const warsawDate = getWarsawDate(new Date(slot.startTime));
          if (user.email)
            await sendBookingConfirmation(user.email, warsawDate, chosenTopic);
          const allUsers = await storage.getAllUsers();
          const admin = allUsers.find((u) => u.role === "admin");
          if (admin && admin.email) {
            await sendNewBookingNotificationToAdmin(
              admin.email,
              user.name,
              warsawDate,
              chosenTopic,
            );
          }
          const safeName = anonymizeName(user.name, user.id);
          await sendSafeTelegramAlert(
            warsawDate,
            `🔔 <b>Nowa rezerwacja</b>\nUczeń: <b>${safeName}</b>\n📚 Temat: <b>${chosenTopic}</b>`,
          );
        } catch (bgError) {
          console.error("Background Error (Booking):", bgError);
        }
      })();
    } catch (err) {
      if (err instanceof z.ZodError)
        return res.status(400).json({ message: err.issues[0].message });
      if (!res.headersSent) res.status(500).send("Błąd rezerwacji");
    }
  });

  app.post("/api/slots/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      const id = parseInt(req.params.id);
      const slot = await storage.getSlot(id);
      if (!slot) return res.status(404).send("Termin nie znaleziony");
      if (user.role !== "admin" && slot.studentId !== user.id)
        return res.status(403).send("Brak uprawnień");

      if (user.role !== "admin") {
        const now = new Date();
        const bookedAt = slot.bookedAt ? new Date(slot.bookedAt) : new Date(0);
        const hoursUntilLesson = differenceInHours(
          new Date(slot.startTime),
          now,
        );
        const minutesSinceBooking = differenceInMinutes(now, bookedAt);
        if (hoursUntilLesson < 24 && minutesSinceBooking > 30) {
          return res
            .status(400)
            .json({ message: "Za późno na anulowanie (mniej niż 24h)." });
        }
      }

      const updated = await storage.updateSlot(id, {
        isBooked: false,
        studentId: null,
        isPaid: false,
        topic: null,
        bookedAt: null,
        locationType: "onsite",
        travelMinutes: 0,
      });

      res.json(updated);

      (async () => {
        try {
          const warsawDate = getWarsawDate(new Date(slot.startTime));
          const allUsers = await storage.getAllUsers();
          const studentEmails = allUsers
            .filter(
              (u) =>
                u.role === "student" &&
                u.id !== user.id &&
                u.email?.includes("@"),
            )
            .map((u) => u.email as string);
          await broadcastFreeSlot(studentEmails, warsawDate, undefined);

          const safeName = anonymizeName(user.name, user.id);
          await sendSafeTelegramAlert(
            warsawDate,
            `❌ <b>Anulowano rezerwację!</b>\nUczeń: <b>${safeName}</b>\nTermin zwolniony.`,
          );

          if (user.email)
            await sendCancellationConfirmation(
              user.email,
              warsawDate,
              user.name,
            );
          const admin = allUsers.find((u) => u.role === "admin");
          if (admin?.email)
            await sendCancellationNotificationToAdmin(
              admin.email,
              user.name,
              warsawDate,
            );
        } catch (bgError) {
          console.error("Background Error (Cancel):", bgError);
        }
      })();
    } catch (err) {
      if (!res.headersSent) res.status(500).send("Błąd anulowania");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      const adminPass = await hashPassword("admin123");
      await storage.createUser({
        username: "admin",
        password: adminPass,
        role: "admin",
        name: "Math Tutor",
        email: "admin@mathmentor.pl",
      });
    }
  }

  return httpServer;
}
