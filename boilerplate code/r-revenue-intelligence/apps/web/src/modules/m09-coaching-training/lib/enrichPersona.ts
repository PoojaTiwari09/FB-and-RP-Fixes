import { PersonaDraft } from '@/types/scenarios.types';

const TYPE_DEFAULTS: Record<
  string,
  Partial<Pick<PersonaDraft, 'objectives' | 'goals' | 'evaluation_focus' | 'objection_style' | 'personality_traits' | 'target_skills'>>
> = {
  'Budget Constrained': {
    objectives:
      '• Uncover budget limits, approval process, and timing\n• Tie product value to cost savings or revenue impact\n• Handle price objections without discounting too early\n• Secure a follow-up or pilot when budget is tight',
    goals:
      '• Avoid overspending or buying before ROI is clear\n• Get proof the purchase is necessary now\n• Protect team budget and reputation with leadership',
    evaluation_focus: 'Value-based selling, budget objection handling, and patience under pushback',
    objection_style: 'Price too high, need manager approval, wait until next quarter, compare cheaper options',
    personality_traits: 'Frugal, cautious, asks for discounts, needs clear ROI before committing',
    target_skills: ['Discovery', 'Value articulation', 'Objection handling', 'Closing'],
  },
  'Skeptical Buyer': {
    objectives:
      '• Earn trust through credibility and proof points\n• Answer tough questions with specifics, not fluff\n• Reframe skepticism into productive discovery\n• Move toward a defined next step',
    goals:
      '• Avoid being sold to or making a bad decision\n• Validate claims with evidence and references\n• Stay in control of the evaluation process',
    evaluation_focus: 'Credibility, proof, handling skepticism, and confident communication',
    objection_style: 'Doubts claims, asks for proof, compares competitors, stalls on decisions',
    personality_traits: 'Skeptical, probing, slow to trust, detail-oriented',
    target_skills: ['Active listening', 'Objection handling', 'Discovery', 'Confidence'],
  },
  'Technical Evaluator': {
    objectives:
      '• Map technical requirements and integration needs\n• Speak clearly to technical concerns without jargon overload\n• Align solution capabilities to stated requirements\n• Define technical next steps (demo, POC, security review)',
    goals:
      '• Ensure the solution works in their environment\n• Reduce implementation risk\n• Get buy-in from technical stakeholders',
    evaluation_focus: 'Technical discovery, clarity, and solution fit',
    objection_style: 'Integration concerns, security, scalability, implementation effort',
    personality_traits: 'Analytical, precise, asks detailed technical questions',
    target_skills: ['Technical discovery', 'Solution mapping', 'Objection handling'],
  },
};

const GENERIC_DEFAULTS = {
  objectives:
    '• Open the call professionally and set agenda\n• Ask discovery questions to understand needs and pain\n• Present relevant value and handle objections\n• Confirm clear next steps before ending the call',
  goals:
    '• Understand whether the solution is worth their time and money\n• Avoid a bad purchase or wasted implementation\n• Keep options open until confidence is high',
  evaluation_focus: 'Discovery quality, objection handling, talk track clarity, and next-step control',
  objection_style: 'Timing, budget, fit, or need for more information',
  personality_traits: 'Professional, guarded at first, responds to clear value',
  target_skills: ['Discovery', 'Objection handling', 'Closing', 'Active listening'],
};

function hasText(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

function hasSkills(skills?: string[]) {
  return Array.isArray(skills) && skills.length > 0;
}

/** Fill empty persona fields from type defaults and context — manager can still edit everything. */
export function enrichPersonaDraft(persona: Partial<PersonaDraft>, transcript?: string): PersonaDraft {
  const personaType = persona.persona_type || 'Skeptical Buyer';
  const typeDefaults = TYPE_DEFAULTS[personaType] || GENERIC_DEFAULTS;
  const name = persona.persona_name?.trim() || 'Training Persona';
  const context =
    persona.context_text?.trim() ||
    (transcript
      ? `Training scenario recreated from a sales call. The buyer persona (${name}) reflects the client/prospect in the transcript. Reps should practice handling this conversation type.`
      : `Roleplay scenario featuring ${name}, a ${personaType.toLowerCase()} buyer.`);

  const customPrompt =
    persona.custom_prompt?.trim() ||
    `You are ${name}, a ${personaType} in a sales roleplay. Stay in character as the buyer/prospect only.

Behaviors:
- ${typeDefaults.personality_traits || GENERIC_DEFAULTS.personality_traits}
- Raise objections such as: ${typeDefaults.objection_style || GENERIC_DEFAULTS.objection_style}
- Do not agree too quickly; make the rep earn progress with strong discovery and value
- Keep responses natural, 1-3 sentences, conversational
- Reference concerns consistent with: ${context.slice(0, 200)}...

Never break character. Never coach the rep.`;

  return {
    persona_name: name,
    persona_type: personaType,
    difficulty: persona.difficulty || 'intermediate',
    context_text: context,
    objectives: hasText(persona.objectives) ? persona.objectives!.trim() : typeDefaults.objectives || GENERIC_DEFAULTS.objectives,
    goals: hasText(persona.goals) ? persona.goals!.trim() : typeDefaults.goals || GENERIC_DEFAULTS.goals,
    custom_prompt: customPrompt,
    evaluation_focus: hasText(persona.evaluation_focus)
      ? persona.evaluation_focus!.trim()
      : typeDefaults.evaluation_focus || GENERIC_DEFAULTS.evaluation_focus,
    target_skills: hasSkills(persona.target_skills)
      ? persona.target_skills!
      : typeDefaults.target_skills || GENERIC_DEFAULTS.target_skills,
    objection_style: hasText(persona.objection_style)
      ? persona.objection_style!.trim()
      : typeDefaults.objection_style || GENERIC_DEFAULTS.objection_style,
    personality_traits: hasText(persona.personality_traits)
      ? persona.personality_traits!.trim()
      : typeDefaults.personality_traits || GENERIC_DEFAULTS.personality_traits,
  };
}
