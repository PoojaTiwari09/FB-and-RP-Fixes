# 📖 Developer Onboarding & Tech Lead Review Playbook

This master playbook provides a practical, step-by-step guide for two key roles:
1. **The New Developer:** How to pull the repository, set up their local environment, implement a feature using Spec-Driven Development (SDD), write tests, and open a Pull Request.
2. **The Tech Lead:** How to systematically review, test, validate, and merge incoming PRs from the 10 module teams without compromising tenant isolation, data governance, or platform stability.

---

## 🧑‍💻 PART 1: The New Developer's Journey

### Step 1: Clone the Repo & Local Setup
When you join the team, execute these commands to spin up your local environment:

```bash
# 1. Clone the repository and go to the boilerplate code directory
git clone https://github.com/santhoshraajrelanto/Revenue-intelligence-technical-docs.git
cd "Revenue-intelligence-technical-docs/boilerplate code/r-revenue-intelligence"
```

#### **Option A: Containerized Local Setup (With Docker)**
If you are using Docker Desktop to orchestrate all services automatically:
```bash
# 1. Start the local database infrastructure
docker compose up -d postgres redis meilisearch clickhouse

# 2. Pull secure local configurations (Requires Doppler CLI)
doppler setup --project r-revenue-intelligence --config dev

# 3. Install dependencies and compile workspace typings sequentially
pnpm install
pnpm --workspace-concurrency=1 -r db:generate

# 4. Synchronize schemas
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

#### **Option B: Native Local Setup (Without Docker)**
If you are running PostgreSQL, Redis, and services natively on your local system:
```bash
# 1. Configure your local environment variables in `.env`
# Create a `.env` in the root containing your native connection URLs:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/revenue_intel?schema=public"
# REDIS_HOST="localhost"
# REDIS_PORT="6379"

# 2. Install dependencies
pnpm install

# 3. Compile workspace database clients sequentially
pnpm --workspace-concurrency=1 -r db:generate

# 4. Synchronize the master schema with your native DB instance
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

---

### Step 2: Implement a Feature (Spec-Driven Approach)
Do not immediately start writing application code. You must design first using **GitHub Spec Kit** and your module’s pre-scaffolded directory.

```
[Write Specification] ──► [Generate Design Plan] ──► [Create Phased Tasks] ──► [Code Implementation]
```

1. **Write Spec (`.specify/specs/spec-your-feature.md`):** Describe *what* the feature does and the *acceptance criteria*.
2. **AI Plan Generation:** Ask your AI assistant (e.g. Claude Code, Cursor, Copilot) to generate a plan:
   > *"Analyze our spec file and create a technical plan at `.specify/plans/plan-your-feature.md` following our `.specify/memory/constitution.md` principles."*
3. **Draft Actionable Tasks:** Create a phased task list at `.specify/tasks/tasks-your-feature.md` to map out your database mutations, code structure, and test boundaries.

---

### Step 3: Write & Run Tests
You must write both **Unit Tests** (fast, mocked) and **Integration Tests** (real databases/queues).

*   **Unit Tests (Mocked Jest):**
    Ensure your services and controllers are verified without touching real databases. Mock your `PrismaService` and `EventPublisherService`.
    ```bash
    pnpm test
    ```
*   **Integration Tests (Real DB & Queues via Docker):**
    Write tests inside your module's `tests/` directory to verify that database interactions, event consumer handlers, and Row-Level Security (RLS) work perfectly against your local running Docker containers.
    ```bash
    doppler run -- pnpm test:integration
    ```

---

### Step 4: Open a Pull Request (PR)
Create a new feature branch, push your changes, and fill out the standardized PR checklist template:

```bash
git checkout -b feature/mXX-[feature-name]
git add .
git commit -m "feat(mXX): completed implementation of [feature-name]"
git push origin feature/mXX-[feature-name]
```

---

## 🛠️ PART 2: The Tech Lead's Review Gates

As a Tech Lead, you are the final gateway ensuring the platform's architectural integrity. When a developer submits a PR, you must systematically audit it across five critical gates:

```mermaid
graph TD
    PR[Incoming PR] --> Gate1[1. Automated CI Pipeline]
    Gate1 --> Gate2[2. Tenant Isolation & RLS Gate]
    Gate2 --> Gate3[3. Language Boundary Compliance]
    Gate3 --> Gate4[4. Event Idempotency Check]
    Gate4 --> Gate5[5. Local Integration Validation]
    Gate5 --> Merge[Approved & Merged]
```

### Review Gate 1: The Automated CI Pipeline
Ensure that the pull request successfully passes all automated checks:
- [ ] Code compiles without TypeScript or AST validation errors (`pnpm build`).
- [ ] Unit and mock tests achieve $\ge 80\%$ coverage (`pnpm test:cov`).
- [ ] No hardcoded configuration values or `.env` files are tracked in the commit diff.

### Review Gate 2: Tenant Isolation & Database RLS (Crucial)
Verify that new tables are secure and insulated:
- [ ] Every new table model in `schema.prisma` contains `tenantId String @db.Uuid`.
- [ ] **SQL Migration Audit:** Review the generated SQL migration file. It **must** include database-level RLS policies, such as:
  ```sql
  ALTER TABLE mXX_table_name ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation_policy ON mXX_table_name 
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
  ```

### Review Gate 3: Language & Service Boundaries
Verify that code is located in the correct service folder:
- [ ] **Orchestration Rule:** The TypeScript layer (`apps/api`) does *not* import LLM weights, LangChain, or call external AI models directly.
- [ ] **AI Inference Rule:** All NLP, summarizing, embeddings, and classification workloads are implemented within the FastAPI layers (`apps/ai-services`) and accessed via secure HTTP requests.

### Review Gate 4: Event-Driven Correctness & Idempotency
Verify that inter-module communication is asynchronous and stable:
- [ ] All cross-module workflows are triggered via BullMQ event listeners rather than direct database updates.
- [ ] All workers perform an **idempotency lookup** in the database using the unique `eventId` envelope parameter to safely ignore duplicate queue deliveries.

### Review Gate 5: Local Integration Validation
Before clicking **Merge**, pull the branch locally and run a complete integration validation check:

```bash
# 1. Pull the developer's branch locally
git checkout feature/mXX-[feature-name]

# 2. Launch local Docker containers
docker compose up -d postgres redis clickhouse

# 3. Apply schema updates locally and run all integration tests
doppler run -- pnpm db:migrate
doppler run -- pnpm test:integration
```

Once all gates are checked, you can safely merge the branch into `develop` and let the automated CD pipeline deploy the feature!
