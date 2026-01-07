import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button"; // Tylko Button
import { LogOut, Sun, Moon, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function NavBar() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const { t, i18n } = useTranslation();

  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "pl" ? "en" : "pl");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Style bazowe przycisku (zamiast importowania wariantów)
  const btnBase =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const btnDefault =
    "bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-2xl font-bold font-display tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-primary">Math</span>
            <span className="text-orange-600 dark:text-orange-500">Mentor</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    location.includes("dashboard") || location.includes("admin")
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {t("nav.dashboard")}
                </Link>
                <Link
                  href="/booking"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    location === "/booking"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {t("nav.booking")}
                </Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={
                i18n.language === "pl"
                  ? "Switch to English"
                  : "Przełącz na polski"
              }
              aria-label={
                i18n.language === "pl"
                  ? "Switch to English"
                  : "Przełącz na polski"
              }
              className="w-10 h-10"
            >
              <span className="text-xs font-bold">
                {i18n.language ? i18n.language.toUpperCase() : "PL"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={t("common.theme_toggle")}
              aria-label={t("common.theme_toggle")}
              className="w-10 h-10"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {user ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title={t("nav.logout")}
                aria-label={t("nav.logout")}
                className="hover:text-destructive transition-colors w-10 h-10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            ) : (
              <Link
                href="/login"
                className={cn(
                  btnBase,
                  btnDefault,
                  "ml-2 gap-2 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                )}
                aria-label={t("nav.login")}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t("nav.login")}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
