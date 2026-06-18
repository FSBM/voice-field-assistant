import { listWorkOrders } from "@/lib/work-orders";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const orders = await listWorkOrders();
    return Response.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load work orders.";
    return Response.json({ error: message, orders: [] }, { status: 500 });
  }
}
