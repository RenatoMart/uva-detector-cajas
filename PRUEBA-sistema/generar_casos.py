"""Genera las imágenes de prueba a partir de fotos reales de las etiquetas.

Partimos de 3 fotos (carpeta `originales/`): dos etiquetas principales y el costado
con los 4 QR (nombres de trabajadores difuminados). Los casos con error se crean
quitando o desenfocando piezas. Uso: python generar_casos.py
"""

import shutil
from pathlib import Path

import numpy as np
import zxingcpp
from PIL import Image, ImageDraw, ImageFilter

BASE = Path(__file__).parent
ORIG, SALIDA = BASE / 'originales', BASE / 'imagenes'
PUBLIC = BASE.parent / 'public' / 'prueba'
SALIDA.mkdir(exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)


def abrir(nombre: str) -> Image.Image:
    return Image.open(ORIG / nombre).convert('RGB')


def tapar(img: Image.Image, caja: tuple[int, int, int, int], color) -> Image.Image:
    img = img.copy()
    ImageDraw.Draw(img).rectangle(caja, fill=color)
    return img


def poner_qr(img: Image.Image, caja, texto: str, fondo) -> Image.Image:
    """Reemplaza un QR del costado por otro con `texto` (misma posición y tamaño)."""
    x0, y0, x1, y1 = caja
    lado = max(x1 - x0, y1 - y0)
    m = np.array(zxingcpp.write_barcode_to_image(
        zxingcpp.create_barcode(texto, zxingcpp.BarcodeFormat.QRCode)))
    qr = Image.fromarray(m).convert('RGB').resize((lado, lado), Image.NEAREST)
    img = img.copy()
    pad = int(0.14 * lado)
    ImageDraw.Draw(img).rectangle(
        (x0 - pad, y0 - pad, x0 + lado + pad, y0 + lado + pad), fill=fondo)
    img.paste(qr, (x0, y0))
    return img


def carton() -> Image.Image:
    rng = np.random.default_rng(3)
    base = np.array([176, 132, 84], dtype=np.float32) + rng.normal(0, 7, (900, 1200, 1))
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))


costado = abrir('costado.jpg')
rosa = costado.getpixel((365, 500))  # fondo del sticker rosado
principal = abrir('principal_1.jpg')
CASOS = {
    '01_principal_real_1.jpg': lambda: principal,
    '02_principal_real_2.jpg': lambda: abrir('principal_2.jpg'),
    '03_principal_borrosa.jpg': lambda: principal.filter(ImageFilter.GaussianBlur(9)),
    '04_sin_etiqueta.jpg': carton,
    # Mal impresas (fotos reales): el contenido se sale del adhesivo.
    # LIMITACIÓN: el sistema aún no detecta el marco cortado (05 se lee como conforme).
    '05_mala_real_cortada_abajo.jpg': lambda: abrir('mala_2.jpg'),
    '06_mala_real_cortada_derecha.jpg': lambda: abrir('mala_1.jpg'),
    '07_costado_real.jpg': lambda: costado,
    '08_costado_falta_qr_personal.jpg': lambda: tapar(costado, (410, 278, 512, 385), 'white'),
    '09_costado_falta_qr_peso.jpg': lambda: tapar(costado, (372, 520, 492, 645), rosa),
    '10_costado_borroso.jpg': lambda: costado.filter(ImageFilter.GaussianBlur(7)),
    # Cambian el CONTENIDO de un QR (se leen bien, pero no coinciden con el registro)
    '11_costado_peso_incorrecto.jpg': lambda: poner_qr(
        costado, (382, 530, 485, 638), '02146099', rosa),
    '12_costado_trabajador_no_registrado.jpg': lambda: poner_qr(
        costado, (420, 287, 504, 377), '009999900099999', 'white'),
    '13_costado_trabajador_repetido.jpg': lambda: poner_qr(
        costado, (420, 287, 504, 377), '009725200023505', 'white'),
}

for nombre, crear in CASOS.items():
    crear().save(SALIDA / nombre, quality=92)
    shutil.copy(SALIDA / nombre, PUBLIC / nombre)
    print('creada', nombre)
