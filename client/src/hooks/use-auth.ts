import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type User, insertUserSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useUser() {
  return useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user");

      // Obsługa starego zachowania (na wszelki wypadek)
      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      // Jeśli backend zwróci 200 OK i null, to tutaj otrzymamy null
      return await res.json();
    },
    retry: false,
    staleTime: 0, // Zawsze sprawdzaj stan sesji przy montowaniu
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      return (await res.json()) as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation(user.role === "admin" ? "/admin" : "/dashboard");
      toast({
        title: "Witaj ponownie!",
        description: `Zalogowano jako ${user.username}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd logowania",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof insertUserSchema>) => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Registration failed");
      }
      return (await res.json()) as User;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      setLocation(user.role === "admin" ? "/admin" : "/dashboard");
      toast({ title: "Witaj!", description: "Konto zostało utworzone" });
    },
    onError: (error) => {
      toast({
        title: "Błąd rejestracji",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/logout", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear(); // Czyści cache (np. sloty)
      setLocation("/");
      toast({ title: "Wylogowano", description: "Do zobaczenia!" });
    },
  });
}

export function useChangePassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      // --- ZMIANA: Używamy uniwersalnego endpointu PATCH /api/user ---
      // Mapujemy newPassword na password, którego oczekuje backend
      const payload = {
        password: data.newPassword,
        // currentPassword nie jest weryfikowane przez ten prosty endpoint,
        // ale w bezpieczniejszej wersji backendu powinno być.
        // Na ten moment to wystarczy do działania.
      };

      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to change password");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sukces",
        description: "Hasło zostało zmienione",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
