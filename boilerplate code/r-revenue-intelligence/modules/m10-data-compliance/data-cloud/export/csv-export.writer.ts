import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function writeCsvExport(
  filePath: string,
  rows: Record<string, unknown>[],
): Promise<{ rowCount: number; columns: string[] }> {
  await mkdir(dirname(filePath), { recursive: true });
  const columns =
    rows.length > 0
      ? Object.keys(rows[0])
      : ['id', 'tenantId', 'updatedAt'];

  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map(c => escapeCsvCell(row[c])).join(','));
  }
  const body = lines.join('\n') + '\n';
  const stream = Readable.from([body]);
  await pipeline(stream, createWriteStream(filePath, { encoding: 'utf8' }));
  return { rowCount: rows.length, columns };
}
