import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MessageCircle, Globe, Facebook } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  // Logika daty:
  // Rok startowy to 2026.
  // Jeśli jest rok 2026, wyświetli "2026".
  // Jeśli będzie rok 2027 lub późniejszy, wyświetli "2026 - 2027".
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const displayDate =
    currentYear > startYear ? `${startYear} - ${currentYear}` : `${startYear}`;

  return (
    <footer className="w-full border-t bg-background pt-10 pb-8 mt-auto transition-colors duration-300">
      <div className="container mx-auto px-6 md:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-8">
          {/* Kolumna 1: Kontakt */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-foreground text-lg">
              {t("footer.contact")}
            </h3>
            <a
              href="tel:+48516283896"
              className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit"
              title="Zadzwoń"
              aria-label="Zadzwoń pod numer +48 516 283 896"
            >
              <div className="p-2 bg-primary/5 rounded-full">
                <Phone className="h-4 w-4" />
              </div>
              <span>+48 516 283 896</span>
            </a>

            <a
              href="mailto:rafal.podymniak97@gmail.com"
              className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit"
              title="Napisz e-mail"
              aria-label="Wyślij e-mail na adres rafal.podymniak97@gmail.com"
            >
              <div className="p-2 bg-primary/5 rounded-full">
                <Mail className="h-4 w-4" />
              </div>
              <span>rafal.podymniak97@gmail.com</span>
            </a>
          </div>

          {/* Kolumna 2: Social Media & WWW */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-foreground text-lg">
              {t("footer.socials")}
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://m.me/100094791384674"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit"
                title="Napisz na Messengerze"
                aria-label="Napisz wiadomość na Messengerze (otwiera się w nowej karcie)"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Messenger</span>
              </a>

              <a
                href="https://www.facebook.com/profile.php?id=100094791384674"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors w-fit"
                title="Odwiedź profil na Facebooku"
                aria-label="Odwiedź profil na Facebooku (otwiera się w nowej karcie)"
              >
                <Facebook className="h-4 w-4" />
                <span>Facebook</span>
              </a>

              <a
                href="https://korepetycje.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors w-fit"
                title="Odwiedź stronę Raf-Edu"
                aria-label="Odwiedź stronę Raf-Edu (otwiera się w nowej karcie)"
              >
                <Globe className="h-4 w-4" />
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
                href="/terms"
                className="text-muted-foreground hover:text-foreground hover:underline transition-colors w-fit"
              >
                {t("legal.terms")}
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground hover:underline transition-colors w-fit"
              >
                {t("legal.privacy")}
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Dolny pasek z datą */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-2">
          <span>
            {displayDate} {t("footer.rights")}
          </span>
          <span className="font-medium font-mono text-xs opacity-50">
            {t("footer.designed")}
          </span>
        </div>
      </div>
    </footer>
  );
}
