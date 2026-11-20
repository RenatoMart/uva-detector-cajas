'use client';

import type { Veredicto, Verificacion } from '@/types/deteccion';
import { useCallback, useEffect, useRef, useState } from 'react';

export type FaseSim = 'llegando' | 'escaneando' | 'resultado';

export interface TotalesSim {
	total: number;
	buenas: number;
	malas: number;
	revisar: number;
}

type Opcion = { archivo: string; peso: number };

/**
 * Imágenes que "pasan" por la cámara. Los pesos hacen que ~10 % de las cajas salga mal,
 * parecido al reproceso del informe (9,6 %). No incluye las etiquetas con el
 * marco cortado, que el sistema aún no detecta.
 */
const PRINCIPALES: Opcion[] = [
	{ archivo: '01_principal_real_1.jpg', peso: 47 },
	{ archivo: '02_principal_real_2.jpg', peso: 48 },
	{ archivo: '03_principal_borrosa.jpg', peso: 3 },
	{ archivo: '04_sin_etiqueta.jpg', peso: 2 },
];

const COSTADOS: Opcion[] = [
	{ archivo: '07_costado_real.jpg', peso: 95 },
	{ archivo: '08_costado_falta_qr_personal.jpg', peso: 2 },
	{ archivo: '09_costado_falta_qr_peso.jpg', peso: 2 },
	{ archivo: '10_costado_borroso.jpg', peso: 1 },
];

const ESPERA = { llegada: 700, escaneo: 900, resultado: 1400, caja: 1800 };

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms));

function elegir(lista: Opcion[]): string {
	const total = lista.reduce((s, o) => s + o.peso, 0);
	let x = Math.random() * total;
	for (const o of lista) {
		x -= o.peso;
		if (x <= 0) return o.archivo;
	}
	return lista[0].archivo;
}

function veredictoDeCaja(caras: Veredicto[]): Veredicto {
	if (caras.includes('no_conforme')) return 'no_conforme';
	if (caras.includes('sin_lectura')) return 'sin_lectura';
	return 'conforme';
}

interface Entradas {
	/** Muestra la imagen de prueba en el visor. */
	mostrar: (_archivo: string) => void;
	/** Procesa la imagen con el detector y devuelve la verificación. */
	procesar: (_archivo: string) => Promise<Verificacion | null>;
}

/** Simula cajas pasando por la cámara: primero la etiqueta principal y luego el costado. */
export function useSimulacion(entradas: Entradas) {
	const entradasRef = useRef(entradas);
	useEffect(() => {
		entradasRef.current = entradas;
	});
	const activaRef = useRef(false);

	const [activa, setActiva] = useState(false);
	const [fase, setFase] = useState<FaseSim>('llegando');
	const [numero, setNumero] = useState(0);
	const [paso, setPaso] = useState<1 | 2>(1);
	const [veredictoCaja, setVeredictoCaja] = useState<Veredicto | null>(null);
	const [totales, setTotales] = useState<TotalesSim>({
		total: 0,
		buenas: 0,
		malas: 0,
		revisar: 0,
	});

	const detener = useCallback(() => {
		activaRef.current = false;
		setActiva(false);
	}, []);

	const iniciar = useCallback(async () => {
		if (activaRef.current) return;
		activaRef.current = true;
		setActiva(true);
		setTotales({ total: 0, buenas: 0, malas: 0, revisar: 0 });
		let n = 0;

		while (activaRef.current) {
			n += 1;
			setNumero(n);
			setVeredictoCaja(null);
			const resultados: Veredicto[] = [];

			for (const [i, archivo] of [
				elegir(PRINCIPALES),
				elegir(COSTADOS),
			].entries()) {
				if (!activaRef.current) return;
				setPaso(i === 0 ? 1 : 2);
				entradasRef.current.mostrar(archivo);
				setFase('llegando');
				await esperar(ESPERA.llegada);
				if (!activaRef.current) return;
				setFase('escaneando');
				const [v] = await Promise.all([
					entradasRef.current.procesar(archivo),
					esperar(ESPERA.escaneo),
				]);
				if (!v) return detener();
				setFase('resultado');
				resultados.push(v.veredicto);
				await esperar(ESPERA.resultado);
			}

			if (!activaRef.current) return;
			const final = veredictoDeCaja(resultados);
			setVeredictoCaja(final);
			setTotales(t => ({
				total: t.total + 1,
				buenas: t.buenas + (final === 'conforme' ? 1 : 0),
				malas: t.malas + (final === 'no_conforme' ? 1 : 0),
				revisar: t.revisar + (final === 'sin_lectura' ? 1 : 0),
			}));
			await esperar(ESPERA.caja);
		}
	}, [detener]);

	return {
		activa,
		fase,
		numero,
		paso,
		veredictoCaja,
		totales,
		iniciar,
		detener,
	};
}
