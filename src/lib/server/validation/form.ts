import { parseDurationInput } from '$lib/format';

export function formString(data: FormData, key: string): string | undefined {
	return data.get(key)?.toString();
}

export function formTrimmed(data: FormData, key: string): string | undefined {
	return formString(data, key)?.trim();
}

export function formOptionalInt(value: FormDataEntryValue | null | undefined): number | null {
	if (value == null || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? Math.round(n) : null;
}

export function formOptionalDecimal(value: FormDataEntryValue | null | undefined): string | null {
	if (value == null || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n.toFixed(2) : null;
}

export type CardioInput = {
	durationSeconds: number;
	distanceMeters: number | null;
	calories: number | null;
	avgHeartRate: number | null;
	speedKph: string | null;
	inclinePercent: string | null;
	resistanceLevel: number | null;
};

export function parseCardioFromForm(data: FormData): CardioInput | { error: string } {
	const durationSeconds = parseDurationInput(formString(data, 'duration') ?? '');
	if (!durationSeconds || durationSeconds <= 0) {
		return { error: 'Duration is required for cardio (minutes or mm:ss).' };
	}
	return {
		durationSeconds,
		distanceMeters: formOptionalInt(data.get('distanceMeters')),
		calories: formOptionalInt(data.get('calories')),
		avgHeartRate: formOptionalInt(data.get('avgHeartRate')),
		speedKph: formOptionalDecimal(data.get('speedKph')),
		inclinePercent: formOptionalDecimal(data.get('inclinePercent')),
		resistanceLevel: formOptionalInt(data.get('resistanceLevel'))
	};
}

export type StrengthSetInput = {
	reps: number;
	weight: string;
	weightUnit: 'kg' | 'lb';
	isWarmup: boolean;
};

export function parseStrengthSetFromForm(data: FormData): StrengthSetInput | { error: string } {
	const reps = Number(formString(data, 'reps'));
	const weight = Number(formString(data, 'weight'));
	const rawWeightUnit = formString(data, 'weightUnit');
	const weightUnit = rawWeightUnit === 'kg' ? 'kg' : rawWeightUnit === 'lb' || rawWeightUnit === 'lbs' ? 'lb' : 'lb';

	if (!Number.isFinite(reps) || reps <= 0 || !Number.isFinite(weight) || weight < 0) {
		return { error: 'Add at least one set with reps and weight.' };
	}

	return {
		reps: Math.round(reps),
		weight: weight.toFixed(2),
		weightUnit,
		isWarmup: data.get('isWarmup') === 'on'
	};
}

export type HoldSetInput = {
	durationSeconds: number;
	reps: number;
	weight: string | null;
	weightUnit: 'kg' | 'lb' | null;
};

export function parseHoldSetFromForm(data: FormData): HoldSetInput | { error: string } {
	const durationSeconds = parseDurationInput(formString(data, 'holdDuration') ?? '', 'seconds');
	if (!durationSeconds || durationSeconds <= 0) {
		return { error: 'Duration is required for holds (seconds or mm:ss).' };
	}
	const reps = Number(formString(data, 'reps'));
	if (!Number.isFinite(reps) || reps <= 0) {
		return { error: 'Reps must be at least 1.' };
	}
	const rawWeight = formString(data, 'weight');
	const rawWeightUnit = formString(data, 'weightUnit');
	const hasWeight = rawWeight != null && rawWeight !== '' && Number(rawWeight) > 0;
	return {
		durationSeconds,
		reps: Math.round(reps),
		weight: hasWeight ? Number(rawWeight).toFixed(2) : null,
		weightUnit: hasWeight ? (rawWeightUnit === 'kg' ? 'kg' : 'lb') : null
	};
}

export function parsePerformedAt(raw: string | undefined): Date | { error: string } {
	if (!raw) return { error: 'Date and time are required.' };
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) return { error: 'Invalid date.' };
	return date;
}
