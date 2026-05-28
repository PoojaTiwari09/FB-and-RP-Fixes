"""Count routes per controller class (not cross-multiplying decorators in one file)."""
import os
import re

root = r"C:\Users\Relanto\Downloads\final_product\r-revenue-intelligence-monorepo\boilerplate code\r-revenue-intelligence\modules"

METHOD_RE = re.compile(r"@(Get|Post|Put|Patch|Delete)\(([^)]*)\)")
CTRL_RE = re.compile(r"@Controller\(([^)]*)\)")


def parse_file(path: str) -> list[tuple[str, str]]:
    """Return list of (METHOD, full_path) for each route in file."""
    text = open(path, encoding="utf-8", errors="ignore").read()
    routes: list[tuple[str, str]] = []
    current_base: str | None = None

    # Walk line by line to bind methods to the latest @Controller above them
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
    for mod in sorted(os.listdir(root)):
        if not mod.startswith("m0") or not os.path.isdir(os.path.join(root, mod)):
            continue
        if mod not in ("m03-ai-summaries-genai", "m09-coaching-training"):
            continue

        all_routes: list[tuple[str, str]] = []
        per_file: dict[str, list[tuple[str, str]]] = {}

        modpath = os.path.join(root, mod)
        for dirpath, _, files in os.walk(modpath):
            if "node_modules" in dirpath or "generated" in dirpath:
                continue
            for f in sorted(files):
                if not f.endswith(".controller.ts"):
                    continue
                fp = os.path.join(dirpath, f)
                rel = os.path.relpath(fp, modpath)
                rs = parse_file(fp)
                per_file[rel] = rs
                all_routes.extend(rs)

        unique = set(all_routes)
        print(f"\n=== {mod} ===")
        print(f"Per-file (line-scoped controllers):")
        for rel, rs in sorted(per_file.items()):
            print(f"  {rel}: {len(rs)} routes, {len(set(rs))} unique")
        print(f"File total (sum): {len(all_routes)}")
        print(f"Module unique METHOD+path: {len(unique)}")
        print("Paths:")
        for meth, path in sorted(unique):
            print(f"  {meth:6} {path}")


if __name__ == "__main__":
    main()
