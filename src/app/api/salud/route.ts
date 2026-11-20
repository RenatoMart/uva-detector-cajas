import { MODO } from '@/lib/simulacion';

export const runtime = 'nodejs';

/** GET /api/salud: indica que el detector integrado está disponible. */
export function GET() {
	return Response.json({ ok: true, modo: MODO });
}
