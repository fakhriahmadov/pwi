import { currentUser, logActivity } from "@/lib/accounts";
import { sendMail, layout, esc, inbox } from "@/lib/email";
import { ok, fail } from "@/lib/http";

/** A presentation request from inside the simulator: logged on the member's account and sent to the team. */
export async function POST(req: Request) {
  const me = await currentUser().catch(() => null);
  if (!me || !(me.investor as { confirmed?: string } | null)?.confirmed) return fail("Please sign in.", 401);
  const d = (await req.json().catch(() => ({}))) as { firstName?: string; lastName?: string; email?: string; company?: string; updates?: boolean; scenario?: { amount?: number; netReturn?: number } };
  const amount = d.scenario?.amount ? `€${Math.round(d.scenario.amount).toLocaleString("en-GB")}` : "base case";
  await logActivity(me.email, `Requested the European Lifestyle Fund 1 presentation (${amount} scenario)`);
  await sendMail({ to: inbox(), subject: `Presentation request — European Lifestyle Fund 1`, html: layout("New presentation request.", `<p><b>${esc(`${d.firstName ?? ""} ${d.lastName ?? ""}`)}</b> · ${esc(d.email ?? me.email)}${d.company ? ` · ${esc(d.company)}` : ""}</p><p>Account: ${esc(me.email)} · Scenario: ${esc(amount)}${d.scenario?.netReturn != null ? ` · ${esc(String(d.scenario.netReturn))}% net a year` : ""} · Updates: ${d.updates ? "yes" : "no"}</p>`) });
  return ok();
}
