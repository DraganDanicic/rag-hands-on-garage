/**
 * Tests for IndexingWorkflow
 *
 * These tests verify that:
 * 1. The workflow orchestrates all services correctly
 * 2. Documents are read, chunked, embedded, and stored
 * 3. Progress is reported at each step
 * 4. Errors are handled gracefully
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { IndexingWorkflow } from '../../src/workflows/IndexingWorkflow.js';
import { IConfigService } from '../../src/config/IConfigService.js';
import { IDocumentReader } from '../../src/services/document-reader/IDocumentReader.js';
import { ITextChunker } from '../../src/services/text-chunker/ITextChunker.js';
import { IEmbeddingClient } from '../../src/services/embedding-client/IEmbeddingClient.js';
import { IEmbeddingStore } from '../../src/services/embedding-store/IEmbeddingStore.js';
import { IProgressReporter } from '../../src/services/progress-reporter/IProgressReporter.js';
import { Document } from '../../src/services/document-reader/models/Document.js';
import { TextChunk } from '../../src/services/text-chunker/models/TextChunk.js';

describe('IndexingWorkflow', () => {
  let mockConfigService: jest.Mocked<IConfigService>;
  let mockDocumentReader: jest.Mocked<IDocumentReader>;
  let mockTextChunker: jest.Mocked<ITextChunker>;
  let mockEmbeddingClient: jest.Mocked<IEmbeddingClient>;
  let mockEmbeddingStore: jest.Mocked<IEmbeddingStore>;
  let mockProgressReporter: jest.Mocked<IProgressReporter>;
  let workflow: IndexingWorkflow;

  beforeEach(() => {
    // Create mocks
    mockConfigService = {
      getDocumentsPath: jest.fn(() => '/path/to/documents'),
      getEmbeddingsPath: jest.fn(() => '/path/to/embeddings.json'),
      getOpenAiApiKey: jest.fn(() => 'test-key'),
      getGeminiApiKey: jest.fn(() => 'test-key'),
      getChunkSize: jest.fn(() => 500),
      getChunkOverlap: jest.fn(() => 50),
      getTopK: jest.fn(() => 3),
    } as jest.Mocked<IConfigService>;

    mockDocumentReader = {
      readDocument: jest.fn(),
      readDocuments: jest.fn(),
    } as jest.Mocked<IDocumentReader>;

    mockTextChunker = {
      chunkText: jest.fn(),
      getConfig: jest.fn(),
    } as jest.Mocked<ITextChunker>;

    mockEmbeddingClient = {
      generateEmbedding: jest.fn(),
      generateEmbeddings: jest.fn(),
    } as jest.Mocked<IEmbeddingClient>;

    mockEmbeddingStore = {
      save: jest.fn(),
      load: jest.fn(),
      clear: jest.fn(),
    } as jest.Mocked<IEmbeddingStore>;

    mockProgressReporter = {
      start: jest.fn(),
      progress: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    } as jest.Mocked<IProgressReporter>;

    workflow = new IndexingWorkflow(
      mockConfigService,
      mockDocumentReader,
      mockTextChunker,
      mockEmbeddingClient,
      mockEmbeddingStore,
      mockProgressReporter
    );
  });

  describe('execute', () => {
    it('should successfully execute full indexing workflow', async () => {
      // Setup mock data
      const mockDocuments: Document[] = [
        {
          filePath: '/docs/test.pdf',
          content: 'Test document content',
          metadata: {
            fileName: 'test.pdf',
            fileSize: 1000,
            pageCount: 1,
            processedAt: new Date(),
          },
        },
      ];

      const mockChunks: TextChunk[] = [
        {
          text: 'Test chunk 1',
          startPosition: 0,
          endPosition: 12,
          chunkIndex: 0,
          metadata: { sourceDocument: 'test.pdf', totalChunks: 2 },
        },
        {
          text: 'Test chunk 2',
          startPosition: 13,
          endPosition: 25,
          chunkIndex: 1,
          metadata: { sourceDocument: 'test.pdf', totalChunks: 2 },
        },
      ];

      const mockEmbedding = new Array(1536).fill(0.1);

      // Configure mocks
      mockDocumentReader.readDocuments.mockResolvedValue(mockDocuments);
      mockTextChunker.chunkText.mockReturnValue(mockChunks);
      mockEmbeddingClient.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockEmbeddingStore.save.mockResolvedValue();

      // Execute workflow
      const result = await workflow.execute();

      // Verify workflow executed correctly
      expect(result).toBe(2);
      expect(mockDocumentReader.readDocuments).toHaveBeenCalledWith('/path/to/documents');
      expect(mockTextChunker.chunkText).toHaveBeenCalledWith('Test document content', 'test.pdf');
      expect(mockEmbeddingClient.generateEmbedding).toHaveBeenCalledTimes(2);
      expect(mockEmbeddingStore.save).toHaveBeenCalled();

      // Verify progress reporting
      expect(mockProgressReporter.start).toHaveBeenCalled();
      expect(mockProgressReporter.info).toHaveBeenCalledWith(
        expect.stringContaining('Reading documents')
      );
      expect(mockProgressReporter.success).toHaveBeenCalledWith(
        expect.stringContaining('Found 1 document')
      );
      expect(mockProgressReporter.progress).toHaveBeenCalledWith(1, 2, expect.any(String));
      expect(mockProgressReporter.progress).toHaveBeenCalledWith(2, 2, expect.any(String));
    });

    it('should handle no documents found', async () => {
      mockDocumentReader.readDocuments.mockResolvedValue([]);

      const result = await workflow.execute();

      expect(result).toBe(0);
      expect(mockProgressReporter.error).toHaveBeenCalledWith(
        'No documents found in the documents directory'
      );
      expect(mockEmbeddingStore.save).not.toHaveBeenCalled();
    });

    it('should handle document reading errors', async () => {
      const error = new Error('Failed to read documents');
      mockDocumentReader.readDocuments.mockRejectedValue(error);

      await expect(workflow.execute()).rejects.toThrow('Failed to read documents');
      expect(mockProgressReporter.error).toHaveBeenCalledWith(
        expect.stringContaining('Indexing workflow failed')
      );
    });

    it('should handle embedding generation errors', async () => {
      const mockDocuments: Document[] = [
        {
          filePath: '/docs/test.pdf',
          content: 'Test content',
          metadata: {
            fileName: 'test.pdf',
            fileSize: 1000,
            processedAt: new Date(),
          },
        },
      ];

      const mockChunks: TextChunk[] = [
        {
          text: 'Test chunk',
          startPosition: 0,
          endPosition: 10,
          chunkIndex: 0,
        },
      ];

      mockDocumentReader.readDocuments.mockResolvedValue(mockDocuments);
      mockTextChunker.chunkText.mockReturnValue(mockChunks);
      mockEmbeddingClient.generateEmbedding.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(workflow.execute()).rejects.toThrow();
      expect(mockProgressReporter.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate embedding')
      );
    });

    it('should process multiple documents', async () => {
      const mockDocuments: Document[] = [
        {
          filePath: '/docs/doc1.pdf',
          content: 'Document 1 content',
          metadata: {
            fileName: 'doc1.pdf',
            fileSize: 1000,
            processedAt: new Date(),
          },
        },
        {
          filePath: '/docs/doc2.pdf',
          content: 'Document 2 content',
          metadata: {
            fileName: 'doc2.pdf',
            fileSize: 2000,
            processedAt: new Date(),
          },
        },
      ];

      const mockChunks1: TextChunk[] = [
        {
          text: 'Chunk 1',
          startPosition: 0,
          endPosition: 7,
          chunkIndex: 0,
          metadata: { sourceDocument: 'doc1.pdf' },
        },
      ];

      const mockChunks2: TextChunk[] = [
        {
          text: 'Chunk 2',
          startPosition: 0,
          endPosition: 7,
          chunkIndex: 0,
          metadata: { sourceDocument: 'doc2.pdf' },
        },
      ];

      mockDocumentReader.readDocuments.mockResolvedValue(mockDocuments);
      mockTextChunker.chunkText
        .mockReturnValueOnce(mockChunks1)
        .mockReturnValueOnce(mockChunks2);
      mockEmbeddingClient.generateEmbedding.mockResolvedValue(new Array(1536).fill(0.1));
      mockEmbeddingStore.save.mockResolvedValue();

      const result = await workflow.execute();

      expect(result).toBe(2);
      expect(mockTextChunker.chunkText).toHaveBeenCalledTimes(2);
      expect(mockEmbeddingClient.generateEmbedding).toHaveBeenCalledTimes(2);
    });

    it('should save embeddings with correct metadata', async () => {
      const mockDocuments: Document[] = [
        {
          filePath: '/docs/test.pdf',
          content: 'Test content',
          metadata: {
            fileName: 'test.pdf',
            fileSize: 1000,
            pageCount: 1,
            processedAt: new Date(),
          },
        },
      ];

      const mockChunks: TextChunk[] = [
        {
          text: 'Test chunk',
          startPosition: 0,
          endPosition: 10,
          chunkIndex: 0,
          metadata: { sourceDocument: 'test.pdf', totalChunks: 1 },
        },
      ];

      const mockEmbedding = new Array(1536).fill(0.1);

      mockDocumentReader.readDocuments.mockResolvedValue(mockDocuments);
      mockTextChunker.chunkText.mockReturnValue(mockChunks);
      mockEmbeddingClient.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockEmbeddingStore.save.mockResolvedValue();

      await workflow.execute();

      // Verify save was called with correct structure
      expect(mockEmbeddingStore.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            text: 'Test chunk',
            vector: mockEmbedding,
            source: 'test.pdf',
            metadata: expect.objectContaining({
              chunkIndex: 0,
              startPosition: 0,
              endPosition: 10,
              totalChunks: 1,
            }),
          }),
        ])
      );
    });
  });
});
