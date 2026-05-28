import re, os
from collections import defaultdict

root = r"C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\modules"
method_re = re.compile(r"@(Get|Post|Put|Patch|Delete)\(([^)]*)\)")
ctrl_re = re.compile(r"@Controller\(([^)]*)\)")

unique = defaultdict(set)
mods = sorted(d for d in os.listdir(root) if d.startswith("m0") and os.path.isdir(os.path.join(root, d)))

for mod in mods:
    modpath = os.path.join(root, mod)
    for dirpath, _, files in os.walk(modpath):
        if "node_modules" in dirpath or "generated" in dirpath:
            continue
        for f in files:
            if not f.endswith(".controller.ts"):
                continue
            text = open(os.path.join(dirpath, f), encoding="utf-8", errors="ignore").read()
            for ctrl in ctrl_re.findall(text):
                base = ctrl.strip("'\"")
                for m in method_re.finditer(text):
                    meth = m.group(1).upper()
                    route = m.group(2).strip("'\"")
                    full = base.rstrip("/")
                    if route:
                        full = f"{full}/{route.lstrip('/')}"
                    unique[mod].add(f"{meth} {full}")

print("Module (product)          | Endpoints (unique)")
print("--------------------------|-------------------")
total = 0
labels = {
    "m01-capture-transcription": "M01 Capture & Transcription",
    "m02-conversation-intelligence": "M02 Conversation Intelligence",
    "m03-ai-summaries-genai": "M03 AI Summaries & GenAI",
    "m04-deal-intelligence": "M04 Deal Intelligence",
    "m05-account-intelligence": "M05 Account Intelligence",
    "m06-forecasting-prediction": "M06 Forecasting & Prediction",
    "m07-revenue-dashboards": "M07 Revenue Dashboards",
    "m08-sales-engagement": "M08 Sales Engagement",
    "m09-coaching-training": "M09 Coaching & Training",
    "m10-data-compliance": "M10 Data & Compliance",
}
for mod in mods:
    c = len(unique[mod])
    total += c
    label = labels.get(mod, mod)
    print(f"{label:26} | {c}")
print("--------------------------|-------------------")
print(f"{'TOTAL (M01–M10 Nest)':26} | {total}")
