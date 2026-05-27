<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		titleId,
		variant = 'default',
		showClose = true,
		onBeforeClose,
		children
	}: {
		open?: boolean;
		title: string;
		titleId?: string;
		/** `sheet` — full-width panel, vertically centered */
		variant?: 'default' | 'sheet';
		showClose?: boolean;
		/** Return false to keep the dialog open (e.g. unsaved edits). */
		onBeforeClose?: () => boolean;
		children?: Snippet;
	} = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	const resolvedTitleId = $derived(titleId ?? `dialog-${title.replace(/\s+/g, '-').toLowerCase()}`);

	$effect(() => {
		const el = dialogEl;
		if (!el) return;

		if (open) {
			if (!el.open) el.showModal();
		} else if (el.open) {
			el.close();
		}
	});

	function requestClose() {
		if (onBeforeClose && !onBeforeClose()) return;
		open = false;
	}

	function handleClose() {
		open = false;
	}

	function handleCancel(event: Event) {
		if (onBeforeClose && !onBeforeClose()) {
			event.preventDefault();
			return;
		}
		open = false;
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === dialogEl) {
			requestClose();
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialogEl}
	class="app-modal"
	class:app-modal--sheet={variant === 'sheet'}
	aria-labelledby={resolvedTitleId}
	onclose={handleClose}
	oncancel={handleCancel}
	onclick={handleBackdropClick}
>
	<div class="app-modal__panel">
		<div class="app-modal__header">
			<h2 id={resolvedTitleId} class="app-modal__title">{title}</h2>
			{#if showClose}
				<button
					type="button"
					class="icon-btn app-modal__close"
					aria-label="Close"
					onclick={requestClose}
				>
					<span class="material-icons" aria-hidden="true">close</span>
				</button>
			{/if}
		</div>
		<div class="app-modal__content">
			{@render children?.()}
		</div>
	</div>
</dialog>
