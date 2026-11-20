import type { Verificacion } from '@/types/deteccion';

export function Contadores({ historial }: { historial: Verificacion[] }) {
	const revisadas = historial.length;
	const buenas = historial.filter(v => v.veredicto === 'conforme').length;
	const malas = historial.filter(v => v.veredicto === 'no_conforme').length;
	const problema = revisadas ? ((revisadas - buenas) / revisadas) * 100 : 0;

	const items = [
		{ etiqueta: 'Revisadas', valor: revisadas, clase: 'text-stone-900' },
		{ etiqueta: 'Buenas', valor: buenas, clase: 'text-emerald-800' },
		{ etiqueta: 'Mal etiquetadas', valor: malas, clase: 'text-red-800' },
		{
			etiqueta: 'Con problema',
			valor: `${problema.toFixed(1)}%`,
			clase: 'text-amber-800',
		},
	];

	return (
		<section aria-label='Contadores' className='grid grid-cols-2 gap-2'>
			{items.map(i => (
				<div
					key={i.etiqueta}
					className='rounded-lg border border-stone-200 bg-white p-3'
				>
					<p className='text-xs text-stone-600'>{i.etiqueta}</p>
					<p className={`text-2xl font-bold tabular-nums ${i.clase}`}>
						{i.valor}
					</p>
				</div>
			))}
		</section>
	);
}
