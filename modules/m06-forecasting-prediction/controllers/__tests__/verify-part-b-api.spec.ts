import { Test, TestingModule } from '@nestjs/testing';
import { ForecastUpgradeService } from '../../services/forecast-upgrade.service';
import { PrismaService } from '../../database/prisma.service';
import { EventPublisherService } from '../../../platform-core/events/event-publisher.service';

describe('ForecastUpgradeService - Part B Verification', () => {
  let service: ForecastUpgradeService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      forecastSubmission: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      forecastAuditLog: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      forecastNotification: {
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      quota: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
      },
      forecastPeriod: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      crmDeal: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      forecastUser: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      pipelineValuesCache: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastUpgradeService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventPublisherService, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    service = module.get<ForecastUpgradeService>(ForecastUpgradeService);
  });

  describe('B1. Forecast Submissions', () => {
    it('B1a. getSubmissions - should map submissions with deal data correctly', async () => {
      prisma.forecastSubmission.findMany.mockResolvedValue([
        { id: 'sub1', dealId: 'deal1', bestCaseForecast: 100, commitForecast: 90, bestCaseState: 'editable', commitState: 'submitted', approvedBestCase: null, approvedCommit: null }
      ]);
      prisma.crmDeal.findUnique.mockResolvedValue({ dealName: 'Test Deal' });
      
      const res = await service.getSubmissions('period1', 'rep1');
      expect(res[0]).toEqual(expect.objectContaining({
        deal_id: 'deal1', deal_name: 'Test Deal', best_case_value: 100, best_case_state: 'editable', commit_state: 'submitted'
      }));
    });

    it('B1b. createOrUpdateSubmission - should UPDATE if editable draft exists', async () => {
      prisma.forecastSubmission.findFirst.mockResolvedValue({
        id: 'sub1', status: 'draft', bestCaseState: 'editable', commitState: 'editable', bestCaseForecast: 100, commitForecast: 100
      });
      prisma.forecastSubmission.update.mockResolvedValue({ id: 'sub1', bestCaseForecast: 150 });
      
      await service.createOrUpdateSubmission('rep1', 'deal1', 'period1', 'best_case', 150);
      expect(prisma.forecastSubmission.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'sub1' },
        data: expect.objectContaining({ bestCaseForecast: 150 })
      }));
    });

    it('B1c. submitForecast - should lock only the specified field', async () => {
      prisma.forecastSubmission.findUnique.mockResolvedValue({
        id: 'sub1', dealId: 'deal1', version: 1, bestCaseState: 'editable', commitState: 'editable'
      });
      prisma.forecastSubmission.create.mockResolvedValue({ id: 'sub2', bestCaseState: 'submitted', commitState: 'editable' });
      jest.spyOn(service, 'logActivity').mockResolvedValue();
      
      await service.submitForecast('sub1', 'rep1', 'best_case');
      expect(prisma.forecastSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ bestCaseState: 'submitted', commitState: 'editable', status: 'submitted' })
      }));
    });

    it('B1d. approveSubmission - should approve and call syncManualForecast', async () => {
      prisma.forecastSubmission.findUnique.mockResolvedValue({
        id: 'sub1', repUserId: 'rep1', dealId: 'deal1', periodId: 'p1', version: 1, bestCaseState: 'submitted', commitState: 'submitted', commitForecast: 200
      });
      prisma.forecastSubmission.create.mockResolvedValue({ id: 'sub2', bestCaseState: 'approved', commitState: 'approved', approvedCommit: 200 });
      prisma.crmDeal.findUnique.mockResolvedValue({});
      prisma.forecastUser.findFirst.mockResolvedValue({});
      
      jest.spyOn(service, 'logActivity').mockResolvedValue();
      const syncSpy = jest.spyOn(service, 'syncManualForecast').mockResolvedValue();
      const notifySpy = jest.spyOn(service, 'createNotification').mockResolvedValue();
      
      await service.approveSubmission('sub1', 'mgr1', 'both');
      expect(prisma.forecastSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ bestCaseState: 'approved', commitState: 'approved', approvedCommit: 200 })
      }));
      expect(syncSpy).toHaveBeenCalledWith('rep1', 'deal1', 'p1', 200);
      expect(notifySpy).toHaveBeenCalled();
    });

    it('B1e. reopenSubmission - should set both to reopened', async () => {
      prisma.forecastSubmission.findUnique.mockResolvedValue({ id: 'sub1', version: 1 });
      prisma.forecastSubmission.create.mockResolvedValue({ id: 'sub2', bestCaseState: 'reopened', commitState: 'reopened' });
      prisma.crmDeal.findUnique.mockResolvedValue({});
      prisma.forecastUser.findFirst.mockResolvedValue({});

      jest.spyOn(service, 'logActivity').mockResolvedValue();
      jest.spyOn(service, 'createNotification').mockResolvedValue();
      
      await service.reopenSubmission('sub1', 'mgr1');
      expect(prisma.forecastSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ bestCaseState: 'reopened', commitState: 'reopened' })
      }));
    });

    it('B1f. overrideSubmission - should set states to overridden and update manual forecast', async () => {
      prisma.forecastSubmission.findUnique.mockResolvedValue({ id: 'sub1', repUserId: 'rep1', dealId: 'deal1', periodId: 'p1', version: 1 });
      prisma.forecastSubmission.create.mockResolvedValue({ id: 'sub2', bestCaseState: 'overridden', commitState: 'editable' });
      prisma.crmDeal.findUnique.mockResolvedValue({});
      prisma.forecastUser.findFirst.mockResolvedValue({});

      jest.spyOn(service, 'logActivity').mockResolvedValue();
      jest.spyOn(service, 'createNotification').mockResolvedValue();
      const syncSpy = jest.spyOn(service, 'syncManualForecast').mockResolvedValue();
      
      await service.overrideSubmission('sub1', 'mgr1', 'best_case', 500);
      expect(prisma.forecastSubmission.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ bestCaseState: 'overridden', approvedBestCase: 500 })
      }));
    });
  });

  describe('B2. Notifications', () => {
    it('B2a. getNotifications - should fetch unseen notifications', async () => {
      prisma.forecastNotification.findMany.mockResolvedValue([{ id: 'not1', actionType: 'approved', createdAt: new Date() }]);
      const res = await service.getNotifications('rep1');
      expect(prisma.forecastNotification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { repId: 'rep1', isSeen: false } }));
      expect(res[0].action_type).toBe('approved');
    });

    it('B2b. markNotificationSeen - should update isSeen to true', async () => {
      await service.markNotificationSeen('not1');
      expect(prisma.forecastNotification.update).toHaveBeenCalledWith({ where: { id: 'not1' }, data: { isSeen: true } });
    });
  });

  describe('B3. Activity Log', () => {
    it('B3a. getSubmissionActivity - should map audit log properties correctly', async () => {
      prisma.forecastAuditLog.findMany.mockResolvedValue([{ id: 'log1', action: 'submitted', createdAt: new Date(), actorName: 'John', metadata: { notes: 'test note' } }]);
      const res = await service.getSubmissionActivity('sub1');
      expect(res[0]).toEqual(expect.objectContaining({ status: 'submitted', performed_by_name: 'John', notes: 'test note' }));
    });
  });

  describe('B5. Targets', () => {
    it('B5b. assignTargets - should upsert quotas', async () => {
      await service.assignTargets('p1', 'mgr1', [{ rep_id: 'rep1', target_value: 1000 }]);
      expect(prisma.quota.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.anything(),
        create: expect.objectContaining({ amount: 1000 }),
        update: expect.objectContaining({ amount: 1000 })
      }));
    });
  });

  describe('B7. Closed Deals', () => {
    it('B7a. getClosedDealsTotal - should sum won deals', async () => {
      prisma.forecastPeriod.findUnique.mockResolvedValue({ id: 'p1', startDate: new Date(), endDate: new Date() });
      prisma.crmDeal.findMany.mockResolvedValue([{ amount: 500 }, { amount: 300 }]);
      const res = await service.getClosedDealsTotal('rep1', 'p1');
      expect(res.total_closed_value).toBe(800);
    });
  });

  describe('B8. Pipeline', () => {
    it('B8a. getPipelineTotal - should query with dealId = "" for aggregate', async () => {
      prisma.pipelineValuesCache.findUnique.mockResolvedValue({ pipelineValue: 1000 });
      const res = await service.getPipelineTotal('rep1', 'p1');
      expect(prisma.pipelineValuesCache.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ tenantid_periodId_repId_dealId: expect.objectContaining({ dealId: '00000000-0000-0000-0000-000000000000' }) })
      }));
      expect(res.pipeline_value).toBe(1000);
    });
  });

  describe('B10. Drill-Down Views', () => {
    it('B10b. getRepDrilldownSummary - should aggregate all 4 buckets properly', async () => {
      jest.spyOn(service, 'getRepDrilldown').mockResolvedValue([
        { pipeline_value: 100, approved_best_case: 50, approved_commit: null, commit_value: 20, closed_value: 0 } as any,
        { pipeline_value: 200, approved_best_case: null, best_case_value: 30, approved_commit: 40, closed_value: 50 } as any
      ]);
      const res = await service.getRepDrilldownSummary('rep1', 'p1');
      expect(res).toEqual({
        pipeline_total: 300,
        best_case_total: 80, // 50 + 30
        commit_total: 60,    // 20 + 40
        closed_won_total: 50
      });
    });
    
    it('B10c. getManagerBoard - should calculate target progress pct', async () => {
      prisma.forecastUser.findMany.mockResolvedValue([{ id: 'rep1', name: 'Rep 1' }]);
      prisma.quota.findFirst.mockResolvedValue({ amount: 100 });
      jest.spyOn(service, 'getRepDrilldownSummary').mockResolvedValue({ closed_won_total: 20, commit_total: 30 } as any);
      jest.spyOn(service, 'getAiPredictionScores').mockResolvedValue([]);
      jest.spyOn(service, 'getRepDrilldown').mockResolvedValue([]);
      
      const res = await service.getManagerBoard('mgr1', 'p1');
      // progress = (20 + 30) / 100 = 50%
      expect(res[0].target_progress_pct).toBe(50);
    });
  });
});
