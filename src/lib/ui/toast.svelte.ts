let message = $state('');
let pending = $state(false);

export function toast(text: string) {
	message = text;
	pending = true;
}

export function getToastState() {
	return {
		get message() {
			return message;
		},
		get pending() {
			return pending;
		},
		clearPending() {
			pending = false;
		}
	};
}
