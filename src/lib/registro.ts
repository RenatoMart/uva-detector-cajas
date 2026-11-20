/**
 * REGISTRO DE EJEMPLO (datos inventados para la simulación).
 *
 * Los códigos de los QR sí son los leídos en las fotos reales, pero qué significan lo
 * sabe el sistema de trazabilidad de la empresa. Aquí se asume que cada QR de personal
 * identifica a un trabajador y su acción, y que el QR rosado identifica el tipo de cartón.
 * Los nombres son ficticios. Reemplazar por la consulta real cuando la empresa la permita.
 */

export interface Trabajador {
	/** Texto que trae el QR (15 dígitos). */
	codigo: string;
	nombre: string;
	accion: string;
}

export const TRABAJADORES: Trabajador[] = [
	{ codigo: '002922100038337', nombre: 'Operario 1', accion: 'Selección' },
	{ codigo: '009725200023505', nombre: 'Operario 2', accion: 'Pesado' },
	{ codigo: '001694300018412', nombre: 'Operario 3', accion: 'Embalaje' },
];

/** QR rosado: texto del código -> peso del cartón en kg. */
export const CARTONES: Record<string, number> = {
	'02146061': 8.2,
	'02146099': 4.5,
};
