import { dev } from '$app/environment';

/** Stale PWA service workers cache old JS and break hydration + HMR in dev. */
if (dev && 'serviceWorker' in navigator) {
	void navigator.serviceWorker.getRegistrations().then((registrations) => {
		for (const registration of registrations) {
			void registration.unregister();
		}
	});
}

/** Android edge-to-edge PWAs paint the gesture nav bar from the document background. */
function syncSystemBarBackground() {
	const background = getComputedStyle(document.documentElement)
		.getPropertyValue('--app-background')
		.trim();
	if (!background) return;

	document.documentElement.style.backgroundColor = background;
	document.body.style.backgroundColor = background;
}

syncSystemBarBackground();

for (const scheme of ['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'] as const) {
	window.matchMedia(scheme).addEventListener('change', syncSystemBarBackground);
}
