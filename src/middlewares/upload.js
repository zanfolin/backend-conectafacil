import multer from 'multer';
import { env } from '../config/env.js';
import { mkdirSync } from 'node:fs';
import { extname } from 'node:path';

// Ensure upload directory exists
mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP');
    error.statusCode = 400;
    cb(error, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_AVATAR_MB * 1024 * 1024,
  },
});