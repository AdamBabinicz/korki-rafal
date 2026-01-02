import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

export function useSlots(filters?: { start?: string; end?: string }) {
  return useQuery({
    queryKey: [api.slots.list.path, filters],
    queryFn: async () => {
      let url = api.slots.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.start) params.append("start", filters.start);
        if (filters.end) params.append("end", filters.end);
        url += `?${params.toString()}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch slots");
      return api.slots.list.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: true, // Smart polling as requested
  });
}

export function useCreateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.slots.create.input>) => {
      const validated = api.slots.create.input.parse(data);
      const res = await fetch(api.slots.create.path, {
        method: api.slots.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create slot");
      return api.slots.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.slots.list.path] });
    },
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.slots.generate.input>) => {
      const validated = api.slots.generate.input.parse(data);
      const res = await fetch(api.slots.generate.path, {
        method: api.slots.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate slots");
      return api.slots.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.slots.list.path] });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: z.infer<typeof api.slots.update.input> }) => {
      const validated = api.slots.update.input.parse(updates);
      const url = buildUrl(api.slots.update.path, { id });
      const res = await fetch(url, {
        method: api.slots.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update slot");
      return api.slots.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.slots.list.path] });
    },
  });
}

export function useDeleteSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.slots.delete.path, { id });
      const res = await fetch(url, {
        method: api.slots.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete slot");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.slots.list.path] });
    },
  });
}
