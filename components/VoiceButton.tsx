"use client";

import { useRecorder } from "@/lib/useRecorder";
import { cn } from "@/lib/utils";
import Tag from "@/components/ui/tag";

interface VoiceButtonProps {
  label: string;
  hint: string;
  kind: string;
  icon: React.ReactNode;
  onRecorded: (audio: Blob) => void;
  disabled?: boolean;
}

export default function VoiceButton({ label, hint, kind, icon, onRecorded, disabled }: VoiceButtonProps) {
  const { recording, error, start, stop } = useRecorder();

  const toggle = async () => {
    if (recording) {
      const audio = await stop();
      onRecorded(audio);
    } else {
      await start();
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-sm border px-2.5 py-2 text-left transition-colors disabled:opacity-40",
        recording
          ? "border-severe-line bg-severe-bg"
          : "border-line-1 bg-surface-1 hover:border-line-2 hover:bg-surface-2",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border transition-colors",
          recording
            ? "border-severe-line bg-severe-bg text-severe"
            : "border-line-2 bg-surface-2 text-ink-2 group-hover:text-ink-1",
        )}
      >
        {recording ? <span className="pulse-dot h-2 w-2 rounded-full bg-severe" /> : icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[13px] font-medium text-ink-1">{label}</span>
        <span className="mt-px truncate text-[11px] leading-tight text-ink-3">
          {error ? <span className="text-severe">{error}</span> : recording ? "Recording, tap to stop" : hint}
        </span>
      </span>
      <Tag tone={recording ? "severe" : "neutral"} className="ml-auto">
        {kind}
      </Tag>
    </button>
  );
}
