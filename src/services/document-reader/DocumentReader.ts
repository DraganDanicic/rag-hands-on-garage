import { readFile, readdir, stat, access } from 'fs/promises';
import { join, basename } from 'path';
import pdfParse from 'pdf-parse';
import { IDocumentReader } from './IDocumentReader.js';
import { Document } from './models/Document.js';
import { DocumentMetadata } from './models/DocumentMetadata.js';

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

  async listDocuments(directoryPath: string): Promise<DocumentMetadata[]> {
    try {
      // Read all files in the directory
      const files = await readdir(directoryPath);

      // Filter for PDF files only
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

      // Get metadata for each PDF file
      const metadata = await Promise.all(
        pdfFiles.map(async (file) => {
          const filePath = join(directoryPath, file);
          const stats = await stat(filePath);

          return {
            fileName: file,
            filePath,
            fileSizeBytes: stats.size,
            lastModified: stats.mtime,
          };
        })
      );

      // Sort by file name alphabetically
      return metadata.sort((a, b) => a.fileName.localeCompare(b.fileName));
    } catch (error) {
      throw new Error(
        `Failed to list documents from ${directoryPath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async readSelectedDocuments(directoryPath: string, fileNames: string[]): Promise<Document[]> {
    try {
      // Validate all files exist before reading
      for (const fileName of fileNames) {
        const filePath = join(directoryPath, fileName);
        try {
          await access(filePath);
        } catch {
          throw new Error(`Document not found: ${fileName}`);
        }

        // Validate it's a PDF file
        if (!fileName.toLowerCase().endsWith('.pdf')) {
          throw new Error(`Not a PDF file: ${fileName}`);
        }
      }

      if (fileNames.length === 0) {
        throw new Error('No files selected');
      }

      // Read all selected documents
      const documents = await Promise.all(
        fileNames.map(fileName => this.readDocument(join(directoryPath, fileName)))
      );

      return documents;
    } catch (error) {
      throw new Error(
        `Failed to read selected documents: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
