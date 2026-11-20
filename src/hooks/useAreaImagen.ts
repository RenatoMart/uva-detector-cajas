'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface Medida {
	w: number;
	h: number;
}

export interface AreaImagen {
	left: number;
	top: number;
	width: number;
	height: number;
}

/**
 * Calcula dónde se dibuja realmente la imagen dentro del visor (que la ajusta con
 * `object-contain` y deja bandas), para alinear los recuadros con los códigos.
 */
export function useAreaImagen() {
	const contenedorRef = useRef<HTMLDivElement>(null);
	const [visor, setVisor] = useState<Medida | null>(null);
	const [imagen, setImagen] = useState<Medida | null>(null);

	useEffect(() => {
		const el = contenedorRef.current;
		if (!el) return;
		const obs = new ResizeObserver(([e]) =>
			setVisor({ w: e.contentRect.width, h: e.contentRect.height }),
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	const area = useMemo<AreaImagen | null>(() => {
		if (!visor || !imagen) return null;
		const escala = Math.min(visor.w / imagen.w, visor.h / imagen.h);
		const width = imagen.w * escala;
		const height = imagen.h * escala;
		return {
			left: (visor.w - width) / 2,
			top: (visor.h - height) / 2,
			width,
			height,
		};
	}, [visor, imagen]);

	return { contenedorRef, area, fijarImagen: setImagen };
}
