import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FeedbackService {
  constructor(private supabase: SupabaseService) {}

  async submitFeedback(params: {
    orgId: string;
    userId: string;
    reportId: string;
    type: string;
    sectionId?: string;
    bulletId?: string;
    note?: string;
  }) {
    const client = this.supabase.getClient();
    if (!client) return { status: 'ok' };

    try {
      await client.from('feedback').insert({
        id: uuidv4(),
        org_id: params.orgId,
        user_id: params.userId,
        report_id: params.reportId,
        section_id: params.sectionId,
        bullet_id: params.bulletId,
        feedback_type: params.type,
        note: params.note,
      });

      return { status: 'ok' };
    } catch (err) {
      console.error('Feedback insert error:', err);
      return { status: 'error', message: err.message };
    }
  }
}
