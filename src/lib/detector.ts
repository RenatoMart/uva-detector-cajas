import type { RespuestaDetector } from '@/types/deteccion';

const URL_DETECTOR = process.env.NEXT_PUBLIC_DETECTOR_URL ?? '';

export const detectorConfigurado = URL_DETECTOR.length > 0;

/** Envía una imagen al servicio de detección (YOLO + lectura GS1). */
export async function detectar(imagen: Blob): Promise<RespuestaDetector> {
	if (!detectorConfigurado) {
		throw new Error('Servicio de detección no configurado');
	}
	const datos = new FormData();
	datos.append('imagen', imagen, 'captura.jpg');
	const res = await fetch(`${URL_DETECTOR}/detectar`, {
		method: 'POST',
		body: datos,
	});
	if (!res.ok) {
		throw new Error(`El servicio respondió ${res.status}`);
	}
	return (await res.json()) as RespuestaDetector;
}

/** Devuelve el modo del servicio ('simulado' o 'yolo'), o null si no responde. */
export async function servicioDisponible(): Promise<string | null> {
	if (!detectorConfigurado) return null;
	try {
		const res = await fetch(`${URL_DETECTOR}/salud`, { cache: 'no-store' });
		if (!res.ok) return null;
		const datos = (await res.json()) as { modo?: string };
		return datos.modo ?? 'en línea';
	} catch {
		return null;
	}
}
