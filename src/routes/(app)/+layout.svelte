<script lang="ts">
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { untrack } from 'svelte';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let drawerOpen = $state(false);
	let menuButtonEl = $state<HTMLButtonElement | null>(null);
	const path = $derived($page.url.pathname);

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: 'home', active: (p: string) => p === '/' },
		{
			href: '/charts',
			label: 'Charts',
			icon: 'show_chart',
			active: (p: string) => p.startsWith('/charts')
		},
		{
			href: '/workouts',
			label: 'Workouts',
			icon: 'fitness_center',
			active: (p: string) => p.startsWith('/workouts')
		},
		{
			href: '/exercises',
			label: 'Exercises',
			icon: 'list',
			active: (p: string) => p.startsWith('/exercises')
		},
		{
			href: '/preferences',
			label: 'Preferences',
			icon: 'settings',
			active: (p: string) => p.startsWith('/preferences')
		}
	] as const;

	function closeDrawer() {
		if (!drawerOpen) return;

		const drawer = document.getElementById('app-drawer');
		const active = document.activeElement as HTMLElement | null;
		if (active && drawer?.contains(active)) {
			active.blur();
		}

		drawerOpen = false;
		menuButtonEl?.focus();
	}

	// Close on navigation only — untrack so opening the drawer doesn't re-trigger this effect.
	$effect(() => {
		path;
		untrack(() => closeDrawer());
	});

	$effect(() => {
		if (!drawerOpen) return;

		const onKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeDrawer();
		};

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		document.addEventListener('keydown', onKeydown);

		return () => {
			document.removeEventListener('keydown', onKeydown);
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

<div class="app-shell">
	<header class="app-topbar">
		<div class="app-topbar__start">
			<button
				type="button"
				class="icon-btn"
				bind:this={menuButtonEl}
				aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={drawerOpen}
				aria-controls="app-drawer"
				onclick={() => {
					if (drawerOpen) closeDrawer();
					else drawerOpen = true;
				}}
			>
				<span class="material-icons" aria-hidden="true">{drawerOpen ? 'close' : 'menu'}</span>
			</button>
			<div class="app-topbar__brand">
				<img class="app-topbar__icon" src="/favicon.svg" alt="" width="28" height="28" />
				<h1 class="app-topbar__title">Fitness Tracker</h1>
			</div>
		</div>
		<span class="app-topbar__user">{data.session.user?.name ?? data.session.user?.email}</span>
	</header>

	{#if drawerOpen}
		<button type="button" class="app-drawer__scrim" aria-label="Close menu" onclick={closeDrawer}></button>
	{/if}

	<aside
		id="app-drawer"
		class="app-drawer"
		class:app-drawer--open={drawerOpen}
		inert={!drawerOpen}
		aria-hidden={drawerOpen ? undefined : true}
	>
		<div class="app-drawer__header">
			<h2 class="app-drawer__title">Menu</h2>
			<button type="button" class="icon-btn" aria-label="Close menu" onclick={closeDrawer}>
				<span class="material-icons" aria-hidden="true">close</span>
			</button>
		</div>
		<div class="app-drawer__body">
			<nav aria-label="Main">
				<ul class="app-nav">
					{#each navItems as item}
						<li>
							<a
								href={item.href}
								class="app-nav__link"
								class:app-nav__link--active={item.active(path)}
								aria-current={item.active(path) ? 'page' : undefined}
								onclick={closeDrawer}
							>
								<span class="material-icons" aria-hidden="true">{item.icon}</span>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
			<div class="app-drawer__footer">
				<form method="POST" action="/logout">
					<button type="submit" class="btn btn--primary btn--block">Sign out</button>
				</form>
			</div>
		</div>
	</aside>

	<main class="app-content" inert={drawerOpen}>
		{@render children()}
	</main>
</div>

<ToastHost />
