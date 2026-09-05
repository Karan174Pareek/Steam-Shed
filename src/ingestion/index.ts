import { parsePdfFile } from './pdfParser';
import { chunkExtractedPages } from './chunker';
import { embedChunksBatch, EMBEDDING_MODEL_VERSION } from '../embedding';
import { saveDocument, saveChunks, type DocumentRecord, type ChunkRecord } from '../storage';

export interface IngestResult {
  documentId: string;
  documentName: string;
  chunkCount: number;
  success: boolean;
  error?: string;
}

export type IngestionProgress = (status: string, current?: number, total?: number) => void;

/**
 * Ingests a PDF document: parses text, creates heading-aware chunks,
 * computes on-device embeddings, and persists to IndexedDB.
 *
 * Guaranteed never to throw uncaught exceptions; errors are returned in IngestResult.
 */
export async function ingestDocument(
  file: File,
  onProgress?: IngestionProgress
): Promise<IngestResult> {
  const documentId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const documentName = file.name;

  try {
    if (onProgress) onProgress(`Reading "${file.name}" with PDF engine...`);

    // 1. Parse PDF pages
    let parsedDoc;
    try {
      parsedDoc = await parsePdfFile(file);
    } catch (parseErr) {
      console.error(`PDF parse failure for ${file.name}:`, parseErr);
      return {
        documentId,
        documentName,
        chunkCount: 0,
        success: false,
        error: `Could not read "${file.name}" — the file may be corrupted or password-protected.`,
      };
    }

    // 2. Validate extractable text
    if (!parsedDoc.pages.length || parsedDoc.totalTextLength === 0) {
      return {
        documentId,
        documentName,
        chunkCount: 0,
        success: false,
        error: `Could not read "${file.name}" — the file may be image-only or corrupted.`,
      };
    }

    // 3. Section-aware chunking
    if (onProgress) onProgress(`Segmenting sections in "${file.name}"...`);
    const rawChunks = chunkExtractedPages(parsedDoc.pages);

    if (rawChunks.length === 0) {
      return {
        documentId,
        documentName,
        chunkCount: 0,
        success: false,
        error: `Could not read "${file.name}" — no readable technical sections identified.`,
      };
    }

    // 4. On-device Embedding
    if (onProgress) onProgress(`Generating embeddings for ${rawChunks.length} sections...`, 0, rawChunks.length);
    const chunkTexts = rawChunks.map(c => `${c.sectionHeading}: ${c.text}`);
    
    const embeddings = await embedChunksBatch(chunkTexts, (done, total) => {
      if (onProgress) {
        onProgress(`Embedded ${done} of ${total} sections on-device...`, done, total);
      }
    });

    // 5. Store document & chunks in IndexedDB
    if (onProgress) onProgress(`Saving to on-device store...`);

    const chunkRecords: ChunkRecord[] = rawChunks.map((rc, idx) => ({
      id: `chunk_${documentId}_${idx}`,
      documentId,
      sectionHeading: rc.sectionHeading,
      pageNumber: rc.pageNumber,
      text: rc.text,
      embedding: embeddings[idx],
    }));

    const docRecord: DocumentRecord = {
      id: documentId,
      name: documentName,
      ingestedAt: Date.now(),
      embeddingModelVersion: EMBEDDING_MODEL_VERSION,
      pageCount: parsedDoc.pages.length,
      chunkCount: chunkRecords.length,
      fileSize: file.size,
    };

    await saveDocument(docRecord);
    await saveChunks(chunkRecords, documentName);

    if (onProgress) onProgress(`Indexed "${file.name}" successfully.`);

    return {
      documentId,
      documentName,
      chunkCount: chunkRecords.length,
      success: true,
    };
  } catch (err: unknown) {
    console.error(`Unexpected ingestion error for ${file.name}:`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      documentId,
      documentName,
      chunkCount: 0,
      success: false,
      error: `Could not process "${file.name}": ${msg}`,
    };
  }
}
