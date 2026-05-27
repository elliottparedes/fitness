<script lang="ts">
	let {
		values,
		trendDirection = null,
		width = 280,
		height = 72
	}: {
		values: number[];
		trendDirection?: 'up' | 'down' | 'flat' | null;
		width?: number;
		height?: number;
	} = $props();

	const padding = { top: 8, right: 8, bottom: 8, left: 8 };

	const plot = $derived.by(() => {
		const safe = values.length ? values : [0];
		const min = Math.min(...safe);
		const max = Math.max(...safe);
		const range = max - min || 1;
		const innerW = width - padding.left - padding.right;
		const innerH = height - padding.top - padding.bottom;

		const points = safe.map((value, index) => {
			const x =
				padding.left + (safe.length === 1 ? innerW / 2 : (index / (safe.length - 1)) * innerW);
			const y = padding.top + innerH - ((value - min) / range) * innerH;
			return { x, y, value };
		});

		const line = points.map((point) => `${point.x},${point.y}`).join(' ');
		const area = `${padding.left},${padding.top + innerH} ${line} ${padding.left + innerW},${padding.top + innerH}`;

		return { points, line, area, min, max };
	});

	const strokeClass = $derived(
		trendDirection === 'up'
			? 'sparkline--up'
			: trendDirection === 'down'
				? 'sparkline--down'
				: 'sparkline--neutral'
	);

	const fillId = `sparkline-fill-${crypto.randomUUID()}`;
</script>

<svg
	class="sparkline {strokeClass}"
	viewBox="0 0 {width} {height}"
	width="100%"
	height={height}
	role="img"
	aria-hidden="true"
>
	<defs>
		<linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
			<stop offset="0%" stop-color="currentColor" stop-opacity="0.28" />
			<stop offset="100%" stop-color="currentColor" stop-opacity="0.02" />
		</linearGradient>
	</defs>
	{#if plot.points.length > 1}
		<polygon class="sparkline__area" points={plot.area} fill="url(#{fillId})" />
		<polyline class="sparkline__line" points={plot.line} />
	{/if}
	{#each plot.points as point, index (index)}
		<circle class="sparkline__dot" cx={point.x} cy={point.y} r="3.5" />
	{/each}
</svg>

<style>
	.sparkline {
		display: block;
		color: var(--app-muted);
	}

	.sparkline--up {
		color: var(--app-trend-up, #15803d);
	}

	.sparkline--down {
		color: var(--app-trend-down, #b91c1c);
	}

	.sparkline--neutral {
		color: var(--app-accent, #0d9488);
	}

	.sparkline__line {
		fill: none;
		stroke: currentColor;
		stroke-width: 2.25;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.sparkline__dot {
		fill: var(--app-surface, #fff);
		stroke: currentColor;
		stroke-width: 2;
	}

</style>
