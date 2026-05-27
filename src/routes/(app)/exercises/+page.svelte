<script lang="ts">
	import Textfield from '@smui/textfield';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { toast } from '$lib/ui/toast.svelte';
	import { CATEGORY_LABELS, type ExerciseCategory } from '$lib/domain/exercise';
	import AppDialog from '$lib/components/AppDialog.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let dialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let exerciseToDelete = $state<{ id: string; name: string } | null>(null);
	let name = $state('');
	let category = $state<ExerciseCategory>('free_weight');
	let muscleGroup = $state('');
	let description = $state('');

	const hasCustomExercises = $derived(data.myExercises.length > 0);

	const tabs: { value: ExerciseCategory | null; label: string; shortLabel: string }[] = [
		{ value: null, label: 'All', shortLabel: 'All' },
		{ value: 'free_weight', label: CATEGORY_LABELS.free_weight, shortLabel: 'Weights' },
		{ value: 'machine', label: CATEGORY_LABELS.machine, shortLabel: 'Machine' },
		{ value: 'cardio', label: CATEGORY_LABELS.cardio, shortLabel: 'Cardio' }
	];

	function isCustomExercise(exercise: (typeof data.exercises)[0]) {
		return exercise.createdByUserId != null;
	}

	function handleDelete(exercise: (typeof data.exercises)[0]) {
		exerciseToDelete = { id: exercise.id, name: exercise.name };
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!exerciseToDelete?.id) return;

		const formData = new FormData();
		formData.append('id', exerciseToDelete.id);

		const response = await fetch('?/delete', { method: 'POST', body: formData });
		const result = deserialize(await response.text());

		if (result.type === 'success') {
			deleteDialogOpen = false;
			exerciseToDelete = null;
			const data = result.data as { toast?: string } | undefined;
			if (data?.toast) toast(data.toast);
			await invalidateAll();
		}
	}

	$effect(() => {
		if (form?.success) {
			dialogOpen = false;
			name = '';
			muscleGroup = '';
			description = '';
		}
	});
</script>

<div class="exercises-page">
	<header class="exercises-page__header">
		<h1 class="page-title">Exercises</h1>
		<p class="muted exercises-page__lead">Built-in catalog plus your custom exercises.</p>
	</header>

	<nav class="category-filter" aria-label="Filter by category">
		{#each tabs as t}
			{@const active = data.category === t.value || (!data.category && !t.value)}
			<a
				href={t.value ? `/exercises?category=${t.value}` : '/exercises'}
				class="category-filter__tab"
				class:category-filter__tab--active={active}
				aria-current={active ? 'page' : undefined}
			>
				<span class="category-filter__short">{t.shortLabel}</span>
				<span class="category-filter__full">{t.label}</span>
			</a>
		{/each}
	</nav>

	<div class="exercises-page__toolbar">
		<p class="muted exercises-page__count">
			{data.exercises.length} exercise{data.exercises.length === 1 ? '' : 's'}
		</p>
		<button type="button" class="btn btn--primary exercises-page__add" onclick={() => (dialogOpen = true)}>
			<span class="material-icons" aria-hidden="true">add</span>
			Add custom
		</button>
	</div>

	{#if data.exercises.length === 0}
		<div class="empty-state">
			<span class="material-icons empty-state__icon" aria-hidden="true">fitness_center</span>
			<p>No exercises in this category</p>
			<p class="muted">Try another filter or add your own exercise.</p>
		</div>
	{:else}
		<ul class="exercise-catalog-list">
			{#each data.exercises as exercise (exercise.id)}
				<li>
					<article class="exercise-catalog-card">
						<div class="exercise-catalog-card__main">
							<h2 class="exercise-catalog-card__name">{exercise.name}</h2>
							<p class="exercise-catalog-card__meta muted">
								<span>{CATEGORY_LABELS[exercise.category]}</span>
								{#if exercise.muscleGroup}
									<span class="exercise-catalog-card__dot" aria-hidden="true">·</span>
									<span>{exercise.muscleGroup}</span>
								{/if}
							</p>
							<span
								class="exercise-catalog-card__badge"
								class:exercise-catalog-card__badge--yours={isCustomExercise(exercise)}
							>
								{isCustomExercise(exercise) ? 'Yours' : 'Catalog'}
							</span>
						</div>
						{#if isCustomExercise(exercise)}
							<button
								type="button"
								class="icon-btn icon-btn--danger"
								aria-label="Delete {exercise.name}"
								onclick={() => handleDelete(exercise)}
							>
								<span class="material-icons" aria-hidden="true">delete_outline</span>
							</button>
						{/if}
					</article>
				</li>
			{/each}
		</ul>
	{/if}

	{#if !hasCustomExercises}
		<p class="muted exercises-page__hint">
			Only catalog exercises are listed. Tap <strong>Add custom</strong> to create one you can delete later.
		</p>
	{/if}
</div>

<AppDialog bind:open={dialogOpen} title="Add custom exercise" titleId="add-exercise-title">
	{#if form?.message}
		<p class="error-text">{form.message}</p>
	{/if}
	<form method="POST" action="?/create" class="form-stack form-stack--wide">
		<HiddenField name="name" value={name} />
		<HiddenField name="muscleGroup" value={muscleGroup} />
		<HiddenField name="description" value={description} />
		<Textfield bind:value={name} label="Name" required style="width: 100%" />
		<label class="form-field">
			<span class="form-field__label">Category</span>
			<select class="native-input" name="category" bind:value={category}>
				<option value="free_weight">{CATEGORY_LABELS.free_weight}</option>
				<option value="machine">{CATEGORY_LABELS.machine}</option>
				<option value="cardio">{CATEGORY_LABELS.cardio}</option>
			</select>
		</label>
		{#if category !== 'cardio'}
			<Textfield bind:value={muscleGroup} label="Muscle group" style="width: 100%" />
		{/if}
		<Textfield bind:value={description} label="Description" textarea input$rows={2} style="width: 100%" />
		<div class="dialog-actions">
			<button type="button" class="btn btn--text" onclick={() => (dialogOpen = false)}>Cancel</button>
			<button type="submit" class="btn btn--primary">Save</button>
		</div>
	</form>
</AppDialog>

<ConfirmDialog
	bind:open={deleteDialogOpen}
	title="Delete exercise"
	message={exerciseToDelete
		? `Are you sure you want to delete "${exerciseToDelete.name}"? This cannot be undone.`
		: ''}
	confirmLabel="Delete"
	danger
	onconfirm={confirmDelete}
/>

<style>
	.exercises-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding-bottom: 1rem;
	}

	.exercises-page__header .page-title {
		margin-bottom: 0.35rem;
	}

	.exercises-page__lead {
		margin: 0;
	}

	.exercises-page__toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.exercises-page__count {
		margin: 0;
		font-size: 0.875rem;
	}

	.exercises-page__add {
		margin-left: auto;
	}

	.exercises-page__add .material-icons {
		font-size: 1.25rem;
	}

	.exercises-page__hint {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.25rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	@media (max-width: 480px) {
		.exercises-page__toolbar {
			flex-direction: column;
			align-items: stretch;
		}

		.exercises-page__add {
			margin-left: 0;
			width: 100%;
		}
	}
</style>
