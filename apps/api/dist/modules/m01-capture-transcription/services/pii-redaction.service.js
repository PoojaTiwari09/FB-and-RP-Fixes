"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PiiRedactionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiiRedactionService = void 0;
const common_1 = require("@nestjs/common");
const PII_TOKENS = {
    CREDIT_CARD: '[CREDIT CARD REDACTED]',
    PHONE: '[PHONE REDACTED]',
    EMAIL: '[EMAIL REDACTED]',
    SSN: '[SSN REDACTED]',
};
const PATTERNS = [
    {
        name: 'credit_card',
        regex: /\b(?:\d[ -]?){13,19}\b/g,
        token: PII_TOKENS.CREDIT_CARD,
    },
    {
        name: 'ssn',
        regex: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
        token: PII_TOKENS.SSN,
    },
    {
        name: 'email',
        regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
        token: PII_TOKENS.EMAIL,
    },
    {
        name: 'phone',
        regex: /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4,}\b/g,
        token: PII_TOKENS.PHONE,
    },
];
let PiiRedactionService = PiiRedactionService_1 = class PiiRedactionService {
    logger = new common_1.Logger(PiiRedactionService_1.name);
    redact(text) {
        const originalText = text;
        const redactedTypes = [];
        let redactedText = text;
        for (const { name, regex, token } of PATTERNS) {
            regex.lastIndex = 0;
            if (regex.test(redactedText)) {
                regex.lastIndex = 0;
                redactedText = redactedText.replace(regex, token);
                redactedTypes.push(name);
            }
        }
        const wasRedacted = redactedTypes.length > 0;
        if (wasRedacted) {
            this.logger.log(`[PII] Redacted patterns: [${redactedTypes.join(', ')}]`);
        }
        return { redactedText, originalText, wasRedacted, redactedTypes };
    }
    redactUtterances(utterances) {
        return utterances.map((u) => {
            const { redactedText, originalText } = this.redact(u.text);
            return { ...u, text: redactedText, originalText };
        });
    }
};
exports.PiiRedactionService = PiiRedactionService;
exports.PiiRedactionService = PiiRedactionService = PiiRedactionService_1 = __decorate([
    (0, common_1.Injectable)()
], PiiRedactionService);
//# sourceMappingURL=pii-redaction.service.js.map