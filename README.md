# Steam-Shed Assistant

**Offline, On-Device Technical Reference & Q&A Assistant for Darjeeling Himalayan Railway (DHR)**

> Built for **Code for Communities — DHR Edition (GDG Siliguri)**  
> Problem Statement: **C2 — Steam-Shed Assistant**  
> Target Venue: **Tindharia Locomotive Shed & Permanent-Way Maintenance**

---

## 1. Overview

Shed mechanics, fitters, and permanent-way staff at DHR Tindharia often work with their hands occupied, standing by narrow-gauge B-Class steam locomotives (0-4-0ST) under spotty or non-existent mountain cellular connectivity.

**Steam-Shed Assistant** is an installable, offline-first Progressive Web Application (PWA) that runs the entire document retrieval and question-answering pipeline **100% inside the browser on the user's device**. It performs client-side PDF text extraction, heading-aware chunking, on-device vector embedding, cosine similarity ranking, and grounded answer synthesis or verified excerpt extraction.

---

## 2. Event Disclosures & Model Specifications (Required)

### A. Exact On-Device Models Used
1. **On-Device Embedding Model**:
   - Model: **`Xenova/all-MiniLM-L6-v2`** (int8 quantized)
   - Runtime: `@xenova/transformers` running client-side via WebAssembly (WASM).
   - Output: 384-dimensional normalized dense vectors.
   - Storage: Vectors and metadata are stored exclusively on-device in browser `IndexedDB` under version key `xenova-all-minilm-l6-v2-q8-v1`.

2. **On-Device Generation Layer**:
   - **Provider 1 (Chrome Prompt API)**: Checks `window.ai.languageModel` for local Gemini Nano hardware acceleration (5s availability timeout).
   - **Provider 2 (MediaPipe LLM Inference for Web)**: WebGPU-accelerated on-device Gemma inference (5s availability timeout).
   - **Provider 3 (Deterministic Extractive Fallback)**: Guaranteed last-resort fallback that requires zero GPU/model overhead and never fails.

### B. Offline Behavior Requirement
- **One Initial Online Load**: The app requires a single successful initial page load while connected to the internet to pre-cache the PWA application shell (HTML, JavaScript, CSS, PDF worker) and download the quantized sentence embedding model weights into the browser's persistent cache.
- **Subsequent Offline Operation**: Once loaded, the app operates completely offline (e.g., in Airplane Mode). All subsequent document uploads, PDF parsing, vector indexing, searches, and answer generation make **zero network requests**.

### C. Plain Language Explanation of Extractive Fallback
When an on-device neural model is not supported by the browser, lacks WebGPU acceleration, or fails to generate within the 25-second safeguard timeout, the application activates its **Extractive Fallback mode**:
- Rather than leaving the shed mechanic with an indefinite spinner or crashing, the app directly identifies the top matching technical paragraph from the ingested manuals using cosine similarity.
- It displays this excerpt verbatim, accompanied by the exact document name, section title, and page number.
- The UI explicitly displays the badge `[matched excerpt]` alongside the answer so staff always know whether they are reading an AI synthesis or a verbatim excerpt directly from the official manual.

---

## 3. Key Technical Capabilities

- **Zero Runtime Server Calls**: No backend, no proxy, no cloud APIs, and no telemetry.
- **Strict Grounding & Hallucination Guard**: The system prompt prohibits answering from external knowledge. If a query cannot be answered by the ingested documents (or similarity score is below threshold), the app responds plainly: *"The provided documents don't cover this."*
- **Tactile Neumorphic Design**: Built to custom specifications matching railway shed lighting conditions:
  - Base tone: `#E4DCCB` / `#EDE6D6`
  - High-contrast body text in Iron (`#3A3530`) meeting WCAG AA accessibility standards.
  - Interactive controls are tactile and raised; answers are inset/pressed.
  - Singular Brass accent (`#9C7A3C`) reserved strictly for active focus rings and ready indicators.
- **Fault-Tolerant Storage**: IndexedDB persistence with quota warnings, document deletion with cascading chunk cleanup, and an automatic in-memory session store fallback if IndexedDB is disabled.
- **Demo Ready**: Pre-seeded with a comprehensive sample technical specification for the DHR B-Class Locomotive (`public/sample-manuals/DHR_B_Class_Loco_Maintenance_Spec.pdf`).

---

## 4. Getting Started & Verification

### Development Server
```bash
npm install
npm run dev
```

### Production Build & Preview
```bash
npm run build
npm run preview
```
Visit `http://localhost:4173/` in your browser.

### Verifying Airplane Mode (Offline)
1. Open the preview URL in Google Chrome.
2. Click **"Load DHR B-Class Spec"** on the welcome plate to index the sample manual.
3. Open DevTools (`F12`), switch to the **Network** tab, and toggle **Offline** (or enable Airplane Mode on your device).
4. Ask a maintenance question:
   - *"What is the operating boiler pressure for the B-Class locomotive?"*
   - Expected answer: Grounded reference to 140 psi (9.65 bar) and twin Ramsbottom safety valves lifting at 142 psi, with page & section citations.
5. Ask an out-of-scope question:
   - *"What is the cruising speed of an Airbus A320?"*
   - Expected answer: *"The provided documents don't cover this."*
6. Observe the DevTools Network panel: **zero outgoing network requests**.

---

## 5. Swapping In Official Documents

To swap out the placeholder sample specification for official DHR documents:
- Place new PDF files into `public/sample-manuals/` and update the reference in `src/App.tsx` under the clearly marked `INTEGRATION POINT` comment.
- Or use the **"Select PDF Manual"** button in the UI to upload and index any maintenance PDF directly on the device.
