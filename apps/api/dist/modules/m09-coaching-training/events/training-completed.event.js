"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingCompletedEvent = void 0;
class TrainingCompletedEvent {
    sessionId;
    repId;
    score;
    constructor(sessionId, repId, score) {
        this.sessionId = sessionId;
        this.repId = repId;
        this.score = score;
    }
}
exports.TrainingCompletedEvent = TrainingCompletedEvent;
//# sourceMappingURL=training-completed.event.js.map