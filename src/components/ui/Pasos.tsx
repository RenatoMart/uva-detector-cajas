import { cn } from '@/lib/clases';

const PASOS = ['Etiqueta principal', 'Costado (QR)', 'Resultado de la caja'];

/** Indica en qué paso va la revisión de una caja (1, 2 o 3). */
export function Pasos({ actual }: { actual: 1 | 2 | 3 | null }) {
	return (
		<ol aria-label='Pasos de la revisión' className='grid grid-cols-3 gap-2'>
			{PASOS.map((nombre, i) => {
				const n = i + 1;
				const activo = actual === n;
				const hecho = actual !== null && actual > n;
				return (
					<li
						key={nombre}
						aria-current={activo ? 'step' : undefined}
						className={cn(
							'flex min-w-0 flex-col items-center gap-1 rounded-lg border p-2 text-center text-xs sm:flex-row sm:gap-2 sm:px-3 sm:text-left sm:text-sm',
							activo &&
								'border-pedregal bg-red-50 font-semibold text-stone-900',
							hecho && 'border-emerald-600 bg-emerald-50 text-emerald-900',
							!activo && !hecho && 'border-stone-200 text-stone-600',
						)}
					>
						<span
							className={cn(
								'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
								activo && 'bg-pedregal text-white',
								hecho && 'bg-emerald-700 text-white',
								!activo && !hecho && 'bg-stone-200 text-stone-700',
							)}
						>
							{n}
						</span>
						{nombre}
					</li>
				);
			})}
		</ol>
	);
}
