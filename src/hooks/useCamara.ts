'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type EstadoCamara = 'apagada' | 'iniciando' | 'activa' | 'error';

/** Controla la cámara del navegador y captura cuadros como JPEG. */
export function useCamara() {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [estado, setEstado] = useState<EstadoCamara>('apagada');
	const [error, setError] = useState<string | null>(null);

	const detener = useCallback(() => {
		streamRef.current?.getTracks().forEach(t => t.stop());
		streamRef.current = null;
		if (videoRef.current) videoRef.current.srcObject = null;
		setEstado('apagada');
	}, []);

	const iniciar = useCallback(async () => {
		setEstado('iniciando');
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 } },
				audio: false,
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
			}
			setEstado('activa');
		} catch (e) {
			setError(e instanceof Error ? e.message : 'No se pudo abrir la cámara');
			setEstado('error');
		}
	}, []);

	const capturar = useCallback(async (): Promise<Blob | null> => {
		const video = videoRef.current;
		if (!video || !video.videoWidth) return null;
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext('2d')?.drawImage(video, 0, 0);
		return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
	}, []);

	useEffect(() => detener, [detener]);

	return { videoRef, estado, error, iniciar, detener, capturar };
}
