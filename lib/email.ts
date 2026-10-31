import { Resend } from "resend";
import { site } from "@/content/site";

type Mail = { to: string; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] };

/** Sends with Resend. Without RESEND_API_KEY it logs instead, so local development works. */
export async function sendMail(m: Mail) {
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
