import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "./ui-button";
import { LogOut, Calendar, Home, Settings, Sun, Moon, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";

export function NavBar() {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'pl' ? 'en' : 'pl');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href={user.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center space-x-2 text-2xl font-bold font-display tracking-tight hover:opacity-80 transition-opacity">
            <span className="text-primary">Math</span>
            <span className="text-orange-500">Mentor</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-1 bg-muted p-1 rounded-xl border border-border">
              <Link
                href={user.role === 'admin' ? '/admin' : '/dashboard'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.includes('dashboard') || location.includes('admin')
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {t('nav.dashboard')}
              </Link>
              <Link
                href="/booking"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location === '/booking'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {t('nav.booking')}
              </Link>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              title={i18n.language === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
            >
              <span className="text-xs font-bold">{i18n.language.toUpperCase()}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={t('common.theme_toggle')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              title={t('nav.logout')}
              className="hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
