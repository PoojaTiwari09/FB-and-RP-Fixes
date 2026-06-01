import * as fs from 'fs';
import * as path from 'path';

/**
 * Canonical uploads folder for unified-api (cwd often `apps/unified-api`)
 * and monorepo app root (`boilerplate code/r-revenue-intelligence`).
 */
export function resolveUploadsRoot(): string {
  const local = path.resolve(process.cwd(), 'uploads');
  const appRoot = path.resolve(process.cwd(), '..', '..', 'uploads');

  let root = local;
  if (fs.existsSync(path.join(appRoot, 'audio')) || fs.existsSync(appRoot)) {
    root = appRoot;
  }

  const audioDir = path.join(root, 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }
  return root;
}

/** Shared audio upload directory for multer + worker (must match static /uploads route). */
export function getUploadAudioDir(): string {
  return path.join(resolveUploadsRoot(), 'audio');
}

export function getLocalAudioPath(filename: string): string {
  return path.join(getUploadAudioDir(), filename);
}

export function getPublicAudioUrl(filename: string): string {
  const port = process.env.M01_API_PORT || '3001';
  const host = process.env.M01_API_HOST || 'localhost';
  return `http://${host}:${port}/uploads/audio/${filename}`;
}
