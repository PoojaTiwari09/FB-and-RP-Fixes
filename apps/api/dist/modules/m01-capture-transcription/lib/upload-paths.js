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
exports.resolveUploadsRoot = resolveUploadsRoot;
exports.getUploadAudioDir = getUploadAudioDir;
exports.getLocalAudioPath = getLocalAudioPath;
exports.getPublicAudioUrl = getPublicAudioUrl;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function resolveUploadsRoot() {
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
function getUploadAudioDir() {
    return path.join(resolveUploadsRoot(), 'audio');
}
function getLocalAudioPath(filename) {
    return path.join(getUploadAudioDir(), filename);
}
function getPublicAudioUrl(filename) {
    const port = process.env.M01_API_PORT || '3001';
    const host = process.env.M01_API_HOST || 'localhost';
    return `http://${host}:${port}/uploads/audio/${filename}`;
}
//# sourceMappingURL=upload-paths.js.map