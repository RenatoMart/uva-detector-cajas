import { cn } from '@/lib/clases';
import type { Verificacion } from '@/types/deteccion';
import { ESTILO_VEREDICTO } from './Veredicto';

function detalle(v: Verificacion): string {
	if (v.motivos.length) return v.motivos.join('; ');
	if (v.cara === 'principal') return v.codigos[0]?.texto ?? '—';
	return v.codigos.length ? `${v.codigos.length} QR leídos` : '—';
}

export function Historial({ historial }: { historial: Verificacion[] }) {
	return (
		<section className='overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm'>
			<div className='border-b border-stone-200 px-4 py-3'>
				<h2 className='text-base font-semibold text-stone-900'>
					Últimas revisiones
				</h2>
			</div>
			{historial.length === 0 ? (
				<p className='px-4 py-8 text-center text-sm text-stone-600'>
					Todavía no hay revisiones. Aparecerán aquí a medida que se revisen
					cajas.
				</p>
			) : (
				<div className='overflow-x-auto'>
					<table className='w-full min-w-136 text-left text-sm'>
						<thead className='bg-stone-50 text-xs text-stone-600'>
							<tr>
								<th className='px-4 py-2 font-medium'>Hora</th>
								<th className='px-4 py-2 font-medium'>Cara</th>
								<th className='px-4 py-2 font-medium'>Resultado</th>
								<th className='px-4 py-2 font-medium'>Detalle</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-stone-100'>
							{historial.slice(0, 10).map(v => {
								const e = ESTILO_VEREDICTO[v.veredicto];
								return (
									<tr key={v.id}>
										<td className='px-4 py-2 tabular-nums'>
											{v.hora.toLocaleTimeString('es-PE')}
										</td>
										<td className='px-4 py-2'>
											{v.cara === null
												? '—'
												: v.cara === 'principal'
													? 'Principal'
													: 'Costado'}
										</td>
										<td className='px-4 py-2'>
											<span
												className={cn(
													'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
													e.fondo,
													e.texto,
												)}
											>
												<e.Icono className='size-3.5' />
												{e.titulo}
											</span>
										</td>
										<td className='px-4 py-2 text-xs text-stone-700'>
											{detalle(v)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
