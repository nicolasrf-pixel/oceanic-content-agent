"""Pruebas de tools/revisar_marcas.py con una web simulada (sin red)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import revisar_marcas as rm  # noqa: E402

R = rm.Respuesta


def web(paginas):
    """paginas: {url: Respuesta | str}. Lo que no está responde 404."""
    def leer(url):
        v = paginas.get(url)
        if v is None:
            return R(404, url, error="HTTP 404")
        return R(200, url, v) if isinstance(v, str) else v
    return leer


MODELOS = [
    {"slug": "m-1", "url": "https://www.marca.com/barcos/m-1", "indices": ["https://www.marca.com/gama"]},
    {"slug": "m-2", "url": "https://www.marca.com/barcos/m-2", "indices": ["https://www.marca.com/gama"]},
    {"slug": "m-3", "url": "https://www.marca.com/barcos/m-3", "indices": ["https://www.marca.com/gama"]},
]
GAMA = '<a href="/barcos/m-1/">M1</a> <a href="/barcos/m-2">M2</a> <a href="/barcos/m-4">M4</a> <a href="/barcos/configurator">c</a>'


class Normalizar(unittest.TestCase):
    def test_norm(self):
        self.assertEqual(rm.norm("https://WWW.Marca.com/a/B/?x=1#y"), "marca.com/a/b")
        self.assertEqual(rm.padre("marca.com/a/b"), "marca.com/a")


class Enlaces(unittest.TestCase):
    def test_href_y_datos_embebidos(self):
        t = '<a href="/a/uno">x</a> {"url":"\\/a\\/dos"} https://otra.com/z'
        e = rm.enlaces(t, "https://marca.com/gama")
        self.assertIn("https://marca.com/a/uno", e)
        self.assertIn("https://marca.com/a/dos", e)
        self.assertIn("https://otra.com/z", e)


class RevisarMarca(unittest.TestCase):
    def revisar(self, paginas, modelos=MODELOS, marca="x"):
        return rm.revisar_marca(marca, modelos, leer=web(paginas), pausa=0)

    def test_nuevo_y_retirado(self):
        r = self.revisar({"https://www.marca.com/gama": GAMA, "https://www.marca.com/barcos/m-4": "<title>M4 | Marca</title>"})
        self.assertEqual(r["estado"], "ok")
        self.assertEqual([x["url"] for x in r["nuevos"]], ["https://www.marca.com/barcos/m-4"])
        self.assertEqual(r["nuevos"][0]["titulo"], "M4 | Marca")
        self.assertEqual([x["slug"] for x in r["retirados"]], ["m-3"])  # m-3 no está en la gama y responde 404
        self.assertEqual(r["movidos"], [])

    def test_palabras_que_no_son_fichas_se_ignoran(self):
        r = self.revisar({"https://www.marca.com/gama": GAMA, "https://www.marca.com/barcos/m-4": "x",
                          "https://www.marca.com/barcos/configurator": "x"})
        self.assertNotIn("configurator", str(r["nuevos"]))

    def test_fuera_de_la_gama_pero_viva_no_se_informa(self):
        r = self.revisar({"https://www.marca.com/gama": GAMA, "https://www.marca.com/barcos/m-4": "x",
                          "https://www.marca.com/barcos/m-3": "sigue viva"})
        self.assertEqual(r["retirados"], [])
        self.assertEqual(r["movidos"], [])

    def test_movido_no_es_nuevo_ni_retirado(self):
        gama = GAMA + '<a href="/anteriores-2016-2020/m-3">M3</a>'
        paginas = {"https://www.marca.com/gama": gama,
                   "https://www.marca.com/barcos/m-3": R(200, "https://www.marca.com/anteriores-2016-2020/m-3", "x"),
                   "https://www.marca.com/barcos/m-4": "x"}
        modelos = MODELOS + []
        r = self.revisar(paginas, modelos)
        self.assertEqual([x["slug"] for x in r["movidos"]], ["m-3"])
        self.assertTrue(r["movidos"][0]["posible_anterior"])
        self.assertEqual(r["retirados"], [])
        self.assertEqual([x["url"] for x in r["nuevos"]], ["https://www.marca.com/barcos/m-4"])

    def test_enlace_que_redirige_no_es_una_ficha_nueva(self):
        gama = GAMA + '<a href="/barcos/m-9">blog</a>'
        paginas = {"https://www.marca.com/gama": gama, "https://www.marca.com/barcos/m-4": "x",
                   "https://www.marca.com/barcos/m-9": R(200, "https://www.marca.com/blog", "articulo")}
        r = self.revisar(paginas)
        self.assertEqual([x["url"] for x in r["nuevos"]], ["https://www.marca.com/barcos/m-4"])

    def test_marca_bloqueada_no_saca_conclusiones(self):
        r = self.revisar({"https://www.marca.com/gama": R(403, "https://www.marca.com/gama", error="HTTP 403")})
        self.assertEqual(r["estado"], "bloqueada")
        self.assertEqual((r["nuevos"], r["retirados"], r["movidos"]), ([], [], []))

    def test_gama_parcial_se_avisa(self):
        modelos = [dict(m, indices=["https://www.marca.com/gama", "https://www.marca.com/gama2"]) for m in MODELOS]
        paginas = {"https://www.marca.com/gama": GAMA, "https://www.marca.com/barcos/m-4": "x"}
        r = self.revisar(paginas, modelos)
        self.assertEqual(r["estado"], "parcial")
        self.assertIn("incompleta", r["nota"])

    def test_pagina_caida_no_cuenta_como_retiro(self):
        paginas = {"https://www.marca.com/gama": GAMA, "https://www.marca.com/barcos/m-4": "x",
                   "https://www.marca.com/barcos/m-3": R(0, "u", error="timeout")}
        r = self.revisar(paginas)
        self.assertEqual(r["retirados"], [])
        self.assertEqual([x["slug"] for x in r["sin_verificar"]], ["m-3"])

    def test_pagina_unica(self):
        r = rm.revisar_marca("switch", MODELOS[:1], leer=web({}), pausa=0)
        self.assertEqual(r["estado"], "unica")


class DatosReales(unittest.TestCase):
    def test_todo_modelo_conocido_esta_en_el_catalogo_del_sitio(self):
        """Si un slug de la biblioteca no existe en el catálogo, «ocultar» no tendría efecto: hay que verlo."""
        cat = rm.catalogo_slugs()
        faltan = [(m, x["slug"]) for m, l in rm.conocidos().items() for x in l if x["slug"] not in cat.get(m, set())]
        self.assertEqual(faltan, [])

    def test_hay_configuracion_para_cada_marca(self):
        for m in rm.conocidos():
            self.assertTrue(m in rm.EXTRA or any(x["indices"] for x in rm.conocidos()[m]), m)


if __name__ == "__main__":
    unittest.main()


class MarcaNuevaConExtra(unittest.TestCase):
    def test_marca_sin_modelos_cargados_lista_sus_fichas(self):
        gama = '<a href="/boats/uno">U</a> <a href="/boats/dos/">D</a> <a href="/contact">c</a>'
        leer = web({"https://delta.example/boats": gama, "https://delta.example/boats/uno": "<title>Uno</title>",
                    "https://delta.example/boats/dos/": "<title>Dos</title>"})
        r = rm.revisar_marca("delta", [], leer, pausa=0, indices_extra={"delta": ["https://delta.example/boats"]})
        self.assertEqual(r["estado"], "ok")
        self.assertEqual(sorted(x["titulo"] for x in r["nuevos"]), ["Dos", "Uno"])

    def test_sin_extra_una_marca_sin_modelos_queda_bloqueada(self):
        r = rm.revisar_marca("delta", [], web({}), pausa=0)
        self.assertEqual(r["estado"], "bloqueada")


CATALOGOS = ''.join(f'<a href="https://solariscatalogues.com/{c}_en/">x</a>' for c in
                    ["40-40st-44-50-55-60", "64rs", "74rs", "74fd", "80rs", "111", "90rs"])
BERTHON = ''.join(f'<a href="https://www.berthoninternational.com/new-yacht-sales/solaris-yachts/solaris-{s}/">x</a>'
                  for s in ["40", "40-st", "44", "50", "55", "60", "64-rs", "74", "74-rs", "80-rs", "111-rs"])
SOLARIS = {"solaris-40", "solaris-40-st", "solaris-44", "solaris-50", "solaris-55", "solaris-60", "solaris-64-rs",
           "solaris-74", "solaris-74-rs", "solaris-80-rs", "solaris-111-rs"}


class SenalesExternas(unittest.TestCase):
    def test_modelo_nuevo_en_catalogo_se_avisa_y_los_conocidos_no(self):
        leer = web({"https://solariscatalogues.com/": CATALOGOS,
                    "https://www.berthoninternational.com/new-yacht-sales/solaris-yachts/": BERTHON})
        s = rm.senales("solaris", SOLARIS, leer, pausa=0)
        self.assertEqual(s[0]["nuevos"], ["solaris-90-rs"])  # 74 FD = solaris-74 y 111 = 111 RS no son nuevos
        self.assertEqual(s[1]["nuevos"], [])
        self.assertTrue(all(not x["oficial"] for x in s))

    def test_fuente_caida_o_sin_formato_se_informa(self):
        leer = web({"https://solariscatalogues.com/": "<html>vacío</html>"})
        s = rm.senales("solaris", SOLARIS, leer, pausa=0)
        self.assertFalse(s[0]["ok"])
        self.assertFalse(s[1]["ok"])
