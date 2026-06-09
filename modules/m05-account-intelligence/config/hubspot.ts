/**
 * HubSpot client singleton for NestJS
 */
import * as hubspot from '@hubspot/api-client';

let hubspotInstance: hubspot.Client | null = null;

export function getHubspot(): hubspot.Client {
  if (!hubspotInstance) {
    const token = process.env.HUBSPOT_ACCESS_TOKEN || '';
    if (!token) {
      throw new Error('HUBSPOT_ACCESS_TOKEN not set');
    }
    hubspotInstance = new hubspot.Client({ accessToken: token });
  }
  return hubspotInstance;
}
