"""Servicio de lectura de etiquetas de caja (MODO SIMULACIÓN).

Lee todos los códigos de una foto y clasifica cada uno:
  - codigo_caja : código de barras (Code 128) de la etiqueta principal.
  - qr_personal : QR de quien realizó una acción (selección, pesado, ...).
  - qr_peso     : QR rosado del peso de la caja.
La etiqueta se ubica con un método simple (región blanca). No usa YOLO:
`localizar_etiqueta` es donde se conectaría un modelo entrenado con fotos reales.
"""

import io
import re
import time

import numpy as np
import zxingcpp
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

MODO = 'simulado'

app = FastAPI(title='Lector de etiquetas de caja (simulación)')
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r'http://(localhost|127\.0\.0\.1)(:\d+)?',
    allow_methods=['*'],
    allow_headers=['*'],
)


def normalizar(x0: float, y0: float, x1: float, y1: float, w: int, h: int) -> dict:
    x0, y0 = max(0.0, x0), max(0.0, y0)
    x1, y1 = min(float(w), x1), min(float(h), y1)
    return {'x': x0 / w, 'y': y0 / h, 'w': (x1 - x0) / w, 'h': (y1 - y0) / h}


def es_rosado(img: Image.Image, x0: int, y0: int, x1: int, y1: int) -> bool:
    """Indica si el fondo alrededor del código es rosado (sticker del peso)."""
    w, h = img.size
    mx, my = int((x1 - x0) * 0.25), int((y1 - y0) * 0.25)
    zona = np.asarray(
        img.crop((max(0, x0 - mx), max(0, y0 - my), min(w, x1 + mx), min(h, y1 + my)))
    ).astype(int)
    r, g, b = zona[..., 0], zona[..., 1], zona[..., 2]
    claro = (zona.sum(axis=2) > 450)
    if claro.sum() < 50:
        return False
    rosa = claro & (r > 200) & (r - g > 35) & (abs(g - b) < 30)
    return rosa.sum() / claro.sum() > 0.25


def tipo_de(formato: str, texto: str, rosado: bool) -> str:
    if formato == 'Code128':
        return 'codigo_caja'
    if formato == 'QRCode':
        digitos = re.sub(r'\D', '', texto)
        return 'qr_peso' if rosado or len(digitos) <= 10 else 'qr_personal'
    return 'otro'


def localizar_etiqueta(img: Image.Image) -> dict | None:
    """Simulación: la etiqueta es la mayor región clara y sin color de la imagen."""
    a = np.asarray(img.convert('RGB')).astype(int)
    h, w = a.shape[:2]
    minimo = a.min(axis=2)
    umbral = max(120.0, min(200.0, 0.82 * np.percentile(minimo, 99)))
    claro = (minimo > umbral) & ((a.max(axis=2) - minimo) < 45)
    filas = np.where(claro.mean(axis=1) > 0.12)[0]
    if filas.size < h * 0.05:
        return None
    y0, y1 = int(filas.min()), int(filas.max())
    cols = np.where(claro[y0 : y1 + 1].mean(axis=0) > 0.25)[0]
    if cols.size < w * 0.05:
        return None
    return normalizar(cols.min(), y0, cols.max(), y1, w, h)


@app.get('/salud')
def salud() -> dict:
    return {'ok': True, 'modo': MODO}


@app.post('/detectar')
async def detectar(imagen: UploadFile = File(...)) -> dict:
    t0 = time.perf_counter()
    img = Image.open(io.BytesIO(await imagen.read())).convert('RGB')
    w, h = img.size

    codigos: list[dict] = []
    for b in zxingcpp.read_barcodes(img):
        p = b.position
        xs = [p.top_left.x, p.top_right.x, p.bottom_right.x, p.bottom_left.x]
        ys = [p.top_left.y, p.top_right.y, p.bottom_right.y, p.bottom_left.y]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        rosado = b.format.name == 'QRCode' and es_rosado(img, x0, y0, x1, y1)
        codigos.append(
            {
                'tipo': tipo_de(b.format.name, b.text, rosado),
                'texto': b.text.strip(),
                'caja': normalizar(x0, y0, x1, y1, w, h),
            }
        )

    return {
        'codigos': codigos,
        'etiqueta': localizar_etiqueta(img),
        'ms': round((time.perf_counter() - t0) * 1000),
        'modo': MODO,
    }
