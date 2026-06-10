export declare function downloadRemoteAudioToLocal(sourceUrl: string, suggestedBasename: string): Promise<{
    filename: string;
    fileSizeBytes: number;
    mimeType: string;
}>;
