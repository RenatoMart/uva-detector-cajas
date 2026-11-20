import type {
	Cara,
	Dato,
	RespuestaDetector,
	Veredicto,
	Verificacion,
} from '@/types/deteccion';
import { CARTONES, TRABAJADORES } from './registro';

/** Código de caja: 3 letras + 13 dígitos (ej. BAC7317469210284). */
const PATRON_CAJA = /^[A-Z]{3}\d{13}$/;
/** QR de personal: 15 dígitos (ej. 002922100038337). */
const PATRON_PERSONAL = /^\d{15}$/;
const QR_PERSONAL_ESPERADOS = 3;
const QR_PESO_ESPERADOS = 1;

export interface ResultadoVerificacion {
	veredicto: Veredicto;
	motivos: string[];
	/** Lo que dicen los códigos, ya interpretado con el registro. */
	info: Dato[];
}

/** Identifica la cara por los códigos que se leen en la imagen. */
export function detectarCara(respuesta: RespuestaDetector): Cara | null {
	const { codigos } = respuesta;
	if (respuesta.marco) return 'principal';
	if (codigos.some(c => c.tipo === 'codigo_caja')) return 'principal';
	if (codigos.some(c => c.tipo === 'qr_personal' || c.tipo === 'qr_peso')) {
		return 'costado';
	}
	return null;
}

interface Opciones {
	/** La simulación reutiliza pocas fotos, así que no controla repetidos. */
	ignorarRepetidos?: boolean;
	/** Peso de caja del pedido activo, para comparar con el QR de peso. */
	pesoPedidoKg?: number;
}

function resultado(motivos: string[], info: Dato[]): ResultadoVerificacion {
	return {
		veredicto: motivos.length ? 'no_conforme' : 'conforme',
		motivos,
		info,
	};
}

/** Valida el contenido de los QR del costado contra el registro. */
function validarQr(
	respuesta: RespuestaDetector,
	opciones: Opciones,
): ResultadoVerificacion {
	const personal = respuesta.codigos.filter(c => c.tipo === 'qr_personal');
	const peso = respuesta.codigos.filter(c => c.tipo === 'qr_peso');
	const motivos: string[] = [];
	const info: Dato[] = [];

	const esperados = QR_PERSONAL_ESPERADOS;
	if (personal.length < esperados) {
		motivos.push(
			`Faltan QR de personal (se leyeron ${personal.length} de ${esperados})`,
		);
	}
	if (peso.length < QR_PESO_ESPERADOS) motivos.push('Falta el QR de peso');

	const vistos = new Set<string>();
	for (const { texto } of personal) {
		if (!PATRON_PERSONAL.test(texto)) {
			motivos.push(`QR de personal con formato no válido (${texto})`);
		} else if (vistos.has(texto)) {
			motivos.push('El mismo QR de personal aparece dos veces');
		} else {
			vistos.add(texto);
			const t = TRABAJADORES.find(x => x.codigo === texto);
			if (t) info.push({ etiqueta: t.accion, valor: t.nombre });
			else motivos.push(`Trabajador no registrado (código ${texto})`);
		}
	}

	for (const { texto } of peso) {
		const kg = CARTONES[texto];
		if (kg === undefined) {
			motivos.push(`QR de peso desconocido (${texto})`);
			continue;
		}
		info.push({ etiqueta: 'Peso de la caja', valor: `${kg} kg` });
		const esperado = opciones.pesoPedidoKg;
		if (esperado !== undefined && kg !== esperado) {
			motivos.push(
				`El peso del QR (${kg} kg) no coincide con el pedido (${esperado} kg)`,
			);
		}
	}
	return resultado(motivos, info);
}

/**
 * Revisa una cara de la caja.
 * - principal: debe leerse 1 código de caja válido y no repetido.
 * - costado: deben leerse 3 QR de personal y 1 QR de peso, y su contenido debe
 *   coincidir con el registro (trabajadores y peso del pedido).
 * `historial` va del más reciente al más antiguo.
 */
export function verificarCara(
	cara: Cara | null,
	respuesta: RespuestaDetector,
	historial: Verificacion[],
	opciones: Opciones = {},
): ResultadoVerificacion {
	const { codigos, etiqueta } = respuesta;
	const fuera =
		'Imagen fuera de la simulación: solo se reconocen las imágenes de ejemplo';
	const sinCodigos = (m: string): ResultadoVerificacion => ({
		veredicto: 'sin_lectura',
		motivos: [
			respuesta.conocida === false
				? fuera
				: etiqueta || codigos.length
					? m
					: 'No se detectó etiqueta',
		],
		info: [],
	});

	if (respuesta.marco === 'incompleto') {
		return resultado(['El contenido se sale del recuadro de la etiqueta'], []);
	}

	if (cara === null) {
		return sinCodigos('Códigos ilegibles: no se pudo identificar la cara');
	}

	if (cara === 'principal') {
		const cajas = codigos.filter(c => c.tipo === 'codigo_caja');
		if (!cajas.length) return sinCodigos('Código de barras ilegible o ausente');

		const codigo = cajas[0].texto;
		const motivos: string[] = [];
		if (!PATRON_CAJA.test(codigo)) {
			motivos.push(`Formato de código de caja no válido (${codigo})`);
		}
		// Se ignora la última revisión: en modo continuo es la misma caja en pantalla.
		const previas = historial.filter(v => v.cara === 'principal').slice(1);
		if (
			!opciones.ignorarRepetidos &&
			previas.some(v => v.codigos.some(c => c.texto === codigo))
		) {
			motivos.push(`Código de caja repetido (${codigo})`);
		}
		return resultado(motivos, [{ etiqueta: 'Código de caja', valor: codigo }]);
	}

	if (!codigos.some(c => c.tipo === 'qr_personal' || c.tipo === 'qr_peso')) {
		return sinCodigos('QR ilegibles o ausentes');
	}
	return validarQr(respuesta, opciones);
}
