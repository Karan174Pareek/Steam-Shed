import type { GenerationProvider, GenerationResult } from './types';
import type { RetrievedChunk } from '../retrieval';

/**
 * Formats extractive text for optimal scannability:
 * - Removes any raw quotation marks or legacy bracket artifacts.
 * - Formats numbered steps or distinct clauses onto separate lines.
 * - Ensures the mechanic can read key numbers, intervals, and steps at a glance.
 */
function formatExtractiveAnswer(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.trim();

  // Strip leading/trailing quotation marks if present
  if (text.startsWith('"') && text.endsWith('"') && text.length > 2) {
    text = text.slice(1, -1).trim();
  }

  // If text contains numbered steps like "1. ... 2. ... 3. ...", format each step on its own line
  if (/\b\d+\.\s+/.test(text)) {
    return text
      .split(/(?=\b\d+\.\s+)/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n');
  }

  // Format distinct bullet or labeled clauses onto clean separate lines
  if (text.includes(' • ') || text.includes(' \u2022 ')) {
    return text
      .split(/\s*[•\u2022]\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n• ');
  }

  // If text contains multiple distinct sentences ending in period/colon, format cleanly
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 1) {
    return sentences.join('\n');
  }

  return text;
}

export class ExtractiveFallbackProvider implements GenerationProvider {
  name = 'Extractive Fallback (Direct Match)';

  async isAvailable(): Promise<boolean> {
    // Guaranteed last resort — always available, runs instantly without network or external model
    return true;
  }

  async generate(_question: string, chunks: RetrievedChunk[]): Promise<GenerationResult> {
    if (!chunks || chunks.length === 0) {
      return {
        answer: "The provided documents don't cover this.",
        citations: [],
        mode: 'extractive-fallback',
        providerName: this.name,
      };
    }

    const topChunk = chunks[0];
    const cleanAnswer = formatExtractiveAnswer(topChunk.chunk.text);

    const citations = chunks.map((c) => ({
      documentName: c.documentName,
      sectionHeading: c.chunk.sectionHeading,
      pageNumber: c.chunk.pageNumber,
    }));

    return {
      answer: cleanAnswer,
      citations,
      mode: 'extractive-fallback',
      providerName: this.name,
    };
  }
}
