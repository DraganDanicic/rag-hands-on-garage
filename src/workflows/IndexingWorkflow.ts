import { IDocumentReader } from '../services/document-reader/IDocumentReader.js';
import { ITextChunker } from '../services/text-chunker/ITextChunker.js';
import { IEmbeddingClient } from '../services/embedding-client/IEmbeddingClient.js';
import { IEmbeddingStore } from '../services/embedding-store/IEmbeddingStore.js';
import { IProgressReporter } from '../services/progress-reporter/IProgressReporter.js';
import { IConfigService } from '../config/IConfigService.js';
import { StoredEmbedding } from '../services/embedding-store/models/StoredEmbedding.js';
import { TextChunk } from '../services/text-chunker/models/TextChunk.js';

/**
 * IndexingWorkflow orchestrates the process of:
 * 1. Reading PDF documents from a directory
 * 2. Chunking the text content
 * 3. Generating embeddings for each chunk
 * 4. Storing embeddings to persistent storage
 */
export class IndexingWorkflow {
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

      // Step 3: Generate embeddings for each chunk
      this.progressReporter.info('Generating embeddings...');
      const storedEmbeddings: StoredEmbedding[] = [];

      for (let i = 0; i < allChunks.length; i++) {
        const chunk = allChunks[i];

        if (!chunk) {
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

          // Create stored embedding
          const storedEmbedding: StoredEmbedding = {
            text: chunk.text,
            vector,
            source: chunk.metadata?.sourceDocument,
            metadata: {
              chunkIndex: chunk.chunkIndex,
              startPosition: chunk.startPosition,
              endPosition: chunk.endPosition,
              totalChunks: chunk.metadata?.totalChunks,
            },
          };

          storedEmbeddings.push(storedEmbedding);
        } catch (error) {
          this.progressReporter.error(
            `Failed to generate embedding for chunk ${i + 1}: ${error instanceof Error ? error.message : String(error)}`
          );
          throw error;
        }
      }

      this.progressReporter.success(`Generated ${storedEmbeddings.length} embeddings`);

      // Step 4: Store embeddings
      this.progressReporter.info('Saving embeddings to storage...');
      await this.embeddingStore.save(storedEmbeddings);

      this.progressReporter.success(
        `Indexing complete! Stored ${storedEmbeddings.length} embeddings`
      );

      return storedEmbeddings.length;
    } catch (error) {
      this.progressReporter.error(
        `Indexing workflow failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
