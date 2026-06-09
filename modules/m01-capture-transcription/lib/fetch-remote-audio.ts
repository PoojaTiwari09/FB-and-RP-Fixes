import * as fs from 'fs';
import * as path from 'path';
import { getLocalAudioPath } from './upload-paths';

/**
 * Download a public audio URL into uploads/audio (same store as multer uploads).
 */
export async function downloadRemoteAudioToLocal(
  sourceUrl: string,
  suggestedBasename: string,
): Promise<{ filename: string; fileSizeBytes: number; mimeType: string }> {
  const res = await fetch(sourceUrl, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to download audio from S3 (${res.status} ${res.statusText})`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error('Downloaded audio file is empty');
  }

  const ext = path.extname(suggestedBasename) || '.mp3';
  const safeStem = path
    .basename(suggestedBasename, ext)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .slice(0, 48);
  const filename = `call-s3-${safeStem}-${Date.now()}${ext}`;
  const localPath = getLocalAudioPath(filename);
  fs.writeFileSync(localPath, buffer);

  const contentType = res.headers.get('content-type') ?? '';
  const mimeType =
    contentType.startsWith('audio/') ? contentType.split(';')[0].trim() : 'audio/mpeg';

  return { filename, fileSizeBytes: buffer.length, mimeType };
}
