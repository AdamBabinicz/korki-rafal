import { useUser } from "@/hooks/use-auth";
import { useSlots } from "@/hooks/use-slots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-card";
import { Button } from "@/components/ui-button";
import { format, isAfter, parseISO } from "date-fns";
import { Calendar, Clock, ArrowRight, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import { useGenerateImage } from "@/hooks/use-openai";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: user } = useUser();
  const { data: slots } = useSlots();
  const { mutate: generateImage, data: imageData } = useGenerateImage();
  const [heroImage, setHeroImage] = useState<string | null>(null);

  // Filter for upcoming bookings for this user
  const upcomingBookings = slots?.filter(
    (slot) => 
      slot.studentId === user?.id && 
      isAfter(parseISO(slot.startTime as unknown as string), new Date())
  ).sort((a, b) => new Date(a.startTime as unknown as string).getTime() - new Date(b.startTime as unknown as string).getTime()) || [];

  const nextLesson = upcomingBookings[0];

  useEffect(() => {
    // Generate an inspiring image on load if we don't have one
    // In production, you might cache this or use a static image to save tokens
    // For this demo, we'll just check if we have data or use a fallback
    if (!imageData && !heroImage) {
        // Commenting out dynamic generation to save quota/time for this demo
        // generateImage("Digital illustration of abstract mathematics, glowing geometry symbols, isometric style");
        
        // Using a high-quality Unsplash image as fallback
        // math/education abstract background
        setHeroImage("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=2000");
    } else if (imageData) {
        setHeroImage(imageData.url);
    }
  }, [imageData, generateImage]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-card border border-white/5 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent z-10" />
            <img 
                src={heroImage || ""} 
                alt="Math Abstract" 
                className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="relative z-20 p-8 md:p-12 lg:p-16">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">{user?.name}</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mb-8">
                    Ready to tackle some problems? You have {upcomingBookings.length} upcoming lessons scheduled.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link href="/booking">
                        <Button size="lg" className="shadow-primary/25">
                            Book New Lesson
                        </Button>
                    </Link>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
                        <Calendar className="w-5 h-5 text-primary" />
                        Next Lesson
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {nextLesson ? (
                        <div className="space-y-1">
                            <p className="text-2xl font-bold font-display">
                                {format(parseISO(nextLesson.startTime as unknown as string), "EEEE, MMM d")}
                            </p>
                            <p className="text-lg text-primary">
                                {format(parseISO(nextLesson.startTime as unknown as string), "h:mm a")}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xl font-medium">No upcoming lessons</p>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
                        <Clock className="w-5 h-5 text-orange-500" />
                        Remaining Credits
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold font-display">∞ <span className="text-sm font-normal text-muted-foreground">Unlimited</span></p>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-medium text-muted-foreground">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                        Profile Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-green-400">Active Student</p>
                        <p className="text-sm text-muted-foreground">Member since 2024</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Upcoming List */}
        <div>
            <h2 className="text-2xl font-bold mb-6">Your Schedule</h2>
            <div className="grid gap-4">
                {upcomingBookings.length > 0 ? (
                    upcomingBookings.map((slot) => (
                        <Card key={slot.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 hover:bg-card transition-colors border-l-4 border-l-primary">
                            <div className="flex items-center gap-6">
                                <div className="bg-primary/10 p-4 rounded-xl text-center min-w-[80px]">
                                    <p className="text-sm font-bold text-primary uppercase">
                                        {format(parseISO(slot.startTime as unknown as string), "MMM")}
                                    </p>
                                    <p className="text-2xl font-bold font-display">
                                        {format(parseISO(slot.startTime as unknown as string), "d")}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">
                                        {slot.topic || "General Mathematics"}
                                    </h3>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {format(parseISO(slot.startTime as unknown as string), "h:mm a")} - {format(parseISO(slot.endTime as unknown as string), "h:mm a")}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="md:w-auto w-full">
                                View Details
                            </Button>
                        </Card>
                    ))
                ) : (
                    <Card className="p-8 text-center border-dashed">
                        <p className="text-muted-foreground mb-4">You haven't booked any lessons yet.</p>
                        <Link href="/booking">
                            <Button>Book Your First Lesson <ArrowRight className="ml-2 w-4 h-4" /></Button>
                        </Link>
                    </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
