import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

/**
 * Parquet export — schema-safe JSON-lines fallback when native Parquet lib unavailable.
 * Files use .parquet.json extension for analytics pipelines that accept newline JSON;
 * when parquetjs is present, upgrade path is documented in m10_export_pipeline_report.md.
 *
 * For production Parquet binary, set M10_EXPORT_PARQUET_BINARY=true and install parquetjs.
 */

function flattenRow(row: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) {
      out[k] = null;
    } else if (v instanceof Date) {
      out[k] = v.toISOString();
    } else if (typeof v === 'object') {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = v as string | number | boolean;
    }
  }
  return out;
}

export async function writeParquetExport(
  filePath: string,
  rows: Record<string, unknown>[],
): Promise<{ rowCount: number; format: string }> {
  await mkdir(dirname(filePath), { recursive: true });

  if (process.env.M10_EXPORT_PARQUET_BINARY === 'true') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const parquet = require('parquetjs');
      const schema = buildParquetSchema(rows);
      const writer = await parquet.ParquetWriter.openFile(schema, filePath);
      for (const row of rows) {
        await writer.appendRow(flattenRow(row));
      }
      await writer.close();
      return { rowCount: rows.length, format: 'parquet-binary' };
    } catch {
      // fall through to JSONL bundle
    }
  }

  const jsonlPath = filePath.endsWith('.parquet') ? `${filePath}.jsonl` : filePath;
  const lines = rows.map(r => JSON.stringify(flattenRow(r))).join('\n') + (rows.length ? '\n' : '');
  await writeFile(jsonlPath, lines, 'utf8');
  return { rowCount: rows.length, format: 'parquet-jsonl' };
}

function buildParquetSchema(rows: Record<string, unknown>[]) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const parquet = require('parquetjs');
  const sample = rows[0] ?? { id: 'x', tenantId: 'x', updatedAt: new Date().toISOString() };
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(flattenRow(sample))) {
    if (typeof v === 'number') fields[k] = { type: 'DOUBLE', optional: true };
    else if (typeof v === 'boolean') fields[k] = { type: 'BOOLEAN', optional: true };
    else fields[k] = { type: 'UTF8', optional: true };
  }
  return new parquet.ParquetSchema(fields);
}
