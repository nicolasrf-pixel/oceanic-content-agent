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

| Marca | Modelo | MY | Tabla base | CONTENT_STATUS |
| --- | --- | --- | --- | --- |
| Axopar | [AX/E 22](biblioteca/axopar/ax-e-22/00_MODELO/00_MODELO.md) | 2027 | 3/8 verificada | RED |
| Axopar | [AX/E 25](biblioteca/axopar/ax-e-25/00_MODELO/00_MODELO.md) | 2027 | 4/8 verificada | YELLOW |
| Axopar | [Axopar 22 Spyder](biblioteca/axopar/axopar-22-spyder/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 22 T-Top](biblioteca/axopar/axopar-22-t-top/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 25 Cross Bow](biblioteca/axopar/axopar-25-cross-bow/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 25 Cross Top](biblioteca/axopar/axopar-25-cross-top/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 29 CCX](biblioteca/axopar/axopar-29-ccx/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 29 Sun Top](biblioteca/axopar/axopar-29-sun-top/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 29 XC Cross Cabin](biblioteca/axopar/axopar-29-xc-cross-cabin/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 37 Spyder](biblioteca/axopar/axopar-37-spyder/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 37 Sun Top](biblioteca/axopar/axopar-37-sun-top/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 37 XC Cross Cabin](biblioteca/axopar/axopar-37-xc-cross-cabin/00_MODELO/00_MODELO.md) | 2027 | 8/8 verificada | YELLOW |
| Axopar | [Axopar 38 Cross Top](biblioteca/axopar/axopar-38-cross-top/00_MODELO/00_MODELO.md) | 2027 | 7/8 verificada | YELLOW |
| Axopar | [Axopar 38 Sun Top](biblioteca/axopar/axopar-38-sun-top/00_MODELO/00_MODELO.md) | 2027 | 7/8 verificada | YELLOW |
| Axopar | [Axopar 38 XC Cross Cabin](biblioteca/axopar/axopar-38-xc-cross-cabin/00_MODELO/00_MODELO.md) | 2027 | 7/8 verificada | YELLOW |
| Axopar | [Axopar 45 Cross Top](biblioteca/axopar/axopar-45-cross-top/00_MODELO/00_MODELO.md) | 2027 | 7/8 verificada | YELLOW |
| Axopar | [Axopar 45 Sun Top](biblioteca/axopar/axopar-45-sun-top/00_MODELO/00_MODELO.md) | 2027 | 7/8 verificada | YELLOW |
| Axopar | [Axopar 45 XC Cross Cabin](biblioteca/axopar/axopar-45-xc-cross-cabin/00_MODELO/00_MODELO.md) | 2027 | 7/8 verificada | YELLOW |

## Uso rápido

```
cd tools
pip install -r requirements.txt
python -m oceanic check
```
