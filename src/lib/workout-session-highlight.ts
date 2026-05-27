import { isStrengthCategory } from '$lib/domain/exercise';
import type { WorkoutEntryView } from '$lib/domain/workout';
import { formatDuration } from '$lib/format';
import { weightToLbs } from '$lib/progress/metrics';

export type WorkoutHighlightStat = {
	label: string;
	value: string;
};

function startOfWeekMonday(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const offset = day === 0 ? 6 : day - 1;
	d.setDate(d.getDate() - offset);
	d.setHours(0, 0, 0, 0);
	return d;
}

function formatOrdinal(n: number): string {
	const mod100 = n % 100;
	const suffix =
		mod100 >= 11 && mod100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
	return `${n}${suffix}`;
}

function countPrExercises(
	entries: WorkoutEntryView[],
	historicalMaxLbs: Map<string, number>
): number {
	const sessionMax = new Map<string, number>();

	for (const entry of entries) {
		if (!isStrengthCategory(entry.category)) continue;
		for (const set of entry.sets) {
			if (set.isWarmup) continue;
			const lbs = weightToLbs(set.weight, set.weightUnit);
			sessionMax.set(entry.exerciseId, Math.max(sessionMax.get(entry.exerciseId) ?? 0, lbs));
		}
	}

	let prCount = 0;
	for (const [exerciseId, bestLbs] of sessionMax) {
		const previousBest = historicalMaxLbs.get(exerciseId) ?? 0;
		if (bestLbs > previousBest + 0.01) prCount += 1;
	}

	return prCount;
}

function totalCardioSeconds(entries: WorkoutEntryView[]): number {
	return entries.reduce((total, entry) => total + (entry.cardio?.durationSeconds ?? 0), 0);
}

function hasWorkingStrengthSets(entries: WorkoutEntryView[]): boolean {
	return entries.some(
		(entry) =>
			isStrengthCategory(entry.category) && entry.sets.some((set) => !set.isWarmup)
	);
}

export function buildWorkoutHighlight(input: {
	entries: WorkoutEntryView[];
	historicalMaxLbs: Map<string, number>;
	weekWorkouts: Array<{ id: string }>;
	workoutId: string;
	daysSinceLastWorkout: number | null;
}): WorkoutHighlightStat | null {
	const prCount = countPrExercises(input.entries, input.historicalMaxLbs);
	if (prCount > 0) {
		return {
			label: prCount === 1 ? 'PR' : 'PRs',
			value: String(prCount)
		};
	}

	const weekIndex = input.weekWorkouts.findIndex((workout) => workout.id === input.workoutId);
	if (weekIndex >= 0) {
		return {
			label: 'this week',
			value: formatOrdinal(weekIndex + 1)
		};
	}

	if (input.daysSinceLastWorkout != null && input.daysSinceLastWorkout > 0) {
		return {
			label: 'since last',
			value: input.daysSinceLastWorkout === 1 ? '1 day' : `${input.daysSinceLastWorkout} days`
		};
	}

	const cardioSeconds = totalCardioSeconds(input.entries);
	if (cardioSeconds > 0 && !hasWorkingStrengthSets(input.entries)) {
		return {
			label: 'cardio time',
			value: formatDuration(cardioSeconds)
		};
	}

	return null;
}

export function getWeekRange(performedAt: Date): { start: Date; end: Date } {
	const start = startOfWeekMonday(performedAt);
	const end = new Date(start);
	end.setDate(end.getDate() + 7);
	return { start, end };
}

export function daysBetween(earlier: Date, later: Date): number {
	return Math.floor((later.getTime() - earlier.getTime()) / 86_400_000);
}
