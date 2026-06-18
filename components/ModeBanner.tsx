"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ModeBanner() {
  const [notice, setNotice] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => (res.ok ? res.json() : null))
      .then((health) => {
        if (!health) return;
        if (health.llm === "none") {
          setNotice(
            "Demo mode: no AI key is set. Extraction falls back to keyword matching and answers return the closest passage. Add GROQ_API_KEY for full AI.",
          );
        } else if (!health.stt) {
          setNotice("Voice capture is off (no Groq key). You can still type notes and questions.");
        }
      })
      .catch(() => undefined);
  }, []);

  if (!notice || dismissed) return null;

  return (
    <div className="flex items-center gap-2 border-b border-recovery-line bg-recovery-bg px-4 py-2 text-[11.5px] text-recovery md:px-5">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="flex-1">{notice}</span>
      <button onClick={() => setDismissed(true)} className="shrink-0 opacity-70 transition-opacity hover:opacity-100">
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
