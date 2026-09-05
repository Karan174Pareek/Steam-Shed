import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { pipeline } from '@xenova/transformers';

const SECTION_HEADER_REGEX = /^(?:section|chapter|part|item|annex)?\s*(\d+[.\d]*|[IVXLCDM]+)[\s:—–-]+([^\n]+)/i;

function detectHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90) return null;
  const match = trimmed.match(SECTION_HEADER_REGEX);
  if (match) return trimmed;
  if (trimmed.length >= 4 && trimmed.length <= 60 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function chunkExtractedPages(pages) {
  const chunks = [];
  const MAX_WORDS = 450;
  const OVERLAP_WORDS = 50;

  for (const page of pages) {
    const lines = page.text.split('\n');
    let currentHeading = `Page ${page.pageNumber} Overview`;
    let sectionBuffer = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (
        /Page\s+\d+\s+of\s+\d+/i.test(line) ||
        /Darjeeling Himalayan Railway.*Tindharia/i.test(line) ||
        /Maintenance Manual \(Sample/i.test(line)
      ) {
        continue;
      }

      const detected = detectHeading(line);
      if (detected) {
        if (sectionBuffer.length > 0) {
          const sectionText = sectionBuffer.join(' ');
          splitIntoBoundedChunks(sectionText, currentHeading, page.pageNumber, MAX_WORDS, OVERLAP_WORDS, chunks);
          sectionBuffer = [];
        }
        currentHeading = detected;
      } else {
        sectionBuffer.push(line);
      }
    }

    if (sectionBuffer.length > 0) {
      const sectionText = sectionBuffer.join(' ');
      splitIntoBoundedChunks(sectionText, currentHeading, page.pageNumber, MAX_WORDS, OVERLAP_WORDS, chunks);
    }
  }

  return chunks;
}

function splitIntoBoundedChunks(text, heading, pageNumber, maxWords, overlapWords, outputChunks) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return;

  if (words.length <= maxWords) {
    outputChunks.push({
      sectionHeading: heading,
      pageNumber,
      text: words.join(' '),
    });
    return;
  }

  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    const sliceWords = words.slice(start, end);
    outputChunks.push({
      sectionHeading: heading,
      pageNumber,
      text: sliceWords.join(' '),
    });
    if (end >= words.length) break;
    start += maxWords - overlapWords;
  }
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const QUESTIONS = [
  { id: 1, q: "What is the torque on the injector fitting?", expectedSec: "3.1", expectedPage: 2 },
  { id: 2, q: "What is the safety valve set pressure?", expectedSec: "2.1", expectedPage: 2 },
  { id: 3, q: "What's the brake rigging pin torque?", expectedSec: "4.1", expectedPage: 3 },
  { id: 4, q: "How often should the boiler be washed out?", expectedSec: "2.2", expectedPage: 2 },
  { id: 5, q: "How often should brake rigging be inspected?", expectedSec: "4.2", expectedPage: 3 },
  { id: 6, q: "How often should injector fittings be inspected?", expectedSec: "3.2", expectedPage: 2 },
  { id: 7, q: "What's the nominal wheel tread diameter?", expectedSec: "5.1", expectedPage: 3 },
  { id: 8, q: "How much wheel wear is allowed before reprofiling?", expectedSec: "5.1", expectedPage: 3 },
  { id: 9, q: "What's the axle box bearing clearance?", expectedSec: "5.2", expectedPage: 3 },
  { id: 10, q: "What's the coupling rod bearing clearance?", expectedSec: "6.2", expectedPage: 4 },
  { id: 11, q: "What lubricant do the main rod bearings need?", expectedSec: "6.1", expectedPage: 4 },
  { id: 12, q: "How often should valve gear pins and links be lubricated?", expectedSec: "6.1", expectedPage: 4 },
  { id: 13, q: "What are the steps to inspect brake rigging?", expectedSec: "4.3", expectedPage: 3 },
  { id: 14, q: "What are the steps to replace piston rod packing?", expectedSec: "7.1", expectedPage: 4 },
  { id: 15, q: "How often should piston rod packing be checked for leaks?", expectedSec: "7.2", expectedPage: 4 },
  { id: 16, q: "What's the part number for the injector delivery fitting union nut?", expectedSec: "8.", expectedPage: 4 },
  { id: 17, q: "What's the part number for the brake rigging clevis pin?", expectedSec: "8.", expectedPage: 4 },
  { id: 18, q: "What's the part number for the axle box bearing shell?", expectedSec: "8.", expectedPage: 4 },
];

const NOT_COVERED = [
  "What's the tender water capacity?",
  "What torque should the smokebox door dogs be set to?",
  "Who manufactured this locomotive class?"
];

async function runBenchmark() {
  const pdfPath = path.resolve('public/sample-manuals/bclass_maintenance_manual_sample.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const pdfDoc = await loadingTask.promise;

  const pages = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const textContent = await page.getTextContent();
    const lines = [];
    let currentLine = '';
    let lastY = null;
    for (const item of textContent.items) {
      if ('str' in item) {
        const y = item.transform[5];
        if (lastY === null || Math.abs(y - lastY) < 5) {
          currentLine += (currentLine.length > 0 && !currentLine.endsWith(' ') ? ' ' : '') + item.str;
        } else {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = item.str;
        }
        lastY = y;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    pages.push({ pageNumber: i, text: lines.join('\n') });
  }

  console.log(`Extracted ${pages.length} pages from PDF.`);
  const rawChunks = chunkExtractedPages(pages);
  console.log(`Generated ${rawChunks.length} section chunks.`);
  rawChunks.forEach((c, idx) => {
    console.log(`Chunk ${idx+1}: [p.${c.pageNumber}] ${c.sectionHeading}`);
  });

  console.log('\nLoading embedding model...');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { quantized: true });
  
  const chunkEmbeddings = [];
  for (const c of rawChunks) {
    const output = await embedder(`${c.sectionHeading}: ${c.text}`, { pooling: 'mean', normalize: true });
    chunkEmbeddings.push(Array.from(output.data));
  }

  console.log('\n=== RUNNING 18 BENCHMARK QUESTIONS ===\n');
  const results = [];
  for (const item of QUESTIONS) {
    const qOutput = await embedder(item.q, { pooling: 'mean', normalize: true });
    const qVec = Array.from(qOutput.data);

    let bestChunk = null;
    let bestSim = -1;
    for (let i = 0; i < rawChunks.length; i++) {
      const sim = cosineSimilarity(qVec, chunkEmbeddings[i]);
      if (sim > bestSim) {
        bestSim = sim;
        bestChunk = rawChunks[i];
      }
    }

    const passed = bestSim >= 0.35 && bestChunk.pageNumber === item.expectedPage;
    results.push({
      id: item.id,
      q: item.q,
      topHeading: bestChunk.sectionHeading,
      topPage: bestChunk.pageNumber,
      similarity: bestSim.toFixed(3),
      expectedPage: item.expectedPage,
      passed,
      text: bestChunk.text
    });
    console.log(`Q${item.id}: "${item.q}" -> Sim: ${bestSim.toFixed(3)} | Section: "${bestChunk.sectionHeading}" | Page: p.${bestChunk.pageNumber} [Expected: p.${item.expectedPage}] ${passed ? '✓ PASS' : '✗ FAIL'}`);
  }

  console.log('\n=== RUNNING 3 NOT COVERED QUESTIONS ===\n');
  for (const q of NOT_COVERED) {
    const qOutput = await embedder(q, { pooling: 'mean', normalize: true });
    const qVec = Array.from(qOutput.data);

    let bestSim = -1;
    let bestChunk = null;
    for (let i = 0; i < rawChunks.length; i++) {
      const sim = cosineSimilarity(qVec, chunkEmbeddings[i]);
      if (sim > bestSim) {
        bestSim = sim;
        bestChunk = rawChunks[i];
      }
    }
    const isRefused = bestSim < 0.35;
    console.log(`Refusal Test: "${q}" -> Top Sim: ${bestSim.toFixed(3)} | ${isRefused ? '✓ REFUSED (<0.35 threshold)' : '⚠️ Scored ' + bestSim.toFixed(3)}`);
  }

  fs.writeFileSync('benchmark_results.json', JSON.stringify(results, null, 2));
}

runBenchmark().catch(console.error);
