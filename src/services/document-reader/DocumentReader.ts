import { readFile, readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import pdfParse from 'pdf-parse';
import { IDocumentReader } from './IDocumentReader.js';
import { Document } from './models/Document.js';

export class DocumentReader implements IDocumentReader {
  async readDocument(filePath: string): Promise<Document> {
    try {
      // Read the PDF file
      const dataBuffer = await readFile(filePath);
      const fileStats = await stat(filePath);

      // Parse the PDF
      const pdfData = await pdfParse(dataBuffer);

      return {
        filePath,
        content: pdfData.text,
        metadata: {
          fileName: basename(filePath),
          fileSize: fileStats.size,
          pageCount: pdfData.numpages,
          processedAt: new Date(),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to read document at ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async readDocuments(directoryPath: string): Promise<Document[]> {
    try {
      // Read all files in the directory
      const files = await readdir(directoryPath);

      // Filter for PDF files only
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

      if (pdfFiles.length === 0) {
        throw new Error(`No PDF files found in directory: ${directoryPath}`);
      }

      // Read all PDF documents
      const documents = await Promise.all(
        pdfFiles.map(file => this.readDocument(join(directoryPath, file)))
      );

      return documents;
    } catch (error) {
      throw new Error(
        `Failed to read documents from ${directoryPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
