<script lang="ts">
	import Card, { Content } from '@smui/card';
	import SparklineChart from '$lib/components/SparklineChart.svelte';
	import { CATEGORY_LABELS } from '$lib/domain/exercise';
	import type { ExerciseProgressCard } from '$lib/domain/progress';
	import { formatWeight } from '$lib/format';

	let { card }: { card: ExerciseProgressCard } = $props();

	const chartValues = $derived(card.points.map((point) => point.value));
	const lastReps = $derived(card.points.at(-1)?.reps);

	function formatValue(value: number): string {
		if (card.unit === 'kg' || card.unit === 'lb') {
			return formatWeight(value, card.unit);
		}
		if (card.unit === 'min') {
			return `${value} min`;
		}
		return `${value} mi`;
	}

	function trendLabel(): string {
		if (card.trendPct == null) {
			return card.sessionCount === 1 ? 'First session logged' : 'No prior session to compare';
		}
		if (card.trendPct === 0) return 'Same as last session';
		const sign = card.trendPct > 0 ? '+' : '';
		return `${sign}${card.trendPct}% vs last session`;
	}

	const trendIcon = $derived(
		card.trendDirection === 'up'
			? 'trending_up'
			: card.trendDirection === 'down'
				? 'trending_down'
				: 'trending_flat'
	);
</script>

<Card class="progress-card">
	<Content class="progress-card__content">
		<div class="progress-card__header">
			<div>
				<h3 class="progress-card__title">{card.exerciseName}</h3>
				<p class="muted progress-card__meta">
					{CATEGORY_LABELS[card.category]} · {card.metricLabel}
				</p>
			</div>
			{#if card.isPr}
				<span class="pr-badge">PR</span>
			{/if}
		</div>

		{#if chartValues.length > 0}
			<SparklineChart values={chartValues} trendDirection={card.trendDirection} />
		{/if}

		<div class="progress-card__stats">
			<div class="stat-block">
				<span class="stat-block__label">Latest</span>
				<span class="stat-block__value">
					{#if card.lastValue != null}
						{formatValue(card.lastValue)}
						{#if lastReps && (card.unit === 'kg' || card.unit === 'lb')}
							<span class="muted"> × {lastReps}</span>
						{/if}
					{:else}
						—
					{/if}
				</span>
			</div>
			<div class="stat-block">
				<span class="stat-block__label">Best</span>
				<span class="stat-block__value">
					{#if card.pr != null}
						{formatValue(card.pr)}
						{#if card.prReps && (card.unit === 'kg' || card.unit === 'lb')}
							<span class="muted"> × {card.prReps}</span>
						{/if}
					{:else}
						—
					{/if}
				</span>
			</div>
		</div>

		<p class="progress-card__trend" class:trend--up={card.trendDirection === 'up'} class:trend--down={card.trendDirection === 'down'}>
			<span class="material-icons trend-icon" aria-hidden="true">{trendIcon}</span>
			{trendLabel()}
		</p>
	</Content>
</Card>

<style>
	:global(.progress-card) {
		overflow: hidden;
	}

	:global(.progress-card__content) {
		padding: 1rem !important;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.progress-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.progress-card__title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
	}

	.progress-card__meta {
		margin: 0.2rem 0 0;
		font-size: 0.8rem;
	}

	.pr-badge {
		flex-shrink: 0;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--app-pr, #ca8a04) 22%, var(--app-accent-subtle, transparent));
		color: var(--app-pr, #ca8a04);
		border: 1px solid color-mix(in srgb, var(--app-pr, #ca8a04) 45%, transparent);
	}

	.progress-card__stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.stat-block {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.stat-block__label {
		font-size: 0.75rem;
		color: var(--app-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.stat-block__value {
		font-size: 1.1rem;
		font-weight: 600;
	}

	.progress-card__trend {
		margin: 0;
		font-size: 0.85rem;
		color: var(--app-muted);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.trend-icon {
		font-size: 1.1rem;
	}

	.trend--up {
		color: var(--app-trend-up, #15803d);
	}

	.trend--down {
		color: var(--app-trend-down, #b91c1c);
	}
</style>
