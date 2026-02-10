import { IDocumentReader } from '../services/document-reader/IDocumentReader.js';
import { ITextChunker } from '../services/text-chunker/ITextChunker.js';
import { IEmbeddingClient } from '../services/embedding-client/IEmbeddingClient.js';
import { IEmbeddingStore } from '../services/embedding-store/IEmbeddingStore.js';
import { IProgressReporter } from '../services/progress-reporter/IProgressReporter.js';
import { IConfigService } from '../config/IConfigService.js';
import { StoredEmbedding } from '../services/embedding-store/models/StoredEmbedding.js';
import { TextChunk } from '../services/text-chunker/models/TextChunk.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * IndexingWorkflow orchestrates the process of:
 * 1. Reading PDF documents from a directory
 * 2. Chunking the text content
 * 3. Generating embeddings for each chunk
 * 4. Storing embeddings to persistent storage
 */
export class IndexingWorkflow {
  private static readonly CHECKPOINT_INTERVAL = 50;

  constructor(
    private readonly configService: IConfigService,
    private readonly documentReader: IDocumentReader,
    private readonly textChunker: ITextChunker,
    private readonly embeddingClient: IEmbeddingClient,
    private readonly embeddingStore: IEmbeddingStore,
    private readonly progressReporter: IProgressReporter
  ) {}

  /**
   * Execute the full indexing workflow
   * @returns Number of embeddings generated and stored
   */
  async execute(): Promise<number> {
    try {
      this.progressReporter.start('Starting document indexing workflow...');

      // Step 1: Read documents from configured directory
      const documentsPath = this.configService.getDocumentsPath();
      this.progressReporter.info(`Reading documents from: ${documentsPath}`);

      const documents = await this.documentReader.readDocuments(documentsPath);

      if (documents.length === 0) {
        this.progressReporter.error('No documents found in the documents directory');
        return 0;
      }

      this.progressReporter.success(`Found ${documents.length} document(s)`);

      // Step 2: Chunk all documents
      this.progressReporter.info('Chunking documents...');
      const allChunks: TextChunk[] = [];

      for (const document of documents) {
        const chunks = this.textChunker.chunkText(document.content, document.metadata.fileName);
        allChunks.push(...chunks);
      }

      this.progressReporter.success(`Created ${allChunks.length} text chunks`);

      // Step 2.5: Save chunks to file for user inspection
      const chunksPath = this.configService.getChunksPath();
      const chunksDir = path.dirname(chunksPath);
      await fs.mkdir(chunksDir, { recursive: true });
      await fs.writeFile(chunksPath, JSON.stringify(allChunks, null, 2), 'utf-8');
      this.progressReporter.info(`Chunks saved to ${chunksPath} for inspection`);

      // Step 3: Load existing embeddings for resume capability
      const existingEmbeddings = await this.embeddingStore.load();
      const existingChunkIds = new Set(
        existingEmbeddings
          .map(e => e.metadata?.chunkId as string | undefined)
          .filter((id): id is string => id !== undefined)
      );

      if (existingChunkIds.size > 0) {
        this.progressReporter.info(
          `Resume: Found ${existingChunkIds.size} existing embeddings`
        );
      }

      // Step 4: Generate embeddings for each chunk
      this.progressReporter.info('Generating embeddings...');
      let storedEmbeddings: StoredEmbedding[] = [];
      let newCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < allChunks.length; i++) {
        const chunk = allChunks[i];

        if (!chunk) {
          continue;
        }

        // Skip if chunk already processed (resume capability)
        if (chunk.chunkId && existingChunkIds.has(chunk.chunkId)) {
          skippedCount++;
          if (skippedCount % 10 === 0 || skippedCount === 1) {
            this.progressReporter.info(
              `Skipped ${skippedCount} already-processed chunks`
            );
          }
          continue;
        }

        // Report progress
        this.progressReporter.progress(
          i + 1,
          allChunks.length,
          `Processing chunk ${i + 1}/${allChunks.length}...`
        );

        try {
          // Generate embedding for this chunk
          const vector = await this.embeddingClient.generateEmbedding(chunk.text);

          // Create stored embedding with chunkId in metadata
          const storedEmbedding: StoredEmbedding = {
            text: chunk.text,
            vector,
            source: chunk.metadata?.sourceDocument,
            metadata: {
              chunkId: chunk.chunkId,
              chunkIndex: chunk.chunkIndex,
              startPosition: chunk.startPosition,
              endPosition: chunk.endPosition,
              totalChunks: chunk.metadata?.totalChunks,
            },
          };

          storedEmbeddings.push(storedEmbedding);
          newCount++;

          // Incremental save every N chunks
          if (storedEmbeddings.length >= IndexingWorkflow.CHECKPOINT_INTERVAL) {
            this.progressReporter.info(
              `Checkpoint: Saving ${storedEmbeddings.length} embeddings...`
            );
            await this.embeddingStore.saveIncremental(storedEmbeddings);
            storedEmbeddings = []; // Clear batch
          }
        } catch (error) {
          this.progressReporter.error(
            `Failed to generate embedding for chunk ${i + 1}: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      }

      // Save any remaining embeddings
      if (storedEmbeddings.length > 0) {
        this.progressReporter.info('Saving final batch of embeddings...');
        await this.embeddingStore.saveIncremental(storedEmbeddings);
      }

      const totalEmbeddings = existingChunkIds.size + newCount;
      this.progressReporter.success(
        `Indexing complete! Total embeddings: ${totalEmbeddings} ` +
        `(${existingChunkIds.size} existing, ${newCount} new, ${skippedCount} skipped)`
      );

      return totalEmbeddings;
    } catch (error) {
      this.progressReporter.error(
        `Indexing workflow failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
