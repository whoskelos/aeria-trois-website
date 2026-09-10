// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Temporal: https://aeriatrois.vercel.app
// Definitivo: https://aeriatrois.es (cambiar SITE_URL en Vercel o el fallback de abajo)
const siteUrl =
	process.env.SITE_URL ??
	(process.env.VERCEL_ENV === 'production'
		? 'https://aeriatrois.vercel.app'
		: process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}`
			: 'http://localhost:4321');

export default defineConfig({
  site: siteUrl,
  output: 'static',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  }
});