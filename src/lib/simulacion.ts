import type { CodigoLeido, RespuestaDetector } from '@/types/deteccion';
import { createHash } from 'node:crypto';
import resultados from './resultados-simulacion.json';

type Guardado = {
	archivo: string;
	codigos: CodigoLeido[];
	etiqueta: RespuestaDetector['etiqueta'];
	marco?: RespuestaDetector['marco'];
};
const GUARDADOS = resultados as unknown as Record<string, Guardado>;

export const MODO = 'simulado';

/**
 * Detector simulado (solo servidor). Reconoce las imágenes de ejemplo por su huella
 * SHA-256 y devuelve el resultado precalculado con el lector real
 * (backend/generar_resultados.py). Cualquier otra imagen se marca como desconocida.
 */
export function leerImagen(bytes: Buffer): RespuestaDetector {
	const inicio = performance.now();
	const huella = createHash('sha256').update(bytes).digest('hex');
	const guardado = GUARDADOS[huella];
	const ms = Math.max(1, Math.round(performance.now() - inicio));
	return {
		codigos: guardado?.codigos ?? [],
		etiqueta: guardado?.etiqueta ?? null,
		ms,
		modo: MODO,
		conocida: Boolean(guardado),
		marco: guardado?.marco,
	};
}
