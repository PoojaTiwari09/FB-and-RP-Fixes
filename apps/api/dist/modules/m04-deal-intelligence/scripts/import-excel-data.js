"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const data_source_1 = require("../database/data-source");
const XLSX = __importStar(require("xlsx"));
const entities_1 = require("../entities");
const user_role_enum_1 = require("../interfaces/user-role.enum");
const excelPath = process.env.EXCEL_PATH || 'C:\\Users\\Relanto\\Downloads\\deal_intelligence_dataset_cleaned.xlsx';
const stageMap = {
    Prospecting: entities_1.DealStage.PROSPECTING,
    Qualification: entities_1.DealStage.QUALIFICATION,
    'Needs Analysis': entities_1.DealStage.NEEDS_ANALYSIS,
    Proposal: entities_1.DealStage.PROPOSAL,
    Negotiation: entities_1.DealStage.NEGOTIATION,
    'Closed Won': entities_1.DealStage.CLOSED_WON,
    'Closed Lost': entities_1.DealStage.CLOSED_LOST,
};
const activityTypeMap = {
    Call: entities_1.ActivityType.CALL,
    Email: entities_1.ActivityType.EMAIL,
    Meeting: entities_1.ActivityType.MEETING,
    Note: entities_1.ActivityType.NOTE,
    Task: entities_1.ActivityType.TASK,
    'Proposal Sent': entities_1.ActivityType.EMAIL,
    Demo: entities_1.ActivityType.MEETING,
    'Follow-up': entities_1.ActivityType.CALL,
};
function getDate(value) {
    if (!value)
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
async function importData() {
    const dataSource = new typeorm_1.DataSource(data_source_1.dataSourceOptions);
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
        const dealsData = XLSX.utils.sheet_to_json(dealsSheet);
        const activitiesData = activitiesSheet ? XLSX.utils.sheet_to_json(activitiesSheet) : [];
        console.log(`Found ${dealsData.length} deals`);
        console.log(`Found ${activitiesData.length} activities`);
        const dealRepo = dataSource.getRepository(entities_1.Deal);
        const boardRepo = dataSource.getRepository(entities_1.DealBoard);
        const permissionRepo = dataSource.getRepository(entities_1.BoardPermission);
        const activityRepo = dataSource.getRepository(entities_1.DealActivity);
        const userRepo = dataSource.getRepository(entities_1.User);
        const adminUser = await userRepo
            .createQueryBuilder('user')
            .where('user.role = :role', { role: user_role_enum_1.UserRole.ADMIN })
            .getOne();
        if (!adminUser) {
            throw new Error('No admin user found. Run npm run seed:run first.');
        }
        console.log('Creating or updating boards...');
        const boards = [
            {
                name: 'Q2 2024 Pipeline',
                description: 'Active deals for Q2 2024',
                audience: [entities_1.BoardAudience.AE, entities_1.BoardAudience.MANAGER],
                status: entities_1.BoardStatus.PUBLISHED,
                ownerId: adminUser.id,
                publishedAt: new Date(),
            },
            {
                name: 'High Value Deals',
                description: 'Deals over 500K INR',
                audience: [entities_1.BoardAudience.MANAGER, entities_1.BoardAudience.EXEC],
                status: entities_1.BoardStatus.PUBLISHED,
                ownerId: adminUser.id,
                publishedAt: new Date(),
            },
            {
                name: 'At Risk Deals',
                description: 'Deals requiring attention',
                audience: [entities_1.BoardAudience.MANAGER],
                status: entities_1.BoardStatus.PUBLISHED,
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
                    subjectType: entities_1.PermissionSubjectType.USER,
                    subjectId: adminUser.id,
                },
            });
            if (!existingPermission) {
                await permissionRepo.save(permissionRepo.create({
                    boardId: board.id,
                    subjectType: entities_1.PermissionSubjectType.USER,
                    subjectId: adminUser.id,
                    role: entities_1.PermissionRole.ADMIN,
                    grantedBy: adminUser.id,
                }));
            }
            console.log(`Ready board: ${board.name}`);
        }
        console.log('Importing deals...');
        let dealCount = 0;
        for (const row of dealsData) {
            try {
                const stage = stageMap[row['Crm Stage']] || entities_1.DealStage.QUALIFICATION;
                const probability = parseInt(row['Probability Pct'], 10) || 0;
                const totalCalls = parseInt(row['Total Calls'], 10) || 0;
                const totalEmails = parseInt(row['Total Emails'], 10) || 0;
                const totalMeetings = parseInt(row['Total Meetings'], 10) || 0;
                let forecastCategory = entities_1.ForecastCategory.PIPELINE;
                if (stage === entities_1.DealStage.CLOSED_WON)
                    forecastCategory = entities_1.ForecastCategory.CLOSED;
                else if (probability >= 80)
                    forecastCategory = entities_1.ForecastCategory.COMMIT;
                else if (probability >= 60)
                    forecastCategory = entities_1.ForecastCategory.BEST_CASE;
                const crmDealId = String(row['Deal Id']);
                const dealName = String(row['Deal Name'] || row['Deal Id']);
                const existingDeal = await dealRepo.findOne({
                    where: [{ crmDealId }, { name: dealName }],
                });
                const deal = existingDeal || new entities_1.Deal();
                deal.crmDealId = existingDeal?.crmDealId || crmDealId;
                deal.name = dealName;
                deal.stage = stage;
                deal.amount = parseFloat(row['Deal Value Inr']) || 0;
                deal.forecastCategory = forecastCategory;
                deal.ownerId = adminUser.id;
                deal.ownerName = row['Deal Owner'] || 'Unknown';
                deal.accountName = row['Account Name'] || null;
                deal.closeDate = getDate(row['Estimated Close Date']);
                deal.probability = probability;
                deal.aiScore = parseInt(row['Ai Risk Score'], 10) || 0;
                deal.contactCount = parseInt(row['No Of Contacts'], 10) || 0;
                deal.activityStrength = Math.min(100, (totalCalls + totalEmails + totalMeetings) * 2);
                deal.isHighRisk = row['Health Status'] === 'At Risk' || (parseFloat(row['Ai Risk Score']) || 0) > 50;
                deal.riskReason = deal.isHighRisk ? 'High AI risk score' : null;
                deal.nextStep = row['Next Step'] || null;
                deal.lastActivityAt = getDate(row['Last Activity Date']);
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
            }
            catch (error) {
                console.error(`Error importing deal ${row['Deal Id']}:`, error.message);
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
                if (!deal)
                    continue;
                const existingActivity = await activityRepo.findOne({
                    where: { crmActivityId: String(row['Activity Id']) },
                });
                const activity = existingActivity || new entities_1.DealActivity();
                activity.dealId = deal.id;
                activity.crmActivityId = String(row['Activity Id']);
                activity.type = activityTypeMap[row['Activity Type']] || entities_1.ActivityType.NOTE;
                activity.subject = row.Subject || row['Activity Type'] || null;
                activity.summary =
                    row.Summary ||
                        row.Notes ||
                        `${row['Activity Type']} - ${row.Sentiment || 'Neutral'} sentiment`;
                activity.activityDate = getDate(row['Activity Date']) || new Date();
                activity.durationMinutes = parseInt(row['Duration Min'], 10) || null;
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
                }
                else {
                    activityCount++;
                }
                if ((activityCount + activityUpdatedCount) % 500 === 0) {
                    console.log(`Imported/updated ${activityCount + activityUpdatedCount} activities...`);
                }
            }
            catch (error) {
                console.error(`Error importing activity ${row['Activity Id']}:`, error.message);
            }
        }
        console.log('Data import completed successfully');
        console.log(`Boards: ${boards.length}`);
        console.log(`Deals: ${dealCount}`);
        console.log(`Activities created: ${activityCount}`);
        console.log(`Activities updated: ${activityUpdatedCount}`);
        await dataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('Error:', error);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
importData();
//# sourceMappingURL=import-excel-data.js.map