"use client";

import { useRef, useState } from "react";
import { Keyboard, Upload, Mic, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import Tag, { type Tone } from "@/components/ui/tag";
import { useRecorder } from "@/lib/useRecorder";
import { cn } from "@/lib/utils";

type Mode = "type" | "upload" | "speak";

const TABS: { mode: Mode; label: string; icon: typeof Keyboard }[] = [
  { mode: "type", label: "Type", icon: Keyboard },
  { mode: "upload", label: "Upload .md", icon: Upload },
  { mode: "speak", label: "Speak", icon: Mic },
];

export default function AddKnowledge({ onAdded }: { onAdded: () => void }) {
  const [mode, setMode] = useState<Mode>("type");
  const [source, setSource] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<null | "transcribe" | "add">(null);
  const [message, setMessage] = useState<{ tone: Tone; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorder = useRecorder();

  async function handleFile(file: File) {
    const content = await file.text();
    setText(content);
    if (!source) setSource(file.name);
    setMode("type");
    setMessage({ tone: "info", text: `Loaded ${file.name}. Review the text and add it.` });
  }

  async function handleRecord() {
    if (recorder.recording) {
      const audio = await recorder.stop();
      setBusy("transcribe");
      setMessage({ tone: "info", text: "Transcribing your voice note..." });
      try {
        const form = new FormData();
        form.append("audio", audio, "knowledge.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.text) {
          setMessage({ tone: "severe", text: data?.error ?? "Could not transcribe the audio." });
          return;
        }
        setText((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
        setMode("type");
        setMessage({ tone: "info", text: "Transcribed. Review the text and add it." });
      } catch {
        setMessage({ tone: "severe", text: "Network error while transcribing. Please try again." });
      } finally {
        setBusy(null);
      }
    } else {
      setMessage(null);
      await recorder.start();
    }
  }

  async function handleAdd() {
    const body = text.trim();
    if (!body) {
      setMessage({ tone: "severe", text: "Type, upload, or speak some knowledge first." });
      return;
    }
    setBusy("add");
    setMessage(null);
    try {
      const form = new FormData();
      form.append("text", body);
      if (source.trim()) form.append("source", source.trim());
      const res = await fetch("/api/knowledge", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setMessage({ tone: "severe", text: data?.error ?? "Could not add the knowledge." });
        return;
      }
      setMessage({ tone: "healthy", text: `Added ${data.count} chunk${data.count === 1 ? "" : "s"} from ${data.source}.` });
      setText("");
      setSource("");
      onAdded();
    } catch {
      setMessage({ tone: "severe", text: "Network error. Please check your connection and try again." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 rounded-sm border border-line-1 bg-inset p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.mode;
          return (
            <button
              key={tab.mode}
              onClick={() => setMode(tab.mode)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[12px] font-medium transition-colors",
                active ? "bg-surface-2 text-ink-1 shadow-[inset_0_0_0_1px_var(--color-line-1)]" : "text-ink-3 hover:text-ink-1",
              )}
            >
              <Icon className="h-[14px] w-[14px]" strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <input
        value={source}
        onChange={(event) => setSource(event.target.value)}
        placeholder="Source name (optional), e.g. pump-p101"
        className="w-full rounded-sm border border-line-1 bg-inset px-3 py-2 text-[12.5px] text-ink-1 placeholder:text-ink-4 focus:border-line-3 focus:outline-none"
      />

      {mode === "type" && (
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={6}
          placeholder="Paste or type knowledge in Markdown. Use ## headings to mark sections — each becomes its own retrievable chunk."
          className="w-full resize-y rounded-sm border border-line-1 bg-inset px-3 py-2 text-[12.5px] leading-relaxed text-ink-1 placeholder:text-ink-4 focus:border-line-3 focus:outline-none"
        />
      )}

      {mode === "upload" && (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 rounded-sm border border-dashed border-line-2 bg-inset px-4 py-6 text-center transition-colors hover:border-line-3"
          >
            <Upload className="h-4 w-4 text-ink-3" strokeWidth={2} />
            <span className="text-[12.5px] text-ink-2">Choose a Markdown or text file</span>
            <span className="text-[11px] text-ink-4">.md · .markdown · .txt</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
          {text && <p className="text-[11px] text-ink-3">{text.length} characters ready. Switch to Type to review.</p>}
        </div>
      )}

      {mode === "speak" && (
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRecord}
            disabled={busy === "transcribe"}
            className={cn(
              "flex items-center justify-center gap-2 rounded-sm border px-4 py-5 transition-colors disabled:opacity-50",
              recorder.recording ? "border-severe-line bg-severe-bg text-severe" : "border-line-2 bg-inset text-ink-2 hover:text-ink-1",
            )}
          >
            {recorder.recording ? <Square className="h-4 w-4" strokeWidth={2} /> : <Mic className="h-4 w-4" strokeWidth={2} />}
            <span className="text-[13px] font-medium">
              {busy === "transcribe" ? "Transcribing..." : recorder.recording ? "Recording, tap to stop" : "Tap to dictate knowledge"}
            </span>
            {recorder.recording && <span className="pulse-dot h-2 w-2 rounded-full bg-severe" />}
          </button>
          {recorder.error && <p className="text-[11px] text-severe">{recorder.error}</p>}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {message ? <Tag tone={message.tone} dot>{message.text}</Tag> : <span />}
        <Button size="sm" onClick={handleAdd} disabled={busy !== null} className="shrink-0">
          <Plus className="h-[14px] w-[14px]" strokeWidth={2.25} />
          {busy === "add" ? "Embedding..." : "Add to knowledge base"}
        </Button>
      </div>
    </div>
  );
}
