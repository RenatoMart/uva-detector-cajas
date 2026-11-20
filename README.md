# Verificación de etiquetas · El Pedregal

Web para detectar y verificar etiquetas de cajas de uva en la línea Packing 1. Usa la cámara
(o una imagen subida), envía el cuadro al servicio de detección y compara el código GS1-128
leído con el pedido activo.

## Uso

```bash
npm install
cp .env.example .env.local   # definir la URL del detector
npm run dev
```

## Qué verifica

Una caja lleva una **etiqueta principal** (código de barras con un código de caja único,
ej. `BAC7317469210284`) y **etiquetas del costado**: 3 QR de personal (quien hizo cada
acción) y 1 QR rosado de peso. La web revisa cada cara por separado:

- **Principal:** debe leerse 1 código de caja válido (3 letras + 13 dígitos) y no repetido.
- **Costado:** deben leerse 3 QR de personal y 1 QR de peso.

Resultados: **conforme**, **no conforme** (con motivo) o **sin lectura** (revisar a mano).

## Contrato del servicio de lectura

- `GET  {NEXT_PUBLIC_DETECTOR_URL}/salud` → 200 si está disponible.
- `POST {NEXT_PUBLIC_DETECTOR_URL}/detectar` (multipart, campo `imagen`) → JSON:

```json
{
  "codigos": [
    { "tipo": "codigo_caja", "texto": "BAC7317469210284",
      "caja": { "x": 0.29, "y": 0.49, "w": 0.29, "h": 0.08 } }
  ],
  "etiqueta": { "x": 0.24, "y": 0.18, "w": 0.53, "h": 0.59 },
  "ms": 85,
  "modo": "simulado"
}
```

`tipo`: `codigo_caja` | `qr_personal` | `qr_peso`. Cajas normalizadas (0 a 1). Tipos en
`src/types/deteccion.ts`.

## Simulación (sin YOLO entrenado)

```bash
# 1) Backend (puerto 8000)
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cd backend && .venv/bin/uvicorn main:app --port 8000

# 2) Web (otra terminal; .env.local apunta a http://localhost:8000)
npm run dev
```

En la web: pulsar **▶ SIMULACIÓN** para ver pasar cajas una tras otra (primero la etiqueta
principal y luego el costado; la cara se reconoce sola y se muestra *buena etiqueta*,
*mal etiquetada* o *sin lectura*). También se puede **Subir imagen** y pulsar una
**imagen de prueba**; "Cara a revisar" en *Automática* la identifica por los códigos. Las imágenes
parten de fotos reales de las etiquetas (`PRUEBA-sistema/originales/`, con los nombres de
los trabajadores difuminados) y se regeneran con `PRUEBA-sistema/generar_casos.py`.

- `backend/main.py` lee los códigos con zxing-cpp y los clasifica (QR rosado = peso).
  **No usa YOLO**; `localizar_etiqueta` es donde se conectaría el modelo entrenado.
- La simulación usa pesos para que ~10 % de las cajas salga mal (como el reproceso del
  informe) y no controla repetidos porque reutiliza pocas fotos.
- Para ver "código repetido": verificar la imagen 01, luego la 02 y otra vez la 01.

## Limitaciones conocidas

- **No detecta el marco cortado.** Las imágenes 05 y 06 son etiquetas reales mal impresas
  (el contenido se sale del adhesivo). El código de la 05 se lee bien y la web la da por
  conforme; la 06 queda como "sin lectura". Detectarlo requiere un modelo entrenado con
  fotos de etiquetas buenas y cortadas, o una cámara fija con una plantilla de referencia.
- No lee el texto impreso (variedad, GGN, fecha) ni valida el contenido de los QR.
- Una caja parcialmente tapada solo se detecta si el lector deja de leer el código.
