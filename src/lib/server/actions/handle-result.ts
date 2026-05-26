import { fail } from '@sveltejs/kit';
import type { ServiceResult } from '$lib/server/services/workout-service';

/** Maps service-layer validation errors to SvelteKit `fail` responses. */
export function failIfError<T>(result: ServiceResult<T>) {
	if (!result.ok) {
		return fail(400, { message: result.message });
	}
	return null;
}
