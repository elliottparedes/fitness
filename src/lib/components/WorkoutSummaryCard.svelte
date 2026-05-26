<script lang="ts">
	import Card, { Content } from '@smui/card';
	import { formatDateTime } from '$lib/format';

	let {
		workout
	}: {
		workout: {
			id: string;
			title: string | null;
			performedAt: Date | string;
			entryCount: number;
		};
	} = $props();
</script>

<a class="workout-card-link" href="/workouts/{workout.id}">
	<Card>
		<Content style="padding: 1rem">
			<div class="workout-card-row">
				<div>
					<h2 class="card-heading" style="font-size: 1.05rem">
						{workout.title || 'Workout'}
					</h2>
					<p class="muted" style="margin: 0.35rem 0 0">
						{formatDateTime(workout.performedAt)}
					</p>
				</div>
				<p class="muted" style="margin: 0">
					{workout.entryCount} exercise{workout.entryCount === 1 ? '' : 's'}
				</p>
			</div>
		</Content>
	</Card>
</a>

<style>
	.workout-card-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.workout-card-link :global(.mdc-card) {
		transition: transform 0.12s ease, box-shadow 0.12s ease;
	}

	.workout-card-link:hover :global(.mdc-card),
	.workout-card-link:focus-visible :global(.mdc-card) {
		transform: translateY(-1px);
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
	}

	.workout-card-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	@media (max-width: 600px) {
		.workout-card-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
