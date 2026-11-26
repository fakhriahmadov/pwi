import { Resend } from "resend";
import nodemailer from "nodemailer";
import { site } from "@/content/site";

type Mail = { to: string; subject: string; html: string; attachments?: { filename: string; content: Buffer }[]; headers?: Record<string, string> };

/**
 * Sends the site's emails. Preferred: the institute's own Google Workspace mailbox over SMTP
 * (SMTP_USER = the mailbox, SMTP_PASS = a Google app password) — no extra service or DNS records needed.
 * Resend still works if RESEND_API_KEY is set instead. With neither, it only logs, so local development works.
 */
let smtp: ReturnType<typeof nodemailer.createTransport> | null = null;
export async function sendMail(m: Mail) {
  const user = process.env.SMTP_USER, pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  if (user && pass) {
    smtp ??= nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port: Number(process.env.SMTP_PORT) || 465, secure: (Number(process.env.SMTP_PORT) || 465) === 465, auth: { user, pass } });
    try {
      await smtp.sendMail({
        from: process.env.EMAIL_FROM || `${site.name} <${user}>`,
        to: m.to, subject: m.subject, html: m.html, headers: m.headers,
        attachments: m.attachments?.map((a) => ({ filename: a.filename, content: a.content })),
      });
    } catch (e) {
      console.error("[email] send failed", e instanceof Error ? e.message : e);
    }
    return;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dev] to=${m.to} subject="${m.subject}"`);
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || `${site.name} <${site.email}>`,
    to: m.to,
    subject: m.subject,
    html: m.html,
    attachments: m.attachments,
    headers: m.headers,
  });
  if (error) console.error("[email] send failed", error);
}

export const inbox = () => process.env.CONTACT_INBOX || site.email;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain branded email wrapper. */
export function layout(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#F6F2EA;font-family:Helvetica,Arial,sans-serif;color:#0A0A0A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF">
<tr><td style="background:#0A0A0A;color:#FFFFFF;padding:20px 28px;font-size:20px;font-weight:bold">Private<span style="color:#E5484A">.</span> Wealth Institute</td></tr>
<tr><td style="padding:32px 28px;font-size:15px;line-height:1.6"><h1 style="margin:0 0 16px;font-size:26px;line-height:1.15">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid #E3DCCF;font-size:12px;color:#5E5A54">${esc(site.name)} · ${esc(site.email)}</td></tr>
</table></td></tr></table></body></html>`;
}
export { esc };
