"""Pruebas de tools/informe_actualizacion.py sobre un repositorio git temporal."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import informe_actualizacion as ia  # noqa: E402


class Informe(unittest.TestCase):
    def test_slug(self):
        self.assertEqual(ia.slug("Menú de marcas: ¡nuevo!"), "menu-de-marcas-nuevo")

    def test_areas(self):
        self.assertEqual(ia.areas(["sitio/admin/a.js", "sitio/admin/b.css", "docs/x.md", "raro.txt"]),
                         {"Administrador": 2, "Documentación": 1, "Otros": 1})

    def test_informe_de_un_repo_temporal(self):
        with tempfile.TemporaryDirectory() as d:
            def g(*a):
                subprocess.run(["git", *a], cwd=d, check=True, capture_output=True)
            g("init", "-q"); g("config", "user.email", "t@t"); g("config", "user.name", "t")
            (Path(d) / "a.txt").write_text("1"); g("add", "."); g("commit", "-qm", "base")
            (Path(d) / "sitio").mkdir(); (Path(d) / "sitio/admin").mkdir()
            (Path(d) / "sitio/admin/x.js").write_text("2"); g("add", "."); g("commit", "-qm", "Mejora del administrador")
            ia.ROOT = Path(d)
            t = ia.informe("Prueba", "HEAD~1", "HEAD", "2026-12-02")
            self.assertIn("Mejora del administrador", t)
            self.assertIn("Administrador: 1 archivo", t)
            self.assertIn("COMPLETAR", t)       # el informe no sale sin explicación humana
            self.assertIn("git revert", t)


if __name__ == "__main__":
    unittest.main()
