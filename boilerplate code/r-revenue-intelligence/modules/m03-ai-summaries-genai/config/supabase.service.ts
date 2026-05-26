import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL', '');
    const key = this.configService.get<string>('SUPABASE_SERVICE_KEY', '');

    if (url && key) {
      this.client = createClient(url, key);
      console.log('Supabase client initialized');
    } else {
      console.warn('Supabase credentials not configured — running in mock mode');
    }
  }

  getClient(): SupabaseClient | null {
    return this.client || null;
  }

  async query(table: string) {
    if (!this.client) return null;
    return this.client.from(table);
  }
}
