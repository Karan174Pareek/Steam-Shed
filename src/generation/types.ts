import type { RetrievedChunk } from '../retrieval';

export type GenerationMode = 'on-device-model' | 'extractive-fallback';

export interface Citation {
  documentName: string;
  sectionHeading: string;
  pageNumber: number;
}

export interface GenerationResult {
  answer: string;
  citations: Citation[];
  mode: GenerationMode;
  providerName: string;
}

export interface GenerationProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  generate(question: string, chunks: RetrievedChunk[]): Promise<GenerationResult>;
}
