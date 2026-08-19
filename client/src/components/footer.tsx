import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MessageCircle,
  Globe,
  Facebook,
  MessageSquare,
} from "lucide-react";

export function Footer() {
  const { t, i18n } = useTranslation();

  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  const isPL = currentLang?.startsWith("pl");

  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const displayDate =
    currentYear > startYear ? `${startYear} - ${currentYear}` : `${startYear}`;

  // Logika anty-spam
  const userPart = "rafal.podymniak97";
  const domainPart = "gmail.com";

  const handleEmailInteraction = (
    e:
      | React.MouseEvent<HTMLAnchorElement>
      | React.FocusEvent<HTMLAnchorElement>,
  ) => {
    const link = e.currentTarget;
    const mailto = `mailto:${userPart}@${domainPart}`;
    if (link.href !== mailto) {
      link.href = mailto;
    }
  };

  return (
    <footer className="w-full border-t border-border bg-background pt-10 pb-8 mt-auto min-h-[320px] transition-colors duration-300">
      <div className="container mx-auto px-6 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-8">
          {/* Kolumna 1: Kontakt */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-foreground text-lg">
              {t("footer.contact")}
            </h3>
            <a
              href="tel:+48516283896"
              className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit min-h-[44px]"
              title={t("footer.call", {
                defaultValue: "Zadzwoń: +48 516 283 896",
              })}
              aria-label={t("footer.call_aria", {
                defaultValue: "Zadzwoń pod numer +48 516 283 896",
              })}
            >
              <div className="p-2 bg-primary/5 rounded-full shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <span className="font-medium">+48 516 283 896</span>
            </a>

            {/* ZABEZPIECZONY ADRES EMAIL */}
            <a
              href="#"
              onClick={handleEmailInteraction}
              onMouseEnter={handleEmailInteraction}
              onFocus={handleEmailInteraction}
              className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit group min-h-[44px]"
              title={t("footer.email", { defaultValue: "Napisz e-mail" })}
              aria-label={t("footer.email_aria", {
                defaultValue: "Napisz e-mail do MathMentor",
              })}
            >
              <div className="p-2 bg-primary/5 rounded-full shrink-0">
                <Mail className="h-4 w-4" />
              </div>

              <span className="flex items-center">
                <span>{userPart}</span>
                <span className="px-[1px] text-muted-foreground/80 group-hover:text-primary transition-colors">
                  @
                </span>
                <span className="hidden" aria-hidden="true">
                  no-spam
                </span>
                <span>{domainPart}</span>
              </span>
            </a>
          </div>

          {/* Kolumna 2: Social Media & WWW */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-foreground text-lg">
              {t("footer.socials")}
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/48516283896"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-green-600 dark:hover:text-green-500 transition-colors w-fit min-h-[36px]"
                title="WhatsApp"
                aria-label="WhatsApp - MathMentor"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span>WhatsApp</span>
              </a>

              <a
                href="https://m.me/100094791384674"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit min-h-[36px]"
                title="Messenger"
                aria-label="Messenger - MathMentor"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>Messenger</span>
              </a>

              <a
                href="https://www.facebook.com/profile.php?id=100094791384674"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit min-h-[36px]"
                title="Facebook"
                aria-label="Facebook - Rafał Podymniak Korepetycje"
              >
                <Facebook className="h-4 w-4 shrink-0" />
                <span>Facebook</span>
              </a>

              <a
                href="https://korepetycje.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit min-h-[36px]"
                title="Raf-Edu"
                aria-label="Raf-Edu Korepetycje Strona WWW"
              >
                <Globe className="h-4 w-4 shrink-0" />
                <span>Raf-Edu</span>
              </a>
            </div>
          </div>

          {/* Kolumna 3: Prawne & Informacje */}
          <div className="flex flex-col gap-4 md:items-start">
            <h3 className="font-bold text-foreground text-lg">
              {t("footer.info")}
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                href={isPL ? "/regulamin" : "/terms"}
                className="text-muted-foreground hover:text-foreground hover:underline transition-colors w-fit cursor-pointer min-h-[36px] flex items-center"
              >
                {t("legal.terms")}
              </Link>
              <Link
                href={isPL ? "/polityka-prywatnosci" : "/privacy"}
                className="text-muted-foreground hover:text-foreground hover:underline transition-colors w-fit cursor-pointer min-h-[36px] flex items-center"
              >
                {t("legal.privacy")}
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-2">
          <span>
            {displayDate} {t("footer.rights")}
          </span>
          <span className="font-medium font-mono text-xs text-muted-foreground">
            {t("footer.designed")}
          </span>
        </div>
      </div>
    </footer>
  );
}
