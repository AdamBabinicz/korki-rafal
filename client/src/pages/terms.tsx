import { useTranslation } from "react-i18next";
import { Link } from "wouter";
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
} from "lucide-react";

export default function TermsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("pl") ? "pl" : "en";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Link powrotny */}
      <div className="mb-6">
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

      <Card className="mb-8 shadow-lg">
        <CardHeader className="text-center bg-muted/20 pb-8">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Scale className="h-8 w-8 text-primary" />
            {lang === "pl" ? "Regulamin Serwisu" : "Terms of Service"}
          </CardTitle>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {lang === "pl"
              ? "Zasady rezerwacji, płatności i korzystania z platformy MathMentor."
              : "Rules for booking, payments, and using the MathMentor platform."}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[700px] p-6 md:p-8">
            {lang === "pl" ? <TermsPL /> : <TermsEN />}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function TermsPL() {
  return (
    <div className="space-y-8 text-sm text-foreground/80 leading-relaxed">
      <section>
        <h3 className="text-lg font-bold text-foreground mb-3">
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
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> 2. Zasady Rezerwacji i
          Anulowania (24h)
        </h3>
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Uczeń ma prawo zarezerwować dowolny dostępny termin ("Wolny")
              widoczny w Kalendarzu.
            </li>
            <li>
              <strong>Anulowanie zajęć:</strong> Uczeń może samodzielnie odwołać
              rezerwację poprzez system najpóźniej na{" "}
              <strong>24 godziny</strong> przed planowanym rozpoczęciem zajęć.
            </li>
            <li>
              <strong>Brak odwołania:</strong> W przypadku nieodwołania zajęć w
              terminie (mniej niż 24h) lub niestawienia się na lekcję,
              Administrator ma prawo potraktować zajęcia jako{" "}
              <strong>odbyte i płatne w 100%</strong>.
            </li>
            <li>
              System automatycznie blokuje przycisk "Anuluj" na mniej niż 24h
              przed zajęciami. W sytuacjach losowych wymagany jest kontakt
              telefoniczny.
            </li>
          </ul>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" /> 3. Płatności
        </h3>
        <p>
          System MathMentor służy do ewidencji należności (statusy "Opłacone" /
          "Nieopłacone"), jednak same płatności odbywają się poza systemem
          (gotówka/przelew), chyba że Administrator ustali inaczej. Użytkownik
          zobowiązany jest do terminowego regulowania należności zgodnie z
          cennikiem ustalonym indywidualnie lub widocznym przy rezerwacji.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Copyright className="h-5 w-5 text-primary" /> 4. Odpowiedzialność i
          Technologia
        </h3>
        <p className="mb-2">
          Serwis jest dostarczany w modelu "tak jak jest" (as is).
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Platforma została wygenerowana przy użyciu{" "}
            <strong>Sztucznej Inteligencji (AI)</strong>. Mimo dołożenia
            wszelkich starań w celu weryfikacji kodu, Administrator nie ponosi
            odpowiedzialności za ewentualne błędy techniczne, przerwy w
            działaniu serwera (Netlify/Render) lub utratę danych wynikającą z
            awarii dostawców zewnętrznych (Neon, Google).
          </li>
          <li>
            Użytkownik zobowiązany jest do podawania prawdziwych danych
            kontaktowych. Brak aktualnego e-maila/telefonu zwalnia
            Administratora z odpowiedzialności za brak powiadomienia o odwołaniu
            zajęć przez Nauczyciela.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> 5. Postanowienia
          Końcowe
        </h3>
        <p>
          Administrator zastrzega sobie prawo do odmowy świadczenia usług
          użytkownikowi, który notorycznie łamie zasady rezerwacji (np. częste
          rezerwowanie i odwoływanie terminów, blokowanie slotów innym). W
          sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają
          przepisy Kodeksu Cywilnego.
        </p>
      </section>
    </div>
  );
}

function TermsEN() {
  return (
    <div className="space-y-8 text-sm text-foreground/80 leading-relaxed">
      <section>
        <h3 className="text-lg font-bold text-foreground mb-3">
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
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" /> 2. Booking and Cancellation
          Policy (24h)
        </h3>
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              The Student has the right to book any available slot ("Available")
              visible in the Calendar.
            </li>
            <li>
              <strong>Cancellation:</strong> The Student may cancel a booking
              via the system no later than <strong>24 hours</strong> before the
              scheduled start time.
            </li>
            <li>
              <strong>Late Cancellation/No-Show:</strong> In case of failure to
              cancel within the time limit (less than 24h) or failure to show
              up, the Administrator reserves the right to treat the lesson as{" "}
              <strong>completed and 100% payable</strong>.
            </li>
            <li>
              The system automatically disables the "Cancel" button less than 24
              hours before the lesson. In emergencies, phone contact is
              required.
            </li>
          </ul>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-primary" /> 3. Payments
        </h3>
        <p>
          The MathMentor system is used to track payments (statuses "Paid" /
          "Unpaid"), but payments themselves take place outside the system
          (cash/transfer), unless otherwise agreed. The User is obliged to
          settle payments on time according to the price list agreed
          individually or visible during booking.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <Copyright className="h-5 w-5 text-primary" /> 4. Liability and
          Technology
        </h3>
        <p className="mb-2">The Service is provided on an "as is" basis.</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            The platform was generated using{" "}
            <strong>Artificial Intelligence (AI)</strong>. While every effort
            has been made to verify the code, the Administrator is not liable
            for technical errors, server downtime (Netlify/Render), or data loss
            resulting from external provider failures (Neon, Google).
          </li>
          <li>
            The User is obliged to provide truthful contact data. Failure to
            provide a current email/phone releases the Administrator from
            liability for failure to notify about lesson cancellation by the
            Teacher.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" /> 5. Final Provisions
        </h3>
        <p>
          The Administrator reserves the right to refuse service to a user who
          notoriously violates booking rules (e.g., frequent booking and
          cancelling, blocking slots for others). In matters not covered by
          these regulations, applicable civil laws apply.
        </p>
      </section>
    </div>
  );
}
