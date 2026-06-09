import { Injectable, Logger, HttpException, HttpStatus, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type HubSpotHttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/**
 * Shared HubSpot REST client for M04/M05/M06.
 * Supports env token (HUBSPOT_ACCESS_TOKEN) or per-request OAuth bearer override.
 */
@Injectable()
export class HubSpotClientService {
  private readonly logger = new Logger(HubSpotClientService.name);
  private readonly defaultToken: string;
  private readonly apiUrl: string;
  private readonly rateLimit = { max: 100, window: 10_000, requests: [] as number[] };

  constructor(@Optional() private readonly configService?: ConfigService) {
    this.defaultToken =
      process.env.HUBSPOT_ACCESS_TOKEN ||
      process.env.HUBSPOT_API_KEY ||
      this.configService?.get<string>('HUBSPOT_ACCESS_TOKEN') ||
      '';
    this.apiUrl =
      process.env.HUBSPOT_API_URL ||
      this.configService?.get<string>('HUBSPOT_API_URL') ||
      'https://api.hubapi.com';
  }

  isConfigured(): boolean {
    return Boolean(this.defaultToken);
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    this.rateLimit.requests = this.rateLimit.requests.filter((t) => now - t < this.rateLimit.window);
    if (this.rateLimit.requests.length >= this.rateLimit.max) {
      const wait = this.rateLimit.window - (now - this.rateLimit.requests[0]);
      await new Promise((r) => setTimeout(r, wait));
      return this.throttle();
    }
    this.rateLimit.requests.push(now);
  }

  async request<T>(
    method: HubSpotHttpMethod,
    path: string,
    options?: { accessToken?: string; params?: Record<string, string>; body?: unknown },
  ): Promise<T> {
    await this.throttle();
    const token = options?.accessToken || this.defaultToken;
    if (!token) {
      throw new HttpException('HubSpot not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    const url = new URL(path.startsWith('http') ? path : `${this.apiUrl}${path}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: options?.body != null ? JSON.stringify(options.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`HubSpot ${method} ${path} failed: ${text}`);
      throw new HttpException(`HubSpot API error: ${text}`, res.status);
    }

    return res.json() as Promise<T>;
  }

  async getCrmDealsPage(
    accessToken: string,
    properties: string[],
    limit = '50',
  ): Promise<{ results: Array<{ id: string; properties: Record<string, string> }> }> {
    return this.request('GET', '/crm/v3/objects/deals', {
      accessToken,
      params: { limit, properties: properties.join(',') },
    });
  }
}
