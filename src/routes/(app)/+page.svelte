<script lang="ts">
	import Card, { Content } from '@smui/card';
	import WorkoutSummaryCard from '$lib/components/WorkoutSummaryCard.svelte';
	import ExerciseProgressCard from '$lib/components/ExerciseProgressCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="page-title">Dashboard</h1>
<p class="muted">Track machines, cardio, and free-weight sessions.</p>

<Card style="margin-top: 1rem">
	<Content style="padding: 1rem">
		<h2 class="section-title section-title--on-surface" style="margin-bottom: 0.75rem">Quick start</h2>
		<div class="row-actions" style="margin-top: 0">
			<a href="/workouts/new" class="btn btn--primary">Start workout</a>
			<a href="/exercises" class="btn btn--secondary">Add exercise</a>
			{#if data.workouts[0]}
				<a href="/workouts/{data.workouts[0].id}" class="btn btn--secondary">Resume recent workout</a>
			{/if}
		</div>
	</Content>
</Card>

<div class="kpi-grid">
	<Card>
		<Content style="padding: 1rem">
			<p class="muted" style="margin: 0 0 0.35rem">Workouts this week</p>
			<p class="kpi-value">{data.stats.thisWeekWorkouts}</p>
		</Content>
	</Card>
	<Card>
		<Content style="padding: 1rem">
			<p class="muted" style="margin: 0 0 0.35rem">Current streak</p>
			<p class="kpi-value">{data.stats.streakDays} day{data.stats.streakDays === 1 ? '' : 's'}</p>
		</Content>
	</Card>
	{#if data.stats.prCount > 0}
		<Card>
			<Content style="padding: 1rem">
				<p class="muted" style="margin: 0 0 0.35rem">PRs this period</p>
				<p class="kpi-value">{data.stats.prCount}</p>
				<p class="muted" style="margin: 0">At your best on recent lifts</p>
			</Content>
		</Card>
	{/if}
</div>

<section class="progress-section">
	<div class="section-header">
		<h2 class="section-title">Exercise progress</h2>
		<p class="muted section-subtitle">Top weight or duration over your last sessions</p>
	</div>

	{#if data.exerciseProgress.length > 0}
		<div class="progress-grid">
			{#each data.exerciseProgress as card (card.exerciseId)}
				<ExerciseProgressCard {card} />
			{/each}
		</div>
	{:else}
		<Card>
			<Content style="padding: 1.25rem 1rem">
				<p style="margin: 0 0 0.35rem">No progress charts yet</p>
				<p class="muted" style="margin: 0">
					Log a few workouts with the same exercises to see trends and personal records here.
				</p>
			</Content>
		</Card>
	{/if}
</section>

<h2 class="section-title" style="margin-top: 1.5rem">Recent workouts</h2>
<div class="workout-list" style="margin-top: 1.5rem">
	{#each data.workouts as workout (workout.id)}
		<WorkoutSummaryCard {workout} />
	{:else}
		<Card>
			<Content style="padding: 1rem">
				<p style="margin: 0">No workouts yet. Log your first session.</p>
			</Content>
		</Card>
	{/each}
</div>

<div class="row-actions">
	<a href="/workouts" class="btn btn--secondary">All workouts</a>
</div>

<a href="/workouts/new" class="fab" aria-label="Log workout">
	<span class="material-icons" aria-hidden="true">add</span>
</a>

<style>
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.kpi-value {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}
	.progress-section {
		margin-top: 1.75rem;
	}
	.section-header {
		margin-bottom: 1rem;
	}
	.section-header .section-title {
		margin: 0;
	}
	.section-subtitle {
		margin: 0.35rem 0 0;
		font-size: 0.875rem;
	}
	.progress-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}
	.workout-list {
		display: grid;
		gap: 0.75rem;
	}

	@media (max-width: 600px) {
		.progress-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
