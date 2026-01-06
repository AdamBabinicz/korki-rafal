import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // DODATEK BEZPIECZEŃSTWA: Jeśli serwer mówi "Brak dostępu" (401),
    // natychmiast wyczyść "pamiętanego" użytkownika, żeby przerwać pętlę.
    if (res.status === 401) {
      queryClient.setQueryData(["/api/user"], null);
    }

    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    // Ważne dla Passport.js - przesyłanie ciasteczek sesyjnych
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Domyślna obsługa zapytań
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Również tutaj czyścimy usera, jeśli dostaniemy 401
      queryClient.setQueryData(["/api/user"], null);
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // ZMIANA KRYTYCZNA: Zmieniono Infinity na 0.
      // To wymusza sprawdzanie sesji na serwerze przy każdym wejściu na stronę.
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
