<script lang="ts">
	import Button, { Label } from '@smui/button';
	import { Icon } from '@smui/icon-button';
	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
	import Textfield from '@smui/textfield';
	import Select, { Option } from '@smui/select';
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

	function isCustomExercise(exercise: (typeof data.exercises)[0]) {
		return exercise.createdByUserId != null;
	}

	const tabs: { value: ExerciseCategory | null; label: string }[] = [
		{ value: null, label: 'All' },
		{ value: 'free_weight', label: CATEGORY_LABELS.free_weight },
		{ value: 'machine', label: CATEGORY_LABELS.machine },
		{ value: 'cardio', label: CATEGORY_LABELS.cardio }
	];

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

<h1 class="page-title">Exercises</h1>
<p class="muted">Built-in catalog plus your custom exercises.</p>

<div class="row-actions exercise-tabs">
	{#each tabs as t}
		<Button
			variant={data.category === t.value || (!data.category && !t.value) ? 'raised' : undefined}
			href={t.value ? `/exercises?category=${t.value}` : '/exercises'}
		>
			<Label>{t.label}</Label>
		</Button>
	{/each}
	<Button variant="raised" onclick={() => (dialogOpen = true)}>
		<Label>Add custom</Label>
	</Button>
</div>

<div class="table-scroll">
	<DataTable style="width: 100%; margin-top: 1rem; min-width: 700px">
		<Head>
			<Row>
				<Cell>Name</Cell>
				<Cell>Category</Cell>
				<Cell>Muscle Group</Cell>
				<Cell>Source</Cell>
				{#if hasCustomExercises}
					<Cell numeric>Actions</Cell>
				{/if}
			</Row>
		</Head>
		<Body>
			{#each data.exercises as exercise (exercise.id)}
				<Row>
					<Cell>{exercise.name}</Cell>
					<Cell>{CATEGORY_LABELS[exercise.category]}</Cell>
					<Cell>{exercise.muscleGroup ?? '—'}</Cell>
					<Cell>{isCustomExercise(exercise) ? 'Yours' : 'Catalog'}</Cell>
					{#if hasCustomExercises}
						<Cell numeric>
							{#if isCustomExercise(exercise)}
								<Button
									type="button"
									color="secondary"
									class="delete-btn"
									onclick={() => handleDelete(exercise)}
								>
									<Icon class="material-icons">delete</Icon>
									<Label>Delete</Label>
								</Button>
							{:else}
								<span class="muted">—</span>
							{/if}
						</Cell>
					{/if}
				</Row>
			{/each}
		</Body>
	</DataTable>
</div>

{#if !hasCustomExercises}
	<p class="muted" style="margin-top: 1rem">
		Only catalog exercises are listed. Use <strong>Add custom</strong> to create one you can edit or delete.
	</p>
{/if}

<AppDialog bind:open={dialogOpen} title="Add custom exercise" titleId="add-exercise-title">
	{#if form?.message}
		<p class="error-text">{form.message}</p>
	{/if}
	<form method="POST" action="?/create" class="form-stack">
		<HiddenField name="name" value={name} />
		<HiddenField name="category" value={category} />
		<HiddenField name="muscleGroup" value={muscleGroup} />
		<HiddenField name="description" value={description} />
		<Textfield bind:value={name} label="Name" required style="width: 100%" />
		<Select bind:value={category} label="Category" style="width: 100%">
			<Option value="free_weight">{CATEGORY_LABELS.free_weight}</Option>
			<Option value="machine">{CATEGORY_LABELS.machine}</Option>
			<Option value="cardio">{CATEGORY_LABELS.cardio}</Option>
		</Select>
		{#if category !== 'cardio'}
			<Textfield bind:value={muscleGroup} label="Muscle group" style="width: 100%" />
		{/if}
		<Textfield bind:value={description} label="Description" textarea input$rows={2} style="width: 100%" />
		<div class="dialog-actions">
			<Button type="button" onclick={() => (dialogOpen = false)}>
				<Label>Cancel</Label>
			</Button>
			<Button variant="raised" type="submit">
				<Label>Save</Label>
			</Button>
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
	.error-text {
		color: var(--app-error, #d32f2f);
		margin-bottom: 0.5rem;
	}
	.form-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: none;
	}
	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}
	:global(.delete-btn) {
		--mdc-icon-size: 18px;
	}
	:global(.delete-btn .material-icons) {
		font-size: 18px;
		margin-right: 0.25rem;
	}

	.table-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	@media (max-width: 700px) {
		.exercise-tabs {
			flex-wrap: nowrap;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			padding-bottom: 0.25rem;
		}

		.exercise-tabs :global(.mdc-button) {
			flex: 0 0 auto;
		}
	}
</style>
