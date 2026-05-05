import { Router, Request, Response } from 'express';
import { Container } from '../../di/Container.js';
import { validateSettings } from '../utils/settingsValidation.js';

const router = Router();

/**
 * GET /api/settings
 * Retrieve current configuration settings
 */
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    // Create container to get settings services
    const container = new Container();
    await container.initialize();

    const importSettings = container.getImportSettings();
    const querySettings = container.getQuerySettings();

    // Build response with all configurable settings
    const settings = {
      chunkSize: importSettings.getChunkSize(),
      chunkOverlap: importSettings.getChunkOverlap(),
      topK: querySettings.getTopK(),
      temperature: querySettings.getTemperature(),
      maxTokens: querySettings.getMaxTokens(),
    };

    res.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to retrieve settings: ${message}` });
  }
});

/**
 * PUT /api/settings
 * Update configuration settings
 */
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const { chunkSize, chunkOverlap, topK, temperature, maxTokens } = req.body;

    // Check that at least one recognized field is present
    const recognized = { chunkSize, chunkOverlap, topK, temperature, maxTokens };
    const provided = Object.entries(recognized).filter(([_, v]) => v !== undefined);

    if (provided.length === 0) {
      res.status(400).json({
        error: 'No valid settings fields provided. Accepted fields: chunkSize, chunkOverlap, topK, temperature, maxTokens',
      });
      return;
    }

    // Create container to get settings services
    const container = new Container();
    await container.initialize();

    const importSettings = container.getImportSettings();
    const querySettings = container.getQuerySettings();

    // Validate settings before applying
    const currentSettings = {
      chunkSize: importSettings.getChunkSize(),
    };

    const validation = validateSettings(req.body, currentSettings);

    if (!validation.valid) {
      // Return all validation errors
      const errorMessages = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      res.status(400).json({
        error: errorMessages,
        details: validation.errors,
      });
      return;
    }

    // Track which services need to be saved
    let importChanged = false;
    let queryChanged = false;

    // Apply import settings (chunkSize, chunkOverlap)
    if (chunkSize !== undefined) {
      importSettings.setChunkSize(chunkSize);
      importChanged = true;
    }

    if (chunkOverlap !== undefined) {
      importSettings.setChunkOverlap(chunkOverlap);
      importChanged = true;
    }

    // Apply query settings (topK, temperature, maxTokens)
    if (topK !== undefined) {
      querySettings.setTopK(topK);
      queryChanged = true;
    }

    if (temperature !== undefined) {
      querySettings.setTemperature(temperature);
      queryChanged = true;
    }

    if (maxTokens !== undefined) {
      querySettings.setMaxTokens(maxTokens);
      queryChanged = true;
    }

    // Persist changes to JSON files
    if (importChanged) {
      await importSettings.save();
    }

    if (queryChanged) {
      await querySettings.save();
    }

    // Return updated settings
    const updatedSettings = {
      chunkSize: importSettings.getChunkSize(),
      chunkOverlap: importSettings.getChunkOverlap(),
      topK: querySettings.getTopK(),
      temperature: querySettings.getTemperature(),
      maxTokens: querySettings.getMaxTokens(),
    };

    res.json(updatedSettings);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Service setters throw validation errors - return 400
    res.status(400).json({ error: message });
  }
});

export default router;
