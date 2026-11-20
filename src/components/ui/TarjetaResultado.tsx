import { cn } from '@/lib/clases';
import type { TipoCodigo, Verificacion } from '@/types/deteccion';
import { IconoInfo } from './Iconos';
import { ESTILO_VEREDICTO } from './Veredicto';

const NOMBRE: Record<TipoCodigo, string> = {
	codigo_caja: 'Código de caja',
	qr_personal: 'QR de personal',
	qr_peso: 'QR de peso',
	otro: 'Otro código',
};

export function TarjetaResultado({ ultima }: { ultima: Verificacion | null }) {
	if (!ultima) {
		return (
			<div
				aria-live='polite'
				className='rounded-xl border-2 border-dashed border-stone-300 bg-white p-5'
				role='status'
			>
				<p className='flex items-center gap-2 text-base font-semibold text-stone-700'>
					<IconoInfo className='size-5 text-stone-500' />
					Aún no hay resultado
				</p>
				<p className='mt-1 text-sm text-stone-600'>
					Pulse <strong>Iniciar simulación</strong> o revise una caja para ver
					aquí si la etiqueta está bien.
				</p>
			</div>
		);
	}

	const e = ESTILO_VEREDICTO[ultima.veredicto];
	const cara =
		ultima.cara === 'principal'
			? 'Etiqueta principal'
			: ultima.cara === 'costado'
				? 'Costado (QR)'
				: 'Cara no identificada';

	return (
		<div
			aria-live='polite'
			className={cn('rounded-xl border-2 p-5', e.borde, e.fondo, e.texto)}
			role='status'
		>
			<p className='text-sm font-medium opacity-80'>{cara}</p>
			<p className='mt-1 flex items-center gap-2 text-3xl font-black'>
				<e.Icono className='size-8 shrink-0' />
				{e.titulo}
			</p>
			<p className='mt-1 text-base font-medium'>{e.accion}</p>

			{ultima.motivos.length > 0 && (
				<ul className='mt-3 list-disc space-y-1 pl-5 text-sm'>
					{ultima.motivos.map(m => (
						<li key={m}>{m}</li>
					))}
				</ul>
			)}

			{ultima.info.length > 0 && (
				<div className='mt-3 rounded-lg bg-white/70 p-3 text-sm'>
					<p className='font-semibold'>Lo que dicen los códigos</p>
					<dl className='mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5'>
						{ultima.info.map((d, i) => (
							<div key={i} className='contents'>
								<dt className='opacity-80'>{d.etiqueta}</dt>
								<dd className='font-medium'>{d.valor}</dd>
							</div>
						))}
					</dl>
				</div>
			)}

			{ultima.codigos.length > 0 && (
				<details className='mt-3 text-sm'>
					<summary className='cursor-pointer font-medium underline-offset-2 hover:underline'>
						Ver códigos leídos ({ultima.codigos.length})
					</summary>
					<dl className='mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs'>
						{ultima.codigos.map((c, i) => (
							<div key={i} className='contents'>
								<dt className='opacity-70'>{NOMBRE[c.tipo]}</dt>
								<dd className='break-all'>{c.texto}</dd>
							</div>
						))}
					</dl>
				</details>
			)}
		</div>
	);
}
