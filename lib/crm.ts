/** Optional newsletter sync to Brevo. Does nothing unless BREVO_API_KEY is set. */
export async function syncSubscriber(email: string) {
  const key = process.env.BREVO_API_KEY;
  if (!key) return;
  const listId = Number(process.env.BREVO_LIST_ID);
  try {
    await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ email, updateEnabled: true, ...(listId ? { listIds: [listId] } : {}) }),
    });
  } catch (e) {
    console.error("[crm] Brevo sync failed", e);
  }
}
