import type { PageServerLoad } from './$types';
import { progressService } from '$lib/server/services/progress-service';
import { userService } from '$lib/server/services/user-service';
import { workoutService } from '$lib/server/services/workout-service';

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildStreakDays(workouts: Array<{ performedAt: Date }>): number {
	const days = new Set(workouts.map((workout) => startOfDay(workout.performedAt).getTime()));
	const cursor = startOfDay(new Date());
	let streak = 0;

	while (days.has(cursor.getTime())) {
		streak += 1;
		cursor.setDate(cursor.getDate() - 1);
	}

	return streak;
}

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	const recentWorkouts = await workoutService.listForUser(session.user.id, 50);
	const workouts = recentWorkouts.slice(0, 5);
	const now = new Date();
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - 6);
	const thisWeekWorkouts = recentWorkouts.filter((workout) => workout.performedAt >= weekStart).length;
	const preferredWeightUnit = await userService.getPreferredWeightUnit(session.user.id);
	const exerciseProgress = await progressService.getDashboardCards(session.user.id, preferredWeightUnit);

	return {
		workouts,
		exerciseProgress,
		stats: {
			thisWeekWorkouts,
			streakDays: buildStreakDays(recentWorkouts),
			prCount: exerciseProgress.filter((card) => card.isPr).length
		}
	};
};
