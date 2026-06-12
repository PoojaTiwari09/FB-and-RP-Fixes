// M10 Data Cloud — Event & Queue Constants
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0)

export const M10_DATA_CLOUD_EVENTS = {
  PUBLISHED: {
    EXPORT_STARTED: "data_cloud.export.started",
    EXPORT_COMPLETED: "data_cloud.export.completed",
    EXPORT_FAILED: "data_cloud.export.failed",
  },
} as const;

// BullMQ queue names — M10_ prefixed per monorepo convention
export const M10_DATA_CLOUD_QUEUES = {
  EXPORT: process.env.M10_DATA_EXPORT_QUEUE_NAME ?? "data-cloud-export",
} as const;
