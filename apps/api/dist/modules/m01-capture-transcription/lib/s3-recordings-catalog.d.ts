export interface S3RecordingCatalogEntry {
    id: string;
    displayName: string;
    sourceUrl: string;
}
export declare const S3_RECORDINGS_CATALOG: S3RecordingCatalogEntry[];
export declare function getS3RecordingById(id: string): S3RecordingCatalogEntry | undefined;
