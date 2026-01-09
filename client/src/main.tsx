import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "@/hooks/use-theme";

// --- SECURITY FIX: Global Link Protection ---
// Fixes "Unsafe Cross-Origin Links" warning for links injected by 3rd party scripts.
// If any link opens in a new tab (_blank), we ensure it has noopener noreferrer.
if (typeof window !== "undefined") {
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;
      // Znajdź najbliższy element <a> (bo kliknięcie może być w <span> wewnątrz <a>)
      const anchor = target.closest("a");

      if (anchor && anchor.target === "_blank") {
        // Jeśli link nie ma rel, lub ma niepełny, nadpisz go bezpieczną wersją
        if (
          !anchor.rel ||
          !anchor.rel.includes("noopener") ||
          !anchor.rel.includes("noreferrer")
        ) {
          anchor.rel = "noopener noreferrer";
        }
      }
    },
    true
  ); // Use capture phase to catch event early
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="math-mentor-theme">
    <App />
  </ThemeProvider>
);
