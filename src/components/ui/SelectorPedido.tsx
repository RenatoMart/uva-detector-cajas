import type { Pedido } from '@/types/deteccion';

interface Props {
	pedidos: Pedido[];
	pedido: Pedido;
	onCambiar: (_id: string) => void;
}

export function SelectorPedido({ pedidos, pedido, onCambiar }: Props) {
	return (
		<section className='rounded-xl border border-stone-200 bg-white p-4'>
			<label className='text-sm font-semibold text-stone-900' htmlFor='pedido'>
				Pedido que se está empacando
			</label>
			<select
				className='mt-2 min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm'
				id='pedido'
				value={pedido.id}
				onChange={e => onCambiar(e.target.value)}
			>
				{pedidos.map(p => (
					<option key={p.id} value={p.id}>
						{p.clienteFinal} · {p.id}
					</option>
				))}
			</select>
			<p className='mt-2 text-sm text-stone-700'>
				{pedido.presentacion} · caja de {pedido.pesoKg} kg · {pedido.pais}
			</p>
		</section>
	);
}
