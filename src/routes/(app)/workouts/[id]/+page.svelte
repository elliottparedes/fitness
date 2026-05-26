<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import Button, { Label } from '@smui/button';
	import Textfield from '@smui/textfield';
	import Card, { Content } from '@smui/card';
	import Select, { Option } from '@smui/select';
	import { goto, invalidateAll } from '$app/navigation';
	import { formatDateTime, formatDuration, formatWeight } from '$lib/format';
	import { CATEGORY_LABELS, type ExerciseCategory } from '$lib/domain/exercise';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import ExerciseCombobox from '$lib/components/ExerciseCombobox.svelte';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	let tab: ExerciseCategory = $state('free_weight');
	let selectedExerciseId = $state('');
	let exerciseQuery = $state('');
	let exerciseSuggestionsOpen = $state(false);
	let machineLabel = $state('');
	let reps = $state('10');
	let weight = $state('0');
	let weightUnit = $state<'kg' | 'lb'>('lb');
	let duration = $state('30');
	let distanceMeters = $state('');
	let calories = $state('');
	let avgHeartRate = $state('');
	let deleteDialogOpen = $state(false);
	let addingEntry = $state(false);
	let addingSetEntryId = $state('');

	let editTitle = $state('');
	let editPerformedAt = $state('');
	let editNotes = $state('');

	$effect(() => {
		const w = data.workout;
		editTitle = w.title ?? '';
		editNotes = w.notes ?? '';
		editPerformedAt = new Date(w.performedAt.getTime() - w.performedAt.getTimezoneOffset() * 60000)
			.toISOString()
			.slice(0, 16);
	});

	$effect(() => {
		weightUnit = data.preferredWeightUnit;
	});

	const tabExercises = $derived(data.exercises.filter((exercise) => exercise.category === tab));
	const filteredExercises = $derived(
		tabExercises
			.filter((exercise) =>
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
		weight = `${Number(lastSet.weight)}`;
		weightUnit = lastSet.weightUnit;
	});

	async function confirmDeleteWorkout() {
		const response = await fetch('?/deleteWorkout', { method: 'POST', body: new FormData() });
		const result = deserialize(await response.text());

		if (result.type === 'redirect') {
			deleteDialogOpen = false;
			await goto(result.location);
		}
	}

	const enhanceAddEntry = ({ formData }: { formData: FormData }) => {
		formData.set('weightUnit', weightUnit);
		const bestMatch = exactExerciseMatch ?? filteredExercises[0];
		if (bestMatch && !selectedExerciseId) {
			formData.set('exerciseId', bestMatch.id);
		}
		addingEntry = true;
		return async ({ result }: { result: Parameters<typeof applyAction>[0] }) => {
			addingEntry = false;
			await applyAction(result);
			if (result.type === 'success') {
				await invalidateAll();
			}
		};
	};

	const enhanceAddSet = ({ formData }: { formData: FormData }) => {
		addingSetEntryId = formData.get('entryId')?.toString() ?? '';
		return async ({ result }: { result: Parameters<typeof applyAction>[0] }) => {
			addingSetEntryId = '';
			await applyAction(result);
			if (result.type === 'success') {
				await invalidateAll();
			}
		};
	};

</script>

<h1 class="page-title">{data.workout.title || 'Workout'}</h1>
<p class="muted">{formatDateTime(data.workout.performedAt)}</p>

<Card style="margin-bottom: 1.5rem">
	<Content style="padding: 1rem">
		<h2 class="section-title section-title--on-surface">Workout details</h2>
		<form method="POST" action="?/updateWorkout" class="form-stack">
			<HiddenField name="title" value={editTitle} />
			<HiddenField name="performedAt" value={editPerformedAt} />
			<HiddenField name="notes" value={editNotes} />
			<Textfield bind:value={editTitle} label="Title" style="width: 100%" />
			<Textfield bind:value={editPerformedAt} type="datetime-local" label="Date & time" required style="width: 100%" />
			<label for="workout-notes" class="muted" style="margin-top: 0.25rem">Notes</label>
			<Textfield
				id="workout-notes"
				bind:value={editNotes}
				textarea
				input$rows={2}
				placeholder="Add notes"
				style="width: 100%"
			/>
			<Button variant="raised" type="submit">
				<Label>Save details</Label>
			</Button>
		</form>
	</Content>
</Card>

<Card style="margin-top: 0; margin-bottom: 1.5rem">
	<Content style="padding: 1rem">
		<h2 class="section-title section-title--on-surface">Add exercise</h2>
		<div class="row-actions">
			{#each ['free_weight', 'machine', 'cardio'] as cat}
				<Button variant={tab === cat ? 'raised' : undefined} onclick={() => (tab = cat as ExerciseCategory)}>
					<Label>{CATEGORY_LABELS[cat as ExerciseCategory]}</Label>
				</Button>
			{/each}
		</div>

		<form
			method="POST"
			action="?/addEntry"
			class="form-stack"
			style="margin-top: 1rem"
			use:enhance={enhanceAddEntry}
		>
			<HiddenField name="exerciseId" value={selectedExerciseId} />
			<HiddenField name="machineLabel" value={machineLabel} />
			<HiddenField name="duration" value={duration} />
			<HiddenField name="distanceMeters" value={distanceMeters} />
			<HiddenField name="calories" value={calories} />
			<HiddenField name="avgHeartRate" value={avgHeartRate} />
			<HiddenField name="reps" value={reps} />
			<HiddenField name="weight" value={weight} />
			<HiddenField name="weightUnit" value={weightUnit} />

			<ExerciseCombobox
				id="exercise-combobox"
				label="Exercise"
				bind:query={exerciseQuery}
				bind:open={exerciseSuggestionsOpen}
				options={visibleExerciseSuggestions}
			/>
			{#if selectedExerciseId}
				<p class="muted" style="margin: 0">Selected: {exerciseQuery}</p>
			{/if}

			{#if tab === 'machine'}
				<Textfield bind:value={machineLabel} label="Machine label (optional)" style="width: 100%" />
			{/if}

			{#if tab === 'cardio'}
				<Textfield bind:value={duration} label="Duration (minutes or mm:ss)" required style="width: 100%" />
				<Textfield bind:value={distanceMeters} label="Distance (meters)" type="number" style="width: 100%" />
				<Textfield bind:value={calories} label="Calories" type="number" style="width: 100%" />
				<Textfield bind:value={avgHeartRate} label="Avg heart rate" type="number" style="width: 100%" />
			{:else}
				<div class="set-row">
					<span>Set 1</span>
					<Textfield bind:value={reps} label="Reps" type="number" style="width: 100%" />
					<Textfield bind:value={weight} label="Weight" type="number" style="width: 100%" />
					<Select bind:value={weightUnit} label="Unit">
						<Option value="lb">lbs</Option>
						<Option value="kg">kg</Option>
					</Select>
				</div>
				<label style="display: flex; align-items: center; gap: 0.5rem">
					<input type="checkbox" name="isWarmup" />
					Warmup set
				</label>
			{/if}

			{#if form?.message}
				<p class="error-text" style="margin: 0">{form.message}</p>
			{/if}

			<Button variant="raised" type="submit" disabled={addingEntry}>
				<Label>{addingEntry ? 'Adding...' : 'Add to workout'}</Label>
			</Button>
		</form>
	</Content>
</Card>

<h2 class="section-title" style="font-size: 1.25rem">Exercises</h2>

{#each data.entries as entry (entry.id)}
	<Card class="entry-card">
		<Content style="padding: 1rem">
			<div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem">
				<div>
					<h3 class="card-heading">{entry.exerciseName}</h3>
					<p class="muted" style="margin: 0.25rem 0 0">
						{CATEGORY_LABELS[entry.category]}
						{#if entry.machineLabel}
							· {entry.machineLabel}
						{/if}
					</p>
				</div>
				<form method="POST" action="?/deleteEntry">
					<input type="hidden" name="entryId" value={entry.id} />
					<Button type="submit" color="secondary">
						<Label>Remove</Label>
					</Button>
				</form>
			</div>

			{#if entry.category === 'cardio' && entry.cardio}
				<p style="margin: 1rem 0 0.5rem">
					Duration: {formatDuration(entry.cardio.durationSeconds)}
					{#if entry.cardio.distanceMeters}
						· {(entry.cardio.distanceMeters / 1000).toFixed(2)} km
					{/if}
					{#if entry.cardio.avgHeartRate}
						· {entry.cardio.avgHeartRate} bpm
					{/if}
				</p>
				<form method="POST" action="?/updateCardio" class="form-stack" style="margin-top: 0.5rem">
					<input type="hidden" name="entryId" value={entry.id} />
					<input
						type="hidden"
						name="duration"
						value={String(Math.round(entry.cardio.durationSeconds / 60))}
					/>
					<input type="hidden" name="distanceMeters" value={entry.cardio.distanceMeters ?? ''} />
					<input type="hidden" name="avgHeartRate" value={entry.cardio.avgHeartRate ?? ''} />
					<Textfield
						value={String(Math.round(entry.cardio.durationSeconds / 60))}
						label="Duration (minutes)"
						required
						style="width: 100%"
					/>
					<Textfield
						value={entry.cardio.distanceMeters?.toString() ?? ''}
						label="Distance (meters)"
						type="number"
						style="width: 100%"
					/>
					<Textfield
						value={entry.cardio.avgHeartRate?.toString() ?? ''}
						label="Avg heart rate"
						type="number"
						style="width: 100%"
					/>
					<Button type="submit">
						<Label>Update cardio</Label>
					</Button>
				</form>
			{:else}
				<div style="margin-top: 1rem">
					{#each entry.sets as set (set.id)}
						<div class="set-row">
							<span>Set {set.setNumber}</span>
							<span>{set.reps} reps</span>
							<span>{formatWeight(set.weight, set.weightUnit)}</span>
							<span>{set.isWarmup ? 'warmup' : ''}</span>
						</div>
					{/each}
				</div>
				<form
					method="POST"
					action="?/addSet"
					class="set-row"
					style="margin-top: 0.75rem"
					use:enhance={enhanceAddSet}
				>
					<input type="hidden" name="entryId" value={entry.id} />
					<span>New</span>
					<input
						name="reps"
						type="number"
						value={entry.sets.at(-1)?.reps ?? 10}
						placeholder="Reps"
						style="padding: 0.5rem"
					/>
					<input
						name="weight"
						type="number"
						value={entry.sets.at(-1)?.weight ?? 0}
						step="0.5"
						placeholder="Weight"
						style="padding: 0.5rem"
					/>
					<select name="weightUnit" style="padding: 0.5rem">
						<option value="lb" selected={(entry.sets.at(-1)?.weightUnit ?? data.preferredWeightUnit) === 'lb'}>
							lbs
						</option>
						<option value="kg" selected={(entry.sets.at(-1)?.weightUnit ?? data.preferredWeightUnit) === 'kg'}>
							kg
						</option>
					</select>
					<Button type="submit" disabled={addingSetEntryId === entry.id}>
						<Label>{addingSetEntryId === entry.id ? 'Adding...' : 'Add set'}</Label>
					</Button>
				</form>
				{#if entry.sets.length > 0}
					<form method="POST" action="?/addSet" class="row-actions" use:enhance={enhanceAddSet}>
						<input type="hidden" name="entryId" value={entry.id} />
						<input type="hidden" name="reps" value={entry.sets.at(-1)?.reps} />
						<input type="hidden" name="weight" value={entry.sets.at(-1)?.weight} />
						<input type="hidden" name="weightUnit" value={entry.sets.at(-1)?.weightUnit} />
						<Button type="submit" disabled={addingSetEntryId === entry.id}>
							<Label>Repeat last set</Label>
						</Button>
					</form>
				{/if}
			{/if}
		</Content>
	</Card>
{:else}
	<p class="muted">No exercises yet. Add one below.</p>
{/each}

<div class="row-actions" style="margin-top: 2rem">
	<Button href="/workouts">
		<Label>Back to list</Label>
	</Button>
	<Button color="secondary" onclick={() => (deleteDialogOpen = true)}>
		<Label>Delete workout</Label>
	</Button>
</div>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title="Delete workout"
	message="Are you sure you want to delete this workout? This cannot be undone."
	confirmLabel="Delete"
	danger
	onconfirm={confirmDeleteWorkout}
/>
