# Reflection

## What we built

A voice-first assistant for field technicians that fuses everything from the earlier
assignments into one product: prompt engineering, an agent loop with tools, a retrieval
pipeline, and a deployed web app — now driven by voice and able to work offline. A technician
records a note and gets back a structured work order; asks a question and hears an answer from
the knowledge base; or gives a command and the agent creates, updates, or closes a work order
and confirms it aloud. A supervisor watches all of it update live.

## What worked

Keeping one schema (`lib/schema.ts`) as the single source of truth was the best decision. The
same Zod object drives the AI extraction, the agent's tools, and the database columns, so a
work order has exactly one shape across the whole system and there is no mapping code to get
wrong. Putting all logic in small `lib/` functions and keeping the API routes thin made the
code easy to read and easy to split across the team — each person could own a module without
stepping on the others.

Choosing free, fast models mattered more than we expected. Groq's Whisper returns a transcript
in a few hundred milliseconds, and the small Llama model answers questions quickly enough that
the spoken reply feels immediate, which is what the three-second metric is really about.
Running the embedding model locally on the server meant the retrieval step needed no API key
and no quota at all.

## What the GIGO principle taught us

Garbage in, garbage out showed up first in transcription. Without the domain prompt, Whisper
turned equipment and fault codes into nonsense, and then the extraction step faithfully
produced a nonsense work order from it. Fixing the *input* — seeding Whisper with the real code
formats and terms — improved everything downstream far more than any change to the later
prompts. The same lesson applied to the knowledge base: vague documents produced vague answers,
so we wrote the source docs with concrete numbers (torque specs, pressures, part numbers) that
the assistant could actually quote.

## What we would improve

The offline mode currently queues the audio and processes it on reconnect; a stronger version
would transcribe on the device so the technician sees a draft immediately with no network. We
would also add a higher-quality neural voice that runs in the browser instead of the built-in
one, and stream the spoken answer so it starts before the full text is generated. Finally, we
would add authentication so each technician and supervisor has their own login.
