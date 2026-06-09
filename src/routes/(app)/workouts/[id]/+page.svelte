<script lang="ts">
	import { applyAction, deserialize, enhance } from '$app/forms';
	import Textfield from '@smui/textfield';
	import { goto, invalidateAll } from '$app/navigation';
	import { formatDateTime } from '$lib/format';
	import { CATEGORY_LABELS } from '$lib/domain/exercise';
	import type { WorkoutEntryView } from '$lib/domain/workout';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import AppDialog from '$lib/components/AppDialog.svelte';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import AddExercisePanel from '$lib/components/AddExercisePanel.svelte';
	import WorkoutExercisePanel from '$lib/components/WorkoutExercisePanel.svelte';
	import { workoutEntrySummary } from '$lib/workout-entry-summary';
	import { toastFromActionResult } from '$lib/ui/toast.svelte';
	import type { ActionData, PageData } from './$types';

	type SheetView = 'add' | 'exercise' | 'details';

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	let sheetOpen = $state(false);
	let sheetView = $state<SheetView | null>(null);
	let activeEntryId = $state<string | null>(null);
	let deleteDialogOpen = $state(false);

	let editTitle = $state('');
	let editPerformedAt = $state('');
	let editNotes = $state('');
	let exerciseUnsaved = $state(false);
	let addExerciseUnsaved = $state(false);

	const savedPerformedAtIso = $derived(
		new Date(
			data.workout.performedAt.getTime() - data.workout.performedAt.getTimezoneOffset() * 60000
		)
			.toISOString()
			.slice(0, 16)
	);

	const detailsUnsaved = $derived(
		sheetView === 'details' &&
			(editTitle !== (data.workout.title ?? '') ||
				editNotes !== (data.workout.notes ?? '') ||
				editPerformedAt !== savedPerformedAtIso)
	);

	const activeEntry = $derived(
		activeEntryId ? (data.entries.find((entry) => entry.id === activeEntryId) ?? null) : null
	);

	const sheetTitle = $derived(
		sheetView === 'add'
			? 'Add exercise'
			: sheetView === 'details'
				? 'Workout details'
				: sheetView === 'exercise'
					? (activeEntry?.exerciseName ?? 'Exercise')
					: ''
	);

	const modalOpen = $derived(sheetOpen || deleteDialogOpen);

	$effect(() => {
		const w = data.workout;
		editTitle = w.title ?? '';
		editNotes = w.notes ?? '';
		editPerformedAt = new Date(w.performedAt.getTime() - w.performedAt.getTimezoneOffset() * 60000)
			.toISOString()
			.slice(0, 16);
	});

	$effect(() => {
		if (activeEntryId && !data.entries.some((entry) => entry.id === activeEntryId)) {
			activeEntryId = null;
			if (sheetView === 'exercise') closeSheet();
		}
	});

	$effect(() => {
		if (!sheetOpen) {
			sheetView = null;
			activeEntryId = null;
		}
	});

	function blurActiveElement() {
		(document.activeElement as HTMLElement | null)?.blur?.();
	}

	function openSheet(view: SheetView) {
		blurActiveElement();
		sheetView = view;
		sheetOpen = true;
	}

	function closeSheet() {
		sheetOpen = false;
		sheetView = null;
		activeEntryId = null;
	}

	function sheetHasUnsavedEdits(): boolean {
		if (sheetView === 'exercise') return exerciseUnsaved;
		if (sheetView === 'add') return addExerciseUnsaved;
		if (sheetView === 'details') return detailsUnsaved;
		return false;
	}

	function beforeSheetClose(): boolean {
		if (!sheetHasUnsavedEdits()) return true;
		return confirm('Discard unsaved changes?');
	}

	function tryCloseSheet() {
		if (!beforeSheetClose()) return;
		closeSheet();
	}

	function openEntry(entry: WorkoutEntryView) {
		activeEntryId = entry.id;
		openSheet('exercise');
	}

	function onExerciseAdded(entryId: string) {
		addExerciseUnsaved = false;
		activeEntryId = entryId;
		sheetView = 'exercise';
	}

	async function confirmDeleteWorkout() {
		const response = await fetch('?/deleteWorkout', { method: 'POST', body: new FormData() });
		const result = deserialize(await response.text());

		if (result.type === 'redirect') {
			deleteDialogOpen = false;
			await goto(result.location);
		}
	}

	const enhanceUpdateWorkout = () => {
		return async ({ result }: { result: Parameters<typeof applyAction>[0] }) => {
			await applyAction(result);
			toastFromActionResult(result);
			if (result.type === 'success') {
				await invalidateAll();
				closeSheet();
			}
		};
	};
</script>

<div class="workout-session" inert={modalOpen}>
	<header class="workout-hero">
		<a href="/workouts" class="back-link" aria-label="Back to workouts">
			<span class="material-icons" aria-hidden="true">arrow_back</span>
		</a>
		<div class="workout-hero__text">
			<h1 class="workout-hero__title">{data.workout.title || 'Workout'}</h1>
			<p class="workout-hero__date muted">{formatDateTime(data.workout.performedAt)}</p>
		</div>
		<button
			type="button"
			class="icon-btn"
			onclick={() => openSheet('details')}
			aria-label="Edit workout details"
		>
			<span class="material-icons" aria-hidden="true">edit</span>
		</button>
	</header>

	{#if data.workout.notes}
		<p class="workout-notes muted">{data.workout.notes}</p>
	{/if}

	<section class="workout-stats" aria-label="Workout summary">
		<div class="stat-chip">
			<span class="stat-chip__value">{data.entries.length}</span>
			<span class="stat-chip__label">exercises</span>
		</div>
		{#if data.highlight}
			<div class="stat-chip">
				<span class="stat-chip__value">{data.highlight.value}</span>
				<span class="stat-chip__label">{data.highlight.label}</span>
			</div>
		{/if}
	</section>

	<div class="section-header">
		<h2 class="section-title">Exercises</h2>
	</div>

	{#if data.entries.length === 0}
		<div class="empty-state">
			<span class="material-icons empty-state__icon" aria-hidden="true">fitness_center</span>
			<p>No exercises yet</p>
			<p class="muted">Add your first exercise to start logging.</p>
		</div>
	{:else}
		<ul class="exercise-list">
			{#each data.entries as entry (entry.id)}
				<li>
					<button type="button" class="exercise-item" onclick={() => openEntry(entry)}>
						<div class="exercise-item__main">
							<span class="exercise-item__name">{entry.exerciseName}</span>
							<span class="exercise-item__category muted">{CATEGORY_LABELS[entry.category]}</span>
							<span class="exercise-item__summary muted">{workoutEntrySummary(entry)}</span>
						</div>
						<span class="material-icons exercise-item__chevron" aria-hidden="true">chevron_right</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="workout-session__footer">
		<a href="/workouts" class="btn btn--secondary">All workouts</a>
		<button type="button" class="btn btn--secondary" onclick={() => (deleteDialogOpen = true)}>
			Delete
		</button>
	</div>
</div>

{#if !modalOpen}
	<button type="button" class="fab" onclick={() => openSheet('add')} aria-label="Add exercise">
		<span class="material-icons" aria-hidden="true">add</span>
	</button>
{/if}

<AppDialog bind:open={sheetOpen} title={sheetTitle} variant="sheet" onBeforeClose={beforeSheetClose}>
	{#if sheetView === 'details'}
		<form method="POST" action="?/updateWorkout" class="form-stack form-stack--wide" use:enhance={enhanceUpdateWorkout}>
			<HiddenField name="title" value={editTitle} />
			<HiddenField name="performedAt" value={editPerformedAt} />
			<HiddenField name="notes" value={editNotes} />
			<Textfield bind:value={editTitle} label="Title" style="width: 100%" />
			<Textfield
				bind:value={editPerformedAt}
				type="datetime-local"
				label="Date & time"
				required
				style="width: 100%"
			/>
			<label for="workout-notes-modal" class="muted">Notes</label>
			<Textfield
				id="workout-notes-modal"
				bind:value={editNotes}
				textarea
				input$rows={3}
				placeholder="Session notes"
				style="width: 100%"
			/>
			<button type="submit" class="btn btn--primary btn--block">Save</button>
		</form>
	{:else if sheetView === 'add'}
		<AddExercisePanel
			{data}
			formMessage={form?.message ?? ''}
			bind:unsaved={addExerciseUnsaved}
			onadded={onExerciseAdded}
		/>
	{:else if sheetView === 'exercise' && activeEntry}
		<WorkoutExercisePanel
			entry={activeEntry}
			preferredWeightUnit={data.preferredWeightUnit}
			previousLastSet={data.lastSetsByExerciseId[activeEntry.exerciseId] ?? null}
			previousLastHoldSet={data.lastHoldSetsByExerciseId[activeEntry.exerciseId] ?? null}
			bind:unsaved={exerciseUnsaved}
			onclose={tryCloseSheet}
			onremoved={closeSheet}
		/>
	{/if}
</AppDialog>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title="Delete workout"
	message="Are you sure you want to delete this workout? This cannot be undone."
	confirmLabel="Delete"
	danger
	onconfirm={confirmDeleteWorkout}
/>

