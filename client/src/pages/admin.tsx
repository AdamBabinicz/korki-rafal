import { useState, useEffect, useMemo } from "react";
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
  setHours,
  setMinutes,
} from "date-fns";
import { pl, enUS } from "date-fns/locale";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Users,
  LayoutTemplate,
  CheckCircle2,
  UserCog,
  Pencil,
  XCircle,
  Car,
  Bell,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type {
  Slot,
  User,
  WeeklySchedule,
  InsertSlot,
  InsertUser,
} from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useUser } from "@/hooks/use-auth";

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

// Pomocnicza funkcja do zamiany "HH:mm" na minuty od północy
const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export default function AdminPanel() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const { data: user } = useUser();

  const dateLocale = i18n.language.startsWith("pl") ? pl : enUS;

  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  weekEnd.setHours(23, 59, 59, 999);

  const sendTelegramNotification = async (message: string) => {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.warn("Brak konfiguracji Telegrama w .env");
      return;
    }

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
      console.error("Błąd wysyłania na Telegram:", error);
    }
  };

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

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: weeklySchedule } = useQuery<WeeklySchedule[]>({
    queryKey: ["/api/weekly-schedule"],
  });

  const { data: waitlist } = useQuery<any[]>({
    queryKey: ["/api/waitlist"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/waitlist");
      return res.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      phone?: string;
      password?: string;
    }) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setAdminProfileForm((prev) => ({ ...prev, password: "" }));
      toast({
        title: t("dashboard.save_changes"),
        description: t("toasts.success"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
        {
          locale: dateLocale,
        }
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

  const updateWeeklyItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/weekly-schedule/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-schedule"] });
      toast({ title: t("toasts.success") });
      setEditingTemplateItem(null);
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
    mutationFn: async ({ id, date }: { id: number; date: Date }) => {
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

  const generateFromTemplateMutation = useMutation({
    mutationFn: async (data: { startDate: string; endDate: string }) => {
      const res = await apiRequest(
        "POST",
        "/api/slots/generate-from-template",
        data
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: t("admin.generate_submit"),
        description: data.message,
      });
      setIsGenerateOpen(false);

      sendTelegramNotification(
        `🔔 <b>${t("notifications.title")}</b>\n${t(
          "notifications.schedule_generated"
        )}`
      );
    },
  });

  const createWeeklyItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const res = await apiRequest("POST", "/api/weekly-schedule", item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-schedule"] });
      toast({ title: t("admin.template_added") });
      // Czyścimy pole godziny po dodaniu, aby uniknąć kolizji przy kolejnym wejściu
      setTemplateForm((prev) => ({ ...prev, startTime: "" }));
    },
  });

  const deleteWeeklyItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/weekly-schedule/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-schedule"] });
      toast({ title: t("admin.template_removed") });
    },
  });

  const deleteWaitlistMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/waitlist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({ title: t("admin.request_deleted") });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("toasts.success") });
      setIsAddStudentOpen(false);

      sendTelegramNotification(
        `🔔 <b>${t("notifications.title")}</b>\n${t(
          "notifications.new_student"
        )}`
      );
    },
    onError: (err: Error) => {
      toast({
        title: t("toasts.error"),
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<InsertUser>;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("toasts.success") });
      setEditingStudentId(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("admin.student_deleted") });

      sendTelegramNotification(
        `🔔 <b>${t("notifications.title")}</b>\n${t(
          "notifications.student_deleted"
        )}`
      );
    },
  });

  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [editingTemplateItem, setEditingTemplateItem] =
    useState<WeeklySchedule | null>(null);

  const [editFormTime, setEditFormTime] = useState("");
  const [editFormDuration, setEditFormDuration] = useState(60);
  const [editFormPrice, setEditFormPrice] = useState(80);
  const [editFormLocation, setEditFormLocation] = useState("onsite");
  const [editFormTravel, setEditFormTravel] = useState(0);

  const [tplFormDuration, setTplFormDuration] = useState(60);
  const [tplFormPrice, setTplFormPrice] = useState(80);
  const [tplFormLocation, setTplFormLocation] = useState("onsite");
  const [tplFormTravel, setTplFormTravel] = useState(0);

  const [newSlotData, setNewSlotData] = useState<
    Partial<InsertSlot> & { duration: number }
  >({
    startTime: new Date(),
    duration: 60,
    price: 80,
    locationType: "onsite",
    travelMinutes: 0,
  });

  const [genRange, setGenRange] = useState({
    start: new Date(),
    end: addWeeks(new Date(), 4),
  });

  const [newStudent, setNewStudent] = useState<Partial<InsertUser>>({
    role: "student",
    defaultPrice: 80,
  });

  // --- ZMIANA: startTime domyślnie pusty, aby uniknąć kolizji na starcie ---
  const [templateForm, setTemplateForm] = useState({
    dayOfWeek: "1",
    startTime: "", // Było "16:00"
    durationMinutes: "60",
    price: "80",
    studentId: "none",
    locationType: "onsite",
    travelMinutes: "0",
  });

  const [adminProfileForm, setAdminProfileForm] = useState({
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (user) {
      setAdminProfileForm((prev) => ({
        ...prev,
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // Automatyczne przeliczanie ceny w edycji slotu
  useEffect(() => {
    if (editingSlot) {
      const totalDuration = differenceInMinutes(
        new Date(editingSlot.endTime),
        new Date(editingSlot.startTime)
      );
      const travel = editingSlot.travelMinutes || 0;
      const lessonDuration = totalDuration - travel;
      const finalDuration = lessonDuration > 0 ? lessonDuration : 60;

      setEditFormTime(format(new Date(editingSlot.startTime), "HH:mm"));
      setEditFormDuration(finalDuration);
      setEditFormPrice(Math.ceil((finalDuration / 60) * 80));
      setEditFormLocation(editingSlot.locationType || "onsite");
      setEditFormTravel(travel);
    }
  }, [editingSlot]);

  // --- NAPRAWA: Ładowanie poprawnych danych do modala edycji szablonu ---
  useEffect(() => {
    if (editingTemplateItem) {
      setTplFormDuration(editingTemplateItem.durationMinutes);
      setTplFormPrice(
        Math.ceil((editingTemplateItem.durationMinutes / 60) * 80)
      );
      // Tutaj był błąd - brakowało ustawienia tych stanów, przez co modal resetował się do "onsite"
      setTplFormLocation(editingTemplateItem.locationType || "onsite");
      setTplFormTravel(editingTemplateItem.travelMinutes || 0);
    }
  }, [editingTemplateItem]);

  const nextWeek = () => setCurrentWeekStart((d) => addWeeks(d, 1));
  const prevWeek = () => setCurrentWeekStart((d) => subWeeks(d, 1));

  // --- LOGIKA KOLIZJI DLA POJEDYNCZYCH SLOTÓW ---
  const checkCollision = (
    start: Date,
    duration: number,
    locType: string,
    travel: number,
    excludeSlotId?: number
  ) => {
    if (!slots) return false;
    const extraTime = locType === "commute" ? travel : 0;
    const totalMinutes = duration + extraTime;
    const end = addMinutes(start, totalMinutes);

    return slots.some((s) => {
      if (excludeSlotId && s.id === excludeSlotId) return false;
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      return start < sEnd && end > sStart;
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

  // --- LOGIKA KOLIZJI DLA SZABLONU ---
  const checkTemplateCollision = (
    dayOfWeek: number,
    startTimeStr: string,
    duration: number,
    locType: string,
    travel: number,
    excludeId?: number
  ) => {
    if (!weeklySchedule || !startTimeStr) return false;

    const proposedStartMin = timeToMinutes(startTimeStr);
    const extraTime = locType === "commute" ? travel : 0;
    const proposedEndMin = proposedStartMin + duration + extraTime;

    return weeklySchedule.some((item) => {
      if (item.dayOfWeek !== dayOfWeek) return false;
      if (excludeId && item.id === excludeId) return false;

      const itemStartMin = timeToMinutes(item.startTime);
      const itemExtra =
        item.locationType === "commute" ? item.travelMinutes || 0 : 0;
      const itemEndMin = itemStartMin + item.durationMinutes + itemExtra;

      return proposedStartMin < itemEndMin && proposedEndMin > itemStartMin;
    });
  };

  const isTemplateAddCollision = useMemo(() => {
    return checkTemplateCollision(
      parseInt(templateForm.dayOfWeek),
      templateForm.startTime,
      parseInt(templateForm.durationMinutes),
      templateForm.locationType || "onsite",
      parseInt(templateForm.travelMinutes || "0")
    );
  }, [templateForm, weeklySchedule]);

  const handleOpenAddSlot = () => {
    const initDate = new Date(weekStart);
    const now = new Date();
    initDate.setHours(now.getHours());
    initDate.setMinutes(now.getMinutes());

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
    const totalDuration = lessonDuration + travel;

    const end = addMinutes(newSlotData.startTime, totalDuration);

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

  const handleGenerate = () => {
    generateFromTemplateMutation.mutate({
      startDate: genRange.start.toISOString(),
      endDate: genRange.end.toISOString(),
    });
  };

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="mt-16 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">
            {t("admin.title")}
          </h2>
          <p className="text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 lg:w-auto h-auto">
          <TabsTrigger
            value="calendar"
            className="py-2 h-auto whitespace-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_calendar")}
          </TabsTrigger>
          <TabsTrigger
            value="template"
            className="py-2 h-auto whitespace-normal"
          >
            <LayoutTemplate className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_template")}
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="py-2 h-auto whitespace-normal"
          >
            <Users className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_students")}
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="py-2 h-auto whitespace-normal"
          >
            <Bell className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.requests_title")}
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="py-2 h-auto whitespace-normal col-span-2 md:col-span-1"
          >
            <UserCog className="mr-2 h-4 w-4 shrink-0" />
            {t("admin.tab_profile")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          {/* ... (KOD KALENDARZA - BEZ ZMIAN) ... */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevWeek}
                aria-label="Poprzedni tydzień"
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
                onClick={nextWeek}
                aria-label="Następny tydzień"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <Button className="w-full md:w-auto" onClick={handleOpenAddSlot}>
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.add_slot_btn")}
              </Button>

              <Dialog open={isAddSlotOpen} onOpenChange={setIsAddSlotOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{t("admin.new_slot_title")}</DialogTitle>
                    <DialogDescription>
                      Wprowadź szczegóły nowego terminu.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {/* ... (FORMULARZ DODAWANIA SLOTU) ... */}
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
                            newDate.setHours(current.getHours());
                            newDate.setMinutes(current.getMinutes());
                            setNewSlotData({
                              ...newSlotData,
                              startTime: newDate,
                            });
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
                            const [hours, minutes] = e.target.value
                              .split(":")
                              .map(Number);
                            const current = newSlotData.startTime || new Date();
                            const newDate = new Date(current);
                            newDate.setHours(hours);
                            newDate.setMinutes(minutes);
                            setNewSlotData({
                              ...newSlotData,
                              startTime: newDate,
                            });
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
                            const newPrice = Math.ceil((newDuration / 60) * 80);
                            setNewSlotData({
                              ...newSlotData,
                              duration: newDuration,
                              price: newPrice,
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
                      <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
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
                        <p className="text-xs text-muted-foreground">
                          {t("admin.travel_time_hint")}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label>Uczeń (opcjonalnie)</Label>
                      <Select
                        onValueChange={(val) =>
                          setNewSlotData({
                            ...newSlotData,
                            studentId:
                              val === "none" ? undefined : parseInt(val),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("admin.select_student")}
                          />
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
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md animate-in fade-in slide-in-from-bottom-2">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-semibold">
                          {t("admin.collision_detected")}
                        </span>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateSlot}
                      disabled={isAddCollision}
                    >
                      {t("admin.save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    {t("admin.generate_from_template")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("admin.generate_title")}</DialogTitle>
                    <DialogDescription>
                      {t("admin.generate_desc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("admin.start_date")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {genRange.start
                                ? format(genRange.start, "PPP", {
                                    locale: dateLocale,
                                  })
                                : "Data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={genRange.start}
                              onSelect={(d) =>
                                d && setGenRange({ ...genRange, start: d })
                              }
                              initialFocus
                              locale={dateLocale}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label>{t("admin.end_date")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {genRange.end
                                ? format(genRange.end, "PPP", {
                                    locale: dateLocale,
                                  })
                                : "Data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={genRange.end}
                              onSelect={(d) =>
                                d && setGenRange({ ...genRange, end: d })
                              }
                              initialFocus
                              locale={dateLocale}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleGenerate}
                      disabled={generateFromTemplateMutation.isPending}
                    >
                      {generateFromTemplateMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("admin.generate_submit")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {days.map((day) => {
              const daySlots =
                slots?.filter((s) => isSameDay(new Date(s.startTime), day)) ||
                [];
              daySlots.sort(
                (a, b) =>
                  new Date(a.startTime).getTime() -
                  new Date(b.startTime).getTime()
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
                          return (
                            <div
                              key={slot.id}
                              className={`
                                group relative text-sm p-3 rounded-md border shadow-sm transition-all
                                ${
                                  slot.isBooked
                                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                    : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                }
                              `}
                            >
                              <div className="font-bold flex justify-between items-center mb-1">
                                <span className="flex items-center gap-1">
                                  {format(new Date(slot.startTime), "HH:mm")}
                                  {isCommute && (
                                    <Car className="h-3 w-3 text-orange-600" />
                                  )}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!slot.isBooked && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-primary hover:text-primary-foreground hover:bg-primary"
                                      onClick={() => setEditingSlot(slot)}
                                      title={t("admin.edit_slot_title")}
                                      aria-label={t("admin.edit_slot_title")}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                  )}

                                  {slot.isBooked && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            t("booking.cancel_desc")
                                          )
                                        ) {
                                          cancelSlotMutation.mutate(slot.id);
                                        }
                                      }}
                                      title={t("booking.cancel_title")}
                                      aria-label={t("booking.cancel_title")}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          t("admin.delete_confirm")
                                        )
                                      ) {
                                        deleteSlotMutation.mutate({
                                          id: slot.id,
                                          date: new Date(slot.startTime),
                                        });
                                      }
                                    }}
                                    title={t("admin.delete")}
                                    aria-label={t("admin.delete")}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {slot.isBooked ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-blue-700 dark:text-blue-300">
                                    {student?.name ||
                                      t("admin.unknown_student")}
                                  </div>
                                  {student?.phone && (
                                    <div className="text-xs opacity-70">
                                      {student.phone}
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-xs mt-1">
                                    <span className="font-semibold">
                                      {slot.price} PLN
                                    </span>
                                    {isCommute && (
                                      <span className="text-orange-600 font-medium">
                                        +{slot.travelMinutes} min
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-green-700 dark:text-green-400 font-medium flex justify-between items-center">
                                  <span>{t("admin.available")}</span>
                                  {isCommute && (
                                    <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-1 rounded">
                                      +{slot.travelMinutes}m
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

          {/* MODAL EDYCJI SLOTU (POPRAWIONE TŁUMACZENIA + NAPRAWA DOM) */}
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
                    const timeRaw = editFormTime;

                    const studentId =
                      studentIdRaw && studentIdRaw !== "none"
                        ? parseInt(studentIdRaw)
                        : null;

                    const price = editFormPrice;
                    const duration = editFormDuration;
                    const locationType = editFormLocation;
                    const travel =
                      locationType === "commute" ? editFormTravel : 0;

                    let newStartTime: Date | undefined;
                    let newEndTime: Date | undefined;

                    if (timeRaw && duration) {
                      const [hours, minutes] = timeRaw.split(":").map(Number);
                      newStartTime = new Date(editingSlot.startTime);
                      newStartTime.setHours(hours, minutes);
                      const totalDuration = duration + travel;
                      newEndTime = addMinutes(newStartTime, totalDuration);
                    }

                    const isBooked = !!studentId;
                    const topic = isBooked ? "Korepetycje" : undefined;

                    updateSlotMutation.mutate({
                      id: editingSlot.id,
                      data: {
                        studentId,
                        isBooked,
                        price,
                        topic,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        locationType,
                        travelMinutes: travel,
                      },
                    });
                  }}
                  className="space-y-4 py-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>{t("admin.hour")}</Label>
                      <Input
                        name="time"
                        type="time"
                        value={editFormTime}
                        onChange={(e) => setEditFormTime(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("admin.slot_duration")}</Label>
                      <Input
                        name="duration"
                        type="number"
                        value={editFormDuration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditFormDuration(val);
                          const calculatedPrice = Math.ceil((val / 60) * 80);
                          setEditFormPrice(calculatedPrice);
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
                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                      <Label>{t("admin.travel_time")}</Label>
                      <Input
                        type="number"
                        value={editFormTravel}
                        onChange={(e) =>
                          setEditFormTravel(parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>{t("admin.assign_student")}</Label>
                    <Select name="studentId">
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
                      name="price"
                      type="number"
                      value={editFormPrice}
                      onChange={(e) =>
                        setEditFormPrice(parseInt(e.target.value) || 0)
                      }
                    />
                  </div>

                  {isEditCollision && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md animate-in fade-in slide-in-from-bottom-2">
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
        </TabsContent>

        <TabsContent value="template" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.template_title")}</CardTitle>
              <CardDescription>{t("admin.template_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* FORMULARZ DODAWANIA DO SZABLONU (POPRAWIONE) */}
              <div className="grid gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>{t("admin.day")}</Label>
                    <Select
                      value={templateForm.dayOfWeek}
                      onValueChange={(v) =>
                        setTemplateForm({ ...templateForm, dayOfWeek: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t("admin.days.1")}</SelectItem>
                        <SelectItem value="2">{t("admin.days.2")}</SelectItem>
                        <SelectItem value="3">{t("admin.days.3")}</SelectItem>
                        <SelectItem value="4">{t("admin.days.4")}</SelectItem>
                        <SelectItem value="5">{t("admin.days.5")}</SelectItem>
                        <SelectItem value="6">{t("admin.days.6")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("admin.hour")}</Label>
                    <Input
                      type="time"
                      value={templateForm.startTime}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("admin.time")}</Label>
                    <Input
                      type="number"
                      value={templateForm.durationMinutes}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          durationMinutes: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t("admin.price")}</Label>
                    <Input
                      type="number"
                      value={templateForm.price}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          price: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{t("admin.student")}</Label>
                    <Select
                      value={templateForm.studentId}
                      onValueChange={(v) =>
                        setTemplateForm({ ...templateForm, studentId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                  <div>
                    <Label>{t("admin.location_type")}</Label>
                    <Select
                      value={templateForm.locationType || "onsite"}
                      onValueChange={(v) =>
                        setTemplateForm({ ...templateForm, locationType: v })
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
                  {templateForm.locationType === "commute" && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <Label>{t("admin.travel_time")}</Label>
                      <Input
                        type="number"
                        value={templateForm.travelMinutes}
                        onChange={(e) =>
                          setTemplateForm({
                            ...templateForm,
                            travelMinutes: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {isTemplateAddCollision && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md animate-in fade-in slide-in-from-bottom-2 mt-2">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-semibold">
                      {t("admin.collision_detected")}
                    </span>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button
                    className="w-full md:w-auto"
                    disabled={isTemplateAddCollision || !templateForm.startTime}
                    onClick={() => {
                      createWeeklyItemMutation.mutate({
                        dayOfWeek: parseInt(templateForm.dayOfWeek),
                        startTime: templateForm.startTime,
                        durationMinutes: parseInt(templateForm.durationMinutes),
                        price: parseInt(templateForm.price),
                        studentId:
                          templateForm.studentId === "none"
                            ? null
                            : parseInt(templateForm.studentId),
                        locationType: templateForm.locationType,
                        travelMinutes:
                          templateForm.locationType === "commute"
                            ? parseInt(templateForm.travelMinutes)
                            : 0,
                      });
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("admin.add_btn")}
                  </Button>
                </div>
              </div>

              {/* LISTA SZABLONÓW - BEZ ZMIAN */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5, 6].map((dayNum) => (
                  <div key={dayNum} className="space-y-3">
                    <div className="font-bold text-center border-b pb-2 text-primary">
                      {t(`admin.days.${dayNum}`)}
                    </div>
                    {weeklySchedule?.filter((i) => i.dayOfWeek === dayNum)
                      .length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-2">
                        {t("admin.empty")}
                      </div>
                    )}
                    {weeklySchedule
                      ?.filter((i) => i.dayOfWeek === dayNum)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((item) => {
                        const student = users?.find(
                          (u) => u.id === item.studentId
                        );
                        const isCommute = item.locationType === "commute";
                        return (
                          <div
                            key={item.id}
                            className="bg-card border rounded p-3 text-sm shadow-sm relative group"
                          >
                            <div className="font-bold text-lg flex justify-between items-center">
                              {item.startTime}
                              {isCommute && (
                                <Car className="h-4 w-4 text-orange-600" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {item.durationMinutes} min
                              {isCommute && (
                                <span className="text-orange-600 ml-1">
                                  (+{item.travelMinutes}{" "}
                                  {t("admin.commute_suffix")})
                                </span>
                              )}
                            </div>
                            {student ? (
                              <div className="font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                {student.name}
                              </div>
                            ) : (
                              <div className="text-green-600 dark:text-green-400 font-medium">
                                {t("admin.available")}
                              </div>
                            )}
                            <div className="mt-1 text-xs font-semibold">
                              {item.price} PLN
                            </div>

                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary hover:bg-primary/10"
                                onClick={() => setEditingTemplateItem(item)}
                                aria-label="Edytuj element szablonu"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                onClick={() =>
                                  deleteWeeklyItemMutation.mutate(item.id)
                                }
                                aria-label="Usuń element szablonu"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>

              {/* MODAL EDYCJI ELEMENTU SZABLONU (DODANE KOLIZJE I IKONKI) */}
              <Dialog
                open={!!editingTemplateItem}
                onOpenChange={(open) => !open && setEditingTemplateItem(null)}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edytuj element szablonu</DialogTitle>
                    <DialogDescription>
                      Zmiany wpłyną tylko na przyszłe generowania grafiku.
                    </DialogDescription>
                  </DialogHeader>
                  {editingTemplateItem && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (
                          checkTemplateCollision(
                            editingTemplateItem.dayOfWeek,
                            editingTemplateItem.startTime,
                            tplFormDuration,
                            tplFormLocation,
                            tplFormTravel,
                            editingTemplateItem.id
                          )
                        ) {
                          toast({
                            variant: "destructive",
                            title: t("toasts.error"),
                            description: t("admin.collision_detected"),
                          });
                          return;
                        }

                        // USUNIĘTO ODCZYTYWANIE dayOfWeek z FormData (bo jest disabled)
                        // Pobieramy dayOfWeek bezpośrednio z obiektu
                        const dayOfWeek = editingTemplateItem.dayOfWeek;

                        const formData = new FormData(e.currentTarget);
                        const startTime = formData.get("startTime") as string;
                        const studentIdRaw = formData.get(
                          "studentId"
                        ) as string;

                        const studentId =
                          studentIdRaw && studentIdRaw !== "none"
                            ? parseInt(studentIdRaw)
                            : null;

                        const durationMinutes = tplFormDuration;
                        const price = tplFormPrice;
                        const locationType = tplFormLocation;
                        // Rzutowanie na liczbę dla pewności (zmienna ze stanu)
                        const travelMinutes =
                          locationType === "commute" ? tplFormTravel : 0;

                        updateWeeklyItemMutation.mutate({
                          id: editingTemplateItem.id,
                          data: {
                            dayOfWeek,
                            startTime,
                            durationMinutes,
                            price,
                            studentId,
                            locationType,
                            travelMinutes: parseInt(travelMinutes.toString()),
                          },
                        });
                      }}
                      className="space-y-4 py-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Dzień tygodnia</Label>
                          <Select
                            name="dayOfWeek"
                            defaultValue={editingTemplateItem.dayOfWeek.toString()}
                            disabled
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">
                                {t("admin.days.1")}
                              </SelectItem>
                              <SelectItem value="2">
                                {t("admin.days.2")}
                              </SelectItem>
                              <SelectItem value="3">
                                {t("admin.days.3")}
                              </SelectItem>
                              <SelectItem value="4">
                                {t("admin.days.4")}
                              </SelectItem>
                              <SelectItem value="5">
                                {t("admin.days.5")}
                              </SelectItem>
                              <SelectItem value="6">
                                {t("admin.days.6")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Godzina</Label>
                          <Input
                            name="startTime"
                            type="time"
                            defaultValue={editingTemplateItem.startTime}
                            onChange={(e) => {
                              setEditingTemplateItem({
                                ...editingTemplateItem,
                                startTime: e.target.value,
                              });
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>{t("admin.location_type")}</Label>
                        <Select
                          value={tplFormLocation}
                          onValueChange={setTplFormLocation}
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Czas lekcji (min)</Label>
                          <Input
                            name="durationMinutes"
                            type="number"
                            value={tplFormDuration}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setTplFormDuration(val);
                              const calculatedPrice = Math.ceil(
                                (val / 60) * 80
                              );
                              setTplFormPrice(calculatedPrice);
                            }}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Cena (PLN)</Label>
                          <Input
                            name="price"
                            type="number"
                            value={tplFormPrice}
                            onChange={(e) =>
                              setTplFormPrice(parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      {tplFormLocation === "commute" && (
                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                          <Label>Czas dojazdu (min)</Label>
                          <Input
                            name="travelMinutes"
                            type="number"
                            value={tplFormTravel}
                            onChange={(e) =>
                              setTplFormTravel(parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label>Uczeń (stały)</Label>
                        <Select
                          name="studentId"
                          defaultValue={
                            editingTemplateItem.studentId?.toString() || "none"
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              -- Wolny termin --
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

                      {/* Ostrzeżenie o kolizji w edycji szablonu */}
                      {checkTemplateCollision(
                        editingTemplateItem.dayOfWeek,
                        editingTemplateItem.startTime,
                        tplFormDuration,
                        tplFormLocation,
                        tplFormTravel,
                        editingTemplateItem.id
                      ) && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md animate-in fade-in slide-in-from-bottom-2">
                          <AlertTriangle className="h-5 w-5 shrink-0" />
                          <span className="text-sm font-semibold">
                            {t("admin.collision_detected")}
                          </span>
                        </div>
                      )}

                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={checkTemplateCollision(
                            editingTemplateItem.dayOfWeek,
                            editingTemplateItem.startTime,
                            tplFormDuration,
                            tplFormLocation,
                            tplFormTravel,
                            editingTemplateItem.id
                          )}
                        >
                          Zapisz zmiany
                        </Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("admin.tab_students")}</CardTitle>
                <CardDescription>
                  {t("admin.students_list_desc")}
                </CardDescription>
              </div>
              <Dialog
                open={isAddStudentOpen}
                onOpenChange={setIsAddStudentOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("admin.add_student_btn")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("admin.add_student_title")}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>{t("auth.full_name")}</Label>
                      <Input
                        value={newStudent.name || ""}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("auth.username")}</Label>
                      <Input
                        autoComplete="username"
                        value={newStudent.username || ""}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            username: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("auth.password")}</Label>
                      <Input
                        autoComplete="new-password"
                        type="password"
                        value={newStudent.password || ""}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            password: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("admin.default_price")}</Label>
                      <Input
                        type="number"
                        value={newStudent.defaultPrice || 80}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            defaultPrice: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>E-mail</Label>
                      <Input
                        value={newStudent.email || ""}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() =>
                        createUserMutation.mutate(newStudent as InsertUser)
                      }
                    >
                      {t("admin.add_student_submit")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-left">
                      <th className="p-3 font-medium hidden md:table-cell">
                        {t("admin.table.id")}
                      </th>
                      <th className="p-3 font-medium">
                        {t("admin.table.name")}
                      </th>
                      <th className="p-3 font-medium">
                        {t("admin.table.username")}
                      </th>
                      <th className="p-3 font-medium">
                        {t("admin.table.email")}
                      </th>
                      <th className="p-3 font-medium">
                        {t("admin.table.phone")}
                      </th>
                      <th className="p-3 font-medium">
                        {t("admin.table.admin_notes")}
                      </th>
                      <th className="p-3 font-medium text-right">
                        {t("admin.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      ?.filter((u) => u.role === "student")
                      .map((student) => (
                        <tr
                          key={student.id}
                          className="border-b last:border-0 hover:bg-muted/20"
                        >
                          <td className="p-3 hidden md:table-cell">
                            {student.id}
                          </td>
                          <td className="p-3 font-medium">{student.name}</td>
                          <td className="p-3 text-muted-foreground">
                            {student.username}
                          </td>
                          <td className="p-3">{student.email || "-"}</td>
                          <td className="p-3">{student.phone || "-"}</td>
                          <td className="p-3">
                            <div className="max-w-[200px] truncate opacity-80">
                              {student.adminNotes || "-"}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog
                                open={editingStudentId === student.id}
                                onOpenChange={(open) =>
                                  !open && setEditingStudentId(null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      setEditingStudentId(student.id)
                                    }
                                    title={t("admin.edit")}
                                    aria-label="Edytuj ucznia"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      {t("admin.edit_student_title")}:{" "}
                                      {student.name}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Edytuj szczegóły konta ucznia.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const formData = new FormData(
                                        e.currentTarget
                                      );
                                      const rawData: any = Object.fromEntries(
                                        formData.entries()
                                      );

                                      // === PANCERNA WALIDACJA 3.0 (HYBRYDA) ===
                                      const cleanData: any = {};

                                      // 1. Nazwa (wymagana)
                                      if (rawData.name)
                                        cleanData.name = rawData.name.trim();

                                      // 2. Opcjonalne Stringi
                                      const textFields = [
                                        "phone",
                                        "address",
                                        "adminNotes",
                                      ];
                                      textFields.forEach((field) => {
                                        cleanData[field] = rawData[field]
                                          ? rawData[field].trim()
                                          : "";
                                      });

                                      // 3. Email
                                      if (
                                        rawData.email &&
                                        rawData.email.trim() !== ""
                                      ) {
                                        cleanData.email = rawData.email.trim();
                                      }

                                      // 4. Liczby
                                      if (
                                        rawData.defaultPrice &&
                                        rawData.defaultPrice !== ""
                                      ) {
                                        cleanData.defaultPrice = parseInt(
                                          rawData.defaultPrice
                                        );
                                      }

                                      // 5. Hasło
                                      if (
                                        rawData.password &&
                                        rawData.password.trim() !== ""
                                      ) {
                                        cleanData.password =
                                          rawData.password.trim();
                                      }

                                      updateUserMutation.mutate({
                                        id: student.id,
                                        data: cleanData,
                                      });
                                    }}
                                    className="space-y-4 py-4"
                                  >
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>{t("admin.table.name")}</Label>
                                        <Input
                                          name="name"
                                          defaultValue={student.name}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>
                                          {t("admin.table.username")}
                                        </Label>
                                        <Input
                                          autoComplete="username"
                                          name="username"
                                          defaultValue={student.username}
                                          readOnly
                                          className="bg-muted"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>{t("admin.table.email")}</Label>
                                        <Input
                                          name="email"
                                          defaultValue={student.email || ""}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>{t("admin.table.phone")}</Label>
                                        <Input
                                          name="phone"
                                          defaultValue={student.phone || ""}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>{t("admin.table.address")}</Label>
                                      <Input
                                        name="address"
                                        defaultValue={student.address || ""}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>
                                        {t("admin.table.admin_notes")}
                                      </Label>
                                      <Textarea
                                        name="adminNotes"
                                        defaultValue={student.adminNotes || ""}
                                        placeholder={t(
                                          "admin.notes_placeholder"
                                        )}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>{t("admin.new_password")}</Label>
                                      <Input
                                        autoComplete="new-password"
                                        name="password"
                                        type="password"
                                        placeholder="..."
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button type="submit">
                                        {t("dashboard.save_changes")}
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      t("admin.delete_confirm_student")
                                    )
                                  ) {
                                    deleteUserMutation.mutate(student.id);
                                  }
                                }}
                                title={t("admin.delete")}
                                aria-label="Usuń ucznia"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {(!users ||
                      users.filter((u) => u.role === "student").length ===
                        0) && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-8 text-center text-muted-foreground"
                        >
                          {t("admin.no_students")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.profile_title")}</CardTitle>
                <CardDescription>
                  {t("dashboard.profile_subtitle")}
                </CardDescription>
              </CardHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate(adminProfileForm);
                }}
              >
                <CardContent className="space-y-4">
                  {/* Ukryte pole username dla password managerów */}
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    style={{ display: "none" }}
                  />

                  <div className="space-y-2">
                    <Label>{t("admin.profile_email")}</Label>
                    <Input
                      value={adminProfileForm.email}
                      autoComplete="email"
                      onChange={(e) =>
                        setAdminProfileForm({
                          ...adminProfileForm,
                          email: e.target.value,
                        })
                      }
                      placeholder="admin@mathmentor.pl"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("admin.profile_email_hint")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("admin.profile_phone")}</Label>
                    <Input
                      value={adminProfileForm.phone}
                      onChange={(e) =>
                        setAdminProfileForm({
                          ...adminProfileForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+48..."
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label>{t("admin.new_password")}</Label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={adminProfileForm.password}
                      onChange={(e) =>
                        setAdminProfileForm({
                          ...adminProfileForm,
                          password: e.target.value,
                        })
                      }
                      placeholder={t("admin.new_password_placeholder")}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {t("dashboard.save_changes")}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <CheckCircle2 className="h-5 w-5" />
                  {t("admin.notification_status")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-foreground/80">
                  <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-black/20 border">
                    <span>{t("admin.email_notifications")}</span>
                    <span
                      className={
                        adminProfileForm.email &&
                        adminProfileForm.email.includes("@")
                          ? "text-green-600 font-bold"
                          : "text-red-500 font-bold"
                      }
                    >
                      {adminProfileForm.email &&
                      adminProfileForm.email.includes("@")
                        ? t("admin.active")
                        : t("admin.inactive")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.notification_hint")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
