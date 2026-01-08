import { useState } from "react";
import { Link } from "wouter";
import {
  useSlots,
  useBookSlot,
  useCancelSlot,
  useAddToWaitlist,
} from "@/hooks/use-slots";
import { useUser } from "@/hooks/use-auth";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isSunday,
  addMinutes,
} from "date-fns";
import { pl, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarCheck,
  BellRing,
  CalendarDays,
  Lock,
  ArrowLeft,
  XCircle,
  MapPin,
  Car,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { type Slot } from "@shared/schema";

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

export default function BookingPage() {
  const { data: user } = useUser();
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language === "pl" ? pl : enUS;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekStart = currentWeekStart;
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  weekEnd.setHours(23, 59, 59, 999);

  const { data: slots, isLoading } = useSlots({
    start: weekStart.toISOString(),
    end: weekEnd.toISOString(),
  });

  const bookSlotMutation = useBookSlot();
  const cancelSlotMutation = useCancelSlot();
  const addToWaitlistMutation = useAddToWaitlist();

  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistNote, setWaitlistNote] = useState("");

  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingTopic, setBookingTopic] = useState("");
  const [bookingDuration, setBookingDuration] = useState("60");
  const [locationType, setLocationType] = useState("onsite");

  const [slotToCancel, setSlotToCancel] = useState<Slot | null>(null);

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const now = new Date();

  const nextWeek = () => setCurrentWeekStart((date) => addWeeks(date, 1));
  const prevWeek = () => setCurrentWeekStart((date) => subWeeks(date, 1));

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
  };

  const selectedDaySlots =
    slots?.filter((slot) => {
      const slotTime = new Date(slot.startTime);
      const isDayMatch = isSameDay(slotTime, selectedDate);
      const isFuture = slotTime > now;
      return isDayMatch && isFuture;
    }) || [];

  selectedDaySlots.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const hasFreeSlots = selectedDaySlots.some((s) => !s.isBooked);

  const handleWaitlistSubmit = () => {
    addToWaitlistMutation.mutate(
      { date: selectedDate, notes: waitlistNote },
      {
        onSuccess: () => {
          setIsWaitlistOpen(false);
          setWaitlistNote("");
        },
      }
    );
  };

  const handleOpenBooking = (slot: Slot) => {
    setBookingSlot(slot);
    setBookingTopic("");
    setBookingDuration("60");
    setLocationType("onsite");
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!bookingSlot) return;
    bookSlotMutation.mutate(
      {
        id: bookingSlot.id,
        durationMinutes: parseInt(bookingDuration),
        locationType,
      },
      {
        onSuccess: () => setIsBookingOpen(false),
      }
    );
  };

  const handleConfirmCancel = () => {
    if (!slotToCancel) return;
    cancelSlotMutation.mutate(slotToCancel.id, {
      onSuccess: () => setSlotToCancel(null),
    });
  };

  const checkAvailability = (startSlot: Slot, durationMinutes: number) => {
    const buffer = locationType === "commute" ? 30 : 0;
    const totalMinutes = durationMinutes + buffer;

    if (totalMinutes === 60) return true;

    const startTime = new Date(startSlot.startTime);
    const endTime = addMinutes(startTime, totalMinutes);

    const collisions = slots?.filter((s) => {
      if (s.id === startSlot.id) return false;
      const sStart = new Date(s.startTime);
      const sEnd = new Date(s.endTime);
      const overlaps = sStart < endTime && sEnd > startTime;
      return overlaps && s.isBooked;
    });

    return !collisions || collisions.length === 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <Link href="/dashboard">
          <Button
            variant="ghost"
            className="pl-0 text-muted-foreground hover:text-primary gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("booking.back_to_dashboard")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-primary">
            {t("booking.title")}
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            {t("booking.subtitle")}
          </p>
        </div>

        <div className="flex items-center justify-between w-full lg:w-auto bg-card rounded-xl border shadow-sm p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevWeek}
            className="h-10 w-10 shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 lg:w-[260px] justify-center font-semibold text-sm sm:text-lg h-10 px-1 sm:px-4 mx-1 whitespace-nowrap overflow-hidden text-ellipsis",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarDays className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 hidden xs:inline" />
                <span className="truncate">
                  {format(weekStart, "d MMM", { locale: dateLocale })} -{" "}
                  {format(weekEnd, "d MMM yyyy", { locale: dateLocale })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextWeek}
            className="h-10 w-10 shrink-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 shadow-md border-none ring-1 ring-border/50">
          <CardHeader>
            <CardTitle>{t("booking.select_day")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex lg:grid lg:grid-cols-7 gap-2 overflow-x-auto pb-4 touch-pan-x snap-x scrollbar-hide">
              {days.map((day) => {
                const isHoliday = isPublicHoliday(day);
                const isSun = isSunday(day);
                const isFreeDay = isHoliday || isSun;

                const daySlots =
                  slots?.filter((s) => {
                    const slotTime = new Date(s.startTime);
                    return isSameDay(slotTime, day) && slotTime > now;
                  }) || [];

                const freeCount = daySlots.filter((s) => !s.isBooked).length;
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative flex flex-col items-center p-4 rounded-xl transition-all duration-200 border
                      min-w-[85px] lg:min-w-0 flex-shrink-0 snap-center
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg scale-[1.02] border-primary z-10"
                          : `hover:bg-accent hover:text-accent-foreground border-transparent hover:border-border ${
                              isFreeDay
                                ? "bg-red-50 dark:bg-red-900/10"
                                : "bg-card/50"
                            }`
                      }
                      ${
                        isToday && !isSelected
                          ? "ring-2 ring-primary/20 bg-primary/5"
                          : ""
                      }
                    `}
                  >
                    {isToday && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider opacity-70 mb-1 ${
                        isFreeDay && !isSelected ? "text-red-500" : ""
                      }`}
                    >
                      {format(day, "EEE", { locale: dateLocale })}
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        isFreeDay && !isSelected ? "text-red-600" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="mt-3 flex flex-col items-center gap-1 w-full">
                      <div className="h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            freeCount > 0 ? "bg-green-500" : "bg-transparent"
                          }`}
                          style={{ width: freeCount > 0 ? "100%" : "0%" }}
                        />
                      </div>
                      <span className="text-[10px] opacity-60">
                        {isHoliday
                          ? t("booking.holiday")
                          : freeCount > 0
                          ? t("booking.free_slots_count", { count: freeCount })
                          : t("booking.none")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 h-fit sticky top-24 shadow-lg border-l-4 border-l-primary">
          <CardHeader className="bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarCheck className="h-5 w-5 text-primary" />
              {format(selectedDate, "EEEE, d MMMM", { locale: dateLocale })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {selectedDaySlots.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{t("booking.no_slots_title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPublicHoliday(selectedDate)
                      ? t("booking.no_slots_holiday")
                      : t("booking.no_slots_day")}
                  </p>
                </div>

                <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-primary/20 hover:bg-primary/5 h-auto whitespace-normal py-3"
                    >
                      <BellRing className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="text-left">
                        {t("booking.notify_btn")}
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("booking.waitlist_title")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="notes">{t("booking.note_label")}</Label>
                        <Input
                          id="notes"
                          placeholder={t("booking.note_placeholder")}
                          value={waitlistNote}
                          onChange={(e) => setWaitlistNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleWaitlistSubmit}
                        disabled={addToWaitlistMutation.isPending}
                      >
                        {t("booking.save_me")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedDaySlots.map((slot) => {
                  const isMyBooking =
                    slot.isBooked && slot.studentId === user?.id;
                  const isBookedByOther =
                    slot.isBooked && slot.studentId !== user?.id;

                  if (isBookedByOther) {
                    return (
                      <div
                        key={slot.id}
                        className="p-4 rounded-xl border bg-muted/30 text-muted-foreground flex justify-between items-center opacity-60 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <Clock className="h-4 w-4 opacity-50" />
                          </div>
                          <span className="text-lg font-medium decoration-slice">
                            {format(new Date(slot.startTime), "HH:mm")}
                          </span>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-muted rounded flex items-center gap-1">
                          <Lock className="h-3 w-3" /> {t("booking.occupied")}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={slot.id}
                      className={`
                        p-4 rounded-xl border transition-all duration-200 flex items-center justify-between
                        ${
                          isMyBooking
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "bg-card hover:border-green-500/50 hover:shadow-md hover:bg-green-50/10"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            isMyBooking
                              ? "bg-primary/20 text-primary"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            isMyBooking ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {format(new Date(slot.startTime), "HH:mm")}
                        </span>
                      </div>

                      {isMyBooking ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-600 hover:text-red-700"
                          onClick={() => setSlotToCancel(slot)}
                        >
                          {t("booking.cancel_btn")}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="font-semibold bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleOpenBooking(slot)}
                        >
                          {t("booking.book_btn")}
                        </Button>
                      )}
                    </div>
                  );
                })}

                {!hasFreeSlots && (
                  <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("booking.all_taken")}
                    </p>
                    <Dialog
                      open={isWaitlistOpen}
                      onOpenChange={setIsWaitlistOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-auto whitespace-normal py-3"
                        >
                          <BellRing className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="text-left">
                            {t("booking.notify_btn")}
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {t("booking.waitlist_title")}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input
                            placeholder={t("booking.note_placeholder")}
                            value={waitlistNote}
                            onChange={(e) => setWaitlistNote(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleWaitlistSubmit}
                            disabled={addToWaitlistMutation.isPending}
                          >
                            {t("booking.save_me")}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Dialog Potwierdzenia Rezerwacji --- */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          {/* DODANO KLASY SCROLLOWANIA: max-h-[90vh] overflow-y-auto */}
          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle>{t("booking.confirm_title")}</DialogTitle>
              <DialogDescription>{t("booking.confirm_desc")}</DialogDescription>
            </DialogHeader>

            {bookingSlot && (
              <div className="grid gap-6 py-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                  <CalendarCheck className="h-8 w-8 text-primary opacity-80" />
                  <div>
                    <p className="font-semibold">
                      {format(new Date(bookingSlot.startTime), "EEEE, d MMM", {
                        locale: dateLocale,
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(bookingSlot.startTime), "HH:mm")} -{" "}
                      {format(
                        addMinutes(
                          new Date(bookingSlot.startTime),
                          parseInt(bookingDuration) +
                            (locationType === "commute" ? 30 : 0)
                        ),
                        "HH:mm"
                      )}
                    </p>
                  </div>
                </div>

                {/* --- WYBÓR LOKALIZACJI --- */}
                <div className="space-y-3">
                  <Label>{t("booking.location_label")}</Label>
                  <RadioGroup
                    value={locationType}
                    onValueChange={setLocationType}
                    className="grid gap-2"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value="onsite" id="loc_onsite" />
                      <Label
                        htmlFor="loc_onsite"
                        className="flex-1 cursor-pointer font-normal flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-primary" />
                        {t("booking.location_onsite")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value="commute" id="loc_commute" />
                      <Label
                        htmlFor="loc_commute"
                        className="flex-1 cursor-pointer font-normal flex items-center gap-2"
                      >
                        <Car className="w-4 h-4 text-orange-500" />
                        {t("booking.location_commute")}
                      </Label>
                    </div>
                  </RadioGroup>
                  {locationType === "commute" && (
                    <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                      {t("booking.commute_info")}
                    </p>
                  )}
                </div>

                {/* --- WYBÓR CZASU --- */}
                <div className="space-y-3">
                  <Label>{t("booking.duration_label")}</Label>
                  <RadioGroup
                    value={bookingDuration}
                    onValueChange={setBookingDuration}
                    className="grid gap-2"
                  >
                    {/* Opcja 60 min */}
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <RadioGroupItem value="60" id="r60" />
                      <Label
                        htmlFor="r60"
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {t("booking.duration_60")}
                      </Label>
                    </div>

                    {/* Opcja 90 min */}
                    <div
                      className={cn(
                        "flex items-center space-x-2 border rounded-lg p-3 transition-colors",
                        checkAvailability(bookingSlot, 90)
                          ? "cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          : "opacity-50 cursor-not-allowed bg-muted/50"
                      )}
                    >
                      <RadioGroupItem
                        value="90"
                        id="r90"
                        disabled={!checkAvailability(bookingSlot, 90)}
                      />
                      <Label
                        htmlFor="r90"
                        className="flex-1 cursor-pointer font-normal flex justify-between"
                      >
                        <span>{t("booking.duration_90")}</span>
                        {!checkAvailability(bookingSlot, 90) && (
                          <span className="text-xs text-destructive font-medium">
                            {t("booking.duration_unavailable")}
                          </span>
                        )}
                      </Label>
                    </div>

                    {/* Opcja 120 min */}
                    <div
                      className={cn(
                        "flex items-center space-x-2 border rounded-lg p-3 transition-colors",
                        checkAvailability(bookingSlot, 120)
                          ? "cursor-pointer hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                          : "opacity-50 cursor-not-allowed bg-muted/50"
                      )}
                    >
                      <RadioGroupItem
                        value="120"
                        id="r120"
                        disabled={!checkAvailability(bookingSlot, 120)}
                      />
                      <Label
                        htmlFor="r120"
                        className="flex-1 cursor-pointer font-normal flex justify-between"
                      >
                        <span>{t("booking.duration_120")}</span>
                        {!checkAvailability(bookingSlot, 120) && (
                          <span className="text-xs text-destructive font-medium">
                            {t("booking.duration_unavailable")}
                          </span>
                        )}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">{t("booking.topic_label")}</Label>
                  <Input
                    id="topic"
                    value={bookingTopic}
                    onChange={(e) => setBookingTopic(e.target.value)}
                    placeholder={t("booking.topic_placeholder")}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsBookingOpen(false)}>
                {t("booking.cancel_btn")}
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={bookSlotMutation.isPending}
                className="gap-2"
              >
                {bookSlotMutation.isPending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {t("booking.confirm_btn")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- Dialog Potwierdzenia Anulowania --- */}
        <Dialog
          open={!!slotToCancel}
          onOpenChange={(open) => !open && setSlotToCancel(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("booking.cancel_title")}</DialogTitle>
              <DialogDescription>{t("booking.cancel_desc")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSlotToCancel(null)}>
                {t("booking.cancel_btn")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={cancelSlotMutation.isPending}
              >
                {cancelSlotMutation.isPending
                  ? "..."
                  : t("booking.cancel_confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
