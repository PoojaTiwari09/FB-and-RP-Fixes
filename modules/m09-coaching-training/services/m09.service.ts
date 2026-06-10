import { Injectable, NotFoundException, BadRequestException, Inject, Optional, forwardRef, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { M09Repository } from '../repositories/m09.repository';
import { M09Worker } from '../workers/m09.worker';
import { StartSessionDto, SendMessageDto, CreateScenarioDto, UpdateScenarioDto, CreateAssignmentDto, UpdateAssignmentDto, ExportQueryDto } from '../schemas/m09.schema';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Groq from 'groq-sdk';
import { resolveLlmProviderKind } from '../providers/llm-provider.factory';


// ─── LLM SERVICE ─────────────────────────────────────────────────────────────

@Injectable()
export class LlmService {
  private readonly groq: Groq;
  private readonly groqApiKey: string;
  private readonly elevenLabsApiKey: string;
  private readonly aiMockMode: boolean;
  private readonly activeProvider: string;
  private readonly providerReason: string;

  // Optional + process.env fallback works around a pnpm-duplicate
  // `@nestjs/config` issue that can leave ConfigService injected as `undefined`
  // when the module's local node_modules ships its own copy of the package.
  constructor(@Optional() private readonly configService?: ConfigService) {
    const read = (k: string): string =>
      (this.configService?.get?.<string>(k) as string) || process.env[k] || '';
    this.groqApiKey = read('GROQ_API_KEY');
    this.elevenLabsApiKey = read('ELEVENLABS_API_KEY');
    this.aiMockMode =
      read('AI_MOCK_MODE').toLowerCase() === 'true' || !this.groqApiKey;
    this.groq = new Groq({ apiKey: this.groqApiKey });
    const resolved = resolveLlmProviderKind();
    this.activeProvider = resolved.kind;
    this.providerReason = resolved.reason;
  }

  getRuntimeMode() {
    return this.aiMockMode ? 'mock' : 'live';
  }

  getActiveProviderName(): string {
    return this.activeProvider;
  }

  getProviderSelectionReason(): string {
    return this.providerReason;
  }

  /**
   * Intelligent mock buyer response engine.
   * Deeply parses the system prompt to extract persona name, role, scenario context,
   * difficulty level, and custom instructions. Generates highly contextual responses
   * that reference the specific training scenario and stay fully in character.
   */
  private buildMockBuyerResponse(userMessage: string, history: any[], systemPrompt?: string): string {
    const turn = Math.floor(history.length / 2) + 1;
    const msg = (userMessage || '').toLowerCase().trim();
    const msgRaw = (userMessage || '').trim();
    const sp = systemPrompt || '';

    // ── Deep-parse the system prompt ────────────────────────────────────
    const personaMatch = sp.match(/You are roleplaying as ([^,\n]+)/);
    const personaName = personaMatch?.[1]?.trim() || 'the prospect';
    const firstName = personaName.split(/[\s(]/)[0] || personaName;

    const personaTypeMatch = sp.match(/roleplaying as [^,]+,\s*a\s+([^.\n]+)/);
    const personaType = personaTypeMatch?.[1]?.trim() || 'decision maker';

    const scenarioMatch = sp.match(/SCENARIO:\s*([\s\S]*?)(?:\nPERSONA INSTRUCTIONS:|\nTONE:)/);
    const scenarioCtx = scenarioMatch?.[1]?.trim() || '';

    const customMatch = sp.match(/PERSONA INSTRUCTIONS:\s*([^\n]+)/);
    const customInstructions = customMatch?.[1]?.trim() || '';

    const toneMatch = sp.match(/TONE:\s*([^\n]+)/);
    const tone = toneMatch?.[1]?.trim() || 'professional';

    // Difficulty detection
    const isAdvanced = tone.includes('challenging') || tone.includes('direct') || sp.includes('very hard to impress');
    const isBeginner = tone.includes('friendly') || tone.includes('patient') || sp.includes('generally open');
    // Otherwise intermediate

    // Scenario topic extraction (what is the scenario about?)
    const scenarioLower = scenarioCtx.toLowerCase();
    const topicKeywords: Record<string, string[]> = {
      'cloud migration': ['cloud', 'migration', 'infrastructure', 'on-premise', 'on-prem'],
      'pricing': ['pricing', 'price', 'cost', 'budget'],
      'software adoption': ['software', 'adoption', 'implementation', 'platform'],
      'sales tool': ['sales', 'crm', 'pipeline', 'revenue'],
      'security': ['security', 'compliance', 'data protection'],
      'automation': ['automation', 'automate', 'efficiency'],
    };
    let scenarioTopic = 'your solution';
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(k => scenarioLower.includes(k))) {
        scenarioTopic = topic;
        break;
      }
    }

    // ── Track conversation history ──────────────────────────────────────
    const prevReplies = history.filter((m: any) => m.role === 'assistant').map((m: any) => (m.content || '').toLowerCase());
    const alreadyMentioned = (keyword: string) => prevReplies.some(r => r.includes(keyword));

    // Seeded variety — hash from message content for much better entropy
    let hashVal = 0;
    for (let i = 0; i < msgRaw.length; i++) hashVal = ((hashVal << 5) - hashVal + msgRaw.charCodeAt(i)) | 0;
    const seed = Math.abs((turn * 31 + hashVal * 7 + prevReplies.length * 17 + msg.length * 53) % 127);
    const pick = <T>(arr: T[]): T => arr[seed % arr.length];

    // ── Keyword detection ───────────────────────────────────────────────
    const isGreeting = msg.length < 30 && (/^(hi+|hey+|hello|good\s*(morning|afternoon|evening)|howdy|what'?s up)\b/.test(msg) || msg === 'hi' || msg === 'hey');
    const isVague = msg.length < 20 && !msg.includes('?') && !/roi|price|cost|timeline|team|demo|pilot|workflow|budget|security/.test(msg);
    const mentionsPersonaName = msg.includes(firstName.toLowerCase());
    const isQuestion = msgRaw.includes('?') || /^(what|how|can|why|tell|where|when|who|do you|would you|could you|is there)\b/.test(msg);
    const mentionsROI = /\broi\b|return on investment|return/.test(msg);
    const mentionsPricing = /price|cost|budget|invest|afford|expensive/.test(msg);
    const mentionsTimeline = /timeline|how long|when|time|deadline|quarter/.test(msg);
    const mentionsWorkflow = /workflow|process|current|existing|today|right now/.test(msg);
    const mentionsTeam = /team|people|employee|staff|user|adoption|onboard/.test(msg);
    const mentionsDemo = /demo|trial|pilot|try|proof of concept|poc/.test(msg);
    const mentionsSecurity = /security|compliance|gdpr|data|privacy|soc/.test(msg);
    const mentionsCompetitor = /competitor|versus|vs |alternative|other vendor|incumbent/.test(msg);
    const mentionsClose = /next step|move forward|sign|start|ready|proceed|go ahead/.test(msg);
    const mentionsSave = /save|efficien|automat|faster|produc|streamline/.test(msg);

    // ── GREETING: Steer toward scenario ─────────────────────────────────
    if (isGreeting && turn <= 2) {
      if (isAdvanced) {
        return pick([
          `Let's skip the small talk. I've got 10 minutes. I was told you have something relevant to ${scenarioTopic} — convince me why I should care.`,
          `Hi. I'll be direct — I've seen a dozen pitches about ${scenarioTopic} this quarter alone. What's different about yours? You've got 10 minutes.`,
        ]);
      }
      if (isBeginner) {
        return pick([
          `Hi there! Thanks for taking the time. I've been curious about ${scenarioTopic} options — we've been thinking about it internally. What exactly does your approach look like?`,
          `Hey, nice to meet you. So I've been looking into ${scenarioTopic} solutions lately. Walk me through what you're proposing.`,
        ]);
      }
      // Intermediate
      return pick([
        `Hi. Look, I'll be upfront — I'm skeptical about ${scenarioTopic}. We've looked at this before and it didn't go anywhere. But I'm here, so let's see what you've got. What specifically are you proposing?`,
        `Hey. I appreciate the outreach. We've been evaluating ${scenarioTopic} options but I haven't been impressed so far. What's your pitch?`,
        `Hello. Before we get too far — what exactly are you solving? Be specific about ${scenarioTopic}. I hear a lot of generalities and I'm tired of it.`,
        `Hi there. I've got about 15 minutes. I know this is about ${scenarioTopic} — but before you pitch me, what do you actually know about our current setup?`,
      ]);
    }

    // ── VAGUE/SHORT MESSAGE: Push for substance ─────────────────────────
    if (isVague && turn <= 3 && !mentionsPersonaName) {
      return pick([
        `I need you to be more specific. What exactly are you proposing regarding ${scenarioTopic}? Give me the core idea in one sentence.`,
        `Okay, but what does that actually mean for my business? I need specifics about ${scenarioTopic}, not generalities.`,
        `I hear you, but I can't evaluate what you're saying without more detail. What's the concrete proposition around ${scenarioTopic}?`,
      ]);
    }

    // ── USER MENTIONS PERSONA NAME: Stay in character ───────────────────
    if (mentionsPersonaName) {
      return pick([
        `Yes, I'm ${firstName}. But let's focus on what matters — why should I change our approach to ${scenarioTopic}? I need a real business case, not a relationship pitch.`,
        `That's me. Look, I have serious concerns about ${scenarioTopic}. Instead of talking about me, tell me what problem you're actually solving and why I should care.`,
        `I appreciate the personal touch, but what I really need to hear is how this addresses my ${scenarioTopic} concerns. What hard evidence do you have?`,
      ]);
    }

    // ── LATE CONVERSATION: Closing dynamics ─────────────────────────────
    if (turn >= 7 && mentionsClose) {
      if (isAdvanced) {
        return `You've addressed some concerns. But I need a formal proposal with hard numbers on ${scenarioTopic} for my CFO. Can you have that to me by end of week?`;
      }
      return pick([
        `Okay, you've made reasonable points about ${scenarioTopic}. I'd want to see a written proposal and loop in my ${personaType === 'competitive' ? 'VP of Engineering' : 'operations lead'}. What's the next step from your side?`,
        `I'm cautiously interested. Send me a one-pager on the ${scenarioTopic} approach and I'll set up a follow-up with my team.`,
      ]);
    }

    if (turn >= 9) {
      return `I need to wrap up. You've given me things to think about on ${scenarioTopic}, but I haven't heard enough concrete proof to move forward yet. Send me something in writing — numbers, case studies, implementation plan.`;
    }

    // ── ROI ─────────────────────────────────────────────────────────────
    if (mentionsROI) {
      if (alreadyMentioned('roi')) {
        return `We've already talked about ROI. What I need now is a concrete example — a company like ours that made the switch to ${scenarioTopic} and saw measurable results within 12 months.`;
      }
      return pick([
        `ROI on ${scenarioTopic}? I've seen the pitch decks before. What's the actual payback period? And what's the baseline metric you're measuring against? I need proof, not projections.`,
        `Every vendor claims ROI. What makes yours different? ${customInstructions ? `Specifically, ${customInstructions.toLowerCase().replace('respond with', 'I want to understand')}` : `Show me real data from a company our size.`}`,
        `If ROI is your hook, what's the typical breakeven point? My board won't approve anything on ${scenarioTopic} with a runway longer than 18 months.`,
      ]);
    }

    // ── PRICING ─────────────────────────────────────────────────────────
    if (mentionsPricing) {
      if (alreadyMentioned('pric') || alreadyMentioned('cost') || alreadyMentioned('budget')) {
        return `We've touched on pricing. What I need now is the total cost of ownership over 3 years, including migration, training, and ongoing support for ${scenarioTopic}. Give me a ballpark.`;
      }
      return pick([
        `Pricing is critical for us right now — we're mid-budget cycle. What does the total cost of ownership look like for ${scenarioTopic}? Not just licensing, but implementation, training, migration — the full picture.`,
        `${customInstructions ? customInstructions : `What's the pricing model? Subscription, seat-based, usage-based? I need to know before I can even think about taking this to finance.`}`,
        `Before we go further on pricing — is there flexibility? Because our budget for ${scenarioTopic} this year is already mostly allocated.`,
      ]);
    }

    // ── TIMELINE ────────────────────────────────────────────────────────
    if (mentionsTimeline) {
      if (alreadyMentioned('timeline') || alreadyMentioned('how long')) {
        return `You mentioned timeline before but I'm still not clear. How long from signing to my team actually using this day-to-day? Give me the honest answer, not the best-case.`;
      }
      return pick([
        `Timeline is a real concern for us. What does a realistic implementation look like for ${scenarioTopic}? Not your best case — your typical deployment with a company our size.`,
        `How long before we'd actually see impact? If ${scenarioTopic} takes 9 months to set up and 6 to calibrate, that's not feasible right now. We have deliverables this quarter.`,
        `We have a major initiative next quarter. I can't have my team distracted by a ${scenarioTopic} migration. What's the minimum viable rollout timeline?`,
      ]);
    }

    // ── WORKFLOW / CURRENT STATE ────────────────────────────────────────
    if (mentionsWorkflow) {
      if (alreadyMentioned('workflow') || alreadyMentioned('current process')) {
        return `I appreciate you asking about our workflow, but the real question is change management. My team has been doing things a certain way for years. How do you handle the human side of ${scenarioTopic}?`;
      }
      return pick([
        `Our current workflow isn't perfect, but it's predictable. I'm skeptical about ${scenarioTopic} — any change introduces risk. How do you minimize disruption?`,
        `My ops team will resist any process change — that's just reality. What does user adoption typically look like for ${scenarioTopic}? Do you have data on ramp-up time?`,
        `The thing is, our current process works. Maybe not optimally, but switching to ${scenarioTopic} is a big bet. How do you convince me the upside outweighs the disruption?`,
      ]);
    }

    // ── TEAM / ADOPTION ─────────────────────────────────────────────────
    if (mentionsTeam) {
      return pick([
        `Getting my team on board is half the battle. They're resistant to new tools. What does onboarding for ${scenarioTopic} actually look like — and what's the typical time-to-proficiency?`,
        `Adoption is my biggest worry. I've seen ${scenarioTopic} investments fail not because of the technology, but because nobody uses it after month three. What's your retention rate?`,
        `Who would own this internally? My team is already stretched thin on existing initiatives. I can't add ${scenarioTopic} without headcount or clear time savings.`,
      ]);
    }

    // ── DEMO / PILOT ────────────────────────────────────────────────────
    if (mentionsDemo) {
      return pick([
        `A pilot could work, but I'd need to define success criteria upfront for ${scenarioTopic}. What does a typical pilot look like and what's the commitment on our end?`,
        `I'm open to a demo, but I want to see it with our actual data and use case, not a generic walkthrough. Can you do that for ${scenarioTopic}?`,
      ]);
    }

    // ── SECURITY ────────────────────────────────────────────────────────
    if (mentionsSecurity) {
      return `Security and compliance are non-negotiable for us, especially with ${scenarioTopic}. Are you SOC 2 certified? What does data residency look like? Who has access to our data?`;
    }

    // ── COMPETITOR ──────────────────────────────────────────────────────
    if (mentionsCompetitor) {
      return pick([
        `We've been evaluating other ${scenarioTopic} solutions too. Honestly, I haven't found a clear winner. What's the one thing you do that nobody else does?`,
        `How do you stack up against the incumbents in ${scenarioTopic}? We're already using a tool in this space — what's the migration path?`,
      ]);
    }

    // ── CLOSING ─────────────────────────────────────────────────────────
    if (mentionsClose) {
      return pick([
        `I'm not ready to commit to next steps on ${scenarioTopic} yet. I still have open questions about implementation risk and internal buy-in.`,
        `Before we talk next steps, I'd want to validate this ${scenarioTopic} approach with my team. Can you send me something I can share internally?`,
      ]);
    }

    // ── EFFICIENCY / SAVINGS ────────────────────────────────────────────
    if (mentionsSave) {
      return pick([
        `Efficiency gains sound great on paper, but I need to see how that translates to ${scenarioTopic} specifically. What's the measurable impact — hours saved, error reduction, throughput?`,
        `If you're claiming we'll be more efficient with ${scenarioTopic}, I need a concrete comparison. What does the before-and-after look like for companies our size?`,
      ]);
    }

    // ── QUESTIONS FROM REP ──────────────────────────────────────────────
    if (isQuestion) {
      const openTopics: string[] = [];
      if (!alreadyMentioned('pric') && !alreadyMentioned('cost')) openTopics.push('total cost');
      if (!alreadyMentioned('timeline')) openTopics.push('realistic timeline');
      if (!alreadyMentioned('roi')) openTopics.push('measurable ROI');
      if (!alreadyMentioned('team') && !alreadyMentioned('adoption')) openTopics.push('team adoption');
      const nextConcern = openTopics[0] || 'internal alignment';

      return pick([
        `Good question. Honestly, the thing holding me back most on ${scenarioTopic} right now is ${nextConcern}. Can you address that specifically?`,
        `That's fair to ask. Here's where I'm at — I'm cautious about ${scenarioTopic} and haven't been convinced yet. What I need is concrete evidence, not promises. What do you have?`,
        `I appreciate you asking. My real concern isn't the technology — it's the risk. If ${scenarioTopic} goes wrong after we commit, what's the fallback plan?`,
        `You're asking the right things. I'm intrigued but cautious about ${scenarioTopic}. Give me one reason this time will be different from past initiatives that looked good on paper.`,
      ]);
    }

    // ── DIFFICULTY-ADJUSTED DEFAULT RESPONSES ───────────────────────────
    if (isAdvanced) {
      return pick([
        `That's not enough. Everyone pitching ${scenarioTopic} says the same thing. Give me something concrete — a number, a customer reference, a guarantee. Something I can bring to my board.`,
        `I hear what you're saying, but I'm not convinced about ${scenarioTopic}. You're telling me what you think I want to hear. Dig deeper — what's the real risk if we DON'T do this?`,
        `Look, I don't have time for vague promises about ${scenarioTopic}. If you can't quantify the impact, I can't justify the investment. What's the one metric that proves this works?`,
      ]);
    }

    if (isBeginner) {
      return pick([
        `That actually makes sense for ${scenarioTopic}. I hadn't thought about it from that angle. What would getting started actually look like?`,
        `Okay, you're addressing my main concern about ${scenarioTopic}. I'd want my operations lead in the next conversation though — can we include her?`,
        `I can see the logic there. My hesitation is more about timing than fit for ${scenarioTopic}. Is there flexibility on when we'd need to commit?`,
      ]);
    }

    // ── INTERMEDIATE DEFAULT ────────────────────────────────────────────
    const defaults = [
      `Interesting point about ${scenarioTopic}. But I'm going to push back — how does that apply specifically to a company our size and in our industry?`,
      `I've heard similar pitches about ${scenarioTopic}. What I haven't heard is why this solves MY specific problem and not just the generic version of it.`,
      `Okay, I'll grant you that point. But let's talk about what happens when ${scenarioTopic} goes wrong — what does your support model look like post-implementation?`,
      `That's reasonable, but my CFO is going to ask three things about ${scenarioTopic}: cost, risk, and time to value. Address all three and we have a conversation worth having.`,
      `I'm following you, but I need more specificity on ${scenarioTopic}. Walk me through a concrete example — not a generic case study, but something close to our situation.`,
      `Fair enough. My concern about ${scenarioTopic} hasn't changed though. We're mid-cycle on a big initiative and adding another moving part is high risk. How do you de-risk this?`,
    ];
    return defaults[seed % defaults.length];
  }

  private buildMockEvaluation(): any {
    return {
      scores: {
        opening: 14,
        discovery: 15,
        objection_handling: 16,
        talk_ratio: 13,
        closing: 12,
      },
      overall_score: 70,
      evaluation_summary: 'Mock evaluation completed successfully for local smoke testing.',
      strengths: ['Structured response', 'Clear value framing'],
      improvements: ['Ask one more discovery question', 'Close with a clearer next step'],
    };
  }

  private buildMockCoachingActions(): any {
    return {
      coaching_note: {
        content: 'Rep showed good structure but should ask one deeper discovery question before positioning the solution. Coach them to end with a stronger next-step ask.',
        priority: 'Medium',
      },
      should_assign_scenario: true,
      recommended_scenario_type: 'objection-handling',
      recommended_difficulty: 'intermediate',
      reasoning: 'The rep can benefit from another repetition focused on discovery and closing.',
      agent_summary: 'Created a coaching note and recommended another practice scenario.',
    };
  }

  private buildMockLiveEvaluation(lastUserMsg: string, history: any[] = []): any {
    const lower = lastUserMsg.toLowerCase();
    const isQuestion = lastUserMsg.includes('?');
    const looksIrrelevant = lower.includes('weather') || lower.includes('lunch') || lower.includes('sports');
    const repMessages = history.filter((m: any) => m.role === 'user');
    const assistantMessages = history.filter((m: any) => m.role === 'assistant');
    const repWords = repMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length + lastUserMsg.split(/\s+/).filter(Boolean).length;
    const assistantWords = assistantMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
    const talkRatio = repWords + assistantWords > 0 ? Math.round((repWords / (repWords + assistantWords)) * 100) : 50;

    return {
      relevance_score: looksIrrelevant ? 32 : 84,
      objection_score: lower.includes('price') || lower.includes('budget') || lower.includes('roi') ? 82 : 64,
      confidence_score: lower.includes('maybe') || lower.includes('i think') ? 58 : 78,
      discovery_score: isQuestion ? 86 : 61,
      continuity_score: looksIrrelevant ? 35 : 80,
      communication_score: lastUserMsg.split(/\s+/).length > 45 ? 62 : 82,
      talk_ratio_warning: talkRatio > 65,
      detected_issues: [
        ...(looksIrrelevant ? ['Response drifted away from the buyer concern'] : []),
        ...(isQuestion ? [] : ['Add one discovery question before pitching']),
        ...(talkRatio > 65 ? ['Rep talk ratio is trending high'] : []),
      ],
      coaching_feedback: [
        isQuestion ? 'Good job using discovery to keep the buyer engaged.' : 'Ask a concise open-ended question to uncover business impact.',
        looksIrrelevant ? 'Bridge back to the buyer objective before moving forward.' : 'Tie the next point to ROI, timing, or implementation risk.',
      ],
      highlighted_segments: (() => {
        const segments: any[] = [];
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'which', 'who', 'tell', 'describe', 'explain'];
        const weakWords = ['maybe', 'i think', 'perhaps', 'sort of', 'kind of', 'just', 'sorry'];
        const irrelevantWords = ['weather', 'lunch', 'sports', 'weekend'];
        const objectionWords = ['price', 'budget', 'roi', 'cost', 'investment', 'timeline'];
        const words = lastUserMsg.split(/\s+/);
        words.forEach((word: string) => {
          const w = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
          if (!w || w.length < 3) return;
          if (irrelevantWords.includes(w)) {
            segments.push({ text: word, severity: 'red', reason: 'Off-topic content detected.' });
          } else if (questionWords.includes(w) && isQuestion) {
            segments.push({ text: word, severity: 'green', reason: 'Strong discovery behavior.' });
          } else if (weakWords.includes(w)) {
            segments.push({ text: word, severity: 'yellow', reason: 'Hedging language reduces confidence.' });
          } else if (objectionWords.includes(w)) {
            segments.push({ text: word, severity: 'green', reason: 'Good objection handling.' });
          }
        });
        if (segments.length === 0) {
          segments.push({
            text: lastUserMsg.slice(0, Math.min(lastUserMsg.length, 80)),
            severity: 'yellow',
            reason: 'Useful point, but it needs a discovery question.',
          });
        }
        return segments;
      })(),
      suggested_response: [
        'What metric would make this worth prioritizing now?',
        'If we can prove ROI in a pilot, would rollout risk still be your main concern?',
      ],
      live_score: looksIrrelevant ? 46 : isQuestion ? 84 : 72,
      satisfaction_score: isQuestion ? 85 : 60,
    };
  }

  async generateHint(history: any[], scenarioContext: string, hintsUsed: number = 0): Promise<string> {
    if (this.aiMockMode) {
      const mockHints = [
        "Mock Hint: Try asking an open-ended discovery question about their timeline or budget.",
        "Mock Hint: Address their objection by validating it first, then pivot to value.",
        "Mock Hint: Ask them what metric would make this worth prioritizing now.",
        "Mock Hint: Confirm if budget is the only thing holding them back.",
      ];
      return mockHints[hintsUsed % mockHints.length];
    }
    
    try {
      const variationPrompt = hintsUsed > 0 
        ? `This is hint request #${hintsUsed + 1} for the same turn. The rep is still stuck. Give a COMPLETELY DIFFERENT suggestion from what an AI might have obviously suggested before. Try a completely new angle, a bold pivot, or a specific counter-intuitive phrase.`
        : `Give a unique piece of advice based on the most recent message; do not repeat previous advice.`;

      const messages = [
        { role: 'system', content: `You are an expert sales coach. The rep is stuck and needs a hint on what to say next. Look at the conversation history and the scenario context, and provide a single, short (1-2 sentences) actionable hint on what the rep should target or say next. Do not write the exact script, just give advice. ${variationPrompt}\n\nContext: ${scenarioContext}` },
        ...history,
        { role: 'user', content: "I am stuck, what should I say or target next?" }
      ];

      const completion = await this.groq.chat.completions.create({
        messages: messages as any,
        model: 'llama-3.1-8b-instant',
        temperature: 0.9,
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content || "Ask an open-ended discovery question.";
    } catch (error) {
      console.error('Groq hint generation failed:', error);
      return `Groq API Error: ${(error as Error).message || 'Failed to generate hint'}`;
    }
  }

  async generateBuyerResponse(systemPrompt: string, history: any[], userMessage: string): Promise<string> {
    if (this.aiMockMode) {
      // Pass systemPrompt so mock engine can extract persona/difficulty context
      return this.buildMockBuyerResponse(userMessage, history, systemPrompt);
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ];

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: messages as any,
        max_tokens: 200,
        temperature: 0.85,
        frequency_penalty: 0.6,   // penalise repeating the same words/phrases
        presence_penalty: 0.4,    // push it to introduce new topics
      });

      return completion.choices?.[0]?.message?.content || "I need a moment to think about that.";
    } catch (err: any) {
      console.error('[LLM SERVICE] generateBuyerResponse error:', err.message);
      return this.buildMockBuyerResponse(userMessage, history);
    }
  }

  async evaluateSession(evaluationPrompt: string): Promise<any> {
    if (this.aiMockMode) {
      return this.buildMockEvaluation();
    }

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert sales coach. Return only raw JSON.' },
          { role: 'user', content: evaluationPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const text = completion.choices?.[0]?.message?.content || '{}';
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (err: any) {
      console.error('[LLM SERVICE] evaluateSession error:', err.message);
      return this.buildMockEvaluation();
    }
  }

  async generateCoachingActions(analysisPrompt: string): Promise<any> {
    if (this.aiMockMode) {
      return this.buildMockCoachingActions();
    }

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Return only raw JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const text = completion.choices?.[0]?.message?.content || '{}';
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (err: any) {
      console.error('[LLM SERVICE] generateCoachingActions error:', err.message);
      return this.buildMockCoachingActions();
    }
  }

  async transcribeAudio(filePath: string): Promise<string> {
    if (this.aiMockMode) {
      return `Mock transcript generated from ${path.basename(filePath)}. The rep asked discovery questions, handled a pricing objection, and suggested a follow-up demo.`;
    }

    try {
      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-large-v3',
        language: 'en'
      });
      return transcription.text;
    } catch (err: any) {
      console.error('[LLM SERVICE] transcribeAudio error:', err.message);
      return `Mock transcript generated from ${path.basename(filePath)} after transcription fallback. The rep asked discovery questions and proposed a next step.`;
    }
  }

  async generateSpeech(text: string, voiceId: string): Promise<string | null> {
    // ElevenLabs TTS is independent of LLM mock mode — use it whenever the key is present.
    // This allows real voice output even when GROQ_API_KEY is unset (mock text responses).
    if (!this.elevenLabsApiKey) {
      return null;
    }

    try {
      const elevenRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      );

      if (elevenRes.ok) {
        const buf = await elevenRes.arrayBuffer();
        return Buffer.from(buf).toString('base64');
      } else {
        const errText = await elevenRes.text();
        console.error('[LLM SERVICE] ElevenLabs error response:', errText);
        return null;
      }
    } catch (err: any) {
      console.error('[LLM SERVICE] generateSpeech error:', err.message);
      return null;
    }
  }

  async generatePersonaFromTranscript(transcript: string): Promise<any> {
    if (this.aiMockMode) {
      return this.enrichPersonaDraft(
        {
          persona_name: 'Budget-Constrained Bob',
          persona_type: 'Budget Constrained',
          difficulty: 'intermediate',
          context_text:
            'Bob is a car owner contacted about a map update. He is hesitant because of the price and wants to understand the value before paying.',
          objectives: '',
          goals: '',
          custom_prompt: '',
          evaluation_focus: '',
          target_skills: ['Discovery', 'Closing', 'Active listening'],
          objection_style: '',
          personality_traits: '',
        },
        transcript,
      );
    }

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert sales trainer. Analyze sales call transcripts and design roleplay training scenarios. Return ONLY valid JSON, no markdown.',
          },
          {
            role: 'user',
            content: `Analyze this transcript and build a training scenario for the CLIENT/PROSPECT side of the call.

Transcript:
${transcript}

CRITICAL: Every field below MUST be filled with specific, useful content from the call. Do not leave any field empty.

Return JSON:
{
  "persona_name": "catchy persona name based on the buyer in the call",
  "persona_type": "Skeptical Buyer | Budget Constrained | Technical Evaluator | Champion | Blocker | Tire Kicker",
  "difficulty": "beginner | intermediate | advanced",
  "context_text": "3-5 sentences: buyer background, situation, stakes, and what happened in the call",
  "objectives": "4 bullet points (use •) for what the REP should practice — discovery, value, objections, next steps",
  "goals": "3 bullet points (use •) for what the BUYER wants to achieve or protect",
  "custom_prompt": "8-12 lines: detailed roleplay instructions for the AI buyer — tone, objections, when to soften, what convinces them",
  "evaluation_focus": "one sentence on what managers should score",
  "target_skills": ["skill1", "skill2", "skill3", "skill4"],
  "objection_style": "specific objections this buyer raises in the call",
  "personality_traits": "3-5 traits describing how they communicate"
}`,
          },
        ],
        max_tokens: 2500,
        temperature: 0.35,
      });

      const text = completion.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      const draft = {
        persona_name: parsed.persona_name || 'Training Persona',
        persona_type: parsed.persona_type || 'Skeptical Buyer',
        difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty)
          ? parsed.difficulty
          : 'intermediate',
        context_text: parsed.context_text || '',
        objectives: typeof parsed.objectives === 'string' ? parsed.objectives : (parsed.objectives || []).join('\n'),
        goals: typeof parsed.goals === 'string' ? parsed.goals : (parsed.goals || []).join('\n'),
        custom_prompt: parsed.custom_prompt || '',
        evaluation_focus: parsed.evaluation_focus || '',
        target_skills: Array.isArray(parsed.target_skills) ? parsed.target_skills : [],
        objection_style: parsed.objection_style || '',
        personality_traits: parsed.personality_traits || '',
      };
      return this.enrichPersonaDraft(draft, transcript);
    } catch (err: any) {
      console.error('[LLM SERVICE] generatePersonaFromTranscript error:', err.message);
      throw new Error('Failed to generate persona from transcript.');
    }
  }

  private enrichPersonaDraft(persona: any, transcript: string = '') {
    const type = persona.persona_type || 'Skeptical Buyer';
    const typeDefaults: Record<string, any> = {
      'Budget Constrained': {
        objectives:
          '• Uncover budget limits, approval process, and timing\n• Tie value to ROI and cost savings\n• Handle price objections professionally\n• Secure a realistic next step',
        goals:
          '• Avoid overspending\n• Confirm the purchase is necessary now\n• Get leadership buy-in if needed',
        evaluation_focus: 'Value framing, budget objections, and patience',
        objection_style: 'Too expensive, need approval, delay until next budget cycle',
        personality_traits: 'Cautious, value-focused, discount-seeking, ROI-driven',
        target_skills: ['Discovery', 'Value articulation', 'Objection handling', 'Closing'],
      },
      'Skeptical Buyer': {
        objectives:
          '• Build credibility with proof and specifics\n• Handle tough questions calmly\n• Run strong discovery despite pushback\n• Advance to a clear next step',
        goals: '• Avoid a bad decision\n• Validate claims before trusting the rep',
        evaluation_focus: 'Credibility, proof, objection handling',
        objection_style: 'Doubts claims, wants references, compares alternatives',
        personality_traits: 'Skeptical, probing, slow to trust',
        target_skills: ['Discovery', 'Objection handling', 'Active listening'],
      },
    };
    const defaults = typeDefaults[type] || {
      objectives:
        '• Run discovery on needs, timeline, and decision process\n• Present tailored value\n• Handle objections\n• Confirm next steps',
      goals: '• Understand fit and risk before buying\n• Stay in control of the decision',
      evaluation_focus: 'Discovery, objection handling, and closing',
      objection_style: 'Timing, budget, fit, or need more proof',
      personality_traits: 'Professional, guarded, responds to clear value',
      target_skills: ['Discovery', 'Objection handling', 'Closing', 'Active listening'],
    };

    const fill = (value: string, fallback: string) => (value && String(value).trim() ? String(value).trim() : fallback);
    const name = fill(persona.persona_name, 'Training Persona');
    const context = fill(
      persona.context_text,
      transcript
        ? `Scenario based on a real call. Buyer "${name}" (${type}) — practice the rep side of this conversation.`
        : `Roleplay with ${name}, a ${type}.`,
    );

    return {
      persona_name: name,
      persona_type: type,
      difficulty: persona.difficulty || 'intermediate',
      context_text: context,
      objectives: fill(persona.objectives, defaults.objectives),
      goals: fill(persona.goals, defaults.goals),
      custom_prompt: fill(
        persona.custom_prompt,
        `You are ${name}, a ${type} buyer in roleplay. Object like: ${defaults.objection_style}. Style: ${defaults.personality_traits}. Stay in character. 1-3 sentences per turn. Context: ${context.slice(0, 300)}`,
      ),
      evaluation_focus: fill(persona.evaluation_focus, defaults.evaluation_focus),
      target_skills:
        Array.isArray(persona.target_skills) && persona.target_skills.length
          ? persona.target_skills
          : defaults.target_skills,
      objection_style: fill(persona.objection_style, defaults.objection_style),
      personality_traits: fill(persona.personality_traits, defaults.personality_traits),
    };
  }

  async evaluateLiveTurn(history: any[], lastUserMsg: string, scenarioContext: string = ''): Promise<any> {
    if (this.aiMockMode) {
      return this.buildMockLiveEvaluation(lastUserMsg, history);
    }

    try {
      const turnCount = Math.floor(history.length / 2);
      const repMessages = history.filter((m: any) => m.role === 'user');
      const repWords = repMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
      const totalWords = history.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
      const talkRatio = totalWords > 0 ? Math.round((repWords / totalWords) * 100) : 0;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a real-time enterprise sales coach. Evaluate the latest sales rep turn across relevance, continuity, sentence structure, clarity, confidence, discovery quality, objection handling, empathy, active listening, value framing, concision, next-step control, professionalism, buyer alignment, and talk ratio discipline.
Return ONLY raw JSON matching this schema:
{
  "relevance_score": number,
  "objection_score": number,
  "confidence_score": number,
  "discovery_score": number,
  "continuity_score": number,
  "communication_score": number,
  "satisfaction_score": number,
  "talk_ratio_warning": boolean,
  "detected_issues": string[],
  "coaching_feedback": string[],
  "highlighted_segments": [
    { "text": string, "severity": "red" | "yellow" | "green", "reason": string }
  ],
  "suggested_response": string[],
  "live_score": number
}
All scores are 0-100. Keep arrays to 1-3 concise items. Highlight exact substrings from the rep message only.`
          },
          {
            role: 'user',
            content: `Scenario context:
${scenarioContext || 'No additional context.'}

Conversation so far:
${history.map((m: any) => `${m.role}: ${m.content}`).join('\n') || 'No prior turns.'}

Latest rep turn:
"${lastUserMsg}"

Turn #${turnCount + 1}
Current rep talk ratio: ${talkRatio}%

Evaluate this latest turn only and return the strict JSON payload.`
          }
        ],
        max_tokens: 700,
        temperature: 0.2
      });

      const text = completion.choices?.[0]?.message?.content || '{}';
      const evaluation = JSON.parse(text.replace(/```json|```/g, '').trim());
      return {
        ...this.buildMockLiveEvaluation(lastUserMsg, history),
        ...evaluation,
      };
    } catch (err: any) {
      console.error('[LLM SERVICE] evaluateLiveTurn error:', err.message);
      return this.buildMockLiveEvaluation(lastUserMsg, history);
    }
  }

  async generateLiveCoachingTips(history: any[], lastUserMsg: string, lastBotReply: string): Promise<string[]> {
    if (this.aiMockMode) {
      return ['Ask one sharper discovery question', 'Close with a clear next step'];
    }

    try {
      const turnCount = Math.floor(history.length / 2);
      const repMessages = history.filter((m: any) => m.role === 'user');
      const repWords = repMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
      const totalWords = history.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
      const talkRatio = totalWords > 0 ? Math.round((repWords / totalWords) * 100) : 0;

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a real-time sales coach giving micro-tips during a live call. Return ONLY a JSON array of 1-2 short actionable tips (max 10 words each, start each with 💡). Example: ["💡 Ask an open-ended question now", "💡 Mirror their concern before pitching"]'
          },
          {
            role: 'user',
            content: `Rep just said: "${lastUserMsg}"\nProspect replied: "${lastBotReply}"\nTurn #${turnCount}, Talk ratio: ${talkRatio}%\nGive 1-2 coaching micro-tips as a JSON array.`
          }
        ],
        max_tokens: 120,
        temperature: 0.5
      });

      const text = completion.choices?.[0]?.message?.content || '[]';
      const tips = JSON.parse(text.replace(/```json|```/g, '').trim());
      return Array.isArray(tips) ? tips : [];
    } catch (err: any) {
      console.error('[LLM SERVICE] generateLiveCoachingTips error:', err.message);
      return [];
    }
  }

  async diarizeTranscript(rawTranscript: string): Promise<Array<{ role: string; content: string }>> {
    if (this.aiMockMode) {
      const lines = rawTranscript
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return [
          { role: 'user', content: 'Can I understand your current sales process?' },
          { role: 'assistant', content: 'Our team is concerned about pricing and rollout effort.' },
        ];
      }

      return lines.map((line, index) => ({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: line.replace(/^(rep|customer|client|buyer|prospect)\s*:\s*/i, ''),
      }));
    }

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a transcript diarization specialist. Given a raw call transcript, split it into a structured JSON dialogue array.\nRules:\n- The sales rep speaks as role "user"\n- The prospect/customer speaks as role "assistant"\n- If speaker labels exist (e.g. "Rep:", "Customer:", "Agent:", "Client:"), use them to identify roles\n- If no labels exist, infer from context: the rep pitches and asks questions, the customer objects and responds\n- Each turn should be a single coherent statement\n- Return ONLY a raw JSON array, no markdown, no explanation.\nFormat: [{"role":"user","content":"..."},{"role":"assistant","content":"..."}, ...]`
          },
          {
            role: 'user',
            content: `Diarize this call transcript into a JSON dialogue array:\n\n${rawTranscript}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.1
      });

      const text = completion.choices?.[0]?.message?.content || '[]';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch (err: any) {
      console.error('[LLM SERVICE] diarizeTranscript error:', err.message);
      return [];
    }
  }
}

// ─── SESSIONS SERVICE ────────────────────────────────────────────────────────

@Injectable()
export class SessionsService {
  constructor(
    private readonly repository: M09Repository,
    private readonly llmService: LlmService,
    @Inject(forwardRef(() => M09Worker))
    private readonly worker: M09Worker
  ) {}

  async findAll(repId: string, orgId: string) {
    return this.repository.findAllSessions(repId, orgId);
  }

  async getMySessions(repId: string, orgId: string) {
    const data = await this.repository.findAllSessions(repId, orgId);
    return data.map((s: any) => {
      let feedback = s.feedback_json;
      if (typeof feedback === 'string') {
        try { feedback = JSON.parse(feedback); } catch { feedback = null; }
      }
      let messages = s.messages_json;
      if (typeof messages === 'string') {
        try { messages = JSON.parse(messages); } catch { messages = []; }
      }
      return {
        id: s.id,
        scenario_id: s.scenario_id,
        persona_name: s.scenario?.persona_name || 'Training Session',
        persona_type: s.scenario?.persona_type || '—',
        difficulty: s.scenario?.difficulty || 'intermediate',
        completed_at: s.completed_at,
        created_at: s.created_at,
        feedback_json: feedback,
        messages_json: messages || [],
        overall_score: feedback?.overall_score || 0,
        scores: feedback?.scores || {},
        evaluation_summary: feedback?.evaluation_summary || 'No summary available',
        is_practice: s.is_practice || false,
      };
    });
  }

  async getSessionById(sessionId: string, orgId: string) {
    const session = await this.repository.findSessionById(sessionId, orgId);
    const assignment = await this.repository.findAssignmentBySessionId(sessionId);
    return {
      ...session,
      messages_json: (typeof session.messages_json === 'string' ? JSON.parse(session.messages_json) : session.messages_json) || [],
      assignment_id: assignment?.id || null,
      max_hints: assignment?.max_hints ?? null,
    };
  }

  async startSession(dto: StartSessionDto, repId: string, orgId: string) {
    const selectedVoiceId = dto.voiceId || dto.selectedVoiceId;
    const isPractice = !dto.assignmentId;
    const session = await this.repository.createSession({
      rep_id: repId,
      scenario_id: dto.scenarioId,
      messages_json: [],
      selected_voice_id: selectedVoiceId,
      is_practice: isPractice
    });

    if (dto.assignmentId) {
      await this.repository.updateAssignmentById(dto.assignmentId, {
        session_id: session.id,
        status: 'In Progress'
      });
    }

    return { id: session.id, sessionId: session.id };
  }

  async getHint(sessionId: string, orgId: string) {
    const session = await this.repository.findSessionById(sessionId, orgId);
    
    let maxHints = 5;
    if (!session.is_practice) {
      const assignment = await this.repository.findAssignmentBySessionId(sessionId);
      if (assignment) {
        maxHints = assignment.max_hints ?? 5;
      }
      if (session.hints_used >= maxHints) {
        throw new BadRequestException('Hint limit reached for this assignment.');
      }
    }

    const scenario = session.scenario;
    const messages = (typeof session.messages_json === 'string' ? JSON.parse(session.messages_json) : session.messages_json) || [];
    const cleanHistory = messages.map((m: any) => ({ role: m.role, content: m.content }));
    const rawContext = scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || '';
    const cleanScenarioContext = `Persona: ${scenario.persona_name} (${scenario.persona_type})\nContext: ${rawContext}`;

    const hint = await this.llmService.generateHint(cleanHistory, cleanScenarioContext, session.hints_used);

    await this.repository.updateSessionHintsUsed(sessionId);

    return { 
      hint, 
      hints_used: session.hints_used + 1, 
      max_hints: session.is_practice ? null : maxHints 
    };
  }

  async sendMessage(dto: SendMessageDto, orgId: string) {
    const sessionId = dto.sessionId;
    const session = await this.repository.findSessionById(sessionId, orgId);
    const scenario = session.scenario;
    const history = (typeof session.messages_json === 'string' ? JSON.parse(session.messages_json) : session.messages_json) || [];

    const message = dto.message || dto.text || '';
    if (!message && history.length > 0) {
      throw new BadRequestException('Message is required');
    }

    const difficultyConfig: Record<string, any> = {
      beginner: {
        tone: 'friendly and patient',
        resistanceLevel: 'low',
        progressionStyle: 'open',
        instructions: `
- Be generally open to the conversation
- Raise only one mild objection at a time (budget uncertainty, needing a second opinion)
- If the rep gives a solid answer, acknowledge it genuinely and move forward ("That makes sense, tell me more", "OK I hadn't thought of it that way")
- Vary your responses: sometimes ask a follow-up question, sometimes share a concern, sometimes express mild interest
- Never ask the same question twice
- Sound like a real person — use natural speech patterns, occasional filler ("I mean", "honestly", "look")
- Max 2 sentences per turn`
      },
      intermediate: {
        tone: 'professional and skeptical',
        resistanceLevel: 'medium',
        progressionStyle: 'earned',
        instructions: `
- You are busy and skeptical — but you're a rational human, not a robot
- Raise REAL objections about ROI, timing, existing solutions, or internal buy-in — but only ones you haven't raised yet
- IMPORTANT: if the rep gives a genuinely good answer to your objection, acknowledge it ("OK fair point", "That's actually a valid argument") before moving to the next concern
- Progress naturally: don't repeat the same pushback; move through different concerns over the conversation
- Mix in occasional direct questions back to the rep ("What would implementation actually look like?", "Who else is using this?")
- Sound like a VP or Director speaking plainly — not formal, not robotic
- Max 2-3 sentences per turn`
      },
      advanced: {
        tone: 'challenging, time-pressured, and direct',
        resistanceLevel: 'high',
        progressionStyle: 'hard-earned',
        instructions: `
- You are very hard to impress, time-pressured, and have heard every pitch before
- Challenge everything, but do so with DIFFERENT objections each turn — never repeat yourself
- If the rep handles an objection exceptionally well, briefly soften ("...alright, that's a fair point") then immediately pivot to a NEW harder challenge
- Vary your response style: sometimes cut them off mid-pitch with a harder question, sometimes express doubt, sometimes challenge the data
- Use short, direct language. No pleasantries. Show impatience if the rep rambles.
- After 8+ turns with no progress, say you need to wrap up — give them one final shot to close
- Max 2 sentences per turn — short and punchy`
      }
    };

    const config = difficultyConfig[scenario.difficulty] || difficultyConfig.intermediate;

    // Parse metadata for any extra persona instructions
    const jsonMatch = scenario.context_text?.match(/\[SCENARIO_METADATA:\s*({.*?})\]/s);
    let metadata: any = {};
    if (jsonMatch) {
      try { metadata = JSON.parse(jsonMatch[1]); } catch {} }

    const cleanContext = scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || '';
    const assistantHistory = history.filter((m: any) => m.role === 'assistant');
    const turnNumber = assistantHistory.length + 1;

    const systemPrompt = `You are roleplaying as ${scenario.persona_name}, a ${scenario.persona_type}.

SCENARIO:
${cleanContext}
${metadata.custom_prompt ? `\nPERSONA INSTRUCTIONS: ${metadata.custom_prompt}` : ''}

TONE: ${config.tone}

HOW TO BEHAVE:
${config.instructions}

CONVERSATION STATE:
- This is turn ${turnNumber} of the conversation
- Things you have ALREADY said (do NOT repeat these topics or phrases):
${assistantHistory.length > 0 ? assistantHistory.map((m: any, i: number) => `  Turn ${i+1}: "${m.content}"`).join('\n') : '  (nothing yet — this is your opening response)'}

CRITICAL RULES:
1. NEVER repeat an objection or question you have already raised
2. If the rep gave a genuinely good answer to something, acknowledge it briefly before moving on
3. Keep your response to 1-2 sentences max — be natural and human
4. Do NOT say things a robot would say. Sound like a real ${scenario.persona_type} in a real conversation
5. Respond ONLY to what the rep just said — don't ignore it and jump to a pre-planned script`;


    const cleanScenarioContext = scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || '';
    // Strip frontend-only fields (e.g. live_coaching) — Groq rejects unknown fields on user messages
    const cleanHistory = history.map((m: any) => ({ role: m.role, content: m.content }));
    const [reply, liveCoaching] = await Promise.all([
      this.llmService.generateBuyerResponse(systemPrompt, cleanHistory, message),
      this.llmService.evaluateLiveTurn(cleanHistory, message, cleanScenarioContext)
    ]);
    const updatedHistory = [
      ...history,
      { role: 'user', content: message, live_coaching: liveCoaching },
      { role: 'assistant', content: reply }
    ];

    await this.repository.updateSessionMessages(sessionId, updatedHistory);

    const voiceId = session.selected_voice_id || scenario.voice_id || 'Xb7hH8MSUJpSbSDYk0k2';

    // Run TTS and live coaching tip generation in parallel — no extra latency
    const audioBase64 = await this.llmService.generateSpeech(reply, voiceId);

    return { reply, audio: audioBase64, userText: message, live_coaching: liveCoaching };
  }

  async sendVoiceMessage(sessionId: string, audio: any, orgId: string) {
    if (!audio) throw new BadRequestException('No audio file');
    const tmpPath = path.join(os.tmpdir(), `audio_${Date.now()}.webm`);
    fs.writeFileSync(tmpPath, audio.buffer);

    try {
      const userText = await this.llmService.transcribeAudio(tmpPath);
      if (!userText) throw new BadRequestException('Transcription failed');
      const result = await this.sendMessage({ sessionId, message: userText }, orgId);
      return { userText, reply: result.reply, audio: result.audio, live_coaching: result.live_coaching };
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  async endSession(sessionId: string, orgId: string) {
    const session = await this.repository.findSessionById(sessionId, orgId);
    const scenario = session.scenario;
    const messages = (typeof session.messages_json === 'string' ? JSON.parse(session.messages_json) : session.messages_json) || [];
    const repMessages = messages.filter((m: any) => m.role === 'user');
    const botMessages = messages.filter((m: any) => m.role === 'assistant');

    const repWords = repMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
    const botWords = botMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
    const totalWords = repWords + botWords;
    const actualTalkRatio = totalWords > 0 ? Math.round((repWords / totalWords) * 100) : 0;

    const questionsAsked = repMessages.filter((m: any) => (m.content || '').includes('?')).length;
    const closingKeywords = ['next step', 'move forward', 'schedule', 'demo', 'trial', 'sign', 'ready to'];
    const closingAttempts = repMessages.filter((m: any) => closingKeywords.some(k => (m.content || '').toLowerCase().includes(k))).length;
    const openingWords = (repMessages[0]?.content || '').split(/\s+/).filter(Boolean).length;

    const evaluationPrompt = `Evaluate the transcript.
Talk Ratio: ${actualTalkRatio}%
Questions: ${questionsAsked}
Closing Attempts: ${closingAttempts}
Opening length: ${openingWords} words

TRANSCRIPT:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Return ONLY JSON:
{
  "scores": { "opening": 0-20, "discovery": 0-20, "objection_handling": 0-20, "talk_ratio": 0-20, "closing": 0-20 },
  "overall_score": 0-100,
  "evaluation_summary": "summary",
  "strengths": ["strength"],
  "improvements": ["improvement"]
}`;

    let feedback: any;
    try {
      feedback = await this.llmService.evaluateSession(evaluationPrompt);
    } catch {
      feedback = {
        scores: { opening: 10, discovery: 10, objection_handling: 10, talk_ratio: 10, closing: 10 },
        overall_score: 50,
        evaluation_summary: 'Session evaluated using fallback scores.',
        strengths: [],
        improvements: []
      };
    }

    feedback.objective_metrics = {
      talk_ratio_pct: actualTalkRatio,
      questions_asked: questionsAsked,
      closing_attempts: closingAttempts,
      total_exchanges: botMessages.length
    };

    const completedAt = new Date();
    await this.repository.updateSessionFeedback(sessionId, feedback, completedAt);

    const assignment = await this.repository.findAssignmentBySessionId(sessionId);
    if (assignment) {
      const newAttempts = (assignment.attempt_count || 0) + 1;
      const isNewBest = feedback.overall_score > (assignment.best_score || 0);
      await this.repository.updateAssignmentById(assignment.id, {
        status: 'In Progress',
        completed_at: completedAt,
        attempt_count: newAttempts,
        best_score: isNewBest ? feedback.overall_score : assignment.best_score,
        best_session_id: isNewBest ? sessionId : assignment.best_session_id,
        session_id: sessionId,
      });
    }

    // Trigger OODA background coaching note & recommendation agent
    setImmediate(() => {
      this.worker.runCoachingAgent(sessionId, session.rep_id, feedback, scenario)
        .catch(err => console.error('[OODA AGENT ERROR]:', err.message));
    });

    return feedback;
  }

  async retrySession(sessionId: string, repId: string, orgId: string) {
    const session = await this.repository.findSessionById(sessionId, orgId);
    const assignment = await this.repository.findAssignmentBySessionId(sessionId);
    if (!assignment) throw new BadRequestException('No active assignment found for this session');

    return this.startSession({
      scenarioId: session.scenario_id,
      voiceId: session.selected_voice_id || undefined,
      assignmentId: assignment.id
    }, repId, orgId);
  }

  async getVoices() {
    return this.repository.getVoices();
  }

  async updateSession(id: string, dto: { messages_json?: any[]; status?: string }, orgId: string) {
    if (dto.messages_json) {
      await this.repository.updateSessionMessages(id, dto.messages_json);
    }
    return { success: true };
  }

  async submitSessionToManager(sessionId: string, repId: string, orgId: string) {
    const session = await this.repository.findSessionById(sessionId, orgId);
    if (session.rep_id !== repId) {
      throw new BadRequestException('You can only submit your own sessions.');
    }

    const assignment = await this.repository.findAssignmentForRepSession(
      sessionId,
      repId,
      session.scenario_id,
    );
    if (!assignment) {
      throw new BadRequestException(
        'No training assignment found for this session. Start from Assignments to submit to your manager.',
      );
    }

    let feedback: any = session.feedback_json;
    if (typeof feedback === 'string') {
      try { feedback = JSON.parse(feedback); } catch { feedback = null; }
    }
    const score = Number(feedback?.overall_score ?? assignment.best_score ?? 0);
    const completedAt = session.completed_at ? new Date(session.completed_at) : new Date();

    await this.repository.updateAssignmentById(assignment.id, {
      status: 'Completed',
      session_id: sessionId,
      best_session_id: sessionId,
      completed_at: completedAt,
      best_score: Math.max(score, Number(assignment.best_score ?? 0)),
    });

    return {
      success: true,
      assignmentId: assignment.id,
      message: 'Session submitted to your manager for review.',
    };
  }

  // ─── CALL TRANSCRIPT ANALYZER ──────────────────────────────────────────────

  async analyzeUploadedCall(repId: string, orgId: string, audio: any): Promise<any> {
    if (!audio) throw new BadRequestException('No audio file provided');

    const tmpPath = path.join(os.tmpdir(), `upload_${Date.now()}.webm`);
    fs.writeFileSync(tmpPath, audio.buffer);

    try {
      // ── Step 1: Transcribe via Whisper ──
      console.log('[ANALYZER] Step 1 – Transcribing audio with Whisper...');
      const rawTranscript = await this.llmService.transcribeAudio(tmpPath);
      const transcript =
        !rawTranscript || rawTranscript.trim().length < 20
          ? 'Rep: We need a better sales coaching process.\nCustomer: The team is struggling with objections and follow up.'
          : rawTranscript;

      // ── Step 2: Diarize via Llama ──
      console.log('[ANALYZER] Step 2 – Diarizing transcript with Llama...');
      let messages = await this.llmService.diarizeTranscript(transcript);
      if (!messages || messages.length < 2) {
        console.warn('[ANALYZER] Diarization returned too few turns; using fallback dialogue.');
        messages = [
          { role: 'user', content: 'We are trying to improve our sales process and need better coaching.' },
          { role: 'assistant', content: 'The team is struggling with objections and follow-up consistency.' },
          { role: 'user', content: 'What should we focus on first to improve performance?' },
          { role: 'assistant', content: 'Start with discovery questions, objection handling, and a clear next step.' },
        ];
      }

      // ── Step 3: Find a scenario to associate the session with ──
      const scenario = await this.repository.findScenarioByDifficulty('intermediate');
      if (!scenario) {
        throw new BadRequestException('No training scenario found in your org. Please create at least one scenario first.');
      }

      // ── Step 4: Persist session with diarized transcript ──
      const session = await this.repository.createSession({
        rep_id: repId,
        scenario_id: scenario.id,
        messages_json: messages,
      });

      // ── Step 5: Evaluate using the same OODA evaluation loop as endSession ──
      const repMessages = messages.filter((m: any) => m.role === 'user');
      const botMessages = messages.filter((m: any) => m.role === 'assistant');
      const repWords = repMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
      const botWords = botMessages.map((m: any) => m.content || '').join(' ').split(/\s+/).filter(Boolean).length;
      const totalWords = repWords + botWords;
      const talkRatio = totalWords > 0 ? Math.round((repWords / totalWords) * 100) : 0;
      const questionsAsked = repMessages.filter((m: any) => (m.content || '').includes('?')).length;
      const closingKeywords = ['next step', 'move forward', 'schedule', 'demo', 'trial', 'sign', 'ready to'];
      const closingAttempts = repMessages.filter((m: any) => closingKeywords.some(k => (m.content || '').toLowerCase().includes(k))).length;
      const openingWords = (repMessages[0]?.content || '').split(/\s+/).filter(Boolean).length;

      const evaluationPrompt = `Evaluate this uploaded real sales call transcript.
Talk Ratio: ${talkRatio}%
Questions Asked: ${questionsAsked}
Closing Attempts: ${closingAttempts}
Opening Length: ${openingWords} words

FULL TRANSCRIPT:
${messages.map((m: any) => `${m.role === 'user' ? 'REP' : 'PROSPECT'}: ${m.content}`).join('\n')}

Return ONLY JSON:
{
  "scores": { "opening": 0-20, "discovery": 0-20, "objection_handling": 0-20, "talk_ratio": 0-20, "closing": 0-20 },
  "overall_score": 0-100,
  "evaluation_summary": "summary",
  "strengths": ["strength1"],
  "improvements": ["improvement1"]
}`;

      let feedback: any;
      try {
        feedback = await this.llmService.evaluateSession(evaluationPrompt);
      } catch {
        feedback = {
          scores: { opening: 10, discovery: 10, objection_handling: 10, talk_ratio: 10, closing: 10 },
          overall_score: 50,
          evaluation_summary: 'Uploaded call evaluated with fallback scores.',
          strengths: [],
          improvements: []
        };
      }

      feedback.objective_metrics = {
        talk_ratio_pct: talkRatio,
        questions_asked: questionsAsked,
        closing_attempts: closingAttempts,
        total_exchanges: botMessages.length
      };
      feedback.source = 'uploaded_call';
      feedback.raw_transcript = transcript;

      const completedAt = new Date();
      await this.repository.updateSessionFeedback(session.id, feedback, completedAt);

      // ── Step 6: Trigger background OODA coaching agent ──
      setImmediate(() => {
        this.worker.runCoachingAgent(session.id, repId, feedback, scenario)
          .catch(err => console.error('[ANALYZER AGENT ERROR]:', err.message));
      });

      console.log('[ANALYZER] ✅ Analysis complete. Session:', session.id, 'Score:', feedback.overall_score);
      return { sessionId: session.id, scenarioId: scenario.id, feedback, rawTranscript: transcript, messages };

    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }
}

// ─── SCENARIOS SERVICE ───────────────────────────────────────────────────────

@Injectable()
export class ScenariosService {
  constructor(
    private readonly repository: M09Repository,
    private readonly llmService: LlmService
  ) {}

  async findAll(orgId: string) {
    return this.repository.findAllScenarios(orgId);
  }

  async findOne(id: string, orgId: string) {
    const data = await this.repository.findScenarioById(id, orgId);
    const match = data.context_text?.match(/\[SCENARIO:\s*(.*?)\]/);
    const scenario_name = match ? match[1] : data.persona_type;

    const jsonMatch = data.context_text?.match(/\[SCENARIO_METADATA:\s*({.*?})\]/s);
    let metadata: any = {};
    if (jsonMatch) {
      try { metadata = JSON.parse(jsonMatch[1]); } catch {}
    }

    return {
      ...data,
      ...metadata,
      scenario_name: scenario_name || 'Sales Training',
      customer_info: { name: data.persona_name, role: 'Decision Maker', company: 'Prospect Corp' }
    };
  }

  async create(dto: CreateScenarioDto, orgId: string, managerId?: string) {
    const metadata = {
      personality_traits: dto.personality_traits,
      evaluation_focus: dto.evaluation_focus,
      objection_style: dto.objection_style,
      target_skills: dto.target_skills,
      objectives: dto.objectives,
      goals: dto.goals,
      source_transcript: dto.source_transcript,
    };
    const finalContext = `${dto.context_text}\n\n[SCENARIO_METADATA: ${JSON.stringify(metadata)}]`;
    return this.repository.createScenario(orgId, managerId || '', { ...dto, context_text: finalContext });
  }

  async update(id: string, dto: UpdateScenarioDto, orgId: string) {
    return this.repository.updateScenario(id, orgId, dto);
  }

  async delete(id: string, orgId: string) {
    return this.repository.deleteScenario(id, orgId);
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    const result = await this.analyzeAudioForScenario(audioBuffer);
    return result.transcript;
  }

  async analyzeAudioForScenario(audioBuffer: Buffer) {
    const ext = '.webm';
    const tmpPath = path.join(os.tmpdir(), `scenario_upload_${Date.now()}${ext}`);
    fs.writeFileSync(tmpPath, audioBuffer);
    try {
      const rawTranscript = await this.llmService.transcribeAudio(tmpPath);
      let messages = await this.llmService.diarizeTranscript(rawTranscript);
      if (!messages || messages.length < 2) {
        messages = rawTranscript
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => ({
            role: index % 2 === 0 ? 'user' : 'assistant',
            content: line.replace(/^(rep|customer|client|buyer|prospect)\s*:\s*/i, ''),
          }));
      }

      const transcript = messages
        .map((m) => `${m.role === 'user' ? 'Rep' : 'Client'}: ${m.content}`)
        .join('\n\n');

      const persona = await this.llmService.generatePersonaFromTranscript(
        transcript || rawTranscript,
      );

      return {
        raw_transcript: rawTranscript,
        transcript: transcript || rawTranscript,
        persona,
        turn_count: messages.length,
      };
    } finally {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  async generatePersonaFromTranscript(transcript: string): Promise<any> {
    return this.llmService.generatePersonaFromTranscript(transcript);
  }
}

// ─── COACHING SERVICE ────────────────────────────────────────────────────────

@Injectable()
export class CoachingService {
  constructor(private readonly repository: M09Repository) {}

  async getNotes(userId: string, role: string, orgId: string) {
    if (role === 'manager' || role === 'org_admin') {
      const sessions = await this.repository.findCoachingNotesByManager(userId, orgId);
      return sessions.map((s: any) => ({
        id: s.id,
        rep_id: s.rep_id,
        rep_name: s.rep?.name || s.rep?.email || 'Unknown',
        rep_email: s.rep?.email,
        content: s.content,
        priority: s.priority || 'Medium',
        created_at: s.created_at,
        is_agent_generated: s.is_agent_generated || false,
        weakest_skill: s.weakest_skill
      }));
    } else {
      const sessions = await this.repository.findCoachingNotesByRep(userId, orgId);
      return sessions.map((s: any) => ({
        id: s.id,
        rep_id: s.rep_id,
        rep_name: 'Manager',
        content: s.content,
        priority: s.priority || 'Medium',
        created_at: s.created_at,
        is_agent_generated: s.is_agent_generated || false,
        weakest_skill: s.weakest_skill
      }));
    }
  }

  async createNote(managerId: string, repId: string, content: string, priority: string = 'Medium', orgId: string) {
    const scenarios = await this.repository.findAllScenarios(orgId);
    const scenarioId = scenarios?.[0]?.id;
    if (!scenarioId) throw new BadRequestException('Create a scenario in this organization first.');

    return this.repository.createCoachingNote({
      rep_id: repId,
      manager_id: managerId,
      org_id: orgId,
      content,
      priority,
      is_agent_generated: false
    });
  }

  async getRecommendations(repId: string) {
    return this.repository.findRecommendations(repId);
  }

  async pushRecommendation(managerId: string, repId: string, focusArea: string, text: string) {
    return this.repository.createRecommendation({
      rep_id: repId,
      focus_area: focusArea,
      weakest_skill: 'Manager Push',
      recommendation_text: text,
      suggested_action: 'Review and apply to next call',
      priority: 'High'
    });
  }
}

// ─── TRAINING SERVICE ────────────────────────────────────────────────────────

@Injectable()
export class TrainingService {
  constructor(private readonly repository: M09Repository) {}

  async createAssignments(dto: CreateAssignmentDto, managerId: string, orgId: string) {
    const scenario = await this.repository.findScenarioById(dto.scenarioId, orgId);
    if (!scenario) throw new NotFoundException('Selected scenario not found');

    const assignments = dto.repIds.map((repId) => ({
      rep_id: repId,
      scenario_id: dto.scenarioId,
      manager_id: managerId,
      status: 'Pending',
      priority: dto.priority || 'Medium',
      deadline: new Date(dto.deadline),
      assigned_at: new Date(),
      max_attempts: dto.maxAttempts ?? 3,
      max_hints: dto.maxHints ?? 5
    }));

    await this.repository.bulkCreateAssignments(assignments);
    return { success: true };
  }

  async getAssignments(user: any) {
    let assignments;
    if (user.role === 'manager' || user.role === 'org_admin') {
      assignments = await this.repository.findAssignmentsByManager(user.id, user.org_id);
    } else {
      assignments = await this.repository.findAssignmentsByRep(user.id, user.org_id);
    }
    return assignments.map((a: any) => ({
      ...a,
      rep_name: a.rep?.name || a.rep?.email?.split('@')[0] || a.rep_id,
    }));
  }

  async updateAssignment(id: string, dto: UpdateAssignmentDto, managerId: string) {
    return this.repository.updateAssignment(id, {
      ...dto,
      ...(dto.manager_score !== undefined && { manager_score: dto.manager_score }),
      ...(dto.manager_note !== undefined && { manager_note: dto.manager_note }),
    }, managerId);
  }

  async updateAssignmentByRep(id: string, dto: UpdateAssignmentDto, repId: string) {
    const assignment = await this.repository.findAssignmentById(id);
    if (!assignment || assignment.rep_id !== repId) {
      throw new BadRequestException('Assignment not found or access denied.');
    }

    const updates: Record<string, unknown> = {};
    if (dto.status) updates.status = dto.status;
    if (dto.best_session_id) {
      updates.best_session_id = dto.best_session_id;
      updates.session_id = dto.best_session_id;
    }
    if (dto.status === 'Completed') {
      updates.completed_at = assignment.completed_at ?? new Date();
    }

    return this.repository.updateAssignmentById(id, updates);
  }

  async deleteAssignment(id: string, managerId: string) {
    return this.repository.deleteAssignment(id, managerId);
  }
}

// ─── ANALYTICS SERVICE ───────────────────────────────────────────────────────

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: M09Repository) {}

  async getDashboardStats(orgId: string, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    const sessions = await this.repository.getSessionsByRepIds(repIds);
    const assignments = await this.repository.getAssignmentsByRepIds(repIds);

    const now = new Date();
    const activeSessions = sessions.filter(s => {
      const created = new Date(s.created_at);
      const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 2;
    }).length;

    let totalScore = 0;
    let validSessions = 0;
    const repScores: Record<string, number[]> = {};

    sessions.forEach(s => {
      const f: any = s.feedback_json;
      if (f?.is_note) return;
      const score = f?.overall_score;
      if (typeof score === 'number') {
        totalScore += score;
        validSessions++;
        if (!repScores[s.rep_id]) repScores[s.rep_id] = [];
        repScores[s.rep_id].push(score);
      }
    });

    const avgTeamScore = validSessions > 0 ? Math.round(totalScore / validSessions) : 0;
    let repsNeedingAttention = 0;
    Object.values(repScores).forEach(scores => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 60) repsNeedingAttention++;
    });

    const completed = assignments.filter(a => a.completed_at).length;
    const total = assignments.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const repList = await this.repository.getRepsByOrgId(orgId, managerId);
    const repStats = repList.map(rep => {
      const rs = repScores[rep.id] || [];
      const score = rs.length > 0 ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : 0;
      return {
        id: rep.id,
        name: rep.name || rep.email,
        score
      };
    });

    repStats.sort((a, b) => b.score - a.score);
    const topPerformers = repStats.slice(0, 5).filter(r => r.score > 0);
    const atRiskReps = repStats.filter(r => r.score > 0 && r.score < 75).reverse().slice(0, 5);

    const dateScores: Record<string, number[]> = {};
    sessions.forEach(s => {
      const f: any = s.feedback_json;
      if (f?.is_note || typeof f?.overall_score !== 'number') return;
      const dateStr = new Date(s.created_at).toLocaleDateString();
      if (!dateScores[dateStr]) dateScores[dateStr] = [];
      dateScores[dateStr].push(f.overall_score);
    });

    const scoreTrend = Object.entries(dateScores)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, scores]) => ({
        date,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      }));

    let lastWeekScore = 0, thisWeekScore = 0;
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    let lastWeekCount = 0, thisWeekCount = 0;
    sessions.forEach(s => {
      const f: any = s.feedback_json;
      if (f?.is_note || typeof f?.overall_score !== 'number') return;
      const d = new Date(s.created_at);
      if (d >= oneWeekAgo) { thisWeekScore += f.overall_score; thisWeekCount++; }
      else if (d >= twoWeeksAgo && d < oneWeekAgo) { lastWeekScore += f.overall_score; lastWeekCount++; }
    });

    const thisWeekAvg = thisWeekCount > 0 ? thisWeekScore / thisWeekCount : 0;
    const lastWeekAvg = lastWeekCount > 0 ? lastWeekScore / lastWeekCount : 0;
    const weeklyImprovement = (thisWeekAvg > 0 && lastWeekAvg > 0) ? Math.round(thisWeekAvg - lastWeekAvg) : 0;

    return {
      totalReps: repIds.length,
      activeSessions,
      avgTeamScore,
      repsNeedingAttention,
      completionRate,
      weeklyImprovement,
      scoreTrend,
      topPerformers,
      atRiskReps,
      trends: { avgScore: avgTeamScore, weeklyImprovement }
    };
  }

  async getRepsWithStats(orgId: string, managerId?: string) {
    const reps = await this.repository.getRepsByOrgId(orgId, managerId);
    const repIds = reps.map(r => r.id);
    const sessions = await this.repository.getSessionsByRepIds(repIds);

    return reps.map(rep => {
      const repSessions = sessions.filter(s => s.rep_id === rep.id && !(s.feedback_json as any)?.is_note);
      const scores = repSessions.map(s => (s.feedback_json as any)?.overall_score || 0);
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const trend = scores.length >= 2 ? (scores[scores.length - 1] > scores[scores.length - 2] ? 'up' : 'down') : 'stable';

      return {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        overall_score: avgScore,
        trend,
        weakest_skill: 'Discovery',
        strongest_skill: 'Objection Handling',
        last_session: repSessions.length > 0 ? repSessions[repSessions.length - 1].created_at : null,
        session_count: repSessions.length,
        status: avgScore > 80 ? 'Excellent' : (avgScore > 60 ? 'Improving' : 'High Risk')
      };
    });
  }

  async getTeamAnalytics(orgId: string, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    const sessions = await this.repository.getSessionsByRepIds(repIds);

    const trendData = sessions.map(s => ({
      date: new Date(s.created_at).toLocaleDateString(),
      score: (s.feedback_json as any)?.overall_score || 0
    }));

    const scenarioMap: Record<string, number[]> = {};
    sessions.forEach(s => {
      if ((s.feedback_json as any)?.is_note) return;
      const name = s.scenario?.persona_name || 'Unknown';
      if (!scenarioMap[name]) scenarioMap[name] = [];
      scenarioMap[name].push((s.feedback_json as any)?.overall_score || 0);
    });

    const scenarioData = Object.entries(scenarioMap).map(([name, scores]) => ({
      name,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    }));

    const heatmapData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString();
      const count = sessions.filter(s => new Date(s.created_at).toLocaleDateString() === dateStr).length;
      return { date: dateStr, count };
    });

    let op = 0, disc = 0, obj = 0, cls = 0, fol = 0, count = 0;
    sessions.forEach(s => {
      const f: any = s.feedback_json;
      if (!f || f.is_note || !f.scores) return;
      op += f.scores.opening || 0;
      disc += f.scores.discovery || 0;
      obj += f.scores.objection_handling || f.scores.objections || 0;
      cls += f.scores.closing_skills || f.scores.closing || 0;
      fol += f.scores.follow_up || 0;
      count++;
    });

    const avgOp = count > 0 ? Math.round(op / count) : 0;
    const avgDisc = count > 0 ? Math.round(disc / count) : 0;
    const avgObj = count > 0 ? Math.round(obj / count) : 0;
    const avgCls = count > 0 ? Math.round(cls / count) : 0;
    const avgFol = count > 0 ? Math.round(fol / count) : 0;

    const radarData = [
      { subject: 'Opening', A: avgOp, fullMark: 100 },
      { subject: 'Discovery', A: avgDisc, fullMark: 100 },
      { subject: 'Objections', A: avgObj, fullMark: 100 },
      { subject: 'Closing', A: avgCls, fullMark: 100 },
      { subject: 'Follow-up', A: avgFol, fullMark: 100 },
    ];

    const sortedRadar = [...radarData].sort((a, b) => b.A - a.A);
    const strongest = sortedRadar[0]?.subject || 'None';
    const weakest = sortedRadar[sortedRadar.length - 1]?.subject || 'None';

    return {
      trendData,
      scenarioData,
      heatmapData,
      radarData,
      insights: count > 0 ? [{ type: 'Strength', text: `Team handles ${strongest.toLowerCase()} well`, icon: 'check' }] : [],
      recommendations: count > 0 ? [{ action: 'Training', text: `Focus on ${weakest.toLowerCase()}`, priority: 'High' }] : []
    };
  }

  async getRepComparison(repId: string, orgId: string, managerId?: string) {
    const teamRepIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    if (!teamRepIds.includes(repId)) {
      throw new BadRequestException('Rep not found in your team');
    }

    const sessions = await this.repository.getSessionsByRepIds(teamRepIds);
    
    let teamOp = 0, teamDisc = 0, teamObj = 0, teamCls = 0, teamFol = 0, teamCount = 0;
    let repOp = 0, repDisc = 0, repObj = 0, repCls = 0, repFol = 0, repCount = 0;

    sessions.forEach(s => {
      const f: any = s.feedback_json;
      if (!f || f.is_note || !f.scores) return;
      const op = f.scores.opening || 0;
      const disc = f.scores.discovery || 0;
      const obj = f.scores.objection_handling || f.scores.objections || 0;
      const cls = f.scores.closing_skills || f.scores.closing || 0;
      const fol = f.scores.follow_up || 0;

      teamOp += op; teamDisc += disc; teamObj += obj; teamCls += cls; teamFol += fol;
      teamCount++;

      if (s.rep_id === repId) {
        repOp += op; repDisc += disc; repObj += obj; repCls += cls; repFol += fol;
        repCount++;
      }
    });

    return {
      radarData: [
        { subject: 'Opening', Team: teamCount ? Math.round(teamOp/teamCount) : 0, Rep: repCount ? Math.round(repOp/repCount) : 0, fullMark: 100 },
        { subject: 'Discovery', Team: teamCount ? Math.round(teamDisc/teamCount) : 0, Rep: repCount ? Math.round(repDisc/repCount) : 0, fullMark: 100 },
        { subject: 'Objections', Team: teamCount ? Math.round(teamObj/teamCount) : 0, Rep: repCount ? Math.round(repObj/repCount) : 0, fullMark: 100 },
        { subject: 'Closing', Team: teamCount ? Math.round(teamCls/teamCount) : 0, Rep: repCount ? Math.round(repCls/repCount) : 0, fullMark: 100 },
        { subject: 'Follow-up', Team: teamCount ? Math.round(teamFol/teamCount) : 0, Rep: repCount ? Math.round(repFol/repCount) : 0, fullMark: 100 },
      ]
    };
  }

  async getActivityMetrics(orgId: string, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    const sessions = await this.repository.getSessionsByRepIds(repIds);
    const totalSessions = sessions.filter(s => !(s.feedback_json as any)?.is_note).length;

    return {
      totalSessions,
      weeklySessions: totalSessions,
      engagementRate: repIds.length > 0 ? Math.round((totalSessions / repIds.length) * 10) / 10 : 0
    };
  }

  async getInteractionAnalytics(orgId: string, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    const sessions = await this.repository.getSessionsByRepIds(repIds);

    let totalTalkRatio = 0, totalQuestions = 0, totalClosingAttempts = 0, count = 0;

    sessions.forEach(s => {
      const f: any = s.feedback_json;
      if (f?.is_note) return;
      const metrics = f?.objective_metrics;
      if (metrics) {
        totalTalkRatio += metrics.talk_ratio_pct || 0;
        totalQuestions += metrics.questions_asked || 0;
        totalClosingAttempts += metrics.closing_attempts || 0;
        count++;
      }
    });

    return {
      avgTalkRatio: count > 0 ? Math.round(totalTalkRatio / count) : 0,
      avgQuestionsAsked: count > 0 ? Math.round((totalQuestions / count) * 10) / 10 : 0,
      avgClosingAttempts: count > 0 ? Math.round((totalClosingAttempts / count) * 10) / 10 : 0,
      totalExchanges: count > 0 ? count : 0
    };
  }

  async getTopicInsights(orgId: string, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    const sessions = await this.repository.getSessionsByRepIds(repIds);
    
    const keywords = ['Budget', 'Price', 'ROI', 'Time', 'Timing', 'Competitor', 'Feature', 'Security', 'Integration', 'Support'];
    const topics: Record<string, number> = {};
    
    sessions.forEach(s => {
      const text = JSON.stringify(s.feedback_json || {}).toLowerCase();
      keywords.forEach(kw => {
        if (text.includes(kw.toLowerCase())) {
          topics[kw + ' Objection'] = (topics[kw + ' Objection'] || 0) + 1;
        }
      });
    });

    const result = Object.entries(topics)
      .map(([topic, count]) => ({
        topic,
        count,
        impact: count > 5 ? 'High' : count > 2 ? 'Medium' : 'Low'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return result;
  }

  async getCallDrilldown(sessionId: string, orgId: string) {
    const session = await this.repository.findSessionById(sessionId, orgId);
    const assignment = await this.repository.findAssignmentBySessionId(sessionId);
    return {
      id: session.id,
      transcript: session.messages_json,
      messages_json: session.messages_json,
      feedback: session.feedback_json,
      feedback_json: session.feedback_json,
      assignment_id: assignment?.id || null,
      is_practice: session.is_practice || false,
      created_at: session.created_at,
      completed_at: session.completed_at,
    };
  }

  async getBenchmarks(orgId: string, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    const sessions = await this.repository.getSessionsByRepIds(repIds);
    
    let opening = 0, discoveryQs = 0, closingAttempts = 0, count = 0;
    sessions.forEach(s => {
      const f: any = s.feedback_json;
      if (f && !f.is_note) {
        opening += f.scores?.opening || 0;
        discoveryQs += f.objective_metrics?.questions_asked || 0;
        closingAttempts += f.objective_metrics?.closing_attempts || 0;
        count++;
      }
    });

    // We add +20% to average to create a "Target" benchmark
    return {
      openingTarget: count > 0 ? Math.min(20, Math.round((opening / count) * 1.2)) : 15,
      discoveryTarget: count > 0 ? Math.round((discoveryQs / count) * 1.5) : 3,
      closingTarget: count > 0 ? Math.round((closingAttempts / count) * 1.2) : 1,
      talkRatioRange: '40% - 50%'
    };
  }

  async getManagerReview(managerId: string, orgId: string) {
    const reps = await this.repository.getRepsByOrgId(orgId);
    const notes = await this.repository.findCoachingNotesByManager(managerId, orgId);
    const assignments = await this.repository.findAssignmentsByManager(managerId, orgId);

    const now = new Date();
    return {
      repsCount: reps.length,
      coachingNotesSent: notes.length,
      activeAssignments: assignments.filter(a => a.status === 'In Progress' || a.status === 'Pending').length,
      overdueAssignments: assignments.filter(a => a.status !== 'Completed' && a.deadline && new Date(a.deadline) < now).length
    };
  }

  async getTrainingReport(orgId: string, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    const sessions = await this.repository.getSessionsByRepIds(repIds);
    const assignments = await this.repository.getAssignmentsByRepIds(repIds);
    const completed = assignments.filter(a => a.completed_at).length;

    let totalScore = 0, count = 0;
    sessions.forEach(s => {
      const score = (s.feedback_json as any)?.overall_score;
      if (typeof score === 'number') {
        totalScore += score;
        count++;
      }
    });

    return {
      completionRate: assignments.length > 0 ? Math.round((completed / assignments.length) * 100) : 0,
      completedAssignments: completed,
      totalAssignments: assignments.length,
      averageTeamScore: count > 0 ? Math.round(totalScore / count) : 0
    };
  }

  async exportCsv(orgId: string, options: ExportQueryDto, managerId?: string) {
    const stats = await this.getRepsWithStats(orgId, managerId);
    let csv = 'Rep Name,Rep Email,Average Score,Session Count,Status\n';
    stats.forEach(s => { csv += `"${s.name}","${s.email}",${s.overall_score},${s.session_count},"${s.status}"\n`; });
    return csv;
  }

  async exportTrainingCsv(orgId: string, options: ExportQueryDto, managerId?: string) {
    const repIds = await this.repository.getRepIdsByOrgId(orgId, managerId);
    let assignments = await this.repository.getAssignmentsByRepIds(repIds);
    const reps = await this.repository.getRepsByOrgId(orgId, managerId);
    const repMap = new Map(reps.map(r => [r.id, r]));

    // Apply time filter based on completed_at or assigned_at
    if (options.dateRange) {
      const now = new Date();
      let threshold = new Date(0);
      if (options.dateRange === 'last_7_days') threshold = new Date(now.setDate(now.getDate() - 7));
      else if (options.dateRange === 'last_30_days') threshold = new Date(now.setDate(now.getDate() - 30));
      else if (options.dateRange === 'last_90_days') threshold = new Date(now.setDate(now.getDate() - 90));

      if (threshold.getTime() > 0) {
        assignments = assignments.filter(a => {
          const dateToCompare = a.completed_at ? new Date(a.completed_at) : new Date(a.assigned_at);
          return dateToCompare >= threshold;
        });
      }
    }

    // If options specify Completion type, group user-wise
    if (options.type === 'Completion') {
      let csv = 'Rep Name,Total Assigned,Total Completed,Completion Rate,Average Score\n';
      const userStats: Record<string, { assigned: number; completed: number; scoreSum: number }> = {};
      
      repIds.forEach(id => { userStats[id] = { assigned: 0, completed: 0, scoreSum: 0 }; });
      
      assignments.forEach(a => {
        if (!userStats[a.rep_id]) return;
        userStats[a.rep_id].assigned += 1;
        if (a.status === 'Completed' || a.status === 'Reviewed') {
          userStats[a.rep_id].completed += 1;
          userStats[a.rep_id].scoreSum += a.best_score || 0;
        }
      });

      for (const [repId, stats] of Object.entries(userStats)) {
        const rep = repMap.get(repId) as any;
        if (!rep) continue;
        const rate = stats.assigned > 0 ? Math.round((stats.completed / stats.assigned) * 100) : 0;
        const avgScore = stats.completed > 0 ? Math.round(stats.scoreSum / stats.completed) : 0;
        csv += `"${rep?.name || ''}",${stats.assigned},${stats.completed},"${rate}%",${avgScore}\n`;
      }
      return csv;
    }

    // Default Training report
    let csv = 'Assignment ID,Rep Name,Rep Email,Scenario Name,Status,Priority,Attempts,Best Score,Manager Score,Assigned At,Completed At\n';
    assignments.forEach(a => { 
      const rep = repMap.get(a.rep_id) as any;
      const scenarioName = a.scenario?.persona_name || a.scenario_id || '';
      const assignedAt = a.assigned_at ? new Date(a.assigned_at).toISOString() : '';
      const completedAt = a.completed_at ? new Date(a.completed_at).toISOString() : '';
      csv += `"${a.id}","${rep?.name || ''}","${rep?.email || ''}","${scenarioName}","${a.status}","${a.priority}",${a.attempt_count || 0},${a.best_score || 0},${a.manager_score || ''},"${assignedAt}","${completedAt}"\n`; 
    });
    return csv;
  }

  async getSentNotes(managerId: string, orgId: string) {
    return this.getNotes(managerId, 'manager', orgId);
  }

  async getTeamAssignments(managerId: string, orgId: string) {
    return this.repository.findAssignmentsByManager(managerId, orgId);
  }

  async getMyAnalytics(userId: string, orgId: string) {
    const sessions = await this.repository.getSessionsByRepIds([userId]);
    return sessions.filter((s: any) => s.feedback_json && !(s.feedback_json as any).is_note);
  }

  async getMyNotes(userId: string, orgId: string) {
    return this.getNotes(userId, 'rep', orgId);
  }

  async getMyAssignments(userId: string, orgId: string) {
    return this.repository.findAssignmentsByRep(userId, orgId);
  }

  // Internal helper to fetch notes for mapping
  private async getNotes(userId: string, role: string, orgId: string) {
    if (role === 'manager') {
      const notes = await this.repository.findCoachingNotesByManager(userId, orgId);
      return notes.map((s: any) => ({
        id: s.id,
        rep_id: s.rep_id,
        rep_name: s.rep?.name || s.rep?.email || 'Unknown',
        content: s.content,
        priority: s.priority,
        created_at: s.created_at,
        is_agent_generated: s.is_agent_generated,
        weakest_skill: s.weakest_skill
      }));
    } else {
      const notes = await this.repository.findCoachingNotesByRep(userId, orgId);
      return notes.map((s: any) => ({
        id: s.id,
        rep_id: s.rep_id,
        rep_name: 'Manager',
        content: s.content,
        priority: s.priority,
        created_at: s.created_at,
        is_agent_generated: s.is_agent_generated,
        weakest_skill: s.weakest_skill
      }));
    }
  }
}

// ─── SCHEDULER SERVICE (Twice-Daily Analytics Refresh — Zero API Cost) ──────

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours = twice daily

  constructor(private readonly repository: M09Repository) {}

  onModuleInit() {
    console.log('[SCHEDULER] 🕐 Analytics refresh scheduler initialized — runs every 12h (twice daily)');
    // First run: 15 seconds after server boot (let everything initialize)
    setTimeout(() => this.runRefreshCycle(), 15_000);
    // Recurring: every 12 hours
    this.refreshTimer = setInterval(() => this.runRefreshCycle(), this.REFRESH_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log('[SCHEDULER] 🛑 Analytics refresh scheduler stopped');
    }
  }

  private async runRefreshCycle() {
    const start = Date.now();
    console.log('[SCHEDULER] 🔄 Running analytics refresh cycle...');
    try {
      await this.markOverdueAssignments();
      console.log(`[SCHEDULER] ✅ Refresh cycle complete in ${Date.now() - start}ms`);
    } catch (err: any) {
      console.error('[SCHEDULER] ❌ Refresh cycle failed:', err.message);
    }
  }

  private async markOverdueAssignments() {
    const now = new Date();
    console.log('[SCHEDULER] 🔍 Scanning active assignments for overdue status...');
    try {
      const overdue = await this.repository.findOverdueAssignments();
      console.log(`[SCHEDULER] 📋 Found ${overdue.length} active assignments past deadline at ${now.toISOString()}`);
      for (const assignment of overdue) {
        console.log(`[SCHEDULER] 🚨 Overdue Assignment ID: ${assignment.id} — Rep "${assignment.rep?.name || 'Rep'}" (ID: ${assignment.rep_id}) has not completed scenario "${assignment.scenario?.persona_name || 'Scenario'}" (Deadline was ${assignment.deadline.toISOString()})`);
        await this.repository.updateAssignmentById(assignment.id, { status: 'Overdue' });
      }
    } catch (err: any) {
      console.error('[SCHEDULER] ❌ Overdue assignments scan failed:', err.message);
    }
  }
}
