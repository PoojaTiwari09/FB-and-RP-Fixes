"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M10_DATA_CLOUD_QUEUES = exports.M10_DATA_CLOUD_EVENTS = void 0;
exports.M10_DATA_CLOUD_EVENTS = {
    PUBLISHED: {
        EXPORT_STARTED: "data_cloud.export.started",
        EXPORT_COMPLETED: "data_cloud.export.completed",
        EXPORT_FAILED: "data_cloud.export.failed",
    },
};
exports.M10_DATA_CLOUD_QUEUES = {
    EXPORT: process.env.M10_DATA_EXPORT_QUEUE_NAME ?? "data-cloud-export",
};
//# sourceMappingURL=data-cloud.events.js.map