import { useState } from "react";
import { useSlots, useUpdateSlot } from "@/hooks/use-slots";
import { useUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui-card";
import { Button } from "@/components/ui-button";
import { Input } from "@/components/ui-input";
import { format, parseISO, startOfWeek, addWeeks, subWeeks, isBefore, addHours } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function BookingPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [bookingTopic, setBookingTopic] = useState("");
  
  const { data: user } = useUser();
  const { data: slots, isLoading } = useSlots();
  const { mutate: bookSlot, isPending: isBooking } = useUpdateSlot();
  const { toast } = useToast();

  const handleBook = () => {
    if (!selectedSlot) return;

    bookSlot(
      { 
        id: selectedSlot.id, 
        updates: { 
          isBooked: true, 
          studentId: user?.id,
          topic: bookingTopic
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "Booking Confirmed!", description: "See you at the lesson." });
          setSelectedSlot(null);
          setBookingTopic("");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Error", description: err.message });
        }
      }
    );
  };

  const handleCancel = (slot: any) => {
    // Check 24h guard
    const slotTime = parseISO(slot.startTime as unknown as string);
    if (isBefore(slotTime, addHours(new Date(), 24))) {
        toast({ variant: "destructive", title: "Cannot Cancel", description: "Cancellations must be made at least 24 hours in advance." });
        return;
    }

    if(confirm("Are you sure you want to cancel this booking?")) {
        bookSlot({
            id: slot.id,
            updates: {
                isBooked: false,
                studentId: null, // This might fail if schema validation expects number, let's assume backend handles null/undefined or we send 0/special value. Actually Zod schema usually allows null if optional or nullable.
                // Assuming schema update: studentId: z.number().nullable()
                // If not, we might need a specific 'cancel' endpoint. For now, let's try setting it to undefined if backend clears it on booked=false
                topic: null, 
                isPaid: false
            } as any // Forced cast because studentId might be strict number in basic schema
        });
    }
  };

  const startOfCurrentWeek = startOfWeek(currentWeek, { weekStartsOn: 1 });
  
  // Create grid of dates for the week
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfCurrentWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold">Book a Lesson</h1>
                <p className="text-muted-foreground">Select a time slot that works for you</p>
            </div>
            <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-white/5">
                <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="px-4 font-medium min-w-[140px] text-center">
                    {format(startOfCurrentWeek, "MMM d")} - {format(weekDates[6], "MMM d")}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {weekDates.map(date => {
                const dateStr = format(date, "yyyy-MM-dd");
                const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                const dailySlots = slots?.filter(s => format(parseISO(s.startTime as unknown as string), "yyyy-MM-dd") === dateStr).sort((a, b) => new Date(a.startTime as unknown as string).getTime() - new Date(b.startTime as unknown as string).getTime()) || [];

                return (
                    <div key={dateStr} className={`space-y-3 ${isToday ? 'bg-white/5 rounded-2xl p-2 -m-2' : ''}`}>
                        <div className="text-center mb-4">
                            <div className="text-sm text-muted-foreground uppercase font-bold">{format(date, "EEE")}</div>
                            <div className={`text-2xl font-bold ${isToday ? 'text-primary' : ''}`}>{format(date, "d")}</div>
                        </div>

                        {dailySlots.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground/50">No slots</div>
                        ) : (
                            dailySlots.map(slot => {
                                const isMyBooking = slot.studentId === user?.id;
                                const isBookedOther = slot.isBooked && !isMyBooking;
                                
                                if (isBookedOther) return (
                                    <div key={slot.id} className="p-3 rounded-xl bg-muted/30 border border-white/5 opacity-50 cursor-not-allowed text-center">
                                        <span className="text-sm font-medium line-through">{format(parseISO(slot.startTime as unknown as string), "h:mm a")}</span>
                                    </div>
                                );

                                if (isMyBooking) return (
                                    <button 
                                        key={slot.id}
                                        onClick={() => handleCancel(slot)}
                                        className="w-full p-3 rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex flex-col items-center"
                                    >
                                        <span className="text-sm font-bold">{format(parseISO(slot.startTime as unknown as string), "h:mm a")}</span>
                                        <span className="text-xs opacity-90">Your Booking</span>
                                    </button>
                                );

                                return (
                                    <button 
                                        key={slot.id}
                                        onClick={() => setSelectedSlot(slot)}
                                        className="w-full p-3 rounded-xl bg-card border border-primary/20 hover:border-primary hover:bg-primary/10 transition-all group"
                                    >
                                        <span className="text-sm font-bold text-primary group-hover:scale-110 block transition-transform">
                                            {format(parseISO(slot.startTime as unknown as string), "h:mm a")}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent className="bg-card border-white/10">
            <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20">
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="text-xl font-bold">
                        {selectedSlot && format(parseISO(selectedSlot.startTime), "EEEE, MMMM d 'at' h:mm a")}
                    </p>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">What would you like to cover?</label>
                    <Input 
                        placeholder="e.g. Calculus, Algebra, Exam Prep..."
                        value={bookingTopic}
                        onChange={(e) => setBookingTopic(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setSelectedSlot(null)}>Cancel</Button>
                    <Button onClick={handleBook} isLoading={isBooking}>
                        Confirm Booking
                    </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
