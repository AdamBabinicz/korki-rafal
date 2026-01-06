import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ScrollRestoration } from "@/components/scroll-restoration"; // NOWY IMPORT
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import AdminPanel from "@/pages/admin";
import BookingPage from "@/pages/booking";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import { ProtectedRoute } from "@/components/protected-route";

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
      {/* Mechanizm przywracania przewijania */}
      <ScrollRestoration />

      {/* Nawigacja */}
      <NavBar />

      {/* Główny kontener treści */}
      <main className="flex-1 container mx-auto px-4 md:px-8 mt-16 max-w-7xl">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />

          {/* Legal pages - Public access */}
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />

          {/* Protected Routes */}
          <ProtectedRoute path="/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/booking" component={BookingPage} />
          <ProtectedRoute path="/admin" component={AdminPanel} role="admin" />

          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </main>

      {/* Elementy globalne interfejsu */}
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
