import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type Slot,
  type InsertSlot,
  generateSlotsSchema,
} from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
      toast({
        title: t("toasts.success"),
        description: t("toasts.slot_created"),
      });
    },
    onError: (error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      toast({
        title: t("toasts.success"),
        description: t("toasts.generated", { count: data.count }),
      });
    },
    onError: (error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateSlotsFromTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

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
        title: t("toasts.success"),
        description:
          data.message || t("toasts.generated", { count: data.count }),
      });
    },
    onError: (error) => {
      toast({
        title: t("toasts.generation_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      toast({
        title: t("toasts.success"),
        description: t("toasts.slot_updated"),
      });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/slots/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete slot");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: t("toasts.success"),
        description: t("toasts.slot_deleted"),
      });
    },
  });
}

export function useBookSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (
      data:
        | number
        | {
            id: number;
            durationMinutes?: number;
            locationType?: string;
            topic?: string;
          }
    ) => {
      const id = typeof data === "number" ? data : data.id;
      const durationMinutes =
        typeof data === "number" ? 60 : data.durationMinutes || 60;
      const locationType =
        typeof data === "number" ? "onsite" : data.locationType || "onsite";
      const topic = typeof data === "number" ? undefined : data.topic;

      const res = await fetch(`/api/slots/${id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes, locationType, topic }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Booking failed");
      }
      return (await res.json()) as Slot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/slots"] });
      toast({
        title: t("toasts.book_success"),
        description: t("toasts.book_desc"),
      });
    },
    onError: (error) => {
      toast({
        title: t("toasts.book_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelSlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

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
      toast({
        title: t("toasts.cancel_success"),
        description: t("toasts.cancel_desc"),
      });
    },
    onError: (error) => {
      toast({
        title: t("toasts.cancel_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Zmiana: notes -> note
export function useAddToWaitlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: { date: Date; note?: string }) => {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date.toISOString(),
          note: data.note, // Zmiana z notes na note
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
        title: t("toasts.waitlist_success"),
        description: t("toasts.waitlist_desc"),
      });
    },
    onError: (error) => {
      toast({
        title: t("toasts.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
