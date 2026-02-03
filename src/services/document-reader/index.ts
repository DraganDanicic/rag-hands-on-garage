import { DocumentReader } from './DocumentReader.js';
import { IDocumentReader } from './IDocumentReader.js';

export { IDocumentReader } from './IDocumentReader.js';
export { Document } from './models/Document.js';

/**
 * Factory function to create a DocumentReader instance
 */
export function createDocumentReader(): IDocumentReader {
  return new DocumentReader();
}
