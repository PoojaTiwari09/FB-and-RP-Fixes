import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { m03DataStore } from './m03-data.store';

@Injectable()
export class FeedbackService {
  async submitFeedback(params: {
    orgId: string;
    userId: string;
    reportId: string;
    type: string;
    sectionId?: string;
    bulletId?: string;
    note?: string;
  }) {
    m03DataStore.feedback.push({
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
  }
}
