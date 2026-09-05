import { pipeline, env } from '@xenova/transformers';

export const EMBEDDING_MODEL_VERSION = 'xenova-all-minilm-l6-v2-q8-v1';
export const EMBEDDING_MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

// Ensure browser-friendly settings for on-device inference
env.allowLocalModels = false;
env.useBrowserCache = true;

// Pipeline instance singleton
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let embeddingPipeline: any = null;
let pipelineLoadingPromise: Promise<any> | null = null;

export type ProgressCallback = (progress: { status: string; progress?: number; file?: string }) => void;

/**
 * Loads and returns the feature-extraction pipeline singleton.
 */
export async function getEmbeddingPipeline(onProgress?: ProgressCallback) {
  if (embeddingPipeline) {
    return embeddingPipeline;
  }

  if (pipelineLoadingPromise) {
    return pipelineLoadingPromise;
  }

  pipelineLoadingPromise = (async () => {
    try {
      const pipe = await pipeline('feature-extraction', EMBEDDING_MODEL_NAME, {
        quantized: true,
        progress_callback: (p: any) => {
          if (onProgress) {
            onProgress(p);
          }
        },
      });
      embeddingPipeline = pipe;
      return pipe;
    } catch (err) {
      pipelineLoadingPromise = null;
      console.error('Failed to initialize Transformers.js embedding model:', err);
      throw new Error(`Embedding model load failure: ${err instanceof Error ? err.message : String(err)}`);
    }
  })();

  return pipelineLoadingPromise;
}

/**
 * Computes a 384-dimensional normalized Float32Array embedding vector for input text.
 */
export async function embedText(text: string): Promise<Float32Array> {
  const pipe = await getEmbeddingPipeline();
  
  // Mean pooling with normalization
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  
  // Transformers.js output.data is Float32Array
  if (output && output.data) {
    return new Float32Array(output.data);
  }
  
  throw new Error('Embedding generation returned empty data');
}

/**
 * Batch embed multiple chunks sequentially or in small batches to preserve memory
 */
export async function embedChunksBatch(
  texts: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Float32Array[]> {
  const results: Float32Array[] = [];
  const pipe = await getEmbeddingPipeline();

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    results.push(new Float32Array(output.data));
    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
  }

  return results;
}
