"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser, logActivity } from "@/lib/accounts";
import { COUNTRIES } from "./countries";

const back = (msg: string): never => redirect(`/investors?msg=${encodeURIComponent(msg)}`);

export async function confirmInvestor(fd: FormData) {
  const me = await currentUser();
  if (!me) redirect("/signin?next=/investors");
  const country = String(fd.get("country") ?? "");
  if (!COUNTRIES.some(([c]) => c === country) || !country) back("Please choose your country of residence.");
  if (country === "US") back("This material is not available to residents of the United States.");
  if (fd.get("pro") !== "on" || fd.get("terms") !== "on") back("Please confirm both statements to continue.");
  await db.member.update({ where: { id: me!.id }, data: { investor: { confirmed: new Date().toISOString().slice(0, 10), country, professional: true } } });
  await logActivity(me!.email, `Confirmed investor status (${COUNTRIES.find(([c]) => c === country)![1]}) and opened the investor area`);
  redirect("/investors");
}

export async function withdrawInvestor() {
  const me = await currentUser();
  if (!me) redirect("/signin?next=/investors");
  await db.member.update({ where: { id: me!.id }, data: { investor: undefined } });
  await db.$executeRaw`UPDATE "Member" SET investor = NULL WHERE id = ${me!.id}`;
  await logActivity(me!.email, "Withdrew investor confirmation");
  redirect("/investors");
}
