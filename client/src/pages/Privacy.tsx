import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Server,
  Cookie,
  BrainCircuit,
  Database,
  ArrowLeft,
} from "lucide-react";

export default function PrivacyPage() {
  const { i18n } = useTranslation();
  const [location, setLocation] = useLocation();
  const lang = i18n.language?.startsWith("pl") ? "pl" : "en";

  useEffect(() => {
    if (lang === "pl" && location === "/privacy") {
      setLocation("/polityka-prywatnosci", { replace: true });
    } else if (lang === "en" && location === "/polityka-prywatnosci") {
      setLocation("/privacy", { replace: true });
    }
  }, [lang, location, setLocation]);

  return (
    // ZMIANA: Usunięto 'container', dodano 'w-full'
    <div className="w-full max-w-4xl mx-auto py-4 md:py-8 px-2 md:px-4">
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

      <Card className="mb-8 shadow-lg">
        <CardHeader className="text-center bg-muted/20 pb-6 md:pb-8 px-4">
          <CardTitle className="text-2xl md:text-3xl font-bold flex items-center justify-center gap-2 md:gap-3">
            <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 text-primary shrink-0" />
            {lang === "pl" ? "Polityka Prywatności" : "Privacy Policy"}
          </CardTitle>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl mx-auto">
            {lang === "pl"
              ? "Dokument określający zasady przetwarzania danych osobowych w systemie MathMentor, zgodnie z RODO (GDPR)."
              : "Document outlining data processing rules within the MathMentor system, compliant with GDPR."}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {/* ZMIANA: Mniejszy padding na mobile */}
          <ScrollArea className="h-[600px] md:h-[700px] p-4 md:p-8">
            {lang === "pl" ? <PrivacyPL /> : <PrivacyEN />}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function PrivacyPL() {
  return (
    <div className="space-y-6 md:space-y-8 text-sm text-foreground/80 leading-relaxed">
      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          1. Administrator Danych
        </h3>
        <p>
          Administratorem Twoich danych osobowych w ramach systemu rezerwacji
          korepetycji MathMentor jest właściciel serwisu (dalej
          "Administrator"). W sprawach związanych z ochroną danych możesz
          skontaktować się bezpośrednio z nauczycielem prowadzącym zajęcia lub
          poprzez adres e-mail używany do powiadomień systemowych.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary shrink-0" /> 2. Zakres i cel
          zbierania danych
        </h3>
        <p className="mb-2">
          Przetwarzamy dane wyłącznie w celu realizacji usługi edukacyjnej
          (korepetycji):
        </p>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            <strong>Dane konta (Wymagane):</strong> Nazwa użytkownika, Adres
            E-mail (niezbędny do logowania, resetowania hasła oraz otrzymywania
            automatycznych powiadomień o zmianach w grafiku), Hasło
            (przechowywane w formie zaszyfrowanej algorytmem scrypt).
          </li>
          <li>
            <strong>Dane kontaktowe (Opcjonalne):</strong> Imię i nazwisko,
            Numer telefonu (do szybkiego kontaktu SMS w sprawach nagłych), Adres
            zamieszkania (przechowywany wyłącznie jeśli jest wymagany do
            wystawienia rachunku/faktury).
          </li>
          <li>
            <strong>Proces edukacyjny:</strong> Historia odbytych lekcji, tematy
            zajęć, statusy płatności oraz prywatne notatki Administratora
            dotyczące postępów ucznia (profilowanie edukacyjne w celu lepszego
            dopasowania materiału).
          </li>
          <li>
            <strong>Dane techniczne:</strong> Adres IP, logi serwera, pliki
            cookie sesyjne (niezbędne do utrzymania zalogowania).
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary shrink-0" /> 3. Infrastruktura
          Techniczna i Podpowierzenie
        </h3>
        <p className="mb-2">
          Twoje dane są bezpieczne dzięki wykorzystaniu nowoczesnej
          infrastruktury chmurowej. Powierzamy przetwarzanie danych
          wyspecjalizowanym podmiotom (Procesorom):
        </p>
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Baza Danych: Neon Console
            </strong>
            Serwerless PostgreSQL. Dane przechowywane są w bezpiecznych centrach
            danych z szyfrowaniem spoczynkowym (encryption at rest).
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Hosting: Render & Netlify
            </strong>
            Render obsługuje logikę backendu (API), a Netlify serwuje interfejs
            użytkownika (Frontend). Oba podmioty stosują standardy
            bezpieczeństwa zgodne z branżą.
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Poczta: Google (Gmail)
            </strong>
            System wysyła powiadomienia (np. "Zwolnił się termin",
            "Potwierdzenie rezerwacji") przy użyciu infrastruktury Google.
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Analityka: Google GTM
            </strong>
            Wykorzystujemy Google Tag Manager oraz Google Analytics do
            anonimowego śledzenia wydajności aplikacji.
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary shrink-0" /> 4.
          Transparentność AI
        </h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
          <p>
            Informujemy, że kod źródłowy tej platformy został wygenerowany przy
            wsparciu narzędzi sztucznej inteligencji:{" "}
            <strong>Replit, OpenAI (ChatGPT) oraz Google AI Studio</strong>.
          </p>
          <p className="mt-2 font-medium">
            Ważne: Twoje dane osobowe zgromadzone w bazie danych (terminy,
            notatki, dane uczniów) NIE są udostępniane tym modelom AI w celu ich
            trenowania. AI służyło jedynie jako narzędzie programistyczne do
            stworzenia struktury aplikacji.
          </p>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Cookie className="h-5 w-5 text-primary shrink-0" /> 5. Pliki Cookies
        </h3>
        <p>Serwis wykorzystuje pliki cookies w dwóch celach:</p>
        <ul className="list-disc pl-4 mt-2 space-y-1">
          <li>
            <strong>Techniczne (Niezbędne):</strong> Utrzymanie sesji po
            zalogowaniu (zapisywane w tabeli `session` w bazie danych). Bez nich
            serwis nie działa.
          </li>
          <li>
            <strong>Analityczne:</strong> Obsługiwane przez Google Analytics.
            Zarządzanie zgodami na te pliki odbywa się poprzez zewnętrzny baner{" "}
            <strong>CookieScript</strong>, widoczny przy pierwszym wejściu na
            stronę.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3">
          6. Prawa Użytkownika (RODO)
        </h3>
        <p>Przysługuje Ci prawo do:</p>
        <ul className="list-disc pl-4 mt-2 space-y-1">
          <li>Dostępu do swoich danych i ich kopii.</li>
          <li>
            Sprostowania danych (możesz edytować e-mail i telefon samodzielnie w
            panelu "Pulpit").
          </li>
          <li>
            Usunięcia danych ("prawo do bycia zapomnianym") – w tym celu
            skontaktuj się z Administratorem, aby usunął Twoje konto z bazy.
          </li>
          <li>
            Wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych
            (PUODO).
          </li>
        </ul>
      </section>
    </div>
  );
}

function PrivacyEN() {
  return (
    <div className="space-y-6 md:space-y-8 text-sm text-foreground/80 leading-relaxed">
      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          1. Data Controller
        </h3>
        <p>
          The controller of your personal data within the MathMentor tutoring
          booking system is the service owner (hereinafter "Controller"). For
          data protection inquiries, please contact the teacher directly or
          reply to system notification emails.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-primary shrink-0" /> 2. Scope and
          Purpose of Data Collection
        </h3>
        <p className="mb-2">
          We process data solely for the purpose of providing educational
          services (tutoring):
        </p>
        <ul className="list-disc pl-4 space-y-2">
          <li>
            <strong>Account Data (Required):</strong> Username, Email address
            (essential for login, password reset, and automatic schedule
            notifications), Password (stored encrypted via scrypt).
          </li>
          <li>
            <strong>Contact Data (Optional):</strong> Name, Phone number (for
            quick SMS contact in emergencies), Address (stored only if required
            for billing/invoicing).
          </li>
          <li>
            <strong>Educational Process:</strong> Lesson history, topics,
            payment statuses, and private Administrator notes regarding student
            progress (educational profiling to better tailor the material).
          </li>
          <li>
            <strong>Technical Data:</strong> IP address, server logs, session
            cookies (necessary to maintain login state).
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary shrink-0" /> 3. Infrastructure
          & Data Processors
        </h3>
        <p className="mb-2">
          Your data is secure thanks to modern cloud infrastructure. We entrust
          data processing to specialized entities (Processors):
        </p>
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Database: Neon Console
            </strong>
            Serverless PostgreSQL. Data is stored in secure data centers with
            encryption at rest.
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Hosting: Render & Netlify
            </strong>
            Render handles backend logic (API), and Netlify serves the user
            interface (Frontend). Both entities apply industry-standard security
            measures.
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Email: Google (Gmail)
            </strong>
            The system sends notifications (e.g., "Slot Free", "Booking
            Confirmed") using Google infrastructure.
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <strong className="block text-foreground">
              Analytics: Google GTM
            </strong>
            We use Google Tag Manager and Google Analytics for anonymous
            application performance tracking.
          </div>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary shrink-0" /> 4. AI
          Transparency
        </h3>
        <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
          <p>
            Please be advised that the source code of this platform was
            generated with the support of artificial intelligence tools:{" "}
            <strong>Replit, OpenAI (ChatGPT), and Google AI Studio</strong>.
          </p>
          <p className="mt-2 font-medium">
            Important: Your personal data stored in the database (slots, notes,
            student data) is NOT shared with these AI models for training
            purposes. AI served only as a coding tool to create the application
            structure.
          </p>
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3 flex items-center gap-2">
          <Cookie className="h-5 w-5 text-primary shrink-0" /> 5. Cookies
        </h3>
        <p>The service uses cookies for two purposes:</p>
        <ul className="list-disc pl-4 mt-2 space-y-1">
          <li>
            <strong>Technical (Essential):</strong> Maintaining session state
            after login (stored in the `session` database table). The service
            cannot function without them.
          </li>
          <li>
            <strong>Analytical:</strong> Handled by Google Analytics. Consent
            management for these cookies is handled via the external{" "}
            <strong>CookieScript</strong> banner, visible upon first visit.
          </li>
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="text-base md:text-lg font-bold text-foreground mb-2 md:mb-3">
          6. User Rights (GDPR)
        </h3>
        <p>You have the right to:</p>
        <ul className="list-disc pl-4 mt-2 space-y-1">
          <li>Access your data and receive a copy.</li>
          <li>
            Rectify data (you can edit email and phone yourself in the
            "Dashboard").
          </li>
          <li>
            Delete data ("right to be forgotten") – to do this, contact the
            Administrator to remove your account from the database.
          </li>
          <li>Lodge a complaint with the Data Protection Authority.</li>
        </ul>
      </section>
    </div>
  );
}
