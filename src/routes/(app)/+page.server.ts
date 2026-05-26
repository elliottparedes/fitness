import type { PageServerLoad } from './$types';
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
	const priorWeekStart = new Date(weekStart);
	priorWeekStart.setDate(weekStart.getDate() - 7);
	const priorWeekEnd = new Date(weekStart);
	priorWeekEnd.setMilliseconds(priorWeekEnd.getMilliseconds() - 1);
	const thisWeekVolume = await workoutService.strengthVolumeForUser(session.user.id, weekStart, now);
	const priorWeekVolume = await workoutService.strengthVolumeForUser(
		session.user.id,
		priorWeekStart,
		priorWeekEnd
	);

	return {
		workouts,
		stats: {
			thisWeekWorkouts,
			thisWeekVolume,
			volumeTrendPct:
				priorWeekVolume <= 0 ? null : Math.round(((thisWeekVolume - priorWeekVolume) / priorWeekVolume) * 100),
			streakDays: buildStreakDays(recentWorkouts)
		}
	};
};
