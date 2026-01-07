import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button, buttonVariants } from "@/components/ui/button"; // Dodano import buttonVariants
import { LogOut, Sun, Moon, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils"; // Dodano cn

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <a className="flex items-center space-x-2 text-2xl font-bold font-display tracking-tight hover:opacity-80 transition-opacity cursor-pointer">
              <span className="text-primary">Math</span>
              <span className="text-orange-600 dark:text-orange-500">
                Mentor
              </span>
            </a>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"}>
                  <a
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      location.includes("dashboard") ||
                      location.includes("admin")
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {t("nav.dashboard")}
                  </a>
                </Link>
                <Link href="/booking">
                  <a
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      location === "/booking"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {t("nav.booking")}
                  </a>
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
              /* POPRAWKA STRUKTURY: Link > a (zamiast Link > Button) */
              <Link href="/login">
                <a
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "ml-2 gap-2 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center" // min-w/h dla Tap Targets
                  )}
                  aria-label={t("nav.login")}
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("nav.login")}</span>
                </a>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
