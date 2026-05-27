/** Convert stored weight to pounds for comparison. */
export function weightToLbs(weight: string | number, unit: 'kg' | 'lb'): number {
	const numeric = typeof weight === 'number' ? weight : Number(weight);
	if (!Number.isFinite(numeric)) return 0;
	return unit === 'kg' ? numeric * 2.20462 : numeric;
}

export function lbsToDisplayUnit(lbs: number, unit: 'kg' | 'lb'): number {
	return unit === 'kg' ? lbs / 2.20462 : lbs;
}

/** Format a weight value for display/entry in the user's preferred unit. */
export function convertWeightToUnit(
	weight: string | number,
	fromUnit: 'kg' | 'lb',
	toUnit: 'kg' | 'lb'
): string {
	const numeric = typeof weight === 'number' ? weight : Number(weight);
	if (!Number.isFinite(numeric)) return '0';
	if (fromUnit === toUnit) return `${numeric}`;
	const lbs = weightToLbs(numeric, fromUnit);
	const converted = lbsToDisplayUnit(lbs, toUnit);
	return `${Math.round(converted * 100) / 100}`;
}

export function trendBetween(current: number, previous: number): {
	trendPct: number | null;
	trendDirection: 'up' | 'down' | 'flat';
} {
	if (previous <= 0) {
		return { trendPct: null, trendDirection: current > 0 ? 'up' : 'flat' };
	}
	const trendPct = Math.round(((current - previous) / previous) * 100);
	if (Math.abs(trendPct) < 1) return { trendPct: 0, trendDirection: 'flat' };
	return {
		trendPct,
		trendDirection: trendPct > 0 ? 'up' : 'down'
	};
}
