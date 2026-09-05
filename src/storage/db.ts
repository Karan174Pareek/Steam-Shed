import { openDB, type IDBPDatabase } from 'idb';

export interface DocumentRecord {
  id: string;
  name: string;
  ingestedAt: number;
  embeddingModelVersion: string;
  pageCount?: number;
  fileSize?: number;
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  sectionHeading: string;
  pageNumber: number;
  text: string;
  embedding: Float32Array | number[];
}

const DB_NAME = 'steam_shed_assistant_db';
const DB_VERSION = 1;

class InMemoryStore {
  documents = new Map<string, DocumentRecord>();
  chunks = new Map<string, ChunkRecord>();

  saveDocument(doc: DocumentRecord) {
    this.documents.set(doc.id, doc);
  }

  saveChunks(chunksList: ChunkRecord[]) {
    for (const c of chunksList) {
      this.chunks.set(c.id, c);
    }
  }

  getAllDocuments(): DocumentRecord[] {
    return Array.from(this.documents.values());
  }

  getAllChunks(): ChunkRecord[] {
    return Array.from(this.chunks.values());
  }

  deleteDocument(docId: string) {
    this.documents.delete(docId);
    for (const [id, c] of this.chunks.entries()) {
      if (c.documentId === docId) {
        this.chunks.delete(id);
      }
    }
  }
}

let dbInstance: IDBPDatabase | null = null;
let isIndexedDBAvailable = true;
let inMemoryStore: InMemoryStore | null = null;

export function getIsInMemoryFallback(): boolean {
  return !isIndexedDBAvailable;
}

async function getDB(): Promise<IDBPDatabase | null> {
  if (!isIndexedDBAvailable) return null;
  if (dbInstance) return dbInstance;

  try {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not supported in this environment');
    }

    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'id' });
          chunkStore.createIndex('documentId', 'documentId');
        }
      },
    });
    return dbInstance;
  } catch (err) {
    console.warn('IndexedDB unavailable. Falling back to in-memory session store:', err);
    isIndexedDBAvailable = false;
    if (!inMemoryStore) {
      inMemoryStore = new InMemoryStore();
    }
    return null;
  }
}

export async function saveDocument(doc: DocumentRecord): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      await db.put('documents', doc);
    } else {
      if (!inMemoryStore) inMemoryStore = new InMemoryStore();
      inMemoryStore.saveDocument(doc);
    }
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'QuotaExceededError' || (error.message && error.message.toLowerCase().includes('quota'))) {
      throw new Error(`Storage quota exceeded while saving "${doc.name}". Consider removing an older manual.`);
    }
    throw new Error(`Failed to save document metadata for "${doc.name}": ${error.message}`);
  }
}

export async function saveChunks(chunks: ChunkRecord[], docName?: string): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction('chunks', 'readwrite');
      for (const chunk of chunks) {
        // Ensure embedding is stored in compatible format
        const record = {
          ...chunk,
          embedding: chunk.embedding instanceof Float32Array 
            ? Array.from(chunk.embedding) 
            : chunk.embedding,
        };
        await tx.store.put(record);
      }
      await tx.done;
    } else {
      if (!inMemoryStore) inMemoryStore = new InMemoryStore();
      inMemoryStore.saveChunks(chunks);
    }
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'QuotaExceededError' || (error.message && error.message.toLowerCase().includes('quota'))) {
      throw new Error(`Storage quota exceeded while indexing "${docName || 'document'}". Remove older documents to free space.`);
    }
    throw new Error(`Failed to save document index: ${error.message}`);
  }
}

export async function getAllDocuments(): Promise<DocumentRecord[]> {
  try {
    const db = await getDB();
    if (db) {
      return await db.getAll('documents');
    }
    return inMemoryStore ? inMemoryStore.getAllDocuments() : [];
  } catch (err) {
    console.error('Error reading documents:', err);
    return [];
  }
}

export async function getAllChunks(): Promise<ChunkRecord[]> {
  try {
    const db = await getDB();
    if (db) {
      const records = await db.getAll('chunks');
      return records.map(r => ({
        ...r,
        embedding: r.embedding instanceof Float32Array 
          ? r.embedding 
          : new Float32Array(r.embedding),
      }));
    }
    return inMemoryStore ? inMemoryStore.getAllChunks() : [];
  } catch (err) {
    console.error('Error reading chunks:', err);
    return [];
  }
}

export async function deleteDocument(documentId: string): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction(['documents', 'chunks'], 'readwrite');
      await tx.objectStore('documents').delete(documentId);
      
      const chunkIndex = tx.objectStore('chunks').index('documentId');
      let cursor = await chunkIndex.openKeyCursor(IDBKeyRange.only(documentId));
      while (cursor) {
        await tx.objectStore('chunks').delete(cursor.primaryKey);
        cursor = await cursor.continue();
      }
      await tx.done;
    } else if (inMemoryStore) {
      inMemoryStore.deleteDocument(documentId);
    }
  } catch (err: unknown) {
    const error = err as Error;
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

export async function getStorageUsage(): Promise<{ usedBytes: number; quotaBytes: number }> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usedBytes: estimate.usage || 0,
        quotaBytes: estimate.quota || 0,
      };
    } catch {
      // Fallback
    }
  }
  return { usedBytes: 0, quotaBytes: 0 };
}
