import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { M09Repository } from '../repositories/m09.repository';
import { LlmService } from '../services/m09.service';

@Injectable()
export class M09Worker {
  constructor(
    private readonly repository: M09Repository,
    @Inject(forwardRef(() => LlmService))
    private readonly llmService: LlmService
  ) {}

  async runCoachingAgent(
    sessionId: string,
    repId: string,
    feedback: any,
    scenario: any
  ): Promise<any> {
    console.log('[AGENT] 🤖 Coaching agent started for rep:', repId);
    console.log('[AGENT] Overall score:', feedback.overall_score);

    try {
      // ═══ STEP 1: OBSERVE ═══
      const recentSessions = await this.repository.findRecentSessions(repId, 5);

      const scores = recentSessions.map(s => ({
        overall: (s.feedback_json as any)?.overall_score || 0,
        opening: (s.feedback_json as any)?.scores?.opening || 0,
        discovery: (s.feedback_json as any)?.scores?.discovery || 0,
        objection: (s.feedback_json as any)?.scores?.objection_handling || 0,
        talk_ratio: (s.feedback_json as any)?.scores?.talk_ratio || 0,
        closing: (s.feedback_json as any)?.scores?.closing || 0,
      }));

      console.log('[AGENT] Recent scores:', scores);

      // ═══ STEP 2: REASON ═══
      const avgScores = {
        opening: scores.reduce((a, b) => a + b.opening, 0) / Math.max(scores.length, 1),
        discovery: scores.reduce((a, b) => a + b.discovery, 0) / Math.max(scores.length, 1),
        objection_handling: scores.reduce((a, b) => a + b.objection, 0) / Math.max(scores.length, 1),
        talk_ratio: scores.reduce((a, b) => a + b.talk_ratio, 0) / Math.max(scores.length, 1),
        closing: scores.reduce((a, b) => a + b.closing, 0) / Math.max(scores.length, 1),
      };

      const weakestSkill = Object.entries(avgScores).sort((a, b) => a[1] - b[1])[0][0];
      const isStruggling = feedback.overall_score < 60;
      const isDeclining = scores.length >= 3 && scores[0].overall < scores[2].overall - 10;

      console.log('[AGENT] Weakest skill:', weakestSkill);

      const analysisPrompt = `
  You are an expert sales coaching AI agent.
  Analyze this rep's performance and generate coaching actions.

  CURRENT SESSION:
  - Overall Score: ${feedback.overall_score}/100
  - Scores: ${JSON.stringify(feedback.scores)}
  - Scenario: ${scenario.persona_name} (${scenario.difficulty})
  - Summary: ${feedback.evaluation_summary}

  RECENT PERFORMANCE TREND:
  ${scores.map((s, i) => `Session ${i+1}: ${s.overall}/100`).join('\n')}

  IDENTIFIED WEAKEST SKILL: ${weakestSkill}
  IS STRUGGLING (score < 60): ${isStruggling}
  IS DECLINING: ${isDeclining}

  Generate coaching actions. Return ONLY this JSON:
  {
    "coaching_note": {
      "content": "<2-3 sentence specific coaching note for manager>",
      "priority": "High|Medium|Low"
    },
    "rep_recommendation": {
      "focus_area": "<e.g. Discovery, Objection Handling>",
      "recommendation_text": "<2-3 sentences advising the rep directly on how to improve>",
      "suggested_action": "<Short actionable next step>"
    },
    "should_assign_scenario": true|false,
    "recommended_scenario_type": "<type of scenario to practice>",
    "recommended_difficulty": "beginner|intermediate|advanced",
    "reasoning": "<1 sentence why this recommendation>",
    "agent_summary": "<1 sentence summary of what agent did>"
  }`;

      const agentActions = await this.llmService.generateCoachingActions(analysisPrompt);
      console.log('[AGENT] Actions decided:', agentActions);

      // ═══ STEP 3: ACT ═══
      const rep = await this.repository.getUserById(repId);
      const managerId = rep?.manager_id;
      console.log('[AGENT] Rep:', rep?.name, 'Manager:', managerId);

      // ACT 1: Create coaching note
      if (agentActions.coaching_note && managerId) {
        const scenarios = await this.repository.findAllScenarios(rep.org_id);
        const anyScenarioId = scenarios?.[0]?.id || scenario.id;

        await this.repository.createCoachingNote({
          rep_id: repId,
          manager_id: managerId,
          org_id: rep.org_id,
          content: agentActions.coaching_note.content,
          priority: agentActions.coaching_note.priority || 'Medium',
          is_agent_generated: true,
          weakest_skill: weakestSkill
        });

        console.log('[AGENT] ✅ Coaching note created');
      }

      // ACT 2: Auto-assign practice scenario
      if (agentActions.should_assign_scenario && managerId) {
        const difficulty = agentActions.recommended_difficulty || 'intermediate';
        const practiceScenario = await this.repository.findScenarioByDifficulty(difficulty);

        if (practiceScenario) {
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 3);

          await this.repository.bulkCreateAssignments([{
            rep_id: repId,
            manager_id: managerId,
            scenario_id: practiceScenario.id,
            priority: agentActions.coaching_note.priority || 'Medium',
            status: 'Pending',
            deadline: deadline,
            assigned_at: new Date()
          }]);

          console.log('[AGENT] ✅ Auto-assigned scenario:', practiceScenario.persona_name);
        }
      }

      // ACT 3: Create recommendation for the Rep
      if (agentActions.rep_recommendation) {
        await this.repository.createRecommendation({
          rep_id: repId,
          focus_area: agentActions.rep_recommendation.focus_area || weakestSkill,
          weakest_skill: weakestSkill,
          recommendation_text: agentActions.rep_recommendation.recommendation_text || agentActions.reasoning,
          suggested_action: agentActions.rep_recommendation.suggested_action || 'Complete assigned practice scenario.',
          priority: agentActions.coaching_note?.priority || 'Medium'
        });
        console.log('[AGENT] ✅ Recommendation created for Rep');
      }

      // ACT 3: Log manager alert threshold check (Gmail service removed)
      const ALERT_THRESHOLD = 30;
      if (managerId && feedback.overall_score < ALERT_THRESHOLD) {
        console.log(`[AGENT] 🚨 Score below ${ALERT_THRESHOLD}% threshold! Alert logged: rep "${rep?.name || 'Rep'}" needs urgent coaching on "${weakestSkill}".`);
      }

      console.log('[AGENT] ✅ Agent completed:', agentActions.agent_summary);
      return agentActions;
    } catch (err: any) {
      console.error('[AGENT] ❌ Error:', err.message);
      return null;
    }
  }

  async refreshAnalytics(orgId: string): Promise<boolean> {
    console.log('[ANALYTICS REFRESH WORKER] Refreshing analytics for org:', orgId);
    try {
      const repIds = await this.repository.getRepIdsByOrgId(orgId);
      console.log('[ANALYTICS REFRESH WORKER] Found reps to refresh:', repIds.length);
      return true;
    } catch (err: any) {
      console.error('[ANALYTICS REFRESH WORKER] Refresh failed:', err.message);
      return false;
    }
  }
}
