import { Router, Request, Response, NextFunction } from 'express';
import { upload } from '../middleware/upload.js';

const router = Router();

/**
 * POST /api/collections/:name/upload
 * Upload PDF files to a collection
 */
router.post(
  '/:name/upload',
  upload.array('files', 20), // Accept up to 20 files
  (req: Request, res: Response) => {
    const collectionName = req.params['name'] ?? 'default';
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const fileNames = files.map((f) => f.originalname);

    res.status(200).json({
      files: fileNames,
      count: files.length,
      message: `Successfully uploaded ${files.length} file(s) to collection '${collectionName}'`,
    });
  }
);

/**
 * Multer error handler for file upload errors
 * Must be registered after the upload route
 */
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  // Check if this is a Multer error
  if (err && 'code' in err) {
    const multerError = err as { code?: string; field?: string };

    if (multerError.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        error: 'File too large. Maximum file size is 50MB.',
      });
      return;
    }

    if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        error: 'Unexpected file field. Use "files" field name.',
      });
      return;
    }
  }

  // File type validation error from fileFilter
  if (err.message === 'Only PDF files are allowed') {
    res.status(400).json({
      error: err.message,
    });
    return;
  }

  // Pass other errors to global error handler
  next(err);
});

export default router;
