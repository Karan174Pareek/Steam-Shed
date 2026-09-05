import type { GenerationProvider, GenerationResult } from './types';
import type { RetrievedChunk } from '../retrieval';
import { buildRagPrompt } from './promptTemplate';

export class MediaPipeLLMProvider implements GenerationProvider {
  name = 'MediaPipe LLM Inference (WebGPU)';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // MediaPipe LLM requires WebGPU support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(navigator as any).gpu) {
      return false;
    }

    try {
      const checkPromise = (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adapter = await (navigator as any).gpu.requestAdapter();
        if (!adapter) return false;

        // Check if pre-cached model is initialized in window context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return !!(window as any).__mediapipe_llm_ready__;
      })();

      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 5000);
      });

      return await Promise.race([checkPromise, timeoutPromise]);
    } catch {
      return false;
    }
  }

  async generate(question: string, chunks: RetrievedChunk[]): Promise<GenerationResult> {
    const fullPrompt = buildRagPrompt(question, chunks);

    const citations = chunks.map((c) => ({
      documentName: c.documentName,
      sectionHeading: c.chunk.sectionHeading,
      pageNumber: c.chunk.pageNumber,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const engine = (window as any).__mediapipe_llm_engine__;
    if (!engine || typeof engine.generateResponse !== 'function') {
      throw new Error('MediaPipe LLM engine not initialized');
    }

    const responseText = await engine.generateResponse(fullPrompt);

    return {
      answer: responseText.trim(),
      citations,
      mode: 'on-device-model',
      providerName: this.name,
    };
  }
}
