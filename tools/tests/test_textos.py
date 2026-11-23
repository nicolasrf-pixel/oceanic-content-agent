"""Textos editables del sitio (tools/sitio_textos.py): etiquetas estables, únicas y sin cambiar lo que se ve."""
import json
import re
import sys
import unittest
from pathlib import Path

TOOLS = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(TOOLS))
import sitio_textos as t  # noqa: E402

WEB = TOOLS.parent / "sitio"


def sin_marcas(html: str) -> str:
    html = re.sub(r' data-t="[^"]*"', "", html)
    return re.sub(r'<script src="[./]*assets/js/textos-data\.js"></script>\n<script src="[./]*assets/js/textos\.js"></script>\n', "", html)


class PruebasTextos(unittest.TestCase):
    def test_nada_pendiente_de_etiquetar(self):
        self.assertEqual(t.main(revisar=True), 0, "hay textos sin etiquetar: corre python3 tools/sitio_textos.py")

    def test_ids_unicos_y_lista_completa(self):
        base = json.loads(t.BASE.read_text(encoding="utf8"))
        for p in base["paginas"]:
            html = (WEB / p["archivo"]).read_text(encoding="utf8")
            ids = re.findall(r'data-t="([^"]+)"', html)
            self.assertEqual(len(ids), len(set(ids)), f"ids repetidos en {p['pagina']}")
            lista = {i["id"] for i in p["items"] if not re.search(r"\.(titulo|desc)$", i["id"])}
            self.assertEqual(lista, set(ids), f"la lista de {p['pagina']} no coincide con el HTML")

    def test_las_etiquetas_no_cambian_lo_que_se_ve(self):
        """Quitar data-t y los dos scripts deja exactamente el HTML sin etiquetar: no se tocó nada más."""
        for clave, ruta in t.paginas():
            actual = ruta.read_text(encoding="utf8")
            limpio = sin_marcas(actual)
            self.assertNotIn("data-t=", limpio)
            # volver a etiquetar el HTML limpio da lo mismo que hay hoy (misma numeración)
            copia = ruta.with_name("_prueba_" + ruta.name)
            try:
                copia.write_text(limpio, encoding="utf8")
                items, _ = t.etiquetar(clave, copia, escribir=True)
                self.assertEqual(copia.read_text(encoding="utf8"), actual, f"{clave}: etiquetar de cero no reproduce el HTML actual")
            finally:
                copia.unlink(missing_ok=True)

    def test_no_se_etiqueta_lo_que_arma_javascript_ni_scripts(self):
        inicio = (WEB / "index.html").read_text(encoding="utf8")
        for sec in ("puertoHome", "bgrid", "u-txt", "uc-txt", "hhero-in"):
            for m in re.finditer(r'<div[^>]*(?:id|class)="[^"]*\b' + sec + r'\b[^"]*"[^>]*data-t=', inicio):
                self.fail(f"{sec} no debería estar etiquetado")
        for ruta in WEB.rglob("*.html"):
            for m in re.finditer(r"<(script|style)\b[^>]*data-t=", ruta.read_text(encoding="utf8")):
                self.fail(f"{ruta}: etiqueta en <{m.group(1)}>")

    def test_los_ids_siguen_el_formato_que_valida_el_servidor(self):
        for p in json.loads(t.BASE.read_text(encoding="utf8"))["paginas"]:
            for i in p["items"]:
                self.assertRegex(i["id"], r"^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:\d{3,5}|titulo|desc)$")


if __name__ == "__main__":
    unittest.main()
