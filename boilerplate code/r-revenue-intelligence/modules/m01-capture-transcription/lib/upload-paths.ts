import * as fs from 'fs';
import * as path from 'path';

/** Shared audio upload directory for multer + worker (must match ServeStaticModule). */
export function getUploadAudioDir(): string {
  const dir = path.resolve(process.cwd(), 'uploads', 'audio');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getLocalAudioPath(filename: string): string {
  return path.join(getUploadAudioDir(), filename);
}

export function getPublicAudioUrl(filename: string): string {
  const port = process.env.M01_API_PORT || '3001';
  const host = process.env.M01_API_HOST || 'localhost';
  return `http://${host}:${port}/uploads/audio/${filename}`;
}
