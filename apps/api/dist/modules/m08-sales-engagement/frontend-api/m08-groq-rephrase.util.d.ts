export declare function rephraseEmailWithGroq(input: {
    subject?: string;
    body?: string;
    bodyHtml?: string;
    contactName?: string;
    company?: string;
    tone?: string;
}): Promise<string>;
