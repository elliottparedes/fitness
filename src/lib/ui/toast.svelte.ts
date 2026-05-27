export type ToastVariant = 'success' | 'error' | 'info';

const DISMISS_MS = 4200;

let message = $state('');
let variant = $state<ToastVariant>('success');
let visible = $state(false);
let dismissTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleDismiss() {
	if (dismissTimer) clearTimeout(dismissTimer);
	dismissTimer = setTimeout(() => {
		visible = false;
	}, DISMISS_MS);
}

let lastToastKey = '';
let lastToastAt = 0;

export function toast(text: string, kind: ToastVariant = 'success') {
	const key = `${kind}:${text}`;
	const now = Date.now();
	if (key === lastToastKey && now - lastToastAt < 600) return;

	lastToastKey = key;
	lastToastAt = now;
	message = text;
	variant = kind;
	visible = true;
	scheduleDismiss();
}

/** Show toast from a SvelteKit `applyAction` result (success or failure). */
export function toastFromActionResult(result: {
	type: string;
	data?: Record<string, unknown>;
}) {
	if (result.type === 'success') {
		const text = result.data?.toast;
		if (typeof text === 'string' && text) toast(text, 'success');
	} else if (result.type === 'failure') {
		const text = result.data?.message;
		if (typeof text === 'string' && text) toast(text, 'error');
	}
}

export function dismissToast() {
	visible = false;
	if (dismissTimer) clearTimeout(dismissTimer);
}

export function getToastState() {
	return {
		get message() {
			return message;
		},
		get variant() {
			return variant;
		},
		get visible() {
			return visible;
		},
		dismiss: dismissToast
	};
}
