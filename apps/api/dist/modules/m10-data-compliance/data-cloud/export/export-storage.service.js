"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportStorageService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
let ExportStorageService = class ExportStorageService {
    baseDir;
    constructor() {
        this.baseDir =
            process.env.M10_EXPORT_STORAGE_DIR ??
                (0, path_1.join)(process.cwd(), "uploads", "m10-exports");
    }
    runDirectory(tenantId, runId) {
        return (0, path_1.join)(this.baseDir, tenantId, runId);
    }
    datasetPaths(tenantId, runId, dataset) {
        const dir = this.runDirectory(tenantId, runId);
        return {
            dir,
            csv: (0, path_1.join)(dir, `${dataset}.csv`),
            parquet: (0, path_1.join)(dir, `${dataset}.parquet`),
        };
    }
    downloadUrl(runId, dataset, format) {
        const base = process.env.M10_API_PUBLIC_URL ?? "http://localhost:3001";
        return `${base}/api/v1/m10-data-compliance/exports/runs/${runId}/download?dataset=${dataset}&format=${format}`;
    }
    resolveDownloadPath(tenantId, runId, dataset, format) {
        const paths = this.datasetPaths(tenantId, runId, dataset);
        const fs = require("fs");
        if (!fs.existsSync(paths.dir)) {
            fs.mkdirSync(paths.dir, { recursive: true });
        }
        if (format === "csv") {
            if (!fs.existsSync(paths.csv)) {
                fs.writeFileSync(paths.csv, "id,name,value\r\n1,mock,100\r\n");
            }
            return paths.csv;
        }
        if (!fs.existsSync(paths.parquet)) {
            fs.writeFileSync(paths.parquet, "MOCK PARQUET BUNDLE DATA");
        }
        return paths.parquet;
    }
};
exports.ExportStorageService = ExportStorageService;
exports.ExportStorageService = ExportStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ExportStorageService);
//# sourceMappingURL=export-storage.service.js.map