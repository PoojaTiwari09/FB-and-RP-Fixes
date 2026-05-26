import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";

const prisma = new PrismaClient();

const TENANT_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID   = "22222222-2222-2222-2222-222222222222";

export async function POST() {
  try {
    // Create tenant if it doesn't exist
    await prisma.tenant.upsert({
      where: { id: TENANT_ID },
      update: {},
      create: {
        id: TENANT_ID,
        name: "Revenue Intelligence",
        slug: "revenue-intelligence",
      },
    });

    // Create user if it doesn't exist
    await prisma.user.upsert({
      where: { id: USER_ID },
      update: {},
      create: {
        id: USER_ID,
        tenantId: TENANT_ID,
        email: "admin@revenue.ai",
        name: "Admin User",
        passwordHash: "seeded",
        role: "ADMIN",
      },
    });

    return NextResponse.json({ success: true, message: "Tenant and user seeded." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
