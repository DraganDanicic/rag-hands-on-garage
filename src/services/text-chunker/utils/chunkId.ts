import { createHash } from 'crypto';

/**
 * Generates a stable, deterministic ID for a text chunk.
 *
 * Uses SHA-256 hash of the chunk text to create a unique identifier.
 * Same text will always produce the same ID, enabling automatic deduplication
 * and resume capability.
 *
 * @param chunkText - The text content of the chunk
 * @returns 64-character hexadecimal hash string
 */
export function generateChunkId(chunkText: string): string {
  return createHash('sha256').update(chunkText, 'utf8').digest('hex');
}
