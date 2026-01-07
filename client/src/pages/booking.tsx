import { useState } from "react";
import { useSlots, useBookSlot, useAddToWaitlist } from "@/hooks/use-slots";
import { useUser } from "@/hooks/use-auth";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isSunday,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarCheck,
  BellRing,
  CalendarDays,
  Lock,
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
import { cn } from "@/lib/utils";

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
  const addToWaitlistMutation = useAddToWaitlist();

  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waitlistNote, setWaitlistNote] = useState("");

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-6 border-b">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-primary">
            Zarezerwuj Lekcję
          </h2>
          <p className="text-muted-foreground mt-2 text-lg">
            Wybierz termin, który najbardziej Ci odpowiada.
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
                  {format(weekStart, "d MMM", { locale: pl })} -{" "}
                  {format(weekEnd, "d MMM yyyy", { locale: pl })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={pl}
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
            <CardTitle>Wybierz dzień</CardTitle>
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
                      {format(day, "EEE", { locale: pl })}
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
                          ? "Święto"
                          : freeCount > 0
                          ? `${freeCount} wolne`
                          : "Brak"}
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
              {format(selectedDate, "EEEE, d MMMM", { locale: pl })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {selectedDaySlots.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Brak terminów</p>
                  <p className="text-sm text-muted-foreground">
                    {isPublicHoliday(selectedDate)
                      ? "To dzień świąteczny."
                      : "W tym dniu nie ma już dostępnych lekcji."}
                  </p>
                </div>

                <Dialog open={isWaitlistOpen} onOpenChange={setIsWaitlistOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-primary/20 hover:bg-primary/5 h-auto whitespace-normal py-3"
                    >
                      <BellRing className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="text-left">Powiadom o dostępności</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Zapisz się na listę rezerwową</DialogTitle>
                      <DialogDescription>
                        Dla dnia:{" "}
                        <span className="font-medium text-primary">
                          {format(selectedDate, "d MMMM yyyy", { locale: pl })}
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notatka (opcjonalnie)</Label>
                        <Input
                          id="notes"
                          placeholder="np. pasuje mi tylko po 16:00"
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
                        Zapisz mnie
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
                          <Lock className="h-3 w-3" /> Zajęty
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
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                          Twoja rezerwacja
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="font-semibold bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => bookSlotMutation.mutate(slot.id)}
                          disabled={bookSlotMutation.isPending}
                        >
                          Rezerwuj
                        </Button>
                      )}
                    </div>
                  );
                })}

                {!hasFreeSlots && (
                  <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Wszystkie terminy zajęte.
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
                            Powiadom mnie o dostępności
                          </span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Zapisz się na listę rezerwową
                          </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Input
                            placeholder="Preferencje..."
                            value={waitlistNote}
                            onChange={(e) => setWaitlistNote(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleWaitlistSubmit}
                            disabled={addToWaitlistMutation.isPending}
                          >
                            Zapisz mnie
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
      </div>
    </div>
  );
}
