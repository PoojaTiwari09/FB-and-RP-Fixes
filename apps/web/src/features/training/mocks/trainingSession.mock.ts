// src/mocks/trainingSession.mock.ts
import { SessionContext } from '@training/types/trainingSession.types';

export const SESSION_CONTEXT_MOCK: SessionContext = {
  trainingId: '1',
  trainingTitle: 'Discovery Call Practice',
  persona: {
    name: 'Sarah Johnson',
    jobTitle: 'VP of Sales Operations',
    company: 'TechFlow Inc',
    motivations:
      'Looking to streamline sales processes and improve team productivity. Frustrated with current CRM limitations and manual data entry. Wants to show ROI to executive team within 6 months.',
    communicationStyle:
      'Direct and analytical. Prefers data-driven conversations. Asks detailed questions about implementation and integration. Values transparency and realistic timelines over overpromising.',
  },
  meetingContext: {
    scenario: 'Discovery Call - Initial Meeting',
    objective:
      'Build rapport with Sarah, uncover her key pain points around CRM and sales process inefficiencies, and position our solution as a potential fit. Aim to schedule a follow-up demo.',
    backgroundForTrainee:
      'TechFlow Inc is a mid-market SaaS company with 200+ employees. They currently use Salesforce but have been exploring alternatives due to low adoption rates among their sales team. Sarah was referred by a mutual connection and has expressed interest in seeing a demo.',
  },
  playbookSections: [
    {
      id: 'sec-1',
      title: 'Discovery',
      questions: [
        { id: 'q1', text: 'What does your current workflow look like from lead to close?', tags: ['high-impact'], whyItMatters: 'Understanding their current process reveals inefficiencies and pain points your solution can address directly.' },
        { id: 'q2', text: 'Who else is involved in the decision-making process?', tags: ['high-impact'], whyItMatters: 'Identifying stakeholders early prevents surprises later and helps tailor your pitch to multiple decision-makers.' },
        { id: 'q3', text: 'What would make this a must-have versus a nice-to-have?', tags: ['missed-last-attempt'], whyItMatters: 'This separates urgency from interest and helps you understand the prospect\'s buying criteria.' },
        { id: 'q4', text: 'How are you currently measuring sales team performance?', tags: [], whyItMatters: null },
      ],
    },
    {
      id: 'sec-2',
      title: 'Objection Handling',
      questions: [
        { id: 'q5', text: 'Have you evaluated other solutions? What did you like or dislike?', tags: ['high-impact'], whyItMatters: 'Understanding competitive landscape helps you position against alternatives and address specific concerns.' },
        { id: 'q6', text: 'What concerns do you have about making a change right now?', tags: [], whyItMatters: null },
        { id: 'q7', text: 'What would need to be true for you to feel confident moving forward?', tags: ['missed-last-attempt'], whyItMatters: 'This surfaces hidden objections and lets the prospect define their own success criteria.' },
      ],
    },
    {
      id: 'sec-3',
      title: 'Closing',
      questions: [
        { id: 'q8', text: 'What does your ideal timeline for implementation look like?', tags: [], whyItMatters: null },
        { id: 'q9', text: 'Who else needs to sign off before moving forward?', tags: ['high-impact'], whyItMatters: 'Confirming the approval chain prevents deals from stalling at the last minute.' },
        { id: 'q10', text: 'Would you be open to a pilot program to test the value?', tags: [], whyItMatters: null },
      ],
    },
  ],
};

/** Mock AI replies cycled when user sends a message */
export const MOCK_AI_REPLIES: string[] = [
  "Thanks for reaching out. We've been looking for ways to improve our sales process. Can you tell me a bit more about how your platform handles CRM integration?",
  "That's an interesting point. Our biggest issue right now is manual data entry. It's taking up too much of our reps' time and leading to inconsistent data.",
  "I appreciate the transparency. We've looked at a few other solutions, but they all seemed too complex for our team's needs. What makes your approach different?",
  "Timeline is important to us. We'd need to see results within the first quarter if we're going to justify the investment to our executive team.",
  "That's a valid point. I'd need to loop in our CTO and the sales team lead before making any decisions. Can you walk me through the implementation process?",
  "We're definitely interested, but I want to make sure we're not overpromising to our team. What does a realistic rollout look like?",
];
