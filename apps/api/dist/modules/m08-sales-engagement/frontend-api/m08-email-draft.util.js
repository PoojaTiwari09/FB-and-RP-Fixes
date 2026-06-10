"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAutoEmailDraft = buildAutoEmailDraft;
const DEFAULT_FROM_EMAIL = 'alex.chen@company.com';
const DEFAULT_FROM_LABEL = 'alex.chen@company.com (Gmail)';
function firstName(fullName) {
    return fullName.trim().split(/\s+/)[0] || 'there';
}
function guessContactEmail(contactName, companyName) {
    const first = contactName.trim().split(/\s+/)[0]?.toLowerCase() || 'contact';
    const last = contactName.trim().split(/\s+/).slice(-1)[0]?.toLowerCase() || 'team';
    const domain = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 24) || 'company';
    return `${first}.${last}@${domain}.com`;
}
function buildSubject(task) {
    if (task.title?.trim())
        return task.title.trim();
    const channel = task.channel.toUpperCase();
    if (task.sequenceName && task.sequenceStep) {
        if (channel === 'EMAIL' && task.sequenceStep.toLowerCase().includes('step 5')) {
            return 'Final onboarding step — meet your CSM team';
        }
        if (channel === 'EMAIL') {
            return `${task.sequenceName} — ${task.sequenceStep} for ${task.companyName}`;
        }
        return `Follow-up: ${task.sequenceName} · ${task.sequenceStep}`;
    }
    if (channel === 'EMAIL') {
        return `Next steps for ${task.companyName}`;
    }
    if (channel === 'CALL') {
        return `Quick follow-up — ${task.companyName}`;
    }
    return `Following up with ${task.companyName}`;
}
function buildBodyHtml(task) {
    const name = firstName(task.contactName);
    const channel = task.channel.toUpperCase();
    const steps = (task.recommendedNextSteps || []).filter(Boolean).slice(0, 4);
    const intro = channel === 'EMAIL' && task.sequenceStep?.toLowerCase().includes('step 5')
        ? `<p>You've made it to the final step of the onboarding journey — congratulations!</p>
<p>I'd love to introduce you to your dedicated Customer Success Manager, who will be your go-to contact for implementation and beyond.</p>`
        : channel === 'EMAIL'
            ? `<p>I wanted to follow up on ${task.companyName}'s onboarding progress and make sure you have everything you need for the next milestone.</p>`
            : channel === 'CALL'
                ? `<p>Thank you for taking the time to connect. I wanted to follow up while the conversation is still fresh.</p>`
                : `<p>I wanted to follow up regarding ${task.companyName} and share a few tailored next steps.</p>`;
    const insightBlock = task.aiInsight?.trim()
        ? `<p>${task.aiInsight.trim()}</p>`
        : task.aiSignal?.trim()
            ? `<p>${task.aiSignal.trim()}</p>`
            : '';
    const stepsBlock = steps.length > 0
        ? `<p><strong>What's next:</strong></p>
<ol>
${steps.map((step) => `  <li>${step}</li>`).join('\n')}
</ol>`
        : `<p>Would you be open to a brief call this week to walk through priorities and timeline?</p>`;
    const closing = channel === 'EMAIL' && task.sequenceStep?.toLowerCase().includes('step 5')
        ? `<p>You've been an absolute pleasure to work with — looking forward to seeing your results once you're live.</p>`
        : `<p>Happy to adjust the plan based on your team's priorities — just let me know what works best.</p>`;
    return `<p>Hi ${name},</p>
${intro}
${insightBlock}
${stepsBlock}
${closing}
<p>Best,<br/>Alex</p>`;
}
function buildAutoEmailDraft(task, contact) {
    const contactEmail = contact?.email?.trim() || guessContactEmail(task.contactName, task.companyName);
    return {
        taskId: task.taskId,
        contactName: task.contactName,
        contactEmail,
        fromEmail: DEFAULT_FROM_EMAIL,
        fromLabel: DEFAULT_FROM_LABEL,
        subject: buildSubject(task),
        bodyHtml: buildBodyHtml(task),
        sequenceName: task.sequenceName || '',
        sequenceStep: task.sequenceStep || '',
        dueDateTime: task.dueDateTime || '',
    };
}
//# sourceMappingURL=m08-email-draft.util.js.map