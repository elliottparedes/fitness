import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireSession } from '$lib/server/auth/session';
import { failIfError } from '$lib/server/actions/handle-result';
import { workoutService } from '$lib/server/services/workout-service';
import { exerciseService } from '$lib/server/services/exercise-service';
import { userService } from '$lib/server/services/user-service';
import { formTrimmed } from '$lib/server/validation/form';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { session } = await parent();
	const detail = await workoutService.getDetailView(params.id, session.user.id);
	if (!detail) error(404, 'Workout not found');

	const exercises = await exerciseService.listForUser(session.user.id);
	const preferredWeightUnit = await userService.getPreferredWeightUnit(session.user.id);
	const [highlight, lastSetsByExercise, lastHoldSetsByExercise] = await Promise.all([
		workoutService.getSessionHighlight(
			params.id,
			session.user.id,
			detail.entries,
			detail.workout.performedAt
		),
		workoutService.getLastSetsByExercise(session.user.id, params.id, detail.workout.performedAt),
		workoutService.getLastHoldSetsByExercise(session.user.id, params.id, detail.workout.performedAt)
	]);

	return {
		workout: detail.workout,
		entries: detail.entries,
		exercises,
		preferredWeightUnit,
		highlight,
		lastSetsByExerciseId: Object.fromEntries(lastSetsByExercise),
		lastHoldSetsByExerciseId: Object.fromEntries(lastHoldSetsByExercise)
	};
};

export const actions: Actions = {
	addEntry: async ({ request, params, locals }) => {
		const session = await requireSession(locals);
		const result = await workoutService.addEntryFromForm(
			params.id,
			session.user.id,
			await request.formData()
		);
		const err = failIfError(result);
		if (err) return err;
		return {
			success: true,
			toast: 'Exercise added to workout',
			entryId: result.ok ? result.data.entryId : ''
		};
	},

	addSet: async ({ request, params, locals }) => {
		const session = await requireSession(locals);
		const err = failIfError(await workoutService.addSetFromForm(params.id, session.user.id, await request.formData()));
		if (err) return err;
		return { success: true, toast: 'Set added' };
	},

	deleteSet: async ({ request, params, locals }) => {
		const session = await requireSession(locals);
		const err = failIfError(
			await workoutService.deleteSetFromForm(params.id, session.user.id, await request.formData())
		);
		if (err) return err;
		return { success: true, toast: 'Set removed' };
	},

	updateCardio: async ({ request, params, locals }) => {
		const session = await requireSession(locals);
		const err = failIfError(
			await workoutService.updateCardioFromForm(params.id, session.user.id, await request.formData())
		);
		if (err) return err;
		return { success: true, toast: 'Cardio updated' };
	},

	deleteEntry: async ({ request, params, locals }) => {
		const session = await requireSession(locals);
		const err = failIfError(
			await workoutService.deleteEntry(
				params.id,
				session.user.id,
				formTrimmed(await request.formData(), 'entryId')
			)
		);
		if (err) return err;
		return { success: true, toast: 'Exercise removed' };
	},

	deleteWorkout: async ({ params, locals }) => {
		const session = await requireSession(locals);
		await workoutService.delete(params.id, session.user.id);
		redirect(303, `/workouts?toast=${encodeURIComponent('Workout deleted')}`);
	},

	updateWorkout: async ({ request, params, locals }) => {
		const session = await requireSession(locals);
		const err = failIfError(
			await workoutService.updateFromForm(params.id, session.user.id, await request.formData())
		);
		if (err) return err;
		return { success: true, toast: 'Workout details saved' };
	}
};
