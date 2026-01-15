import React, { Suspense, lazy, useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ScrollRestoration } from "@/components/scroll-restoration";
import { ProtectedRoute } from "@/components/protected-route";
import { Loader2, Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Importy stron
const HomePage = lazy(() => import("@/pages/home"));
const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const AdminPanel = lazy(() => import("@/pages/admin"));
const BookingPage = lazy(() => import("@/pages/booking"));
const PrivacyPage = lazy(() => import("@/pages/Privacy"));
const TermsPage = lazy(() => import("@/pages/Terms"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

// --- KOMPONENT: PRZYCISK INSTALACJI (FAB) ---
function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    // 1. Wykrywanie iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 2. Sprawdź czy już zainstalowana
    const isInStandaloneMode = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    if (isInStandaloneMode) return;

    // 3. Android/PC - nasłuchiwanie zdarzenia
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 4. iOS - pokazujemy przycisk zawsze (jeśli nie zainstalowane)
    if (ios && !isInStandaloneMode) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleClick = async () => {
    if (isIOS) {
      // Na iOS przełączamy widoczność dymka z instrukcją
      setShowIosHint(!showIosHint);
    } else if (deferredPrompt) {
      // Android/PC - wywołujemy instalację
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsVisible(false);
      }
    }
  };

  if (!isVisible) return null;

  return (
    // ZMIANA: right-8 (32px) - to standardowy margines dla przycisków ScrollToTop.
    // Dzięki temu będą idealnie w jednej osi pionowej.
    <div className="fixed bottom-24 right-8 z-50 flex flex-col items-end gap-2 animate-in fade-in zoom-in duration-300">
      {/* Dymek z instrukcją dla iOS */}
      {showIosHint && isIOS && (
        <div className="bg-popover text-popover-foreground p-4 rounded-lg shadow-xl border border-border max-w-[250px] text-sm relative mb-2 mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 bg-background rounded-full border shadow-sm"
            onClick={() => setShowIosHint(false)}
          >
            <X className="h-3 w-3" />
          </Button>
          <p className="font-semibold mb-2">Instalacja na iOS:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>
              Kliknij <Share className="inline h-3 w-3" /> <b>Udostępnij</b> na
              dole przeglądarki.
            </li>
            <li>
              Wybierz <b>"Do ekranu początkowego"</b>.
            </li>
          </ol>
        </div>
      )}

      {/* Główny przycisk */}
      {/* h-12 w-12 (48px) - identyczny rozmiar jak duży przycisk scroll */}
      {/* Usunięto border, aby optycznie nie był "grubszy" od przycisku poniżej */}
      <Button
        onClick={handleClick}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-transform hover:scale-105 active:scale-95"
        title="Pobierz aplikację"
      >
        <Download className="h-6 w-6" />
        <span className="sr-only">Zainstaluj aplikację</span>
      </Button>
    </div>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
      <ScrollRestoration />
      <NavBar />

      <main className="flex-1 container mx-auto px-4 md:px-8 mt-16 max-w-7xl">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />

            {/* Regulaminy */}
            <Route path="/terms" component={TermsPage} />
            <Route path="/regulamin" component={TermsPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/polityka-prywatnosci" component={PrivacyPage} />

            {/* Strony Chronione */}
            <ProtectedRoute path="/dashboard" component={DashboardPage} />
            <ProtectedRoute path="/booking" component={BookingPage} />
            <ProtectedRoute path="/admin" component={AdminPanel} role="admin" />

            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
        {/* Przycisk instalacji */}
        <PwaInstallButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
