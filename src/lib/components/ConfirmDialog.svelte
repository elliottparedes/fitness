<script lang="ts">
	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		onconfirm
	}: {
		open?: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		danger?: boolean;
		onconfirm?: () => void | Promise<void>;
	} = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let confirming = $state(false);
	const titleId = $derived(`confirm-${title.replace(/\s+/g, '-').toLowerCase()}`);

	$effect(() => {
		const el = dialogEl;
		if (!el) return;

		if (open) {
			if (!el.open) el.showModal();
		} else if (el.open) {
			el.close();
		}
	});

	function handleClose() {
		open = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialogEl && !confirming) {
			open = false;
		}
	}

	async function handleConfirm() {
		if (!onconfirm) {
			open = false;
			return;
		}
		confirming = true;
		try {
			await onconfirm();
		} finally {
			confirming = false;
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	class="app-modal app-modal--confirm"
	aria-labelledby={titleId}
	onclose={handleClose}
	onclick={handleBackdropClick}
>
	<div class="app-modal__panel">
		<h2 id={titleId} class="app-modal__title">{title}</h2>
		<div class="app-modal__content">
			<p class="confirm-message">{message}</p>
			<div class="dialog-actions">
				<button type="button" class="btn btn--text" disabled={confirming} onclick={() => (open = false)}>
					{cancelLabel}
				</button>
				<button
					type="button"
					class="btn btn--primary"
					class:btn--danger={danger}
					disabled={confirming}
					onclick={handleConfirm}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
</dialog>

<style>
	.confirm-message {
		margin: 0;
		color: var(--app-on-surface);
		line-height: 1.5;
	}

	.dialog-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1.25rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}
</style>
