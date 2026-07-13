import { Resend } from "resend";
import { appUrl, formatCurrency } from "@/lib/utils";

const resend = process.env.AUTH_RESEND_KEY
  ? new Resend(process.env.AUTH_RESEND_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@example.ee";

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email skipped — no AUTH_RESEND_KEY] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error("Email send failed", error);
  }
}

/** Light HTML shell matching the site design (white cards, orange accent) */
function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="et">
<body style="margin:0;padding:0;background-color:#f6f7f8;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7f8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding:0 0 24px 0;text-align:center;">
          <span style="font-size:26px;font-weight:800;color:#E8830C;letter-spacing:0.5px;">romu.ee</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
          <h1 style="margin:0 0 16px 0;font-size:20px;color:#1c1c1e;">${title}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:24px 8px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
          AMJ Autoäri OÜ · Üksnurme tee 14, Saku 75501<br/>
          +372 5647 2277 · romu@romu.ee
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;"><tr>
    <td style="background-color:#E8830C;border-radius:6px;">
      <a href="${href}" style="display:inline-block;padding:12px 32px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">${label}</a>
    </td></tr></table>`;
}

const p = (text: string) =>
  `<p style="margin:0 0 12px 0;color:#4b5563;font-size:15px;line-height:1.6;">${text}</p>`;

export async function sendVerificationEmail(to: string, token: string) {
  const link = appUrl(`/email-verification?token=${token}`);
  await send(
    to,
    "Kinnitage oma e-posti aadress",
    shell(
      "Kinnitage oma e-posti aadress",
      p("Täname registreerumast! Konto aktiveerimiseks kinnitage palun oma e-posti aadress.") +
        button(link, "Kinnita e-post") +
        p(`Kui nupp ei tööta, avage see link: <a href="${link}" style="color:#E8830C;">${link}</a>`) +
        p("Kui teie ei loonud seda kontot, võite selle kirja eirata.")
    )
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = appUrl(`/parooli-lahtestamine?token=${token}`);
  await send(
    to,
    "Parooli lähtestamine",
    shell(
      "Parooli lähtestamine",
      p("Saime taotluse teie parooli lähtestamiseks. Uue parooli seadmiseks vajutage allolevat nuppu. Link kehtib 1 tund.") +
        button(link, "Lähtesta parool") +
        p("Kui teie seda ei taotlenud, võite selle kirja eirata — teie parool jääb samaks.")
    )
  );
}

export async function sendOutbidEmail(
  to: string,
  auctionTitle: string,
  newAmount: number,
  auctionSlug: string
) {
  const link = appUrl(`/oksjon/${auctionSlug}`);
  await send(
    to,
    `Teid on üle pakutud — ${auctionTitle}`,
    shell(
      "Teid on üle pakutud",
      p(`Oksjonil <strong style="color:#1c1c1e;">${auctionTitle}</strong> on tehtud kõrgem pakkumine.`) +
        p(`Parim pakkumine on nüüd <strong style="color:#E8830C;font-size:18px;">${formatCurrency(newAmount)}</strong>`) +
        button(link, "Tee uus pakkumine")
    )
  );
}

export async function sendAuctionWonEmail(
  to: string,
  auctionTitle: string,
  amount: number,
  auctionSlug: string
) {
  const link = appUrl(`/oksjon/${auctionSlug}`);
  await send(
    to,
    `Õnnitleme! Võitsite oksjoni — ${auctionTitle}`,
    shell(
      "Õnnitleme! Võitsite oksjoni",
      p(`Teie pakkumine <strong style="color:#16a34a;font-size:18px;">${formatCurrency(amount)}</strong> oksjonil <strong style="color:#1c1c1e;">${auctionTitle}</strong> osutus võitjaks.`) +
        p("Võtame teiega peagi ühendust tehingu vormistamiseks.") +
        button(link, "Vaata oksjonit")
    )
  );
}

export async function sendWelcomeEmail(to: string, name?: string | null) {
  await send(
    to,
    "Tere tulemast!",
    shell(
      `Tere tulemast${name ? ", " + name : ""}!`,
      p("Teie konto on kinnitatud. Nüüd saate osaleda kõikidel aktiivsetel oksjonitel.") +
        button(appUrl("/autooksjonid"), "Vaata oksjoneid")
    )
  );
}
