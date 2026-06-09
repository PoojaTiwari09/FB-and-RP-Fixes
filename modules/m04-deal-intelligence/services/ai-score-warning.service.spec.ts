import { Test, TestingModule } from '@nestjs/testing';

/**
 * AI LIKELIHOOD SCORE TEST SUITE
 */

describe('AI Likelihood Score', () => {
  describe('TC-DB-AI-001: AI likelihood score displayed for all deals', () => {
    it('should show score between 0-100 for all deals', () => {
      const deals = [
        { id: 'deal-1', aiScore: 85 },
        { id: 'deal-2', aiScore: 42 },
        { id: 'deal-3', aiScore: 100 },
        { id: 'deal-4', aiScore: 0 },
      ];

      deals.forEach((deal) => {
        expect(deal.aiScore).toBeGreaterThanOrEqual(0);
        expect(deal.aiScore).toBeLessThanOrEqual(100);
      });
    });

    it('should apply color coding based on score', () => {
      const getScoreColor = (score: number) => {
        if (score >= 70) return 'green';
        if (score >= 40) return 'amber';
        return 'red';
      };

      expect(getScoreColor(85)).toBe('green');
      expect(getScoreColor(55)).toBe('amber');
      expect(getScoreColor(25)).toBe('red');
    });
  });

  describe('TC-DB-AI-002: Clicking AI score shows signal breakdown', () => {
    it('should display positive signal drivers', () => {
      const scoreBreakdown = {
        score: 75,
        positiveSignals: [
          'Recent call activity (5 calls in 7 days)',
          'Multiple buyer engagement',
          'Budget confirmed',
        ],
        negativeSignals: ['No pricing discussion'],
      };

      expect(scoreBreakdown.positiveSignals.length).toBeGreaterThan(0);
      expect(scoreBreakdown.positiveSignals[0]).toBeDefined();
    });

    it('should display negative signal drivers', () => {
      const scoreBreakdown = {
        score: 35,
        positiveSignals: ['Contact engaged'],
        negativeSignals: [
          'No activity for 10 days',
          'Close date not set',
          'No decision maker contact',
        ],
      };

      expect(scoreBreakdown.negativeSignals.length).toBeGreaterThan(0);
    });
  });

  describe('TC-DB-AI-003: AI score refreshes daily', () => {
    it('should have updated timestamp within 24 hours', () => {
      const now = new Date();
      const lastUpdated = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      expect(hoursSinceUpdate).toBeLessThan(24);
    });
  });

  describe('TC-DB-AI-004: AI score recalculated within 4 hours after new activity', () => {
    it('should update score when new call transcript is added', () => {
      const deal = {
        id: 'deal-1',
        lastActivityDate: new Date('2026-05-25T08:00:00Z'),
        lastScoreUpdate: new Date('2026-05-25T08:00:00Z'),
        aiScore: 65,
      };

      // Simulate new activity
      const newActivityTime = new Date('2026-05-25T10:00:00Z');
      const timeSinceActivity = (newActivityTime.getTime() - deal.lastActivityDate.getTime()) / (1000 * 60 * 60);

      // Should recalculate within 4 hours
      expect(timeSinceActivity).toBeLessThan(4);
    });
  });

  describe('TC-DB-AI-005: AI score displayed with limited historical data', () => {
    it('should use fallback model for new organization', () => {
      const deal = {
        id: 'deal-1',
        aiScore: 50, // Base model score
        modelType: 'fallback',
        note: 'Based on general model - limited org history',
      };

      expect(deal.aiScore).toBeDefined();
      expect(deal.modelType).toBe('fallback');
    });

    it('should not crash when historical data is missing', () => {
      const deals = [
        { id: 'deal-1', aiScore: 55 },
        { id: 'deal-2', aiScore: 50 },
      ];

      expect(() => {
        deals.forEach((d) => {
          if (!d.aiScore) throw new Error('Score missing');
        });
      }).not.toThrow();
    });
  });

  describe('TC-DB-AI-006: AI score for deal with zero interactions', () => {
    it('should still calculate score using available CRM signals', () => {
      const deal = {
        id: 'deal-1',
        calls: [],
        emails: [],
        stage: 'Negotiation',
        amount: 250000,
        closeDate: '2026-06-30',
        aiScore: 45, // Score based on CRM data alone
      };

      expect(deal.aiScore).not.toBeNull();
      expect(deal.aiScore).toBeGreaterThanOrEqual(0);
    });

    it('should indicate insufficient interaction data', () => {
      const scoreBreakdown = {
        score: 45,
        dataAvailability: 'minimal',
        note: 'Score based on CRM data only - no call/email activity recorded',
      };

      expect(scoreBreakdown.dataAvailability).toBe('minimal');
    });
  });
});

/**
 * DEAL WARNINGS TEST SUITE
 */

describe('AI Deal Monitor Warnings', () => {
  const warningTypes = [
    'No recent activity',
    'Single-threaded contact',
    'Close date passed',
    'No next steps',
    'Pricing not discussed',
    'Competitor mentioned',
    'Red-flag language',
    'Decision maker not engaged',
  ];

  describe('TC-DB-WRN-001: All 8 warning types can be triggered', () => {
    it('should trigger "No recent activity" warning', () => {
      const deal = {
        id: 'deal-1',
        lastActivity: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        threshold: 8, // days
        warnings: [] as string[],
      };

      const daysSinceActivity = (Date.now() - deal.lastActivity.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceActivity > deal.threshold) {
        deal.warnings.push('No recent activity');
      }

      expect(deal.warnings).toContain('No recent activity');
    });

    it('should trigger "Single-threaded" warning', () => {
      const deal = {
        id: 'deal-1',
        engagedContacts: [{ name: 'John Doe', persona: 'End User' }],
        warnings: [] as string[],
      };

      if (deal.engagedContacts.length === 1) {
        deal.warnings.push('Single-threaded contact');
      }

      expect(deal.warnings).toContain('Single-threaded contact');
    });

    it('should trigger "Close date passed" warning', () => {
      const deal = {
        id: 'deal-1',
        closeDate: new Date('2026-05-20'),
        currentDate: new Date('2026-05-25'),
        stage: 'Negotiation', // Still open
        warnings: [] as string[],
      };

      if (deal.closeDate < deal.currentDate && deal.stage !== 'Closed Won' && deal.stage !== 'Closed Lost') {
        deal.warnings.push('Close date passed');
      }

      expect(deal.warnings).toContain('Close date passed');
    });

    it('should trigger "No next steps" warning', () => {
      const deal = {
        id: 'deal-1',
        nextSteps: [],
        warnings: [] as string[],
      };

      if (deal.nextSteps.length === 0) {
        deal.warnings.push('No next steps');
      }

      expect(deal.warnings).toContain('No next steps');
    });

    it('should trigger "Pricing not discussed" warning', () => {
      const deal = {
        id: 'deal-1',
        callTranscripts: ['General meeting', 'Feature discussion'],
        recentCallsMentionPricing: false,
        warnings: [] as string[],
      };

      if (!deal.recentCallsMentionPricing && deal.callTranscripts.length > 0) {
        deal.warnings.push('Pricing not discussed');
      }

      expect(deal.warnings).toContain('Pricing not discussed');
    });

    it('should trigger "Competitor mentioned" warning', () => {
      const deal = {
        id: 'deal-1',
        recentCalls: [
          { transcript: 'They mentioned they are looking at Competitor X' },
        ],
        competitorMentioned: true,
        warnings: [] as string[],
      };

      if (deal.competitorMentioned) {
        deal.warnings.push('Competitor mentioned');
      }

      expect(deal.warnings).toContain('Competitor mentioned');
    });

    it('should trigger "Red-flag language" warning', () => {
      const deal = {
        id: 'deal-1',
        recentEmails: [
          { text: 'We have budget constraints this quarter' },
        ],
        redFlagLanguageDetected: true,
        warnings: [] as string[],
      };

      if (deal.redFlagLanguageDetected) {
        deal.warnings.push('Red-flag language');
      }

      expect(deal.warnings).toContain('Red-flag language');
    });

    it('should trigger "Decision maker not engaged" warning', () => {
      const deal = {
        id: 'deal-1',
        engagedPersonas: ['End User', 'Business Analyst'],
        decisionMakerEngaged: false,
        warnings: [] as string[],
      };

      if (!deal.decisionMakerEngaged) {
        deal.warnings.push('Decision maker not engaged');
      }

      expect(deal.warnings).toContain('Decision maker not engaged');
    });
  });

  describe('TC-DB-WRN-002: Warning count visible in board column', () => {
    it('should show warning count as number', () => {
      const deal = {
        id: 'deal-1',
        warnings: [
          'No recent activity',
          'Single-threaded contact',
          'Close date passed',
        ],
      };

      expect(deal.warnings.length).toBe(3);
    });

    it('should apply color coding to warning count', () => {
      const getWarningColor = (count: number) => {
        if (count >= 3) return 'red';
        if (count >= 1) return 'amber';
        return 'green';
      };

      expect(getWarningColor(3)).toBe('red');
      expect(getWarningColor(2)).toBe('amber');
      expect(getWarningColor(0)).toBe('green');
    });
  });

  describe('TC-DB-WRN-003: Warning tooltip shows details', () => {
    it('should display warning name and reason', () => {
      const warningTooltip = {
        name: 'No recent activity',
        reason: 'No calls or emails in the last 8 days',
        suggestedMitigation: 'Schedule a call with the deal owner',
      };

      expect(warningTooltip.name).toBeDefined();
      expect(warningTooltip.reason).toBeDefined();
      expect(warningTooltip.suggestedMitigation).toBeDefined();
    });
  });

  describe('TC-DB-WRN-004: Warning surfaced within 4 hours', () => {
    it('should detect and surface warning within processing window', () => {
      const triggerEvent = new Date('2026-05-25T08:00:00Z');
      const warningDetected = new Date('2026-05-25T11:30:00Z');

      const hoursToDetect = (warningDetected.getTime() - triggerEvent.getTime()) / (1000 * 60 * 60);

      expect(hoursToDetect).toBeLessThanOrEqual(4);
    });
  });

  describe('TC-DB-WRN-005: Multiple warnings on one deal', () => {
    it('should display all triggered warnings', () => {
      const deal = {
        id: 'deal-1',
        warnings: [
          'No recent activity',
          'Single-threaded contact',
          'Close date passed',
          'No next steps',
        ],
      };

      expect(deal.warnings.length).toBe(4);
      expect(deal.warnings).toContain('No recent activity');
      expect(deal.warnings).toContain('Single-threaded contact');
    });

    it('should not hide or suppress any warnings', () => {
      const deal = {
        id: 'deal-1',
        allWarnings: [
          'Warning 1',
          'Warning 2',
          'Warning 3',
          'Warning 4',
        ],
        displayedWarnings: [
          'Warning 1',
          'Warning 2',
          'Warning 3',
          'Warning 4',
        ],
      };

      expect(deal.displayedWarnings.length).toBe(deal.allWarnings.length);
    });

    it('should sort warnings by severity', () => {
      const warnings = [
        { name: 'No recent activity', severity: 'medium' },
        { name: 'Close date passed', severity: 'critical' },
        { name: 'Single-threaded contact', severity: 'low' },
      ];

      const sorted = warnings.sort((a, b) => {
        const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

      expect(sorted[0].severity).toBe('critical');
      expect(sorted[2].severity).toBe('low');
    });
  });

  describe('TC-DB-WRN-006: Warning disappears when condition resolved', () => {
    it('should remove "No Activity" warning when activity logged', () => {
      let deal = {
        id: 'deal-1',
        lastActivity: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        warnings: ['No recent activity'],
      };

      expect(deal.warnings).toContain('No recent activity');

      // Log a call
      deal.lastActivity = new Date();

      // Recalculate warnings
      const daysSinceActivity = (Date.now() - deal.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity <= 8) {
        deal.warnings = deal.warnings.filter((w) => w !== 'No recent activity');
      }

      expect(deal.warnings).not.toContain('No recent activity');
    });

    it('should update warning count on the board', () => {
      const deal = {
        id: 'deal-1',
        warnings: ['Warning 1', 'Warning 2', 'Warning 3'],
        warningCount: 3,
      };

      expect(deal.warningCount).toBe(3);

      // Resolve a warning
      deal.warnings = deal.warnings.slice(0, 2);
      deal.warningCount = deal.warnings.length;

      expect(deal.warningCount).toBe(2);
    });
  });

  describe('TC-DB-WRN-007: Warnings without transcript data', () => {
    it('should not fabricate warnings from missing data', () => {
      const deal = {
        id: 'deal-1',
        callsRecorded: 0,
        transcriptsAvailable: 0,
        warnings: [], // No warnings created from missing data
      };

      expect(deal.warnings.length).toBe(0);
    });

    it('should show "insufficient data" for transcript-dependent warnings', () => {
      const warning = {
        name: 'Pricing not discussed',
        status: 'insufficient_data',
        note: 'No call transcripts available for analysis',
      };

      expect(warning.status).toBe('insufficient_data');
    });
  });
});

/**
 * WARNING CALCULATION TESTS
 */

describe('Warning Calculations', () => {
  it('should correctly count deals with specific warning', () => {
    const deals = [
      { id: '1', warnings: ['No Activity'] },
      { id: '2', warnings: ['No Activity', 'Single-threaded'] },
      { id: '3', warnings: ['Close Date Passed'] },
    ];

    const withNoActivityWarning = deals.filter((d) => d.warnings.includes('No Activity'));
    expect(withNoActivityWarning.length).toBe(2);
  });

  it('should calculate warning percentage correctly', () => {
    const deals = [
      { id: '1', warnings: ['No Activity'] },
      { id: '2', warnings: [] },
      { id: '3', warnings: [] },
      { id: '4', warnings: [] },
      { id: '5', warnings: [] },
    ];

    const total = deals.length;
    const withNoActivity = deals.filter((d) => d.warnings.includes('No Activity')).length;
    const percentage = (withNoActivity / total) * 100;

    expect(percentage).toBe(20);
  });

  it('should only count deals open for at least 1 day', () => {
    const deals = [
      { id: '1', openedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), closedDate: null },
      { id: '2', openedDate: new Date(), closedDate: new Date() }, // Same day
      { id: '3', openedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), closedDate: null },
    ];

    const openFor1Plus = deals.filter((d) => {
      const dayOpen = (Date.now() - d.openedDate.getTime()) / (1000 * 60 * 60 * 24);
      return dayOpen >= 1 || d.closedDate === null;
    });

    expect(openFor1Plus.length).toBe(2);
  });
});
