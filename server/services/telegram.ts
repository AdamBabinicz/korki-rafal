/**
 * Wysyła bezpieczne, anonimowe powiadomienie na Telegram Admina.
 * Nie przesyła żadnych danych osobowych ucznia.
 */
export async function sendSafeTelegramAlert(
  date: Date,
  customMessage?: string,
) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId =
    process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("[TELEGRAM] Brak konfiguracji. Pomijam.");
    return;
  }

  // Używamy Intl.DateTimeFormat, aby wymusić polską strefę czasową,
  // zamiast polegać na lokalnym czasie serwera w date-fns.
  const formatter = new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Tworzymy format: "sobota, 7 marca o godz. 12:00"
  // Intl nie dodaje "o godz." automatycznie w ten sam sposób, więc składamy to ręcznie:
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.value === ":")
    ? ""
    : parts.find((p) => p.type === "minute")?.value;

  const formattedDate = `${weekday}, ${day} ${month} o godz. ${hour}:${minute}`;

  let messageBody = "";
  if (customMessage) {
    messageBody = `${customMessage}\n\n📅 Termin: ${formattedDate}`;
  } else {
    messageBody = `🔔 <b>Nowa rezerwacja!</b>\n\n📅 Termin: ${formattedDate}\n\n<i>Zaloguj się do panelu.</i>`;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageBody,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      console.error(`[TELEGRAM] Błąd API: ${response.status}`);
    }
  } catch (error) {
    console.error("[TELEGRAM] Błąd połączenia:", error);
  }
}
