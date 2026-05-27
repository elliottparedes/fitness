<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getToastState, toast, type ToastVariant } from '$lib/ui/toast.svelte';

	const toastState = getToastState();

	const icons: Record<ToastVariant, string> = {
		success: 'check_circle',
		error: 'error',
		info: 'info'
	};

	$effect(() => {
		const form = $page.form as { toast?: string; message?: string } | null | undefined;
		if (form?.toast) {
			toast(form.toast, 'success');
		} else if (form?.message) {
			toast(form.message, 'error');
		}
	});

	$effect(() => {
		const param = $page.url.searchParams.get('toast');
		if (!param) return;
		toast(param, 'success');
		const path = $page.url.pathname + $page.url.hash;
		goto(path, { replaceState: true, keepFocus: true, noScroll: true });
	});
</script>

{#if toastState.visible}
	<div class="toast-stack" aria-live="polite" aria-atomic="true">
		<div class="toast toast--{toastState.variant}" role="status">
			<span class="material-icons toast__icon" aria-hidden="true">{icons[toastState.variant]}</span>
			<p class="toast__message">{toastState.message}</p>
			<button
				type="button"
				class="toast__close"
				aria-label="Dismiss notification"
				onclick={() => toastState.dismiss()}
			>
				<span class="material-icons" aria-hidden="true">close</span>
			</button>
		</div>
	</div>
{/if}

<style>
	.toast-stack {
		position: fixed;
		top: max(1rem, env(safe-area-inset-top));
		left: 50%;
		transform: translateX(-50%);
		z-index: var(--app-layer-toast, 32);
		width: min(24rem, calc(100vw - 2rem));
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.85rem 0.75rem 0.85rem 1rem;
		border-radius: 0.85rem;
		color: #fff;
		box-shadow:
			0 10px 28px rgba(0, 0, 0, 0.22),
			0 0 0 1px rgba(255, 255, 255, 0.12) inset;
		pointer-events: auto;
		animation: toast-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.toast--success {
		background: linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #2dd4bf 100%);
	}

	.toast--error {
		background: linear-gradient(135deg, #b91c1c 0%, #ef4444 55%, #fb923c 100%);
	}

	.toast--info {
		background: linear-gradient(135deg, #1d4ed8 0%, #6366f1 55%, #a855f7 100%);
	}

	.toast__icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
	}

	.toast__message {
		margin: 0;
		flex: 1;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.35;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.15);
	}

	.toast__close {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.18);
		color: inherit;
		cursor: pointer;
		flex-shrink: 0;
	}

	.toast__close:hover,
	.toast__close:focus-visible {
		background: rgba(255, 255, 255, 0.3);
		outline: none;
	}

	.toast__close .material-icons {
		font-size: 1.1rem;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(-0.75rem) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
