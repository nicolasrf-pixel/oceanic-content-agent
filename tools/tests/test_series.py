"""Líneas de producto: cada modelo de una marca con reglas tiene serie, y las series del catálogo coinciden con tools/series.json."""
import json
import sys
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(TOOLS))
import series  # noqa: E402

CATALOGO = TOOLS.parent / "sitio" / "assets" / "js" / "catalogo-data.js"


def catalogo():
    t = CATALOGO.read_text(encoding="utf8")
    return json.loads(t[t.index("=", t.index("window.")) + 1:t.rindex(";")])


class PruebasSeries(unittest.TestCase):
    def test_reglas_bien_formadas(self):
        for marca, reglas in series.REGLAS.items():
            if marca.startswith("_"):
                continue
            ids = [r["id"] for r in reglas]
            self.assertEqual(len(ids), len(set(ids)), f"ids repetidos en {marca}")
            for r in reglas:
                self.assertTrue(r["nombre"] and r["patron"], f"{marca}/{r['id']} incompleta")

    def test_todo_modelo_tiene_serie(self):
        cat = catalogo()
        for marca, reglas in series.REGLAS.items():
            if marca.startswith("_"):
                continue
            ids = {r["id"] for r in reglas}
            for m in cat[marca]["modelos"]:
                self.assertIn(m.get("serie"), ids, f"{marca}/{m['slug']} sin serie válida: agrégala en tools/series.json y corre tools/series.py")

    def test_catalogo_al_dia(self):
        cat = catalogo()
        copia = json.loads(json.dumps(cat))
        self.assertEqual(series.aplicar(copia), [], "hay modelos sin serie")
        self.assertEqual(copia, cat, "el catálogo no tiene las series al día: corre python3 tools/series.py")

    def test_asignacion_aquila_pedida_por_el_cliente(self):
        esperado = {"aquila-36-molokai": "molokai", "aquila-47-molokai": "molokai", "aquila-32-sport": "sport", "aquila-45-sport": "sport",
                    "aquila-42-coupe": "coupe", "aquila-46-coupe": "coupe", "aquila-42-yacht": "yacht", "aquila-54-yacht": "yacht",
                    "aquila-70-luxury": "luxury", "aquila-45-sail": "sail"}
        for slug, s in esperado.items():
            self.assertEqual(series.serie_de("aquila", slug), s)

    def test_marcas_sin_reglas_no_se_agrupan(self):
        cat = {"excess": {"nombre": "Excess", "modelos": [{"slug": "excess-11", "serie": "x"}], "series": [1]}}
        self.assertEqual(series.aplicar(cat), [])
        self.assertNotIn("serie", cat["excess"]["modelos"][0])
        self.assertNotIn("series", cat["excess"])


if __name__ == "__main__":
    unittest.main()
