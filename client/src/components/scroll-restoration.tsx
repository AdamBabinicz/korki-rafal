import { useEffect } from "react";
import { useLocation } from "wouter";

export function ScrollRestoration() {
  const [pathname] = useLocation();

  useEffect(() => {
    // Wymuś przewinięcie do góry przy każdej zmianie ścieżki (URL)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant", // Używamy 'instant', aby nie było widać "jazdy" w górę po zmianie strony
    });
  }, [pathname]);

  return null; // Ten komponent nie renderuje żadnego widoku
}
