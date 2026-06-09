// src/mocks/trainingResults.mock.ts
import { TrainingResultsPage } from '@training/types/trainingResults.types';

export const TRAINING_RESULTS_MOCK: TrainingResultsPage = {
  trainingId: '1',
  trainingTitle: 'Discovery Call Practice',
  overallScore: 78,
  maxScore: 100,
  performanceTier: 'good',
  tierLabel: 'Good',
  summaryText:
    'You scored 78 out of 100 points (78%). Great job on rapport building and discovery questions. Focus on probing deeper and gaining stronger commitments.',
  performanceTags: [
    { id: 'tag-1', label: 'Strong Opening', type: 'positive' },
    { id: 'tag-2', label: 'Improve Closing', type: 'warning' },
  ],
  scoredSections: [
    {
      id: 'sec-1',
      title: 'Discovery',
      score: 6,
      maxScore: 10,
      status: 'needs-practice',
      questions: [
        {
          id: 'q1',
          text: 'What does your current workflow look like from lead to close?',
          tags: ['high-impact', 'missed-last-attempt'],
        },
        {
          id: 'q2',
          text: 'Who else is involved in the decision-making process?',
          tags: ['high-impact'],
        },
        {
          id: 'q3',
          text: 'What would make this a must-have versus a nice-to-have?',
          tags: ['missed-last-attempt'],
        },
      ],
    },
    {
      id: 'sec-2',
      title: 'Objection Handling',
      score: 8,
      maxScore: 10,
      status: 'on-track',
      questions: [
        {
          id: 'q4',
          text: 'Have you evaluated other solutions? What did you like or dislike?',
          tags: ['high-impact'],
        },
        {
          id: 'q5',
          text: 'What concerns do you have about making a change right now?',
          tags: [],
        },
        {
          id: 'q6',
          text: 'What would need to be true for you to feel confident moving forward?',
          tags: ['missed-last-attempt'],
        },
      ],
    },
    {
      id: 'sec-3',
      title: 'Closing',
      score: 5,
      maxScore: 10,
      status: 'needs-practice',
      questions: [
        {
          id: 'q7',
          text: 'What does your ideal timeline for implementation look like?',
          tags: [],
        },
        {
          id: 'q8',
          text: 'Who else needs to sign off before moving forward?',
          tags: ['high-impact'],
        },
        {
          id: 'q9',
          text: 'Would you be open to a pilot program to test the value?',
          tags: [],
        },
      ],
    },
  ],
  performanceBreakdown: [
    {
      category: 'Opening & Rapport Building',
      score: 13,
      maxScore: 15,
      percentage: 87,
      description: 'Strong rapport building skills demonstrated. You established a warm and professional tone from the start.',
      strengths: ['Warm greeting and personalization', 'Active listening demonstrated early'],
      areasForImprovement: ['Ask more open-ended questions in the opening'],
    },
    {
      category: 'Discovery Questions',
      score: 26,
      maxScore: 35,
      percentage: 74,
      description: 'Good exploration of pain points, but missed opportunities to dig deeper into specific challenges.',
      strengths: ['Identified key pain point around manual data entry', 'Asked about decision-making process'],
      areasForImprovement: ['Probe deeper on budget and timeline', 'Quantify the impact of pain points'],
    },
    {
      category: 'Objection Handling',
      score: 20,
      maxScore: 25,
      percentage: 80,
      description: 'Handled objections well with empathy and relevant examples.',
      strengths: ['Used social proof effectively', 'Acknowledged concerns before responding'],
      areasForImprovement: ['Prepare for more technical objections', 'Use more specific case studies'],
    },
    {
      category: 'Closing & Next Steps',
      score: 19,
      maxScore: 25,
      percentage: 76,
      description: 'Adequate close, but missed opportunity to secure a firm commitment.',
      strengths: ['Proposed a clear next step'],
      areasForImprovement: ['Ask for specific date/time commitment', 'Summarize key value propositions before closing'],
    },
  ],
  transcript: [
    {
      timestampSeconds: 0,
      sender: 'user',
      senderLabel: 'You',
      text: "Hi Sarah, thanks for taking the time today. I'm excited to learn more about your sales operations.",
      quality: 'good-example',
    },
    {
      timestampSeconds: 8,
      sender: 'ai',
      senderLabel: 'Sarah Johnson',
      text: "Thanks for reaching out. We've been looking for ways to improve our sales process.",
      quality: null,
    },
    {
      timestampSeconds: 15,
      sender: 'user',
      senderLabel: 'You',
      text: "That's great to hear. Can you tell me more about your current challenges?",
      quality: null,
    },
    {
      timestampSeconds: 22,
      sender: 'ai',
      senderLabel: 'Sarah Johnson',
      text: "Our biggest issue is manual data entry. It's taking up too much of our reps' time.",
      quality: null,
    },
    {
      timestampSeconds: 35,
      sender: 'user',
      senderLabel: 'You',
      text: "I completely understand. Many of our clients faced similar challenges before switching to our platform. How is this impacting your team's overall productivity?",
      quality: 'good-example',
    },
    {
      timestampSeconds: 48,
      sender: 'ai',
      senderLabel: 'Sarah Johnson',
      text: "It's significant. We estimate reps spend about 30% of their time on data entry instead of selling.",
      quality: null,
    },
  ],
};
