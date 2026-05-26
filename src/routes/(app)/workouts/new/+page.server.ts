import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { requireSession } from '$lib/server/auth/session';
import { workoutService } from '$lib/server/services/workout-service';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const session = await requireSession(locals);
		const result = await workoutService.createFromForm(session.user.id, await request.formData());
		if (!result.ok) return fail(400, { message: result.message });
		redirect(303, `/workouts/${result.data.id}`);
	}
};
