import { format } from "date-fns";
import { pl } from "date-fns/locale";

/**
 * Wysyła bezpieczne, anonimowe powiadomienie na Telegram Admina.
 * Nie przesyła żadnych danych osobowych ucznia.
 */
export async function sendSafeTelegramAlert(
  date: Date,
  customMessage?: string
) {
  // Obsługa obu wersji zmiennych (z VITE_ i bez) dla pewności
  const token =
    process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId =
    process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(
      "[TELEGRAM] Brak konfiguracji (TOKEN lub CHAT_ID w .env). Pomijam."
    );
    return;
  }

  const formattedDate = format(date, "EEEE, d MMMM 'o godz.' HH:mm", {
    locale: pl,
  });

  // LOGIKA: Jeśli przekazano własną treść (np. przy anulowaniu), użyj jej.
  // Jeśli nie (np. przy rezerwacji), użyj domyślnej "Nowa rezerwacja".
  let messageBody = "";

  if (customMessage) {
    messageBody = `${customMessage}\n\n📅 Termin: ${formattedDate}`;
  } else {
    messageBody = `🔔 <b>Nowa rezerwacja!</b>\n\n📅 Termin: ${formattedDate}\n\n<i>Zaloguj się do panelu, aby zobaczyć szczegóły.</i>`;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageBody,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[TELEGRAM] Błąd API: ${response.status} - ${errorData}`);
    } else {
      console.log("[TELEGRAM] Powiadomienie wysłane.");
    }
  } catch (error) {
    console.error("[TELEGRAM] Błąd połączenia:", error);
  }
}
