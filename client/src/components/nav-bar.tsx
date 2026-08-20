import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function NavBar() {
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const { t, i18n } = useTranslation();

  const { theme, setTheme } = useTheme();

  const currentLang = i18n.language ? i18n.language.split("-")[0] : "pl";

  const toggleLanguage = () => {
    const nextLang = currentLang === "pl" ? "en" : "pl";
    i18n.changeLanguage(nextLang);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const btnBase =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const btnDefault =
    "bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2";

  const langAriaLabel =
    currentLang === "pl"
      ? t("common.switch_to_en", { defaultValue: "Switch to English" })
      : t("common.switch_to_pl", { defaultValue: "Przełącz na polski" });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
      <nav
        className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-full"
        aria-label="MathMentor Navigation"
      >
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-1 sm:space-x-2 text-xl sm:text-2xl font-bold font-display tracking-tight hover:opacity-80 transition-opacity cursor-pointer shrink-0 min-h-[44px]"
            aria-label="MathMentor - Strona Główna"
          >
            <span className="text-primary">Math</span>
            <span className="text-orange-600 dark:text-orange-500">Mentor</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-3">
            {/* Nawigacja zalogowanego użytkownika - widoczna na mobile i desktop */}
            {user && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  className={cn(
                    "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
                    location.includes("dashboard") || location.includes("admin")
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  {t("nav.dashboard")}
                </Link>
                <Link
                  href="/booking"
                  className={cn(
                    "px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
                    location === "/booking"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  {t("nav.booking")}
                </Link>
              </div>
            )}

            {/* Przycisk zmiany języka */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={langAriaLabel}
              aria-label={langAriaLabel}
              className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] shrink-0"
            >
              <span className="text-xs font-bold">
                {currentLang.toUpperCase()}
              </span>
            </Button>

            {/* Przycisk motywu (Dark/Light) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={t("common.theme_toggle")}
              aria-label={t("common.theme_toggle")}
              className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px] shrink-0"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>

            {/* Stan logowania */}
            <div className="min-w-[36px] sm:min-w-[40px] flex items-center justify-end shrink-0">
              {isUserLoading ? (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-muted/40 animate-pulse" />
              ) : user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logout()}
                  title={t("nav.logout")}
                  aria-label={t("nav.logout")}
                  className="hover:text-destructive transition-colors w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] sm:min-w-[40px]"
                >
                  <LogOut className="w-4 w-4 sm:w-5 sm:h-5" />
                </Button>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    btnBase,
                    btnDefault,
                    "ml-1 sm:ml-2 gap-1.5 sm:gap-2 cursor-pointer h-9 px-3 sm:px-4 text-xs sm:text-sm flex items-center justify-center",
                  )}
                  aria-label={t("nav.login_aria", {
                    defaultValue: t("nav.login"),
                  })}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">
                    {t("nav.login")}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
