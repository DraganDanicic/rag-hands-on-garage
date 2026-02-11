import { Document } from './models/Document.js';
import { DocumentMetadata } from './models/DocumentMetadata.js';

export interface IDocumentReader {
  /**
   * Reads a single document (PDF, TXT, or MD) and extracts its text content
   * @param filePath - Path to the document file
   * @returns Document with extracted text and metadata
   */
  readDocument(filePath: string): Promise<Document>;

  /**
   * Reads all supported documents from a directory
   * @param directoryPath - Path to the directory containing documents
   * @returns Array of documents with extracted text
   */
  readDocuments(directoryPath: string): Promise<Document[]>;

  /**
   * Lists all supported documents in a directory without reading their contents
   * @param directoryPath - Path to the directory containing documents
   * @returns Array of document metadata
   */
  listDocuments(directoryPath: string): Promise<DocumentMetadata[]>;

  /**
   * Reads selected documents from a directory
   * @param directoryPath - Path to the directory containing documents
   * @param fileNames - Array of file names to read
   * @returns Array of documents with extracted text
   */
  readSelectedDocuments(directoryPath: string, fileNames: string[]): Promise<Document[]>;
}
