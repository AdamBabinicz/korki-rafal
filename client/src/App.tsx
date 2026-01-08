import React, { Suspense, lazy } from "react";
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
import { Loader2 } from "lucide-react";

// Importy stron
const HomePage = lazy(() => import("@/pages/home"));
const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const AdminPanel = lazy(() => import("@/pages/admin"));
const BookingPage = lazy(() => import("@/pages/booking"));
const PrivacyPage = lazy(() => import("@/pages/Privacy")); // Pamiętaj o wielkiej literze pliku
const TermsPage = lazy(() => import("@/pages/Terms")); // Pamiętaj o wielkiej literze pliku
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
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

            {/* --- ZMIANA: Obsługa polskich i angielskich adresów --- */}
            {/* Regulamin */}
            <Route path="/terms" component={TermsPage} />
            <Route path="/regulamin" component={TermsPage} />

            {/* Polityka Prywatności */}
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
