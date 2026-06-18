"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Gauge, Database, BookText, LifeBuoy, Boxes, GitBranch, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoSync } from "@/lib/useAutoSync";
import Onboarding from "@/components/Onboarding";
import ModeBanner from "@/components/ModeBanner";

type NavItem = { href: string; label: string; icon: typeof Mic; dot?: boolean };

const PRIMARY: NavItem[] = [
  { href: "/", label: "Field worker", icon: Mic },
  { href: "/dashboard", label: "Supervisor", icon: Gauge, dot: true },
  { href: "/knowledge", label: "Knowledge", icon: Database },
];

const WORKSPACE: NavItem[] = [
  { href: "/docs", label: "Documentation", icon: BookText },
  { href: "/help", label: "Help", icon: LifeBuoy },
  { href: "/sample-data", label: "Sample data", icon: Boxes },
];

function Brand() {
  return (
    <div className="flex items-center gap-[9px] px-[7px] py-[5px]">
      <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[8px] bg-paper text-bg">
        <Mic size={14} strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-medium leading-[1.1] tracking-[-0.005em] text-ink-1">Field ops</div>
        <div className="mt-px truncate text-[10px] leading-[1.2] text-ink-3">voice assistant</div>
      </div>
    </div>
  );
}

function NavRow({ href, label, icon: Icon, dot, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-px flex items-center gap-[10px] rounded-sm px-[9px] py-[6px] text-[13.5px] font-[450] tracking-[-0.005em] transition-colors",
        active
          ? "bg-surface-2 text-ink-1 shadow-[inset_0_0_0_1px_var(--color-line-1)]"
          : "text-ink-2 hover:bg-surface-1 hover:text-ink-1",
      )}
    >
      <Icon className={cn("h-[15px] w-[15px] shrink-0", active ? "opacity-100" : "opacity-[0.78]")} strokeWidth={2} />
      <span className="flex-1 truncate">{label}</span>
      {dot && <span className="h-[6px] w-[6px] rounded-full bg-healthy shadow-[0_0_0_3px_rgba(110,214,139,0.10)]" />}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  useAutoSync();

  const mobileNav = [...PRIMARY, ...WORKSPACE];

  return (
    <div className="min-h-screen bg-bg md:grid md:h-screen md:grid-cols-[228px_1fr] md:overflow-hidden md:p-[10px]">
      <aside className="hidden flex-col px-[14px] pb-[10px] pl-[14px] pr-[12px] pt-[8px] md:flex">
        <div className="mb-3.5 pt-1">
          <Brand />
        </div>

        <nav className="flex flex-col">
          {PRIMARY.map((item) => (
            <NavRow key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </nav>

        <div className="mt-[18px]">
          <div className="px-2 pb-2 pt-[6px] text-[10.5px] font-medium tracking-[0.06em] text-ink-4">Workspace</div>
          <nav className="flex flex-col">
            {WORKSPACE.map((item) => (
              <NavRow key={item.href} {...item} active={isActive(item.href)} />
            ))}
          </nav>
          <a
            href="https://github.com/FSBM/voice-field-assistant"
            target="_blank"
            rel="noreferrer"
            className="group mt-px flex items-center gap-[10px] rounded-sm px-[9px] py-[6px] text-[13.5px] font-[450] tracking-[-0.005em] text-ink-2 transition-colors hover:bg-surface-1 hover:text-ink-1"
          >
            <GitBranch className="h-[15px] w-[15px] shrink-0 opacity-[0.78]" strokeWidth={2} />
            <span className="flex-1 truncate">Repository</span>
            <ArrowUpRight className="h-3 w-3 text-ink-4 group-hover:text-ink-3" />
          </a>
        </div>

        <div className="mt-auto border-t border-line-1 pt-3">
          <div className="flex items-center gap-[9px] px-[7px] py-[5px]">
            <span
              className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-medium"
              style={{ background: "linear-gradient(135deg, #c1f0d2 0%, #6ed68b 100%)", color: "#062014" }}
            >
              26
              <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full bg-healthy" style={{ border: "2px solid var(--color-bg)" }} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium leading-[1.1] text-ink-1">Group 26</div>
              <div className="mt-px truncate text-[10.5px] leading-[1.2] text-ink-3">voice assistant</div>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line-1 bg-bg/90 px-3 py-2 backdrop-blur md:hidden">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-paper text-bg">
          <Mic size={14} strokeWidth={2.25} />
        </span>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  active ? "bg-surface-2 text-ink-1" : "text-ink-3 hover:text-ink-1",
                )}
              >
                <Icon className="h-[14px] w-[14px]" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main
        className="relative flex min-w-0 flex-col border-line-1 bg-canvas md:h-full md:overflow-hidden md:border"
        style={{
          borderRadius: "var(--radius-2xl)",
          boxShadow:
            "inset 0 1px 0 color-mix(in srgb, var(--color-ink-1) 4%, transparent), 0 1px 0 color-mix(in srgb, var(--color-bg) 60%, transparent)",
        }}
      >
        <ModeBanner />
        <div key={pathname} className="view-in flex min-h-0 flex-1 flex-col md:overflow-y-auto">
          {children}
        </div>
      </main>

      <Onboarding />
    </div>
  );
}
