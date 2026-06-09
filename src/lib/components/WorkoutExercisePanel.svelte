<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import Textfield from '@smui/textfield';
	import {
		formatDistanceMiles,
		formatDuration,
		formatWeight,
		metersToMilesInputValue,
		milesInputToMeters
	} from '$lib/format';
	import { CATEGORY_LABELS } from '$lib/domain/exercise';
	import { convertWeightToUnit, weightToLbs } from '$lib/progress/metrics';
	import { toastFromActionResult } from '$lib/ui/toast.svelte';
	import type { LastRecordedHoldSet, LastRecordedSet, WorkoutEntryView } from '$lib/domain/workout';

	let {
		entry,
		preferredWeightUnit,
		previousLastSet = null,
		previousLastHoldSet = null,
		unsaved = $bindable(false),
		onclose,
		onremoved
	}: {
		entry: WorkoutEntryView;
		preferredWeightUnit: 'kg' | 'lb';
		previousLastSet?: LastRecordedSet | null;
		previousLastHoldSet?: LastRecordedHoldSet | null;
		unsaved?: boolean;
		onclose?: () => void;
		onremoved?: () => void;
	} = $props();

	const lastSet = $derived(entry.sets.at(-1));
	const lastHoldSet = $derived(entry.holdSets.at(-1));
	let reps = $state('10');
	let weight = $state('0');
	let holdDuration = $state('30');
	let holdWeight = $state('');
	let isWarmup = $state(false);
	let addingSet = $state(false);
	let userEditedForm = $state(false);
	let deletingSetId = $state('');
	let durationMinutes = $state('');
	let distanceMiles = $state('');
	let avgHeartRate = $state('');

	let addSetBaseline = $state({
		reps: '10',
		weight: '0',
		isWarmup: false,
		holdDuration: '30',
		holdWeight: ''
	});

	const weightLabel = $derived(preferredWeightUnit === 'lb' ? 'Weight (lbs)' : 'Weight (kg)');

	const repeatLastWeight = $derived(
		lastSet ? convertWeightToUnit(lastSet.weight, lastSet.weightUnit, preferredWeightUnit) : '0'
	);

	const bestSessionSet = $derived.by(() => {
		if (entry.sets.length === 0) return null;
		const workingSets = entry.sets.filter((set) => !set.isWarmup);
		const pool = workingSets.length > 0 ? workingSets : entry.sets;
		return pool.reduce((best, set) => {
			const setLbs = weightToLbs(set.weight, set.weightUnit);
			const bestLbs = weightToLbs(best.weight, best.weightUnit);
			if (setLbs > bestLbs || (setLbs === bestLbs && set.reps > best.reps)) return set;
			return best;
		});
	});

	const lastRecordedHint = $derived.by(() => {
		const target = previousLastSet ?? bestSessionSet;
		if (!target) return null;
		return {
			label: 'Best last workout',
			reps: target.reps,
			weight: target.weight,
			weightUnit: target.weightUnit
		};
	});

	const bestSessionHoldSet = $derived.by(() => {
		if (entry.holdSets.length === 0) return null;
		return entry.holdSets.reduce((best, set) =>
			set.durationSeconds > best.durationSeconds ? set : best
		);
	});

	const lastHoldRecordedHint = $derived.by(() => {
		const target = previousLastHoldSet ?? (bestSessionHoldSet ? { durationSeconds: bestSessionHoldSet.durationSeconds, reps: bestSessionHoldSet.reps, weight: bestSessionHoldSet.weight, weightUnit: bestSessionHoldSet.weightUnit } : null);
		if (!target) return null;
		return target;
	});

	const savedCardioDuration = $derived(
		entry.cardio ? String(Math.round(entry.cardio.durationSeconds / 60)) : ''
	);
	const savedCardioDistance = $derived(
		entry.cardio ? metersToMilesInputValue(entry.cardio.distanceMeters) : ''
	);
	const savedCardioHeartRate = $derived(entry.cardio?.avgHeartRate?.toString() ?? '');

	const hasUnsavedEdits = $derived(
		entry.category === 'cardio' && entry.cardio
			? durationMinutes !== savedCardioDuration ||
				distanceMiles !== savedCardioDistance ||
				avgHeartRate !== savedCardioHeartRate
			: entry.category === 'holds'
				? holdDuration !== addSetBaseline.holdDuration ||
					reps !== addSetBaseline.reps ||
					holdWeight !== addSetBaseline.holdWeight
				: reps !== addSetBaseline.reps ||
					weight !== addSetBaseline.weight ||
					isWarmup !== addSetBaseline.isWarmup
	);

	$effect(() => {
		unsaved = hasUnsavedEdits;
	});

	$effect(() => {
		entry;
		if (entry.cardio) {
			durationMinutes = savedCardioDuration;
			distanceMiles = savedCardioDistance;
			avgHeartRate = savedCardioHeartRate;
		}
		// Only pre-fill inputs if the user hasn't started editing since the last submission.
		if (!untrack(() => userEditedForm)) {
			if (entry.category === 'holds') {
				if (lastHoldSet) {
					holdDuration = `${lastHoldSet.durationSeconds}`;
					reps = `${lastHoldSet.reps}`;
					holdWeight = lastHoldSet.weight
						? convertWeightToUnit(lastHoldSet.weight, lastHoldSet.weightUnit ?? 'lb', preferredWeightUnit)
						: '';
				} else {
					holdDuration = '30';
					reps = '1';
					holdWeight = '';
				}
			} else if (lastSet) {
				reps = `${lastSet.reps}`;
				weight = convertWeightToUnit(lastSet.weight, lastSet.weightUnit, preferredWeightUnit);
			} else {
				reps = '10';
				weight = '0';
			}
			isWarmup = false;
		}
		addSetBaseline =
			entry.category === 'holds'
				? {
						reps: lastHoldSet ? `${lastHoldSet.reps}` : '1',
						weight: '0',
						isWarmup: false,
						holdDuration: lastHoldSet ? `${lastHoldSet.durationSeconds}` : '30',
						holdWeight: lastHoldSet?.weight
							? convertWeightToUnit(
									lastHoldSet.weight,
									lastHoldSet.weightUnit ?? 'lb',
									preferredWeightUnit
								)
							: ''
					}
				: {
						reps: lastSet ? `${lastSet.reps}` : '10',
						weight: lastSet
							? convertWeightToUnit(lastSet.weight, lastSet.weightUnit, preferredWeightUnit)
							: '0',
						isWarmup: false,
						holdDuration: '30',
						holdWeight: ''
					};
	});

	const afterSuccess = async () => {
		await invalidateAll();
	};

	const enhanceMutation = () => {
		return async ({ result }: { result: Parameters<typeof applyAction>[0] }) => {
			await applyAction(result);
			toastFromActionResult(result);
			if (result.type === 'success') {
				await afterSuccess();
			}
		};
	};

	const enhanceUpdateCardio = ({ formData }: { formData: FormData }) => {
		formData.set('duration', durationMinutes);
		const meters = milesInputToMeters(distanceMiles);
		formData.set('distanceMeters', meters == null ? '' : String(meters));
		formData.set('avgHeartRate', avgHeartRate);
		return enhanceMutation();
	};
</script>

<div class="exercise-panel">
	<p class="exercise-panel__meta muted">
		{CATEGORY_LABELS[entry.category]}
		{#if entry.machineLabel}
			· {entry.machineLabel}
		{/if}
	</p>

	{#if entry.category === 'cardio' && entry.cardio}
		<div class="cardio-summary">
			<p><strong>Duration</strong> {formatDuration(entry.cardio.durationSeconds)}</p>
			{#if entry.cardio.distanceMeters}
				<p><strong>Distance</strong> {formatDistanceMiles(entry.cardio.distanceMeters)}</p>
			{/if}
			{#if entry.cardio.avgHeartRate}
				<p><strong>Heart rate</strong> {entry.cardio.avgHeartRate} bpm</p>
			{/if}
		</div>
		<form method="POST" action="?/updateCardio" class="form-stack form-stack--wide" use:enhance={enhanceUpdateCardio}>
			<input type="hidden" name="entryId" value={entry.id} />
			<Textfield bind:value={durationMinutes} label="Duration (minutes)" required style="width: 100%" />
			<Textfield
				bind:value={distanceMiles}
				label="Distance (miles)"
				type="number"
				input$step="0.01"
				style="width: 100%"
			/>
			<Textfield bind:value={avgHeartRate} label="Avg heart rate" type="number" style="width: 100%" />
			<button type="submit" class="btn btn--primary btn--block">Save cardio</button>
		</form>
	{:else if entry.category === 'holds'}
		<!-- Hold sets table -->
		<div class="set-table set-table--holds" aria-label="Hold sets">
			<div class="set-table__head">
				<span>Set</span>
				<span>Duration</span>
				<span>Reps</span>
				<span>Weight</span>
				<span class="sr-only">Delete</span>
			</div>
			{#each entry.holdSets as set (set.id)}
				<div class="set-table__row set-table__row--holds">
					<span class="set-table__num">{set.setNumber}</span>
					<span>{formatDuration(set.durationSeconds)}</span>
					<span>{set.reps}</span>
					<span>{set.weight ? formatWeight(set.weight, set.weightUnit ?? 'lb') : '—'}</span>
					<form
						method="POST"
						action="?/deleteSet"
						class="set-table__delete"
						use:enhance={() => {
							deletingSetId = set.id;
							return async ({ result }) => {
								deletingSetId = '';
								await applyAction(result);
								toastFromActionResult(result);
								if (result.type === 'success') {
									await afterSuccess();
								}
							};
						}}
					>
						<input type="hidden" name="setId" value={set.id} />
						<input type="hidden" name="category" value="holds" />
						<button
							type="submit"
							class="icon-btn icon-btn--danger"
							aria-label="Delete set {set.setNumber}"
							disabled={deletingSetId === set.id}
							title="Delete set"
						>
							<span class="material-icons" aria-hidden="true">delete_outline</span>
						</button>
					</form>
				</div>
			{:else}
				<p class="muted exercise-panel__empty">No sets logged yet.</p>
			{/each}
		</div>

		<!-- Add hold set form -->
		<form
			method="POST"
			action="?/addSet"
			class="add-set-form"
			use:enhance={() => {
				addingSet = true;
				return async ({ result }) => {
					addingSet = false;
					await applyAction(result);
					if (result.type === 'success') {
						userEditedForm = false;
						await afterSuccess();
					}
				};
			}}
		>
			<input type="hidden" name="entryId" value={entry.id} />
			<input type="hidden" name="category" value="holds" />
			<input type="hidden" name="weightUnit" value={preferredWeightUnit} />
			{#if lastHoldRecordedHint}
				<p class="best-last-workout-hint">
					<span class="best-last-workout-hint__label">Best last workout</span>
					<span class="best-last-workout-hint__value">
						{formatDuration(lastHoldRecordedHint.durationSeconds)} × {lastHoldRecordedHint.reps}
						{#if lastHoldRecordedHint.weight}
							· {formatWeight(lastHoldRecordedHint.weight, lastHoldRecordedHint.weightUnit ?? 'lb')}
						{/if}
					</span>
				</p>
			{/if}
			<p class="add-set-form__label">Add set</p>
			<div class="add-set-form__fields add-set-form__fields--holds">
				<label class="field">
					<span class="field__label">Duration (sec or mm:ss)</span>
					<input
						class="native-input"
						name="holdDuration"
						type="text"
						inputmode="numeric"
						bind:value={holdDuration}
						oninput={() => (userEditedForm = true)}
						required
					/>
				</label>
				<label class="field">
					<span class="field__label">Reps</span>
					<input class="native-input" name="reps" type="number" min="1" bind:value={reps} oninput={() => (userEditedForm = true)} required />
				</label>
				<label class="field">
					<span class="field__label">{weightLabel} (opt.)</span>
					<input
						class="native-input"
						name="weight"
						type="number"
						min="0"
						step="0.5"
						bind:value={holdWeight}
						oninput={() => (userEditedForm = true)}
					/>
				</label>
			</div>
			<div class="add-set-form__actions">
				<button type="submit" class="btn btn--primary" disabled={addingSet}>
					{addingSet ? 'Adding…' : 'Add set'}
				</button>
			</div>
		</form>

		{#if lastHoldSet}
			<form
				method="POST"
				action="?/addSet"
				class="repeat-last"
				use:enhance={() => {
					addingSet = true;
					return async ({ result }) => {
						addingSet = false;
						await applyAction(result);
						if (result.type === 'success') {
							await afterSuccess();
						}
					};
				}}
			>
				<input type="hidden" name="entryId" value={entry.id} />
				<input type="hidden" name="category" value="holds" />
				<input type="hidden" name="holdDuration" value={lastHoldSet.durationSeconds} />
				<input type="hidden" name="reps" value={lastHoldSet.reps} />
				<input type="hidden" name="weight" value={lastHoldSet.weight ?? ''} />
				<input type="hidden" name="weightUnit" value={preferredWeightUnit} />
				<button type="submit" class="btn btn--secondary btn--block" disabled={addingSet}>
					Repeat last set ({formatDuration(lastHoldSet.durationSeconds)} × {lastHoldSet.reps}{lastHoldSet.weight ? ` · ${formatWeight(lastHoldSet.weight, lastHoldSet.weightUnit ?? 'lb')}` : ''})
				</button>
			</form>
		{/if}
	{:else}
		<div class="set-table" aria-label="Sets">
			<div class="set-table__head">
				<span>Set</span>
				<span>Reps</span>
				<span>Weight</span>
				<span class="sr-only">Delete</span>
			</div>
			{#each entry.sets as set (set.id)}
				<div class="set-table__row">
					<span class="set-table__num">
						{set.setNumber}
						{#if set.isWarmup}
							<span class="set-badge">W</span>
						{/if}
					</span>
					<span>{set.reps}</span>
					<span>{formatWeight(set.weight, set.weightUnit)}</span>
					<form
						method="POST"
						action="?/deleteSet"
						class="set-table__delete"
						use:enhance={() => {
							deletingSetId = set.id;
							return async ({ result }) => {
								deletingSetId = '';
								await applyAction(result);
								toastFromActionResult(result);
								if (result.type === 'success') {
									await afterSuccess();
								}
							};
						}}
					>
						<input type="hidden" name="setId" value={set.id} />
						<button
							type="submit"
							class="icon-btn icon-btn--danger"
							aria-label="Delete set {set.setNumber}"
							disabled={deletingSetId === set.id}
							title="Delete set"
						>
							<span class="material-icons" aria-hidden="true">delete_outline</span>
						</button>
					</form>
				</div>
			{:else}
				<p class="muted exercise-panel__empty">No sets logged yet.</p>
			{/each}
		</div>

		<form
			method="POST"
			action="?/addSet"
			class="add-set-form"
			use:enhance={() => {
				addingSet = true;
				return async ({ result }) => {
					addingSet = false;
					await applyAction(result);
					if (result.type === 'success') {
						userEditedForm = false;
						await afterSuccess();
					}
				};
			}}
		>
			<input type="hidden" name="entryId" value={entry.id} />
			<input type="hidden" name="weightUnit" value={preferredWeightUnit} />
			{#if lastRecordedHint}
				<p class="best-last-workout-hint">
					<span class="best-last-workout-hint__label">{lastRecordedHint.label}</span>
					<span class="best-last-workout-hint__value">
						{lastRecordedHint.reps} × {formatWeight(lastRecordedHint.weight, lastRecordedHint.weightUnit)}
					</span>
				</p>
			{/if}
			<p class="add-set-form__label">Add set</p>
			<div class="add-set-form__fields">
				<label class="field">
					<span class="field__label">Reps</span>
					<input class="native-input" name="reps" type="number" min="0" bind:value={reps} oninput={() => (userEditedForm = true)} required />
				</label>
				<label class="field">
					<span class="field__label">{weightLabel}</span>
					<input
						class="native-input"
						name="weight"
						type="number"
						min="0"
						step="0.5"
						bind:value={weight}
						oninput={() => (userEditedForm = true)}
						required
					/>
				</label>
			</div>
		<label class="warmup-check">
			<input type="checkbox" name="isWarmup" bind:checked={isWarmup} onchange={() => (userEditedForm = true)} />
			Warmup set
		</label>
			<div class="add-set-form__actions">
				<button type="submit" class="btn btn--primary" disabled={addingSet}>
					{addingSet ? 'Adding…' : 'Add set'}
				</button>
			</div>
		</form>

		{#if lastSet}
			<form
				method="POST"
				action="?/addSet"
				class="repeat-last"
				use:enhance={() => {
					addingSet = true;
					return async ({ result }) => {
						addingSet = false;
						await applyAction(result);
						if (result.type === 'success') {
							await afterSuccess();
						}
					};
				}}
			>
				<input type="hidden" name="entryId" value={entry.id} />
				<input type="hidden" name="reps" value={lastSet.reps} />
				<input type="hidden" name="weight" value={repeatLastWeight} />
				<input type="hidden" name="weightUnit" value={preferredWeightUnit} />
				<button type="submit" class="btn btn--secondary btn--block" disabled={addingSet}>
					Repeat last set ({lastSet.reps} × {formatWeight(lastSet.weight, lastSet.weightUnit)})
				</button>
			</form>
		{/if}
	{/if}

	<div class="exercise-panel__footer">
		<form
			method="POST"
			action="?/deleteEntry"
			use:enhance={() => {
				return async ({ result }) => {
					await applyAction(result);
					if (result.type === 'success') {
						await afterSuccess();
						onremoved?.();
					}
				};
			}}
		>
			<input type="hidden" name="entryId" value={entry.id} />
			<button type="submit" class="btn btn--text">Remove exercise</button>
		</form>
		{#if onclose}
			<button type="button" class="btn btn--primary" onclick={onclose}>
				{hasUnsavedEdits ? 'Done' : 'Close'}
			</button>
		{/if}
	</div>
</div>

<style>
	.exercise-panel {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.exercise-panel__meta {
		margin: 0;
	}

	.best-last-workout-hint {
		margin: 0;
		padding: 0.8rem 0.9rem;
		border-radius: 0.65rem;
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--app-pr, #facc15) 28%, var(--app-surface, #1e293b)),
			color-mix(in srgb, var(--app-pr, #facc15) 12%, var(--app-surface, #1e293b))
		);
		border: 1px solid color-mix(in srgb, var(--app-pr, #facc15) 55%, var(--app-border));
		box-shadow: 0 2px 12px color-mix(in srgb, var(--app-pr, #facc15) 22%, transparent);
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.best-last-workout-hint__label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--app-pr, #facc15);
	}

	.best-last-workout-hint__value {
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--app-pr, #facc15);
	}

	.exercise-panel__empty {
		margin: 0.5rem 0 0;
		text-align: center;
	}

	.cardio-summary p {
		margin: 0.35rem 0;
	}

	.set-table {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.set-table__head,
	.set-table__row {
		display: grid;
		grid-template-columns: 2.5rem 1fr 1.4fr 2.75rem;
		gap: 0.5rem;
		align-items: center;
	}

	.set-table--holds .set-table__head,
	.set-table--holds .set-table__row--holds {
		grid-template-columns: 2.5rem 1fr 1fr 1fr 2.75rem;
	}

	.set-table__head {
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--app-muted);
		padding: 0 0.25rem;
	}

	.set-table__row {
		padding: 0.65rem 0.5rem;
		border-radius: 0.65rem;
		background: var(--app-accent-subtle, color-mix(in srgb, var(--app-accent, #0d9488) 10%, var(--app-surface, #fff)));
	}

	.set-table__num {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-weight: 600;
	}

	.set-badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.1rem 0.3rem;
		border-radius: 0.25rem;
		background: var(--app-muted);
		color: var(--app-surface, #fff);
		opacity: 0.9;
	}

	.set-table__delete {
		margin: 0;
		display: flex;
		justify-content: flex-end;
	}

	.add-set-form {
		padding: 1rem;
		border-radius: 0.85rem;
		border: 1px dashed var(--app-border);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.add-set-form__label {
		margin: 0;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.add-set-form__fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.add-set-form__fields--holds {
		grid-template-columns: 1.4fr 1fr 1fr;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field__label {
		font-size: 0.75rem;
		color: var(--app-muted);
	}

	.field .native-input {
		width: 100%;
		min-height: 2.75rem;
		font-size: 1rem;
	}

	.warmup-check {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.add-set-form__actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.add-set-form__actions .btn--primary {
		flex: 1;
		min-width: 8rem;
	}

	.repeat-last {
		margin: 0;
	}

	.exercise-panel__footer {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		padding-top: 0.5rem;
		border-top: 1px solid var(--app-border);
	}

	.exercise-panel__footer .btn--primary {
		margin-left: auto;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

</style>
