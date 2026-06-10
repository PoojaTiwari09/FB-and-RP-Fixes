export declare function formatDuration(seconds: number): string;
export declare function formatDurationClock(seconds: number): string;
export declare function resolveOwner(record: any): {
    ownerId: any;
    ownerName: any;
    avatarInitials: string;
};
export declare function mapAiReviewerCallRow(record: any, review?: any): {
    id: any;
    callName: any;
    account: string;
    dateTime: any;
    duration: string;
    type: string;
    stage: string;
    score: any;
    status: any;
    tags: any;
};
export declare function mapCallListItem(record: any): {
    callId: any;
    callTitle: any;
    dealType: any;
    account: string;
    owner: {
        ownerId: any;
        ownerName: any;
        avatarInitials: string;
    };
    dateTime: any;
    duration: string;
    keyInsight: any;
    status: string;
    participants: any;
};
export declare function mapCallDetail(record: any): {
    callId: any;
    callTitle: any;
    account: string;
    type: string;
    dealType: any;
    dateTime: any;
    date: any;
    time: string;
    duration: string;
    source: any;
    participants: any;
    owner: {
        ownerId: any;
        ownerName: any;
        avatarInitials: string;
    };
    status: string;
};
export declare function mapCallMetadata(record: any): {
    audioUrl: string;
    callId: any;
    callTitle: any;
    account: string;
    type: string;
    dealType: any;
    dateTime: any;
    date: any;
    time: string;
    duration: string;
    source: any;
    participants: any;
    owner: {
        ownerId: any;
        ownerName: any;
        avatarInitials: string;
    };
};
export declare function mapCallSearchHit(hit: any): {
    keyInsight: any;
    callId: any;
    callTitle: any;
    dealType: any;
    account: string;
    owner: {
        ownerId: any;
        ownerName: any;
        avatarInitials: string;
    };
    dateTime: any;
    duration: string;
    status: string;
    participants: any;
};
