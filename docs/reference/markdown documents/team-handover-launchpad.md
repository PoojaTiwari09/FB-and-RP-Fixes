# 🚀 R-Revenue Intelligence Platform: Team Handover Launchpad

This document is the **Tech Lead’s Onboarding Kit**. It contains the exact communications, templates, and checklists you need to distribute to your 20 developers (10 teams of 2) on Day 1.

---

## 📬 1. Slack / Teams Announcement Template
*Copy, edit, and post this to your team's main communication channel to kick off the launch:*

```text
🚀 @here **Welcome to the R-Revenue Intelligence Platform!** 🚀

We are officially launching the development phase of our modular monorepo. We have built an enterprise-grade, AI-ready boilerplate and integrated the **GitHub Spec-Driven Development (SDD) Framework** to enable rapid, high-quality development.

Our codebase is fully live and protected on GitHub:
👉 https://github.com/santhoshraajrelanto/r-revenue-intelligence-monorepo

📦 **YOUR MODULE ASSIGNMENTS (Teams of 2):**
- Platform Core: Infrastructure & DevOps Team
- Module 1 (Capture & Transcription): Team 1 (@Name & @Name)
- Module 2 (Conversation Intelligence): Team 2 (@Name & @Name)
- Module 3 (AI Summaries & GenAI): Team 3 (@Name & @Name)
- Module 4 (Deal Intelligence): Team 4 (@Name & @Name)
- Module 5 (Account Intelligence): Team 5 (@Name & @Name)
- Module 6 (Forecasting & Prediction): Team 6 (@Name & @Name)
- Module 7 (Revenue Dashboards): Team 7 (@Name & @Name)
- Module 8 (Sales Engagement): Team 8 (@Name & @Name)
- Module 9 (Coaching & Training): Team 9 (@Name & @Name)
- Module 10 (Data & Compliance): Team 10 (@Name & @Name)

📚 **GETTING STARTED IN 15 MINUTES:**
1. Clone the repo: git clone https://github.com/santhoshraajrelanto/r-revenue-intelligence-monorepo.git
2. Read the master developer handbook inside the repo:
   `docs/markdown documents/developer-and-lead-playbook.md`
3. Spin up your local databases: `docker compose up -d`
4. Fetch remote branches and checkout your team's persistent integration branch:
   `git fetch --all && git checkout module/mXX-[your-module-name]`

🎯 **DAY 1 TARGET:**
Clone the repo, start your local docker databases, run the test suites locally, and successfully switch to your assigned module branch. Let's build a secure, event-driven, tenant-isolated powerhouse!
```

---

## 📋 2. Developer Cheat Sheet (Print or Bookmark)
*This is the simplified reference sheet developers keep open during the day:*

### The Core Commands:
```bash
# 🛠️ 1. SPIN UP LOCAL DATABASES & CACHES
docker compose up -d postgres redis meilisearch clickhouse

# 🔗 2. PULL CONFIGS & SECRETS (Ensure Doppler CLI is installed)
doppler setup --project r-revenue-intelligence --config dev

# 💾 3. SYNC SCHEMA & RUN INITIAL DATA SEEDS
pnpm install
doppler run -- pnpm db:migrate
doppler run -- pnpm db:seed

# 🧪 4. RUN ALL TEST SUITES
doppler run -- pnpm test             # Run unit tests
doppler run -- pnpm test:integration # Run real DB integration tests
```

### The Git Workflow:
```
[module/mX-name] ──► [feature/mX-RRI-XXX] ──► [Pull Request] ──► [Auto CI Checks] ──► [module/mX-name]
```

---

## 🎯 3. First Sprint Goals for Teams

To ensure all 10 teams adopt the workflow successfully, set these concrete goals for their first week:

1.  **Run the Validation Suite:** Run `python "boilerplate code/syntax_validator.py"` to ensure their system tools are correct.
2.  **SDD Document Setup:** Open their module directory `apps/api/src/modules/mXX-*` and locate their pre-scaffolded `SDD.md` file. They must fill in their feature scope and requirements here.
3.  **Create a Dummy PR:** Write a single mock unit test, create a `feature/mXX-test` branch, push it, and open a Pull Request against their module branch to see the **GitHub Actions SDD pipeline** automatically run.
