import { useState } from "react";
import { useSlots, useGenerateSlots, useDeleteSlot, useUpdateSlot } from "@/hooks/use-slots";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-card";
import { Button } from "@/components/ui-button";
import { Input } from "@/components/ui-input";
import { format, parseISO, startOfWeek, endOfWeek, addDays, eachDayOfInterval } from "date-fns";
import { Loader2, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminPanel() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: slots, isLoading } = useSlots();
  const { mutate: generateSlots, isPending: isGenerating } = useGenerateSlots();
  const { mutate: deleteSlot } = useDeleteSlot();
  const { mutate: updateSlot } = useUpdateSlot();
  const { toast } = useToast();

  const [generateForm, setGenerateForm] = useState({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    startTime: "16:00",
    endTime: "20:00",
    duration: 60
  });

  const handleGenerate = () => {
    generateSlots(
      { ...generateForm, duration: Number(generateForm.duration) },
      {
        onSuccess: (data) => {
          toast({ title: "Success", description: `Generated ${data.count} slots.` });
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Error", description: err.message });
        }
      }
    );
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin w-10 h-10 text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage schedule and students</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 w-4 h-4" /> Generate Slots
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Generate Availability</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input 
                      type="date" 
                      value={generateForm.startDate}
                      onChange={e => setGenerateForm({...generateForm, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input 
                      type="date" 
                      value={generateForm.endDate}
                      onChange={e => setGenerateForm({...generateForm, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <Input 
                      type="time" 
                      value={generateForm.startTime}
                      onChange={e => setGenerateForm({...generateForm, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Time</label>
                    <Input 
                      type="time" 
                      value={generateForm.endTime}
                      onChange={e => setGenerateForm({...generateForm, endTime: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input 
                    type="number" 
                    value={generateForm.duration}
                    onChange={e => setGenerateForm({...generateForm, duration: Number(e.target.value)})}
                  />
                </div>
                <Button onClick={handleGenerate} isLoading={isGenerating}>Generate Slots</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 overflow-x-auto pb-4">
          {weekDays.map(day => {
            const daySlots = slots?.filter(s => 
              format(parseISO(s.startTime as unknown as string), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
            ).sort((a, b) => new Date(a.startTime as unknown as string).getTime() - new Date(b.startTime as unknown as string).getTime()) || [];

            return (
              <div key={day.toString()} className="min-w-[200px]">
                <div className="text-center p-3 mb-2 bg-card rounded-xl border border-white/5">
                  <div className="text-sm font-medium text-muted-foreground">{format(day, "EEEE")}</div>
                  <div className="text-xl font-bold">{format(day, "d MMM")}</div>
                </div>
                
                <div className="space-y-2">
                  {daySlots.map(slot => (
                    <Card key={slot.id} className={`p-3 relative group ${slot.isBooked ? 'border-orange-500/30 bg-orange-500/5' : 'border-primary/30 bg-primary/5'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold">
                          {format(parseISO(slot.startTime as unknown as string), "HH:mm")}
                        </span>
                        <div className="flex gap-1">
                          {slot.isBooked && (
                            <button 
                              onClick={() => updateSlot({ id: slot.id, updates: { isPaid: !slot.isPaid } })}
                              title={slot.isPaid ? "Mark Unpaid" : "Mark Paid"}
                              className={`${slot.isPaid ? 'text-green-500' : 'text-gray-500'} hover:scale-110 transition-transform`}
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                                if(confirm("Delete this slot?")) deleteSlot(slot.id);
                            }}
                            className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {slot.isBooked ? (
                        <div className="text-xs">
                          <div className="font-medium text-orange-400 truncate">Booked</div>
                          {slot.topic && <div className="text-muted-foreground truncate">{slot.topic}</div>}
                        </div>
                      ) : (
                        <div className="text-xs text-primary font-medium">Available</div>
                      )}
                    </Card>
                  ))}
                  {daySlots.length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-white/5 rounded-xl">
                      No slots
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
