export const WORK_ORDERS_CHANNEL = "work-orders";

export async function broadcastWorkOrdersChanged(payload: Record<string, unknown> = {}): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ topic: WORK_ORDERS_CHANNEL, event: "change", payload }],
      }),
    });
  } catch {
    return;
  }
}
