import type { PageServerLoad } from './$types';
import { EXERCISE_CATEGORIES, type ExerciseCategory } from '$lib/domain/exercise';
import type { ExerciseProgressCard } from '$lib/domain/progress';
import { progressService } from '$lib/server/services/progress-service';
import { userService } from '$lib/server/services/user-service';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();
	const preferredWeightUnit = await userService.getPreferredWeightUnit(session.user.id);
	const cards = await progressService.getAllProgressCards(session.user.id, preferredWeightUnit);

	const byCategory = Object.fromEntries(
		EXERCISE_CATEGORIES.map((category) => [
			category,
			cards
				.filter((card) => card.category === category)
				.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
		])
	) as Record<ExerciseCategory, ExerciseProgressCard[]>;

	return {
		byCategory,
		totalCount: cards.length,
		lookbackDays: progressService.lookbackDays
	};
};
