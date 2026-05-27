<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Textfield from '@smui/textfield';
	import { CATEGORY_LABELS, type ExerciseCategory } from '$lib/domain/exercise';
	import { convertWeightToUnit } from '$lib/progress/metrics';
	import ExerciseCombobox from '$lib/components/ExerciseCombobox.svelte';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import { milesInputToMeters } from '$lib/format';
	import { toastFromActionResult } from '$lib/ui/toast.svelte';
	import type { WorkoutEntryView } from '$lib/domain/workout';

	let {
		data,
		formMessage = '',
		unsaved = $bindable(false),
		onadded
	}: {
		data: {
			exercises: { id: string; name: string; category: ExerciseCategory }[];
			entries: WorkoutEntryView[];
			preferredWeightUnit: 'kg' | 'lb';
		};
		formMessage?: string;
		unsaved?: boolean;
		onadded?: () => void;
	} = $props();

	let tab: ExerciseCategory = $state('free_weight');
	let selectedExerciseId = $state('');
	let exerciseQuery = $state('');
	let exerciseSuggestionsOpen = $state(false);
	let machineLabel = $state('');
	let reps = $state('10');
	let weight = $state('0');
	let duration = $state('30');
	let distanceMiles = $state('');
	let calories = $state('');
	let avgHeartRate = $state('');
	let addingEntry = $state(false);

	const weightLabel = $derived(
		data.preferredWeightUnit === 'lb' ? 'Weight (lbs)' : 'Weight (kg)'
	);

	const tabExercises = $derived(data.exercises.filter((exercise) => exercise.category === tab));
	const filteredExercises = $derived(
		tabExercises.filter((exercise) =>
			exerciseQuery.trim().length === 0
				? true
				: exercise.name.toLowerCase().includes(exerciseQuery.trim().toLowerCase())
		)
	);
	const visibleExerciseSuggestions = $derived(filteredExercises.slice(0, 8));
	const exactExerciseMatch = $derived(
		tabExercises.find(
			(exercise) => exercise.name.toLowerCase() === exerciseQuery.trim().toLowerCase()
		) ?? null
	);

	const hasUnsavedEdits = $derived.by(() => {
		const category = tab;
		if (exerciseQuery.trim() !== '' || selectedExerciseId !== '' || machineLabel.trim() !== '') {
			return true;
		}
		if (category === 'cardio') {
			return (
				duration !== '30' ||
				distanceMiles !== '' ||
				calories !== '' ||
				avgHeartRate !== ''
			);
		}
		return reps !== '10' || weight !== '0';
	});

	$effect(() => {
		unsaved = hasUnsavedEdits;
	});

	$effect(() => {
		tab;
		const selectedExercise = data.exercises.find((exercise) => exercise.id === selectedExerciseId);
		if (selectedExercise?.category !== tab) {
			selectedExerciseId = '';
		}
	});

	$effect(() => {
		selectedExerciseId = exactExerciseMatch?.id ?? '';
	});

	$effect(() => {
		if (!selectedExerciseId || tab === 'cardio') return;
		const matchingEntries = data.entries.filter((entry) => entry.exerciseId === selectedExerciseId);
		const lastEntry = matchingEntries.at(-1);
		const lastSet = lastEntry?.sets.at(-1);
		if (!lastSet) return;
		reps = `${lastSet.reps}`;
		weight = convertWeightToUnit(lastSet.weight, lastSet.weightUnit, data.preferredWeightUnit);
	});

	const enhanceAddEntry = ({ formData }: { formData: FormData }) => {
		formData.set('weightUnit', data.preferredWeightUnit);
		formData.set('exerciseId', selectedExerciseId);
		formData.set('machineLabel', machineLabel);
		formData.set('duration', duration);
		formData.set('calories', calories);
		formData.set('avgHeartRate', avgHeartRate);
		formData.set('reps', reps);
		formData.set('weight', weight);
		if (tab === 'cardio') {
			const meters = milesInputToMeters(distanceMiles);
			formData.set('distanceMeters', meters == null ? '' : String(meters));
		} else {
			formData.set('distanceMeters', '');
		}
		const bestMatch = exactExerciseMatch ?? filteredExercises[0];
		if (bestMatch && !selectedExerciseId) {
			formData.set('exerciseId', bestMatch.id);
		}
		addingEntry = true;
		return async ({ result }: { result: Parameters<typeof applyAction>[0] }) => {
			addingEntry = false;
			await applyAction(result);
			toastFromActionResult(result);
			if (result.type === 'success') {
				exerciseQuery = '';
				selectedExerciseId = '';
				await invalidateAll();
				onadded?.();
			}
		};
	};
</script>

<div class="add-exercise-panel">
	<div class="category-tabs" role="tablist" aria-label="Exercise category">
		{#each ['free_weight', 'machine', 'cardio'] as cat}
			<button
				type="button"
				class="category-tab"
				class:category-tab--active={tab === cat}
				role="tab"
				aria-selected={tab === cat}
				onclick={() => (tab = cat as ExerciseCategory)}
			>
				{CATEGORY_LABELS[cat as ExerciseCategory]}
			</button>
		{/each}
	</div>

	<form method="POST" action="?/addEntry" class="form-stack form-stack--wide" use:enhance={enhanceAddEntry}>
		<HiddenField name="exerciseId" value={selectedExerciseId} />
		<HiddenField name="machineLabel" value={machineLabel} />
		<HiddenField name="duration" value={duration} />
		<HiddenField name="calories" value={calories} />
		<HiddenField name="avgHeartRate" value={avgHeartRate} />
		<HiddenField name="reps" value={reps} />
		<HiddenField name="weight" value={weight} />
		<HiddenField name="weightUnit" value={data.preferredWeightUnit} />

		<ExerciseCombobox
			id="exercise-combobox-add"
			label="Exercise"
			bind:query={exerciseQuery}
			bind:open={exerciseSuggestionsOpen}
			options={visibleExerciseSuggestions}
		/>

		{#if tab === 'machine'}
			<Textfield bind:value={machineLabel} label="Machine label (optional)" style="width: 100%" />
		{/if}

		{#if tab === 'cardio'}
			<Textfield bind:value={duration} label="Duration (minutes or mm:ss)" required style="width: 100%" />
			<Textfield
				bind:value={distanceMiles}
				label="Distance (miles)"
				type="number"
				input$step="0.01"
				style="width: 100%"
			/>
			<Textfield bind:value={calories} label="Calories" type="number" style="width: 100%" />
			<Textfield bind:value={avgHeartRate} label="Avg heart rate" type="number" style="width: 100%" />
		{:else}
			<div class="first-set-fields">
				<Textfield bind:value={reps} label="Reps" type="number" style="width: 100%" />
				<Textfield bind:value={weight} label={weightLabel} type="number" style="width: 100%" />
			</div>
			<label class="warmup-check">
				<input type="checkbox" name="isWarmup" />
				Warmup set
			</label>
		{/if}

		{#if formMessage}
			<p class="error-text" style="margin: 0">{formMessage}</p>
		{/if}

		<button type="submit" class="btn btn--primary btn--block add-exercise-submit" disabled={addingEntry}>
			<span class="material-icons" aria-hidden="true">add_circle</span>
			<span>{addingEntry ? 'Adding…' : 'Add to workout'}</span>
		</button>
	</form>
</div>

<style>
	.add-exercise-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.category-tabs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.35rem;
		padding: 0.25rem;
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--app-surface, #fff) 90%, transparent);
		border: 1px solid var(--app-border);
	}

	.category-tab {
		border: 0;
		border-radius: 0.55rem;
		padding: 0.6rem 0.35rem;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		background: transparent;
		color: var(--app-muted);
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}

	.category-tab--active {
		background: var(--app-accent, #0d9488);
		color: #fff;
	}

	.first-set-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.warmup-check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.add-exercise-submit {
		min-height: 3rem;
		font-size: 0.95rem;
	}

	.add-exercise-submit .material-icons {
		font-size: 1.35rem;
	}
</style>
