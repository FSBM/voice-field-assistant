import Link from "next/link";
import Panel from "@/components/ui/panel";
import MetaLabel from "@/components/ui/meta-label";
import Tag, { type Tone } from "@/components/ui/tag";
import InlineCode from "@/components/ui/inline-code";

const EQUIPMENT = [
  {
    code: "AHU-12",
    name: "Air Handling Unit",
    detail: "Carrier 39M · roof-mounted · Plant Room B · serves floors 3 to 5",
    specs: [
      "Supply airflow: 8,000 CFM nominal",
      "Supply fan motor: 7.5 kW, 400 V three-phase, belt driven",
      "Filter bank: MERV 13, replaced every 90 days",
      "Fan bearing housing bolts: 30 newton metres",
      "Supply air temperature: 13 to 15 °C in cooling",
    ],
  },
  {
    code: "CH-02",
    name: "Water-Cooled Chiller",
    detail: "York YK · single-stage centrifugal · basement plant · lead chiller",
    specs: [
      "Cooling capacity: 500 tons nominal",
      "Refrigerant: R-134a, charge 180 kg",
      "Oil pressure: 200 to 250 kilopascals",
      "Chilled water supply: 6 to 7 °C",
      "High condenser pressure trip: 1,200 kPa",
    ],
  },
];

const FAULTS: { code: string; title: string; severity: string; tone: Tone }[] = [
  { code: "F-301", title: "Low oil pressure — stop the compressor and inspect the oil system", severity: "critical", tone: "severe" },
  { code: "F-203", title: "Low refrigerant pressure — isolate, leak test, check charge", severity: "high", tone: "severe" },
  { code: "F-117", title: "High condenser pressure — verify water flow, clean tubes", severity: "medium", tone: "recovery" },
  { code: "F-088", title: "Supply fan belt slip — re-tension or replace the belt", severity: "low", tone: "healthy" },
  { code: "F-145", title: "Dirty filter — replace the panel filters", severity: "low", tone: "healthy" },
];

const PARTS = [
  { pn: "88-22A", desc: "Supply fan belt for AHU-12" },
  { pn: "45-90C", desc: "MERV 13 panel filter, pack of four, AHU-12" },
  { pn: "12-77R", desc: "Oil filter element for CH-02 compressor" },
  { pn: "33-50V", desc: "Chilled water expansion valve, AHU-12 coil" },
  { pn: "70-10G", desc: "R-134a refrigerant cylinder, 12 kilograms" },
];

const SCRIPTS: { kind: string; tone: Tone; text: string }[] = [
  { kind: "Inspection", tone: "info", text: "CH-02 oil pressure dropped to 130 kilopascals, fault F-301, this is critical, I stopped the compressor." },
  { kind: "Question", tone: "healthy", text: "What is the torque spec for the AHU-12 fan bearing housing bolts?" },
  { kind: "Command", tone: "recovery", text: "Create a work order for CH-02, fault F-301, low oil pressure, critical." },
];

export default function SampleDataPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-line-1 bg-canvas/90 px-4 backdrop-blur md:px-5">
        <span className="text-[13.5px] font-medium tracking-[-0.005em] text-ink-1">Sample data</span>
        <span className="text-ink-4">/</span>
        <span className="text-[12px] font-[450] text-ink-3">Demo reference</span>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 md:px-6">
        <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-2">
          The knowledge base ships with two pieces of HVAC equipment, a fault-code reference, a parts
          catalog, and maintenance procedures. Use the codes below to get reproducible answers and to
          drive the voice demo. You can extend any of it on the{" "}
          <Link href="/knowledge" className="text-ink-1 underline decoration-line-3 underline-offset-2">Knowledge</Link> page.
        </p>

        <section className="grid gap-4 lg:grid-cols-2">
          {EQUIPMENT.map((unit) => (
            <Panel key={unit.code} meta={`${unit.code} · ${unit.name}`} sub={unit.detail}>
              <ul className="flex flex-col gap-2">
                {unit.specs.map((spec) => (
                  <li key={spec} className="flex gap-2.5 text-[12px] leading-relaxed text-ink-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-4" />
                    {spec}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </section>

        <Panel meta="Fault codes" sub="Spoken codes the assistant recognises" bodyClassName="p-0">
          <ul className="divide-y divide-line-1">
            {FAULTS.map((fault) => (
              <li key={fault.code} className="flex items-center gap-3 px-4 py-2.5">
                <InlineCode tone={fault.tone === "severe" ? "err" : "default"}>{fault.code}</InlineCode>
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{fault.title}</span>
                <Tag tone={fault.tone} dot>{fault.severity}</Tag>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel meta="Parts catalog">
            <ul className="flex flex-col gap-2.5">
              {PARTS.map((part) => (
                <li key={part.pn} className="flex items-center gap-2.5">
                  <InlineCode>P/N {part.pn}</InlineCode>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink-3">{part.desc}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel meta="Try these out loud" sub="One script per capability">
            <ul className="flex flex-col gap-2.5">
              {SCRIPTS.map((script) => (
                <li key={script.kind} className="flex flex-col gap-1.5 rounded-sm border border-line-1 bg-inset px-3 py-2.5">
                  <Tag tone={script.tone}>{script.kind}</Tag>
                  <span className="text-[11.5px] leading-relaxed text-ink-2">“{script.text}”</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="flex items-center justify-between">
          <MetaLabel label="Next" />
          <Link href="/" className="text-[12px] text-ink-3 underline decoration-line-3 underline-offset-2 hover:text-ink-1">
            Go to the Field worker console and try a script
          </Link>
        </div>
      </div>
    </div>
  );
}
