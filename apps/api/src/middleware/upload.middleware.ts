import { extname } from 'node:path';
import type { RequestHandler } from 'express';
import multer from 'multer';
import {
  ALLOWED_RESUME_MIME_TYPES,
  ALLOWED_RESUME_EXTENSIONS,
  type AllowedResumeMimeType,
} from '@interview-iq/shared';
import { AppError } from '../lib/errors';
import { ERROR_CODES } from '@interview-iq/shared';
import { MAX_FILE_SIZE_BYTES } from '../config/env';

// Files are held in memory, validated, then streamed to storage. They never touch a
// public webroot. Both the MIME type and the extension are checked (never trust one alone).
const storage = multer.memoryStorage();

export const uploadResume: RequestHandler = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const mimeOk = (ALLOWED_RESUME_MIME_TYPES as readonly string[]).includes(file.mimetype);
    const ext = extname(file.originalname).toLowerCase();
    const extOk = (ALLOWED_RESUME_EXTENSIONS as readonly string[]).includes(ext);

    if (mimeOk && extOk) {
      cb(null, true);
      return;
    }
    cb(
      new AppError(
        ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
        'Only PDF and DOCX resumes are accepted',
        415,
      ),
    );
  },
}).single('file');

export function resolveMimeType(file: Express.Multer.File): AllowedResumeMimeType {
  return file.mimetype as AllowedResumeMimeType;
}
