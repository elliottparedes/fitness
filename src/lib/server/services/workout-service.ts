import type { WorkoutEntryView } from '$lib/domain/workout';
import {
	buildWorkoutHighlight,
	daysBetween,
	getWeekRange,
	type WorkoutHighlightStat
} from '$lib/workout-session-highlight';
import { isHoldCategory, isStrengthCategory } from '$lib/domain/exercise';
import { exerciseRepository } from '$lib/server/repositories/exercise-repository';
import { workoutRepository } from '$lib/server/repositories/workout-repository';
import {
	parseCardioFromForm,
	parseHoldSetFromForm,
	parsePerformedAt,
	parseStrengthSetFromForm,
	formTrimmed
} from '$lib/server/validation/form';
import type { CreateWorkoutInput } from '$lib/domain/workout';

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; message: string };

function isDuplicateWorkoutEntryError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const maybe = error as { code?: string; message?: string };
	return maybe.code === 'ER_DUP_ENTRY' || /duplicate entry/i.test(maybe.message ?? '');
}

function enrichEntries(
	entries: Awaited<ReturnType<typeof workoutRepository.getDetailRaw>>['entries'],
	sets: Awaited<ReturnType<typeof workoutRepository.getDetailRaw>>['sets'],
	holdSetRows: Awaited<ReturnType<typeof workoutRepository.getDetailRaw>>['holdSets'],
	cardio: Awaited<ReturnType<typeof workoutRepository.getDetailRaw>>['cardio']
): WorkoutEntryView[] {
	const setsByEntry = new Map<string, typeof sets>();
	for (const set of sets) {
		const list = setsByEntry.get(set.workoutEntryId) ?? [];
		list.push(set);
		setsByEntry.set(set.workoutEntryId, list);
	}
	const holdSetsByEntry = new Map<string, typeof holdSetRows>();
	for (const set of holdSetRows) {
		const list = holdSetsByEntry.get(set.workoutEntryId) ?? [];
		list.push(set);
		holdSetsByEntry.set(set.workoutEntryId, list);
	}
	const cardioByEntry = new Map(cardio.map((c) => [c.workoutEntryId, c]));

	return entries.map((entry) => ({
		...entry,
		sets: (setsByEntry.get(entry.id) ?? []).sort((a, b) => a.setNumber - b.setNumber),
		holdSets: (holdSetsByEntry.get(entry.id) ?? [])
			.sort((a, b) => a.setNumber - b.setNumber)
			.map((s) => ({
				...s,
				weight: s.weight ?? null,
				weightUnit: (s.weightUnit as 'kg' | 'lb' | null) ?? null
			})),
		cardio: cardioByEntry.get(entry.id) ?? null
	}));
}

export const workoutService = {
	listForUser: workoutRepository.listForUser,
	strengthVolumeForUser: workoutRepository.strengthVolumeForUser,

	async getDetailView(workoutId: string, userId: string) {
		const workout = await workoutRepository.findForUser(workoutId, userId);
		if (!workout) return null;

		const { entries, sets, holdSets, cardio } = await workoutRepository.getDetailRaw(workoutId);
		return {
			workout,
			entries: enrichEntries(entries, sets, holdSets, cardio)
		};
	},

	async getSessionHighlight(
		workoutId: string,
		userId: string,
		entries: WorkoutEntryView[],
		performedAt: Date
	): Promise<WorkoutHighlightStat | null> {
		const { start, end } = getWeekRange(performedAt);
		const [historicalMaxLbs, weekWorkouts, previousPerformedAt] = await Promise.all([
			workoutRepository.getHistoricalMaxWeightLbsByExercise(userId, performedAt, workoutId),
			workoutRepository.listWorkoutsInRange(userId, start, end),
			workoutRepository.getPreviousWorkoutPerformedAt(userId, performedAt, workoutId)
		]);

		const daysSinceLastWorkout = previousPerformedAt
			? daysBetween(previousPerformedAt, performedAt)
			: null;

		return buildWorkoutHighlight({
			entries,
			historicalMaxLbs,
			weekWorkouts,
			workoutId,
			daysSinceLastWorkout
		});
	},

	async assertOwned(workoutId: string, userId: string): Promise<ServiceResult<{ workoutId: string }>> {
		const workout = await workoutRepository.findForUser(workoutId, userId);
		if (!workout) return { ok: false, message: 'Workout not found' };
		return { ok: true, data: { workoutId } };
	},

	async create(input: CreateWorkoutInput): Promise<ServiceResult<{ id: string }>> {
		const id = await workoutRepository.create(input);
		return { ok: true, data: { id } };
	},

	async createFromForm(
		userId: string,
		formData: FormData
	): Promise<ServiceResult<{ id: string }>> {
		const performedAt = parsePerformedAt(formTrimmed(formData, 'performedAt'));
		if ('error' in performedAt) return { ok: false, message: performedAt.error };

		const id = await workoutRepository.create({
			userId,
			title: formTrimmed(formData, 'title') || null,
			performedAt,
			notes: formTrimmed(formData, 'notes') || null
		});
		return { ok: true, data: { id } };
	},

	async updateFromForm(
		workoutId: string,
		userId: string,
		formData: FormData
	): Promise<ServiceResult<void>> {
		const owned = await this.assertOwned(workoutId, userId);
		if (!owned.ok) return owned;

		const performedAt = parsePerformedAt(formTrimmed(formData, 'performedAt'));
		if ('error' in performedAt) return { ok: false, message: performedAt.error };

		await workoutRepository.update(workoutId, userId, {
			title: formTrimmed(formData, 'title') || null,
			performedAt,
			notes: formTrimmed(formData, 'notes') || null
		});
		return { ok: true, data: undefined };
	},

	async delete(workoutId: string, userId: string) {
		await workoutRepository.delete(workoutId, userId);
	},

	async getLastSetsByExercise(userId: string, excludeWorkoutId: string, before: Date) {
		return workoutRepository.getLastStrengthSetsByExercise(userId, excludeWorkoutId, before);
	},

	async getLastHoldSetsByExercise(userId: string, excludeWorkoutId: string, before: Date) {
		return workoutRepository.getLastHoldSetsByExercise(userId, excludeWorkoutId, before);
	},

	async addEntryFromForm(
		workoutId: string,
		userId: string,
		formData: FormData
	): Promise<ServiceResult<{ entryId: string }>> {
		const owned = await this.assertOwned(workoutId, userId);
		if (!owned.ok) return owned;

		const exerciseId = formTrimmed(formData, 'exerciseId');
		if (!exerciseId) return { ok: false, message: 'Select an exercise.' };

		const exercise = await exerciseRepository.findById(exerciseId);
		if (!exercise) return { ok: false, message: 'Exercise not found.' };
		if (await workoutRepository.hasEntryForExercise(workoutId, exerciseId)) {
			return { ok: false, message: 'This exercise is already in the workout.' };
		}

		const sortOrder = await workoutRepository.nextEntrySortOrder(workoutId);
		const machineLabel =
			exercise.category === 'machine' ? formTrimmed(formData, 'machineLabel') || null : null;

		let entryId: string;
		try {
			entryId = await workoutRepository.createEntry({
				workoutId,
				exerciseId,
				sortOrder,
				machineLabel
			});
		} catch (error) {
			if (isDuplicateWorkoutEntryError(error)) {
				return { ok: false, message: 'This exercise is already in the workout.' };
			}
			throw error;
		}

		if (exercise.category === 'cardio') {
			const cardio = parseCardioFromForm(formData);
			if ('error' in cardio) return { ok: false, message: cardio.error };
			await workoutRepository.insertCardioLog(entryId, cardio);
		} else if (exercise.category === 'holds') {
			const hold = parseHoldSetFromForm(formData);
			if ('error' in hold) return { ok: false, message: hold.error };
			await workoutRepository.insertHoldSet(entryId, 1, hold);
		} else {
			const set = parseStrengthSetFromForm(formData);
			if ('error' in set) return { ok: false, message: set.error };
			await workoutRepository.insertStrengthSet(entryId, 1, set);
		}

		return { ok: true, data: { entryId } };
	},

	async addSetFromForm(
		workoutId: string,
		userId: string,
		formData: FormData
	): Promise<ServiceResult<void>> {
		const owned = await this.assertOwned(workoutId, userId);
		if (!owned.ok) return owned;

		const entryId = formTrimmed(formData, 'entryId');
		if (!entryId) return { ok: false, message: 'Invalid set data.' };

		const category = formTrimmed(formData, 'category');
		if (category === 'holds') {
			const hold = parseHoldSetFromForm(formData);
			if ('error' in hold) return { ok: false, message: hold.error };
			const setNumber = await workoutRepository.nextHoldSetNumber(entryId);
			await workoutRepository.insertHoldSet(entryId, setNumber, hold);
		} else {
			const set = parseStrengthSetFromForm(formData);
			if ('error' in set) return { ok: false, message: set.error };
			const setNumber = await workoutRepository.nextSetNumber(entryId);
			await workoutRepository.insertStrengthSet(entryId, setNumber, set);
		}
		return { ok: true, data: undefined };
	},

	async updateCardioFromForm(
		workoutId: string,
		userId: string,
		formData: FormData
	): Promise<ServiceResult<void>> {
		const owned = await this.assertOwned(workoutId, userId);
		if (!owned.ok) return owned;

		const entryId = formTrimmed(formData, 'entryId');
		const cardio = parseCardioFromForm(formData);
		if (!entryId || 'error' in cardio) return { ok: false, message: 'Duration required.' };

		await workoutRepository.updateCardioLog(entryId, cardio);
		return { ok: true, data: undefined };
	},

	async deleteEntry(
		workoutId: string,
		userId: string,
		entryId: string | undefined
	): Promise<ServiceResult<void>> {
		const owned = await this.assertOwned(workoutId, userId);
		if (!owned.ok) return owned;
		if (!entryId) return { ok: false, message: 'Entry not found.' };

		await workoutRepository.deleteEntry(entryId);
		return { ok: true, data: undefined };
	},

	async deleteSetFromForm(
		workoutId: string,
		userId: string,
		formData: FormData
	): Promise<ServiceResult<void>> {
		const owned = await this.assertOwned(workoutId, userId);
		if (!owned.ok) return owned;

		const setId = formTrimmed(formData, 'setId');
		if (!setId) return { ok: false, message: 'Set not found.' };

		const category = formTrimmed(formData, 'category');
		if (category === 'holds') {
			const set = await workoutRepository.findHoldSetForUser(setId, userId);
			if (!set) return { ok: false, message: 'Set not found.' };
			await workoutRepository.deleteHoldSet(setId);
		} else {
			const set = await workoutRepository.findStrengthSetForUser(setId, userId);
			if (!set) return { ok: false, message: 'Set not found.' };
			await workoutRepository.deleteStrengthSet(setId);
		}
		return { ok: true, data: undefined };
	}
};

/** Type guard used when extending entry logging (e.g. new exercise categories). */
export function requiresStrengthLog(category: string): boolean {
	return isStrengthCategory(category as import('$lib/domain/exercise').ExerciseCategory);
}

export function requiresHoldLog(category: string): boolean {
	return isHoldCategory(category as import('$lib/domain/exercise').ExerciseCategory);
}
