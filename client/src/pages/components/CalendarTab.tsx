import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  addMinutes,
  isSunday,
  differenceInMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns";
import { pl, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  XCircle,
  Car,
  MapPin,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Slot, User, InsertSlot } from "@shared/schema";

const isPublicHoliday = (date: Date) => {
  const dateString = format(date, "MM-dd");
  const year = date.getFullYear();
  const fixed = [
    "01-01",
    "01-06",
    "05-01",
    "05-03",
    "08-15",
    "11-01",
    "11-11",
    "12-25",
    "12-26",
  ];
  if (fixed.includes(dateString)) return true;
  if (year === 2025 && ["04-20", "04-21", "06-19"].includes(dateString))
    return true;
  if (year === 2026 && ["04-05", "04-06", "06-04"].includes(dateString))
    return true;
  return false;
};

const sendTelegramNotification = async (message: string) => {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    console.error("Telegram error:", error);
  }
};

export default function CalendarTab() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const dateLocale = i18n.language.startsWith("pl") ? pl : enUS;

  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  weekEnd.setHours(23, 59, 59, 999);

  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  const [newSlotData, setNewSlotData] = useState<
    Partial<InsertSlot> & { duration: number }
  >({
    startTime: new Date(),
    duration: 60,
    price: 80,
    locationType: "onsite",
    travelMinutes: 0,
    studentId: undefined,
  });

  const [editFormTime, setEditFormTime] = useState("");
  const [editFormDuration, setEditFormDuration] = useState(60);
  const [editFormPrice, setEditFormPrice] = useState(80);
  const [editFormLocation, setEditFormLocation] = useState("onsite");
  const [editFormTravel, setEditFormTravel] = useState(0);

  const { data: slots } = useQuery<Slot[]>({
    queryKey: [
      "/api/slots",
      { start: weekStart.toISOString(), end: weekEnd.toISOString() },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      });
      const res = await apiRequest("GET", `/api/slots?${params.toString()}`);
      return res.json();
    },
  });

  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  useEffect(() => {
    if (editingSlot) {
      // Obliczanie czasu trwania lekcji (czystego)
      const duration = differenceInMinutes(
        new Date(editingSlot.endTime),
        new Date(editingSlot.startTime)
      );

      setEditFormTime(format(new Date(editingSlot.startTime), "HH:mm"));
      setEditFormDuration(duration > 0 ? duration : 60);
      setEditFormPrice(editingSlot.price || Math.ceil((duration / 60) * 80));
      setEditFormLocation(editingSlot.locationType || "onsite");
      setEditFormTravel(editingSlot.travelMinutes || 0);
    }
  }, [editingSlot]);

  // --- ZMODYFIKOWANA LOGIKA KOLIZJI (DOJAZD PRZED) ---
  const checkCollision = (
    start: Date,
    duration: number,
    locType: string,
    travel: number,
    excludeSlotId?: number
  ) => {
    if (!slots) return false;

    // Clean Start Timestamp
    const cleanStart = setMilliseconds(setSeconds(start, 0), 0);

    // My Busy Range:
    const extraTimeStart = locType === "commute" ? travel : 0;
    const busyStart = addMinutes(cleanStart, -extraTimeStart);
    const busyEnd = addMinutes(cleanStart, duration);

    return slots.some((s) => {
      if (excludeSlotId && s.id === excludeSlotId) return false;

      const sStart = setMilliseconds(setSeconds(new Date(s.startTime), 0), 0);
      const sEnd = setMilliseconds(setSeconds(new Date(s.endTime), 0), 0);

      // Calculate OTHER slot's busy range based on "Travel Before" logic
      const sExtraTimeStart =
        s.locationType === "commute" ? s.travelMinutes || 0 : 0;

      const sBusyStart = addMinutes(sStart, -sExtraTimeStart);
      const sBusyEnd = sEnd; // We trust sEnd is pure lesson end

      // Strict Intersection:
      // (MyStart < OtherEnd) AND (MyEnd > OtherStart)
      // Using .getTime() to avoid object reference issues
      return (
        busyStart.getTime() < sBusyEnd.getTime() &&
        busyEnd.getTime() > sBusyStart.getTime()
      );
    });
  };

  const isAddCollision = (() => {
    if (!newSlotData.startTime) return false;
    return checkCollision(
      newSlotData.startTime,
      newSlotData.duration || 60,
      newSlotData.locationType || "onsite",
      newSlotData.travelMinutes || 0
    );
  })();

  const isEditCollision = (() => {
    if (!editingSlot || !editFormTime) return false;
    const [h, m] = editFormTime.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return false;

    const proposedStart = new Date(editingSlot.startTime);
    proposedStart.setHours(h, m, 0, 0);

    return checkCollision(
      proposedStart,
      editFormDuration,
      editFormLocation,
      editFormTravel,
      editingSlot.id
    );
  })();

  const createSlotMutation = useMutation({
    mutationFn: async (newSlot: InsertSlot) => {
      const res = await apiRequest("POST", "/api/slots", newSlot);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: t("toasts.success"),
        description: t("toasts.slot_created"),
      });
      setIsAddSlotOpen(false);
      const formattedDate = format(
        new Date(variables.startTime),
        "EEEE, d MMMM yyyy, HH:mm",
        { locale: dateLocale }
      );
      sendTelegramNotification(
        `🔔 <b>${t("notifications.title")}</b>\n${t(
          "notifications.new_slot"
        )}\n\n📅 ${formattedDate}`
      );
    },
  });

  const updateSlotMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertSlot>;
    }) => {
      const res = await apiRequest("PATCH", `/api/slots/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: t("toasts.slot_updated"),
        description: t("toasts.success"),
      });
      setEditingSlot(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async ({ id }: { id: number; date: Date }) => {
      await apiRequest("DELETE", `/api/slots/${id}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: t("toasts.slot_deleted"),
        description: t("toasts.success"),
      });
      const formattedDate = format(variables.date, "EEEE, d MMMM yyyy, HH:mm", {
        locale: dateLocale,
      });
      sendTelegramNotification(
        `🗑️ <b>${t("notifications.title")}</b>\n${t(
          "notifications.slot_removed"
        )}\n\n📅 ${formattedDate}`
      );
    },
  });

  const cancelSlotMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/slots/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: t("toasts.cancel_success"),
        description: t("toasts.cancel_desc"),
      });
    },
  });

  const handleOpenAddSlot = () => {
    const initDate = new Date(weekStart);
    const now = new Date();
    initDate.setHours(now.getHours(), now.getMinutes());
    setNewSlotData({
      startTime: initDate,
      duration: 60,
      price: 80,
      locationType: "onsite",
      travelMinutes: 0,
      studentId: undefined,
    });
    setIsAddSlotOpen(true);
  };

  const handleCreateSlot = () => {
    if (!newSlotData.startTime) return;
    if (isAddCollision) {
      toast({
        variant: "destructive",
        title: t("toasts.error"),
        description: t("admin.collision_detected"),
      });
      return;
    }
    const travel =
      newSlotData.locationType === "commute"
        ? newSlotData.travelMinutes || 0
        : 0;
    const lessonDuration = newSlotData.duration || 60;

    // endTime = startTime + duration (BEZ travel)
    const end = addMinutes(newSlotData.startTime, lessonDuration);

    const payload: any = {
      startTime: newSlotData.startTime,
      endTime: end,
      price: newSlotData.price,
      isBooked: !!newSlotData.studentId,
      studentId: newSlotData.studentId,
      topic: newSlotData.studentId
        ? users?.find((u) => u.id === newSlotData.studentId)?.name
        : undefined,
      locationType: newSlotData.locationType,
      travelMinutes: travel,
    };
    createSlotMutation.mutate(payload);
  };

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart((d) => subWeeks(d, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center font-medium text-lg">
            {format(weekStart, "d MMM", { locale: dateLocale })} -{" "}
            {format(weekEnd, "d MMM", { locale: dateLocale })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart((d) => addWeeks(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button className="w-full md:w-auto" onClick={handleOpenAddSlot}>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.add_slot_btn")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const daySlots =
            slots?.filter((s) => isSameDay(new Date(s.startTime), day)) || [];
          daySlots.sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          const isHoliday = isPublicHoliday(day);
          const isSun = isSunday(day);
          const isFree = isHoliday || isSun;

          return (
            <div
              key={day.toISOString()}
              className={`border rounded-lg bg-card overflow-hidden ${
                isFree ? "bg-red-50 dark:bg-red-900/10" : ""
              }`}
            >
              <div
                className={`p-3 text-center border-b ${
                  isSameDay(day, new Date())
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-muted"
                }`}
              >
                <div className="text-sm uppercase opacity-80">
                  {format(day, "EEEE", { locale: dateLocale })}
                </div>
                <div className="text-2xl">
                  {format(day, "d MMM", { locale: dateLocale })}
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[200px]">
                {isHoliday ? (
                  <div className="text-center text-red-500 py-4 font-medium">
                    {t("admin.holiday")}
                  </div>
                ) : (
                  <>
                    {daySlots.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        {t("admin.no_slots")}
                      </div>
                    )}
                    {daySlots.map((slot) => {
                      const student = users?.find(
                        (u) => u.id === slot.studentId
                      );
                      const isCommute = slot.locationType === "commute";
                      const startTime = new Date(slot.startTime);
                      const commuteStart = isCommute
                        ? addMinutes(startTime, -(slot.travelMinutes || 0))
                        : null;

                      return (
                        <div
                          key={slot.id}
                          className={`group relative text-sm p-3 rounded-md border shadow-sm transition-all ${
                            slot.isBooked
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200"
                              : "bg-green-50 dark:bg-green-900/20 border-green-200"
                          }`}
                        >
                          <div className="font-bold flex justify-between items-center mb-1">
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1 text-base">
                                {format(startTime, "HH:mm")}
                              </span>
                              {isCommute && commuteStart && (
                                <span
                                  className="text-xs text-orange-600 flex items-center gap-1 mt-0.5"
                                  title="Godzina wyjazdu"
                                >
                                  <Car className="h-3 w-3" />
                                  Wyjazd: {format(commuteStart, "HH:mm")}
                                </span>
                              )}
                            </div>

                            {/* --- PRZYCISKI AKCJI --- */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white/50 dark:bg-black/50 rounded-md p-1 shadow-sm backdrop-blur-sm">
                              {/* EDYCJA (Dostępna zawsze) */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary hover:text-primary-foreground hover:bg-primary"
                                onClick={() => setEditingSlot(slot)}
                                title={t("admin.edit_slot_title")}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>

                              {slot.isBooked && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                                  onClick={() => {
                                    if (
                                      window.confirm(t("booking.cancel_desc"))
                                    )
                                      cancelSlotMutation.mutate(slot.id);
                                  }}
                                  title={t("booking.cancel_btn")}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (window.confirm(t("admin.delete_confirm")))
                                    deleteSlotMutation.mutate({
                                      id: slot.id,
                                      date: new Date(slot.startTime),
                                    });
                                }}
                                title={t("admin.delete")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {slot.isBooked ? (
                            <div className="space-y-1 mt-2">
                              <div className="font-medium text-blue-700 dark:text-blue-300">
                                {student?.name || t("admin.unknown_student")}
                              </div>
                              <div className="flex justify-between items-center text-xs mt-1 pt-1 border-t border-blue-200/50">
                                <span className="font-semibold">
                                  {slot.price} PLN
                                </span>
                                {isCommute && (
                                  <span className="text-orange-600 font-medium">
                                    +{slot.travelMinutes} min dojazdu
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-green-700 dark:text-green-400 font-medium flex justify-between items-center mt-2">
                              <span>{t("admin.available")}</span>
                              {isCommute && (
                                <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1 rounded flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {slot.travelMinutes}m
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD SLOT MODAL --- */}
      <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.new_slot_title")}</DialogTitle>
            <DialogDescription>
              Wprowadź godzinę rozpoczęcia <b>lekcji</b>. Jeśli wybierzesz
              dojazd, system zarezerwuje czas <b>przed</b> lekcją.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("admin.slot_date")}</Label>
                <Input
                  type="date"
                  value={
                    newSlotData.startTime
                      ? format(newSlotData.startTime, "yyyy-MM-dd")
                      : ""
                  }
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const current = newSlotData.startTime || new Date();
                    const newDate = new Date(e.target.value);
                    newDate.setHours(current.getHours(), current.getMinutes());
                    setNewSlotData({ ...newSlotData, startTime: newDate });
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.hour")}</Label>
                <Input
                  type="time"
                  value={
                    newSlotData.startTime
                      ? format(newSlotData.startTime, "HH:mm")
                      : ""
                  }
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const [h, m] = e.target.value.split(":").map(Number);
                    const current = newSlotData.startTime || new Date();
                    const newDate = new Date(current);
                    newDate.setHours(h, m);
                    setNewSlotData({ ...newSlotData, startTime: newDate });
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("admin.slot_duration")}</Label>
                <Input
                  type="number"
                  value={newSlotData.duration ?? 0}
                  onChange={(e) => {
                    const newDuration = parseInt(e.target.value) || 0;
                    setNewSlotData({
                      ...newSlotData,
                      duration: newDuration,
                      price: Math.ceil((newDuration / 60) * 80),
                    });
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.price")}</Label>
                <Input
                  type="number"
                  value={newSlotData.price ?? 0}
                  onChange={(e) =>
                    setNewSlotData({
                      ...newSlotData,
                      price: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("admin.location_type")}</Label>
              <Select
                value={newSlotData.locationType || "onsite"}
                onValueChange={(val) =>
                  setNewSlotData({ ...newSlotData, locationType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onsite">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {t("admin.loc_onsite")}
                    </div>
                  </SelectItem>
                  <SelectItem value="commute">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-orange-500" />
                      {t("admin.loc_commute")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newSlotData.locationType === "commute" && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                <Label>{t("admin.travel_time")}</Label>
                <Input
                  type="number"
                  value={newSlotData.travelMinutes ?? 0}
                  onChange={(e) =>
                    setNewSlotData({
                      ...newSlotData,
                      travelMinutes: parseInt(e.target.value),
                    })
                  }
                />
                {newSlotData.startTime && newSlotData.travelMinutes && (
                  <div className="text-xs text-orange-700 mt-1">
                    Będziesz musiał wyjechać o:{" "}
                    <b>
                      {format(
                        addMinutes(
                          newSlotData.startTime,
                          -newSlotData.travelMinutes
                        ),
                        "HH:mm"
                      )}
                    </b>
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label>Uczeń (opcjonalnie)</Label>
              <Select
                onValueChange={(val) =>
                  setNewSlotData({
                    ...newSlotData,
                    studentId: val === "none" ? undefined : parseInt(val),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.select_student")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Brak --</SelectItem>
                  {users
                    ?.filter((u) => u.role === "student")
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {isAddCollision && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span className="text-sm font-semibold">
                  {t("admin.collision_detected")}
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreateSlot} disabled={isAddCollision}>
              {t("admin.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDIT SLOT MODAL --- */}
      <Dialog
        open={!!editingSlot}
        onOpenChange={(open) => !open && setEditingSlot(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.edit_slot_title")}</DialogTitle>
            <DialogDescription>
              {editingSlot &&
                `${format(
                  new Date(editingSlot.startTime),
                  "EEEE, d MMMM yyyy",
                  { locale: dateLocale }
                )}`}
            </DialogDescription>
          </DialogHeader>
          {editingSlot && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (isEditCollision) return;
                const formData = new FormData(e.currentTarget);
                const studentIdRaw = formData.get("studentId") as string;
                const studentId =
                  studentIdRaw && studentIdRaw !== "none"
                    ? parseInt(studentIdRaw)
                    : null;

                let newStartTime: Date | undefined;
                let newEndTime: Date | undefined;
                if (editFormTime && editFormDuration) {
                  const [h, m] = editFormTime.split(":").map(Number);
                  newStartTime = new Date(editingSlot.startTime);
                  newStartTime.setHours(h, m, 0, 0);

                  // endTime = startTime + duration (BEZ travel)
                  newEndTime = addMinutes(newStartTime, editFormDuration);
                }

                updateSlotMutation.mutate({
                  id: editingSlot.id,
                  data: {
                    studentId,
                    isBooked: !!studentId,
                    price: editFormPrice,
                    topic: !!studentId ? "Korepetycje" : undefined,
                    startTime: newStartTime,
                    endTime: newEndTime,
                    locationType: editFormLocation,
                    travelMinutes:
                      editFormLocation === "commute" ? editFormTravel : 0,
                  },
                });
              }}
              className="space-y-4 py-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("admin.hour")}</Label>
                  <Input
                    type="time"
                    value={editFormTime}
                    onChange={(e) => setEditFormTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("admin.slot_duration")}</Label>
                  <Input
                    type="number"
                    value={editFormDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setEditFormDuration(val);
                      setEditFormPrice(Math.ceil((val / 60) * 80));
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.location_type")}</Label>
                <Select
                  value={editFormLocation}
                  onValueChange={setEditFormLocation}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {t("admin.loc_onsite")}
                      </div>
                    </SelectItem>
                    <SelectItem value="commute">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-orange-500" />
                        {t("admin.loc_commute")}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editFormLocation === "commute" && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                  <Label>{t("admin.travel_time")}</Label>
                  <Input
                    type="number"
                    value={editFormTravel}
                    onChange={(e) =>
                      setEditFormTravel(parseInt(e.target.value) || 0)
                    }
                  />
                  {editFormTime && (
                    <div className="text-xs text-orange-700 mt-1">
                      Będziesz musiał wyjechać o:{" "}
                      <b>
                        {(() => {
                          const [h, m] = editFormTime.split(":").map(Number);
                          const date = new Date();
                          date.setHours(h, m);
                          return format(
                            addMinutes(date, -editFormTravel),
                            "HH:mm"
                          );
                        })()}
                      </b>
                    </div>
                  )}
                </div>
              )}
              <div className="grid gap-2">
                <Label>{t("admin.assign_student")}</Label>
                {/* --- SEKCJA WYBORU UCZNIA (Domyślnie wybrany obecny) --- */}
                <Select
                  name="studentId"
                  defaultValue={editingSlot.studentId?.toString() || "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.select_student")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("admin.student_none")}
                    </SelectItem>
                    {users
                      ?.filter((u) => u.role === "student")
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("admin.price_optional")}</Label>
                <Input
                  type="number"
                  value={editFormPrice}
                  onChange={(e) =>
                    setEditFormPrice(parseInt(e.target.value) || 0)
                  }
                />
              </div>
              {isEditCollision && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-semibold">
                    {t("admin.collision_detected")}
                  </span>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isEditCollision}>
                  {t("admin.save")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
