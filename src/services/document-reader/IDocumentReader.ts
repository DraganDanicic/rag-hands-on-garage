import { Document } from './models/Document.js';

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
}
