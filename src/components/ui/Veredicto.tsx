import type { Veredicto } from '@/types/deteccion';
import { IconoAlerta, IconoCheck, IconoX } from './Iconos';

/** Textos y colores de cada resultado (siempre con icono y texto, no solo color). */
export const ESTILO_VEREDICTO = {
	conforme: {
		titulo: 'Buena etiqueta',
		accion: 'La caja puede continuar.',
		Icono: IconoCheck,
		borde: 'border-emerald-600',
		fondo: 'bg-emerald-50',
		texto: 'text-emerald-900',
		solido: 'bg-emerald-700',
	},
	no_conforme: {
		titulo: 'Mal etiquetada',
		accion: 'Separe la caja y corrija la etiqueta.',
		Icono: IconoX,
		borde: 'border-red-700',
		fondo: 'bg-red-50',
		texto: 'text-red-900',
		solido: 'bg-red-700',
	},
	sin_lectura: {
		titulo: 'Sin lectura',
		accion: 'Revise la caja a mano.',
		Icono: IconoAlerta,
		borde: 'border-amber-600',
		fondo: 'bg-amber-50',
		texto: 'text-amber-900',
		solido: 'bg-amber-600',
	},
} as const satisfies Record<Veredicto, object>;
