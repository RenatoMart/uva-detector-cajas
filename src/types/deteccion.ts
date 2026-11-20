/** Caja delimitadora normalizada (0 a 1) respecto del ancho y alto de la imagen. */
export interface Caja {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * Tipos de código que lleva una caja:
 * - codigo_caja: código de barras de la etiqueta principal (número único de caja).
 * - qr_personal: QR del trabajador responsable de una acción (selección, pesado...).
 * - qr_peso: QR rosado asociado al peso de la caja.
 */
export type TipoCodigo = 'codigo_caja' | 'qr_personal' | 'qr_peso' | 'otro';

export interface CodigoLeido {
	tipo: TipoCodigo;
	texto: string;
	caja: Caja;
}

/** Respuesta del servicio de lectura (POST /detectar). */
export interface RespuestaDetector {
	codigos: CodigoLeido[];
	etiqueta: Caja | null;
	ms: number;
	/** 'simulado' mientras no haya un modelo YOLO entrenado. */
	modo?: string;
	/** false = imagen fuera del conjunto de ejemplos (solo en modo simulado). */
	conocida?: boolean;
}

/** Cara de la caja que se está revisando. */
export type Cara = 'principal' | 'costado';

export type Veredicto = 'conforme' | 'no_conforme' | 'sin_lectura';

export interface Pedido {
	id: string;
	presentacion: string;
	cliente: string;
	clienteFinal: string;
	pais: string;
	pesoKg: number;
}

/** Dato legible que se obtuvo de los códigos (por ejemplo, el peso de la caja). */
export interface Dato {
	etiqueta: string;
	valor: string;
}

export interface Verificacion {
	id: number;
	hora: Date;
	/** null = no se pudo identificar la cara (imagen ilegible). */
	cara: Cara | null;
	pedidoId: string;
	veredicto: Veredicto;
	motivos: string[];
	info: Dato[];
	codigos: CodigoLeido[];
}
