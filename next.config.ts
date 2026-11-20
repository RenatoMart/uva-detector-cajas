import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// "standalone" es para la imagen de Docker; en Vercel rompe el paso final del build.
	output: process.env.VERCEL ? undefined : 'standalone',
};

export default nextConfig;
