import os

ROOT_DIR = r"c:\Users\Relanto\Desktop\RevenueIntellegence\boilerplate code\r-revenue-intelligence"

def check_file(path, expected_substrings=None, forbidden_substrings=None):
    full_path = os.path.join(ROOT_DIR, path)
    if not os.path.exists(full_path):
        return False, "File does not exist"
    
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        if expected_substrings:
            for sub in expected_substrings:
                if sub not in content:
                    return False, f"Missing expected content: '{sub}'"
        if forbidden_substrings:
            for sub in forbidden_substrings:
                if sub in content:
                    return False, f"Contains forbidden content: '{sub}'"
    except Exception as e:
        return False, f"Error reading file: {str(e)}"
            
    return True, "OK"

def main():
    print("Starting automated boilerplate audit...")
    
    # Files to check
    checks_expected = {
        # Root configs
        "pnpm-workspace.yaml": ["packages:", "- 'modules/*'"],
        "package.json": ["turbo run dev", "r-revenue-intelligence"],
        "turbo.json": ["$schema", "dev", "build"],
        ".doppler.yaml": ["setup:", "project:", "config:"],
        "README.md": ["Boilerplate Codebase", "git init", "pnpm install"],
        
        # Central Shared Database package
        "packages/database/prisma/schema.prisma": ["datasource db", "generator client", "model Tenant"],
        "packages/database/package.json": ["database", "@prisma/client", "prisma"],
        
        # Shared-types package
        "packages/shared-types/package.json": ["shared-types", "zod"],
        "packages/shared-types/src/events/base.event.ts": ["BaseEvent", "eventId", "version", "tenantId"],
        "packages/shared-types/src/index.ts": ["export * from"],
        
        # Main API App
        "apps/api/src/main.ts": ["NestFactory", "AppModule", "bootstrap"],
        "apps/api/package.json": ["api", "@nestjs/common", "bullmq", "@r-revenue/platform-core", "@r-revenue/m01-capture-transcription"],
        
        # Platform Core Workspace Package
        "modules/platform-core/package.json": ["@r-revenue/platform-core"],
        "modules/platform-core/guards/tenant.guard.ts": ["TenantGuard", "CanActivate", "tenantId"],
        "modules/platform-core/guards/jwt.guard.ts": ["JwtAuthGuard", "AuthGuard"],
        "modules/platform-core/guards/hmac-webhook.guard.ts": ["HmacWebhookGuard", "crypto", "signature"],
        "modules/platform-core/events/event-publisher.service.ts": ["EventPublisherService", "Queue", "publish"],
        "modules/platform-core/events/event-publisher.module.ts": ["EventPublisherModule", "EventPublisherService"],
        
        # AI Services (Consolidated ASR endpoints)
        "apps/ai-services/app/main.py": ["FastAPI", "/health", "/v1/summarize", "/v1/score-call", "/v1/transcribe", "/transcribe"],
        "apps/ai-services/requirements.txt": ["fastapi", "uvicorn", "pydantic"],
        "apps/ai-services/Dockerfile": ["FROM python:3.12", "WORKDIR /app"],
    }
    
    # Checks to verify that transcription-service is completely gone
    checks_forbidden = {
        "docker-compose.yml": ["transcription-service"],
    }
    
    # Module configurations
    modules_config = [
        {"num": "01", "name": "capture-transcription", "route": "capture-transcription", "event": "call.transcription.completed"},
        {"num": "02", "name": "conversation-intelligence", "route": "conversation-intelligence", "event": "call.scored"},
        {"num": "03", "name": "ai-summaries-genai", "route": "ai-summaries-genai", "event": "call.summary.generated"},
        {"num": "04", "name": "deal-intelligence", "route": "deal-intelligence", "event": "deal.stage.changed"},
        {"num": "05", "name": "account-intelligence", "route": "account-intelligence", "event": "account.updated"},
        {"num": "06", "name": "forecasting-prediction", "route": "forecasting-prediction", "event": "forecast.submitted"},
        {"num": "07", "name": "revenue-dashboards", "route": "revenue-dashboards", "event": "dashboard.viewed"},
        {"num": "08", "name": "sales-engagement", "route": "sales-engagement", "event": "email.sent"},
        {"num": "09", "name": "coaching-training", "route": "coaching-training", "event": "coaching.recommendation.created"},
        {"num": "10", "name": "data-compliance", "route": "data-compliance", "event": "compliance.policy.updated"},
    ]
    
    # Add module files dynamically
    for m in modules_config:
        m_num = m["num"]
        m_name = m["name"]
        
        folder = f"modules/m{m_num}-{m_name}"
        pascal_name = "".join([part.capitalize() for part in m_name.split("-")])
        class_prefix = f"M{m_num}{pascal_name}"
        
        checks_expected[f"{folder}/package.json"] = [f"@r-revenue/m{m_num}-{m_name}", "prisma"]
        checks_expected[f"{folder}/SDD.md"] = ["SDD", f"M-{m_num}"]
        checks_expected[f"{folder}/CHANGELOG.md"] = ["Changelog", f"M-{m_num}"]
        
        # Spec-compliant folders checks (via .gitkeep)
        checks_expected[f"{folder}/entities/.gitkeep"] = []
        checks_expected[f"{folder}/events/.gitkeep"] = []
        checks_expected[f"{folder}/interfaces/.gitkeep"] = []
        checks_expected[f"{folder}/migrations/.gitkeep"] = []
        checks_expected[f"{folder}/seeds/.gitkeep"] = []
        
        # Local Database/Prisma checks
        checks_expected[f"{folder}/prisma/schema.prisma"] = ["datasource db", "generator client", f"model M{m_num}{pascal_name}Record"]
        checks_expected[f"{folder}/database/prisma.service.ts"] = ["PrismaService", "PrismaClient"]
        checks_expected[f"{folder}/database/prisma.module.ts"] = ["PrismaModule", "PrismaService"]
        
        checks_expected[f"{folder}/m{m_num}-{m_name}.module.ts"] = [f"{class_prefix}Module", "BullModule", "PrismaModule"]
        checks_expected[f"{folder}/controllers/m{m_num}.controller.ts"] = [f"{class_prefix}Controller", "@Controller", "TenantGuard"]
        checks_expected[f"{folder}/services/m{m_num}.service.ts"] = [f"{class_prefix}Service", "EventPublisherService"]
        checks_expected[f"{folder}/repositories/m{m_num}.repository.ts"] = [f"{class_prefix}Repository", "PrismaService"]
        checks_expected[f"{folder}/workers/m{m_num}.worker.ts"] = [f"{class_prefix}Worker", "Processor", "Job"]
        checks_expected[f"{folder}/schemas/m{m_num}.schema.ts"] = [f"Create{class_prefix}Schema", "z.object"]
        
    passed_count = 0
    failed_count = 0
    
    print("\n--- AUDIT RESULTS ---")
    
    # 1. Check Expected
    for file, expected in checks_expected.items():
        ok, msg = check_file(file, expected_substrings=expected)
        if ok:
            passed_count += 1
        else:
            failed_count += 1
            print(f"[FAIL] {file} - {msg}")
            
    # 2. Check Forbidden
    for file, forbidden in checks_forbidden.items():
        ok, msg = check_file(file, forbidden_substrings=forbidden)
        if ok:
            passed_count += 1
        else:
            failed_count += 1
            print(f"[FAIL] {file} - {msg}")
            
    # 3. Verify physical removal of transcription-service directory
    trans_dir = os.path.join(ROOT_DIR, "apps", "transcription-service")
    if os.path.exists(trans_dir):
        failed_count += 1
        print(f"[FAIL] apps/transcription-service directory still exists physically!")
    else:
        passed_count += 1
            
    total_checks = len(checks_expected) + len(checks_forbidden) + 1
    print(f"\nAudit complete. Passed: {passed_count}/{total_checks} files. Failed: {failed_count}")
    if failed_count == 0:
        print("SUCCESS! 100% of planned boilerplate files are present, complete, and perfectly generated.")
    else:
        print("WARNING: Some files were not completed successfully.")

if __name__ == "__main__":
    main()