"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeParquetExport = writeParquetExport;
const promises_1 = require("fs/promises");
const path_1 = require("path");
function flattenRow(row) {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
        if (v === null || v === undefined) {
            out[k] = null;
        }
        else if (v instanceof Date) {
            out[k] = v.toISOString();
        }
        else if (typeof v === "object") {
            out[k] = JSON.stringify(v);
        }
        else {
            out[k] = v;
        }
    }
    return out;
}
async function writeParquetExport(filePath, rows) {
    await (0, promises_1.mkdir)((0, path_1.dirname)(filePath), { recursive: true });
    if (process.env.M10_EXPORT_PARQUET_BINARY === "true") {
        try {
            const parquet = require("parquetjs");
            const schema = buildParquetSchema(rows);
            const writer = await parquet.ParquetWriter.openFile(schema, filePath);
            for (const row of rows) {
                await writer.appendRow(flattenRow(row));
            }
            await writer.close();
            return { rowCount: rows.length, format: "parquet-binary" };
        }
        catch {
        }
    }
    const jsonlPath = filePath.endsWith(".parquet")
        ? `${filePath}.jsonl`
        : filePath;
    const lines = rows.map((r) => JSON.stringify(flattenRow(r))).join("\n") +
        (rows.length ? "\n" : "");
    await (0, promises_1.writeFile)(jsonlPath, lines, "utf8");
    return { rowCount: rows.length, format: "parquet-jsonl" };
}
function buildParquetSchema(rows) {
    const parquet = require("parquetjs");
    const sample = rows[0] ?? {
        id: "x",
        tenantId: "x",
        updatedAt: new Date().toISOString(),
    };
    const fields = {};
    for (const [k, v] of Object.entries(flattenRow(sample))) {
        if (typeof v === "number")
            fields[k] = { type: "DOUBLE", optional: true };
        else if (typeof v === "boolean")
            fields[k] = { type: "BOOLEAN", optional: true };
        else
            fields[k] = { type: "UTF8", optional: true };
    }
    return new parquet.ParquetSchema(fields);
}
//# sourceMappingURL=parquet-export.writer.js.map