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
