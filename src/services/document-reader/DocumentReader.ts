import { readFile, readdir, stat, access } from 'fs/promises';
import { join, basename } from 'path';
import pdfParse from 'pdf-parse';
import removeMarkdown from 'remove-markdown';
import { IDocumentReader } from './IDocumentReader.js';
import { Document } from './models/Document.js';
import { DocumentMetadata } from './models/DocumentMetadata.js';

export class DocumentReader implements IDocumentReader {
  private readonly SUPPORTED_EXTENSIONS = ['.pdf', '.txt', '.md'];

  private getFileExtension(filePath: string): string {
    return filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
  }

  private isSupportedDocument(fileName: string): boolean {
    const ext = this.getFileExtension(fileName);
    return this.SUPPORTED_EXTENSIONS.includes(ext);
  }
  async readDocument(filePath: string): Promise<Document> {
    try {
      const fileStats = await stat(filePath);
      const extension = this.getFileExtension(filePath);

      let content: string;
      let pageCount: number | undefined;

      switch (extension) {
        case '.pdf':
          // Read PDF file (existing logic)
          const dataBuffer = await readFile(filePath);
          const pdfData = await pdfParse(dataBuffer);
          content = pdfData.text;
          pageCount = pdfData.numpages;
          break;

        case '.txt':
          // Read text file as UTF-8
          content = await readFile(filePath, 'utf-8');
          pageCount = undefined;
          break;

        case '.md':
          // Read markdown and strip to plain text
          const rawMarkdown = await readFile(filePath, 'utf-8');
          content = removeMarkdown(rawMarkdown);
          pageCount = undefined;
          break;

        default:
          throw new Error(
            `Unsupported file format: ${extension}. Supported formats: ${this.SUPPORTED_EXTENSIONS.join(', ')}`
          );
      }

      return {
        filePath,
        content,
        metadata: {
          fileName: basename(filePath),
          fileSize: fileStats.size,
          pageCount, // Only defined for PDFs
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

      // Filter for supported files only
      const supportedFiles = files.filter(file => this.isSupportedDocument(file));

      if (supportedFiles.length === 0) {
        throw new Error(`No supported documents found in directory: ${directoryPath}. Supported formats: ${this.SUPPORTED_EXTENSIONS.join(', ')}`);
      }

      // Read all supported documents
      const documents = await Promise.all(
        supportedFiles.map(file => this.readDocument(join(directoryPath, file)))
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

      // Filter for supported files only
      const supportedFiles = files.filter(file => this.isSupportedDocument(file));

      // Get metadata for each supported file
      const metadata = await Promise.all(
        supportedFiles.map(async (file) => {
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

        // Validate it's a supported file format
        if (!this.isSupportedDocument(fileName)) {
          throw new Error(
            `Unsupported file format: ${fileName}. Supported formats: ${this.SUPPORTED_EXTENSIONS.join(', ')}`
          );
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
