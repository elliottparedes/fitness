/** Public client-safe exports. Server code lives under `$lib/server/`. */
export {
	EXERCISE_CATEGORIES,
	CATEGORY_LABELS,
	isExerciseCategory,
	isStrengthCategory,
	type ExerciseCategory
} from '$lib/domain/exercise';

export { formatDateTime, formatDuration, parseDurationInput } from '$lib/format';
