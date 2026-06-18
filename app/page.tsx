"use client";

import { useEffect, useState } from "react";
import { ClipboardList, HelpCircle, Terminal, RefreshCw } from "lucide-react";
import VoiceButton from "@/components/VoiceButton";
import WorkerTrace from "@/components/WorkerTrace";
import SyncBadge from "@/components/SyncBadge";
import Panel from "@/components/ui/panel";
import StatusPill from "@/components/ui/status-pill";
import { useOnline } from "@/lib/useOnline";
import { queueNote } from "@/lib/db";
import { syncPending } from "@/lib/sync";
import { speak } from "@/lib/speak";
import type { WorkOrderRow } from "@/lib/types";

type Busy = null | "note" | "ask" | "command";
type Phase = "idle" | "running" | "done" | "error";

const STEPS: Record<"note" | "ask" | "command", string[]> = {
  note: ["transcribe", "extract", "save"],
  ask: ["transcribe", "retrieve", "answer"],
  command: ["transcribe", "plan", "execute"],
};

export default function WorkerConsole() {
  const online = useOnline();
  const [busy, setBusy] = useState<Busy>(null);
  const [kind, setKind] = useState<"note" | "ask" | "command">("note");
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<WorkOrderRow | null>(null);
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [session, setSession] = useState("");

  useEffect(() => {
    setSession(Math.random().toString(16).slice(2, 10).toUpperCase());
  }, []);

  function reset() {
    setTranscript("");
    setAnswer("");
    setOrder(null);
    setStatus("");
    setElapsed(null);
    setPhase("idle");
  }

  async function handleNote(audio: Blob) {
    reset();
    setKind("note");
    if (!online) {
      await queueNote(audio);
      setStatus("Offline — note saved and queued for sync.");
      speak("You are offline. The note has been saved and will sync when you reconnect.");
      return;
    }
    setBusy("note");
    setPhase("running");
    try {
      const form = new FormData();
      form.append("audio", audio, "note.webm");
      const res = await fetch("/api/process", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        setPhase("error");
        setStatus(data?.error ?? "Could not process the note.");
        speak("Sorry, something went wrong.");
        return;
      }
      setTranscript(data.transcript);
      setOrder(data.workOrder);
      setPhase("done");
      setStatus("Work order created.");
      speak(`Work order created for ${data.workOrder.equipment_code || "the equipment"}, severity ${data.workOrder.severity}.`);
    } finally {
      setBusy(null);
    }
  }

  async function handleAsk(audio: Blob) {
    reset();
    setKind("ask");
    setBusy("ask");
    setPhase("running");
    const startedAt = performance.now();
    try {
      const form = new FormData();
      form.append("audio", audio, "question.webm");
      const res = await fetch("/api/ask", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      setElapsed(Math.round(performance.now() - startedAt));
      if (!res.ok || !data || data.error) {
        setPhase("error");
        setStatus(data?.error ?? "Could not answer the question.");
        speak("Sorry, something went wrong.");
        return;
      }
      setTranscript(data.question);
      setAnswer(data.answer);
      setPhase("done");
      speak(data.answer);
    } finally {
      setBusy(null);
    }
  }

  async function handleCommand(audio: Blob) {
    reset();
    setKind("command");
    setBusy("command");
    setPhase("running");
    try {
      const form = new FormData();
      form.append("audio", audio, "command.webm");
      const res = await fetch("/api/agent", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        setPhase("error");
        setStatus(data?.error ?? "Could not run the command.");
        speak("Sorry, something went wrong.");
        return;
      }
      setTranscript(data.command);
      setAnswer(data.reply);
      setPhase("done");
      speak(data.reply);
    } finally {
      setBusy(null);
    }
  }

  async function handleSync() {
    const count = await syncPending();
    setStatus(count > 0 ? `Synced ${count} queued note(s).` : "Nothing to sync.");
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-line-1 bg-canvas/90 px-4 backdrop-blur md:px-5">
        <span className="text-[13.5px] font-medium tracking-[-0.005em] text-ink-1">Field worker</span>
        <span className="text-ink-4">/</span>
        <span className="text-[12px] font-[450] text-ink-3">Voice console</span>
        <div className="flex-1" />
        <SyncBadge />
        <StatusPill tone={online ? "ok" : "idle"} label={online ? "online" : "offline"} live={online} />
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 py-5 md:px-6">
        <div className="mb-4 max-w-xl">
          <p className="text-[12.5px] leading-relaxed text-ink-2">
            Speak to log an inspection, ask the manuals, or command a work order. Offline notes queue
            locally and sync on reconnect.
          </p>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <Panel
              meta="Capture"
              headerRight={<span className="text-[11px] text-ink-4">tap to talk</span>}
              bodyClassName="flex flex-col gap-1.5 p-2"
            >
              <VoiceButton kind="note" icon={<ClipboardList size={14} strokeWidth={1.75} />} label="Log inspection" hint="Found a fault, save an order" onRecorded={handleNote} disabled={busy !== null} />
              <VoiceButton kind="ask" icon={<HelpCircle size={14} strokeWidth={1.75} />} label="Ask a question" hint="Specs and procedures" onRecorded={handleAsk} disabled={busy !== null} />
              <VoiceButton kind="cmd" icon={<Terminal size={14} strokeWidth={1.75} />} label="Voice command" hint="Create, update, close" onRecorded={handleCommand} disabled={busy !== null} />
            </Panel>
            <button
              onClick={handleSync}
              className="inline-flex items-center gap-1.5 self-start pl-1 text-[11.5px] text-ink-3 transition-colors hover:text-ink-1"
            >
              <RefreshCw size={12} strokeWidth={2} />
              Sync queued notes
            </button>
          </div>

          <WorkerTrace
            session={session}
            kind={kind}
            phase={phase}
            steps={STEPS[kind]}
            transcript={transcript}
            answer={answer}
            order={order}
            status={status}
            elapsed={elapsed}
          />
        </div>
      </div>
    </div>
  );
}
