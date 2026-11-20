'use client';

import LogoMarca from '@/components/logo/LogoMarca';
import { Contadores } from '@/components/ui/Contadores';
import { Historial } from '@/components/ui/Historial';
import {
	IconoAlerta,
	IconoCamara,
	IconoCheck,
	IconoImagen,
	IconoPlay,
	IconoSpinner,
	IconoStop,
} from '@/components/ui/Iconos';
import { Pasos } from '@/components/ui/Pasos';
import { SelectorPedido } from '@/components/ui/SelectorPedido';
import { Superposicion } from '@/components/ui/Superposicion';
import { TarjetaResultado } from '@/components/ui/TarjetaResultado';
import { ESTILO_VEREDICTO } from '@/components/ui/Veredicto';
import { useAreaImagen } from '@/hooks/useAreaImagen';
import { useCamara } from '@/hooks/useCamara';
import { useSimulacion } from '@/hooks/useSimulacion';
import { cn } from '@/lib/clases';
import {
	detectar,
	detectorConfigurado,
	detectorRemoto,
	servicioDisponible,
} from '@/lib/detector';
import { PEDIDOS } from '@/lib/pedidos';
import { detectarCara, verificarCara } from '@/lib/verificar';
import type { Cara, Verificacion } from '@/types/deteccion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Modo = 'simulacion' | 'manual';
type Fuente = 'camara' | 'imagen';
type CaraElegida = Cara | 'auto';

type Ejemplo = { archivo: string; nombre: string };

const EJEMPLOS_BUENOS: Ejemplo[] = [
	{ archivo: '01_principal_real_1.jpg', nombre: 'Principal 1' },
	{ archivo: '02_principal_real_2.jpg', nombre: 'Principal 2' },
	{ archivo: '07_costado_real.jpg', nombre: 'Costado completo (4 QR)' },
];

const EJEMPLOS_MALOS: Ejemplo[] = [
	{
		archivo: '08_costado_falta_qr_personal.jpg',
		nombre: 'Falta un QR de personal',
	},
	{ archivo: '09_costado_falta_qr_peso.jpg', nombre: 'Falta el QR de peso' },
	{ archivo: '03_principal_borrosa.jpg', nombre: 'Principal borrosa' },
	{ archivo: '10_costado_borroso.jpg', nombre: 'Costado borroso' },
	{ archivo: '04_sin_etiqueta.jpg', nombre: 'Sin etiqueta' },
	{
		archivo: '11_costado_peso_incorrecto.jpg',
		nombre: 'QR de peso incorrecto',
	},
	{
		archivo: '12_costado_trabajador_no_registrado.jpg',
		nombre: 'Trabajador no registrado',
	},
	{
		archivo: '13_costado_trabajador_repetido.jpg',
		nombre: 'Trabajador repetido',
	},
	{ archivo: '05_mala_real_cortada_abajo.jpg', nombre: 'Mal impresa: abajo' },
	{
		archivo: '06_mala_real_cortada_derecha.jpg',
		nombre: 'Mal impresa: derecha',
	},
];

const CARAS: { id: CaraElegida; nombre: string }[] = [
	{ id: 'auto', nombre: 'Automática' },
	{ id: 'principal', nombre: 'Etiqueta principal' },
	{ id: 'costado', nombre: 'Costado (QR)' },
];

const BOTON =
	'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50';
const BOTON_CLARO = cn(
	BOTON,
	'border border-stone-300 bg-white text-stone-900 hover:bg-stone-50',
);
const BOTON_PRINCIPAL = cn(
	BOTON,
	'bg-pedregal text-white hover:brightness-110',
);
const TARJETA = 'rounded-2xl border border-stone-200 bg-white shadow-sm';
const CHIP =
	'min-h-11 cursor-pointer rounded-full border px-4 text-sm disabled:opacity-50';

const AYUDA_SIMULACION = (
	<p className='text-sm text-stone-700'>
		Hace pasar cajas una tras otra. De cada caja se revisa primero la{' '}
		<strong>etiqueta principal</strong> y luego el{' '}
		<strong>costado con los QR</strong>; el sistema reconoce solo cuál es cada
		una.
	</p>
);

const NOTA_CAMARA = (
	<p className='rounded-lg bg-amber-50 p-3 text-sm text-amber-900'>
		En esta versión simulada la cámara no lee códigos reales: use las imágenes
		de ejemplo.
	</p>
);

const AYUDA_MANUAL = (
	<p className='text-sm text-stone-700'>
		Elija de dónde viene la imagen y pulse <strong>Verificar</strong>. El
		sistema reconoce solo si es la etiqueta principal o el costado.
	</p>
);

function Alternador<T extends string>(props: {
	etiqueta: string;
	valor: T;
	opciones: { id: T; nombre: string; icono?: React.ReactNode }[];
	onCambiar: (_id: T) => void;
	deshabilitado?: boolean;
}) {
	return (
		<div
			aria-label={props.etiqueta}
			className='flex flex-wrap gap-2'
			role='group'
		>
			{props.opciones.map(o => (
				<button
					key={o.id}
					aria-pressed={props.valor === o.id}
					className={cn(
						BOTON,
						props.valor === o.id
							? 'bg-stone-900 text-white'
							: 'bg-stone-100 text-stone-800 hover:bg-stone-200',
					)}
					disabled={props.deshabilitado}
					type='button'
					onClick={() => props.onCambiar(o.id)}
				>
					{o.icono}
					{o.nombre}
				</button>
			))}
		</div>
	);
}

export default function Home() {
	const { videoRef, estado, error, iniciar, detener, capturar } = useCamara();
	const [modo, setModo] = useState<Modo>('simulacion');
	const [fuente, setFuente] = useState<Fuente>('imagen');
	const [cara, setCara] = useState<CaraElegida>('auto');
	const [imagenUrl, setImagenUrl] = useState<string | null>(null);
	const [imagenNombre, setImagenNombre] = useState<string>('');
	const imagenBlob = useRef<Blob | null>(null);
	const [pedidoId, setPedidoId] = useState(PEDIDOS[0].id);
	const [historial, setHistorial] = useState<Verificacion[]>([]);
	const historialRef = useRef<Verificacion[]>([]);
	const [procesando, setProcesando] = useState(false);
	const [continuo, setContinuo] = useState(false);
	const [aviso, setAviso] = useState<string | null>(null);
	const [servicio, setServicio] = useState<string | null | undefined>(
		undefined,
	);
	const [urlVerificada, setUrlVerificada] = useState<string | null>(null);
	const contador = useRef(0);
	const { contenedorRef, area, fijarImagen } = useAreaImagen();

	const pedido = PEDIDOS.find(p => p.id === pedidoId) ?? PEDIDOS[0];
	const ultima = historial[0] ?? null;

	useEffect(() => {
		servicioDisponible().then(setServicio);
	}, []);

	/** Lee la imagen, identifica la cara, la verifica y la agrega al historial. */
	const evaluar = useCallback(
		async (blob: Blob, elegida: CaraElegida, ignorarRepetidos: boolean) => {
			const respuesta = await detectar(blob);
			const identificada =
				elegida === 'auto' ? detectarCara(respuesta) : elegida;
			const r = verificarCara(identificada, respuesta, historialRef.current, {
				ignorarRepetidos,
				pesoPedidoKg: pedido.pesoKg,
			});
			contador.current += 1;
			const v: Verificacion = {
				id: contador.current,
				hora: new Date(),
				cara: identificada,
				pedidoId: pedido.id,
				codigos: respuesta.codigos,
				...r,
			};
			historialRef.current = [v, ...historialRef.current];
			setHistorial(historialRef.current);
			return v;
		},
		[pedido.id, pedido.pesoKg],
	);

	const sim = useSimulacion({
		mostrar: archivo => setImagenUrl(`/prueba/${archivo}`),
		procesar: async archivo => {
			try {
				const res = await fetch(`/prueba/${archivo}`);
				return await evaluar(await res.blob(), 'auto', true);
			} catch (e) {
				setAviso(e instanceof Error ? e.message : 'Error en la simulación');
				return null;
			}
		},
	});

	const verificar = useCallback(async () => {
		const blob = fuente === 'camara' ? await capturar() : imagenBlob.current;
		if (!blob) {
			setAviso('Primero elija una imagen o inicie la cámara.');
			return;
		}
		setProcesando(true);
		setAviso(null);
		try {
			await evaluar(blob, cara, false);
			setUrlVerificada(imagenUrl);
		} catch (e) {
			setAviso(e instanceof Error ? e.message : 'Error al verificar');
			setContinuo(false);
		} finally {
			setProcesando(false);
		}
	}, [fuente, capturar, evaluar, cara, imagenUrl]);

	useEffect(() => {
		if (!continuo || estado !== 'activa') return;
		const t = setInterval(() => {
			if (!procesando) void verificar();
		}, 1500);
		return () => clearInterval(t);
	}, [continuo, estado, procesando, verificar]);

	const cargarImagen = (archivo: File | undefined) => {
		if (!archivo) return;
		if (imagenUrl) URL.revokeObjectURL(imagenUrl);
		imagenBlob.current = archivo;
		setImagenNombre(archivo.name);
		setImagenUrl(URL.createObjectURL(archivo));
		setAviso(null);
	};

	const usarEjemplo = async (e: Ejemplo) => {
		const res = await fetch(`/prueba/${e.archivo}`);
		cargarImagen(
			new File([await res.blob()], e.nombre, { type: 'image/jpeg' }),
		);
		setImagenNombre(e.nombre);
	};

	const alElegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) =>
		cargarImagen(e.target.files?.[0]);
	const alElegirEjemplo = (e: Ejemplo) => () => void usarEjemplo(e);
	const alCambiarContinuo = (e: React.ChangeEvent<HTMLInputElement>) =>
		setContinuo(e.target.checked);

	const cambiarModo = (m: Modo) => {
		if (m === modo) return;
		sim.detener();
		detener();
		setContinuo(false);
		setAviso(null);
		setImagenUrl(null);
		setImagenNombre('');
		imagenBlob.current = null;
		setFuente('imagen');
		setModo(m);
	};

	const cambiarFuente = (f: Fuente) => {
		if (f === 'imagen') {
			detener();
			setContinuo(false);
		}
		setFuente(f);
	};

	const alternarSimulacion = () => {
		if (sim.activa) {
			sim.detener();
			return;
		}
		setAviso(null);
		void sim.iniciar();
	};

	const enSimulacion = modo === 'simulacion';
	const claseSim = sim.activa ? BOTON_CLARO : BOTON_PRINCIPAL;
	const conectado = typeof servicio === 'string';
	const puedeVerificar =
		detectorConfigurado &&
		conectado &&
		!procesando &&
		(fuente === 'camara' ? estado === 'activa' : Boolean(imagenUrl));

	const mostrarRecuadros = enSimulacion
		? sim.fase === 'resultado'
		: fuente === 'camara' || urlVerificada === imagenUrl;
	const cajaFinal = sim.activa && sim.veredictoCaja ? sim.veredictoCaja : null;
	const paso = !sim.activa ? null : cajaFinal ? 3 : sim.paso;
	const badge = ultima ? ESTILO_VEREDICTO[ultima.veredicto] : null;
	const badgeCaja = cajaFinal ? ESTILO_VEREDICTO[cajaFinal] : null;

	return (
		<div className='min-h-screen bg-stone-100 text-stone-900'>
			<header className='bg-pedregal text-white'>
				<div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6'>
					<div className='flex items-center gap-4'>
						<Link aria-label='Volver a la portada' href='/'>
							<LogoMarca
								className='h-10 w-auto'
								flechas='#FBC105'
								tinta='#FFFFFF'
							/>
						</Link>
						<div>
							<h1 className='text-base font-bold tracking-tight sm:text-xl'>
								Verificación de etiquetas de caja
							</h1>
							<p className='text-xs opacity-95 sm:text-sm'>
								El Pedregal · Packing 1 – Trujillo · uva de mesa
							</p>
						</div>
					</div>
					<p
						className={cn(
							'inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm font-medium',
							conectado ? 'bg-white text-emerald-900' : 'bg-red-950 text-white',
						)}
						role='status'
					>
						{conectado ? (
							<IconoCheck className='size-4' />
						) : (
							<IconoAlerta className='size-4' />
						)}
						{servicio === undefined
							? 'Conectando…'
							: conectado
								? `Detector ${detectorRemoto ? 'conectado' : 'integrado'}`
								: 'Detector sin conexión'}
					</p>
				</div>
			</header>

			<main className='mx-auto grid max-w-7xl items-start gap-4 p-3 sm:gap-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_23.5rem]'>
				<div className='space-y-4 lg:col-start-1 lg:row-start-1'>
					{servicio === null && (
						<div
							className='rounded-xl border-2 border-red-700 bg-red-50 p-4 text-sm text-red-950'
							role='alert'
						>
							<p className='font-semibold'>
								No se pudo conectar con el detector.
							</p>
							<p className='mt-1'>
								Inícielo en una terminal y recargue esta página:
							</p>
							<code className='mt-2 block rounded bg-white p-2 text-xs'>
								cd backend && .venv/bin/uvicorn main:app --port 8000
							</code>
						</div>
					)}

					<section className={cn(TARJETA, 'p-4 sm:p-5')}>
						<Alternador
							deshabilitado={sim.activa}
							etiqueta='Modo de uso'
							opciones={[
								{
									id: 'simulacion',
									nombre: 'Simulación de línea',
									icono: <IconoPlay className='size-4' />,
								},
								{
									id: 'manual',
									nombre: 'Revisar una caja',
									icono: <IconoImagen className='size-4' />,
								},
							]}
							valor={modo}
							onCambiar={cambiarModo}
						/>

						{enSimulacion ? (
							<div className='mt-4 space-y-3'>
								{AYUDA_SIMULACION}
								<div className='flex flex-wrap items-center gap-3'>
									<button
										className={claseSim}
										disabled={!detectorConfigurado || !conectado}
										type='button'
										onClick={alternarSimulacion}
									>
										{sim.activa ? (
											<IconoStop className='size-4' />
										) : (
											<IconoPlay className='size-4' />
										)}
										{sim.activa ? 'Detener simulación' : 'Iniciar simulación'}
									</button>
									{sim.activa && (
										<p className='text-sm text-stone-700'>
											Caja n.º <strong>{sim.numero}</strong>
										</p>
									)}
								</div>
								<Pasos actual={paso} />
							</div>
						) : (
							<div className='mt-4 space-y-4'>
								{AYUDA_MANUAL}
								<Alternador
									etiqueta='Origen de la imagen'
									opciones={[
										{
											id: 'imagen',
											nombre: 'Imagen',
											icono: <IconoImagen className='size-4' />,
										},
										{
											id: 'camara',
											nombre: 'Cámara',
											icono: <IconoCamara className='size-4' />,
										},
									]}
									valor={fuente}
									onCambiar={cambiarFuente}
								/>
								{fuente === 'camara' && !detectorRemoto && NOTA_CAMARA}

								<div className='flex flex-wrap items-center gap-3'>
									{fuente === 'camara' ? (
										estado === 'activa' ? (
											<button
												className={BOTON_CLARO}
												type='button'
												onClick={detener}
											>
												Apagar cámara
											</button>
										) : (
											<button
												className={BOTON_CLARO}
												disabled={estado === 'iniciando'}
												type='button'
												onClick={iniciar}
											>
												{estado === 'iniciando'
													? 'Iniciando…'
													: 'Encender cámara'}
											</button>
										)
									) : (
										<label
											className={cn(BOTON_CLARO, 'focus-within:outline-2')}
										>
											Elegir un archivo
											<input
												accept='image/*'
												className='sr-only'
												type='file'
												onChange={alElegirArchivo}
											/>
										</label>
									)}
									<button
										className={BOTON_PRINCIPAL}
										disabled={!puedeVerificar}
										type='button'
										onClick={() => void verificar()}
									>
										{procesando ? (
											<IconoSpinner className='size-4' />
										) : (
											<IconoCheck className='size-4' />
										)}
										{procesando ? 'Verificando…' : 'Verificar'}
									</button>
									{imagenNombre && fuente === 'imagen' && (
										<p className='text-sm text-stone-700'>
											Imagen: <strong>{imagenNombre}</strong>
										</p>
									)}
								</div>

								{fuente === 'imagen' && (
									<div className='space-y-3'>
										<p className='text-sm font-semibold text-stone-900'>
											O pruebe con un ejemplo
										</p>
										<div>
											<p className='mb-2 text-xs font-medium text-stone-600'>
												Etiquetas correctas
											</p>
											<div className='flex flex-wrap gap-2'>
												{EJEMPLOS_BUENOS.map(e => (
													<button
														key={e.archivo}
														className={cn(
															CHIP,
															'border-emerald-700 text-emerald-900 hover:bg-emerald-50',
														)}
														type='button'
														onClick={alElegirEjemplo(e)}
													>
														{e.nombre}
													</button>
												))}
											</div>
										</div>
										<div>
											<p className='mb-2 text-xs font-medium text-stone-600'>
												Con problemas
											</p>
											<div className='flex flex-wrap gap-2'>
												{EJEMPLOS_MALOS.map(e => (
													<button
														key={e.archivo}
														className={cn(
															CHIP,
															'border-red-700 text-red-900 hover:bg-red-50',
														)}
														type='button'
														onClick={alElegirEjemplo(e)}
													>
														{e.nombre}
													</button>
												))}
											</div>
										</div>
									</div>
								)}

								<details className='rounded-lg border border-stone-200 p-3 text-sm'>
									<summary className='cursor-pointer font-medium'>
										Opciones avanzadas
									</summary>
									<div className='mt-3 space-y-3'>
										<div>
											<p className='mb-2 text-xs font-medium text-stone-600'>
												Cara a revisar (normalmente Automática)
											</p>
											<Alternador
												etiqueta='Cara a revisar'
												opciones={CARAS}
												valor={cara}
												onCambiar={setCara}
											/>
										</div>
										<label className='flex min-h-11 items-center gap-2'>
											<input
												checked={continuo}
												className='size-5'
												disabled={fuente !== 'camara'}
												type='checkbox'
												onChange={alCambiarContinuo}
											/>
											Verificar con la cámara cada 1,5 segundos
										</label>
									</div>
								</details>
							</div>
						)}

						{aviso && (
							<p
								className='mt-3 flex items-center gap-2 text-sm font-medium text-red-800'
								role='alert'
							>
								<IconoAlerta className='size-4 shrink-0' />
								{aviso}
							</p>
						)}
					</section>
				</div>

				<section
					aria-label='Visor'
					className={cn(TARJETA, 'p-2 sm:p-4 lg:col-start-1 lg:row-start-2')}
				>
					<div
						ref={contenedorRef}
						className='relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl bg-stone-900 sm:aspect-video'
					>
						{!enSimulacion && fuente === 'camara' ? (
							<video
								ref={videoRef}
								aria-label='Vista de la cámara'
								className='size-full object-contain'
								muted
								playsInline
								onLoadedMetadata={e =>
									fijarImagen({
										w: e.currentTarget.videoWidth,
										h: e.currentTarget.videoHeight,
									})
								}
							/>
						) : imagenUrl ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								alt={imagenNombre || 'Etiqueta de la caja a verificar'}
								className='size-full object-contain'
								src={imagenUrl}
								onLoad={e =>
									fijarImagen({
										w: e.currentTarget.naturalWidth,
										h: e.currentTarget.naturalHeight,
									})
								}
							/>
						) : null}

						{!enSimulacion && fuente === 'camara' && estado !== 'activa' && (
							<p className='absolute px-4 text-center text-sm text-stone-200'>
								{error ?? 'La cámara está apagada. Pulse “Encender cámara”.'}
							</p>
						)}
						{!imagenUrl && (enSimulacion || fuente === 'imagen') && (
							<p className='absolute px-4 text-center text-sm text-stone-200'>
								{enSimulacion
									? 'Pulse “Iniciar simulación” para ver pasar las cajas.'
									: 'Elija una imagen o un ejemplo para empezar.'}
							</p>
						)}

						{mostrarRecuadros && (
							<Superposicion
								area={area}
								codigos={ultima?.codigos ?? []}
								veredicto={ultima?.veredicto ?? null}
							/>
						)}

						{sim.activa && sim.fase === 'escaneando' && (
							<div
								aria-hidden='true'
								className='escaneo pointer-events-none absolute inset-0'
							/>
						)}

						{sim.activa && (
							<p className='absolute top-3 left-3 rounded-full bg-stone-900/90 px-3 py-1 text-xs font-semibold text-white'>
								Caja n.º {sim.numero} ·{' '}
								{sim.paso === 1 ? 'Etiqueta principal' : 'Costado (QR)'}
							</p>
						)}

						{sim.activa && sim.fase !== 'resultado' && (
							<p className='absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-stone-900/90 px-4 py-1.5 text-sm text-white'>
								{sim.fase === 'llegando' ? 'Llega la caja…' : 'Revisando…'}
							</p>
						)}

						{sim.activa && sim.fase === 'resultado' && badge && !cajaFinal && (
							<p
								className={cn(
									'absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl px-4 py-1.5 text-base font-black text-white shadow-lg sm:px-5 sm:py-2 sm:text-xl',
									badge.solido,
								)}
							>
								{ultima && <badge.Icono className='size-6' />}
								{badge.titulo}
							</p>
						)}

						{badgeCaja && (
							<div className='absolute inset-0 flex items-center justify-center bg-stone-900/65'>
								<div
									className={cn(
										'rounded-2xl px-5 py-4 text-center text-white shadow-2xl sm:px-8 sm:py-5',
										badgeCaja.solido,
									)}
								>
									<p className='text-sm font-semibold'>Caja n.º {sim.numero}</p>
									<p className='flex items-center justify-center gap-2 text-2xl font-black sm:text-3xl'>
										<badgeCaja.Icono className='size-8' />
										{badgeCaja.titulo}
									</p>
								</div>
							</div>
						)}
					</div>
				</section>

				<aside className='space-y-4 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-3 lg:row-start-1'>
					<TarjetaResultado ultima={ultima} />

					{sim.totales.total > 0 && (
						<section className={cn(TARJETA, 'p-4')}>
							<h2 className='text-base font-semibold'>
								Cajas de la simulación
							</h2>
							<dl className='mt-2 grid grid-cols-4 gap-2 text-center'>
								{[
									['Cajas', sim.totales.total, 'text-stone-900'],
									['Buenas', sim.totales.buenas, 'text-emerald-800'],
									['Malas', sim.totales.malas, 'text-red-800'],
									['Revisar', sim.totales.revisar, 'text-amber-800'],
								].map(([nombre, valor, clase]) => (
									<div key={nombre}>
										<dt className='text-xs text-stone-600'>{nombre}</dt>
										<dd
											className={cn(
												'text-2xl font-bold tabular-nums',
												String(clase),
											)}
										>
											{valor}
										</dd>
									</div>
								))}
							</dl>
						</section>
					)}

					<Contadores historial={historial} />

					<section className={cn(TARJETA, 'p-4 text-sm')}>
						<h2 className='text-base font-semibold'>
							¿Qué significa cada resultado?
						</h2>
						<ul className='mt-2 space-y-2'>
							{(['conforme', 'no_conforme', 'sin_lectura'] as const).map(v => {
								const e = ESTILO_VEREDICTO[v];
								return (
									<li key={v} className='flex items-start gap-2'>
										<span
											className={cn(
												'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white',
												e.solido,
											)}
										>
											<e.Icono className='size-4' />
										</span>
										<span>
											<strong>{e.titulo}.</strong> {e.accion}
										</span>
									</li>
								);
							})}
						</ul>
					</section>

					<SelectorPedido
						pedido={pedido}
						pedidos={PEDIDOS}
						onCambiar={setPedidoId}
					/>
				</aside>

				<div className='lg:col-start-1 lg:row-start-3'>
					<Historial historial={historial} />
				</div>
			</main>
		</div>
	);
}
