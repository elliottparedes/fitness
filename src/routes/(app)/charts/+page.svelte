<script lang="ts">
	import Card, { Content } from '@smui/card';
	import ExerciseProgressCard from '$lib/components/ExerciseProgressCard.svelte';
	import { CATEGORY_LABELS, EXERCISE_CATEGORIES, type ExerciseCategory } from '$lib/domain/exercise';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedCategory = $state<ExerciseCategory | null>(null);

	const categorySections: { category: ExerciseCategory }[] = EXERCISE_CATEGORIES.map((category) => ({
		category
	}));

	const filterTabs: { value: ExerciseCategory | null; label: string; shortLabel: string }[] = [
		{ value: null, label: 'All', shortLabel: 'All' },
		...EXERCISE_CATEGORIES.map((category) => ({
			value: category,
			label: CATEGORY_LABELS[category],
			shortLabel:
				category === 'free_weight' ? 'Weights' : category === 'machine' ? 'Machine' : CATEGORY_LABELS[category]
		}))
	];

	const visibleSections = $derived(
		selectedCategory === null
			? categorySections
			: categorySections.filter((section) => section.category === selectedCategory)
	);

	function selectFilter(category: ExerciseCategory | null) {
		selectedCategory = category;
	}
</script>

<div class="charts-page">
	<header class="charts-page__header">
		<h1 class="page-title">Charts</h1>
		<p class="muted charts-page__lead">
			Progress for every exercise you have logged in the last {data.lookbackDays} days.
		</p>
		{#if data.totalCount > 0}
			<p class="charts-page__count muted">
				{data.totalCount} exercise{data.totalCount === 1 ? '' : 's'} with session data
			</p>
		{/if}
	</header>

	{#if data.totalCount > 0}
		<nav class="charts-filter" aria-label="Filter by category">
			{#each filterTabs as tab}
				{@const active = selectedCategory === tab.value}
				{@const count = tab.value ? data.byCategory[tab.value].length : data.totalCount}
				<button
					type="button"
					class="charts-filter__tab"
					class:charts-filter__tab--active={active}
					aria-pressed={active}
					onclick={() => selectFilter(tab.value)}
				>
					<span class="charts-filter__short">{tab.shortLabel}</span>
					<span class="charts-filter__full">{tab.label}</span>
					<span class="charts-filter__count">{count}</span>
				</button>
			{/each}
		</nav>
	{/if}

	{#if data.totalCount === 0}
		<div class="empty-state">
			<span class="material-icons empty-state__icon" aria-hidden="true">show_chart</span>
			<p>No progress charts yet</p>
			<p class="muted">Log a few workouts with the same exercises to see trends here.</p>
			<a href="/workouts/new" class="btn btn--primary">Start workout</a>
		</div>
	{:else}
		{#each visibleSections as section (section.category)}
			{@const cards = data.byCategory[section.category]}
			<section class="charts-section">
				<div class="charts-section__header">
					<h2 class="section-title">{CATEGORY_LABELS[section.category]}</h2>
					<span class="muted charts-section__count">
						{cards.length} exercise{cards.length === 1 ? '' : 's'}
					</span>
				</div>

				{#if cards.length > 0}
					<div class="progress-grid">
						{#each cards as card (card.exerciseId)}
							<ExerciseProgressCard {card} />
						{/each}
					</div>
				{:else}
					<Card>
						<Content style="padding: 1rem 1.25rem">
							<p class="muted" style="margin: 0">
								No {CATEGORY_LABELS[section.category].toLowerCase()} logged in this period yet.
							</p>
						</Content>
					</Card>
				{/if}
			</section>
		{/each}
	{/if}
</div>

<style>
	.charts-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding-bottom: 1rem;
	}

	.charts-page__header .page-title {
		margin-bottom: 0.35rem;
	}

	.charts-page__lead {
		margin: 0;
		line-height: 1.5;
	}

	.charts-page__count {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
	}

	.charts-filter {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.35rem;
		padding: 0.25rem;
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--app-surface, #fff) 90%, transparent);
		border: 1px solid var(--app-border);
	}

	.charts-filter__tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		min-height: 2.75rem;
		padding: 0.45rem 0.25rem;
		border-radius: 0.55rem;
		border: 0;
		font: inherit;
		font-size: 0.75rem;
		font-weight: 500;
		text-align: center;
		color: var(--app-muted);
		background: transparent;
		cursor: pointer;
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.charts-filter__tab:hover,
	.charts-filter__tab:focus-visible {
		color: var(--app-on-surface);
		outline: 2px solid var(--app-accent, #0d9488);
		outline-offset: 1px;
	}

	.charts-filter__tab--active {
		background: var(--app-fab-bg, #0f766e);
		color: var(--app-fab-fg, #fff);
		font-weight: 600;
	}

	.charts-filter__tab--active .charts-filter__count {
		background: color-mix(in srgb, var(--app-fab-fg, #fff) 22%, transparent);
		color: var(--app-fab-fg, #fff);
	}

	.charts-filter__full {
		display: none;
	}

	.charts-filter__count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.25rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 600;
		background: color-mix(in srgb, var(--app-accent, #0d9488) 14%, transparent);
		color: var(--app-accent, #0d9488);
	}

	.charts-section__header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.charts-section__header .section-title {
		margin: 0;
	}

	.charts-section__count {
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.progress-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.empty-state .btn {
		margin-top: 1rem;
	}

	@media (max-width: 600px) {
		.progress-grid {
			grid-template-columns: 1fr;
		}

		.charts-section__header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}

	@media (min-width: 640px) {
		.charts-filter__short {
			display: none;
		}

		.charts-filter__full {
			display: inline;
		}
	}

	@media (max-width: 600px) {
		.charts-filter {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 380px) {
		.charts-filter {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
