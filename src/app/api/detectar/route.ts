import { leerImagen } from '@/lib/simulacion';

export const runtime = 'nodejs';

/** POST /api/detectar (multipart, campo `imagen`): lee las etiquetas de la imagen. */
export async function POST(req: Request) {
	const datos = await req.formData().catch(() => null);
	const imagen = datos?.get('imagen');
	if (!(imagen instanceof File)) {
		return Response.json({ error: 'Falta el campo "imagen"' }, { status: 400 });
	}
	return Response.json(leerImagen(Buffer.from(await imagen.arrayBuffer())));
}
