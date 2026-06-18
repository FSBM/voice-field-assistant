"use client";

import { useEffect, useState } from "react";
import DashboardOrderCard from "@/components/DashboardOrderCard";
import Panel from "@/components/ui/panel";
import MetaLabel from "@/components/ui/meta-label";
import StatusPill from "@/components/ui/status-pill";
import StatCard from "@/components/ui/stat-card";
import StatusIcon from "@/components/ui/status-icon";
import Tag, { type Tone } from "@/components/ui/tag";
import Waterfall, { type WaterfallRow } from "@/components/ui/waterfall";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { WorkOrderRow, ActivityRow } from "@/lib/types";

type Mode = "connecting" | "live" | "polling";

const sevTone: Record<string, Tone> = { low: "healthy", medium: "recovery", high: "severe", critical: "severe" };

const kindLabel: Record<string, { label: string; tone: Tone }> = {
  note: { label: "Inspection", tone: "info" },
  query: { label: "Question", tone: "healthy" },
  work_order: { label: "Command", tone: "recovery" },
};

function clockTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<WorkOrderRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [mode, setMode] = useState<Mode>("connecting");

  useEffect(() => {
    let active = true;
    let removeChannel: (() => void) | undefined;

    async function load() {
      try {
        const [woRes, actRes] = await Promise.all([
          fetch("/api/work-orders", { cache: "no-store" }),
          fetch("/api/activity", { cache: "no-store" }),
        ]);
        const wo = await woRes.json().catch(() => null);
        const act = await actRes.json().catch(() => null);
        if (active && wo?.orders) setOrders(wo.orders as WorkOrderRow[]);
        if (active && act?.activity) setActivity(act.activity as ActivityRow[]);
      } catch {
        return;
      }
    }

    load();
    const interval = setInterval(load, 15000);
    if (active) setMode("polling");

    try {
      const supabase = getSupabaseBrowser();
      const channel = supabase
        .channel("work-orders")
        .on("broadcast", { event: "change" }, () => {
          if (active) setMode("live");
          load();
        })
        .subscribe((status) => {
          if (active && status === "SUBSCRIBED") setMode("live");
          else if (active && (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED")) setMode("polling");
        });
      removeChannel = () => supabase.removeChannel(channel);
    } catch {
      removeChannel = undefined;
    }

    return () => {
      active = false;
      clearInterval(interval);
      if (removeChannel) removeChannel();
    };
  }, []);

  const openOrders = orders.filter((order) => order.status !== "closed");
  const closedOrders = orders.filter((order) => order.status === "closed");
  const criticalOpen = orders.filter((order) => order.severity === "critical" && order.status !== "closed");
  const statusLabel = mode === "live" ? "live" : mode === "polling" ? "polling" : "connecting";

  const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  orders.forEach((order) => {
    if (order.severity in counts) counts[order.severity] += 1;
  });
  const waterfallRows: WaterfallRow[] = [
    { label: "critical", value: counts.critical, tone: "severe" },
    { label: "high", value: counts.high, tone: "severe" },
    { label: "medium", value: counts.medium, tone: "recovery" },
    { label: "low", value: counts.low, tone: "healthy" },
  ];

  const recent = [...orders]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 6);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-line-1 bg-canvas/90 px-4 backdrop-blur md:px-5">
        <span className="text-[13.5px] font-medium tracking-[-0.005em] text-ink-1">Supervisor</span>
        <span className="text-ink-4">/</span>
        <span className="text-[12px] font-[450] text-ink-3">Field operations</span>
        <div className="flex-1" />
        <StatusPill
          tone={mode === "live" ? "ok" : mode === "polling" ? "warn" : "idle"}
          label={statusLabel}
          live={mode === "live"}
        />
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 md:px-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line-1 bg-line-1 lg:grid-cols-4">
          <StatCard className="bg-surface-1" label="Work orders" value={orders.length} suffix="total" />
          <StatCard className="bg-surface-1" label="Open" value={openOrders.length} accent={openOrders.length ? "text-recovery" : "text-ink-1"} suffix="active" />
          <StatCard className="bg-surface-1" label="Critical" value={criticalOpen.length} accent={criticalOpen.length ? "text-severe" : "text-ink-1"} live={criticalOpen.length > 0} />
          <StatCard className="bg-surface-1" label="Resolved" value={closedOrders.length} accent="text-healthy" suffix="closed" />
        </div>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <Panel
            meta="Severity distribution"
            headerRight={<span className="text-[11px] tabular-nums text-ink-4">{orders.length} orders</span>}
          >
            <Waterfall rows={waterfallRows} />
          </Panel>

          <Panel
            meta="Recent activity"
            headerRight={
              <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
                <span className={`h-[5px] w-[5px] rounded-full ${mode === "live" ? "bg-healthy pulse-dot" : "bg-ink-4"}`} />
                {statusLabel}
              </span>
            }
            bodyClassName="p-0"
          >
            {recent.length === 0 ? (
              <p className="px-4 py-5 text-[12px] text-ink-3">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-line-1">
                {recent.map((order) => (
                  <li key={order.id} className="flex items-center gap-[11px] px-4 py-3">
                    <StatusIcon tone={sevTone[order.severity] ?? "neutral"} size={24} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12.5px] font-medium text-ink-1">{order.equipment_code || "Unspecified"}</span>
                        <Tag tone={sevTone[order.severity] ?? "neutral"}>{order.severity}</Tag>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-ink-3">
                        {order.fault_code ? `Fault ${order.fault_code} · ` : ""}
                        {order.location || order.inspection_result || "logged"}
                      </div>
                    </div>
                    <span className="shrink-0 text-[10.5px] tabular-nums text-ink-4">{clockTime(order.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </section>

        <Panel meta="Voice transcripts" sub="What field workers said, transcribed" bodyClassName="p-0">
          {activity.length === 0 ? (
            <p className="px-4 py-5 text-[12px] text-ink-3">No voice notes yet.</p>
          ) : (
            <ul className="divide-y divide-line-1">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <Tag tone={kindLabel[item.kind]?.tone ?? "neutral"}>{kindLabel[item.kind]?.label ?? item.kind}</Tag>
                  <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-ink-2">{item.transcript || "—"}</p>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-ink-4">{clockTime(item.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {criticalOpen.length > 0 && (
          <Panel
            className="border-severe-line bg-severe-bg"
            meta={<span className="text-severe">Exceptions · {criticalOpen.length}</span>}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-severe-line">
              {criticalOpen.map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-4 py-2.5">
                  <StatusIcon tone="severe" size={20} />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
                    <span className="font-medium text-severe">{order.equipment_code || "equipment"}</span>
                    <span className="text-ink-4">·</span>
                    <span className="text-ink-2">critical fault {order.fault_code || "reported"}</span>
                    <span className="text-ink-4">·</span>
                    <span className="text-ink-3">{order.location || "unknown location"}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <MetaLabel label="Work orders" />
            <span className="text-[11px] tabular-nums text-ink-4">{orders.length} total</span>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-2 px-6 py-8 text-center">
              <p className="text-[13px] text-ink-2">No work orders yet.</p>
              <p className="mt-1 text-[11px] text-ink-4">Create one from the worker console.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <DashboardOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
