import type { ExtractedPage } from './pdfParser';

export interface RawChunk {
  sectionHeading: string;
  pageNumber: number;
  text: string;
}

const SECTION_HEADER_REGEX = /^(?:section|chapter|part|item|annex)?\s*(\d+[.\d]*|[IVXLCDM]+)[\s:—–-]+([^\n]+)/i;

/**
 * Checks if a line is likely a section heading.
 */
function detectHeading(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 90) return null;

  // Pattern: Section 1.1 - Foo or 1.1 Foo
  const match = trimmed.match(SECTION_HEADER_REGEX);
  if (match) {
    return trimmed;
  }

  // ALL CAPS short line (at least 4 chars)
  if (trimmed.length >= 4 && trimmed.length <= 60 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Chunks a list of extracted pages by section heading first,
 * then enforces a hard limit of ~450 words with ~50 words overlap.
 */
export function chunkExtractedPages(pages: ExtractedPage[]): RawChunk[] {
  const chunks: RawChunk[] = [];
  const MAX_WORDS = 450;
  const OVERLAP_WORDS = 50;

  for (const page of pages) {
    const lines = page.text.split('\n');
    let currentHeading = `Page ${page.pageNumber} Overview`;
    let sectionBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip running header and page footer lines
      if (
        /Page\s+\d+\s+of\s+\d+/i.test(line) ||
        /Darjeeling Himalayan Railway.*Tindharia/i.test(line) ||
        /Maintenance Manual \(Sample\)/i.test(line)
      ) {
        continue;
      }

      const detected = detectHeading(line);
      if (detected) {
        // If we have accumulated text before this heading, chunk it
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

/**
 * Sub-chunks text if it exceeds MAX_WORDS, maintaining overlap.
 */
function splitIntoBoundedChunks(
  text: string,
  heading: string,
  pageNumber: number,
  maxWords: number,
  overlapWords: number,
  outputChunks: RawChunk[]
) {
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

  // Sliding window with overlap
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
