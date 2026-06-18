# Prompts

The assistant uses four prompts, all kept in `lib/prompts.ts`. This document explains the
reasoning behind each one.

## 1. Speech-to-text domain prompt (`STT_DOMAIN_PROMPT`)

> Field service report for HVAC equipment. Equipment codes like AHU-12 and CH-02. Fault codes like F-203 and F-117. Part numbers like P/N 88-22A. Terms: compressor, actuator, solenoid, refrigerant, torque, kilopascals, newton metres.

**Why:** Whisper lets you pass a short prompt to bias its spelling and vocabulary. Field
speech is full of codes and jargon that a general model mishears ("F-203" becomes "F two oh
three", "AHU-12" becomes "a HU twelve"). Seeding the exact formats and key terms makes the
transcript far more accurate in a noisy environment, which is the first success metric.

## 2. Extraction system prompt (`EXTRACTION_SYSTEM`)

> You convert a field technician's spoken note into a structured work order. Read the note carefully and fill every field. If a detail is not mentioned, use an empty string for text fields and an empty list for parts. Pick the severity that best matches the described risk.

**Why:** The model must return a *complete* object, even when the technician does not mention
every field. Telling it to use empty values for missing details avoids invented data while
still satisfying the schema. The schema itself (in `lib/schema.ts`) carries a `.describe()`
note on every field, so the field-level instructions live next to the field, not buried in
the prompt. Severity is a judgement call, so we ask the model to match it to the described risk.

## 3. Answer system prompt (`ANSWER_SYSTEM`)

> You are a maintenance knowledge assistant for field technicians. Answer the question using only the provided context from the knowledge base. Keep the answer short and clear so it can be read aloud. If the answer is not in the context, say you do not have that information.

**Why:** This is the anti-hallucination rule for retrieval. "Only from the provided context"
keeps answers grounded in the knowledge base instead of the model's general memory. "Short and
clear so it can be read aloud" matters because the answer is spoken, not read — long answers
are painful to listen to and blow the three-second feel. The fallback sentence prevents the
model from guessing when the knowledge base does not cover the question.

## 4. Agent system prompt (`AGENT_SYSTEM`)

> You help a field technician manage work orders by voice. Use the tools to create, update, or close work orders based on the spoken command. After acting, reply with one short spoken confirmation of what you did. If you cannot find the work order, say so plainly.

**Why:** The agent has three tools (create, update, close). The prompt tells it to *act first,
then confirm*, which is exactly the hands-free loop the assignment describes: speak a command,
hear it confirmed. Asking for one short confirmation keeps the spoken reply tight. The
"say so plainly" clause handles the common case where the referenced work order does not exist.
