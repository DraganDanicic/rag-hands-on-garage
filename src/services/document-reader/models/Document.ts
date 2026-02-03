export interface Document {
  filePath: string;
  content: string;
  metadata: {
    fileName: string;
    fileSize: number;
    pageCount?: number;
    processedAt: Date;
  };
}
