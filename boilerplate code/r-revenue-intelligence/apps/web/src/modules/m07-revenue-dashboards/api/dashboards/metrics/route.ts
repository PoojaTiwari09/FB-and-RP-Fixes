import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";
import { METRICS_REGISTRY } from "@/modules/m07-revenue-dashboards/lib/metrics-registry";

const prisma = new PrismaClient();

const DEFAULT_TENANT = "11111111-1111-1111-1111-111111111111";
const DEFAULT_USER = "22222222-2222-2222-2222-222222222222";

function resolveUser(request: Request, body?: Record<string, any>) {
  const url = new URL(request.url);
  return {
    userId: request.headers.get("x-user-id") || body?.userId || url.searchParams.get("userId") || DEFAULT_USER,
    tenantId: request.headers.get("x-tenant-id") || body?.tenantId || url.searchParams.get("tenantId") || DEFAULT_TENANT,
  };
}

type MetricConfig = {
  renames: Record<string, string>;
  custom: any[];
};

function readMetricConfig(layout: any): MetricConfig {
  const parsed = typeof layout === "string" ? JSON.parse(layout) : layout;
  const cfg = parsed?.metrics;
  return {
    renames: (cfg?.renames && typeof cfg.renames === "object") ? cfg.renames : {},
    custom: Array.isArray(cfg?.custom) ? cfg.custom : [],
  };
}

function writeMetricConfig(layout: any, next: MetricConfig): any {
  const parsed = typeof layout === "string" ? JSON.parse(layout) : (layout ?? {});
  return {
    ...(parsed && typeof parsed === "object" ? parsed : {}),
    metrics: {
      renames: next.renames ?? {},
      custom: next.custom ?? [],
    },
  };
}

export async function GET(request: Request) {
  try {
    const { userId, tenantId } = resolveUser(request);
    const config = await prisma.dashboardConfig.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    const cfg = readMetricConfig(config?.layout);
    return NextResponse.json(cfg);
  } catch (error: any) {
    console.error("GET /api/dashboards/metrics error:", error);
    return NextResponse.json({ error: error.message ?? "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, tenantId } = resolveUser(request, body);

    const renames = (body?.renames && typeof body.renames === "object") ? body.renames : {};
    const custom = Array.isArray(body?.custom) ? body.custom : [];

    // Basic validation: only allow renames of known metrics
    const safeRenames: Record<string, string> = {};
    Object.entries(renames).forEach(([id, name]) => {
      if (METRICS_REGISTRY[id] && typeof name === "string" && name.trim()) {
        safeRenames[id] = name.trim().slice(0, 80);
      }
    });
    // Custom metrics must be objects with id+name+formula
    const safeCustom = custom
      .filter((m: any) => m && typeof m === "object" && typeof m.id === "string" && typeof m.name === "string")
      .slice(0, 200);

    const existing = await prisma.dashboardConfig.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    const nextLayout = writeMetricConfig(existing?.layout, { renames: safeRenames, custom: safeCustom });

    await prisma.dashboardConfig.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      update: { layout: nextLayout },
      create: {
        tenantId,
        userId,
        layout: nextLayout,
      } as any,
    });

    return NextResponse.json({ renames: safeRenames, custom: safeCustom });
  } catch (error: any) {
    console.error("PATCH /api/dashboards/metrics error:", error);
    return NextResponse.json({ error: error.message ?? "Internal error" }, { status: 500 });
  }
}

