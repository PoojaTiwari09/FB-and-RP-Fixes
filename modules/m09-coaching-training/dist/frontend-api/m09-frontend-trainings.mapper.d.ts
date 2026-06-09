export declare function defaultVoices(): {
    id: string;
    label: string;
    description: string;
    previewText: string;
}[];
export declare function mapTrainingListItem(scenario: any, assignment?: any): {
    id: any;
    title: any;
    dueDateIso: any;
    status: string;
    progressPercent: any;
    lastSessionId: any;
};
export declare function mapTrainingSetup(scenario: any): {
    id: any;
    title: any;
    contactPersona: {
        name: any;
        jobTitle: any;
        company: any;
        motivations: any;
        communicationStyle: any;
    };
    meetingContext: {
        scenario: any;
        objective: any;
        backgroundForTrainee: any;
    };
    playbookSections: {
        id: string;
        title: string;
        questions: {
            id: string;
            text: string;
            tags: string[];
            whyItMatters: string;
        }[];
    }[];
    voices: {
        id: string;
        label: string;
        description: string;
        previewText: string;
    }[];
};
export declare function mapMessages(messages: any[]): {
    id: any;
    sender: string;
    text: any;
    timestampSeconds: any;
}[];
export declare function mapSessionState(session: any, scenario: any, messages: any[]): {
    sessionId: any;
    status: any;
    elapsedSeconds: any;
    messageCount: number;
    selectedVoiceId: any;
    messages: {
        id: any;
        sender: string;
        text: any;
        timestampSeconds: any;
    }[];
    context: {
        id: any;
        title: any;
        contactPersona: {
            name: any;
            jobTitle: any;
            company: any;
            motivations: any;
            communicationStyle: any;
        };
        meetingContext: {
            scenario: any;
            objective: any;
            backgroundForTrainee: any;
        };
        playbookSections: {
            id: string;
            title: string;
            questions: {
                id: string;
                text: string;
                tags: string[];
                whyItMatters: string;
            }[];
        }[];
        voices: {
            id: string;
            label: string;
            description: string;
            previewText: string;
        }[];
    };
};
export declare function mapResults(session: any, feedback: any): {
    trainingId: any;
    trainingTitle: any;
    resultsReady: boolean;
    status: string;
    overallScore?: undefined;
    maxScore?: undefined;
    performanceTier?: undefined;
    tierLabel?: undefined;
    summaryText?: undefined;
    performanceTags?: undefined;
    scoredSections?: undefined;
    performanceBreakdown?: undefined;
    transcript?: undefined;
} | {
    trainingId: any;
    trainingTitle: any;
    overallScore: any;
    maxScore: number;
    performanceTier: string;
    tierLabel: string;
    summaryText: any;
    performanceTags: any;
    scoredSections: {
        id: string;
        categoryName: string;
        score: any;
        maxScore: number;
        status: string;
        questions: {
            id: string;
            text: string;
            tags: string[];
            whyItMatters: string;
        }[];
    }[];
    performanceBreakdown: {
        category: string;
        score: any;
        maxScore: number;
        percentage: number;
        description: string;
        strengths: any;
        areasForImprovement: any;
    }[];
    transcript: {
        id: any;
        sender: string;
        text: any;
        timestampSeconds: any;
    }[];
    resultsReady: boolean;
    status?: undefined;
};
