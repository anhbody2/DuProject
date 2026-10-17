import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

/** Uploaded files live here and are served publicly under UPLOAD_URL_PREFIX (see main.ts). */
export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
export const UPLOAD_URL_PREFIX = '/api/uploads/';

export const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

/**
 * Multer options for a single JPEG/PNG/WebP in field `file`, saved to `dir`
 * under a random UUID name (so stored paths are unguessable and never collide).
 */
export function imageUploadOptions(dir: string, maxBytes: number, label = 'Image'): MulterOptions {
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => cb(null, `${randomUUID()}${IMAGE_TYPES[file.mimetype] ?? extname(file.originalname)}`),
    }),
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (_req, file, cb) =>
      IMAGE_TYPES[file.mimetype]
        ? cb(null, true)
        : cb(new BadRequestException(`${label} must be a JPEG, PNG or WebP image`), false),
  };
}
