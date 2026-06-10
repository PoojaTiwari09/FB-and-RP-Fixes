"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSessionCreatedEvent = void 0;
class AiSessionCreatedEvent {
    sessionId;
    repId;
    scenarioId;
    constructor(sessionId, repId, scenarioId) {
        this.sessionId = sessionId;
        this.repId = repId;
        this.scenarioId = scenarioId;
    }
}
exports.AiSessionCreatedEvent = AiSessionCreatedEvent;
//# sourceMappingURL=ai-session-created.event.js.map