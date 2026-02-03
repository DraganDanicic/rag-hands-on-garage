import { TextChunker } from './TextChunker.js';
import { ITextChunker } from './ITextChunker.js';
import { ChunkingConfig } from './models/ChunkingConfig.js';

export { ITextChunker } from './ITextChunker.js';
export { TextChunk } from './models/TextChunk.js';
export { ChunkingConfig } from './models/ChunkingConfig.js';

/**
 * Factory function to create a TextChunker instance
 * @param config - Chunking configuration
 */
export function createTextChunker(config: ChunkingConfig): ITextChunker {
  return new TextChunker(config);
}
