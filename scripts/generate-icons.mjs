import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';

const svgData = readFileSync('static/barbell.svg', 'utf8');

const icons = [
	{ size: 192, name: 'pwa-192x192.png' },
	{ size: 512, name: 'pwa-512x512.png' },
	{ size: 180, name: 'apple-touch-icon.png' },
];

for (const { size, name } of icons) {
	const resvg = new Resvg(svgData, { fitTo: { mode: 'width', value: size } });
	const png = resvg.render().asPng();
	writeFileSync(`static/${name}`, png);
	console.log(`✓ static/${name} (${size}×${size})`);
}
