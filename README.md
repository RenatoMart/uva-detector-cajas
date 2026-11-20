El detector está **integrado en la propia app de Next** (rutas `/api/detectar` y
`/api/salud`), así que no hace falta ningún servidor aparte y se despliega tal cual en
**Vercel**. Reconoce las imágenes de ejemplo por su huella (SHA-256) y devuelve
resultados precalculados con el lector real (`src/lib/resultados-simulacion.json`).

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

## Cómo funciona (simulación integrada)

La web **no necesita servidor**: reconoce las imágenes de ejemplo por su huella
(SHA-256) y devuelve resultados precalculados con el lector real
(`src/lib/resultados-simulacion.json`). Por eso funciona tal cual en **Vercel**.

```bash
npm install
npm run dev      # http://localhost:3000  ->  Iniciar -> SIMULACIÓN
```

En la web: pulsar **Iniciar simulación** para ver pasar cajas una tras otra (primero la
etiqueta principal y luego el costado; la cara se reconoce sola y se muestra *buena
etiqueta*, *mal etiquetada* o *sin lectura*). También se puede **Revisar una caja** con
las imágenes de ejemplo. Una imagen que no sea de ejemplo se informa como "fuera de la
simulación".

- Las imágenes de ejemplo parten de fotos reales de las etiquetas
  (`PRUEBA-sistema/originales/`, con los nombres de los trabajadores difuminados) y se
  regeneran con `PRUEBA-sistema/generar_casos.py`.
- El contenido de los QR se valida contra un **registro de ejemplo**
  (`src/lib/registro.ts`): trabajador registrado, no repetido y peso del QR igual al del
  pedido.
- Los resultados de la simulación están **preconfigurados** para cada imagen de ejemplo,
  incluidas las dos etiquetas mal impresas (el contenido se sale del recuadro), que se
  marcan como *mal etiquetada*.
- La simulación hace que ~10 % de las cajas salga mal, parecido al reproceso del informe
  (9,6 %), y no controla códigos de caja repetidos porque reutiliza pocas fotos.
- Para ver "código repetido" en modo manual: revisar la imagen 01, luego la 02 y otra
  vez la 01.

## Detector real (opcional, backend de Python)

`backend/` lee de verdad los códigos de cualquier foto (zxing-cpp + OpenCV). **No usa
YOLO**; `localizar_etiqueta` es donde se conectaría un modelo entrenado.

```bash
python3 -m venv backend/.venv
backend/.venv/bin/pip install -r backend/requirements.txt
cd backend && .venv/bin/uvicorn main:app --port 8000
echo 'NEXT_PUBLIC_DETECTOR_URL=http://localhost:8000' > .env.local
```

Con esa variable la web usa el backend en lugar de la simulación. Tras regenerar las
imágenes de ejemplo hay que recalcular el JSON:
`backend/.venv/bin/python backend/generar_resultados.py`.

Contrato: `GET /salud` y `POST /detectar` (multipart, campo `imagen`) devuelven
`{ codigos: [{ tipo, texto, caja }], etiqueta, ms, modo }`, con `tipo` en
`codigo_caja | qr_personal | qr_peso` y cajas normalizadas (0 a 1). Tipos en
`src/types/deteccion.ts`.

## Alcance

Es una **simulación de la propuesta**, no un sistema de producción:

- La cámara solo lee códigos reales con el detector de Python; en la simulación se
  trabaja con las imágenes de ejemplo.
- El detector de Python (`backend/`) lee el código de barras y los QR de cualquier foto,
  pero no evalúa el recuadro de la etiqueta ni el texto impreso: para eso haría falta un
  modelo entrenado (YOLO) con fotos de etiquetas buenas y mal impresas.
