"use client";

import { useEffect, useState } from "react";
import { Mic, HelpCircle, Terminal, Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fv-onboarded-v1";

const STEPS = [
  { icon: Mic, title: "Log an inspection", body: "Tap Log inspection and speak what you found. The note becomes a structured work order automatically." },
  { icon: HelpCircle, title: "Ask the manuals", body: "Tap Ask a question for a spoken answer grounded in the knowledge base." },
  { icon: Terminal, title: "Command work orders", body: "Tap Voice command to create, update, or close orders by voice." },
  { icon: Database, title: "Grow the knowledge", body: "Open Knowledge to add manuals by typing, uploading, or speaking — and watch them get embedded." },
];

const STARTERS = [
  "AHU-12 is throwing fault F-203, the supply fan bearing is overheating, this is critical.",
  "What is the torque spec for the AHU-12 fan bolts?",
];

export default function Onboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      return;
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      return;
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4 backdrop-blur-sm" onClick={dismiss}>
      <div
        className="w-full max-w-md overflow-hidden border border-line-2 bg-canvas shadow-2xl"
        style={{ borderRadius: "var(--radius-xl)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line-1 px-5 py-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-paper text-bg">
            <Mic size={14} strokeWidth={2.25} />
          </span>
          <div className="flex-1">
            <div className="text-[13.5px] font-medium text-ink-1">Welcome to Field ops</div>
            <div className="text-[11px] text-ink-3">Everything works hands-free, by voice.</div>
          </div>
          <button onClick={dismiss} className="text-ink-4 transition-colors hover:text-ink-1">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-line-2 bg-surface-2 text-ink-2">
                  <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[12.5px] font-medium text-ink-1">{step.title}</div>
                  <div className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">{step.body}</div>
                </div>
              </div>
            );
          })}

          <div className="mt-1 rounded-sm border border-line-1 bg-inset p-3">
            <div className="mb-1.5 text-[11px] font-medium tracking-[0.04em] text-ink-3">Try saying</div>
            <ul className="flex flex-col gap-1.5">
              {STARTERS.map((phrase) => (
                <li key={phrase} className="text-[11.5px] leading-relaxed text-ink-2">“{phrase}”</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end border-t border-line-1 px-5 py-3">
          <Button size="sm" onClick={dismiss}>Start working</Button>
        </div>
      </div>
    </div>
  );
}
