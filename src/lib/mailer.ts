import nodemailer from "nodemailer";

// ─── Config ───────────────────────────────────────────────────────────────────
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SMTP_USER;

// Gmail requires the "from" address to exactly match the authenticated SMTP_USER.
export const FROM_ADDRESS = SMTP_USER;
export const FROM_NAME = "LemmeWear";

// ─── Transporter ─────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // Improve deliverability
  pool: true,
  maxConnections: 3,
  rateDelta: 1000,
  rateLimit: 5,
});

// ─── Send helper ─────────────────────────────────────────────────────────────
export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string; // plain-text fallback — required to avoid spam
}) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[Email] SMTP_USER or SMTP_PASS not set — skipping email to:", to);
    return;
  }

  const recipient = Array.isArray(to) ? to.join(", ") : to;
  console.log(`[Email] Sending "${subject}" → ${recipient}`);

  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    replyTo: `"${FROM_NAME} Support" <${FROM_ADDRESS}>`,
    to: recipient,
    subject,
    // Both parts — spam filters heavily penalise HTML-only emails
    text,
    html,
    headers: {
      // Signals this is a transactional email, not bulk marketing
      "X-Entity-Ref-ID": `lemmewear-order-${Date.now()}`,
      "X-Mailer": "LemmeWear Mailer",
      Precedence: "bulk",
    },
  });

  console.log(`[Email] Sent OK — messageId: ${info.messageId} → ${recipient}`);
}
