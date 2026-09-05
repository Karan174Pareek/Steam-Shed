import { embedText } from '../embedding';
import { getAllChunks, getAllDocuments, type ChunkRecord } from '../storage';
import { cosineSimilarity } from './vectorMath';

export interface RetrievedChunk {
  chunk: ChunkRecord;
  documentName: string;
  similarity: number;
}

export interface RetrievalOptions {
  k?: number;
  minSimilarity?: number;
}

const DEFAULT_K = 5;
const DEFAULT_MIN_SIMILARITY = 0.35;

/**
 * Retrieves top-k most relevant chunks for a question using brute-force cosine similarity.
 * Returns empty array if no chunks meet the threshold.
 */
export async function retrieve(
  question: string,
  opts?: RetrievalOptions
): Promise<RetrievedChunk[]> {
  const k = opts?.k ?? DEFAULT_K;
  const minSimilarity = opts?.minSimilarity ?? DEFAULT_MIN_SIMILARITY;

  const [chunks, documents] = await Promise.all([
    getAllChunks(),
    getAllDocuments(),
  ]);

  if (chunks.length === 0) {
    return [];
  }

  // Build document id to name lookup
  const docNameMap = new Map<string, string>();
  for (const doc of documents) {
    docNameMap.set(doc.id, doc.name);
  }

  // Embed the query using the exact same on-device model
  const queryEmbedding = await embedText(question);

  // Compute similarity for all chunks
  const scoredChunks: RetrievedChunk[] = [];
  for (const chunk of chunks) {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    if (similarity >= minSimilarity) {
      scoredChunks.push({
        chunk,
        documentName: docNameMap.get(chunk.documentId) || 'Unknown Document',
        similarity,
      });
    }
  }

  // Sort descending by similarity
  scoredChunks.sort((a, b) => b.similarity - a.similarity);

  // Return top-k
  return scoredChunks.slice(0, k);
}
