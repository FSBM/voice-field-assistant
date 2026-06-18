import {
  Mic, Server, BrainCircuit, Cpu, Database, Gauge, FileText, Braces, Type, BookText,
  MessageSquare, Workflow, CircleCheck, Terminal, WifiOff, Lock, Layers, Radio, Scissors, ShieldCheck,
} from "lucide-react";
import Panel from "@/components/ui/panel";
import MetaLabel from "@/components/ui/meta-label";
import Tag from "@/components/ui/tag";
import InlineCode from "@/components/ui/inline-code";
import { FlowNode, Pipeline } from "@/components/ui/flow";
import { CHUNKING } from "@/lib/kb/chunk";

const ICON = { size: 14, strokeWidth: 1.75 } as const;
const SMALL = { size: 13, strokeWidth: 1.75 } as const;

const STACK = [
  { group: "Frontend", items: ["Next.js 16 (App Router)", "React 19 + TypeScript", "Tailwind v4", "Dexie (IndexedDB)"] },
  { group: "AI", items: ["Groq Whisper, speech to text", "gpt-oss + Llama, extract and agent", "Gemini embeddings, free tier", "Web Speech API, spoken replies"] },
  { group: "Data", items: ["Supabase Postgres", "Supabase Realtime", "Knowledge store: seed + kb_chunks", "In-memory cosine retrieval"] },
  { group: "Hosting", items: ["Vercel, single deploy", "100% free tiers", "No paid NLP APIs", "Public URL + GitHub"] },
];

const MODELS = [
  { id: "whisper-large-v3-turbo", job: "Speech to text", provider: "Groq", note: "Transcribes the clip, biased toward HVAC equipment and fault codes via a domain prompt." },
  { id: "openai/gpt-oss-120b", job: "Extraction", provider: "Groq", note: "Turns the transcript into a work order, validated field by field against a Zod schema." },
  { id: "llama-3.3-70b-versatile", job: "Voice agent", provider: "Groq", note: "Tool calling to create, update, or close orders, capped at five reasoning steps." },
  { id: "llama-3.1-8b-instant", job: "Grounded answers", provider: "Groq", note: "Fast model that answers only from the retrieved manual chunks, so replies stay short." },
  { id: "gemini-embedding-001", job: "Embeddings", provider: "Google", note: "Free embeddings API over plain HTTP. Produces 768-dimension vectors with retrieval task types." },
  { id: "gemini-2.5-flash-lite", job: "Failover", provider: "Google", note: "Automatic backup for extraction, agent, and answers when Groq is rate-limited." },
];

const ROUTES = [
  { method: "POST", path: "/api/process", body: "audio or text", returns: "{ transcript, workOrder, saved }", note: "Transcribe, extract, and save one inspection." },
  { method: "POST", path: "/api/ask", body: "audio or text", returns: "{ answer, sources, matches, degraded }", note: "Grounded retrieval answer with the chunks it used." },
  { method: "POST", path: "/api/agent", body: "audio or text", returns: "{ command, reply }", note: "Run a spoken create, update, or close command." },
  { method: "POST", path: "/api/transcribe", body: "audio (webm)", returns: "{ text }", note: "Raw audio to text, no extraction." },
  { method: "GET", path: "/api/knowledge", body: "none", returns: "{ stats, chunking, points, sources }", note: "The whole knowledge base with 2D coordinates for the map." },
  { method: "POST", path: "/api/knowledge", body: "md file, text, or audio", returns: "{ source, count, added }", note: "Chunk, embed, and store new knowledge." },
  { method: "POST", path: "/api/knowledge/search", body: "{ query }", returns: "{ results }", note: "Ranked chunks with scores, no model call." },
  { method: "GET", path: "/api/work-orders", body: "none", returns: "{ orders }", note: "List the 50 most recent work orders." },
  { method: "GET", path: "/api/activity", body: "none", returns: "{ activity }", note: "Recent voice transcripts for the dashboard." },
  { method: "GET", path: "/api/health", body: "none", returns: "{ ok, llm, stt, supabase, kb }", note: "Liveness plus which capabilities are configured." },
];

const SCHEMA = [
  { field: "equipment_code", type: "string", note: "Asset tag, for example AHU-12 or CH-02." },
  { field: "inspection_result", type: "string", note: "What the technician observed." },
  { field: "fault_code", type: "string", note: "Fault reference, for example F-203." },
  { field: "location", type: "string", note: "Where the asset sits." },
  { field: "severity", type: "enum", note: "low, medium, high, or critical." },
  { field: "action_taken", type: "string", note: "Remediation performed or recommended." },
  { field: "parts_required", type: "array", note: "Items of { name, part_number, quantity }." },
];

const KB_SCHEMA = [
  { field: "id", type: "text", note: "Stable chunk id, source plus index." },
  { field: "source", type: "text", note: "Document the chunk came from." },
  { field: "chunk_index", type: "int", note: "Position of the chunk within its document." },
  { field: "heading", type: "text", note: "The section heading the chunk sits under." },
  { field: "text", type: "text", note: "The chunk content that gets embedded." },
  { field: "embedding", type: "jsonb", note: "768 floats from Gemini, used for cosine search." },
];

const FILEMAP = [
  { path: "lib/stt.ts", role: "Groq Whisper transcription with the HVAC domain prompt." },
  { path: "lib/extract.ts", role: "Schema-validated extraction with a keyword fallback." },
  { path: "lib/agent.ts", role: "Tool-calling voice agent (create / update / close)." },
  { path: "lib/rag.ts", role: "Embed, cosine search, and grounded answer." },
  { path: "lib/kb/chunk.ts", role: "The chunking strategy and its parameters." },
  { path: "lib/kb/store.ts", role: "Seed plus kb_chunks store, search, add, and remove." },
  { path: "lib/llm.ts", role: "Groq to Gemini failover on rate limits." },
  { path: "lib/schema.ts", role: "The shared contract for AI, agent, and database." },
];

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-2">{children}</p>;
}

function CodeId({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] font-medium tracking-[-0.01em] text-ink-1">{children}</span>;
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="mt-3 flex flex-col gap-2 border-t border-line-1 pt-3 text-[12px] leading-relaxed text-ink-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-[1px] text-[10px] font-medium tabular-nums text-ink-4">{String(i + 1).padStart(2, "0")}</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default function DocsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-3 border-b border-line-1 bg-canvas/90 px-4 backdrop-blur md:px-5">
        <span className="text-[13.5px] font-medium tracking-[-0.005em] text-ink-1">Documentation</span>
        <span className="text-ink-4">/</span>
        <span className="text-[12px] font-[450] text-ink-3">How it works</span>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-7 md:px-6">
        <section className="flex flex-col gap-2.5">
          <h1 className="text-[20px] font-medium tracking-[-0.02em] text-ink-1">How it works</h1>
          <Lead>
            Field Voice is a hands-free assistant for technicians. They speak, and it transcribes the
            audio, extracts a structured work order, answers questions from the equipment manuals, and
            keeps a live record for supervisors. Every part runs on free APIs, with secrets kept on the
            server and a fallback for every model so a demo never dead-ends.
          </Lead>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {["Next.js", "TypeScript", "Groq Whisper", "gpt-oss + Llama", "Gemini retrieval", "Supabase", "Web Speech"].map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Architecture" />
          <Lead>
            The browser only records audio and renders results. All keys and model calls live in
            server-side API routes, so nothing sensitive ships to the client.
          </Lead>
          <Panel meta="Data flow">
            <Pipeline vertical>
              <FlowNode tone="info" icon={<Mic {...ICON} />} title="Field worker" caption="MediaRecorder, webm clip" />
              <FlowNode icon={<Server {...ICON} />} title="Next.js API routes" caption="process, ask, agent, knowledge" />
              <FlowNode tone="recovery" icon={<BrainCircuit {...ICON} />} title="Groq, Gemini failover" caption="Whisper, gpt-oss, Llama" />
              <FlowNode tone="info" icon={<Cpu {...ICON} />} title="Gemini embeddings" caption="768-dim, cosine search" />
              <FlowNode tone="healthy" icon={<Database {...ICON} />} title="Supabase" caption="work_orders, kb_chunks, Realtime" />
              <FlowNode icon={<Gauge {...ICON} />} title="Supervisor dashboard" caption="live work orders" />
            </Pipeline>
          </Panel>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Voice pipelines" />
          <div className="flex flex-col gap-2.5">
            <Panel meta="1 · Log inspection">
              <Pipeline>
                <FlowNode tone="info" icon={<Mic {...SMALL} />} title="Speak" />
                <FlowNode icon={<FileText {...SMALL} />} title="Transcribe" caption="Whisper" />
                <FlowNode tone="recovery" icon={<Braces {...SMALL} />} title="Extract" caption="Zod" />
                <FlowNode tone="healthy" icon={<Database {...SMALL} />} title="Save" caption="Supabase" />
              </Pipeline>
              <Steps
                items={[
                  <>The recorder captures a clip with <InlineCode>MediaRecorder</InlineCode> and posts it to <InlineCode>/api/process</InlineCode>.</>,
                  <>Whisper transcribes the audio, primed by an HVAC domain prompt so codes like <InlineCode>AHU-12</InlineCode> survive.</>,
                  <>The transcript goes to <InlineCode>openai/gpt-oss-120b</InlineCode> through <InlineCode>generateObject</InlineCode>, which fills the schema field by field.</>,
                  <>The validated order is inserted into <InlineCode>work_orders</InlineCode> and streamed to the dashboard. The reply is read aloud.</>,
                ]}
              />
            </Panel>

            <Panel meta="2 · Ask a question, retrieval">
              <Pipeline>
                <FlowNode tone="info" icon={<Mic {...SMALL} />} title="Ask" />
                <FlowNode icon={<FileText {...SMALL} />} title="Transcribe" />
                <FlowNode icon={<BookText {...SMALL} />} title="Retrieve" caption="Gemini, cosine" />
                <FlowNode tone="healthy" icon={<MessageSquare {...SMALL} />} title="Answer" caption="grounded" />
              </Pipeline>
              <Steps
                items={[
                  <>The question is transcribed, then embedded with <InlineCode>gemini-embedding-001</InlineCode> into a 768-dimension vector.</>,
                  <>Cosine similarity ranks every chunk, seed and added, and keeps the top six.</>,
                  <>Those chunks become the only context for <InlineCode>llama-3.1-8b-instant</InlineCode>, which is told to answer from context alone.</>,
                  <>The answer, its sources, and the chunks it used return to the worker and are spoken back.</>,
                ]}
              />
            </Panel>

            <Panel meta="3 · Voice command, agent">
              <Pipeline>
                <FlowNode tone="info" icon={<Terminal {...SMALL} />} title="Command" />
                <FlowNode icon={<FileText {...SMALL} />} title="Transcribe" />
                <FlowNode tone="recovery" icon={<Workflow {...SMALL} />} title="Plan" caption="tool calling" />
                <FlowNode tone="healthy" icon={<CircleCheck {...SMALL} />} title="Write" caption="Supabase" />
              </Pipeline>
              <Steps
                items={[
                  <>The spoken command is transcribed and handed to <InlineCode>llama-3.3-70b-versatile</InlineCode> with three tools bound.</>,
                  <>The agent picks one of <InlineCode>createWorkOrder</InlineCode>, <InlineCode>updateWorkOrder</InlineCode>, or <InlineCode>closeWorkOrder</InlineCode>.</>,
                  <>Update and close first locate the order by equipment or fault code with a case-insensitive match.</>,
                  <>After acting it returns one short confirmation, capped at five steps so it cannot loop.</>,
                ]}
              />
            </Panel>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Chunking and retrieval" />
          <Lead>
            Good answers depend on good chunks. A naive fixed-size split would cut a torque table or a
            procedure in half, so a single embedding would blur two unrelated ideas. Instead the
            knowledge base uses a <span className="text-ink-1">{CHUNKING.strategy.toLowerCase()}</span> strategy,
            so each vector represents one coherent passage. The same chunker runs at build time on the
            seed manuals and at runtime on anything you add.
          </Lead>

          <Panel meta="Strategy" sub={`${CHUNKING.embeddingModel} · ${CHUNKING.dimensions} dimensions`}>
            <div className="mb-4 grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line-1 bg-line-1">
              <div className="bg-surface-1 px-3 py-2.5">
                <div className="text-[11px] text-ink-3">Max chunk</div>
                <div className="mt-1 text-[15px] font-medium tabular-nums text-ink-1">{CHUNKING.maxChars}<span className="text-[11px] text-ink-4"> chars</span></div>
              </div>
              <div className="bg-surface-1 px-3 py-2.5">
                <div className="text-[11px] text-ink-3">Overlap</div>
                <div className="mt-1 text-[15px] font-medium tabular-nums text-ink-1">{CHUNKING.overlapChars}<span className="text-[11px] text-ink-4"> chars</span></div>
              </div>
              <div className="bg-surface-1 px-3 py-2.5">
                <div className="text-[11px] text-ink-3">Min chunk</div>
                <div className="mt-1 text-[15px] font-medium tabular-nums text-ink-1">{CHUNKING.minChars}<span className="text-[11px] text-ink-4"> chars</span></div>
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Scissors className="h-3.5 w-3.5 text-ink-3" strokeWidth={2} />
              <span className="text-[11px] font-medium tracking-[0.04em] text-ink-3">Why this strategy</span>
            </div>
            <ol className="flex flex-col gap-2">
              {CHUNKING.rationale.map((reason, index) => (
                <li key={index} className="flex gap-2.5 text-[12px] leading-relaxed text-ink-2">
                  <span className="mt-px text-[10px] tabular-nums text-ink-4">{index + 1}</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Panel meta="Embeddings">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-recovery-line bg-recovery-bg text-recovery">
                  <Cpu {...ICON} />
                </span>
                <p className="text-[12px] leading-relaxed text-ink-2">
                  Each chunk is embedded with <InlineCode>gemini-embedding-001</InlineCode> over plain HTTP on the
                  free Gemini tier — no native runtime, so it works on any serverless host. Seed chunks ship in
                  <InlineCode>vectors.json</InlineCode>; anything you add is embedded the same way.
                </p>
              </div>
            </Panel>
            <Panel meta="Cosine search">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-healthy-line bg-healthy-bg text-healthy">
                  <BookText {...ICON} />
                </span>
                <p className="text-[12px] leading-relaxed text-ink-2">
                  At query time only the question is embedded. Cosine similarity ranks every chunk and the
                  top six form the context. The <span className="text-ink-1">Knowledge</span> page lets you
                  watch this live, with the matching chunks and their scores.
                </p>
              </div>
            </Panel>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Reliability and fallbacks" />
          <Lead>
            A live demo cannot depend on one provider staying up. Every model call has a backup, and the
            app stays useful even with no AI key at all.
          </Lead>
          <Panel bodyClassName="p-0">
            <ul className="divide-y divide-line-1">
              <li className="flex items-start gap-2.5 px-4 py-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-recovery-line bg-recovery-bg text-recovery"><BrainCircuit {...SMALL} /></span>
                <p className="text-[12px] leading-relaxed text-ink-2"><span className="text-ink-1">Rate limit.</span> If Groq returns 429 or a server error, the call retries on <InlineCode>gemini-2.5-flash-lite</InlineCode> automatically.</p>
              </li>
              <li className="flex items-start gap-2.5 px-4 py-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-info-line bg-info-bg text-info"><Type {...SMALL} /></span>
                <p className="text-[12px] leading-relaxed text-ink-2"><span className="text-ink-1">Degraded.</span> Without a language model, extraction falls back to keyword rules and answers return the closest chunk. If embeddings are unavailable, a keyword search backs up retrieval so questions still return relevant passages.</p>
              </li>
              <li className="flex items-start gap-2.5 px-4 py-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-line-2 bg-surface-2 text-ink-2"><ShieldCheck {...SMALL} /></span>
                <p className="text-[12px] leading-relaxed text-ink-2"><span className="text-ink-1">Clear signal.</span> <InlineCode>/api/health</InlineCode> reports which capabilities are live, and a banner appears when the app is running in a degraded mode.</p>
              </li>
            </ul>
          </Panel>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Models" />
          <Panel bodyClassName="p-0">
            <ul className="divide-y divide-line-1">
              {MODELS.map((m) => (
                <li key={m.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CodeId>{m.id}</CodeId>
                    <Tag tone="info">{m.job}</Tag>
                    <span className="text-[10.5px] text-ink-4">{m.provider}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-ink-3">{m.note}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="API routes" />
          <Panel bodyClassName="p-0">
            <ul className="divide-y divide-line-1">
              {ROUTES.map((r) => (
                <li key={`${r.method}${r.path}`} className="flex flex-col gap-1.5 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone={r.method === "GET" ? "healthy" : "info"} className="w-[46px] justify-center">{r.method}</Tag>
                    <CodeId>{r.path}</CodeId>
                    <span className="text-[11.5px] text-ink-3">{r.note}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 pl-[54px] text-[11px] text-ink-4">
                    <span>body: <span className="text-ink-2">{r.body}</span></span>
                    <span>returns: <span className="text-ink-2">{r.returns}</span></span>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Data model" />
          <Lead>
            One Zod schema is the single contract shared by AI extraction, the agent tools, and the
            Postgres columns, so a field name never drifts between layers.
          </Lead>
          <Panel meta="Work order, extracted fields" bodyClassName="p-0">
            <ul className="divide-y divide-line-1">
              {SCHEMA.map((f) => (
                <li key={f.field} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CodeId>{f.field}</CodeId>
                    <span className="text-[11.5px] text-ink-3">{f.note}</span>
                  </div>
                  <Tag>{f.type}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel meta="kb_chunks, the knowledge store" bodyClassName="p-0">
            <ul className="divide-y divide-line-1">
              {KB_SCHEMA.map((f) => (
                <li key={f.field} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CodeId>{f.field}</CodeId>
                    <span className="text-[11.5px] text-ink-3">{f.note}</span>
                  </div>
                  <Tag>{f.type}</Tag>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Offline and realtime" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Panel meta="Offline">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-line-2 bg-surface-2 text-ink-2">
                  <WifiOff {...ICON} />
                </span>
                <p className="text-[12px] leading-relaxed text-ink-2">
                  When the signal drops, the recording is stored in the browser through Dexie
                  (<InlineCode>IndexedDB</InlineCode>). The moment the connection returns it re-uploads to
                  <InlineCode>/api/process</InlineCode> automatically, transcribes server-side, and marks itself synced.
                </p>
              </div>
            </Panel>
            <Panel meta="Realtime">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-line-2 bg-surface-2 text-ink-2">
                  <Radio {...ICON} />
                </span>
                <p className="text-[12px] leading-relaxed text-ink-2">
                  When a work order changes, the server pushes a <InlineCode>broadcast</InlineCode> event on the
                  work-orders channel and the dashboard refetches at once. The database stays locked behind
                  row-level security — the browser never reads it directly — and a slow poll backs the channel
                  up, shown by the live or polling pill.
                </p>
              </div>
            </Panel>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Security and cost" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Panel meta="Secrets">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-line-2 bg-surface-2 text-ink-2">
                  <Lock {...ICON} />
                </span>
                <p className="text-[12px] leading-relaxed text-ink-2">
                  The <InlineCode>GROQ_API_KEY</InlineCode> and the Supabase secret key are read only in
                  API routes. The browser sees just the public publishable key, prefixed
                  <InlineCode>NEXT_PUBLIC_</InlineCode>, which is safe to ship.
                </p>
              </div>
            </Panel>
            <Panel meta="Free tier">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-line-2 bg-surface-2 text-ink-2">
                  <Layers {...ICON} />
                </span>
                <p className="text-[12px] leading-relaxed text-ink-2">
                  Groq, Supabase, and Vercel all run on free tiers, and embeddings run locally, so there
                  is no paid NLP API anywhere in the stack. The whole app deploys to one public URL.
                </p>
              </div>
            </Panel>
          </div>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Project map" />
          <Panel bodyClassName="p-0">
            <ul className="divide-y divide-line-1">
              {FILEMAP.map((f) => (
                <li key={f.path} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-3 text-[11.5px]">
                  <CodeId>{f.path}</CodeId>
                  <span className="text-ink-3">{f.role}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="flex flex-col gap-2.5">
          <MetaLabel label="Tech stack" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {STACK.map((col) => (
              <Panel key={col.group} meta={col.group}>
                <ul className="flex flex-col gap-1.5 text-[12px] text-ink-2">
                  {col.items.map((it) => (
                    <li key={it} className="flex items-center gap-2">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-ink-4" />
                      {it}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
