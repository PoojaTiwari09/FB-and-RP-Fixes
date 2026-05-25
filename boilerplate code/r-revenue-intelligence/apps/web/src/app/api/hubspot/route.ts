import { NextResponse } from "next/server";
import { PrismaClient } from "@rri/database/node_modules/@prisma/client";

const prisma = new PrismaClient();

function metadataDelegates(db: any) {
  return {
    object: db.dataSourceObject ?? db.crmObject,
    field: db.dataSourceField ?? db.crmField,
    relationship: db.dataSourceRelationship ?? db.crmRelationship,
  };
}

export async function POST(request: Request) {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const meta = metadataDelegates(prisma as any);

    // Wipe any existing data source + metadata to start fresh
    const existingSources = await prisma.dataSource.findMany({
      where: { tenantId, sourceType: 'hubspot' },
      select: { id: true },
    });

    const existingSourceIds = existingSources.map((s) => s.id);
    if (existingSourceIds.length) {
      if (!meta.object || !meta.field || !meta.relationship) {
        throw new Error("Metadata layer Prisma delegates are missing. Run prisma generate or use compatible client.");
      }

      const existingObjects = await meta.object.findMany({
        where: { dataSourceId: { in: existingSourceIds } },
        select: { id: true },
      });
      const existingObjectIds = existingObjects.map((o: { id: string }) => o.id);

      if (existingObjectIds.length) {
        await meta.relationship.deleteMany({
          where: {
            OR: [
              { sourceObjectId: { in: existingObjectIds } },
              { targetObjectId: { in: existingObjectIds } },
            ],
          },
        });
        await meta.field.deleteMany({
          where: { objectId: { in: existingObjectIds } },
        });
        await meta.object.deleteMany({
          where: { id: { in: existingObjectIds } },
        });
      }

      await prisma.dataSource.deleteMany({
        where: { id: { in: existingSourceIds } },
      });
    }

    // 1. Create Data Source
    const dataSource = await prisma.dataSource.create({
      data: {
        tenantId,
        sourceName: 'Mock PostgreSQL CRM',
        sourceType: 'hubspot',
        accessToken: 'mock_postgres_access_token',
        refreshToken: 'mock_postgres_refresh_token',
      }
    });

    // 2. Query Postgres information_schema for tables in 'crm_mock'
    const tables: any[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'crm_mock' AND table_type = 'BASE TABLE';
    `);

    const objectMap = new Map<string, any>();

    // 3. For each table, create a CRM Object and insert its fields
    for (const t of tables) {
      const tableName = t.table_name;
      const displayName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
      
      const crmObj = await meta.object.create({
        data: {
          dataSourceId: dataSource.id,
          objectName: tableName,
          displayName: displayName,
        }
      });

      objectMap.set(tableName, crmObj);

      // Fetch columns
      const columns: any[] = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'crm_mock' AND table_name = '${tableName}';
      `);

      const fieldsToInsert = columns.map(c => ({
        objectId: crmObj.id,
        fieldName: c.column_name,
        displayName: c.column_name.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        fieldType: c.data_type
      }));

      await meta.field.createMany({
        data: fieldsToInsert
      });
    }

    // 4. Query foreign keys to extract relationships
    const fks: any[] = await prisma.$queryRawUnsafe(`
      SELECT
          tc.table_name AS source_table, 
          kcu.column_name AS source_column, 
          ccu.table_name AS target_table,
          ccu.column_name AS target_column
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'crm_mock';
    `);

    const relsToInsert = [];
    for (const fk of fks) {
      const sourceObj = objectMap.get(fk.source_table);
      const targetObj = objectMap.get(fk.target_table);
      if (sourceObj && targetObj) {
        relsToInsert.push({
          sourceObjectId: sourceObj.id,
          targetObjectId: targetObj.id,
          relationshipType: 'many_to_one',
          sourceField: fk.source_column,
          targetField: fk.target_column,
        });
      }
    }

    if (relsToInsert.length > 0) {
      await meta.relationship.createMany({
        data: relsToInsert
      });
    }

    return NextResponse.json({ success: true, dataSourceId: dataSource.id });
  } catch (error: any) {
    console.error("Mock Connection Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Optional: Endpoint to disconnect and reset for testing purposes
export async function DELETE() {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const meta = metadataDelegates(prisma as any);

    const existingSources = await prisma.dataSource.findMany({
      where: { tenantId, sourceType: 'hubspot' },
      select: { id: true },
    });

    const existingSourceIds = existingSources.map((s) => s.id);
    if (existingSourceIds.length) {
      if (!meta.object || !meta.field || !meta.relationship) {
        throw new Error("Metadata layer Prisma delegates are missing. Run prisma generate or use compatible client.");
      }

      const existingObjects = await meta.object.findMany({
        where: { dataSourceId: { in: existingSourceIds } },
        select: { id: true },
      });
      const existingObjectIds = existingObjects.map((o: { id: string }) => o.id);

      if (existingObjectIds.length) {
        await meta.relationship.deleteMany({
          where: {
            OR: [
              { sourceObjectId: { in: existingObjectIds } },
              { targetObjectId: { in: existingObjectIds } },
            ],
          },
        });
        await meta.field.deleteMany({
          where: { objectId: { in: existingObjectIds } },
        });
        await meta.object.deleteMany({
          where: { id: { in: existingObjectIds } },
        });
      }

      await prisma.dataSource.deleteMany({
        where: { id: { in: existingSourceIds } },
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const meta = metadataDelegates(prisma as any);
    
    const includeMetadata =
      meta.object === (prisma as any).dataSourceObject
        ? { objects: { include: { fields: true } } }
        : { crmObjects: { include: { fields: true } } };

    const dataSource = await prisma.dataSource.findFirst({
      where: { tenantId, sourceType: 'hubspot' },
      orderBy: { createdAt: 'desc' },
      include: {
        ...includeMetadata,
      }
    });

    if (!dataSource) {
      return NextResponse.json({ connected: false });
    }

    if (!meta.relationship) {
      throw new Error("Metadata relationship delegate missing. Run prisma generate or use compatible client.");
    }

    const objects = (dataSource as any).objects ?? (dataSource as any).crmObjects ?? [];
    const objectIds = objects.map((o: any) => o.id);
    const relationships = objectIds.length
      ? await meta.relationship.findMany({
          where: {
            OR: [
              { sourceObjectId: { in: objectIds } },
              { targetObjectId: { in: objectIds } },
            ],
          },
        })
      : [];

    return NextResponse.json({
      connected: true,
      dataSource,
      relationships
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
