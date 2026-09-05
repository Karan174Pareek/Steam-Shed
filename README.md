# Steam-Shed Assistant

**Offline, on-device Q&A over Darjeeling Himalayan Railway locomotive and rolling-stock maintenance documentation.**

> Built for **Code for Communities — DHR Edition (GDG Siliguri)**  
> Problem Statement: **C2 — Steam-Shed Assistant**  
> Target Venue: **Tindharia Locomotive Shed & Permanent-Way Maintenance**

Ask a question like *"What's the torque on this fitting?"* and get an answer grounded in the actual manual — no signal required, straight from the shed at Tindharia.

---

## Table of Contents
- [The Problem](#the-problem)
- [Required Disclosures](#required-disclosures-per-event-submission-rules)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [RAG Pipeline in Detail](#rag-pipeline-in-detail)
- [Data Model (IndexedDB)](#data-model-indexeddb)
- [Generation & Fallback Chain](#generation--fallback-chain)
- [UI / Design System](#ui--design-system)
- [Error Handling](#error-handling)
- [Security](#security)
- [Tech Stack](#tech-stack)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Sample Data & Demo Questions](#sample-data--demo-questions)
- [Team](#team)

---

## The Problem
Permanent-way and loco-shed staff at DHR work from paper manuals or scattered PDFs, with no fast way to find a specific fact — *"what's the torque on this fitting?"* — without flipping through pages, and no reliable cellular signal in mountain terrain to rely on a cloud tool. **Steam-Shed Assistant** answers that question directly from the actual maintenance documentation, entirely on the device, with the verified source shown underneath every answer.

---

## Required Disclosures (Per Event Submission Rules)

### On-Device Model(s) Used
- **Embeddings:** `Transformers.js` running a quantized MiniLM-class sentence embedding model (`Xenova/all-MiniLM-L6-v2`), used on-device for both document indexing and query retrieval.
- **Generation:**
  1. *Provider 1:* Chrome's built-in **Prompt API** (Gemini Nano) where available.
  2. *Provider 2:* **MediaPipe LLM Inference for Web** (Gemma variant) as a second hardware-accelerated path.
  3. *Provider 3:* **Extractive Fallback** (Direct verified excerpt extraction).

### Minimum Device Tested
- Tested on standard consumer laptop and mobile webview environments (Chrome 128+ on Windows 11 / Linux x64 / Android).

### What Happens When the Model Is Unavailable
The app gracefully falls back to **Extractive Mode** — instead of a generated summary, it displays the best-matching excerpt directly from the source document accompanied by its exact citation (document, section, page). The app never displays a blank screen or unhandled error; every question receives either an AI-synthesized answer, a matched excerpt, or an honest *"The provided documents don't cover this."* response.

---

## How It Works
1. **Load Maintenance PDFs:** Upload or seed maintenance PDFs into the app (one-time; requires the local file, not a network connection).
2. **On-Device Indexing:** The app extracts and chunks the text, computes vector embeddings on-device, and stores everything locally in `IndexedDB`.
3. **Ask a Question:** The app retrieves the most relevant chunks via cosine similarity and generates a grounded, cited answer — 100% on-device.
4. **Offline PWA:** Installed as a Progressive Web App, it operates continuously with zero network calls after first load.

---

## Architecture

Entirely client-side. No backend, no server calls, ever, after first load.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser (PWA)                          │
│                                                                 │
│  ┌───────────────┐      ┌───────────────────┐    ┌────────────┐ │
│  │   Ingestion   │─────▶│   Vector Store    │◀───│ Retrieval  │ │
│  │   (pdf.js)    │      │    (IndexedDB)    │    │(cosine sim)│ │
│  └───────────────┘      └───────────────────┘    └──────┬─────┘ │
│          │                                              │       │
│          ▼                                              ▼       │
│  ┌───────────────┐                              ┌─────────────┐ │
│  │   Embedding   │─────────────────────────────▶│ Generation  │ │
│  │(Transformers  │                              │  provider   │ │
│  │  .js, MiniLM) │                              │    layer    │ │
│  └───────────────┘                              └──────┬──────┘ │
│                                                        │        │
│                                                        ▼        │
│                                                 ┌─────────────┐ │
│                                                 │   Chat UI   │ │
│                                                 │(React + CSS)│ │
│                                                 └─────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Service Worker — caches app shell + models after 1st load  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Technology Choice | Rationale |
| :--- | :--- | :--- |
| **UI** | React 19 + Tailwind CSS | Component modularity, responsive neumorphic design |
| **PDF Parsing** | `pdf.js` | Runs entirely in-browser, no server |
| **Embeddings** | `@xenova/transformers` (quantized MiniLM) | Small footprint, browser-native WebAssembly execution |
| **Vector Storage** | `IndexedDB` (`idb`) | Native browser persistence, zero external DB dependencies |
| **Generation** | Chrome Prompt API $\rightarrow$ MediaPipe $\rightarrow$ Extractive | Layered hierarchy for device and browser variance |
| **Offline Shell** | Service Worker + Web App Manifest | Strict PWA installation and offline execution |

> **Explicit Non-Architecture:** No backend, no API server, and no runtime cloud LLM calls. No user accounts or tracking — client-side data sovereignty by design.

---

## RAG Pipeline in Detail

### Ingestion Time (Once per document, offline)
$$\text{PDF} \xrightarrow{\text{pdf.js}} \text{Page Text} \xrightarrow{\text{Heading-Aware Chunker}} \text{Sections} \xrightarrow{\text{MiniLM}} \text{Vectors} \xrightarrow{\text{Put}} \text{IndexedDB}$$
- **Chunking:** Splits on detected section/heading first, then caps long sections to ~450–500 tokens with 50-token overlap to preserve continuity across boundaries.
- **Metadata:** Each chunk records `documentId`, `sectionHeading`, `pageNumber`, `text`, and `embedding`.

### Query Time (Fully offline)
$$\text{Question} \xrightarrow{\text{MiniLM}} \text{Query Vector} \xrightarrow{\text{Cosine Sim}} \text{Top-}k \text{ Chunks} \xrightarrow{\text{Provider Chain}} \text{Answer + Citations}$$
- **Retrieval:** Brute-force cosine similarity over stored chunk vectors ($k=4\text{--}6$, minimum similarity threshold $\ge 0.35$).
- **Grounding Guard:** If no chunks clear the threshold, the app declines immediately rather than hallucinating.

---

## Data Model (IndexedDB)

### `documents` Store
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (Key) | Unique document ID |
| `name` | `string` | Original file name |
| `ingestedAt` | `number` | Unix timestamp of ingestion |
| `embeddingModelVersion` | `string` | Model version tag to prevent stale vector corruption |
| `pageCount` | `number` | Total extracted pages |
| `fileSize` | `number` | File size in bytes |

### `chunks` Store
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` (Key) | Unique chunk ID |
| `documentId` | `string` (Index) | Foreign key referencing `documents.id` |
| `sectionHeading` | `string` | Extracted section title |
| `pageNumber` | `number` | Page number in original PDF |
| `text` | `string` | Text content of chunk |
| `embedding` | `Float32Array` | 384-dimensional normalized vector |

---

## Generation & Fallback Chain

All queries pass through a single uniform provider interface:

```typescript
interface GenerationResult {
  answer: string;
  citations: Array<{ documentName: string; sectionHeading: string; pageNumber: number }>;
  mode: "on-device-model" | "extractive-fallback";
  providerName: string;
}
```

1. **Chrome Prompt API (Gemini Nano):** Checked first; hardware-accelerated local execution in supported Chromium builds.
2. **MediaPipe LLM Inference for Web:** Checked second; runs local WebGPU Gemma models.
3. **Extractive Fallback:** Guaranteed last resort; formats and returns the top retrieved technical passage verbatim with full citations.

---

## UI / Design System

A customized neumorphic design system engineered for variable railway shed lighting conditions:
- **Depth Encodes State:** Interactive elements (input, buttons) are raised; delivered answers and technical citations are pressed/inset.
- **Accessibility & Contrast:** High-contrast Iron body text (`#3A3530`) on Base parchment (`#E4DCCB`) meeting WCAG AA contrast standards.
- **Focus Rings:** Distinct Brass focus indicators (`#9C7A3C`) for clear keyboard and touch navigation.
- **Status Pill:** Visible at a glance (`● ready` vs. `matched excerpts only`).
- **Citation Strip:** Hairline-separated citation metadata (Document name, section, page number) beneath every answer.

---

## Error Handling

| Failure Scenario | Built-in Behavior |
| :--- | :--- |
| **On-device model unavailable** | Automatically cascades to Extractive Fallback mode. |
| **PDF parse failure / image-only** | Returns specific error identifying the file; does not crash batch. |
| **No relevant chunks above threshold** | Responds plainly: *"The provided documents don't cover this."* |
| **No documents loaded yet** | Prompts user with empty-state card to load manuals first. |
| **IndexedDB quota exceeded** | Surfaces specific document name and prompts removal of older files. |
| **IndexedDB unavailable** | Seamlessly switches to in-memory session store with warning banner. |
| **Embedding model version mismatch** | Prompts re-indexing to ensure vector compatibility. |
| **Generation timeout ($>25\text{s}$)** | Automatically aborts and serves verified extractive fallback. |

---

## Security

- **XSS Prevention:** All extracted text, document headings, and AI responses render as sanitized plain text.
- **Prompt Injection Defense:** Document content is treated strictly as data within delimited boundaries, never as instructions.
- **No Storage Leaks:** Strict avoidance of `localStorage` / `sessionStorage`; all state lives in `IndexedDB` or component memory.
- **Zero Telemetry:** No analytics, trackers, external logging, or third-party network pings.

---

## Tech Stack

- **Framework:** Vite 8 + React 19 + TypeScript
- **Styling:** Tailwind CSS + Neumorphic Tokens
- **PDF Extraction:** `pdf.js` 4.10
- **On-Device Embeddings:** `@xenova/transformers` (`all-MiniLM-L6-v2`)
- **Storage:** `idb` (IndexedDB Wrapper)
- **PWA Tooling:** `vite-plugin-pwa` + Workbox
- **Icons:** `lucide-react`

---

## Running Locally

### 1. Development Mode
```bash
npm install
npm run dev
```
Visit `http://localhost:5173/` in your browser.

### 2. Production PWA Build & Preview
```bash
npm run build
npm run preview
```
Visit `http://localhost:4173/` in your browser.

### 3. Verifying Offline (Airplane Mode)
1. Load the app once in Google Chrome.
2. Click **"Load DHR B-Class Spec"** to index the sample maintenance manual.
3. Open DevTools (`F12`) $\rightarrow$ **Network** $\rightarrow$ select **Offline** (or toggle device Airplane Mode).
4. Ask any maintenance question (e.g., *"What is the operating boiler pressure for the B-Class locomotive?"*).
5. Verify grounded answer, citation strip, and **zero network requests**.

---

## Deployment

The app is deployable to **Vercel**, **Netlify**, or **GitHub Pages**:
- **Vercel:** Fully configured with [`vercel.json`](file:///c:/Users/karan/OneDrive/Desktop/steam%20shed/vercel.json) for SPA rewrites, service worker caching, and MIME types.
- **Subpath Support:** Base URL dynamically configured for root and subpath hosting environments.

---

## Sample Data & Demo Questions

Pre-seeded with official specification excerpts for the **DHR B-Class Steam Locomotive (0-4-0ST)**:
- *"What is the operating boiler pressure for the B-Class locomotive?"* $\rightarrow$ 140 psi (9.65 bar), safety valves lifting at 142 psi.
- *"What is the brake block to wheel tyre clearance?"* $\rightarrow$ 4.5 mm to 6.0 mm.
- *"What is the eccentric crank pin fastening nut torque?"* $\rightarrow$ 185 Nm.
- *"What is the recommended renewal interval for fusible plugs?"* $\rightarrow$ 45 days or 1,500 km.
- *"What is the cruising speed of a Boeing 747?"* $\rightarrow$ *"The provided documents don't cover this."*

---

## Team
- **Karan Pareek** — Solo Developer
