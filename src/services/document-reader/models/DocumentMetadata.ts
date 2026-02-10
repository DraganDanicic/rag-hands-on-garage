/**
 * Metadata about a PDF document file
 */
export interface DocumentMetadata {
  /** File name (e.g., "document.pdf") */
  fileName: string;
  /** Full file path */
  filePath: string;
  /** File size in bytes */
  fileSizeBytes: number;
  /** Last modification timestamp */
  lastModified: Date;
}
