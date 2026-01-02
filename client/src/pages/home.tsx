import { Link } from "wouter";
import { Button } from "@/components/ui-button";
import { ArrowRight, CheckCircle2, Sigma, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center space-x-2 text-2xl font-bold font-display tracking-tight">
          <span className="text-primary">Math</span>
          <span className="text-orange-500">Mentor</span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="font-bold"
          >
            {i18n.language === 'pl' ? 'EN' : 'PL'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Link href="/login">
            <Button variant="ghost">{t('nav.login')}</Button>
          </Link>
          <Link href="/register">
            <Button>{t('hero.cta')}</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-7xl font-bold font-display leading-tight">
              {t('hero.title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                {t('hero.subtitle').split('.')[0]}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 h-14 shadow-xl shadow-primary/20">
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link href="/login">
                 <Button variant="outline" size="lg" className="text-lg px-8 h-14">
                  {t('nav.booking')}
                </Button>
              </Link>
            </div>

            <div className="pt-8 border-t border-border grid grid-cols-2 gap-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg">{t('features.scheduling')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.scheduling_desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sigma className="w-6 h-6 text-orange-400 shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg">{t('features.progress')}</h3>
                  <p className="text-sm text-muted-foreground">{t('features.progress_desc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-orange-500/20 rounded-full blur-2xl" />
            <img 
                src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000" 
                alt="Math Abstract"
                className="relative rounded-3xl border border-border shadow-2xl shadow-black/50 rotate-3 hover:rotate-0 transition-transform duration-500" 
            />
          </div>
        </div>
      </main>
    </div>
  );
}
