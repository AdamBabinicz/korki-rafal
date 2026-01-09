import nodemailer from "nodemailer";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Wysyła potwierdzenie do ucznia
 */
export async function sendBookingConfirmation(
  to: string,
  date: Date,
  topic: string = "Matematyka"
) {
  if (!to || !to.includes("@")) {
    console.log("[EMAIL] Brak poprawnego adresu email, pomijam wysyłkę.");
    return;
  }

  const formattedDate = format(date, "EEEE, d MMMM yyyy 'o godzinie' HH:mm", {
    locale: pl,
  });

  const mailOptions = {
    from: `"MathMentor" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "✅ Potwierdzenie rezerwacji - MathMentor",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Potwierdzenie Rezerwacji</h2>
        <p>Cześć!</p>
        <p>Twoja lekcja została pomyślnie zarezerwowana.</p>
        <p><strong>Termin:</strong> ${formattedDate}</p>
        <p><strong>Temat:</strong> ${topic}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Do zobaczenia na zajęciach!</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Potwierdzenie wysłane do: ${to}`);
  } catch (error) {
    console.error("[EMAIL] Błąd wysyłania potwierdzenia:", error);
  }
}

/**
 * Wysyła powiadomienie do Admina o nowej rezerwacji
 */
export async function sendNewBookingNotificationToAdmin(
  adminEmail: string,
  studentName: string,
  date: Date,
  topic: string
) {
  if (!adminEmail || !adminEmail.includes("@")) return;

  const formattedDate = format(date, "EEEE, d MMMM yyyy 'o godzinie' HH:mm", {
    locale: pl,
  });

  const mailOptions = {
    from: `"MathMentor System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `📅 Nowa rezerwacja: ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Nowa Rezerwacja w Kalendarzu</h2>
        <p>Uczeń <strong>${studentName}</strong> właśnie zarezerwował termin.</p>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;">📅 <strong>Kiedy:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;">📚 <strong>Temat:</strong> ${topic}</p>
        </div>

        <p><a href="https://mathmentor.pl/admin" style="color: #3b82f6; text-decoration: none;">Przejdź do Panelu Admina</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Powiadomienie dla Admina wysłane.`);
  } catch (error) {
    console.error("[EMAIL] Błąd wysyłania powiadomienia do admina:", error);
  }
}

/**
 * Powiadamia wszystkich o zwolnionym terminie
 */
export async function broadcastFreeSlot(
  bccList: string[],
  date: Date,
  adminEmail?: string
) {
  if (bccList.length === 0 && !adminEmail) return;

  const formattedDate = format(date, "EEEE, d MMMM 'o godzinie' HH:mm", {
    locale: pl,
  });

  const recipients = {
    to: adminEmail,
    bcc: bccList,
  };

  const mailOptions = {
    from: `"MathMentor" <${process.env.EMAIL_USER}>`,
    ...recipients,
    subject: "🔔 Zwolnił się termin! - MathMentor",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Wolny termin!</h2>
        <p>Właśnie zwolnił się termin na zajęcia:</p>
        <h3 style="background-color: #fff7ed; color: #c2410c; padding: 15px; border-radius: 8px; border: 1px solid #ffedd5;">
          ${formattedDate}
        </h3>
        <p>Zaloguj się do panelu, aby go zarezerwować: <a href="https://mathmentor.pl/login" style="color: #f97316;">MathMentor</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `[EMAIL] Broadcast wysłany do ${bccList.length} uczniów + admin.`
    );
  } catch (error) {
    console.error("[EMAIL] Błąd broadcastu:", error);
  }
}

/**
 * Potwierdzenie anulowania dla ucznia
 */
export async function sendCancellationConfirmation(
  to: string,
  date: Date,
  studentName: string
) {
  if (!to || !to.includes("@")) return;

  const formattedDate = format(date, "EEEE, d MMMM yyyy 'o godzinie' HH:mm", {
    locale: pl,
  });

  const mailOptions = {
    from: `"MathMentor" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "❌ Potwierdzenie anulowania rezerwacji - MathMentor",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Anulowano Rezerwację</h2>
        <p>Cześć ${studentName},</p>
        <p>Potwierdzam, że Twoja rezerwacja została anulowana.</p>

        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #fee2e2;">
          <p style="margin: 0; color: #b91c1c;">📅 <strong>Termin:</strong> ${formattedDate}</p>
        </div>

        <p>Jeśli to była pomyłka, możesz spróbować zarezerwować termin ponownie (jeśli jest nadal wolny).</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Potwierdzenie anulowania wysłane do: ${to}`);
  } catch (error) {
    console.error("[EMAIL] Błąd wysyłania potwierdzenia anulowania:", error);
  }
}

/**
 * Powiadomienie dla Admina o anulowaniu
 */
export async function sendCancellationNotificationToAdmin(
  adminEmail: string,
  studentName: string,
  date: Date
) {
  if (!adminEmail || !adminEmail.includes("@")) return;

  const formattedDate = format(date, "EEEE, d MMMM yyyy 'o godzinie' HH:mm", {
    locale: pl,
  });

  const mailOptions = {
    from: `"MathMentor System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `⚠️ Anulowana rezerwacja: ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Anulowana Rezerwacja</h2>
        <p>Uczeń <strong>${studentName}</strong> odwołał lekcję.</p>

        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; color: #b91c1c;">📅 <strong>Kiedy:</strong> ${formattedDate}</p>
        </div>

        <p>Termin wrócił do puli wolnych slotów.</p>
        <p><a href="https://mathmentor.pl/admin" style="color: #3b82f6; text-decoration: none;">Panel Admina</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Info o anulowaniu wysłane do Admina.`);
  } catch (error) {
    console.error("[EMAIL] Błąd wysyłania info o anulowaniu do admina:", error);
  }
}

/**
 * NOWE: Powiadomienie dla Admina o zapisie na listę rezerwową
 */
export async function sendWaitlistNotificationToAdmin(
  adminEmail: string,
  studentName: string,
  date: Date,
  note?: string | null
) {
  if (!adminEmail || !adminEmail.includes("@")) return;

  const formattedDate = format(date, "EEEE, d MMMM yyyy", { locale: pl });
  const userNote = note ? note : "Brak notatki";

  const mailOptions = {
    from: `"MathMentor System" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: `🔔 Lista rezerwowa: ${studentName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Nowe zgłoszenie (Lista Rezerwowa)</h2>
        <p>Uczeń <strong>${studentName}</strong> zgłosił chęć odbycia lekcji.</p>

        <div style="background-color: #f5f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #ddd6fe;">
          <p style="margin: 5px 0;">📅 <strong>Dzień:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;">📝 <strong>Notatka ucznia:</strong><br/><i>"${userNote}"</i></p>
        </div>

        <p>Sprawdź grafik i skontaktuj się z uczniem lub dodaj slot.</p>
        <p><a href="https://mathmentor.pl/admin" style="color: #8b5cf6; text-decoration: none;">Panel Admina</a></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Powiadomienie o liście rezerwowej wysłane.`);
  } catch (error) {
    console.error("[EMAIL] Błąd wysyłania info o liście rezerwowej:", error);
  }
}
