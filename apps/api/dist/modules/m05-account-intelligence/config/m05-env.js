"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProductionLike = isProductionLike;
exports.getM05HubspotWebhookSecret = getM05HubspotWebhookSecret;
exports.assertM05WebhookSecretConfigured = assertM05WebhookSecretConfigured;
exports.getM05Enabled = getM05Enabled;
const PRODUCTION_ENVS = new Set(['production', 'staging']);
function isProductionLike() {
    const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
    return PRODUCTION_ENVS.has(appEnv);
}
function getM05HubspotWebhookSecret() {
    const value = process.env.M05_HUBSPOT_WEBHOOK_SECRET?.trim() ||
        process.env.HUBSPOT_WEBHOOK_SECRET?.trim();
    return value || undefined;
}
function assertM05WebhookSecretConfigured() {
    if (isProductionLike() && !getM05HubspotWebhookSecret()) {
        throw new Error('M05_HUBSPOT_WEBHOOK_SECRET is required when APP_ENV/NODE_ENV is production or staging');
    }
}
function getM05Enabled() {
    return (process.env.M05_ENABLED ?? 'true').toLowerCase() !== 'false';
}
//# sourceMappingURL=m05-env.js.map