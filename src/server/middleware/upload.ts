import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const UPLOAD_BASE_DIR = path.join('documents', 'temp-uploads');
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_FILENAME_LENGTH = 200;

/**
 * Multer disk storage configuration with dynamic collection-based destination
 */
const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    // Sanitize collection name to prevent path traversal
    const rawName = req.params['name'] ?? 'default';
    const collection = path.basename(rawName); // Strips ../ and /

    const uploadDir = path.join(UPLOAD_BASE_DIR, collection);

    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },

  filename(_req, file, cb) {
    // Truncate long filenames and add timestamp prefix
    const originalName = file.originalname;
    const truncated =
      originalName.length > MAX_FILENAME_LENGTH
        ? originalName.substring(0, MAX_FILENAME_LENGTH)
        : originalName;

    const uniqueName = `${Date.now()}-${truncated}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter: Accept only PDF files (both MIME type and extension check)
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';

  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
}

/**
 * Configured Multer middleware instance
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
