"""Oceanic Content Engine CLI.

    cd tools
    python -m oceanic extract axopar <raw.html> <url> <out.json>
    python -m oceanic render     <model_dir>   # tabla + specifications.md + validación
    python -m oceanic media      <model_dir>   # descarga imágenes y documentos
    python -m oceanic readiness  <model_dir>   # CONTENT_STATUS
    python -m oceanic check      [biblioteca]  # render + readiness de todos los modelos
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

from . import media, readiness, specs

ROOT = Path(__file__).resolve().parents[2]


def _models(base: Path):
    return sorted(p.parent.parent for p in base.glob("*/*/00_MODELO/00_MODELO.md"))


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 1
    cmd, args = argv[0], argv[1:]
    if cmd == "extract":
        brand, raw, url, out = args
        adapter = __import__(f"oceanic.adapters.{brand}", fromlist=["extract"])
        data = adapter.extract(Path(raw).read_text(), url, date.today().isoformat())
        Path(out).write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
        print(f"{len(data['images'])} imágenes, {len(data['videos'])} videos -> {out}")
        return 0
    if cmd == "render":
        errors = specs.render(Path(args[0]))
        for e in errors:
            print("ERROR", e)
        return 1 if errors else 0
    if cmd == "media":
        model = Path(args[0])
        print("imágenes:", media.download_images(model))
        print("documentos:", media.download_documents(model))
        readiness.write(model)
        return 0
    if cmd == "readiness":
        result = readiness.write(Path(args[0]))
        print(result["CONTENT_STATUS"], f"{result['completeness_pct']}%")
        for k, v in result["items"].items():
            print(f"  {v['status']:8} {v['group']:10} {k:16} {v['detail']}")
        return 0
    if cmd == "check":
        base = Path(args[0]) if args else ROOT / "biblioteca"
        failed = 0
        for model in _models(base):
            errors = specs.render(model)
            result = readiness.write(model)
            print(f"{result['CONTENT_STATUS']:6} {model.relative_to(base)}")
            for e in errors:
                print("   ERROR", e)
            failed += bool(errors)
        return 1 if failed else 0
    print(__doc__)
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
