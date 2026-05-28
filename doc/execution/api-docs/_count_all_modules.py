import os
import re

ROOT = r"C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\modules"
METHOD_RE = re.compile(r"@(Get|Post|Put|Patch|Delete)\(([^)]*)\)")
CTRL_RE = re.compile(r"@Controller\(([^)]*)\)")


def parse_file(path: str) -> list[tuple[str, str]]:
    text = open(path, encoding="utf-8", errors="ignore").read()
    routes: list[tuple[str, str]] = []
    current_base: str | None = None
    for line in text.splitlines():
        cm = CTRL_RE.search(line)
        if cm:
            current_base = cm.group(1).strip("'\"")
            continue
        mm = METHOD_RE.search(line)
        if mm and current_base:
            meth = mm.group(1).upper()
            route = mm.group(2).strip("'\"")
            full = current_base.rstrip("/")
            if route:
                full = f"{full}/{route.lstrip('/')}"
            routes.append((meth, full))
    return routes


def main():
    rows: list[tuple[str, int, int]] = []
    grand = 0
    for mod in sorted(os.listdir(ROOT)):
        if not mod.startswith("m0") or not os.path.isdir(os.path.join(ROOT, mod)):
            continue
        modpath = os.path.join(ROOT, mod)
        all_routes: list[tuple[str, str]] = []
        for dirpath, _, files in os.walk(modpath):
            if "node_modules" in dirpath or "generated" in dirpath:
                continue
            for f in files:
                if not f.endswith(".controller.ts"):
                    continue
                all_routes.extend(parse_file(os.path.join(dirpath, f)))
        unique = len(set(all_routes))
        rows.append((mod, unique, len(all_routes)))
        grand += unique

    print(f"{'Module':<42} {'Unique':>8} {'Decorators':>10}")
    print("-" * 62)
    for mod, u, d in rows:
        short = mod.split("-")[0].upper()  # M01, M02, ...
        print(f"{short + ' ' + mod:<42} {u:>8} {d:>10}")
    print("-" * 62)
    print(f"{'GRAND TOTAL (unique METHOD+path)':<42} {grand:>8}")


if __name__ == "__main__":
    main()
