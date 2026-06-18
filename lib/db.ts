import { Dexie, type EntityTable } from "dexie";

export interface QueuedNote {
  id: number;
  audio: Blob;
  created_at: number;
  status: "pending" | "synced";
}

const db = new Dexie("FieldVoiceDB") as Dexie & {
  notes: EntityTable<QueuedNote, "id">;
};

db.version(1).stores({
  notes: "++id, status, created_at",
});

export { db };

export async function queueNote(audio: Blob): Promise<number> {
  return db.notes.add({ audio, created_at: Date.now(), status: "pending" });
}

export async function pendingNotes(): Promise<QueuedNote[]> {
  return db.notes.where("status").equals("pending").toArray();
}

export async function markSynced(id: number): Promise<void> {
  await db.notes.update(id, { status: "synced" });
}
