import type { ConversationRecord } from '../interfaces/search.interface';
export declare function scoreLabel(score: number): string;
export declare function mapSearchResultRow(c: ConversationRecord): {
    id: string;
    title: string;
    rep: {
        id: string;
        name: string;
    };
    date: string;
    durationMinutes: number;
    score: number;
    scoreLabel: string;
    deal: string;
    type: "call";
    status: string;
};
export declare function buildChartData(granularity: string, count: number): {
    label: string;
    count: number;
}[];
