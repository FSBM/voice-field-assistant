import { pendingNotes, markSynced } from "@/lib/db";

export async function isOnline(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const res = await fetch("/api/health", { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncPending(): Promise<number> {
  const notes = await pendingNotes();
  let synced = 0;
  for (const note of notes) {
    const form = new FormData();
    form.append("audio", note.audio, "note.webm");
    const res = await fetch("/api/process", { method: "POST", body: form });
    if (res.ok) {
      await markSynced(note.id);
      synced += 1;
    }
  }
  return synced;
}
