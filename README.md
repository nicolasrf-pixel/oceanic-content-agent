# oceanic-content-agent

Recopilar y organizar contenido oficial de las marcas náuticas.

El **Content Engine** construye, para cada embarcación, un paquete completo y verificable (textos, tabla técnica con
trazabilidad, equipamiento, imágenes, videos, documentos, fuentes, conflictos e información faltante) a partir del
cual después se construye la página Oceanic.

- Reglas del sistema: [`CLAUDE.md`](CLAUDE.md)
- Especificación: [`docs/ESPECIFICACION.md`](docs/ESPECIFICACION.md)
- Proceso: [`docs/PROCESO.md`](docs/PROCESO.md)
- Biblioteca: [`biblioteca/`](biblioteca/)

## Estado de la biblioteca

| Marca | Modelo | MY | CONTENT_STATUS |
| --- | --- | --- | --- |
| Axopar | [37 XC Cross Cabin](biblioteca/axopar/axopar-37-xc-cross-cabin/00_MODELO/00_MODELO.md) | 2027 | YELLOW |

## Uso rápido

```
cd tools
pip install -r requirements.txt
python -m oceanic check
```
