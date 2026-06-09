import type { ExerciseProgressCard, ExerciseProgressPoint } from '$lib/domain/progress';
import { isStrengthCategory, type ExerciseCategory } from '$lib/domain/exercise';
import { metersToMiles } from '$lib/format';
import { lbsToDisplayUnit, trendBetween, weightToLbs } from '$lib/progress/metrics';
import { workoutRepository } from '$lib/server/repositories/workout-repository';

const LOOKBACK_DAYS = 120;
const MAX_CARDS = 6;
const CHART_POINTS = 10;

type StrengthRow = Awaited<
	ReturnType<typeof workoutRepository.getStrengthSetsForProgress>
>[number];

type CardioRow = Awaited<ReturnType<typeof workoutRepository.getCardioLogsForProgress>>[number];

function sessionKey(workoutId: string, exerciseId: string) {
	return `${exerciseId}:${workoutId}`;
}

function buildStrengthCards(rows: StrengthRow[], displayUnit: 'kg' | 'lb'): ExerciseProgressCard[] {
	const byExercise = new Map<
		string,
		{
			exerciseName: string;
			category: ExerciseCategory;
			sessions: Map<string, { performedAt: Date; bestLbs: number; bestReps: number }>;
		}
	>();

	for (const row of rows) {
		if (!isStrengthCategory(row.category) || row.isWarmup) continue;

		const lbs = weightToLbs(row.weight, row.weightUnit);
		let exercise = byExercise.get(row.exerciseId);
		if (!exercise) {
			exercise = {
				exerciseName: row.exerciseName,
				category: row.category,
				sessions: new Map()
			};
			byExercise.set(row.exerciseId, exercise);
		}

		const key = sessionKey(row.workoutId, row.exerciseId);
		const existing = exercise.sessions.get(key);
		if (!existing) {
			exercise.sessions.set(key, {
				performedAt: row.performedAt,
				bestLbs: lbs,
				bestReps: row.reps
			});
			continue;
		}

		if (lbs > existing.bestLbs || (lbs === existing.bestLbs && row.reps > existing.bestReps)) {
			existing.bestLbs = lbs;
			existing.bestReps = row.reps;
		}
	}

	return [...byExercise.entries()].map(([exerciseId, exercise]) =>
		toCard({
			exerciseId,
			exerciseName: exercise.exerciseName,
			category: exercise.category,
			metricLabel: 'Top weight',
			unit: displayUnit,
			sessions: [...exercise.sessions.values()].sort(
				(a, b) => a.performedAt.getTime() - b.performedAt.getTime()
			),
			toValue: (session) => lbsToDisplayUnit(session.bestLbs, displayUnit),
			toReps: (session) => session.bestReps
		})
	);
}

function buildCardioCards(rows: CardioRow[]): ExerciseProgressCard[] {
	const byExercise = new Map<
		string,
		{
			exerciseName: string;
			category: ExerciseCategory;
			sessions: Map<string, { performedAt: Date; durationSeconds: number; distanceMeters: number | null }>;
		}
	>();

	for (const row of rows) {
		let exercise = byExercise.get(row.exerciseId);
		if (!exercise) {
			exercise = {
				exerciseName: row.exerciseName,
				category: row.category,
				sessions: new Map()
			};
			byExercise.set(row.exerciseId, exercise);
		}

		const key = sessionKey(row.workoutId, row.exerciseId);
		const existing = exercise.sessions.get(key);
		if (!existing) {
			exercise.sessions.set(key, {
				performedAt: row.performedAt,
				durationSeconds: row.durationSeconds,
				distanceMeters: row.distanceMeters
			});
			continue;
		}

		if (row.durationSeconds > existing.durationSeconds) {
			existing.durationSeconds = row.durationSeconds;
		}
		if (row.distanceMeters != null) {
			existing.distanceMeters = Math.max(existing.distanceMeters ?? 0, row.distanceMeters);
		}
	}

	return [...byExercise.entries()].map(([exerciseId, exercise]) => {
		const useDistance = [...exercise.sessions.values()].some((s) => (s.distanceMeters ?? 0) > 0);
		return toCard({
			exerciseId,
			exerciseName: exercise.exerciseName,
			category: exercise.category,
			metricLabel: useDistance ? 'Best distance' : 'Duration',
			unit: useDistance ? 'mi' : 'min',
			sessions: [...exercise.sessions.values()].sort(
				(a, b) => a.performedAt.getTime() - b.performedAt.getTime()
			),
			toValue: (session) =>
				useDistance ? metersToMiles(session.distanceMeters ?? 0) : session.durationSeconds / 60
		});
	});
}

function toCard<T extends { performedAt: Date }>(input: {
	exerciseId: string;
	exerciseName: string;
	category: ExerciseCategory;
	metricLabel: string;
	unit: 'kg' | 'lb' | 'min' | 'mi';
	sessions: T[];
	toValue: (session: T) => number;
	toReps?: (session: T) => number;
	higherIsBetter?: boolean;
}): ExerciseProgressCard {
	const chartSessions = input.sessions.slice(-CHART_POINTS);
	const points: ExerciseProgressPoint[] = chartSessions.map((session) => ({
		date: session.performedAt.toISOString(),
		value: roundMetric(input.toValue(session)),
		reps: input.toReps?.(session)
	}));

	const values = input.sessions.map((session) => input.toValue(session));
	const prRaw = values.length ? Math.max(...values) : null;
	const pr = prRaw == null ? null : roundMetric(prRaw);
	const prSession = prRaw == null ? null : input.sessions.find((s) => input.toValue(s) === prRaw);
	const lastSession = input.sessions.at(-1);
	const previousSession = input.sessions.at(-2);
	const lastValue = lastSession ? roundMetric(input.toValue(lastSession)) : null;
	const previousValue = previousSession ? input.toValue(previousSession) : null;

	let trendPct: number | null = null;
	let trendDirection: 'up' | 'down' | 'flat' | null = null;

	if (lastValue != null && previousValue != null) {
		const trend = trendBetween(lastValue, previousValue);
		trendPct = trend.trendPct;
		trendDirection = trend.trendDirection;
	}

	const isPr =
		lastValue != null &&
		pr != null &&
		Math.abs(lastValue - pr) < 0.01 &&
		input.sessions.length >= 1;

	return {
		exerciseId: input.exerciseId,
		exerciseName: input.exerciseName,
		category: input.category,
		metricLabel: input.metricLabel,
		unit: input.unit,
		points,
		pr,
		prReps: prSession && input.toReps ? input.toReps(prSession) : undefined,
		lastValue,
		trendPct,
		trendDirection,
		isPr,
		sessionCount: input.sessions.length
	};
}

function roundMetric(value: number): number {
	return Math.round(value * 100) / 100;
}

async function buildProgressCards(
	userId: string,
	displayUnit: 'kg' | 'lb'
): Promise<ExerciseProgressCard[]> {
	const since = new Date();
	since.setDate(since.getDate() - LOOKBACK_DAYS);

	const [strengthRows, cardioRows] = await Promise.all([
		workoutRepository.getStrengthSetsForProgress(userId, since),
		workoutRepository.getCardioLogsForProgress(userId, since)
	]);

	return [...buildStrengthCards(strengthRows, displayUnit), ...buildCardioCards(cardioRows)]
		.filter((card) => card.sessionCount >= 1)
		.sort((a, b) => {
			if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
			return (b.lastValue ?? 0) - (a.lastValue ?? 0);
		});
}

export const progressService = {
	lookbackDays: LOOKBACK_DAYS,

	async getDashboardCards(userId: string, displayUnit: 'kg' | 'lb'): Promise<ExerciseProgressCard[]> {
		const cards = await buildProgressCards(userId, displayUnit);
		return cards.slice(0, MAX_CARDS);
	},

	async getAllProgressCards(userId: string, displayUnit: 'kg' | 'lb'): Promise<ExerciseProgressCard[]> {
		return buildProgressCards(userId, displayUnit);
	}
};
