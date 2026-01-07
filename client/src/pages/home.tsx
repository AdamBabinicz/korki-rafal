import { Link } from "wouter";
import { CheckCircle2, Sigma, CalendarRange } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { t } = useTranslation();

  // Wspólne style dla przycisków
  const baseBtnStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300 pt-16">
      <main className="flex-1 flex items-center relative overflow-hidden">
        {/* TŁO: Zmniejszono opacity z /10 na /5, aby poprawić kontrast tekstu na wierzchu */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full py-12 lg:py-0">
          {/* Left Column: Text & CTA */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <h1 className="text-5xl lg:text-7xl font-bold font-display leading-tight">
              Math
              <span className="text-orange-700 dark:text-orange-500">
                Mentor
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-800 dark:to-blue-400 text-4xl lg:text-6xl block mt-2">
                {t("hero.title")}
              </span>
            </h1>

            {/* Zmieniono text-muted-foreground na text-foreground/80 dla lepszego kontrastu */}
            <p className="text-xl text-foreground/80 max-w-lg leading-relaxed font-medium">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className={cn(
                  baseBtnStyles,
                  // Zmieniono bg-orange-600 na bg-orange-700 dla kontrastu z białym tekstem
                  "h-14 px-8 text-lg shadow-xl shadow-primary/10 bg-orange-700 hover:bg-orange-800 text-white font-bold cursor-pointer w-full sm:w-auto min-w-[44px] min-h-[44px]"
                )}
                aria-label={t("hero.cta") + " - Zarejestruj się w MathMentor"}
              >
                {t("hero.cta")}
              </Link>

              <Link
                href="/login"
                className={cn(
                  baseBtnStyles,
                  // Ciemniejszy border i tekst dla przycisku Log In
                  "h-14 px-8 text-lg border border-primary/50 bg-background hover:bg-accent hover:text-accent-foreground text-primary font-semibold hover:bg-primary/5 cursor-pointer w-full sm:w-auto min-w-[44px] min-h-[44px]"
                )}
                aria-label={t("nav.login") + " - Zaloguj się do panelu"}
              >
                {t("nav.login")}
              </Link>
            </div>

            <div className="pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-600/10 rounded-lg">
                  <CalendarRange className="w-6 h-6 text-green-700 dark:text-green-500 shrink-0" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">
                    {t("features.scheduling")}
                  </h2>
                  <p className="text-sm text-foreground/70">
                    {t("features.scheduling_desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-600/10 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-orange-700 dark:text-orange-500 shrink-0" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">
                    {t("features.flexible")}
                  </h2>
                  <p className="text-sm text-foreground/70">
                    {t("features.flexible_desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-blue-600/10 rounded-lg">
                  <Sigma className="w-6 h-6 text-blue-700 dark:text-blue-500 shrink-0" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">
                    {t("features.progress")}
                  </h2>
                  <p className="text-sm text-foreground/70">
                    {t("features.progress_desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="block relative animate-in fade-in slide-in-from-right-4 duration-1000 delay-200 mt-8 lg:mt-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-orange-500/20 rounded-3xl blur-2xl transform rotate-6 scale-95" />
            <img
              src="/rafalp.avif"
              alt="Rafał Podymniak - Korepetytor matematyki"
              className="relative rounded-3xl border border-border/50 shadow-2xl shadow-black/20 rotate-3 hover:rotate-0 transition-transform duration-500 object-cover h-[350px] lg:h-[600px] w-full"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
