# R-Revenue Intelligence Boilerplate Codebase

This is the fully scaffolded boilerplate for R-Revenue Intelligence codebase.

## Repository Setup
1. Open this folder in terminal.
2. Run `git init`.
3. Create a GitHub repo and add it as a remote: `git remote add origin <url>`.
4. Create develop branch: `git checkout -b develop`.
5. Add all files, commit, and push:
   ```bash
   git add .
   git commit -m "chore: scaffold modular monolith boilerplate with platform core and 10 modules"
   git push -u origin develop
   ```

## Development
- Root run: `pnpm install` then `pnpm dev` (orchestrated by Turborepo).
- Every module contains its own **SDD.md** for its respective engineering team of 2.

## GitHub Spec Kit Integration (Spec-Driven Development)
This repository is pre-configured with **GitHub Spec Kit** for AI-guided Spec-Driven Development (SDD).
The `.specify/` folder contains:
- `memory/constitution.md`: The platform's non-negotiable architectural principles (rules).
- `templates/`: Structured templates for specifications, technical plans, and task lists.

### How to use Spec Kit with AI agents (e.g. Claude Code, Copilot, Cursor):
1. **Initialize Feature Spec:** Create a new spec file under `.specify/specs/spec-your-feature.md` using the template `templates/specify.md`.
2. **AI Analysis & Plan:** Ask the AI agent to read `.specify/memory/constitution.md` and your spec to construct a technical design plan in `.specify/plans/plan-your-feature.md` using `templates/plan.md`.
3. **Task Generation:** Let the AI generate a phased task checklist in `.specify/tasks/tasks-your-feature.md` using `templates/tasks.md`.
4. **Automated Implementation:** Direct the AI agent to implement the codebase changes following the tasks sequence step-by-step, ensuring absolute compliance with `constitution.md`.

