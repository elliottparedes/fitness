import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import type { ManifestOptions } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

/** Chrome 130+ manifest field; not yet in vite-plugin-pwa types */
type FitnessManifest = Partial<ManifestOptions> & { edge_to_edge?: boolean };

const pwaManifest: FitnessManifest = {
	name: 'Fitness Tracker',
	short_name: 'Fitness',
	description: 'Track workouts, exercises, and progress',
	start_url: '/',
	scope: '/',
	display: 'standalone',
	display_override: ['window-controls-overlay', 'standalone'],
	theme_color: '#0f766e',
	background_color: '#f1f5f9',
	edge_to_edge: true,
	icons: [
		{
			src: '/pwa-192x192.png',
			sizes: '192x192',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: '/pwa-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'any'
		},
		{
			src: '/pwa-512x512.png',
			sizes: '512x512',
			type: 'image/png',
			purpose: 'maskable'
		}
	]
};

export default defineConfig({
	plugins: [
		sveltekit(),
		// PWA only in production — dev service workers cache stale bundles and break hydration/HMR
		...(process.env.NODE_ENV === 'production'
			? [
					SvelteKitPWA({
						registerType: 'autoUpdate',
						manifest: pwaManifest,
						workbox: {
							globPatterns: ['**/*.{js,css,html,svg,woff2,ico,png,webmanifest}']
						}
					})
				]
			: [])
	]
});
