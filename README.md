# Steam-Shed Assistant

**Offline, on-device Q&A over Darjeeling Himalayan Railway locomotive and rolling-stock maintenance documentation.**

Built for **Code for Communities — DHR Edition (GDG Siliguri)**, problem statement **C2 — Steam-Shed Assistant**.

Ask a question like *"What's the torque on this fitting?"* and get an answer grounded in the actual manual — no signal required, from the shed at Tindharia.

---

## Table of contents

- [The problem](#the-problem)
- [Required disclosures](#required-disclosures-per-event-submission-rules)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [RAG pipeline in detail](#rag-pipeline-in-detail)
- [Data model (IndexedDB)](#data-model-indexeddb)
- [Generation & fallback chain](#generation--fallback-chain)
- [UI / design system](#ui--design-system)
- [Error handling](#error-handling)
- [Security](#security)
- [Tech stack](#tech-stack)
- [Running locally](#running-locally)
- [Deployment](#deployment)
- [Sample data & demo questions](#sample-data--demo-questions)
- [Team](#team)

---

## The problem

Permanent-way and loco-shed staff at DHR work from paper manuals or scattered PDFs, with no fast way to find a specific fact — *"what's the torque on this fitting?"* — without flipping through pages, and no reliable signal to rely on a cloud tool. Steam-Shed Assistant answers that question directly from the actual maintenance documentation, entirely on the device, with the source shown underneath every answer so it stays verifiable.

## Required disclosures (per event submission rules)

**On-device model(s) used:**
- **Generation:** Chrome's built-in Prompt API (Gemini Nano) where available; MediaPipe LLM Inference for Web (a small Gemma variant) as a second path where Chrome's built-in model isn't available.
- **Embeddings:** Transformers.js running a quantized MiniLM-class sentence embedding model, used for both document indexing and query retrieval.

**Minimum device tested:** *[fill in after real device testing — do not submit with this placeholder]*

**What happens when the model is unavailable:** the app falls back to an **extractive mode** — instead of a generated answer, it shows the best-matching excerpt directly from the source document with its citation (document, section, page). The app never goes blank or errors out; every question gets either a generated answer, a matched excerpt, or an honest "the provided documents don't cover this" response.

## How it works

1. Load one or more maintenance PDFs into the app (one-time; needs the file, not a network connection).
2. The app extracts and chunks the text, embeds each chunk on-device, and stores everything locally in IndexedDB.
3. Ask a question. The app retrieves the most relevant chunks and generates a grounded, cited answer — entirely on-device.
4. Installed as a PWA, it keeps working with zero network calls after that first load.

## Architecture

Entirely client-side. No backend, no server call, ever, after first load.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (PWA)                             │
│                                                                    │
│  ┌───────────────┐   ┌───────────────────┐   ┌────────────────┐  │
│  │  Ingestion     │──▶│  Vector Store      │◀──│  Retrieval     │  │
│  │  (pdf.js)      │   │  (IndexedDB)       │   │  (cosine sim)  │  │
│  └───────────────┘   └───────────────────┘   └───────┬────────┘  │
│         ▲                                              │           │
│         │                                              ▼           │
│  ┌───────────────┐                            ┌────────────────┐  │
│  │  Embedding     │───────────────────────────▶│  Generation     │  │
│  │  (Transformers │                            │  provider layer │  │
│  │  .js, MiniLM)  │                            │  (see below)    │  │
│  └───────────────┘                            └───────┬────────┘  │
│                                                          │           │
│                                                          ▼           │
│                                               ┌────────────────┐    │
│                                               │  Chat UI         │    │
│                                               │  (React+Tailwind)│    │
│                                               └────────────────┘    │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Service Worker — caches app shell + models after 1st load   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Choice | Why |
|---|---|---|
| UI | React + Tailwind | Fast to build, familiar toolchain |
| PDF parsing | pdf.js | Runs entirely in-browser, no server |
| Embeddings | Transformers.js (quantized MiniLM) | Small, browser-native, no native binary |
| Vector storage | IndexedDB | Native browser persistence, no external DB |
| Generation | Chrome Prompt API → MediaPipe LLM → extractive fallback | Layered for device/browser variance |
| Offline shell | Service Worker + Web App Manifest | Required for PWA install + offline judging criterion |

**Explicit non-architecture:** no backend, no API server, no cloud LLM call of any kind at runtime — a violation here fails the event's "works offline" criterion outright. No user accounts or auth — nothing to secure server-side, because there is no server.

## RAG pipeline in detail

**Ingestion time** (once per document, needs the file but not network):
```
PDF → pdf.js text extraction → section-aware chunking → embedding → write to IndexedDB
```
- Chunking splits on detected section/heading first, then hard-caps long sections to ~500 tokens with ~50-token overlap, so a fact near a chunk boundary isn't lost.
- Each chunk stores its document name, section heading, page number, and embedding vector.

**Query time** (fully offline):
```
Question → embed question → retrieve top-k chunks from IndexedDB → generation provider → answer + citations → render
```
- Retrieval: cosine similarity between the question's embedding and every stored chunk vector. Brute-force is fast enough at this corpus scale — no approximate-nearest-neighbor index needed.
- Default top-k ≈ 4–6 chunks, with a minimum-similarity threshold — if nothing clears it, the app says the documents don't cover the question rather than forcing a guess.

## Data model (IndexedDB)

**`documents` store**

| Field | Type | Notes |
|---|---|---|
| `id` | string (key) | UUID |
| `name` | string | original filename |
| `ingestedAt` | number | timestamp |
| `embeddingModelVersion` | string | detects a future model change instead of silently corrupting similarity scores |

**`chunks` store**

| Field | Type | Notes |
|---|---|---|
| `id` | string (key) | UUID |
| `documentId` | string | foreign key to `documents.id` |
| `sectionHeading` | string | |
| `pageNumber` | number | |
| `text` | string | chunk text |
| `embedding` | Float32Array | fixed-length vector |

## Generation & fallback chain

A single uniform interface, three interchangeable providers tried in order — the UI never talks to any of them directly:

```ts
interface GenerationResult {
  answer: string;
  citations: Array<{ documentName: string; sectionHeading: string; pageNumber: number }>;
  mode: "on-device-model" | "extractive-fallback";
}
```

1. **Chrome Prompt API** (Gemini Nano) — checked first.
2. **MediaPipe LLM Inference for Web** (small Gemma variant) — checked if #1 unavailable.
3. **Extractive fallback** — always available, never fails. Returns the top retrieved chunk verbatim with its citation, no model call involved.

The system prompt restricts the model to answering only from retrieved excerpts, preserving exact numbers/units verbatim, stating plainly when the documents don't cover something, and never narrating its own sourcing in the answer text (the citation card already does that job).

## UI / design system

Single-screen chat interface with a deliberately adapted **neumorphic** visual system — soft, warm-toned depth cues to distinguish "you can tap this" from "this is a delivered answer," with the contrast and focus-state fixes standard neumorphism usually fails on, since this needs to be legible on a cheap screen in bright shed daylight.

- **Depth encodes state, not decoration:** interactive elements (input, buttons) are raised; delivered answers are inset. Buttons flip to inset on tap for tactile feedback.
- **Accessibility:** body text meets WCAG AA contrast; every interactive element gets a visible focus ring, not just a shadow shift; motion is minimal and respects `prefers-reduced-motion`.
- **Suggested-question chips** in the empty state and mid-conversation reduce the "blank input box" problem and keep the demo reliable.
- **Status pill** shows "● ready" (on-device model loaded) vs. "matched excerpts only" (fallback mode) at a glance.
- **Citation strip** under every answer: document name, section, page — structurally distinct from the answer text, not just smaller font.

## Error handling

Every failure mode degrades to something visible and useful — never a blank screen or silent crash:

| Failure | Behavior |
|---|---|
| On-device model unavailable | Falls through the provider chain to the extractive fallback, which always succeeds |
| PDF fails to parse / no extractable text | Named, specific error for that document; other documents still ingest |
| No relevant chunks retrieved | Honest "the provided documents don't cover this" — never forces a guess |
| No documents ingested yet | Querying is blocked; empty-state prompt to add a document instead |
| IndexedDB quota exceeded | Names which document couldn't be saved |
| IndexedDB unavailable | In-memory session fallback with a visible non-persistence warning |
| Embedding model version mismatch | Prompts re-ingestion instead of returning garbage similarity scores |
| Generation taking too long (~20–30s) | Offers the extractive fallback rather than waiting indefinitely |

## Security

No server means no database to breach, no auth to bypass, no API to rate-limit — the risks that remain are client-side:

- All PDF-extracted text and model output render as plain text — never unsanitized HTML — to prevent XSS.
- Retrieved document text is treated as data, never as instructions, so nothing in a PDF can hijack the model's behavior (prompt-injection guard).
- No `localStorage`/`sessionStorage` — IndexedDB or in-memory state only.
- All dependencies pinned to exact versions; no floating CDN tags.
- Served only over HTTPS (required for the service worker and the Prompt API's secure-context requirement).
- No analytics, telemetry, or any external call of any kind.

## Tech stack

- Vite + React + TypeScript + Tailwind CSS
- `pdf.js` — PDF text extraction
- `Transformers.js` — on-device embeddings
- `idb` (IndexedDB wrapper) — persistence
- `vite-plugin-pwa` — manifest + service worker
- Chrome Prompt API / MediaPipe LLM Inference for Web — on-device generation

## Running locally

```bash
npm install
npm run dev
```

Build + preview the production PWA bundle — this is the build that actually tests offline behavior; `dev` mode does not:

```bash
npm run build
npm run preview
```

To verify offline behavior: open the preview build, let it fully load once, then enable airplane mode (or DevTools' offline throttling) and reload — the app should continue to function with zero network requests.

## Deployment

Deployed to [GitHub Pages / Netlify / Vercel — fill in actual URL]. A few host-specific details that matter for this app:

- **Base path:** GitHub Pages project sites serve from a subpath, not the domain root — `vite.config.ts`'s `base`, the manifest's `start_url`/icons, and the service worker's scope all need to agree on this.
- **pdf.js worker file:** bundled via a Vite-safe pattern so it survives production build, not just dev mode.
- **Model asset caching:** on-device model weights are explicitly included in the service worker's precache/runtime-caching config, since default precache size limits can silently exclude large files.
- Always re-run the offline verification against the **actual deployed URL** in a fresh incognito window — a pass on localhost doesn't guarantee a pass once hosted.

## Sample data & demo questions

Ships with a placeholder B-Class Maintenance Manual (sample) covering torque specs, pressure settings, dimensions/tolerances, maintenance intervals, procedures, and part numbers — swapped for the official DHR documentation once organisers confirm what can be shared.

"What is the torque on the injector fitting?"
"What's the safety valve set pressure?"
"What's the brake rigging pin torque?"
"How often should the boiler be washed out?"
"How often should brake rigging be inspected?"
"How often should injector fittings be inspected?"
"What's the nominal wheel tread diameter?"
"How much wheel wear is allowed before reprofiling?"
"What's the axle box bearing clearance?"
"What's the coupling rod bearing clearance?"
"What lubricant do the main rod bearings need?"
"How often should valve gear pins and links be lubricated?"
"What are the steps to inspect brake rigging?"
"What are the steps to replace piston rod packing?"
"How often should piston rod packing be checked for leaks?"
"What's the part number for the injector delivery fitting union nut?"
"What's the part number for the brake rigging clevis pin?"
"What's the part number for the axle box bearing shell?"

And a question it correctly declines to guess at, since the documents don't cover it:
- "What's the tender water capacity?"

## Team

Built solo by Karan.
