import { prisma } from "@/modules/m07-revenue-dashboards/lib/prisma";
import { NextResponse } from "next/server";
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
function resolveTenantId(request: Request): string {
  const url = new URL(request.url);
  return request.headers.get('x-tenant-id') || url.searchParams.get('tenantId') || TENANT_ID;
}

// ── Helpers duplicated from data/route.ts so we can bundle data in one request ─

function toPipelineStage(stage: string): string {
  if (stage === 'Closed Won' || stage === 'Closed Lost') return 'Closed';
  if (stage === 'Negotiation') return 'Late';
  if (stage === 'Proposal' || stage === 'Discovery') return 'Mid';
  return 'Early';
}
function toStatus(stage: string): string {
  if (stage === 'Closed Lost') return 'Needs Attention';
  if (stage === 'Closed Won') return 'Won';
  return 'On Track';
}

function resolveSource(sourceMode: string): 'hubspot' | 'postgres' | 'mock' {
  if (sourceMode === 'hubspot') return 'hubspot';
  if (sourceMode === 'postgres') return 'postgres';
  return 'mock';
}

async function fetchRowsForDataset(ds: any): Promise<any[]> {
  try {
    const src = resolveSource(ds.sourceMode);

    if (src === 'hubspot') {
      // Return static HubSpot sample data instantly — no network call needed
      return []; // Signals "use the hubspot static data" — handled client-side
    }

    if (src === 'postgres') {
      const deals = await prisma.deal.findMany({
        where: { tenantId: TENANT_ID },
        include: { account: true },
        orderBy: { closeDate: 'desc' },
        take: 300,
      });
      return deals.map((d: any) => ({
        dealName: d.name, deal_name: d.name,
        amount: Number(d.amount),
        stage: d.stage,
        ownerName: d.ownerName || 'Unknown',
        accountName: d.account?.name || 'Unknown',
        company_name: d.account?.name || 'Unknown',
        industry: d.account?.industry || '',
        quarter: d.quarter,
        closeDate: d.closeDate ? d.closeDate.toISOString().split('T')[0] : '',
        close_date: d.closeDate ? d.closeDate.toISOString().split('T')[0] : '',
        pipelineStage: toPipelineStage(d.stage),
        status: toStatus(d.stage),
      }));
    }

    // mock — build query from selectedObjects
    const objs: string[] = Array.isArray(ds.selectedObjects)
      ? ds.selectedObjects.map((o: string) => o.toLowerCase())
      : ['deals'];

    const selectCols: string[] = [
      'd.id', 'd.name AS deal_name', 'd.amount', 'd.stage',
      "TO_CHAR(d.close_date, 'YYYY-MM-DD') AS close_date",
      "CONCAT('Q', EXTRACT(QUARTER FROM d.close_date)::int, '-', EXTRACT(YEAR FROM d.close_date)::int) AS quarter",
    ];
    const joins: string[] = [];

    if (objs.includes('companies')) {
      selectCols.push('c.name AS company_name', 'c.industry', 'c.country', 'c.employee_count');
      joins.push('LEFT JOIN crm_mock.companies c ON d.company_id = c.id');
    }
    if (objs.includes('contacts')) {
      selectCols.push("CONCAT(ct.first_name, ' ', ct.last_name) AS contact_name", 'ct.email AS contact_email', 'ct.lifecycle_stage');
      joins.push('LEFT JOIN crm_mock.contacts ct ON d.contact_id = ct.id');
    }
    if (objs.includes('tickets')) {
      selectCols.push('tk.subject AS ticket_subject', 'tk.status AS ticket_status', 'tk.priority AS ticket_priority');
      joins.push('LEFT JOIN crm_mock.tickets tk ON tk.company_id = d.company_id');
    }
    if (objs.includes('activities')) {
      selectCols.push('a.type AS activity_type', 'a.duration_minutes AS activity_duration', 'a.outcome AS activity_outcome');
      joins.push('LEFT JOIN crm_mock.activities a ON a.contact_id = d.contact_id');
    }

    const sql = `SELECT ${selectCols.join(',\n')} FROM crm_mock.deals d ${joins.join('\n')} ORDER BY d.close_date DESC NULLS LAST LIMIT 300`;
    const rows = await prisma.$queryRawUnsafe<any[]>(sql);
    return rows.map((r: any) => ({
      ...r,
      amount: Number(r.amount ?? 0),
      dealName: r.deal_name || 'Unknown',
      ownerName: r.contact_name || 'Unknown',
      accountName: r.company_name || 'Unknown',
      pipelineStage: toPipelineStage(r.stage || ''),
      status: toStatus(r.stage || ''),
    }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeData = searchParams.get('includeData') === 'true';
    const tenantId = resolveTenantId(request);

    const datasets = await prisma.dataset.findMany({
      where: { tenantId },
      include: { relationships: true }
    });

    const formatted = datasets.map((d: any) => ({
      id: d.id,
      name: d.name,
      sourceMode: d.sourceMode,
      selectedObjects: typeof d.selectedObjects === 'string' ? JSON.parse(d.selectedObjects) : d.selectedObjects,
      selectedFields: typeof d.selectedFields === 'string' ? JSON.parse(d.selectedFields) : d.selectedFields,
      relationships: d.relationships.map((r: any) => ({
        sourceObject: r.sourceObject,
        sourceField: r.sourceField,
        targetObject: r.targetObject,
        targetField: r.targetField,
        status: r.status,
        validationMessage: r.validationMessage || undefined
      })),
      mappingAccepted: d.mappingStatus === 'VALIDATED',
      createdAt: d.createdAt.toISOString()
    }));

    if (!includeData) {
      return NextResponse.json(formatted);
    }

    // Fetch row data for ALL datasets in parallel — one round trip instead of N+1
    const rowsPerDataset = await Promise.all(
      datasets.map((d: any) => fetchRowsForDataset({
        ...d,
        selectedObjects: typeof d.selectedObjects === 'string' ? JSON.parse(d.selectedObjects) : d.selectedObjects,
      }))
    );

    const withData = formatted.map((ds: any, i: number) => ({
      ...ds,
      _rows: rowsPerDataset[i],
    }));

    return NextResponse.json(withData);
  } catch (error: any) {
    console.error("Failed to fetch datasets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const userId = '22222222-2222-2222-2222-222222222222';
    const body = await request.json();

    // Remove existing dataset with same id if overwrite/update
    await prisma.dataset.deleteMany({
      where: { id: body.id }
    });

    const dataset = await prisma.dataset.create({
      data: {
        id: body.id,
        tenantId,
        createdById: userId,
        name: body.name,
        sourceMode: body.sourceMode,
        selectedObjects: body.selectedObjects,
        selectedFields: body.selectedFields,
        mappingStatus: body.mappingAccepted ? "VALIDATED" : "PENDING",
        relationships: {
          create: (body.relationships || []).map((rel: any) => ({
            sourceObject: rel.sourceObject,
            sourceField: rel.sourceField,
            targetObject: rel.targetObject,
            targetField: rel.targetField,
            status: rel.status || "AUTO_DETECTED",
            validationMessage: rel.validationMessage || null,
          }))
        }
      },
      include: {
        relationships: true
      }
    });

    return NextResponse.json({ success: true, dataset });
  } catch (error: any) {
    console.error("Failed to create dataset:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.datasetRelationship.deleteMany({ where: { datasetId: id } });
    await prisma.dataset.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete dataset:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
