import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Scale,
  Clock,
  AlertTriangle,
  Copyright,
  Banknote,
  ArrowLeft,
  MapPin,
} from "lucide-react";

export default function TermsPage() {
  const { i18n } = useTranslation();
  const [location, setLocation] = useLocation();
  const lang = i18n.language?.startsWith("pl") ? "pl" : "en";

  useEffect(() => {
    if (lang === "pl" && location === "/terms") {
      setLocation("/regulamin", { replace: true });
    } else if (lang === "en" && location === "/regulamin") {
      setLocation("/terms", { replace: true });
    }
  }, [lang, location, setLocation]);

  return (
    // ZMIANA: Usunięto 'container', dodano 'w-full' aby wykorzystać pełną szerokość rodzica
    <div className="w-full max-w-4xl mx-auto py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-4 md:mb-6">
        <Link href="/">
          <Button
            variant="ghost"
            className="gap-2 pl-0 hover:bg-transparent hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "pl" ? "Powrót do strony głównej" : "Back to Home"}
          </Button>
        </Link>
      </div>

      <Card className="mb-8 shadow-lg border-primary/10">
        <CardHeader className="text-center bg-muted/20 pb-6 md:pb-8 border-b px-4">
          <CardTitle className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2 md:gap-3">
            <Scale className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
            {lang === "pl" ? "Regulamin Serwisu" : "Terms of Service"}
          </CardTitle>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl mx-auto">
            {lang === "pl"
              ? "Zasady rezerwacji, płatności i korzystania z platformy MathMentor."
              : "Rules for booking, payments, and using the MathMentor platform."}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {/* ZMIANA: Mniejszy padding na mobile (p-4) */}
          <ScrollArea className="h-[600px] md:h-[700px] p-4 md:p-8">
            {lang === "pl" ? <TermsPL /> : <TermsEN />}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function TermsPL() {
  return (
    <div className="space-y-6 md:space-y-8 text-sm text-foreground/80 leading-relaxed">
      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3">
          1. Postanowienia Ogólne
        </h3>
        <p>
          Niniejszy Regulamin określa zasady korzystania z systemu rezerwacji
          korepetycji MathMentor. Rejestracja konta w systemie jest równoznaczna
          z akceptacją tych zasad. Usługa polega na udostępnianiu kalendarza i
          możliwości rezerwacji terminów zajęć edukacyjnych z matematyki.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary shrink-0" /> 2. Zasady
          Rezerwacji i Anulowania
        </h3>
        <div className="bg-destructive/5 border border-destructive/20 p-3 md:p-4 rounded-lg">
          <ul className="list-disc pl-4 space-y-2">
            <li>
              Uczeń ma prawo zarezerwować dowolny dostępny termin ("Wolny")
              widoczny w Kalendarzu.
            </li>
            <li>
              <strong>Standardowe anulowanie (24h):</strong> Uczeń może
              samodzielnie odwołać rezerwację poprzez system najpóźniej na{" "}
              <strong>24 godziny</strong> przed planowanym rozpoczęciem zajęć.
            </li>
            <li>
              <strong>Okres na pomyłkę (Grace Period):</strong> Jeśli rezerwacja
              została dokonana omyłkowo, Uczeń ma prawo ją odwołać w ciągu{" "}
              <strong>30 minut</strong> od momentu rezerwacji, nawet jeśli do
              zajęć pozostało mniej niż 24h.
            </li>
            <li>
              <strong>Brak odwołania:</strong> W przypadku nieodwołania zajęć w
              terminie lub niestawienia się na lekcję, Administrator ma prawo
              potraktować zajęcia jako <strong>odbyte i płatne w 100%</strong>.
            </li>
          </ul>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary shrink-0" /> 3. Miejsce i Czas
          Zajęć
        </h3>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            Podczas rezerwacji Uczeń wybiera format zajęć:{" "}
            <strong>U korepetytora / Online</strong> lub{" "}
            <strong>Z dojazdem</strong>.
          </li>
          <li>
            Wybór opcji <strong>"Z dojazdem"</strong> automatycznie wydłuża
            blokadę w kalendarzu Nauczyciela o dodatkowe 30 minut na podróż.
          </li>
          <li>
            Lekcje odbywają się w godzinach ściśle określonych w rezerwacji.
            Spóźnienie Ucznia nie powoduje przedłużenia czasu trwania zajęć.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary shrink-0" /> 4. Płatności
        </h3>
        <p>
          System MathMentor służy do ewidencji należności (statusy "Opłacone" /
          "Nieopłacone"), jednak same płatności odbywają się poza systemem
          (gotówka/przelew), chyba że Administrator ustali inaczej. Użytkownik
          zobowiązany jest do terminowego regulowania należności zgodnie z
          cennikiem.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Copyright className="h-5 w-5 text-primary shrink-0" /> 5.
          Odpowiedzialność i Technologia
        </h3>
        <p className="mb-2">
          Serwis jest dostarczany w modelu "tak jak jest" (as is).
        </p>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            Platforma została wygenerowana przy użyciu{" "}
            <strong>Sztucznej Inteligencji (AI)</strong>. Mimo dołożenia
            wszelkich starań w celu weryfikacji kodu, Administrator nie ponosi
            odpowiedzialności za ewentualne błędy techniczne.
          </li>
          <li>
            Użytkownik zobowiązany jest do podawania prawdziwych danych
            kontaktowych (E-mail), co jest niezbędne do otrzymywania powiadomień
            o statusie rezerwacji.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0" /> 6.
          Postanowienia Końcowe
        </h3>
        <p>
          Administrator zastrzega sobie prawo do zablokowania konta użytkownika,
          który notorycznie łamie zasady rezerwacji (np. blokowanie terminów
          innym uczniom). W sprawach nieuregulowanych niniejszym regulaminem
          zastosowanie mają przepisy Kodeksu Cywilnego.
        </p>
      </section>
    </div>
  );
}

function TermsEN() {
  return (
    <div className="space-y-6 md:space-y-8 text-sm text-foreground/80 leading-relaxed">
      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3">
          1. General Provisions
        </h3>
        <p>
          These Terms of Service define the rules for using the MathMentor
          tutoring booking system. Registration in the system constitutes
          acceptance of these rules. The service consists of providing a
          calendar and the ability to book mathematics tutoring sessions.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary shrink-0" /> 2. Booking and
          Cancellation
        </h3>
        <div className="bg-destructive/5 border border-destructive/20 p-3 md:p-4 rounded-lg">
          <ul className="list-disc pl-4 space-y-2">
            <li>
              The Student has the right to book any available slot ("Available")
              visible in the Calendar.
            </li>
            <li>
              <strong>Standard Cancellation (24h):</strong> The Student may
              cancel a booking via the system no later than{" "}
              <strong>24 hours</strong> before the scheduled start time.
            </li>
            <li>
              <strong>Grace Period:</strong> If a booking was made by mistake,
              the Student has the right to cancel it within{" "}
              <strong>30 minutes</strong> of booking, even if less than 24 hours
              remain until the lesson.
            </li>
            <li>
              <strong>Late Cancellation/No-Show:</strong> In case of failure to
              cancel within the time limit or failure to show up, the
              Administrator reserves the right to treat the lesson as{" "}
              <strong>completed and 100% payable</strong>.
            </li>
          </ul>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary shrink-0" /> 3. Lesson
          Location & Time
        </h3>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            During booking, the Student selects the format:{" "}
            <strong>On-site (Tutor's/Online)</strong> or{" "}
            <strong>With Commute</strong>.
          </li>
          <li>
            Selecting <strong>"With Commute"</strong> automatically extends the
            Teacher's calendar block by an additional 30 minutes for travel.
          </li>
          <li>
            Lessons take place strictly during the booked hours. Student
            lateness does not extend the lesson duration.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary shrink-0" /> 4. Payments
        </h3>
        <p>
          The MathMentor system tracks payment statuses ("Paid" / "Unpaid").
          Actual payments occur outside the system (cash/transfer), unless
          otherwise agreed. The User is obliged to settle payments on time.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Copyright className="h-5 w-5 text-primary shrink-0" /> 5. Liability
          and Technology
        </h3>
        <p className="mb-2">The Service is provided on an "as is" basis.</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            The Administrator is not liable for technical errors or server
            downtime provided by third-party services.
          </li>
          <li>
            The User is obliged to provide truthful contact data (Email) to
            receive booking notifications.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary shrink-0" /> 6. Final
          Provisions
        </h3>
        <p>
          The Administrator reserves the right to block a user who notoriously
          violates booking rules (e.g., blocking slots for others). In matters
          not covered by these regulations, applicable civil laws apply.
        </p>
      </section>
    </div>
  );
}
