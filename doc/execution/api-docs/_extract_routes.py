import re, os
root = r"C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\modules"
mods = sorted(
    d
    for d in os.listdir(root)
    if d.startswith("m0") and os.path.isdir(os.path.join(root, d))
)
method_re = re.compile(r"@(Get|Post|Put|Patch|Delete)\(([^)]*)\)")
ctrl_re = re.compile(r"@Controller\(([^)]*)\)")

for mod in mods:
    modpath = os.path.join(root, mod)
    print(f"\n=== {mod} ===")
    for dirpath, _, files in os.walk(modpath):
        if "node_modules" in dirpath or "generated" in dirpath:
            continue
        for f in sorted(files):
            if not f.endswith(".controller.ts"):
                continue
            path = os.path.join(dirpath, f)
            text = open(path, encoding="utf-8", errors="ignore").read()
            controllers = ctrl_re.findall(text)
            if not controllers:
                continue
            for ctrl in controllers:
                base = ctrl.strip("'\"")
                for m in method_re.finditer(text):
                    meth = m.group(1).upper()
                    route = m.group(2).strip("'\"")
                    if route.startswith("'") or route.startswith('"'):
                        route = route.strip("'\"")
                    full = base.rstrip("/")
                    if route:
                        full = f"{full}/{route.lstrip('/')}"
                    print(f"{meth:6} /{full}")
