"""Precalcula los resultados de las imágenes de prueba para la simulación integrada.

La web (Next) no necesita servidor: reconoce cada imagen de ejemplo por su huella
(SHA-256) y devuelve el resultado guardado aquí. Ejecutar después de regenerar las
imágenes de `public/prueba/`:

    backend/.venv/bin/python backend/generar_resultados.py
"""

import hashlib
import io
import json
from pathlib import Path

from PIL import Image

from main import analizar

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / 'src' / 'lib' / 'resultados-simulacion.json'

resultados: dict[str, dict] = {}
for ruta in sorted((RAIZ / 'public' / 'prueba').glob('*.jpg')):
    datos = ruta.read_bytes()
    huella = hashlib.sha256(datos).hexdigest()
    resultados[huella] = {
        'archivo': ruta.name,
        **analizar(Image.open(io.BytesIO(datos)).convert('RGB')),
    }
    print(ruta.name, [c['tipo'] for c in resultados[huella]['codigos']])

SALIDA.write_text(json.dumps(resultados, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'{len(resultados)} imágenes -> {SALIDA.relative_to(RAIZ)}')
