## 👋 Welcome & What This Guide Does

Welcome to the local development setup guide for **R-Revenue Intelligence**. This project is an AI-powered revenue intelligence platform that captures customer interactions from calls, meetings, emails, and CRM systems, converts them into structured business data, and uses that data to generate insights for sales execution, forecasting, and coaching workflows. 

This guide is written for **freshers, interns, and all new team members** who are joining the project and need a simple way to get started with the engineering setup. The broader project documentation is designed for multiple roles across backend, frontend, AI/ML, QA, DevOps, and product teams, but this guide focuses only on what a new developer needs to start working locally. 

By following this guide, you will be able to run the full project stack on your laptop using the approved local setup approach. In this project, local development is designed to run through Docker Compose so that all main services work together in a predictable and production-like way. 

For most new developers, the initial setup should take around **30 to 45 minutes**, depending on your internet speed, system updates, and whether tools like Docker are already installed.

---

## 🧠 Before You Start — Understand the Stack

Before starting the setup, it is important to understand the basic structure of the project. R-Revenue Intelligence is built as a system with multiple services that work together, but for local development you do not need to start them one by one manually. The architecture defines separate services for the frontend, API layer, AI services, and transcription pipeline. 

The main local services are:

| Service | Language | What it does |
|---|---|---|
| `frontend` | Next.js (TypeScript) | The user interface that developers and end users interact with.  |
| `api` | NestJS (TypeScript) | The main backend that contains product logic, authentication, orchestration, and module workflows.  |
| `ai-services` | FastAPI (Python) | The internal AI layer that handles LLM inference, embeddings, NLP, and retrieval-related tasks.  |
| `transcription-service` | FastAPI + Whisper (Python) | The speech processing service that handles audio transcription and related transcript pipeline tasks.  |

Along with these services, the local setup also runs supporting infrastructure such as **PostgreSQL**, **Redis**, and **Meilisearch**, because the application depends on them for data storage, queueing, caching, and search behavior. 

The most important rule to remember is this: **you do not install or run these project services manually one by one**. The approved local development approach uses **Docker Compose**, which starts the full stack together in a consistent way and reduces “works on my machine” problems for new engineers. 


## 🛠️ What You Need to Install (Prerequisites)

Before you start the local setup, make sure the basic tools below are installed on your laptop. The project uses a standard engineering stack with Docker for containers, Node.js for TypeScript services, Python for AI services, and Doppler for secrets management. 

Install these tools first:

- **Git** — Used to clone the repository, pull the latest changes, and push your work to GitHub.
- **Docker Desktop** — The most important tool for local setup. It runs the project services inside containers so your machine does not need manual setup for each service. Local development in this project is designed to run through Docker Compose. 
- **Node.js 20 LTS** — Required for the frontend and backend TypeScript parts of the project. The approved backend runtime is Node.js 20.x LTS. 
- **Python 3.11** — Required for the AI and transcription services. The architecture documents Python 3.11 as the standard runtime for AI workloads and also uses Python 3.11-based container images in the local setup. 
- **Doppler CLI** — Required to pull and inject environment secrets securely. This project does not store secrets in committed `.env` files or Docker images, and Doppler is the approved secrets management tool. 
- **VS Code** *(recommended)* — Recommended code editor for browsing the codebase, editing files, running terminals, and debugging.
- **Ollama** *(optional)* — Useful if you want to run local AI models during experiments, prompt testing, fallback design, or private internal demos without calling paid APIs. It is not required on Day 1, but it is a useful development tool for AI-related work. 

You can install them from these official links:

- Git: https://git-scm.com/downloads
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Node.js 20 LTS: https://nodejs.org/
- Python 3.11: https://www.python.org/downloads/
- Doppler CLI: https://docs.doppler.com/docs/install-cli
- VS Code: https://code.visualstudio.com/
- Ollama: https://ollama.com/

Recommended version summary:

| Tool | Recommended Version | Why you need it |
|---|---|---|
| Git | Latest stable | Clone repo and work with branches |
| Docker Desktop | Latest stable | Run the full stack locally in containers  |
| Node.js | 20 LTS | Frontend and backend TypeScript development  |
| Python | 3.11 | AI services and transcription-related development  |
| Doppler CLI | Latest stable | Secure secret injection for local and cloud environments  |
| VS Code | Latest stable | Recommended editor for project work |
| Ollama | Latest stable | Optional local AI experimentation  |

> 💡 **Fresher tip:** If you see an error like `command not found`, it usually means that tool is not installed yet or its path is not added correctly. Search for `install <tool name> on <your OS>` and follow the official guide.

---

## 🔑 Getting Access (Do This First)

Before trying to run the project, make sure you have access to the main systems used by the team. The project uses GitHub for source code, Doppler for secrets, Railway for deployments, Sentry for error tracking, Supabase for core platform data and auth-related services, and Slack for team communication. 

Ask your Tech Lead or manager to give you access to the following:

- [ ] **GitHub repository access** — So you can clone the codebase, create branches, and raise pull requests.
- [ ] **Doppler account invite** — So you can access the correct project secrets for local development and other environments. The architecture requires Doppler as the central source of secrets. 
- [ ] **Railway access** — So you can view deployed services, environment status, and logs for shared environments. Railway is the approved hosting platform for the current phase of the project. 
- [ ] **Sentry access** — So you can view application errors and debug runtime failures across services. Sentry is part of the approved observability stack. 
- [ ] **Supabase project access** — So you can understand database structure, auth configuration, and related platform services. Supabase is part of the approved data and auth stack. 
- [ ] **Slack workspace or team channel invite** — So you can follow updates, ask setup questions, and get support quickly during onboarding. 

A good first-day onboarding step is to ask your Tech Lead to go through this checklist with you before you begin setup. This saves time, avoids permission-related blockers, and makes sure you are using the same approved workflow as the rest of the team. 


## 📥 Cloning the Repository

Once you have the required tools installed and access to the project, the next step is to clone the repository to your local machine. The source code is managed in GitHub, and local development is designed to run from the repository using Docker Compose. 

Use the command below to clone the repository:

```bash
git clone <your-repository-url>
cd <your-project-folder>
```

If your Tech Lead has given you a specific repository URL, replace `<your-repository-url>` with that value. After cloning, move into the project folder before running any setup commands.

At a high level, the repository is organized like this:

```text
/apps
  /api                    ← NestJS backend
  /frontend               ← Next.js frontend
  /ai-services            ← FastAPI AI layer
  /transcription-service  ← Whisper speech-to-text service
/docker-compose.yml       ← runs everything locally
/docs                     ← architecture documents and guides
```

Here is what each top-level part means:

- **`/apps/api`** — This is the main backend service built with NestJS and TypeScript. It contains product logic, authentication, orchestration, and API workflows. 
- **`/apps/frontend`** — This is the frontend application built with Next.js and TypeScript. It is the user interface of the platform. 
- **`/apps/ai-services`** — This is the Python-based AI service built with FastAPI. It handles AI tasks such as summarization, embeddings, NLP, and retrieval workflows. 
- **`/apps/transcription-service`** — This is the transcription pipeline service. It uses FastAPI and Whisper for speech-to-text processing. 
- **`/docker-compose.yml`** — This file defines how the local development stack runs. It starts the application services and supporting infrastructure together. 
- **`/docs`** — This folder contains architecture documents, technical decisions, and onboarding guides that help you understand the system. 

> 💡 **Fresher tip:** Do not worry about understanding the full codebase on Day 1. First, learn what each folder is responsible for. That is enough to get started confidently.

---

## 🔐 Setting Up Secrets with Doppler

This project uses **Doppler** for secrets management. Real secrets are not stored in committed `.env` files, not baked into Docker images, and not expected to be manually copied around by developers. The approved architecture requires Doppler to inject secrets securely at runtime. 

This is important because the project uses many environment values such as database URLs, API keys, auth secrets, and monitoring tokens. Keeping them in one managed system makes onboarding safer and more consistent across local, development, staging, and production environments. 

Follow these steps to connect your machine to Doppler:

### 1. Install Doppler CLI

Install the Doppler CLI from the official documentation:

https://docs.doppler.com/docs/install-cli

### 2. Log in to Doppler

After installation, sign in from your terminal:

```bash
doppler login
```

This opens a browser window and connects your machine to your Doppler account.

### 3. Link your local project to Doppler

Inside the project folder, run:

```bash
doppler setup
```

This links your local repository to the correct Doppler project and environment so secrets can be injected when you run the app. The local setup flow in the architecture explicitly uses `doppler setup` before starting Docker Compose. 

### 4. Run commands with secrets injected

Once setup is complete, Doppler injects secrets at runtime when you run commands through it. For example:

```bash
doppler run -- docker compose up
```

In this model, your application code reads secrets as normal environment variables, such as `process.env.OPENAI_API_KEY`, without needing a real secrets file committed in the repo. The architecture explicitly states that no Doppler SDK is required in application code for this pattern. 

You should expect to see secrets such as these in the project environment:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `ASSEMBLYAI_API_KEY`
- `HUGGINGFACE_TOKEN`
- `MEILISEARCH_MASTER_KEY`
- `SENTRY_DSN`
- `BETTERSTACK_SOURCE_TOKEN`
- `INTERNAL_SERVICE_SECRET`
- `CLICKHOUSE_URL`
- `CLICKHOUSE_USER`
- `CLICKHOUSE_PASSWORD`

These are part of the documented Doppler secrets inventory used across environments in the architecture. 

A few important rules to remember:

- **Never create a `.env` file with real secrets and commit it to Git.** 
- **Never paste production keys into random local files or chat messages.** 
- **If a secret is missing, ask your Tech Lead or DevOps owner to verify your Doppler access instead of working around it manually.** 

> ⚠️ **Important:** If the project includes a sample file like `.env.example`, it is only for showing the variable names or local placeholders. Real secret values must still come from Doppler. 

## 🐳 Starting the Full Stack with Docker Compose

After cloning the repository and setting up Doppler, you can start the full local development stack with a single command. The project uses Docker Compose as the standard local orchestration tool so that all major services run together in a predictable way. 

Run this command from the root of the project:

```bash
doppler run -- docker compose up
```

This command starts the main application services along with the supporting local infrastructure. In the documented local setup, Docker Compose brings up the frontend, the NestJS API, the FastAPI AI services layer, the transcription service, PostgreSQL, Redis, and Meilisearch. 

Here is what gets started:

- **Frontend** — Next.js application for the UI. 
- **API** — NestJS backend for product logic and orchestration. 
- **AI Services** — FastAPI service for AI inference and related processing. 
- **Transcription Service** — FastAPI service for speech-to-text workflows. 
- **PostgreSQL** — Primary local relational database. 
- **Redis** — Cache and queue backing store. 
- **Meilisearch** — Search engine for fast text search behavior. 

If everything starts correctly, you should be able to access the following local URLs:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000  |
| NestJS API | http://localhost:3001  |
| AI Services | http://localhost:8000  |
| Transcription Service | http://localhost:8001  |

When containers are starting for the first time, Docker may take a few minutes to download base images, install dependencies, and build the services. This is normal, especially on a fresh laptop.

To stop the running services:

1. Press `Ctrl + C` in the terminal where Docker Compose is running.
2. Then cleanly stop and remove the containers with:

```bash
docker compose down
```

This stops the local stack but keeps your project files untouched.

A very common first-time issue is that Docker is installed but **Docker Desktop is not actually running**. If you get connection errors or Docker-related failures, open the Docker Desktop application first, wait for it to fully start, and then run the command again. Docker is the approved container platform for all services, and local development depends on it being available before Compose can start anything. 

> 💡 **Fresher tip:** If logs are moving in the terminal, that usually means the containers are running. If one service crashes, scroll up and read the first real error message instead of guessing.

---

## 🔌 Starting the Full Stack Natively (Without Docker)

If you prefer not to use Docker, or if your local machine is running low on memory/CPU resources, you can run all platform services natively on your local operating system.

### Prerequisites for Native Setup
Ensure you have the following installed on your host system:
1. **PostgreSQL 16** (locally via PostgresApp/Installer, or point to a remote instance like Supabase/Neon).
2. **Redis** (locally, or point to a cloud service like Upstash Redis).
3. **Node.js 20 LTS** & **pnpm**.
4. **Python 3.11** (required for `apps/ai-services`).

### Steps to Run Natively:

#### 1. Define Local Secrets (.env)
Instead of Doppler (or in combination with Doppler CLI), create a `.env` file in the root of your repository:
```env
# PostgreSQL Connection URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/revenue_intel?schema=public"

# Redis Server Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"

# AI services link
AI_SERVICE_URL="http://localhost:8000"
```

#### 2. Compile Database Client Mappings
To push models to your native database instance and generate workspace client types:
```bash
# Sequential client compilation to prevent file lock conflict on Windows
pnpm --workspace-concurrency=1 -r db:generate

# Sync models to native/cloud database
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

#### 3. Launch Next.js & NestJS Services
```bash
# Install root monorepo dependencies
pnpm install

# Start frontend and NestJS development servers in parallel
pnpm dev
```

#### 4. Launch Python FastAPI Services
Open a separate terminal window and execute:
```bash
cd apps/ai-services
python -m venv venv
source venv/bin/activate  # (On Windows: venv\Scripts\activate)
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

---

## 🗄️ Database Setup (Prisma Migrations)

The backend uses **Prisma** for database access and schema management. Prisma is part of the approved backend stack because it gives type-safe database queries and a clean migration workflow for PostgreSQL. 

After the local stack starts for the first time, open a new terminal and run these commands from the backend folder:

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

Here is what each command does:

- **`npx prisma migrate dev`** — Creates or applies the local database schema so your tables are ready to use.
- **`npx prisma generate`** — Generates Prisma client types for TypeScript so backend code can query the database safely.
- **`npx prisma db seed`** — Loads sample or test data if a seed script exists in the project.

If the project does not yet include a seed script, the last command may do nothing or return a message saying no seed is configured. That is fine.

To inspect the database visually in a browser, run:

```bash
npx prisma studio
```

This opens **Prisma Studio**, which gives you a simple UI to view tables, records, and relationships. It is very useful for freshers because it helps you see what is inside the database without writing SQL manually. Prisma is specifically included in the approved tool stack to make database work easier and safer for the team. 

> 💡 **Fresher tip:** Think of migrations as **version control for your database tables**. Just like Git tracks code changes, Prisma migrations track schema changes.
>
> ## ✅ Verifying Your Setup (Health Checks)

After starting the full stack, the next step is to confirm that the core services are actually running correctly. The architecture includes health endpoints so developers can quickly check whether the local API and internal services are alive before debugging deeper issues. 

Start by checking the NestJS API health endpoint:

```bash
# Check API health
curl http://localhost:3001/health
```

If the API is healthy, you should get a response similar to this:

```json
{ "status": "ok", "timestamp": "...", "version": "..." }
```

The architecture documents a public health check endpoint for the NestJS API that returns status information such as `status`, `timestamp`, and application version. 

Next, check the AI services health endpoint:

```bash
# Check AI services
curl http://localhost:8000/internal/health
```

If the AI service is running properly, you should see:

```json
{ "status": "ok" }
```

The system also defines an internal FastAPI health endpoint for the AI service, and this endpoint is used as part of service monitoring and deployment health validation. 

You should also open the frontend in your browser:

```text
http://localhost:3000
```

If the frontend is working, you should see the application load, typically at the login page or initial app screen. The local environment is designed to expose the main UI on `localhost:3000`. 

If something is not working, check Docker logs first. For example, to inspect API logs:

```bash
docker compose logs api
```

This is usually the fastest way to spot startup problems such as missing secrets, failed database connections, or container boot errors. Since the local stack runs through Docker Compose, service logs are the first place you should look before changing code. 

A few quick checks if a service fails:

- **API not responding** — check whether the `api` container started successfully in Docker logs. 
- **AI service not responding** — confirm the `ai-services` container is running and did not exit during startup. 
- **Frontend not loading** — make sure the frontend container is up and that the API is reachable. 
- **Everything fails at once** — confirm Docker Desktop is running and that `doppler run -- docker compose up` was used so secrets were injected correctly. 

> 💡 **Fresher tip:** If the health endpoint says `ok`, the service is alive. If the UI still looks broken, the issue is often in configuration, frontend code, or API connectivity, not in Docker itself.

---

## 🤖 Optional: Local AI Setup with Ollama

Ollama is a local AI runtime that lets you run open models on your own laptop instead of always calling a paid cloud API such as OpenAI. In this project, it is mainly useful for development, experimentation, and fallback planning rather than required day-one setup. 

We use Ollama when we want to do things like prompt experiments, offline testing, private local demos, or reduce API cost during development. The tooling inventory specifically describes Ollama as a practical fit for local summarization experiments, prompt testing, and backup AI workflows. 

You can install Ollama from:

```text
https://ollama.com
```

After installing it, pull a model locally:

```bash
ollama pull gemma3
```

Then run it to test that everything works:

```bash
ollama run gemma3
```

The tooling inventory recommends local model workflows like this for experimentation and notes that Gemma-family models are a practical starting point for local testing. 

When running locally, Ollama acts like a simple local model server. In the project context, it is useful because local AI runtimes can expose an API-style interface for experiments without depending on external provider calls, and the local endpoint is typically available at:

```text
http://localhost:11434
```

The project documentation treats Ollama as part of the approved offline AI toolbox for local prototyping, fallback design, and cost-controlled development. 

When should you use Ollama?

- **Use it for prompt experiments** when you want to try ideas quickly without spending API credits. 
- **Use it for offline testing** when internet access is unreliable or you do not want to send sample data to cloud providers. 
- **Use it for early AI feature development** when you are comparing prompts, model behavior, or fallback options. 

When do you **not** need it?

- If you are only working on frontend setup, backend APIs, auth, or database work, you can skip it for now.
- If you are a fresher joining the project, you do **not** need Ollama on Day 1.
- Set it up later when you begin working on AI-specific tasks.

> 💡 **Fresher tip:** Treat Ollama as an optional local lab for AI experiments. First get the app running, then learn Ollama when your work actually touches prompts, summaries, or model behavior.
>
> ## 🧪 Running Tests Locally

Before raising a pull request, you must run the relevant tests on your machine and make sure they pass. The project architecture treats testing as a mandatory quality gate, and CI will block a PR if required checks fail. 

### Backend tests (NestJS / Jest)

To run backend tests:

```bash
cd apps/api
npm run test
npm run test:e2e
```

What these commands mean:

- **`npm run test`** — Runs backend unit tests. These are usually Jest tests for services, utilities, guards, and smaller pieces of logic. 
- **`npm run test:e2e`** — Runs integration or end-to-end backend API tests. These usually verify HTTP behavior, auth, validation, and contract-level correctness. 

### AI service tests (Python / pytest)

To run AI service tests:

```bash
cd apps/ai-services
pytest
```

The Python AI layer uses `pytest` as the standard test framework. This is the approved testing tool for FastAPI and AI-service-side logic. 

### Frontend tests (Playwright)

To run frontend tests:

```bash
cd apps/frontend
npx playwright test
```

The project uses Playwright for realistic browser-based frontend testing. It is the recommended tool for validating UI flows such as auth, forms, dashboards, and major user journeys. 

### Important rule before PR

All required tests must pass before you raise a pull request. The CI pipeline on GitHub Actions runs test and validation stages automatically, and a failing test will block merge approval. 

The architecture also documents PR quality gates such as:

- Type checks
- Unit and integration tests
- Zod schema validation
- Prisma schema validation
- RLS enforcement checks
- Module boundary checks 

> 💡 **Fresher tip:** Run tests in small pieces while developing, not only at the end. It is much easier to fix one broken area early than many broken checks together before a PR.

---

## 🔄 Day-to-Day Development Workflow

This project follows a simple Git workflow centered around the `develop` branch. New work should be done in a feature branch, tested locally, and then raised as a pull request back to `develop`. The architecture also documents automated CI behavior on branch updates and merge flow through development and staging environments. 

Here is the normal day-to-day workflow:

### 1. Pull the latest code

Start by updating your local repository with the latest changes from `develop`:

```bash
git checkout develop
git pull origin develop
```

### 2. Create a feature branch

Create a new branch for your task:

```bash
git checkout -b feature/your-feature-name
```

Use a branch name that clearly describes your work. Keep it short and readable.

### 3. Write code and test locally

After creating your branch:

- Write your code
- Run the relevant tests locally
- Make sure your changes do not break the project
- Check logs or health endpoints if needed

This step is important because CI is there to confirm quality, not to discover basic avoidable mistakes. 

### 4. Push your branch and open a PR

Once your work is ready:

```bash
git push origin feature/your-feature-name
```

Then open a pull request targeting the `develop` branch. The architecture states that CI runs automatically on pull request creation and updates. 

### 5. CI runs automatically

After the PR is opened, the pipeline runs the standard checks automatically. The documented CI flow includes linting, type checks, tests, validation, Docker build checks, and environment-specific promotion steps. 

A simple way to think about it is:

- **Lint / type check**
- **Tests**
- **Build check**
- **Validation checks**
- **Review**
- **Merge** 

### 6. Tech Lead review and merge

After CI passes, the Tech Lead or reviewer checks the code. If the implementation follows the architecture rules and quality gates, the PR can be approved and merged. The architecture explicitly requires review discipline and approval before code moves forward. 

### Hot reload during development

Good news: local development is set up for speed. The local Docker Compose setup includes development-friendly volume mounting and overrides for hot reload, so frontend and backend changes can reflect automatically without restarting the whole stack each time. 

That means during normal local work:

- **Frontend changes** usually reflect automatically in the browser. 
- **Backend changes** usually reload automatically in development. 

> 💡 **Fresher tip:** If hot reload seems stuck, first check the container logs before restarting everything. Usually one service crashed or failed to rebuild correctly.

---

## 🚫 Rules Every Developer Must Know

These are not “nice-to-have suggestions.” These are hard architecture rules, and breaking them will usually get your PR rejected. The system is designed this way to keep the codebase secure, modular, and safe for multi-tenant production use. 

### 1. No secrets in committed `.env` files

Do **not** commit real secrets to Git. Secrets must be managed through Doppler, not through `.env` files inside the repository. The architecture explicitly states that secrets must not live in committed env files, Docker images, or random local files shared through the repo. 

### 2. No direct AI or LLM calls from NestJS code

TypeScript product services must **not** call OpenAI or other LLMs directly. All AI and ML logic belongs in the Python AI services layer, and NestJS should only coordinate with that service through internal APIs or async workflows. 

In simple words:

- **NestJS** = product logic and orchestration
- **Python AI services** = model inference and AI processing 

### 3. No cross-module database writes

One module must not directly write into another module’s database tables. If modules need to work together, they must communicate through events or public APIs. The architecture explicitly calls direct cross-module table access a violation. 

This rule exists because module boundaries are what make the system maintainable now and extractable later.

### 4. No careless typing in TypeScript

Do not use sloppy typing patterns where proper contracts should exist. The approved stack uses TypeScript and Zod specifically to keep request bodies, event payloads, and internal contracts explicit and safe. 

For freshers, the practical meaning is:

- Prefer typed interfaces and DTOs
- Use Zod schemas for validation
- Avoid weak typing shortcuts when building real feature code 

### 5. Every table must include `tenantId`

This platform is multi-tenant, so tenant isolation is non-negotiable. The architecture requires `tenantid` to be part of data ownership and indexing patterns so records are always scoped correctly to the right customer. 

A simple way to think about this:

- Without `tenantId`, data can mix across customers
- If customer data mixes, the platform is unsafe
- So every table and query must respect tenant boundaries 

### Quick rule list

- ❌ No secrets in `.env` files committed to Git — use Doppler only. 
- ❌ No direct AI or LLM calls from NestJS TypeScript code. 
- ❌ No cross-module database writes or hidden table sharing. 
- ❌ No weakly defined contracts where TypeScript and Zod should be used. 
- ✅ Every table must have `tenantId` for tenant isolation. 

> 💡 **Fresher tip:** If you are ever unsure whether something breaks an architecture rule, ask before coding. It is much faster to ask one small question than to rewrite a whole PR later.
>
> ## 🆘 Troubleshooting (Common Problems)

If something breaks during local setup, do not panic. Most fresher issues are small environment or configuration problems, and the architecture already assumes local development happens through Docker Compose, Doppler-managed secrets, Prisma migrations, and service-level health checks. 

Use this quick troubleshooting table first before asking for help:

| Problem | Fix |
|---|---|
| `docker compose up` fails | Make sure Docker Desktop is open and running, because local development depends on Docker Compose for the full stack.  |
| Port already in use | Run `docker compose down` first, then retry. This usually clears old containers or stuck port bindings from a previous session.  |
| `doppler: command not found` | Install the Doppler CLI first, because Doppler is the approved way to inject secrets into local services.  |
| Database migration error | Run `npx prisma migrate dev` again from the backend service directory and check whether your local database container is healthy. Prisma is the approved ORM and migration tool in this stack.  |
| API returns `401 Unauthorized` | Check that the required Supabase auth and JWT-related secrets are available through Doppler, because JWT validation is mandatory for protected endpoints.  |
| AI service not responding | Run `docker compose logs ai-services` and look for startup, dependency, or timeout errors, because the AI layer runs as a separate Python service.  |

### Extra fresher tips

- If one service keeps failing, check logs before rebuilding everything. Logs usually tell you whether it is a missing secret, bad migration, port conflict, or service crash. 
- If auth is failing, remember that most endpoints require a valid JWT, and the architecture uses Supabase Auth plus tenant-aware validation rules. 
- If the AI layer fails, do not debug it from NestJS first, because AI logic is intentionally separated into Python services. 

> 💡 **Fresher tip:** When asking for help, always share the exact command you ran, the full error message, and which service failed. That saves a lot of time for the reviewer or Tech Lead.

---

## 📚 What to Read Next

New engineers should not try to read everything randomly. The best approach is to follow the recommended reading order from the tooling inventory and then use the System Architecture Document for deeper design rules. 

### Reading order for everyone

All engineers should start with the tooling inventory because it explains the approved stack, usage rules, and why specific tools are chosen. The document also explicitly says it is both an inventory and a decision guide, which makes it especially useful for freshers. 

Recommended order for **all roles**:

- **Tooling & Services Inventory** → Sections **2, 4, 5, 6, 7**. 
- **System Architecture Document (SAD)** → Read the **Executive Summary first**. 

### Role-based reading path

Use the path that matches your role:

| Role | Read next |
|---|---|
| All roles | Tooling & Services Inventory → Sections 2, 4, 5, 6, 7.  |
| Frontend engineers | Section 10, then 14.1–14.4.  |
| Backend engineers | Section 11, 13, 14.2–14.5.  |
| AI/ML engineers | Section 8, 9, 12, 20.  |

### Why this order helps

This order is useful because it first teaches the approved stack, then shows how local setup, CI, backend rules, and AI boundaries actually work in this project. That reduces confusion and helps freshers avoid architecture mistakes early. 

A practical way to follow it is:

1. Read the **Tooling Inventory** sections for your role. 
2. Read the **SAD Executive Summary** to understand the big picture. 
3. Go deeper only into the sections related to the code you are touching. 

> 💡 **Fresher tip:** Do not try to memorize the whole architecture in one day. First understand the stack, then your module, then the rules that protect the platform.

---

## 📝 Document Revision History

This onboarding guide should maintain a simple revision history so new contributors know when it was created and who last updated it. The tooling inventory already includes a controlled change-log style, so keeping this section small and consistent is a good practice. 

| Version | Date | Updated By | Changes |
|---|---|---|---|
| 1.0 | April 2026 | Tech Lead | Initial fresher-friendly setup guide.  |

### Maintenance note

Any future update should keep this table current whenever setup steps, architecture rules, or required tools change. This helps the team avoid stale onboarding instructions and keeps fresher documentation trustworthy. 

