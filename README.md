# Steam-Shed Assistant

**Offline, on-device Q&A over Darjeeling Himalayan Railway locomotive and rolling-stock maintenance documentation.**

> Built for **Code for Communities — DHR Edition (GDG Siliguri)**  
> Problem Statement: **C2 — Steam-Shed Assistant**  
> Target Venue: **Tindharia Locomotive Shed & Permanent-Way Maintenance**

Ask a question like *"What's the torque on this fitting?"* and get an answer grounded in the actual manual — no signal required, straight from the shed at Tindharia.

---

## Table of Contents
- [Video Demo](#-video-demo)
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

## 🎥 Video Demo

[![Watch Demo on Google Drive](https://img.shields.io/badge/Demo_Video-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/drive/folders/1L_T2f4e6aRpJd2gROqaMF0XmgjReTd9K?usp=sharing)

Watch the full screen recording walkthrough on Google Drive:  
🔗 **[Steam-Shed Assistant — Video Walkthrough](https://drive.google.com/drive/folders/1L_T2f4e6aRpJd2gROqaMF0XmgjReTd9K?usp=sharing)**

---

## The Problem
Permanent-way and loco-shed staff at DHR work from paper manuals or scattered PDFs, with no fast way to find a specific fact — *"what's the torque on this fitting?"* — without flipping through pages, and no reliable cellular signal in mountain terrain to rely on a cloud tool. **Steam-Shed Assistant** answers that question directly from technical maintenance documentation, entirely on the device, with the verified source shown underneath every answer.

---

## Required Disclosures (Per Event Submission Rules)

### On-Device Model(s) Used
- **Embeddings:** `Transformers.js` running a quantized MiniLM-class sentence embedding model (`Xenova/all-MiniLM-L6-v2`), used on-device for both document indexing and query retrieval.
- **Generation:**
  1. *Provider 1:* Chrome's built-in **Prompt API** (Gemini Nano) where available.
  2. *Provider 2:* **MediaPipe LLM Inference for Web** (Gemma variant) as a second hardware-accelerated path (with instant fallback to Provider 3 if WebGPU is unsupported on low-end devices).
  3. *Provider 3:* **Extractive Fallback** (Direct verified excerpt extraction).

### Minimum Device Tested
- Tested and verified on **Chrome 128+ (Desktop / Android 14)** with 4GB+ RAM and standard WebAssembly / WebGPU support. Degrades seamlessly to Extractive Fallback on devices lacking WebGPU hardware acceleration.

### What Happens When the Model Is Unavailable
The app gracefully falls back to **Extractive Mode** — instead of an AI summary, it displays the best-matching excerpt directly from the source document accompanied by its exact citation (document, section, page). The app never displays a blank screen or unhandled error; every question receives either an AI-synthesized answer, a matched excerpt, or an honest *"The provided documents don't cover this."* response.

### Note on Sample Documentation
The bundled technical manual (`bclass_maintenance_manual_sample.pdf`) is a **sample/placeholder technical specification** generated for evaluating the RAG pipeline. It contains representative torque limits, pressure settings, running clearances, maintenance intervals, procedures, and spare part numbers. It is designed to be replaced with official DHR documentation once confirmed by organizers.

---

## How It Works
1. **Load Maintenance PDFs:** Upload custom PDFs or tap **"Load DHR B-Class Spec"** (or tap any suggested question chip to auto-seed the sample manual and answer in one tap).
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
| **UI** | React 19 + Tailwind CSS | Component modularity, responsive tactile neumorphic design |
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
- **Chunking:** Splits on detected section/heading first, then caps long sections to ~450 words with 50-word overlap to preserve continuity across boundaries.
- **Post-Ingestion Summary:** Displays a confirmation line under document cards (e.g. `4 pages · 17 sections indexed`).

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
| `chunkCount` | `number` | Number of section chunks indexed |
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
2. **MediaPipe LLM Inference for Web:** Checked second; runs local WebGPU Gemma models (fails fast to Provider 3 if WebGPU is absent).
3. **Extractive Fallback:** Guaranteed last resort; formats and returns the top retrieved technical passage verbatim with full citations.

---

## UI / Design System

A customized neumorphic design system engineered for variable railway shed lighting conditions:
- **Tagline:** Visible under the title: *"Ask about torque, intervals, and procedures — works fully offline"*.
- **Depth Encodes State:** Interactive elements (input, buttons) are raised; delivered answers and technical citations are pressed/inset.
- **Accessibility & Contrast:** High-contrast Iron body text (`#3A3530`) on Base parchment (`#E4DCCB`) meeting WCAG AA contrast standards.
- **Focus Rings:** Distinct Brass focus indicators (`#9C7A3C`) for clear keyboard and touch navigation.
- **Status Pill:** Visible at a glance (`● ready` vs. `matched excerpts only`).
- **Citation Strip:** Hairline-separated citation metadata (Document name, section, page number) beneath every answer.

---

## Verified Benchmark Results (All 18 Questions + 3 Refusal Tests)

Tested directly against `bclass_maintenance_manual_sample.pdf` using the real on-device retrieval pipeline:

| # | Question | Grounded Answer / Excerpt | Observed Section & Citation |
|---|---|---|---|
| 1 | What is the torque on the injector fitting? | 85 lb-ft (115 N·m) | § 3.1 Injector Fitting Torque Specification, p.2 |
| 2 | What is the safety valve set pressure? | 160 psi (11.0 bar), lift within ±2 psi | § 2.1 Safety Valve Pressure Setting, p.2 |
| 3 | What's the brake rigging pin torque? | 45 lb-ft (61 N·m), do not exceed 50 lb-ft | § 4.1 Brake Rigging Pin Torque, p.3 |
| 4 | How often should the boiler be washed out? | Every 30 days or 1,500 km | § 2.2 Boiler Washout Interval, p.2 |
| 5 | How often should brake rigging be inspected? | Every 30 days or 1,000 km | § 4.2 Brake Rigging Inspection Interval, p.3 |
| 6 | How often should injector fittings be inspected? | Every 7 days of service | § 3.2 Injector Inspection Interval, p.2 |
| 7 | What's the nominal wheel tread diameter? | 508 mm (20 in) | § 5.1 Wheel Tread Diameter & Tolerance, p.3 |
| 8 | How much wheel wear is allowed before reprofiling? | Maximum 6 mm reduction from nominal diameter | § 5.1 Wheel Tread Diameter & Tolerance, p.3 |
| 9 | What's the axle box bearing clearance? | 0.15–0.25 mm | § 5.2 Axle Bearing Clearance, p.3 |
| 10 | What's the coupling rod bearing clearance? | 0.10–0.20 mm | § 6.2 Coupling Rod Bearing Clearance, p.4 |
| 11 | What lubricant do the main rod bearings need? | Grade EP-2 grease | § 6.1 Valve Gear Lubrication Schedule, p.4 |
| 12 | How often should valve gear pins and links be lubricated? | Every 100 km or daily | § 6.1 Valve Gear Lubrication Schedule, p.4 |
| 13 | What are the steps to inspect brake rigging? | 6-step procedure: chock locomotive, inspect pins/brackets, check torque (45 lb-ft), measure shoe thickness, test cylinder stroke, log findings | § 4.3 Brake Rigging Inspection Procedure, p.3 |
| 14 | What are the steps to replace piston rod packing? | 6-step procedure: isolate cylinder, remove gland nuts, inspect rod surface, fit rings staggered 90°, tighten snug, test run under steam | § 7.1 Piston Rod Packing Replacement Procedure, p.4 |
| 15 | How often should piston rod packing be checked for leaks? | Every 14 days of service | § 7.2 Piston Rod Packing Inspection Interval, p.4 |
| 16 | What's the part number for the injector delivery fitting union nut? | Part No. BC-INJ-014 (brass, 3/4in BSP) | § 8.1 Injector Spare Part Number Reference, p.4 |
| 17 | What's the part number for the brake rigging clevis pin? | Part No. BC-BRK-027 (case-hardened steel) | § 8.2 Brake Rigging Spare Part Number Reference, p.4 |
| 18 | What's the part number for the axle box bearing shell? | Part No. BC-AXL-009 (order in pairs) | § 8.3 Axle Box Spare Part Number Reference, p.4 |

### Negative / Refusal Guard Verification
| Refusal Test Question | System Response | Verification Status |
| :--- | :--- | :--- |
| *"What's the tender water capacity?"* | *"The provided documents don't cover this."* | **PASS** (Similarity $<0.35$ threshold) |
| *"What torque should the smokebox door dogs be set to?"* | *"The provided documents don't cover this."* | **PASS** (Prompt Refusal Guard Active) |
| *"Who manufactured this locomotive class?"* | *"The provided documents don't cover this."* | **PASS** (Prompt Refusal Guard Active) |

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
4. Ask any maintenance question (e.g., *"What is the torque on the injector fitting?"*).
5. Verify grounded answer, citation strip, and **zero network requests**.

---

## Deployment

The app is deployable to **Vercel**, **Netlify**, or **GitHub Pages**:
- **Vercel:** Fully configured with [`vercel.json`](file:///c:/Users/karan/OneDrive/Desktop/steam%20shed/vercel.json) for SPA rewrites, service worker caching, and MIME types.
- **Subpath Support:** Base URL dynamically configured for root and subpath hosting environments.

---

## Team
- **Karan Pareek** — Solo Developer
