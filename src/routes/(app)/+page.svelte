<script lang="ts">
	import Button, { Label } from '@smui/button';
	import Card, { Content } from '@smui/card';
	import Fab, { Icon } from '@smui/fab';
import WorkoutSummaryCard from '$lib/components/WorkoutSummaryCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatVolume(value: number): string {
		return Math.round(value).toLocaleString();
	}
</script>

<h1 class="page-title">Dashboard</h1>
<p class="muted">Track machines, cardio, and free-weight sessions.</p>

<Card style="margin-top: 1rem">
	<Content style="padding: 1rem">
		<h2 class="section-title section-title--on-surface" style="margin-bottom: 0.75rem">Quick start</h2>
		<div class="row-actions" style="margin-top: 0">
			<Button variant="raised" href="/workouts/new">
				<Label>Start workout</Label>
			</Button>
			<Button href="/exercises">
				<Label>Add exercise</Label>
			</Button>
			{#if data.workouts[0]}
				<Button href="/workouts/{data.workouts[0].id}">
					<Label>Resume recent workout</Label>
				</Button>
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
			<p class="muted" style="margin: 0 0 0.35rem">Weekly volume</p>
			<p class="kpi-value">{formatVolume(data.stats.thisWeekVolume)} lbs</p>
			<p class="muted" style="margin: 0">
				{#if data.stats.volumeTrendPct == null}
					No prior week baseline
				{:else if data.stats.volumeTrendPct >= 0}
					+{data.stats.volumeTrendPct}% vs last week
				{:else}
					{data.stats.volumeTrendPct}% vs last week
				{/if}
			</p>
		</Content>
	</Card>
	<Card>
		<Content style="padding: 1rem">
			<p class="muted" style="margin: 0 0 0.35rem">Current streak</p>
			<p class="kpi-value">{data.stats.streakDays} day{data.stats.streakDays === 1 ? '' : 's'}</p>
		</Content>
	</Card>
</div>

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
	<Button href="/workouts">
		<Label>All workouts</Label>
	</Button>
</div>

<a href="/workouts/new" class="fab-anchor" aria-label="Log workout">
	<Fab color="primary" class="fab-fixed">
		<Icon class="material-icons">add</Icon>
	</Fab>
</a>

<style>
	.fab-anchor {
		position: fixed;
		right: 1.5rem;
		bottom: 1.5rem;
		text-decoration: none;
	}
	:global(.fab-fixed) {
		position: relative;
	}
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.kpi-value {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}
	.workout-list {
		display: grid;
		gap: 0.75rem;
	}
</style>
