import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../database/data-source';
import * as XLSX from 'xlsx';
import {
  Deal,
  DealStage,
  ForecastCategory,
  DealBoard,
  BoardAudience,
  BoardStatus,
  BoardPermission,
  PermissionRole,
  PermissionSubjectType,
  DealActivity,
  ActivityType,
  User,
} from '../entities';
import { UserRole } from '../interfaces/user-role.enum';

const excelPath = process.env.EXCEL_PATH || 'C:\\Users\\Relanto\\Downloads\\deal_intelligence_dataset_cleaned.xlsx';

const stageMap: Record<string, DealStage> = {
  Prospecting: DealStage.PROSPECTING,
  Qualification: DealStage.QUALIFICATION,
  'Needs Analysis': DealStage.NEEDS_ANALYSIS,
  Proposal: DealStage.PROPOSAL,
  Negotiation: DealStage.NEGOTIATION,
  'Closed Won': DealStage.CLOSED_WON,
  'Closed Lost': DealStage.CLOSED_LOST,
};

const activityTypeMap: Record<string, ActivityType> = {
  Call: ActivityType.CALL,
  Email: ActivityType.EMAIL,
  Meeting: ActivityType.MEETING,
  Note: ActivityType.NOTE,
  Task: ActivityType.TASK,
  'Proposal Sent': ActivityType.EMAIL,
  Demo: ActivityType.MEETING,
  'Follow-up': ActivityType.CALL,
};

function getDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function importData() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    console.log(`Reading Excel file: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    const dealsSheet = workbook.Sheets.Deals;
    const activitiesSheet = workbook.Sheets.Activities;

    if (!dealsSheet) {
      throw new Error('Excel workbook does not contain a Deals sheet');
    }

    const dealsData = XLSX.utils.sheet_to_json(dealsSheet) as any[];
    const activitiesData = activitiesSheet ? (XLSX.utils.sheet_to_json(activitiesSheet) as any[]) : [];

    console.log(`Found ${dealsData.length} deals`);
    console.log(`Found ${activitiesData.length} activities`);

    const dealRepo = dataSource.getRepository(Deal);
    const boardRepo = dataSource.getRepository(DealBoard);
    const permissionRepo = dataSource.getRepository(BoardPermission);
    const activityRepo = dataSource.getRepository(DealActivity);
    const userRepo = dataSource.getRepository(User);

    const adminUser = await userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.ADMIN })
      .getOne();

    if (!adminUser) {
      throw new Error('No admin user found. Run npm run seed:run first.');
    }

    console.log('Creating or updating boards...');
    const boards = [
      {
        name: 'Q2 2024 Pipeline',
        description: 'Active deals for Q2 2024',
        audience: [BoardAudience.AE, BoardAudience.MANAGER],
        status: BoardStatus.PUBLISHED,
        ownerId: adminUser.id,
        publishedAt: new Date(),
      },
      {
        name: 'High Value Deals',
        description: 'Deals over 500K INR',
        audience: [BoardAudience.MANAGER, BoardAudience.EXEC],
        status: BoardStatus.PUBLISHED,
        ownerId: adminUser.id,
        publishedAt: new Date(),
      },
      {
        name: 'At Risk Deals',
        description: 'Deals requiring attention',
        audience: [BoardAudience.MANAGER],
        status: BoardStatus.PUBLISHED,
        ownerId: adminUser.id,
        publishedAt: new Date(),
      },
    ];

    for (const boardData of boards) {
      const existingBoard = await boardRepo.findOne({ where: { name: boardData.name } });
      const board = await boardRepo.save(boardRepo.create({ ...existingBoard, ...boardData }));
      const existingPermission = await permissionRepo.findOne({
        where: {
          boardId: board.id,
          subjectType: PermissionSubjectType.USER,
          subjectId: adminUser.id,
        },
      });

      if (!existingPermission) {
        await permissionRepo.save(
          permissionRepo.create({
          boardId: board.id,
          subjectType: PermissionSubjectType.USER,
          subjectId: adminUser.id,
          role: PermissionRole.ADMIN,
          grantedBy: adminUser.id,
          }),
        );
      }

      console.log(`Ready board: ${board.name}`);
    }

    console.log('Importing deals...');
    let dealCount = 0;

    for (const row of dealsData) {
      try {
        const stage = stageMap[row['Crm Stage']] || DealStage.QUALIFICATION;
        const probability = parseInt(row['Probability Pct'], 10) || 0;
        const totalCalls = parseInt(row['Total Calls'], 10) || 0;
        const totalEmails = parseInt(row['Total Emails'], 10) || 0;
        const totalMeetings = parseInt(row['Total Meetings'], 10) || 0;

        let forecastCategory = ForecastCategory.PIPELINE;
        if (stage === DealStage.CLOSED_WON) forecastCategory = ForecastCategory.CLOSED;
        else if (probability >= 80) forecastCategory = ForecastCategory.COMMIT;
        else if (probability >= 60) forecastCategory = ForecastCategory.BEST_CASE;

        const crmDealId = String(row['Deal Id']);
        const dealName = String(row['Deal Name'] || row['Deal Id']);
        const existingDeal = await dealRepo.findOne({
          where: [{ crmDealId }, { name: dealName }],
        });
        const deal = existingDeal || new Deal();
        deal.crmDealId = existingDeal?.crmDealId || crmDealId;
        deal.name = dealName;
        deal.stage = stage;
        deal.amount = parseFloat(row['Deal Value Inr']) || 0;
        deal.forecastCategory = forecastCategory;
        deal.ownerId = adminUser.id;
        deal.ownerName = row['Deal Owner'] || 'Unknown';
        deal.accountName = row['Account Name'] || null;
        deal.closeDate = getDate(row['Estimated Close Date']) as any;
        deal.probability = probability;
        deal.aiScore = parseInt(row['Ai Risk Score'], 10) || 0;
        deal.contactCount = parseInt(row['No Of Contacts'], 10) || 0;
        deal.activityStrength = Math.min(100, (totalCalls + totalEmails + totalMeetings) * 2);
        deal.isHighRisk = row['Health Status'] === 'At Risk' || (parseFloat(row['Ai Risk Score']) || 0) > 50;
        deal.riskReason = deal.isHighRisk ? 'High AI risk score' : null as any;
        deal.nextStep = row['Next Step'] || null;
        deal.lastActivityAt = getDate(row['Last Activity Date']) as any;
        deal.crmData = {
          datasetDealId: crmDealId,
          industry: row.Industry,
          region: row.Region,
          dealSource: row['Deal Source'],
          primaryProduct: row['Primary Product'],
          decisionMakerEngaged: row['Decision Maker Engaged'],
          budgetConfirmed: row['Budget Confirmed'],
          competitor1: row['Competitor 1'],
          competitor2: row['Competitor 2'],
          totalCalls,
          totalEmails,
          totalMeetings,
          lastCallSentiment: row['Last Call Sentiment'],
          aiRiskScore: row['Ai Risk Score'],
        };

        await dealRepo.save(deal);
        dealCount++;

        if (dealCount % 500 === 0) {
          console.log(`Imported ${dealCount} deals...`);
        }
      } catch (error) {
        console.error(`Error importing deal ${row['Deal Id']}:`, (error as Error).message);
      }
    }

    console.log(`Imported ${dealCount} deals`);

    console.log('Importing activities...');
    const importedDealIds = new Set(dealsData.map((deal) => String(deal['Deal Id'])));
    const activitiesToImport = activitiesData
      .filter((activity) => importedDealIds.has(String(activity['Deal Id'])));
    let activityCount = 0;
    let activityUpdatedCount = 0;

    for (const row of activitiesToImport) {
      try {
        const datasetDealId = String(row['Deal Id']);
        const datasetDeal = dealsData.find((dealRow) => String(dealRow['Deal Id']) === datasetDealId);
        const dealName = datasetDeal ? String(datasetDeal['Deal Name'] || datasetDealId) : datasetDealId;
        const deal = await dealRepo.findOne({
          where: [{ crmDealId: datasetDealId }, { name: dealName }],
        });
        if (!deal) continue;
        const existingActivity = await activityRepo.findOne({
          where: { crmActivityId: String(row['Activity Id']) },
        });
        const activity = existingActivity || new DealActivity();
        activity.dealId = deal.id;
        activity.crmActivityId = String(row['Activity Id']);
        activity.type = activityTypeMap[row['Activity Type']] || ActivityType.NOTE;
        activity.subject = row.Subject || row['Activity Type'] || null;
        activity.summary =
          row.Summary ||
          row.Notes ||
          `${row['Activity Type']} - ${row.Sentiment || 'Neutral'} sentiment`;
        activity.activityDate = getDate(row['Activity Date']) || new Date();
        activity.durationMinutes = parseInt(row['Duration Min'], 10) || null as any;
        activity.contactName = row['Contact Name'] || row.Contact || row.Owner || null;
        activity.crmData = {
          datasetDealId: String(row['Deal Id']),
          activityType: row['Activity Type'],
          sentiment: row.Sentiment,
          owner: row.Owner,
          channel: row.Channel,
          direction: row.Direction,
          outcome: row.Outcome,
          nextStep: row['Next Step'],
          raw: row,
        };

        await activityRepo.save(activity);
        if (existingActivity) {
          activityUpdatedCount++;
        } else {
          activityCount++;
        }

        if ((activityCount + activityUpdatedCount) % 500 === 0) {
          console.log(`Imported/updated ${activityCount + activityUpdatedCount} activities...`);
        }
      } catch (error) {
        console.error(`Error importing activity ${row['Activity Id']}:`, (error as Error).message);
      }
    }

    console.log('Data import completed successfully');
    console.log(`Boards: ${boards.length}`);
    console.log(`Deals: ${dealCount}`);
    console.log(`Activities created: ${activityCount}`);
    console.log(`Activities updated: ${activityUpdatedCount}`);

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

importData();
