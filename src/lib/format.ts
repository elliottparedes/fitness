/** Meters per mile (international). */
export const METERS_PER_MILE = 1609.344;

export function metersToMiles(meters: number): number {
	return meters / METERS_PER_MILE;
}

export function milesToMeters(miles: number): number {
	return miles * METERS_PER_MILE;
}

export function formatDistanceMiles(meters: number | null | undefined, fractionDigits = 2): string {
	if (meters == null || meters <= 0) return '';
	return `${metersToMiles(meters).toFixed(fractionDigits)} mi`;
}

/** Miles from form input → meters for storage, or null if empty/invalid. */
export function milesInputToMeters(value: string | number | null | undefined): number | null {
	if (value == null || value === '') return null;
	const trimmed = (typeof value === 'string' ? value : String(value)).trim();
	if (!trimmed) return null;
	const miles = Number(trimmed);
	if (!Number.isFinite(miles) || miles < 0) return null;
	return Math.round(milesToMeters(miles));
}

/** Meters → miles for form fields. */
export function metersToMilesInputValue(meters: number | null | undefined): string {
	if (meters == null || meters <= 0) return '';
	return metersToMiles(meters).toFixed(2);
}

export function formatDateTime(value: Date | string): string {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short'
	}).format(new Date(value));
}

export function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	if (h > 0) return `${h}h ${m}m`;
	if (m > 0) return `${m}m ${s}s`;
	return `${s}s`;
}

export function formatWeight(value: string | number, unit: 'kg' | 'lb'): string {
	const numeric = typeof value === 'number' ? value : Number(value);
	const display = Number.isFinite(numeric)
		? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(numeric)
		: `${value}`;
	return `${display} ${unit === 'lb' ? 'lbs' : 'kg'}`;
}

export function parseDurationInput(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const match = trimmed.match(/^(\d+):(\d{2})$/);
	if (match) {
		return Number(match[1]) * 60 + Number(match[2]);
	}
	const minutes = Number(trimmed);
	if (Number.isFinite(minutes) && minutes >= 0) return Math.round(minutes * 60);
	return null;
}
