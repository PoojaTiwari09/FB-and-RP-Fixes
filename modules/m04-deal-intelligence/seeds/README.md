# Database Seeds

This directory contains database seed scripts for development and testing.

## Overview

Seeds are **optional** for the M04 Deal Intelligence module. The application is designed to work with real data from HubSpot CRM sync.

## Available Seeds

### 1. Board Seeds (`board.seed.ts`)
Creates sample deal boards for development:
- **Q1 2024 Pipeline** - Board with commit and best case tabs
- **High Risk Deals** - Board showing high-risk deals

## Usage

### Run All Seeds

```bash
npm run seed:run
```

### Run Seeds with Sample Boards

```bash
SEED_BOARDS=true npm run seed:run
```

### Windows PowerShell

```powershell
$env:SEED_BOARDS="true"; npm run seed:run
```

## Prerequisites

Before running seeds:

1. **Database must exist**
   ```bash
   psql -U postgres -c "CREATE DATABASE deal_intelligence;"
   ```

2. **Migrations must be run**
   ```bash
   npm run migration:generate -- -n InitialSchema
   npm run migration:run
   ```

## Seed Data

### Sample Boards

The board seed creates two sample boards with:
- Filters (forecast category, high risk)
- Tabs (commit, best case, all high risk)
- Columns (deal name, amount, stage, close date, AI score, warnings)
- Permissions (admin access for sample user)

**Note**: Sample boards use a placeholder user ID. Update with actual user IDs in production.

### Deal Data

Deal data is **not seeded**. It comes from HubSpot sync:

```bash
# Trigger HubSpot sync
curl -X POST http://localhost:3000/api/v1/sync/deals/full \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Development Workflow

### Option 1: No Seeds (Recommended)
```bash
# 1. Run migrations
npm run migration:run

# 2. Start application
npm run start:dev

# 3. Create boards via API
curl -X POST http://localhost:3000/api/v1/boards \
  -H "Authorization: Bearer TOKEN" \
  -d '{ "name": "My Board", ... }'

# 4. Sync deals from HubSpot
curl -X POST http://localhost:3000/api/v1/sync/deals/full \
  -H "Authorization: Bearer TOKEN"
```

### Option 2: With Sample Boards
```bash
# 1. Run migrations
npm run migration:run

# 2. Run seeds with boards
SEED_BOARDS=true npm run seed:run

# 3. Start application
npm run start:dev

# 4. Sync deals from HubSpot
curl -X POST http://localhost:3000/api/v1/sync/deals/full \
  -H "Authorization: Bearer TOKEN"
```

## Creating Custom Seeds

To add new seed files:

1. Create a new seed file in this directory:
   ```typescript
   // seeds/my-custom.seed.ts
   import { DataSource } from 'typeorm';
   
   export async function seedMyData(dataSource: DataSource): Promise<void> {
     console.log('🌱 Seeding my custom data...');
     
     const repository = dataSource.getRepository(MyEntity);
     
     // Your seed logic here
     
     console.log('✅ Custom data seeded');
   }
   ```

2. Import and call in `run-seeds.ts`:
   ```typescript
   import { seedMyData } from './my-custom.seed';
   
   // In runSeeds function:
   await seedMyData(dataSource);
   ```

## Troubleshooting

### Error: Cannot find module './run-seeds.ts'

**Solution**: The seeds directory was missing. It has now been created.

### Error: Database connection failed

**Solution**: 
1. Check PostgreSQL is running: `pg_isready`
2. Verify `.env` database credentials
3. Ensure database exists: `psql -U postgres -l | grep deal_intelligence`

### Error: Relation does not exist

**Solution**: Run migrations first:
```bash
npm run migration:run
```

### Error: Duplicate key value

**Solution**: Seeds have already been run. To re-seed:
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE deal_intelligence;"
psql -U postgres -c "CREATE DATABASE deal_intelligence;"

# Run migrations
npm run migration:run

# Run seeds
npm run seed:run
```

## Notes

- Seeds are for **development only**
- Production data comes from HubSpot sync
- Sample boards use placeholder user IDs
- Seeds are idempotent (safe to run multiple times)
- Seeds check for existing data before inserting

## Related Commands

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert

# Run seeds
npm run seed:run

# Run seeds with boards
SEED_BOARDS=true npm run seed:run
```

## See Also

- `../database/data-source.ts` - Database configuration
- `../migrations/` - Database migrations
- `../TESTING_GUIDE.md` - Testing instructions
- `../README.md` - Main documentation
