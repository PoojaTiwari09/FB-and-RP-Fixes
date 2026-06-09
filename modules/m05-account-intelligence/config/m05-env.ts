/**
 * M05 environment variable accessors — names aligned with
 * doc/reference/M5 Account Intelligence/Environment Variables Registry-M5*.md
 */

const PRODUCTION_ENVS = new Set(['production', 'staging']);

export function isProductionLike(): boolean {
  const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
  return PRODUCTION_ENVS.has(appEnv);
}

/** Canonical HubSpot webhook HMAC secret (registry: M05_HUBSPOT_WEBHOOK_SECRET). */
export function getM05HubspotWebhookSecret(): string | undefined {
  const value =
    process.env.M05_HUBSPOT_WEBHOOK_SECRET?.trim() ||
    process.env.HUBSPOT_WEBHOOK_SECRET?.trim();
  return value || undefined;
}

export function assertM05WebhookSecretConfigured(): void {
  if (isProductionLike() && !getM05HubspotWebhookSecret()) {
    throw new Error(
      'M05_HUBSPOT_WEBHOOK_SECRET is required when APP_ENV/NODE_ENV is production or staging',
    );
  }
}

export function getM05Enabled(): boolean {
  return (process.env.M05_ENABLED ?? 'true').toLowerCase() !== 'false';
}
