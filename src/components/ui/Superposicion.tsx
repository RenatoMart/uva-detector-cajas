import type { AreaImagen } from '@/hooks/useAreaImagen';
import { cn } from '@/lib/clases';
import type { CodigoLeido, TipoCodigo, Veredicto } from '@/types/deteccion';

const COLOR: Record<Veredicto, string> = {
	conforme: 'border-emerald-500 bg-emerald-500/10',
	no_conforme: 'border-red-600 bg-red-600/10',
	sin_lectura: 'border-amber-500 bg-amber-500/10',
};

const NOMBRE: Record<TipoCodigo, string> = {
	codigo_caja: 'Código de caja',
	qr_personal: 'QR personal',
	qr_peso: 'QR peso',
	otro: 'Código',
};

interface Props {
	codigos: CodigoLeido[];
	veredicto: Veredicto | null;
	/** Zona del visor que ocupa la imagen (sin las bandas). */
	area: AreaImagen | null;
}

/** Dibuja los códigos leídos sobre la imagen (coordenadas normalizadas). */
export function Superposicion({ codigos, veredicto, area }: Props) {
	if (!veredicto || !area) return null;
	return (
		<div className='pointer-events-none absolute' style={area}>
			{codigos.map((c, i) => (
				<div
					key={i}
					className={cn('absolute rounded border-[3px]', COLOR[veredicto])}
					style={{
						left: `${c.caja.x * 100}%`,
						top: `${c.caja.y * 100}%`,
						width: `${c.caja.w * 100}%`,
						height: `${c.caja.h * 100}%`,
					}}
				>
					<span className='absolute -top-5 left-0 rounded bg-stone-900/80 px-1.5 text-xs whitespace-nowrap text-white'>
						{NOMBRE[c.tipo]}
					</span>
				</div>
			))}
		</div>
	);
}
