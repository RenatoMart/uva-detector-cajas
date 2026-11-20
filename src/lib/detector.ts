import type { CodigoLeido, RespuestaDetector } from '@/types/deteccion';
import resultados from './resultados-simulacion.json';

/**
 * Detector de la web.
 * - Sin configuración: modo SIMULADO integrado. No necesita servidor: reconoce las
 *   imágenes de ejemplo por su huella (SHA-256) y devuelve resultados precalculados
 *   con el lector real (backend/generar_resultados.py). Funciona tal cual en Vercel.
 * - Con NEXT_PUBLIC_DETECTOR_URL: usa el servicio de Python (backend/) como detector.
 */
const URL_DETECTOR = process.env.NEXT_PUBLIC_DETECTOR_URL ?? '';

export const detectorRemoto = URL_DETECTOR.length > 0;
/** Siempre hay un detector disponible: el simulado integrado o el remoto. */
export const detectorConfigurado = true;

type Guardado = {
	archivo: string;
	codigos: CodigoLeido[];
	etiqueta: RespuestaDetector['etiqueta'];
};
const GUARDADOS = resultados as unknown as Record<string, Guardado>;

async function huella(blob: Blob): Promise<string> {
	const resumen = await crypto.subtle.digest(
		'SHA-256',
		await blob.arrayBuffer(),
	);
	return Array.from(new Uint8Array(resumen), b =>
		b.toString(16).padStart(2, '0'),
	).join('');
}

async function detectarSimulado(blob: Blob): Promise<RespuestaDetector> {
	const inicio = performance.now();
	const guardado = GUARDADOS[await huella(blob)];
	const ms = Math.max(1, Math.round(performance.now() - inicio));
	if (!guardado) {
		return {
			codigos: [],
			etiqueta: null,
			ms,
			modo: 'simulado',
			conocida: false,
		};
	}
	return {
		codigos: guardado.codigos,
		etiqueta: guardado.etiqueta,
		ms,
		modo: 'simulado',
		conocida: true,
	};
}

/** Lee las etiquetas de una imagen (simulado integrado o servicio remoto). */
export async function detectar(imagen: Blob): Promise<RespuestaDetector> {
	if (!detectorRemoto) return detectarSimulado(imagen);
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

/** Devuelve el modo del detector ('simulado', ...) o null si el remoto no responde. */
export async function servicioDisponible(): Promise<string | null> {
	if (!detectorRemoto) return 'simulado';
	try {
		const res = await fetch(`${URL_DETECTOR}/salud`, { cache: 'no-store' });
		if (!res.ok) return null;
		const datos = (await res.json()) as { modo?: string };
		return datos.modo ?? 'en línea';
	} catch {
		return null;
	}
}
