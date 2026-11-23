"""Convierte una copia de la base D1 (d1/AAAA-MM-DD.json.gz del bucket oceanic-respaldos) en un archivo SQL para restaurarla.

Uso:  python3 tools/respaldo_a_sql.py oceanic-2026-11-23.json.gz > restaurar.sql
Por cada tabla: DELETE de todas las filas y un INSERT por fila (valores escapados). Revisar el archivo antes de aplicarlo (docs/RESPALDOS.md).
"""
import gzip
import json
import sys


def valor(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def convertir(datos: dict) -> str:
    sal = [f"-- Respaldo generado {datos.get('generado', '?')} ({datos.get('motivo', '?')})", "PRAGMA foreign_keys=OFF;"]
    for tabla, filas in datos["tablas"].items():
        sal.append(f'DELETE FROM "{tabla}";')
        for f in filas:
            cols = ", ".join(f'"{c}"' for c in f)
            vals = ", ".join(valor(v) for v in f.values())
            sal.append(f'INSERT INTO "{tabla}" ({cols}) VALUES ({vals});')
    sal.append("PRAGMA foreign_keys=ON;")
    return "\n".join(sal) + "\n"


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    with gzip.open(sys.argv[1], "rt", encoding="utf8") as fh:
        sys.stdout.write(convertir(json.load(fh)))
