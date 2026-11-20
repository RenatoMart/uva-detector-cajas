import type { RespuestaDetector } from '@/types/deteccion';

/**
 * Detector de la web.
 * - Sin configuración: usa el backend integrado en Next (/api/detectar), que funciona
 *   en modo simulado y se despliega junto con la web (Vercel).
 * - Con NEXT_PUBLIC_DETECTOR_URL: usa el servicio de Python (backend/) en su lugar.
 */
const URL_DETECTOR = process.env.NEXT_PUBLIC_DETECTOR_URL ?? '';
const BASE = URL_DETECTOR || '/api';

export const detectorRemoto = URL_DETECTOR.length > 0;
/** Siempre hay un detector disponible: el integrado o el remoto. */
export const detectorConfigurado = true;

/** Lee las etiquetas de una imagen. */
export async function detectar(imagen: Blob): Promise<RespuestaDetector> {
	const datos = new FormData();
	datos.append('imagen', imagen, 'captura.jpg');
	const res = await fetch(`${BASE}/detectar`, { method: 'POST', body: datos });
	if (!res.ok) {
		throw new Error(`El servicio respondió ${res.status}`);
	}
	return (await res.json()) as RespuestaDetector;
}

/** Devuelve el modo del detector ('simulado', ...) o null si no responde. */
export async function servicioDisponible(): Promise<string | null> {
	try {
		const res = await fetch(`${BASE}/salud`, { cache: 'no-store' });
		if (!res.ok) return null;
		const datos = (await res.json()) as { modo?: string };
		return datos.modo ?? 'en línea';
	} catch {
		return null;
	}
}
