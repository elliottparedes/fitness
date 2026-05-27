<script lang="ts">
	import Card, { Content } from '@smui/card';
	import WorkoutSummaryCard from '$lib/components/WorkoutSummaryCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<h1 class="page-title">Workouts</h1>

<div class="row-actions">
	<a href="/workouts/new" class="btn btn--primary">New workout</a>
</div>

<div class="workout-list">
	{#each data.workouts as workout (workout.id)}
		<WorkoutSummaryCard {workout} />
	{:else}
		<Card style="margin-top: 1rem">
			<Content style="padding: 1rem">No workouts logged yet.</Content>
		</Card>
	{/each}
</div>

<style>
	.workout-list {
		margin-top: 1rem;
		display: grid;
		gap: 0.75rem;
	}
</style>
