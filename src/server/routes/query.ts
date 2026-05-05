import { Router, Request, Response } from 'express';
import { Container } from '../../di/Container.js';
import { QueryWorkflow } from '../../workflows/QueryWorkflow.js';

const router = Router();

/**
 * POST /api/collections/:name/query
 * Execute a RAG query and return the answer
 */
router.post('/:name/query', async (req: Request, res: Response) => {
  try {
    // Extract collection name from URL parameter
    const collectionName = req.params['name'] ?? 'default';

    // Validate request body
    const { question, topK, temperature } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    // Validate optional parameters
    if (topK !== undefined && (typeof topK !== 'number' || topK < 1 || topK > 20)) {
      res.status(400).json({ error: 'topK must be a number between 1 and 20' });
      return;
    }

    if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0.0 || temperature > 2.0)) {
      res.status(400).json({ error: 'temperature must be a number between 0.0 and 2.0' });
      return;
    }

    // Create and initialize container
    const container = new Container(collectionName);
    await container.initialize();

    // Get services from container
    const querySettings = container.getQuerySettings();

    // Apply optional overrides
    if (typeof topK === 'number') {
      querySettings.setTopK(topK);
    }

    if (typeof temperature === 'number') {
      querySettings.setTemperature(temperature);
    }

    // Create query workflow
    const workflow = new QueryWorkflow(
      querySettings,
      container.getEmbeddingClient(),
      container.getEmbeddingStore(),
      container.getVectorSearch(),
      container.getPromptBuilder(),
      container.getLlmClient(),
      container.getProgressReporter(),
      container.getTemplateLoader(),
      container.getConversationHistory()
    );

    // Execute query
    const answer = await workflow.query(question.trim());

    // Return response
    res.status(200).json({ answer });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Check for specific error cases
    if (message.includes('No embeddings found')) {
      res.status(400).json({
        error: 'No embeddings found in storage. Please run the indexing command first.',
      });
      return;
    }

    // All other errors are internal server errors
    res.status(500).json({ error: message });
  }
});

export default router;
