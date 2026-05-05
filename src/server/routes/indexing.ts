import { Router, Request, Response } from 'express';
import { Container } from '../../di/Container.js';
import { IndexingWorkflow } from '../../workflows/IndexingWorkflow.js';
import { createSSEProgressReporter } from '../utils/SSEProgressReporter.js';

const router = Router();

/**
 * POST /api/collections/:name/index
 * Trigger indexing workflow and stream progress via SSE
 */
router.post('/:name/index', async (req: Request, res: Response) => {
  // Step 1: Extract and validate collection name
  const collectionName = req.params['name'] ?? 'default';

  if (!/^[a-zA-Z0-9_-]+$/.test(collectionName)) {
    res.status(400).json({ error: 'Invalid collection name' });
    return;
  }

  // Step 2: Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Step 3: Track client connection state (for future use)
  req.on('close', () => {
    // Client disconnected - future: abort indexing if desired
  });

  try {
    // Step 4: Create container and initialize
    const container = new Container(collectionName);
    await container.initialize();

    // Step 5: Create SSEProgressReporter
    const sseReporter = createSSEProgressReporter(res);

    // Step 6: Instantiate and execute workflow
    const workflow = new IndexingWorkflow(
      container.getConfigService(),
      container.getDocumentReader(),
      container.getTextChunker(),
      container.getEmbeddingClient(),
      container.getEmbeddingStore(),
      sseReporter // SSE reporter instead of console reporter
    );

    await workflow.execute();

    // Workflow complete (SSEProgressReporter.success() already sent complete event and ended response)
  } catch (error) {
    // Error during workflow execution
    // SSEProgressReporter.error() may have already sent error event and ended response
    // If not, the error will be caught by global error handler
    if (!res.writableEnded) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Indexing workflow error:', message);
    }
  }
});

export default router;
