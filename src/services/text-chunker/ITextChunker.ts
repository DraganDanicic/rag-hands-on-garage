import { TextChunk } from './models/TextChunk.js';
import { ChunkingConfig } from './models/ChunkingConfig.js';

export interface ITextChunker {
  /**
   * Splits text into overlapping chunks based on configuration
   * @param text - The text to be chunked
   * @param sourceDocument - Optional source document identifier
   * @returns Array of text chunks
   */
  chunkText(text: string, sourceDocument?: string): TextChunk[];

  /**
   * Get the current chunking configuration
   */
  getConfig(): ChunkingConfig;
}
