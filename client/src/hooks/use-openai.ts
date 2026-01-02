import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useGenerateImage() {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch(api.openai.generateImage.path, {
        method: api.openai.generateImage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate image");
      return api.openai.generateImage.responses[200].parse(await res.json());
    },
  });
}
