import type { GenerationProvider, GenerationResult } from './types';
import type { RetrievedChunk } from '../retrieval';
import { buildRagPrompt } from './promptTemplate';

// Define minimal Window.ai typing
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        capabilities: () => Promise<{ available: string }>;
        create: (options?: { systemPrompt?: string }) => Promise<{
          prompt: (text: string) => Promise<string>;
          destroy?: () => void;
        }>;
      };
      createTextSession?: () => Promise<{
        prompt: (text: string) => Promise<string>;
        destroy?: () => void;
      }>;
    };
  }
}

export class ChromePromptProvider implements GenerationProvider {
  name = 'Chrome Prompt API (Gemini Nano)';

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ai) {
      return false;
    }

    try {
      const checkPromise = (async () => {
        if (window.ai?.languageModel?.capabilities) {
          const caps = await window.ai.languageModel.capabilities();
          return caps.available === 'readily' || caps.available === 'after-download';
        }
        if (typeof window.ai?.createTextSession === 'function') {
          return true;
        }
        return false;
      })();

      // Fast check, 5s timeout
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

    // Timeout after 25s so user never hangs indefinitely
    const generatePromise = (async () => {
      let session: { prompt: (text: string) => Promise<string>; destroy?: () => void } | null = null;
      try {
        if (window.ai?.languageModel?.create) {
          session = await window.ai.languageModel.create();
        } else if (window.ai?.createTextSession) {
          session = await window.ai.createTextSession();
        }

        if (!session) {
          throw new Error('Could not create Chrome AI session');
        }

        const rawAnswer = await session.prompt(fullPrompt);
        return {
          answer: rawAnswer.trim(),
          citations,
          mode: 'on-device-model' as const,
          providerName: this.name,
        };
      } finally {
        if (session?.destroy) {
          try {
            session.destroy();
          } catch {
            // ignore cleanup errors
          }
        }
      }
    })();

    const timeoutPromise = new Promise<GenerationResult>((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout reached on Chrome Prompt API')), 25000);
    });

    return await Promise.race([generatePromise, timeoutPromise]);
  }
}
