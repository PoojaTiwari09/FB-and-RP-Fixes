export declare function mapUtterance(u: any): {
    entryId: any;
    timestamp: string;
    speakerName: any;
    speakerType: "rep" | "customer";
    text: any;
    confidence: string;
};
export declare function mapTalkRatio(talkRatio: any): {
    rep: {
        percentage: number;
    };
    customer: {
        percentage: number;
    };
};
export declare function mapTopicsFromHighlights(highlights: any[] | null | undefined): {
    topicId: string;
    label: any;
    timestamp: string;
    description: any;
    color: string;
}[];
export declare function mapAudio(call: any): {
    audioUrl: any;
    duration: string;
    format: string;
};
