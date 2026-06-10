"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadRemoteAudioToLocal = downloadRemoteAudioToLocal;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const upload_paths_1 = require("./upload-paths");
async function downloadRemoteAudioToLocal(sourceUrl, suggestedBasename) {
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
    const localPath = (0, upload_paths_1.getLocalAudioPath)(filename);
    fs.writeFileSync(localPath, buffer);
    const contentType = res.headers.get('content-type') ?? '';
    const mimeType = contentType.startsWith('audio/') ? contentType.split(';')[0].trim() : 'audio/mpeg';
    return { filename, fileSizeBytes: buffer.length, mimeType };
}
//# sourceMappingURL=fetch-remote-audio.js.map