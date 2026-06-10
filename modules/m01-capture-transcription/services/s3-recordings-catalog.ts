/** Curated S3 recordings available via "Upload from S3" in M01. */
export interface S3RecordingCatalogEntry {
  id: string;
  displayName: string;
  sourceUrl: string;
}

export const S3_RECORDINGS_CATALOG: S3RecordingCatalogEntry[] = [
  {
    id: '2min_sales',
    displayName: '2min_sales.mp3',
    sourceUrl:
      'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
  },
  {
    id: '3mins_sales',
    displayName: '3mins_sales.mp3',
    sourceUrl:
      'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
  },
  {
    id: '10mins_sales',
    displayName: '10mins_sales.wav',
    sourceUrl:
      'https://recordings-buttons.s3.eu-north-1.amazonaws.com/10mins_sales.wav',
  },
  {
    id: 'resources_sample',
    displayName: 'resources_sample-calls.mp3',
    sourceUrl:
      'https://recordings-buttons.s3.eu-north-1.amazonaws.com/resources_sample-calls.mp3',
  },
];

export function getS3RecordingById(id: string): S3RecordingCatalogEntry | undefined {
  return S3_RECORDINGS_CATALOG.find((r) => r.id === id);
}
