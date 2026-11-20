"""Pruebas de tools/aplicar_revision.py sin red ni procesos (todo lo externo se simula)."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import aplicar_revision as ar  # noqa: E402

VIEJA, NUEVA = "https://www.marca.com/viejo/m-1", "https://www.marca.com/nuevo/m-1"


def paquete(raiz: Path, marca="beneteau", slug="m-1"):
    base = raiz / "biblioteca" / marca / slug
    for rel in ar.ARCHIVOS_DIRECCION + ["07_FUENTES/extract/S1-m-1.page.json"]:
        f = base / rel
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(f"fuente {VIEJA} fin")
    return base


class ActualizarDireccion(unittest.TestCase):
    def test_cambia_la_direccion_en_el_paquete_y_deja_intacta_la_captura(self):
        with tempfile.TemporaryDirectory() as d:
            base = paquete(Path(d))
            msg = ar.actualizar_direccion(Path(d), {"marca": "beneteau", "slug": "m-1", "url": VIEJA, "destino": NUEVA})
            self.assertIn("8 archivos", msg)
            for rel in ar.ARCHIVOS_DIRECCION:
                self.assertIn(NUEVA, (base / rel).read_text())
            self.assertIn(VIEJA, (base / "07_FUENTES/extract/S1-m-1.page.json").read_text())  # la captura original no se toca

    def test_rechaza_datos_peligrosos_o_un_paquete_inexistente(self):
        with tempfile.TemporaryDirectory() as d:
            paquete(Path(d))
            for mal in [{"marca": "../x", "slug": "m-1", "url": VIEJA, "destino": NUEVA},
                        {"marca": "beneteau", "slug": "m-1", "url": "javascript:1", "destino": NUEVA},
                        {"marca": "beneteau", "slug": "no-existe", "url": VIEJA, "destino": NUEVA}]:
                with self.assertRaises(ValueError):
                    ar.actualizar_direccion(Path(d), mal)


class FakeProc:
    def __init__(self, out="", rc=0):
        self.stdout, self.stderr, self.returncode = out, "", rc


class Orquesta(unittest.TestCase):
    def test_un_paso_que_falla_no_frena_a_los_demas_y_marca_incompleto(self):
        with tempfile.TemporaryDirectory() as d:
            paquete(Path(d))
            f = Path(d) / "ap.json"
            f.write_text(json.dumps({"actualizar": [{"marca": "beneteau", "slug": "m-1", "url": VIEJA, "destino": NUEVA},
                                                    {"marca": "beneteau", "slug": "fantasma", "url": VIEJA, "destino": NUEVA}], "cargar": []}))
            r = ar.aplicar(f, ar.Contexto(raiz=d))
            self.assertEqual(len(r["hecho"]), 1)
            self.assertEqual(len(r["errores"]), 1)
            self.assertFalse(r["completo"])

    def test_solo_direcciones_bien_aplicadas_es_completo(self):
        with tempfile.TemporaryDirectory() as d:
            paquete(Path(d))
            f = Path(d) / "ap.json"
            f.write_text(json.dumps({"actualizar": [{"marca": "beneteau", "slug": "m-1", "url": VIEJA, "destino": NUEVA}], "cargar": []}))
            self.assertTrue(ar.aplicar(f, ar.Contexto(raiz=d))["completo"])

    def test_cargar_marca_sin_adaptador_se_informa_como_error(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "biblioteca").mkdir()
            f = Path(d) / "ap.json"
            f.write_text(json.dumps({"cargar": [{"marca": "marca-rara", "url": "https://x.com/a/b", "titulo": "B"}], "actualizar": []}))
            r = ar.aplicar(f, ar.Contexto(raiz=d))
            self.assertEqual(len(r["errores"]), 1)
            self.assertIn("adaptador", r["errores"][0])

    def test_web_que_no_se_puede_leer_no_inventa_nada(self):
        with tempfile.TemporaryDirectory() as d:
            raiz = Path(d)
            (raiz / "biblioteca").mkdir()
            (raiz / "tools/oceanic/adapters").mkdir(parents=True)
            (raiz / "tools/oceanic/adapters/beneteau.py").write_text("")
            f = raiz / "ap.json"
            f.write_text(json.dumps({"cargar": [{"marca": "beneteau", "url": "https://www.beneteau.com/x/y", "titulo": "Y"}], "actualizar": []}))
            ctx = ar.Contexto(raiz=raiz, traer=lambda u: ar.rm.Respuesta(403, u, error="captcha"))
            r = ar.aplicar(f, ctx)
            self.assertFalse(r["completo"])
            self.assertIn("no se pudo leer", r["errores"][0])


class IA(unittest.TestCase):
    def test_traduccion_incompleta_se_rechaza(self):
        with self.assertRaises(ValueError):
            ar.traducir_lote(["a", "b"], "k", ia=lambda s, u, c, m=0: json.dumps(["solo una"]))
        self.assertEqual(ar.traducir_lote(["a"], "k", ia=lambda s, u, c, m=0: 'Aquí va: ["uno"]'), ["uno"])

    def test_borrador_sin_las_claves_pedidas_se_rechaza(self):
        with self.assertRaises(ValueError):
            ar.redactar_borrador({"page_title": "X", "sections": [], "specifications": []}, "k", ia=lambda s, u, c, m=0: json.dumps({"hero": {}}))


if __name__ == "__main__":
    unittest.main()
