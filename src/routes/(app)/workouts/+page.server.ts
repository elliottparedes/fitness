import type { PageServerLoad } from './$types';
import { workoutService } from '$lib/server/services/workout-service';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	return { workouts: await workoutService.listForUser(session.user.id) };
};
