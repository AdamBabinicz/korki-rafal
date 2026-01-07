import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle2, Sigma, CalendarRange } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300 pt-16">
      <main className="flex-1 flex items-center relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full py-12 lg:py-0">
          {/* Left Column: Text & CTA */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <h1 className="text-5xl lg:text-7xl font-bold font-display leading-tight">
              Math
              <span className="text-orange-600 dark:text-orange-500">
                Mentor
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-700 dark:to-blue-500 text-4xl lg:text-6xl block mt-2">
                {t("hero.title")}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* POPRAWIONA SEKCJA PRZYCISKÓW (Link z wouter + a) */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <a
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    // Używamy orange-600 dla kontrastu (min. 4.5:1)
                    "text-lg px-8 h-14 shadow-xl shadow-primary/20 bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer w-full sm:w-auto flex items-center justify-center min-w-[44px] min-h-[44px]"
                  )}
                  aria-label={t("hero.cta") + " - Zarejestruj się w MathMentor"}
                >
                  {t("hero.cta")}
                </a>
              </Link>

              <Link href="/login">
                <a
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "text-lg px-8 h-14 border-primary text-primary hover:bg-primary/10 cursor-pointer w-full sm:w-auto flex items-center justify-center min-w-[44px] min-h-[44px]"
                  )}
                  aria-label={t("nav.login") + " - Zaloguj się do panelu"}
                >
                  {t("nav.login")}
                </a>
              </Link>
            </div>

            <div className="pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CalendarRange className="w-6 h-6 text-green-600 dark:text-green-500 shrink-0" />
                </div>
                <div>
                  {/* ZMIANA H3 NA H2 DLA POPRAWNEJ STRUKTURY */}
                  <h2 className="font-bold text-lg">
                    {t("features.scheduling")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("features.scheduling_desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-orange-600 dark:text-orange-500 shrink-0" />
                </div>
                <div>
                  {/* ZMIANA H3 NA H2 */}
                  <h2 className="font-bold text-lg">
                    {t("features.flexible")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("features.flexible_desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Sigma className="w-6 h-6 text-blue-600 dark:text-blue-500 shrink-0" />
                </div>
                <div>
                  {/* ZMIANA H3 NA H2 */}
                  <h2 className="font-bold text-lg">
                    {t("features.progress")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
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
