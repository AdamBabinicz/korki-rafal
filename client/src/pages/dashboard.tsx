import { useUser, useChangePassword } from "@/hooks/use-auth";
import { useSlots, useCancelSlot } from "@/hooks/use-slots";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Loader2,
  Calendar,
  Clock,
  XCircle,
  Mail,
  Phone,
  Save,
} from "lucide-react";
import {
  format,
  formatDistanceToNow,
  isFuture,
  subDays,
  addYears,
} from "date-fns";
import { pl } from "date-fns/locale";
import { Link } from "wouter";
import { useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schemat dla zmiany hasła
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Obecne hasło jest wymagane"),
  newPassword: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
});

// Schemat dla edycji profilu
const profileSchema = z.object({
  email: z
    .string()
    .email("Nieprawidłowy adres e-mail")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
});

export default function DashboardPage() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- SLOTY ---
  const dateRange = useMemo(() => {
    const start = subDays(new Date(), 1).toISOString();
    const end = addYears(new Date(), 1).toISOString();
    return { start, end };
  }, []);

  const { data: slots, isLoading: slotsLoading } = useSlots(dateRange);
  const cancelSlotMutation = useCancelSlot();
  const changePasswordMutation = useChangePassword();

  // --- FORMULARZ PROFILU ---
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
      phone: user?.phone || "",
    },
    // To ważne: aktualizuje formularz, gdy dane użytkownika załadują się z API
    values: {
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Zaktualizowano profil",
        description: "Twoje dane kontaktowe zostały zapisane.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: error.message || "Nie udało się zapisać danych.",
      });
    },
  });

  function onProfileSubmit(data: z.infer<typeof profileSchema>) {
    updateProfileMutation.mutate(data);
  }

  // --- FORMULARZ HASŁA ---
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
    changePasswordMutation.mutate(data, {
      onSuccess: () => passwordForm.reset(),
    });
  }

  // --- LOGIKA WYŚWIETLANIA LEKCJI ---
  const myUpcomingSlots = useMemo(() => {
    if (!slots || !user) return [];

    const mySlots = slots.filter((slot) => {
      const isMySlot = Number(slot.studentId) === Number(user.id);
      const isFutureSlot = isFuture(new Date(slot.startTime));
      return isMySlot && isFutureSlot;
    });

    return mySlots.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [slots, user]);

  const nextLesson = myUpcomingSlots[0];

  if (slotsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* NAGŁÓWEK */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Cześć, {user?.name || user?.username}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Miło Cię widzieć z powrotem. Gotowy na matematykę?
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEWA KOLUMNA - LEKCJE */}
        <div className="space-y-6">
          {/* NASTĘPNA LEKCJA (LICZNIK) */}
          <Card className="bg-primary text-primary-foreground border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg opacity-90">
                Następna lekcja za
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextLesson ? (
                <div className="space-y-2">
                  <div className="text-4xl font-bold tracking-tighter">
                    {formatDistanceToNow(new Date(nextLesson.startTime), {
                      locale: pl,
                    })}
                  </div>
                  <div className="text-lg opacity-90 font-medium">
                    {format(
                      new Date(nextLesson.startTime),
                      "d MMMM yyyy, HH:mm",
                      { locale: pl }
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-lg opacity-90">
                  Brak zaplanowanych lekcji.
                </div>
              )}
            </CardContent>
          </Card>

          {/* LISTA NADCHODZĄCYCH LEKCJI */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nadchodzące lekcje</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/booking">Zarezerwuj</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {myUpcomingSlots.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Brak nadchodzących lekcji.
                  <br />
                  <Link
                    href="/booking"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Zarezerwuj pierwszą lekcję
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myUpcomingSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(slot.startTime), "d MMMM yyyy", {
                            locale: pl,
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(slot.startTime), "HH:mm")} -{" "}
                          {format(new Date(slot.endTime), "HH:mm")}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              slot.isPaid
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {slot.isPaid ? "Opłacone" : "Nieopłacone"}
                          </span>
                        </div>
                      </div>

                      {/* PRZYCISK ANULOWANIA */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          if (
                            confirm("Czy na pewno chcesz anulować tę lekcję?")
                          ) {
                            cancelSlotMutation.mutate(slot.id);
                          }
                        }}
                        disabled={cancelSlotMutation.isPending}
                      >
                        {cancelSlotMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Anuluj
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PRAWA KOLUMNA - USTAWIENIA */}
        <div className="space-y-6">
          {/* 1. DANE KONTAKTOWE (EMAIL/TELEFON) */}
          <Card className="border-blue-100 dark:border-blue-900 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Twoje Dane
              </CardTitle>
              <CardDescription>
                Podaj e-mail, aby otrzymywać powiadomienia o wolnych terminach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres E-mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-9"
                              placeholder="twoj@email.com"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (opcjonalnie)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              className="pl-9"
                              placeholder="123 456 789"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    variant="secondary"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Zapisz dane
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* 2. ZMIANA HASŁA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bezpieczeństwo</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-4"
                >
                  {/* UKRYTE POLE NAZWY UŻYTKOWNIKA */}
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={user?.username || ""}
                    readOnly
                    style={{ display: "none" }}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Obecne hasło</Label>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Nowe hasło</Label>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Zmień hasło
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
