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
exports.uploadAudioToAssemblyAI = uploadAudioToAssemblyAI;
const fs = __importStar(require("fs"));
const upload_paths_1 = require("./upload-paths");
async function uploadAudioToAssemblyAI(apiKey, filename) {
    const localPath = (0, upload_paths_1.getLocalAudioPath)(filename);
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
    const json = (await res.json());
    if (!json.upload_url) {
        throw new Error('AssemblyAI upload response missing upload_url');
    }
    return json.upload_url;
}
//# sourceMappingURL=assemblyai-upload.js.map