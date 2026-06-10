"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCsvExport = writeCsvExport;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const promises_2 = require("stream/promises");
const stream_1 = require("stream");
function escapeCsvCell(value) {
    if (value === null || value === undefined)
        return '';
    const s = value instanceof Date ? value.toISOString() : String(value);
    if (/[",\n\r]/.test(s))
        return `"${s.replace(/"/g, '""')}"`;
    return s;
}
async function writeCsvExport(filePath, rows) {
    await (0, promises_1.mkdir)((0, path_1.dirname)(filePath), { recursive: true });
    const columns = rows.length > 0
        ? Object.keys(rows[0])
        : ['id', 'tenantId', 'updatedAt'];
    const lines = [columns.join(',')];
    for (const row of rows) {
        lines.push(columns.map(c => escapeCsvCell(row[c])).join(','));
    }
    const body = lines.join('\n') + '\n';
    const stream = stream_1.Readable.from([body]);
    await (0, promises_2.pipeline)(stream, (0, fs_1.createWriteStream)(filePath, { encoding: 'utf8' }));
    return { rowCount: rows.length, columns };
}
//# sourceMappingURL=csv-export.writer.js.map