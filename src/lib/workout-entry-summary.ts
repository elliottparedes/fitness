import { formatDistanceMiles, formatDuration, formatWeight } from '$lib/format';
import type { WorkoutEntryView } from '$lib/domain/workout';

export function workoutEntrySummary(entry: WorkoutEntryView): string {
	if (entry.category === 'cardio' && entry.cardio) {
		const parts = [formatDuration(entry.cardio.durationSeconds)];
		if (entry.cardio.distanceMeters) {
			parts.push(formatDistanceMiles(entry.cardio.distanceMeters));
		}
		return parts.join(' · ');
	}

	if (entry.category === 'holds') {
		if (entry.holdSets.length === 0) return 'Tap to log sets';
		const count = entry.holdSets.length;
		const prefix = `${count} set${count === 1 ? '' : 's'} · `;
		const preview = entry.holdSets
			.slice(-3)
			.map((s) => `${formatDuration(s.durationSeconds)}×${s.reps}`)
			.join(', ');
		return prefix + preview;
	}

	if (entry.sets.length === 0) return 'Tap to log sets';

	const preview = entry.sets
		.slice(-3)
		.map((set) => `${set.reps}×${formatWeight(set.weight, set.weightUnit)}`)
		.join(', ');

	const prefix =
		entry.sets.length > 3 ? `${entry.sets.length} sets · ` : `${entry.sets.length} set${entry.sets.length === 1 ? '' : 's'} · `;

	return prefix + preview;
}
