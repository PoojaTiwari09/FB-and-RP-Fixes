"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3_RECORDINGS_CATALOG = void 0;
exports.getS3RecordingById = getS3RecordingById;
exports.S3_RECORDINGS_CATALOG = [
    {
        id: '2min_sales',
        displayName: '2min_sales.mp3',
        sourceUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
    },
    {
        id: '3mins_sales',
        displayName: '3mins_sales.mp3',
        sourceUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
    },
    {
        id: '10mins_sales',
        displayName: '10mins_sales.wav',
        sourceUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/10mins_sales.wav',
    },
    {
        id: 'resources_sample',
        displayName: 'resources_sample-calls.mp3',
        sourceUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/resources_sample-calls.mp3',
    },
];
function getS3RecordingById(id) {
    return exports.S3_RECORDINGS_CATALOG.find((r) => r.id === id);
}
//# sourceMappingURL=s3-recordings-catalog.js.map