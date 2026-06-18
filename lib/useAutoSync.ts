"use client";

import { useEffect } from "react";
import { syncPending } from "@/lib/sync";

export function useAutoSync(onSynced?: (count: number) => void) {
  useEffect(() => {
    let running = false;

    const run = async () => {
      if (running || typeof navigator === "undefined" || !navigator.onLine) return;
      running = true;
      try {
        const count = await syncPending();
        if (count > 0) onSynced?.(count);
      } catch {
        return;
      } finally {
        running = false;
      }
    };

    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, [onSynced]);
}
