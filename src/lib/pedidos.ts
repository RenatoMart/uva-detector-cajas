import type { Pedido } from '@/types/deteccion';

/** Pedidos de la línea Packing 1 (tomados del plan de producción). */
export const PEDIDOS: Pedido[] = [
	{
		id: 'OEI270203',
		presentacion: 'PT UVA HB CARTON 8.2 TM BO POUC',
		cliente: 'Austral Trading México',
		clienteFinal: 'HEB',
		pais: 'México',
		pesoKg: 8.2,
	},
	{
		id: 'OEI270241',
		presentacion: 'PT UVA GN CARTON 8.2 AL BO POUC',
		cliente: 'TerraSur Imports Inc.',
		clienteFinal: 'Freshfarms - Aldi',
		pais: 'EE.UU.',
		pesoKg: 8.2,
	},
];
