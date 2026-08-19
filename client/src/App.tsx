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
import { useTranslation } from "react-i18next";

// Strona główna zaimportowana bezpośrednio dla natychmiastowego renderu (Zero CLS na wejściu)
import HomePage from "@/pages/home";

// Pozostałe podstrony ładowane asynchronicznie (Lazy Loading)
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
    <div className="flex items-center justify-center min-h-[calc(100vh-16rem)] w-full">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

// --- KOMPONENT: PRZYCISK INSTALACJI PWA (FAB) ---
function PwaInstallButton() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const isInStandaloneMode = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    if (isInStandaloneMode) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    if (ios && !isInStandaloneMode) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleClick = async () => {
    if (isIOS) {
      setShowIosHint(!showIosHint);
    } else if (deferredPrompt) {
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
    <div className="fixed bottom-24 right-8 z-40 flex flex-col items-end gap-2 animate-in fade-in duration-300 pointer-events-auto">
      {/* Dymek z instrukcją dla iOS */}
      {showIosHint && isIOS && (
        <div className="bg-popover text-popover-foreground p-4 rounded-lg shadow-xl border border-border max-w-[250px] text-sm relative mb-2 mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 bg-background rounded-full border shadow-sm"
            onClick={() => setShowIosHint(false)}
            aria-label={t("common.cancel", { defaultValue: "Zamknij" })}
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

      {/* Główny przycisk PWA */}
      <Button
        onClick={handleClick}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-transform hover:scale-105 active:scale-95"
        title={t("common.install_app", {
          defaultValue: "Pobierz aplikację MathMentor",
        })}
        aria-label={t("common.install_app", {
          defaultValue: "Zainstaluj aplikację MathMentor",
        })}
      >
        <Download className="h-6 w-6" />
        <span className="sr-only">Zainstaluj aplikację MathMentor</span>
      </Button>
    </div>
  );
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
      <ScrollRestoration />
      <NavBar />

      <main className="flex-1 w-full min-h-[calc(100vh-4rem)] flex flex-col">
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
        <PwaInstallButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
