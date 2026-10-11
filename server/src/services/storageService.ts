import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Ensure storage directory exists
const uploadDir = path.resolve(process.cwd(), env.DOCUMENT_STORAGE_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed MIME types for compliance evidence: PDFs, images, docs, spreadsheets, text
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'text/plain',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedOriginal}`);
  },
});

export const uploadMiddleware = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not permitted for compliance evidence.`));
    }
  },
});

export class StorageService {
  /**
   * Resolve safe file path on disk
   */
  static getFilePath(storageKey: string): string {
    const safeKey = path.basename(storageKey);
    const fullPath = path.join(uploadDir, safeKey);
    if (!fs.existsSync(fullPath)) {
      throw new Error('Evidence file not found in storage');
    }
    return fullPath;
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(storageKey: string): Promise<void> {
    try {
      const safeKey = path.basename(storageKey);
      const fullPath = path.join(uploadDir, safeKey);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      logger.error({ storageKey, error: (error as Error).message }, 'Failed to delete file from disk');
    }
  }
}
