import { ITextChunker } from './ITextChunker.js';
import { TextChunk } from './models/TextChunk.js';
import { ChunkingConfig } from './models/ChunkingConfig.js';

export class TextChunker implements ITextChunker {
  constructor(private config: ChunkingConfig) {
    // Validate configuration
    if (config.chunkSize <= 0) {
      throw new Error('chunkSize must be greater than 0');
    }
    if (config.chunkOverlap < 0) {
      throw new Error('chunkOverlap cannot be negative');
    }
    if (config.chunkOverlap >= config.chunkSize) {
      throw new Error('chunkOverlap must be less than chunkSize');
    }
  }

  chunkText(text: string, sourceDocument?: string): TextChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    const { chunkSize, chunkOverlap } = this.config;
    const step = chunkSize - chunkOverlap;

    let startPosition = 0;
    let chunkIndex = 0;

    while (startPosition < text.length) {
      // Calculate end position for this chunk
      const endPosition = Math.min(startPosition + chunkSize, text.length);

      // Extract the chunk text
      const chunkText = text.substring(startPosition, endPosition);

      // Create the chunk object
      chunks.push({
        text: chunkText,
        startPosition,
        endPosition,
        chunkIndex,
        metadata: {
          sourceDocument,
          totalChunks: 0, // Will be updated after all chunks are created
        },
      });

      chunkIndex++;

      // Move to the next chunk position
      startPosition += step;

      // If we've reached the end, break
      if (endPosition === text.length) {
        break;
      }
    }

    // Update totalChunks metadata for all chunks
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
      if (chunk.metadata) {
        chunk.metadata.totalChunks = totalChunks;
      }
    });

    return chunks;
  }

  getConfig(): ChunkingConfig {
    return { ...this.config };
  }
}
