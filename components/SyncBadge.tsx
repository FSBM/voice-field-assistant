"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import Tag from "@/components/ui/tag";

export default function SyncBadge() {
  const count = useLiveQuery(() => db.notes.where("status").equals("pending").count(), [], 0);
  if (!count) return null;
  return (
    <Tag tone="recovery" dot>
      {count} pending
    </Tag>
  );
}
