import * as fs from 'fs';
import { getLocalAudioPath } from './upload-paths';

/**
 * Upload local audio to AssemblyAI via REST (avoids SDK fetch/undici body issues on Node).
 */
export async function uploadAudioToAssemblyAI(
  apiKey: string,
  filename: string,
): Promise<string> {
  const localPath = getLocalAudioPath(filename);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Audio file not found on disk: ${localPath}`);
  }

  const buffer = fs.readFileSync(localPath);
  if (buffer.length === 0) {
    throw new Error(`Audio file is empty: ${localPath}`);
  }

  const res = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AssemblyAI upload failed (${res.status}): ${text || res.statusText}`);
  }

  const json = (await res.json()) as { upload_url?: string };
  if (!json.upload_url) {
    throw new Error('AssemblyAI upload response missing upload_url');
  }
  return json.upload_url;
}
