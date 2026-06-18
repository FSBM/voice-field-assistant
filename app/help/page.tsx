import Link from "next/link";
import { Mic, HelpCircle, Terminal, Database } from "lucide-react";
import Panel from "@/components/ui/panel";
import MetaLabel from "@/components/ui/meta-label";
import Tag, { type Tone } from "@/components/ui/tag";

const STEPS = [
  { icon: Mic, title: "Log an inspection", body: "On the Field worker page, tap Log inspection and describe what you found. The note is transcribed, turned into a structured work order, and saved." },
  { icon: HelpCircle, title: "Ask a question", body: "Tap Ask a question and ask about specs, fault codes, or procedures. The answer is retrieved from the knowledge base and read aloud." },
  { icon: Terminal, title: "Command a work order", body: "Tap Voice command to create, update, or close a work order by voice. The agent finds the order by its equipment or fault code." },
  { icon: Database, title: "Grow the knowledge", body: "Open Knowledge to add manuals by typing, uploading a Markdown file, or speaking. New documents are chunked and embedded instantly." },
];

const PHRASES: { kind: string; tone: Tone; items: string[] }[] = [
  {
    kind: "Inspection",
    tone: "info",
    items: [
      "AHU-12 is throwing fault F-203, evaporator pressure is low and I suspect a refrigerant leak, this is high severity.",
      "CH-02 oil pressure dropped to 130 kilopascals, fault F-301, this is critical, I stopped the compressor.",
      "Replaced the panel filters on AHU-12, part P slash N 45-90C, filter pressure drop back to normal.",
    ],
  },
  {
    kind: "Question",
    tone: "healthy",
    items: [
      "What is the torque spec for the AHU-12 fan bearing housing bolts?",
      "What does fault F-117 mean and how do I fix it?",
      "What is the normal oil pressure range for CH-02?",
    ],
  },
  {
    kind: "Command",
    tone: "recovery",
    items: [
      "Create a work order for CH-02, fault F-301, low oil pressure, critical.",
      "Update the work order for AHU-12, I re-tensioned the belt.",
      "Close the work order for fault F-117.",
    ],
  },
];

const TIPS = [
  "Use a Chromium browser (Chrome or Edge) for the best microphone and speech support.",
  "Allow the microphone when the browser asks. If you blocked it, re-enable it in the site settings and reload.",
  "Speak naturally in one breath. Mention the equipment code, what you observed, and how urgent it is.",
  "Offline notes are queued on your device and sync automatically the moment you reconnect.",
];

const FAQ = [
  { q: "Where do the answers come from?", a: "From the knowledge base on the Knowledge page. Each document is split into chunks, embedded, and the closest chunks are passed to the model to write a grounded answer." },
  { q: "What happens when I am offline?", a: "Inspection notes are saved in the browser and a pending badge appears. When the connection returns, they upload and process on their own." },
  { q: "What if an AI service is rate-limited?", a: "The app retries on a fallback model, and if no model is reachable it still extracts with keyword rules and answers with the closest passage, so a demo never dead-ends." },
  { q: "Can I add my own manuals?", a: "Yes. On the Knowledge page you can type, upload a Markdown file, or speak new knowledge, and it becomes searchable straight away." },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-line-1 bg-canvas/90 px-4 backdrop-blur md:px-5">
        <span className="text-[13.5px] font-medium tracking-[-0.005em] text-ink-1">Help</span>
        <span className="text-ink-4">/</span>
        <span className="text-[12px] font-[450] text-ink-3">Getting started</span>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5 md:px-6">
        <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-2">
          A hands-free assistant for field technicians. Everything below can be done by voice. New
          here? Start with the four steps, then try the example phrases on the{" "}
          <Link href="/" className="text-ink-1 underline decoration-line-3 underline-offset-2">Field worker</Link> page.
        </p>

        <Panel meta="Getting started" sub="Four things you can do">
          <ol className="flex flex-col gap-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-line-2 bg-surface-2 text-ink-2">
                    <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
                  </span>
                  <div>
                    <div className="text-[12.5px] font-medium text-ink-1">{index + 1}. {step.title}</div>
                    <div className="mt-0.5 text-[12px] leading-relaxed text-ink-3">{step.body}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Panel>

        <Panel meta="Example phrases" sub="Say these to see each capability">
          <div className="grid gap-4 sm:grid-cols-3">
            {PHRASES.map((group) => (
              <div key={group.kind} className="flex flex-col gap-2">
                <Tag tone={group.tone}>{group.kind}</Tag>
                <ul className="flex flex-col gap-2">
                  {group.items.map((phrase) => (
                    <li key={phrase} className="rounded-sm border border-line-1 bg-inset px-3 py-2 text-[11.5px] leading-relaxed text-ink-2">
                      “{phrase}”
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel meta="Tips for a smooth demo">
            <ul className="flex flex-col gap-2">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-[12px] leading-relaxed text-ink-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-4" />
                  {tip}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel meta="FAQ">
            <dl className="flex flex-col divide-y divide-line-1">
              {FAQ.map((item) => (
                <div key={item.q} className="py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-[12.5px] font-medium text-ink-1">{item.q}</dt>
                  <dd className="mt-1 text-[12px] leading-relaxed text-ink-3">{item.a}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        <div className="flex items-center justify-between">
          <MetaLabel label="Demo reference" />
          <Link href="/sample-data" className="text-[12px] text-ink-3 underline decoration-line-3 underline-offset-2 hover:text-ink-1">
            Open the sample data the knowledge base ships with
          </Link>
        </div>
      </div>
    </div>
  );
}
