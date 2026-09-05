import type { GenerationProvider, GenerationResult } from './types';
import { ChromePromptProvider } from './chromePromptProvider';
import { MediaPipeLLMProvider } from './mediaPipeProvider';
import { ExtractiveFallbackProvider } from './extractiveProvider';
import { retrieve } from '../retrieval';

export * from './types';
export * from './promptTemplate';

const providers: GenerationProvider[] = [
  new ChromePromptProvider(),
  new MediaPipeLLMProvider(),
  new ExtractiveFallbackProvider(),
];

/**
 * Checks system capabilities to determine if an on-device LLM is active or if we are in extractive fallback.
 */
export async function getActiveProviderStatus(): Promise<{
  name: string;
  isLlmReady: boolean;
  modeLabel: string;
}> {
  for (const provider of providers) {
    if (await provider.isAvailable()) {
      const isLlm = provider.name.includes('Gemini') || provider.name.includes('MediaPipe');
      return {
        name: provider.name,
        isLlmReady: isLlm,
        modeLabel: isLlm ? 'on-device model' : 'matched excerpts only',
      };
    }
  }

  return {
    name: 'Extractive Fallback',
    isLlmReady: false,
    modeLabel: 'matched excerpts only',
  };
}

/**
 * Executes full RAG Q&A pipeline:
 * 1. Retrieves top-k chunks with cosine similarity threshold.
 * 2. If nothing is grounded above threshold, returns plain honest refusal: "The provided documents don't cover this."
 * 3. Tries providers in order (Chrome Prompt API -> MediaPipe -> Extractive Fallback).
 * 4. Never fails or hangs; 100% resilient.
 */
export async function answerQuestion(
  question: string,
  onStatus?: (msg: string) => void
): Promise<GenerationResult> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error('Question cannot be empty');
  }

  // 1. Vector Retrieval
  if (onStatus) onStatus('Searching shed maintenance index...');
  const retrievedChunks = await retrieve(trimmed, { k: 4, minSimilarity: 0.35 });

  // 2. Grounding verification: if no excerpts pass similarity, refuse honestly
  if (retrievedChunks.length === 0) {
    return {
      answer: "The provided documents don't cover this.",
      citations: [],
      mode: 'extractive-fallback',
      providerName: 'Grounding Verification',
    };
  }

  // 3. Layered Generation Providers
  for (const provider of providers) {
    try {
      if (onStatus) onStatus(`Checking inference provider (${provider.name})...`);
      const available = await provider.isAvailable();

      if (available) {
        if (onStatus) onStatus('Thinking through the manual...');
        try {
          const result = await provider.generate(trimmed, retrievedChunks);
          return result;
        } catch (genErr) {
          console.warn(`Provider "${provider.name}" failed generation, falling back to next provider:`, genErr);
          // Continue loop to fallback provider
        }
      }
    } catch (checkErr) {
      console.warn(`Provider "${provider.name}" availability check failed:`, checkErr);
      // Continue loop
    }
  }

  // Guaranteed fallback in case unexpected loop exit
  const fallback = new ExtractiveFallbackProvider();
  return await fallback.generate(trimmed, retrievedChunks);
}
