import type { GenerationProvider, GenerationResult } from './types';
import type { RetrievedChunk } from '../retrieval';

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
    const answer = `[${topChunk.documentName} — ${topChunk.chunk.sectionHeading}, p.${topChunk.chunk.pageNumber}]\n"${topChunk.chunk.text}"`;

    const citations = chunks.map((c) => ({
      documentName: c.documentName,
      sectionHeading: c.chunk.sectionHeading,
      pageNumber: c.chunk.pageNumber,
    }));

    return {
      answer,
      citations,
      mode: 'extractive-fallback',
      providerName: this.name,
    };
  }
}
