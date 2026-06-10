import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('--- Seeding M04 Deal Boards & Details ---');

  // Seed Manager Deals (1 to 9)
  const managerDeals = [
    {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'StartupX - Growth Plan',
      ownerName: 'David Park',
      ownerEmail: 'david.park@company.com',
      stage: 'Qualification',
      forecastCategory: 'Open',
      amount: 45000,
      aiScore: 58,
      meddpiccScore: 29,
      warningsCount: 2,
      pipeline: 'board-1',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      name: 'TechStart - Annual Subscription',
      ownerName: 'Michael Rodriguez',
      ownerEmail: 'michael.rod@company.com',
      stage: 'Proposal',
      forecastCategory: 'Best Case',
      amount: 75000,
      aiScore: 62,
      meddpiccScore: 57,
      warningsCount: 2,
      pipeline: 'board-1',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      name: 'MidMarket Co - Standard Package',
      ownerName: 'Sarah Chen',
      ownerEmail: 'sarah.chen@company.com',
      stage: 'Discovery',
      forecastCategory: 'Most Likely',
      amount: 60000,
      aiScore: 72,
      meddpiccScore: 43,
      warningsCount: 2,
      pipeline: 'board-1',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000014',
      name: 'Acme Corp - Enterprise Platform',
      ownerName: 'Sarah Chen',
      ownerEmail: 'sarah.chen@company.com',
      stage: 'Proposal',
      forecastCategory: 'Commit',
      amount: 250000,
      aiScore: 85,
      meddpiccScore: 86,
      warningsCount: 2,
      pipeline: 'board-1',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000015',
      name: 'Global Enterprises - Multi-Year Deal',
      ownerName: 'Jennifer Kim',
      ownerEmail: 'jennifer.kim@company.com',
      stage: 'Negotiation',
      forecastCategory: 'Commit',
      amount: 300000,
      aiScore: 91,
      meddpiccScore: 100,
      warningsCount: 1,
      pipeline: 'board-2',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000016',
      name: 'Enterprise Inc - Platform Upgrade',
      ownerName: 'Emily Thompson',
      ownerEmail: 'emily.thompson@company.com',
      stage: 'Closed Won',
      forecastCategory: 'Closed Won',
      amount: 220000,
      aiScore: 95,
      meddpiccScore: 100,
      warningsCount: 1,
      pipeline: 'board-2',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000017',
      name: 'BluePeak Retail - Regional Rollout',
      ownerName: 'David Park',
      ownerEmail: 'david.park@company.com',
      stage: 'Discovery',
      forecastCategory: 'Open',
      amount: 65000,
      aiScore: 66,
      meddpiccScore: 34,
      warningsCount: 1,
      pipeline: 'board-3',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000018',
      name: 'Northwind Health - Analytics Suite',
      ownerName: 'Michael Rodriguez',
      ownerEmail: 'michael.rod@company.com',
      stage: 'Proposal',
      forecastCategory: 'Most Likely',
      amount: 115000,
      aiScore: 78,
      meddpiccScore: 67,
      warningsCount: 1,
      pipeline: 'board-2',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000019',
      name: 'Orbit Fintech - Renewal Expansion',
      ownerName: 'David Park',
      ownerEmail: 'david.park@company.com',
      stage: 'Closed Lost',
      forecastCategory: 'Closed Lost',
      amount: 30000,
      aiScore: 41,
      meddpiccScore: 24,
      warningsCount: 2,
      pipeline: 'board-1',
      quarter: '2026-Q2',
    },
  ];

  for (const dealData of managerDeals) {
    await prisma.deal.upsert({
      where: { id: dealData.id },
      update: {
        ...dealData,
        ownerId: dealData.ownerName === 'David Park' ? 'david' : dealData.ownerName === 'Sarah Chen' ? 'sarah' : dealData.ownerName === 'Michael Rodriguez' ? 'michael' : dealData.ownerName === 'Jennifer Kim' ? 'jennifer' : dealData.ownerName === 'Emily Thompson' ? 'emily' : 'me',
      },
      create: {
        tenantid: TENANT_ID,
        ...dealData,
        ownerId: dealData.ownerName === 'David Park' ? 'david' : dealData.ownerName === 'Sarah Chen' ? 'sarah' : dealData.ownerName === 'Michael Rodriguez' ? 'michael' : dealData.ownerName === 'Jennifer Kim' ? 'jennifer' : dealData.ownerName === 'Emily Thompson' ? 'emily' : 'me',
      },
    });
  }

  // Seed Rep Deals (deal-1 to deal-8)
  const repDeals = [
    {
      id: '00000000-0000-0000-0000-000000000021',
      name: 'Acme Corp - Enterprise Platform',
      ownerName: 'Lakshmi Prasanna Dara',
      ownerEmail: 'lakshmi@company.com',
      stage: 'Proposal',
      forecastCategory: 'Commit',
      amount: 250000,
      aiScore: 85,
      meddpiccScore: 67,
      warningsCount: 1,
      pipeline: 'board-1',
      escalated: true,
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000022',
      name: 'TechStart Inc - Growth Package',
      ownerName: 'Lakshmi Prasanna Dara',
      ownerEmail: 'lakshmi@company.com',
      stage: 'Negotiation',
      forecastCategory: 'Commit',
      amount: 85000,
      aiScore: 95,
      meddpiccScore: 95,
      warningsCount: 0,
      pipeline: 'board-1',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000023',
      name: 'Global Solutions - Multi-Year Deal',
      ownerName: 'Lakshmi Prasanna Dara',
      ownerEmail: 'lakshmi@company.com',
      stage: 'Discovery',
      forecastCategory: 'Pipeline',
      amount: 500000,
      aiScore: 33,
      meddpiccScore: 33,
      warningsCount: 2,
      pipeline: 'board-1',
      escalated: true,
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000024',
      name: 'NextGen Enterprises - Pilot',
      ownerName: 'Lakshmi Prasanna Dara',
      ownerEmail: 'lakshmi@company.com',
      stage: 'Qualification',
      forecastCategory: 'Pipeline',
      amount: 45000,
      aiScore: 50,
      meddpiccScore: 50,
      warningsCount: 1,
      pipeline: 'board-1',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000025',
      name: 'MegaCorp - Cloud Migration',
      ownerName: 'Revenue Intelligence Demo',
      ownerEmail: 'demo@company.com',
      stage: 'Proposal',
      forecastCategory: 'Best Case',
      amount: 420000,
      aiScore: 72,
      meddpiccScore: 72,
      warningsCount: 1,
      pipeline: 'board-2',
      escalated: true,
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000026',
      name: 'Horizon Labs - Analytics Suite',
      ownerName: 'Revenue Intelligence Demo',
      ownerEmail: 'demo@company.com',
      stage: 'Negotiation',
      forecastCategory: 'Commit',
      amount: 195000,
      aiScore: 88,
      meddpiccScore: 88,
      warningsCount: 0,
      pipeline: 'board-2',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000027',
      name: 'Pinnacle Group - Security Platform',
      ownerName: 'Revenue Intelligence Demo',
      ownerEmail: 'demo@company.com',
      stage: 'Discovery',
      forecastCategory: 'Pipeline',
      amount: 310000,
      aiScore: 40,
      meddpiccScore: 40,
      warningsCount: 1,
      pipeline: 'board-3',
      quarter: '2026-Q2',
    },
    {
      id: '00000000-0000-0000-0000-000000000028',
      name: 'Vertex Capital - Enterprise Suite',
      ownerName: 'Lakshmi Prasanna Dara',
      ownerEmail: 'lakshmi@company.com',
      stage: 'Proposal',
      forecastCategory: 'Most Likely',
      amount: 850000,
      aiScore: 78,
      meddpiccScore: 78,
      warningsCount: 1,
      pipeline: 'board-4',
      escalated: true,
      quarter: '2026-Q2',
    },
  ];

  for (const dealData of repDeals) {
    await prisma.deal.upsert({
      where: { id: dealData.id },
      update: dealData,
      create: {
        tenantid: TENANT_ID,
        ...dealData,
      },
    });
  }

  // Seed warnings
  console.log('Seeding warnings...');
  const warnings = [
    {
      dealId: '00000000-0000-0000-0000-000000000021',
      severity: 'HIGH',
      title: 'Decision maker not engaged',
      description: 'CFO has not appeared on any recorded interaction. Only John (Manager) engaged.',
      suggestedAction: 'Request introduction to CFO through champion',
    },
    {
      dealId: '00000000-0000-0000-0000-000000000021',
      severity: 'HIGH',
      title: 'Close date in the past',
      description: 'CRM close date was Apr 28. Deal is still open. Update or escalate.',
      suggestedAction: 'Update close date or escalate to manager',
    },
    {
      dealId: '00000000-0000-0000-0000-000000000023',
      severity: 'HIGH',
      title: 'Primary contact changed',
      description: 'Jane Lee moved to a different division. No replacement assigned in CRM.',
      suggestedAction: 'Identify and reach out to new primary contact',
    },
    {
      dealId: '00000000-0000-0000-0000-000000000023',
      severity: 'MEDIUM',
      title: 'No executive sponsor',
      description: 'No VP or C-suite contact recorded for a $500K deal.',
      suggestedAction: 'Request exec sponsor introduction from champion',
    },
    {
      dealId: '00000000-0000-0000-0000-000000000024',
      severity: 'MEDIUM',
      title: 'No economic buyer identified',
      description: 'Deal is in Qualification. Economic buyer field is empty in CRM.',
      suggestedAction: 'Ask champion to identify budget owner',
    },
    {
      dealId: '00000000-0000-0000-0000-000000000025',
      severity: 'MEDIUM',
      title: 'Competing vendor identified',
      description: 'Procurement mentioned shortlisting two vendors. Competitor not named.',
      suggestedAction: 'Request competitive differentiation meeting with champion',
    },
  ];

  await prisma.dealWarning.deleteMany({
    where: { dealId: { in: ['00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000028'] } },
  });

  for (const w of warnings) {
    await prisma.dealWarning.create({
      data: {
        tenantid: TENANT_ID,
        dealId: w.dealId,
        severity: w.severity,
        title: w.title,
        description: w.description,
        suggestedAction: w.suggestedAction,
        status: 'active',
      },
    });
  }

  // Seed Playbook Criteria
  console.log('Seeding playbook criteria...');
  const playbookCriteria = [
    // deal-1
    { dealId: '00000000-0000-0000-0000-000000000021', criterionName: 'METRICS', question: 'What are the quantifiable business metrics driving this purchase?', status: 'Completed', notes: 'Increase sales productivity by 30%, reduce sales cycle by 2 weeks' },
    { dealId: '00000000-0000-0000-0000-000000000021', criterionName: 'ECONOMIC BUYER', question: 'Who has budget authority and final approval?', status: 'Pending', notes: 'Robert Davis (CFO) - meeting scheduled', aiSuggestedNote: 'Confirm budget amount and approval timeline in upcoming CFO meeting' },
    { dealId: '00000000-0000-0000-0000-000000000021', criterionName: 'DECISION CRITERIA', question: 'What are the formal decision criteria?', status: 'Completed', notes: 'Ease of use, integration with HubSpot, pricing, implementation timeline' },
    { dealId: '00000000-0000-0000-0000-000000000021', criterionName: 'DECISION PROCESS', question: 'What is the formal decision-making process?', status: 'Completed', notes: 'Technical eval → Budget approval → Legal review → Final decision' },
    { dealId: '00000000-0000-0000-0000-000000000021', criterionName: 'IDENTIFY PAIN', question: 'What is the compelling event or pain?', status: 'Completed', notes: 'Current CRM causing low adoption rates, losing deals due to poor tracking' },
    { dealId: '00000000-0000-0000-0000-000000000021', criterionName: 'CHAMPION', question: 'Who is your internal champion and how influential are they?', status: 'Pending', notes: 'Sarah (VP Sales) - strong advocate but limited exec influence', aiSuggestedNote: 'Validate champion\'s access to CFO before next meeting' },

    // deal-2
    { dealId: '00000000-0000-0000-0000-000000000022', criterionName: 'METRICS', question: 'What are the quantifiable business metrics driving this purchase?', status: 'Completed', notes: '15% reduction in churn, 20% increase in upsell revenue' },
    { dealId: '00000000-0000-0000-0000-000000000022', criterionName: 'ECONOMIC BUYER', question: 'Who has budget authority and final approval?', status: 'Completed', notes: 'Mark Chen (CTO) — confirmed on May 18 call' },
    { dealId: '00000000-0000-0000-0000-000000000022', criterionName: 'DECISION CRITERIA', question: 'What are the formal decision criteria?', status: 'Completed', notes: 'API reliability, onboarding speed, pricing flexibility' },
    { dealId: '00000000-0000-0000-0000-000000000022', criterionName: 'DECISION PROCESS', question: 'What is the formal decision-making process?', status: 'Completed', notes: 'Legal review → Sign-off by CTO → PO issued' },
    { dealId: '00000000-0000-0000-0000-000000000022', criterionName: 'IDENTIFY PAIN', question: 'What is the compelling event or pain?', status: 'Completed', notes: 'Current tool contract expires Jun 30. Must switch before renewal.' },
    { dealId: '00000000-0000-0000-0000-000000000022', criterionName: 'CHAMPION', question: 'Who is your internal champion and how influential are they?', status: 'Completed', notes: 'Lisa Park (Head of RevOps) — full authority to push deal through' },

    // deal-3
    { dealId: '00000000-0000-0000-0000-000000000023', criterionName: 'METRICS', question: 'What are the quantifiable business metrics driving this purchase?', status: 'Completed', notes: 'Reduce manual reporting time by 40%' },
    { dealId: '00000000-0000-0000-0000-000000000023', criterionName: 'ECONOMIC BUYER', question: 'Who has budget authority and final approval?', status: 'Pending', notes: 'Unknown — contact change disrupted access', aiSuggestedNote: 'Re-identify economic buyer after contact reassignment' },
    { dealId: '00000000-0000-0000-0000-000000000023', criterionName: 'DECISION CRITERIA', question: 'What are the formal decision criteria?', status: 'Pending', notes: 'Not fully defined yet', aiSuggestedNote: 'Ask new contact to share evaluation criteria checklist' },
    { dealId: '00000000-0000-0000-0000-000000000023', criterionName: 'DECISION PROCESS', question: 'What is the formal decision-making process?', status: 'Pending', notes: 'Unknown', aiSuggestedNote: 'Map buying committee and approval chain with new contact' },
    { dealId: '00000000-0000-0000-0000-000000000023', criterionName: 'IDENTIFY PAIN', question: 'What is the compelling event or pain?', status: 'Completed', notes: 'Multi-site reporting is fully manual, causing weekly errors' },
    { dealId: '00000000-0000-0000-0000-000000000023', criterionName: 'CHAMPION', question: 'Who is your internal champion and how influential are they?', status: 'Pending', notes: 'Jane Lee — now in different division, no replacement identified', aiSuggestedNote: 'Identify new champion after contact change' },

    // deal-4
    { dealId: '00000000-0000-0000-0000-000000000024', criterionName: 'METRICS', question: 'What are the quantifiable business metrics driving this purchase?', status: 'Completed', notes: 'Reduce sales cycle by 20%, improve pipeline visibility' },
    { dealId: '00000000-0000-0000-0000-000000000024', criterionName: 'ECONOMIC BUYER', question: 'Who has budget authority and final approval?', status: 'Pending', notes: 'Not identified yet', aiSuggestedNote: 'Ask champion to introduce budget owner before next call' },
    { dealId: '00000000-0000-0000-0000-000000000024', criterionName: 'DECISION CRITERIA', question: 'What are the formal decision criteria?', status: 'Completed', notes: 'Ease of onboarding, CRM integrations, reporting dashboards' },
    { dealId: '00000000-0000-0000-0000-000000000024', criterionName: 'DECISION PROCESS', question: 'What is the formal decision-making process?', status: 'Completed', notes: 'IT review → VP approval → Procurement sign-off' },
    { dealId: '00000000-0000-0000-0000-000000000024', criterionName: 'IDENTIFY PAIN', question: 'What is the compelling event or pain?', status: 'Pending', notes: 'Stated general dissatisfaction — no compelling event confirmed' },
    { dealId: '00000000-0000-0000-0000-000000000024', criterionName: 'CHAMPION', question: 'Who is your internal champion and how influential are they?', status: 'Pending', notes: 'Tom (Sales Ops) — engaged but no budget authority', aiSuggestedNote: 'Multi-thread to VP and IT as agreed in last call' },
  ];

  await prisma.dealPlaybook.deleteMany({
    where: { dealId: { in: ['00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000024'] } },
  });

  for (const c of playbookCriteria) {
    await prisma.dealPlaybook.create({
      data: {
        tenantid: TENANT_ID,
        dealId: c.dealId,
        criterionName: c.criterionName,
        question: c.question,
        status: c.status,
        notes: c.notes,
        aiSuggestedNote: c.aiSuggestedNote,
      },
    });
  }

  // Seed Activity Events
  console.log('Seeding activity events...');
  const activities = [
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-05', type: 'Quick Update', duration: 10, direction: 'outbound', participants: ['John Smith'], notes: 'Sent pricing summary via email' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-08', type: 'Discovery Call', duration: 45, direction: 'outbound', participants: ['John Smith', 'Sarah (Champion)'], notes: 'Discussed integration requirements and timeline' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-10', type: 'Technical Demo', duration: 60, direction: 'outbound', participants: ['John Smith', 'Sarah (Champion)', 'IT Team'], notes: 'Full product demo — positive reception from IT' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-13', type: 'Follow-up Email', duration: 5, direction: 'outbound', participants: ['John Smith'], notes: 'Sent follow-up with proposal deck' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-14', type: 'Inbound Call', duration: 30, direction: 'inbound', participants: ['Sarah (Champion)', 'John Smith'], notes: 'Champion called with pricing questions' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-15', type: 'Email Reply', duration: 5, direction: 'inbound', participants: ['Sarah (Champion)'], notes: 'Requested revised proposal with multi-year option' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-15', type: 'Proposal Sent', duration: 10, direction: 'outbound', participants: ['John Smith'], notes: 'Sent multi-year proposal with 3-year discount' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-15', type: 'Inbound Email', duration: 5, direction: 'inbound', participants: ['Sarah (Champion)'], notes: 'Acknowledged receipt, escalating to CFO' },
    { dealId: '00000000-0000-0000-0000-000000000021', date: '2026-05-15', type: 'Internal Note', duration: 95, direction: 'outbound', participants: ['John Smith'], notes: 'CFO introduction expected next week' },

    { dealId: '00000000-0000-0000-0000-000000000022', date: '2026-05-18', type: 'Discovery Call', duration: 45, direction: 'outbound', participants: ['John Smith', 'Lisa Park'], notes: 'Confirmed technical requirements and timeline' },
    { dealId: '00000000-0000-0000-0000-000000000022', date: '2026-05-20', type: 'Contract Sent', duration: 10, direction: 'outbound', participants: ['John Smith'], notes: 'Sent MSA and order form for legal review' },
    { dealId: '00000000-0000-0000-0000-000000000022', date: '2026-05-22', type: 'Champion Call', duration: 30, direction: 'inbound', participants: ['Lisa Park', 'John Smith'], notes: 'Confirmed budget approval, awaiting legal sign-off' },
    { dealId: '00000000-0000-0000-0000-000000000022', date: '2026-05-22', type: 'Follow-up Email', duration: 5, direction: 'outbound', participants: ['John Smith'], notes: 'Sent revised order form with updated terms' },
    { dealId: '00000000-0000-0000-0000-000000000022', date: '2026-05-23', type: 'Inbound Email', duration: 10, direction: 'inbound', participants: ['Lisa Park'], notes: 'Legal has two minor redlines — will share by May 25' },
    { dealId: '00000000-0000-0000-0000-000000000022', date: '2026-05-25', type: 'Inbound Email', duration: 20, direction: 'inbound', participants: ['Lisa Park'], notes: 'Redlines received — minor, accepting both' },

    { dealId: '00000000-0000-0000-0000-000000000023', date: '2026-05-05', type: 'Intro Call', duration: 30, direction: 'outbound', participants: ['John Smith', 'Jane Lee'], notes: 'Initial discovery with primary contact' },
    { dealId: '00000000-0000-0000-0000-000000000023', date: '2026-05-10', type: 'Intro Call', duration: 20, direction: 'outbound', participants: ['John Smith', 'New Contact (TBD)'], notes: 'Intro call with replacement contact — limited context' },
    { dealId: '00000000-0000-0000-0000-000000000023', date: '2026-05-10', type: 'Inbound Email', duration: 10, direction: 'inbound', participants: ['New Contact (TBD)'], notes: 'Said they would review the deck and follow up' },
    { dealId: '00000000-0000-0000-0000-000000000023', date: '2026-05-12', type: 'Follow-up Email', duration: 5, direction: 'outbound', participants: ['John Smith'], notes: 'Sent follow-up — no response yet' },
    { dealId: '00000000-0000-0000-0000-000000000023', date: '2026-05-15', type: 'Inbound Email', duration: 15, direction: 'inbound', participants: ['New Contact (TBD)'], notes: 'Brief reply — contact still getting up to speed' },

    { dealId: '00000000-0000-0000-0000-000000000024', date: '2026-05-20', type: 'Intro Call', duration: 30, direction: 'outbound', participants: ['John Smith', 'Tom (Sales Ops)'], notes: 'Initial qualification call — strong interest from champion' },
    { dealId: '00000000-0000-0000-0000-000000000024', date: '2026-05-22', type: 'Inbound Email', duration: 5, direction: 'inbound', participants: ['Tom (Sales Ops)'], notes: 'Requested product overview deck' },
    { dealId: '00000000-0000-0000-0000-000000000024', date: '2026-05-23', type: 'Email Sent', duration: 10, direction: 'outbound', participants: ['John Smith'], notes: 'Sent product overview and pricing guide' },
    { dealId: '00000000-0000-0000-0000-000000000024', date: '2026-05-24', type: 'Email Exchange', duration: 10, direction: 'inbound', participants: ['Tom (Sales Ops)'], notes: 'Asked about IT integration support — replied same day' },
    { dealId: '00000000-0000-0000-0000-000000000024', date: '2026-05-24', type: 'Email Reply', duration: 10, direction: 'outbound', participants: ['John Smith'], notes: 'Confirmed IT integration details, proposed technical deep-dive' },
  ];

  await prisma.dealActivityEvent.deleteMany({
    where: { dealId: { in: ['00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000024'] } },
  });

  for (const a of activities) {
    await prisma.dealActivityEvent.create({
      data: {
        tenantid: TENANT_ID,
        dealId: a.dealId,
        date: a.date,
        type: a.type,
        duration: a.duration,
        direction: a.direction,
        participants: a.participants,
        notes: a.notes,
      },
    });
  }

  // Seed Notifications
  console.log('Seeding notifications...');
  const notifications = [
    {
      repName: 'Lakshmi Prasanna Dara',
      message: 'Acme Corp - Enterprise Platform: Close date has passed',
      type: 'warning',
      timestamp: new Date('2026-05-27T08:00:00'),
      read: false,
    },
    {
      repName: 'Lakshmi Prasanna Dara',
      message: 'Global Solutions - Multi-Year Deal: New warning added',
      type: 'warning',
      timestamp: new Date('2026-05-26T17:30:00'),
      read: false,
    },
    {
      repName: 'Lakshmi Prasanna Dara',
      message: 'TechStart Inc - Growth Package: Contract ready for review',
      type: 'info',
      timestamp: new Date('2026-05-26T14:00:00'),
      read: false,
    },
    {
      repName: 'Lakshmi Prasanna Dara',
      message: 'NextGen Enterprises - Pilot: Activity logged by rep',
      type: 'activity',
      timestamp: new Date('2026-05-25T11:00:00'),
      read: true,
    },
  ];

  await prisma.dealNotification.deleteMany({});
  for (const n of notifications) {
    await prisma.dealNotification.create({
      data: {
        tenantid: TENANT_ID,
        ...n,
      },
    });
  }

  console.log('--- M04 Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('M04 seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
