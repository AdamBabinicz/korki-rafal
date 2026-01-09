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
} from "@shared/schema";
import { z } from "zod";
import {
  addDays,
  setHours,
  setMinutes,
  parseISO,
  differenceInHours,
  differenceInMinutes,
  format,
  getYear,
  getDay,
  addMinutes,
  isBefore,
  isAfter,
} from "date-fns";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq, and, gte, lte, lt, ne, sql } from "drizzle-orm";
import { db } from "./db";
import { slots } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
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

const holidayCache = new Map<number, Set<string>>();

async function getPublicHolidays(year: number): Promise<Set<string>> {
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }
  try {
    console.log(`Fetching public holidays for year ${year}...`);
    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/PL`
    );
    if (!response.ok) return new Set();
    const data = (await response.json()) as { date: string }[];
    const holidays = new Set(data.map((h) => h.date));
    holidayCache.set(year, holidays);
    return holidays;
  } catch (error) {
    console.error("Failed to fetch holidays:", error);
    return new Set();
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // --- AUTOMATYCZNA NAPRAWA BAZY DANYCH (MIGRACJA) ---
  try {
    console.log("[DB] Sprawdzanie struktury tabel...");

    // Slots
    await db.execute(
      sql`ALTER TABLE slots ADD COLUMN IF NOT EXISTS booked_at TIMESTAMP;`
    );
    await db.execute(
      sql`ALTER TABLE slots ADD COLUMN IF NOT EXISTS location_type TEXT;`
    );
    await db.execute(
      sql`ALTER TABLE slots ADD COLUMN IF NOT EXISTS travel_minutes INTEGER DEFAULT 0;`
    );

    // Weekly Schedule
    await db.execute(
      sql`ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'onsite';`
    );
    await db.execute(
      sql`ALTER TABLE weekly_schedule ADD COLUMN IF NOT EXISTS travel_minutes INTEGER DEFAULT 0;`
    );

    // Waitlist - FIX dla błędu "Invalid request"
    await db.execute(
      sql`ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS note TEXT;`
    );

    console.log("[DB] Struktura tabel jest poprawna.");
  } catch (err) {
    console.error(
      "[DB] Błąd auto-migracji (można zignorować jeśli kolumny istnieją):",
      err
    );
  }
  // ----------------------------------------------------

  // --- UŻYTKOWNICY ---

  app.get("/api/users", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    res.header("Cache-Control", "no-store, max-age=0");
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
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
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
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
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;

    try {
      const updateSchema = z.object({
        email: z.string().email("Nieprawidłowy format adresu e-mail"),
        phone: z.string().optional(),
      });

      const { email, phone } = updateSchema.parse(req.body);

      const updatedUser = await storage.updateUser(user.id, {
        email,
        phone,
      });

      req.login(updatedUser, (err) => {
        if (err) {
          console.error("Błąd aktualizacji sesji:", err);
        }
        res.json(updatedUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.issues[0].message });
      } else {
        res.status(500).json({ message: "Nie udało się zaktualizować danych" });
      }
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
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

      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      console.log(`[API] Pobieranie slotów od ${start} do ${end}`);
      const slots = await storage.getSlots(start, end);
      console.log(`[API] Znaleziono slotów: ${slots.length}`);

      res.json(slots);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to fetch slots" });
    }
  });

  app.post("/api/slots", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    try {
      const input = insertSlotSchema.parse(req.body);
      const slot = await storage.createSlot(input);
      res.status(201).json(slot);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Error creating slot" });
    }
  });

  app.patch("/api/slots/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    try {
      const id = parseInt(req.params.id);
      const input = insertSlotSchema.partial().parse(req.body);
      const updated = await storage.updateSlot(id, input);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update slot" });
    }
  });

  app.delete("/api/slots/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
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
      return res.status(403).send("Unauthorized");
    }
    try {
      const input = insertWeeklyScheduleSchema.parse(req.body);
      const item = await storage.createWeeklyScheduleItem(input);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/weekly-schedule/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    try {
      const id = parseInt(req.params.id);
      const input = insertWeeklyScheduleSchema.partial().parse(req.body);
      const updated = await storage.updateWeeklyScheduleItem(id, input);
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update template item" });
    }
  });

  app.delete("/api/weekly-schedule/:id", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    const id = parseInt(req.params.id);
    await storage.deleteWeeklyScheduleItem(id);
    res.sendStatus(204);
  });

  // --- GENERATORY ---

  app.post("/api/slots/generate", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    try {
      const { startDate, endDate, startTime, endTime, duration } =
        generateSlotsSchema.parse(req.body);

      const start = parseISO(startDate);
      const end = parseISO(endDate);

      const startYear = getYear(start);
      const holidays = await getPublicHolidays(startYear);
      if (getYear(end) !== startYear) {
        const h2 = await getPublicHolidays(getYear(end));
        h2.forEach((h) => holidays.add(h));
      }

      const existingSlots = await storage.getSlots(start, addDays(end, 1));
      const existingTimestamps = new Set(
        existingSlots.map((s) => s.startTime.getTime())
      );

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const weeklySchedule = await storage.getWeeklySchedule();

      let currentDay = start;
      let count = 0;

      while (currentDay <= end) {
        const dateStr = format(currentDay, "yyyy-MM-dd");
        const dayOfWeek = getDay(currentDay);

        if (holidays.has(dateStr)) {
          currentDay = addDays(currentDay, 1);
          continue;
        }

        if (dayOfWeek !== 0) {
          const fixedLessons = weeklySchedule.filter(
            (l) => l.dayOfWeek === dayOfWeek
          );

          let daySlotStart = setMinutes(
            setHours(currentDay, startHour),
            startMinute
          );
          const daySlotEnd = setMinutes(
            setHours(currentDay, endHour),
            endMinute
          );

          while (daySlotStart < daySlotEnd) {
            const slotEnd = addMinutes(daySlotStart, duration);
            if (slotEnd > daySlotEnd) break;

            const { h: slotH, m: slotM } = getWarsawHourMinute(daySlotStart);
            const slotStartMin = slotH * 60 + slotM;
            const slotEndMin = slotStartMin + duration;

            const isCollision = fixedLessons.some((lesson) => {
              const [lh, lm] = lesson.startTime.split(":").map(Number);
              const lessonStartMin = lh * 60 + lm;
              const extraTime =
                lesson.locationType === "commute"
                  ? lesson.travelMinutes || 0
                  : 0;
              const lessonEndMin =
                lessonStartMin + lesson.durationMinutes + extraTime;

              return slotStartMin < lessonEndMin && slotEndMin > lessonStartMin;
            });

            if (
              !isCollision &&
              !existingTimestamps.has(daySlotStart.getTime())
            ) {
              await storage.createSlot({
                startTime: daySlotStart,
                endTime: slotEnd,
                isBooked: false,
                isPaid: false,
                locationType: "onsite",
                travelMinutes: 0,
              });
              existingTimestamps.add(daySlotStart.getTime());
              count++;
            }
            daySlotStart = slotEnd;
          }
        }
        currentDay = addDays(currentDay, 1);
      }

      res.status(201).json({ count });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate slots" });
    }
  });

  app.post("/api/slots/generate-from-template", async (req, res) => {
    const user = req.user as User;
    if (!req.isAuthenticated() || user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    console.log("[GENERATOR] Start generowania z szablonu...");
    try {
      const { startDate, endDate } = generateFromTemplateSchema.parse(req.body);
      const start = parseISO(startDate);
      const end = parseISO(endDate);

      const weeklySchedule = await storage.getWeeklySchedule();
      console.log(
        `[GENERATOR] Pobrano ${weeklySchedule.length} elementów szablonu.`
      );

      const startYear = getYear(start);
      const holidays = await getPublicHolidays(startYear);
      if (getYear(end) !== startYear) {
        const h2 = await getPublicHolidays(getYear(end));
        h2.forEach((h) => holidays.add(h));
      }

      const existingSlots = await storage.getSlots(start, addDays(end, 1));

      let currentDay = start;
      let count = 0;
      let updatedCount = 0;

      while (currentDay <= end) {
        const dateStr = format(currentDay, "yyyy-MM-dd");

        if (holidays.has(dateStr)) {
          console.log(`[GENERATOR] Pomijam święto: ${dateStr}`);
          currentDay = addDays(currentDay, 1);
          continue;
        }

        const dayOfWeek = getDay(currentDay);
        const dayTemplates = weeklySchedule.filter(
          (t) => t.dayOfWeek === dayOfWeek
        );

        const processedTimes = new Set<string>();

        for (const item of dayTemplates) {
          const [hours, minutes] = item.startTime.split(":").map(Number);

          let slotStart = new Date(currentDay);
          slotStart.setHours(hours, minutes, 0, 0);

          const { h: plH, m: plM } = getWarsawHourMinute(slotStart);
          const actualMinutes = plH * 60 + plM;
          const desiredMinutes = hours * 60 + minutes;
          let diff = actualMinutes - desiredMinutes;
          if (diff > 720) diff -= 1440;
          if (diff < -720) diff += 1440;
          slotStart = addMinutes(slotStart, -diff);

          const timeKey = slotStart.getTime().toString();
          if (processedTimes.has(timeKey)) {
            continue;
          }
          processedTimes.add(timeKey);

          const extraTime =
            item.locationType === "commute" ? item.travelMinutes || 0 : 0;
          const totalDuration = item.durationMinutes + extraTime;

          const slotEnd = addMinutes(slotStart, totalDuration);

          const existingSlot = existingSlots.find(
            (s) => Math.abs(differenceInMinutes(s.startTime, slotStart)) < 2
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
            price: item.price,
            locationType: item.locationType,
            travelMinutes: item.travelMinutes,
          };

          if (existingSlot) {
            await storage.updateSlot(existingSlot.id, slotData);
            updatedCount++;
          } else {
            console.log(
              `[GENERATOR] Tworzę slot: ${dateStr} ${item.startTime} (Typ: ${item.locationType}, Dojazd: ${item.travelMinutes}min)`
            );
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
        `[GENERATOR] Zakończono. Nowe: ${count}, Zaktualizowane: ${updatedCount}`
      );
      res.status(201).json({
        count,
        message: `Zaktualizowano ${updatedCount}, utworzono ${count} lekcji.`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate schedule" });
    }
  });

  // --- REZERWACJA / ANULOWANIE ---
  app.post("/api/slots/:id/book", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;

    try {
      const id = parseInt(req.params.id);
      const { topic, durationMinutes, locationType } = bookSlotSchema.parse(
        req.body
      );

      const slot = await storage.getSlot(id);
      if (!slot) return res.status(404).send("Slot not found");
      if (slot.isBooked) return res.status(409).send("Slot already booked");

      const travelBuffer = locationType === "commute" ? 30 : 0;
      const totalOccupiedMinutes = durationMinutes + travelBuffer;
      const newEndTime = addMinutes(slot.startTime, totalOccupiedMinutes);

      const potentialCollisions = await db
        .select()
        .from(slots)
        .where(
          and(
            gte(slots.startTime, slot.startTime),
            lt(slots.startTime, newEndTime),
            ne(slots.id, id)
          )
        );

      const isBlockage = potentialCollisions.some(
        (s) =>
          s.isBooked ||
          (s.startTime < newEndTime && s.endTime > newEndTime && s.isBooked)
      );

      if (isBlockage) {
        return res
          .status(409)
          .json({ message: "Wybrany czas nachodzi na inną zajętą lekcję." });
      }

      const updated = await storage.updateSlot(id, {
        isBooked: true,
        studentId: user.id,
        topic: topic || "Matematyka",
        endTime: newEndTime,
        bookedAt: new Date(),
        locationType: locationType,
        travelMinutes: travelBuffer,
      });

      for (const collision of potentialCollisions) {
        if (collision.endTime <= newEndTime) {
          await storage.deleteSlot(collision.id);
        } else if (
          collision.startTime < newEndTime &&
          collision.endTime > newEndTime
        ) {
          await storage.updateSlot(collision.id, {
            startTime: newEndTime,
          });
        }
      }

      if (user.email) {
        await sendBookingConfirmation(
          user.email,
          new Date(slot.startTime),
          topic || "Matematyka"
        );
      }

      try {
        const allUsers = await storage.getAllUsers();
        const admin = allUsers.find((u) => u.role === "admin");

        if (admin && admin.email) {
          await sendNewBookingNotificationToAdmin(
            admin.email,
            user.name,
            new Date(slot.startTime),
            topic || "Matematyka"
          );
        }

        await sendSafeTelegramAlert(new Date(slot.startTime));
      } catch (adminNotifyErr) {
        console.error("Błąd powiadomień dla admina:", adminNotifyErr);
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.issues[0].message });
      }
      console.error(err);
      res.status(500).send("Error booking slot");
    }
  });

  app.post("/api/slots/:id/cancel", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;

    try {
      const id = parseInt(req.params.id);
      const slot = await storage.getSlot(id);
      if (!slot) return res.status(404).send("Slot not found");

      if (user.role !== "admin" && slot.studentId !== user.id) {
        return res.status(403).send("Not authorized");
      }

      if (user.role !== "admin") {
        const now = new Date();
        const bookedAt = slot.bookedAt ? new Date(slot.bookedAt) : new Date(0);
        const hoursUntilLesson = differenceInHours(
          new Date(slot.startTime),
          now
        );
        const minutesSinceBooking = differenceInMinutes(now, bookedAt);

        const GRACE_PERIOD_MINUTES = 30;

        if (
          hoursUntilLesson < 24 &&
          minutesSinceBooking > GRACE_PERIOD_MINUTES
        ) {
          return res.status(400).json({
            message: "Too late to cancel (less than 24h before lesson).",
          });
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

      console.log(`[SLOT] Termin ${id} został zwolniony.`);

      try {
        const allUsers = await storage.getAllUsers();

        const studentEmails = allUsers
          .filter(
            (u) =>
              u.role === "student" &&
              u.id !== user.id &&
              u.email &&
              u.email.includes("@")
          )
          .map((u) => u.email as string);

        const admin = allUsers.find((u) => u.role === "admin");
        const adminEmail = admin?.email || process.env.EMAIL_USER;

        await broadcastFreeSlot(
          studentEmails,
          new Date(slot.startTime),
          undefined
        );

        await sendSafeTelegramAlert(
          new Date(slot.startTime),
          "❌ Odwołano rezerwację! Zwolnił się termin."
        );

        if (user.email) {
          await sendCancellationConfirmation(
            user.email,
            new Date(slot.startTime),
            user.name
          );
        }

        if (adminEmail) {
          await sendCancellationNotificationToAdmin(
            adminEmail,
            user.name,
            new Date(slot.startTime)
          );
        }
      } catch (notifyError) {
        console.error(
          "Błąd podczas wysyłania powiadomień (nie blokuje anulowania):",
          notifyError
        );
      }

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error cancelling slot");
    }
  });

  app.post("/api/waitlist", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as User;
    try {
      // Poprawa obsługi błędów
      const input = insertWaitlistSchema.parse({
        ...req.body,
        userId: user.id,
      });
      const entry = await storage.addToWaitlist(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.issues[0].message });
      }
      console.error("[WAITLIST ERROR]", err);
      // Jeśli to błąd bazy danych (np. brak kolumny note przed migracją), wyświetli się w logach serwera
      res.status(500).json({ message: "Server error" });
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
