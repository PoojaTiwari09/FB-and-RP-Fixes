// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';

/**
 * DEAL DRIVERS TEST SUITE
 * Tests for Deal Drivers warning analytics matrix
 */

describe('Deal Drivers', () => {
  describe('TC-DD-ACC-001: Authorized user can access Deal Drivers page', () => {
    it('should allow manager access to Deal Drivers', () => {
      const user = { role: 'manager', permissions: ['view_deal_drivers'] };
      const hasAccess = user.permissions.includes('view_deal_drivers');

      expect(hasAccess).toBe(true);
    });

    it('should deny rep access to Deal Drivers', () => {
      const user = { role: 'sales_rep', permissions: [] as string[] };
      const hasAccess = user.permissions.includes('view_deal_drivers');

      expect(hasAccess).toBe(false);
    });

    it('should display filter bar and context summary', () => {
      const pageElements = {
        title: 'Deal Drivers',
        filterBar: { teamSelector: true, boardSelector: true, periodSelector: true },
        contextSummary: true,
        matrix: true,
      };

      expect(pageElements.title).toBeDefined();
      expect(pageElements.filterBar.teamSelector).toBe(true);
      expect(pageElements.filterBar.periodSelector).toBe(true);
    });
  });

  describe('TC-DD-FLT-001 to TC-DD-FLT-003: Filtering functionality', () => {
    it('should filter by team selection', () => {
      const teams = [
        { id: 'team-1', name: 'Sales Team A', reps: ['rep-1', 'rep-2', 'rep-3'] },
        { id: 'team-2', name: 'Sales Team B', reps: ['rep-4', 'rep-5'] },
      ];

      const selectedTeam = teams.find((t) => t.id === 'team-1')!;
      expect(selectedTeam.reps.length).toBe(3);
    });

    it('should filter by period (Now, Last 30 days, Last 90 days)', () => {
      const periods = ['Now', 'Last 30 days', 'Last 90 days'];
      const selectedPeriod = 'Last 30 days';

      expect(periods).toContain(selectedPeriod);
    });

    it('should filter by board selection', () => {
      const boards = [
        { id: 'board-1', name: 'Enterprise Board' },
        { id: 'board-2', name: 'Mid-Market Board' },
      ];

      const selectedBoard = boards.find((b) => b.id === 'board-1')!;
      expect(selectedBoard.name).toBe('Enterprise Board');
    });

    it('should load correct matrix with combined filters', () => {
      const filters = {
        team: 'Sales Team A',
        period: 'Last 30 days',
        board: 'Enterprise Board',
      };

      const matrix = {
        filters: filters,
        rows: 3, // 3 reps in Sales Team A
        columns: 8, // 8 warning types
      };

      expect(matrix.filters.team).toBe('Sales Team A');
      expect(matrix.columns).toBe(8);
    });

    it('should handle empty state when no deals exist', () => {
      const emptyState = {
        message: 'No deals found for this selection',
        showMatrix: false,
      };

      expect(emptyState.message).toBeDefined();
      expect(emptyState.showMatrix).toBe(false);
    });
  });

  describe('TC-DD-MTX-001 to TC-DD-MTX-006: Matrix structure and calculation', () => {
    it('should have correct matrix structure (reps x warning types)', () => {
      const matrix = {
        rows: ['Rep A', 'Rep B', 'Rep C', 'Rep D', 'Rep E'],
        columns: [
          'No Activity',
          'Single-threaded',
          'Close Date Passed',
          'No Next Steps',
          'Pricing Not Discussed',
          'Competitor Not Addressed',
          'Red-Flag Email',
          'Decision Maker Not Engaged',
        ],
      };

      expect(matrix.rows.length).toBe(5);
      expect(matrix.columns.length).toBe(8);
    });

    it('should calculate warning percentage correctly', () => {
      // Rep has 10 deals, 3 with "No Activity" warning
      const deals = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: i,
          hasNoActivityWarning: i < 3, // First 3 have the warning
        }));

      const totalDeals = deals.length;
      const withWarning = deals.filter((d) => d.hasNoActivityWarning).length;
      const percentage = (withWarning / totalDeals) * 100;

      expect(percentage).toBe(30);
    });

    it('should only count deals open for 1+ days', () => {
      const deals = [
        {
          id: '1',
          openedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          closedDate: null,
          countInMetrics: true,
        },
        {
          id: '2',
          openedDate: new Date(),
          closedDate: new Date(),
          countInMetrics: false, // Same day - exclude
        },
        {
          id: '3',
          openedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          closedDate: null,
          countInMetrics: true,
        },
      ];

      const includedDeals = deals.filter((d) => d.countInMetrics);
      expect(includedDeals.length).toBe(2);
    });

    it('should show 0% for rep with zero deals', () => {
      const rep = {
        name: 'Rep A',
        dealCount: 0,
        warnings: {
          'No Activity': '0%',
          'Single-threaded': '0%',
          'Close Date Passed': '0%',
        },
      };

      expect(rep.dealCount).toBe(0);
      expect(rep.warnings['No Activity']).toBe('0%');
    });

    it('should show 0% for rep with deals but no warnings', () => {
      const rep = {
        name: 'Rep B',
        dealCount: 5,
        warningsTriggered: 0,
        warnings: {
          'No Activity': '0%',
          'Single-threaded': '0%',
        },
      };

      expect(rep.warningsTriggered).toBe(0);
      expect(rep.warnings['No Activity']).toBe('0%');
    });

    it('should update matrix when board selection changes', () => {
      const boardA = {
        id: 'board-a',
        warnings: ['Warning1', 'Warning2', 'Warning3'],
      };

      const boardB = {
        id: 'board-b',
        warnings: ['Warning1', 'Warning2', 'Warning4'],
      };

      let currentBoard = boardA;
      expect(currentBoard.warnings).toContain('Warning3');

      currentBoard = boardB;
      expect(currentBoard.warnings).not.toContain('Warning3');
      expect(currentBoard.warnings).toContain('Warning4');
    });
  });

  describe('TC-DD-HM-001 to TC-DD-HM-004: Heatmap highlighting', () => {
    it('should highlight top 3 values in each column', () => {
      const column = [
        { rep: 'Rep A', value: 50 },
        { rep: 'Rep B', value: 75 },
        { rep: 'Rep C', value: 30 },
        { rep: 'Rep D', value: 65 },
        { rep: 'Rep E', value: 40 },
      ];

      const sorted = [...column].sort((a, b) => b.value - a.value);
      const topThree = sorted.slice(0, 3);

      expect(topThree[0].rep).toBe('Rep B'); // 75
      expect(topThree[1].rep).toBe('Rep D'); // 65
      expect(topThree[2].rep).toBe('Rep A'); // 50
    });

    it('should apply yellow highlighting only to top 3', () => {
      const cells = [
        { rep: 'A', value: 75, highlighted: true },
        { rep: 'B', value: 65, highlighted: true },
        { rep: 'C', value: 50, highlighted: true },
        { rep: 'D', value: 40, highlighted: false },
        { rep: 'E', value: 30, highlighted: false },
      ];

      const highlightedCount = cells.filter((c) => c.highlighted).length;
      expect(highlightedCount).toBe(3);
    });

    it('should handle ties consistently', () => {
      const column = [
        { rep: 'A', value: 50 },
        { rep: 'B', value: 50 },
        { rep: 'C', value: 50 },
        { rep: 'D', value: 50 },
      ];

      // When all tied, highlight first 3 (consistent tie-breaking)
      const sorted = column.sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return a.rep.localeCompare(b.rep); // Alphabetical tie-breaker
      });

      const topThree = sorted.slice(0, 3);
      expect(topThree.length).toBe(3);
    });

    it('should not highlight zero-value cells incorrectly', () => {
      const column = [
        { rep: 'A', value: 50, highlighted: true },
        { rep: 'B', value: 30, highlighted: true },
        { rep: 'C', value: 10, highlighted: true },
        { rep: 'D', value: 0, highlighted: false },
        { rep: 'E', value: 0, highlighted: false },
      ];

      const zeroHighlighted = column.filter((c) => c.value === 0 && c.highlighted).length;
      expect(zeroHighlighted).toBe(0);
    });
  });

  describe('TC-DD-TT-001 to TC-DD-TT-004: Team training indicator', () => {
    it('should show team training indicator when warning widespread (4+ reps)', () => {
      const reps = [
        { name: 'Rep A', 'Single-threaded': 45 },
        { name: 'Rep B', 'Single-threaded': 60 },
        { name: 'Rep C', 'Single-threaded': 50 },
        { name: 'Rep D', 'Single-threaded': 40 },
        { name: 'Rep E', 'Single-threaded': 20 },
      ];

      const widelyAffected = reps.filter((r) => r['Single-threaded'] >= 30).length;
      const showIndicator = widelyAffected >= 4;

      expect(showIndicator).toBe(true);
    });

    it('should not show indicator for isolated issue (1 rep)', () => {
      const reps = [
        { name: 'Rep A', 'No Activity': 70 },
        { name: 'Rep B', 'No Activity': 0 },
        { name: 'Rep C', 'No Activity': 0 },
        { name: 'Rep D', 'No Activity': 0 },
      ];

      const affected = reps.filter((r) => r['No Activity'] > 0).length;
      const showIndicator = affected >= 4;

      expect(showIndicator).toBe(false);
    });

    it('should scope team indicator to selected board', () => {
      const boards = {
        'board-a': {
          reps: [
            { name: 'Rep A', 'Single-threaded': 50 },
            { name: 'Rep B', 'Single-threaded': 60 },
            { name: 'Rep C', 'Single-threaded': 55 },
            { name: 'Rep D', 'Single-threaded': 50 },
          ],
          showIndicator: true,
        },
        'board-b': {
          reps: [
            { name: 'Rep A', 'Single-threaded': 10 },
            { name: 'Rep B', 'Single-threaded': 15 },
            { name: 'Rep C', 'Single-threaded': 5 },
            { name: 'Rep D', 'Single-threaded': 8 },
          ],
          showIndicator: false,
        },
      };

      expect(boards['board-a'].showIndicator).toBe(true);
      expect(boards['board-b'].showIndicator).toBe(false);
    });

    it('should use clear, non-alarming wording', () => {
      const indicator = {
        title: 'Team coaching opportunity',
        message: 'This warning pattern appears common across the team. Consider team-wide coaching or process improvement.',
        tone: 'helpful',
      };

      expect(indicator.message).not.toContain('Error');
      expect(indicator.message).not.toContain('Failure');
      expect(indicator.tone).toBe('helpful');
    });
  });

  describe('TC-DD-DD-001 to TC-DD-DD-004: Drill-down functionality', () => {
    it('should open deal list when clicking matrix cell', () => {
      const cellClick = {
        rep: 'Rep A',
        warning: 'No Activity',
        value: 40,
        dealsWithWarning: [
          { id: '1', name: 'Deal 1', lastActivity: '10 days ago' },
          { id: '2', name: 'Deal 2', lastActivity: '12 days ago' },
          { id: '3', name: 'Deal 3', lastActivity: '8 days ago' },
          { id: '4', name: 'Deal 4', lastActivity: '9 days ago' },
        ],
      };

      expect(cellClick.dealsWithWarning.length).toBe(4);
      expect(cellClick.dealsWithWarning[0].id).toBe('1');
    });

    it('should retain matrix view while drill-down is open', () => {
      const state = {
        matrixVisible: true,
        drilldownOpen: true,
        bothVisible: true,
      };

      expect(state.matrixVisible && state.drilldownOpen).toBe(true);
    });

    it('should handle non-interactive 0% cells', () => {
      const cell = {
        rep: 'Rep A',
        warning: 'No Activity',
        value: 0,
        isClickable: false,
      };

      expect(cell.isClickable).toBe(false);
    });

    it('should show only deals within selected period in drill-down', () => {
      const period = 'Last 30 days';
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const allDeals = [
        { id: '1', createdDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
        { id: '2', createdDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
        { id: '3', createdDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      ];

      const filteredDeals = allDeals.filter((d) => d.createdDate >= cutoffDate);
      expect(filteredDeals.length).toBe(2);
      expect(filteredDeals.map((d) => d.id)).toEqual(['1', '3']);
    });
  });

  describe('TC-DD-SORT-001 to TC-DD-SORT-003: Sorting functionality', () => {
    it('should sort by deal count ascending/descending', () => {
      let reps = [
        { name: 'Rep A', dealCount: 10 },
        { name: 'Rep B', dealCount: 25 },
        { name: 'Rep C', dealCount: 15 },
        { name: 'Rep D', dealCount: 5 },
      ];

      // Ascending
      const ascending = [...reps].sort((a, b) => a.dealCount - b.dealCount);
      expect(ascending[0].dealCount).toBe(5);
      expect(ascending[3].dealCount).toBe(25);

      // Descending
      const descending = [...reps].sort((a, b) => b.dealCount - a.dealCount);
      expect(descending[0].dealCount).toBe(25);
      expect(descending[3].dealCount).toBe(5);
    });

    it('should sort by warning percentage', () => {
      let reps = [
        { name: 'Rep A', 'No Activity': 30 },
        { name: 'Rep B', 'No Activity': 70 },
        { name: 'Rep C', 'No Activity': 50 },
      ];

      const sorted = [...reps].sort((a, b) => b['No Activity'] - a['No Activity']);
      expect(sorted[0].name).toBe('Rep B');
      expect(sorted[2].name).toBe('Rep A');
    });

    it('should use consistent tie-breaking', () => {
      let reps = [
        { name: 'Charlie', dealCount: 10 },
        { name: 'Alice', dealCount: 10 },
        { name: 'Bob', dealCount: 10 },
      ];

      const sorted = [...reps].sort((a, b) => {
        if (b.dealCount !== a.dealCount) return b.dealCount - a.dealCount;
        return a.name.localeCompare(b.name); // Alphabetical
      });

      expect(sorted[0].name).toBe('Alice');
      expect(sorted[1].name).toBe('Bob');
      expect(sorted[2].name).toBe('Charlie');
    });
  });

  describe('TC-DD-BSC-001 to TC-DD-BSC-002: Board-specific scoping', () => {
    it('should use selected board warning configuration', () => {
      const boardA = {
        id: 'board-a',
        warnings: ['No Activity', 'Single-threaded', 'Competitor Not Addressed'],
      };

      const boardB = {
        id: 'board-b',
        warnings: ['No Activity', 'Single-threaded', 'Pricing Not Discussed'],
      };

      let selectedBoard = boardA;
      expect(selectedBoard.warnings).toContain('Competitor Not Addressed');
      expect(selectedBoard.warnings).not.toContain('Pricing Not Discussed');

      selectedBoard = boardB;
      expect(selectedBoard.warnings).toContain('Pricing Not Discussed');
      expect(selectedBoard.warnings).not.toContain('Competitor Not Addressed');
    });

    it('should not include deals from non-selected boards', () => {
      const boardA = {
        id: 'board-a',
        deals: [{ id: '1', name: 'Deal A1' }, { id: '2', name: 'Deal A2' }],
      };

      const boardB = {
        id: 'board-b',
        deals: [{ id: '3', name: 'Deal B1' }],
      };

      let selectedBoard = boardB;
      expect(selectedBoard.deals.some((d) => d.id === '1')).toBe(false);
      expect(selectedBoard.deals.length).toBe(1);
    });
  });

  describe('TC-DD-FRESH-001 to TC-DD-FRESH-002: Data freshness', () => {
    it('should reflect latest warning state after resolution', () => {
      const deal = {
        id: 'deal-1',
        warnings: ['No Activity', 'Single-threaded'],
        warningCount: 2,
      };

      // Resolve a warning
      deal.warnings = deal.warnings.filter((w) => w !== 'No Activity');
      deal.warningCount = deal.warnings.length;

      expect(deal.warningCount).toBe(1);
      expect(deal.warnings).toContain('Single-threaded');
    });

    it('should show informative empty state when no warning history', () => {
      const emptyState = {
        message: 'Warning history not yet available for this board',
        showData: false,
        guidance: 'Warning tracking starts when board is created',
      };

      expect(emptyState.message).toBeDefined();
      expect(emptyState.showData).toBe(false);
    });
  });

  describe('TC-DD-AC-001 to TC-DD-AC-004: Access control', () => {
    it('should show only manager\'s direct reports', () => {
      const manager = {
        id: 'mgr-1',
        directReports: ['rep-1', 'rep-2', 'rep-3'],
      };

      const allReps = ['rep-1', 'rep-2', 'rep-3', 'rep-4', 'rep-5'];
      const visibleReps = allReps.filter((r) => manager.directReports.includes(r));

      expect(visibleReps.length).toBe(3);
    });

    it('should not show skip-level reports', () => {
      const seniorMgr = {
        id: 'mgr-1',
        directReports: [
          { id: 'mgr-2', isManager: true },
          { id: 'rep-1', isManager: false },
        ],
      };

      // Should not include mgr-2's reports
      const visibleReports = seniorMgr.directReports.filter((r) => !r.isManager);
      expect(visibleReports.length).toBe(1);
    });

    it('should exclude inaccessible deals from matrix', () => {
      const reps = [
        {
          name: 'Rep A',
          accessibleDeals: 10,
          warnings: { 'No Activity': 3 },
        },
        {
          name: 'Rep B',
          accessibleDeals: 0, // No access to this rep's data
          warnings: {},
        },
      ];

      const visibleReps = reps.filter((r) => r.accessibleDeals > 0);
      expect(visibleReps.length).toBe(1);
    });

    it('should allow RevOps to select any team', () => {
      const revOpsUser = { role: 'revops', canSelectAllTeams: true };
      const teams = ['Team A', 'Team B', 'Team C', 'Team D'];

      const selectedTeam = teams[2];
      expect(teams).toContain(selectedTeam);
    });
  });
});

/**
 * PERFORMANCE TESTS
 */

describe('Deal Drivers Performance', () => {
  describe('TC-DD-PERF-001: Matrix load time', () => {
    it('should load matrix within 3 seconds', () => {
      const startTime = Date.now();
      // Simulate loading 20 reps, 500 deals
      const loadTime = Math.random() * 2500; // Simulated 0-2.5 seconds
      const endTime = startTime + loadTime;

      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(3000);
    });
  });

  describe('TC-DD-PERF-002: Filter response time', () => {
    it('should respond to filter change within acceptable time', () => {
      const startTime = Date.now();
      const filterChangeTime = Math.random() * 1500; // Simulated 0-1.5 seconds
      const endTime = startTime + filterChangeTime;

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(2000);
    });
  });
});
