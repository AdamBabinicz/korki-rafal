import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Car,
  MapPin,
  LayoutTemplate,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { format, addWeeks } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import type { User, WeeklySchedule } from "@shared/schema";

// Helper: zamiana HH:mm na minuty
const timeToMinutes = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Helper: wysyłanie powiadomień
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
  } catch (e) {
    console.error(e);
  }
};

export default function TemplateTab() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const dateLocale = i18n.language.startsWith("pl") ? pl : enUS;

  // --- STANY ---
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genRange, setGenRange] = useState({
    start: new Date(),
    end: addWeeks(new Date(), 4),
  });

  const [templateForm, setTemplateForm] = useState({
    dayOfWeek: "1",
    startTime: "",
    durationMinutes: "60",
    price: "80",
    studentId: "none",
    locationType: "onsite",
    travelMinutes: "0",
  });

  const [editingTemplateItem, setEditingTemplateItem] =
    useState<WeeklySchedule | null>(null);

  // Stany formularza edycji
  const [tplFormDuration, setTplFormDuration] = useState(60);
  const [tplFormPrice, setTplFormPrice] = useState(80);
  const [tplFormLocation, setTplFormLocation] = useState("onsite");
  const [tplFormTravel, setTplFormTravel] = useState(0);

  // --- DATA ---
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: weeklySchedule } = useQuery<WeeklySchedule[]>({
    queryKey: ["/api/weekly-schedule"],
  });

  // Aktualizacja formularza edycji po otwarciu modala
  useEffect(() => {
    if (editingTemplateItem) {
      setTplFormDuration(editingTemplateItem.durationMinutes);
      setTplFormPrice(
        Math.ceil((editingTemplateItem.durationMinutes / 60) * 80)
      );
      setTplFormLocation(editingTemplateItem.locationType || "onsite");
      setTplFormTravel(editingTemplateItem.travelMinutes || 0);
    }
  }, [editingTemplateItem]);

  // --- KOLIZJE ---
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

  // --- MUTACJE ---
  const createWeeklyItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const res = await apiRequest("POST", "/api/weekly-schedule", item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-schedule"] });
      toast({ title: t("admin.template_added") });
      // Reset godziny po dodaniu
      setTemplateForm((prev) => ({ ...prev, startTime: "" }));
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

  const deleteWeeklyItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/weekly-schedule/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-schedule"] });
      toast({ title: t("admin.template_removed") });
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

  // --- RENDER ---
  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("admin.template_title")}</CardTitle>
          <CardDescription>{t("admin.template_desc")}</CardDescription>
        </div>

        {/* Przycisk Generowania (umieszczony tutaj dla wygody) */}
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              {t("admin.generate_from_template")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.generate_title")}</DialogTitle>
              <DialogDescription>{t("admin.generate_desc")}</DialogDescription>
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
                          ? format(genRange.end, "PPP", { locale: dateLocale })
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
                onClick={() =>
                  generateFromTemplateMutation.mutate({
                    startDate: genRange.start.toISOString(),
                    endDate: genRange.end.toISOString(),
                  })
                }
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
      </CardHeader>

      <CardContent>
        {/* Formularz dodawania */}
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
                  setTemplateForm({ ...templateForm, price: e.target.value })
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

        {/* Lista szablonów */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {[1, 2, 3, 4, 5, 6].map((dayNum) => (
            <div key={dayNum} className="space-y-3">
              <div className="font-bold text-center border-b pb-2 text-primary">
                {t(`admin.days.${dayNum}`)}
              </div>
              {weeklySchedule?.filter((i) => i.dayOfWeek === dayNum).length ===
                0 && (
                <div className="text-center text-xs text-muted-foreground py-2">
                  {t("admin.empty")}
                </div>
              )}
              {weeklySchedule
                ?.filter((i) => i.dayOfWeek === dayNum)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((item) => {
                  const student = users?.find((u) => u.id === item.studentId);
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
                            (+{item.travelMinutes} {t("admin.commute_suffix")})
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

        {/* Modal edycji elementu szablonu */}
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

                  const formData = new FormData(e.currentTarget);
                  const startTime = formData.get("startTime") as string;
                  const studentIdRaw = formData.get("studentId") as string;
                  const studentId =
                    studentIdRaw && studentIdRaw !== "none"
                      ? parseInt(studentIdRaw)
                      : null;
                  const locationType = tplFormLocation;
                  const travelMinutes =
                    locationType === "commute" ? tplFormTravel : 0;

                  updateWeeklyItemMutation.mutate({
                    id: editingTemplateItem.id,
                    data: {
                      dayOfWeek: editingTemplateItem.dayOfWeek,
                      startTime,
                      durationMinutes: tplFormDuration,
                      price: tplFormPrice,
                      studentId,
                      locationType,
                      travelMinutes,
                    },
                  });
                }}
                className="space-y-4 py-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Dzień tygodnia</Label>
                    <Select
                      disabled
                      value={editingTemplateItem.dayOfWeek.toString()}
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
                  <div className="grid gap-2">
                    <Label>Godzina</Label>
                    <Input
                      name="startTime"
                      type="time"
                      value={editingTemplateItem.startTime}
                      onChange={(e) =>
                        setEditingTemplateItem({
                          ...editingTemplateItem,
                          startTime: e.target.value,
                        })
                      }
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
                      type="number"
                      value={tplFormDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setTplFormDuration(val);
                        setTplFormPrice(Math.ceil((val / 60) * 80));
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Cena (PLN)</Label>
                    <Input
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
                      <SelectItem value="none">-- Wolny termin --</SelectItem>
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

                {checkTemplateCollision(
                  editingTemplateItem.dayOfWeek,
                  editingTemplateItem.startTime,
                  tplFormDuration,
                  tplFormLocation,
                  tplFormTravel,
                  editingTemplateItem.id
                ) && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
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
  );
}
