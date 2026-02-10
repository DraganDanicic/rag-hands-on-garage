import { Document } from './models/Document.js';
import { DocumentMetadata } from './models/DocumentMetadata.js';

export interface IDocumentReader {
  /**
   * Reads a single PDF document and extracts its text content
   * @param filePath - Path to the PDF file
   * @returns Document with extracted text and metadata
   */
  readDocument(filePath: string): Promise<Document>;

  /**
   * Reads all PDF documents from a directory
   * @param directoryPath - Path to the directory containing PDFs
   * @returns Array of documents with extracted text
   */
  readDocuments(directoryPath: string): Promise<Document[]>;

  /**
   * Lists all PDF documents in a directory without reading their contents
   * @param directoryPath - Path to the directory containing PDFs
   * @returns Array of document metadata
   */
  listDocuments(directoryPath: string): Promise<DocumentMetadata[]>;

  /**
   * Reads selected PDF documents from a directory
   * @param directoryPath - Path to the directory containing PDFs
   * @param fileNames - Array of file names to read
   * @returns Array of documents with extracted text
   */
  readSelectedDocuments(directoryPath: string, fileNames: string[]): Promise<Document[]>;
}
