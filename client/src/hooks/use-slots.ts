import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type Slot,
  type InsertSlot,
  generateSlotsSchema,
} from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

export function useSlots(filters?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: ["/api/slots", filters],
    queryFn: async () => {
      let url = "/api/slots";
      if (filters) {
        const params = new URLSearchParams();
        if (filters.start) params.append("start", filters.start);
        if (filters.end) params.append("end", filters.end);
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch slots");
      return (await res.json()) as Slot[];
    },
    refetchOnWindowFocus: true, // Smart polling
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSlot) => {
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create slot");
      return (await res.json()) as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({ title: "Success", description: "Slot created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof generateSlotsSchema>) => {
      const res = await fetch("/api/slots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to generate slots");
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({ title: "Success", description: `Generated ${data.count} slots` });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// --- NOWY HOOK: Generator z szablonu (dla Admin Panelu) ---
export function useGenerateSlotsFromTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { startDate: string; endDate: string }) => {
      const res = await fetch("/api/slots/generate-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate slots");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: "Success",
        description: data.message || "Schedule generated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<InsertSlot>;
    }) => {
      const res = await fetch(`/api/slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update slot");
      return (await res.json()) as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({ title: "Success", description: "Slot updated" });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/slots/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete slot");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({ title: "Success", description: "Slot deleted" });
    },
  });
}

export function useBookSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/slots/${id}/book`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({ title: "Booking Confirmed", description: "See you in class!" });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/slots/${id}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Failed to cancel" }));
        throw new Error(errorData.message || "Failed to cancel");
      }
      return (await res.json()) as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({ title: "Cancelled", description: "Reservation cancelled." });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// --- NOWY HOOK: Lista Rezerwowa ---
export function useAddToWaitlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { date: Date; notes?: string }) => {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date.toISOString(),
          notes: data.notes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add to waitlist");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Zapisano!",
        description: "Powiadomimy Cię, gdy zwolni się termin w tym dniu.",
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
