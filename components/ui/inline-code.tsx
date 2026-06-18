import { cn } from "@/lib/utils";

export default function InlineCode({
  children,
  tone = "default",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "ok" | "err";
  dot?: boolean;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "inline-flex items-center gap-[5px] rounded-[4px] border px-[6px] py-px text-[12px] font-medium tracking-[-0.01em]",
        tone === "ok" && "border-healthy-line bg-healthy-bg text-healthy",
        tone === "err" && "border-severe-line bg-severe-bg text-severe",
        tone === "default" && "border-chip-line bg-chip-bg text-[color:var(--color-chip-ink)]",
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-[5px] w-[5px] shrink-0 rounded-full",
            tone === "ok" && "bg-healthy",
            tone === "err" && "bg-severe",
            tone === "default" && "bg-healthy",
          )}
        />
      )}
      {children}
    </code>
  );
}
