const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'packages', 'database', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const m05Schema = `
// ─────────────────────────────────────────────────────────────
// M05 Account Intelligence
// ─────────────────────────────────────────────────────────────

model M05BoardConfig {
  board_id            String   @id
  slug                String   @unique
  name                String
  description         String?
  parent_board_slug   String?
  default_sort_field  String?
  default_sort_dir    String?
  date_filter_enabled Boolean? @default(true)
  ai_briefs_enabled   Boolean? @default(true)
  brief_type          String?  @default("full")
  brief_period_days   Int?     @default(30)
  aggregation_method  String?  @default("count")
  created_by_user_id  String?
  date_filter_field   String?  @default("activity_date")
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  tabs    M05BoardTab[]
  columns M05BoardColumn[]

  @@map("m05_board_config")
  @@schema("revenuegraph")
}

model M05BoardTab {
  tab_id       String   @id
  board_id     String
  label        String
  is_default   Boolean  @default(false)
  order        Int      @default(0)
  filter_logic Json?
  board        M05BoardConfig @relation(fields: [board_id], references: [board_id], onDelete: Cascade)

  @@map("m05_board_tabs")
  @@schema("revenuegraph")
}

model M05BoardColumn {
  col_id           String   @id
  board_id         String
  field_key        String
  label            String
  column_type      String?
  order            Int      @default(0)
  width            Int      @default(120)
  sortable         Boolean  @default(false)
  editable         Boolean  @default(false)
  visible_to_roles String[]
  board            M05BoardConfig @relation(fields: [board_id], references: [board_id], onDelete: Cascade)

  @@map("m05_board_columns")
  @@schema("revenuegraph")
}

model M05Company {
  hubspot_id       String   @id
  name             String
  board            String?
  exit_arr         Float?
  assigned_rep_id  String?
  hubspot_owner_id String?
  industry         String?
  domain           String?
  employee_count   Int?
  updated_at       DateTime @updatedAt
  
  activities M05Activity[]
  deals      M05Deal[]
  contacts   M05Contact[]
  briefs     M05AiBriefCache[]

  @@map("m05_companies")
  @@schema("revenuegraph")
}

model M05SupplementaryAccount {
  company_hubspot_id String   @id
  ai_risk_score      Float?
  ai_risk_label      String?
  notes              String?
  manager_note       String?

  @@map("m05_supplementary_accounts")
  @@schema("revenuegraph")
}

model M05Activity {
  local_id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  hubspot_id         String?
  company_hubspot_id String
  type               String
  direction          String?
  timestamp          DateTime
  body               String?
  assigned_rep_id    String?
  rep_talk_pct       Int?
  client_talk_pct    Int?
  call_outcome       String?
  duration_seconds   Int?
  subject            String?

  company            M05Company @relation(fields: [company_hubspot_id], references: [hubspot_id], onDelete: Cascade)

  @@map("m05_activities")
  @@schema("revenuegraph")
}

model M05Deal {
  hubspot_id         String   @id
  company_hubspot_id String
  deal_name          String
  stage              String
  amount             Float?
  deal_type          String?
  assigned_rep_id    String?
  close_date         DateTime?

  company            M05Company @relation(fields: [company_hubspot_id], references: [hubspot_id], onDelete: Cascade)

  @@map("m05_deals")
  @@schema("revenuegraph")
}

model M05Contact {
  hubspot_id         String   @id
  company_hubspot_id String
  first_name         String?
  last_name          String?
  email              String?
  title              String?

  company            M05Company @relation(fields: [company_hubspot_id], references: [hubspot_id], onDelete: Cascade)

  @@map("m05_contacts")
  @@schema("revenuegraph")
}

model M05TodoNote {
  id                 String   @id
  company_hubspot_id String
  type               String
  content            String
  completed          Boolean  @default(false)
  completed_at       DateTime?
  created_by_role    String?
  created_at         DateTime @default(now())

  @@map("m05_todos_notes")
  @@schema("revenuegraph")
}

model M05AiBriefCache {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  company_hubspot_id String
  board_slug         String?
  brief_json         Json
  generated_at       DateTime @default(now())

  company            M05Company @relation(fields: [company_hubspot_id], references: [hubspot_id], onDelete: Cascade)

  @@map("m05_ai_briefs_cache")
  @@schema("revenuegraph")
}

model M05UserBoardPreference {
  id            String   @id
  session_role  String
  board_id      String
  active_tab_id String?
  sort_field    String?
  sort_dir      String?
  page_size     Int?
  updated_at    DateTime @updatedAt

  @@map("m05_user_board_preferences")
  @@schema("revenuegraph")
}

model M05PermissionProfile {
  id                     String  @id
  role                   String  @unique
  name                   String
  can_edit_board_config  Boolean @default(false)
  can_edit_cells         Boolean @default(false)

  @@map("m05_permission_profiles")
  @@schema("revenuegraph")
}
`;

if (!schema.includes('M05BoardConfig')) {
  fs.writeFileSync(schemaPath, schema + '\n' + m05Schema);
  console.log('Appended M05 models to schema.prisma');
} else {
  console.log('M05 models already exist');
}
