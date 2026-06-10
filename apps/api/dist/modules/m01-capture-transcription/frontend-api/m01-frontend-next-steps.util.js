"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseNextSteps = parseNextSteps;
exports.serializeNextSteps = serializeNextSteps;
exports.newStepId = newStepId;
const STEP_PREFIX = 'step_';
function parseNextSteps(raw) {
    if (!raw?.length)
        return [];
    return raw.map((entry, index) => {
        try {
            const parsed = JSON.parse(entry);
            if (parsed?.id && parsed?.description != null) {
                return {
                    stepId: String(parsed.id),
                    description: String(parsed.description),
                    completed: Boolean(parsed.completed),
                };
            }
        }
        catch {
        }
        return {
            stepId: `${STEP_PREFIX}${String(index + 1).padStart(3, '0')}`,
            description: entry,
            completed: false,
        };
    });
}
function serializeNextSteps(steps) {
    return steps.map((s) => JSON.stringify({
        id: s.stepId,
        description: s.description,
        completed: s.completed,
    }));
}
function newStepId(existing) {
    const nums = existing
        .map((s) => {
        const m = /^step_(\d+)$/.exec(s.stepId);
        return m ? parseInt(m[1], 10) : 0;
    })
        .filter((n) => n > 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${STEP_PREFIX}${String(next).padStart(3, '0')}`;
}
//# sourceMappingURL=m01-frontend-next-steps.util.js.map