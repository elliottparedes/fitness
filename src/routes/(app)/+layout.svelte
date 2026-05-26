<script lang="ts">
	import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
	import Drawer, {
		Content as DrawerContent,
		Header,
		Scrim,
		Title as DrawerTitle
	} from '@smui/drawer';
	import List, { Item, Graphic, Text } from '@smui/list';
	import IconButton, { Icon } from '@smui/icon-button';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	let drawerOpen = $state(false);
	const path = $derived($page.url.pathname);
</script>

<div class="app-shell">
	<TopAppBar variant="fixed">
		<Row>
			<Section>
				<IconButton onclick={() => (drawerOpen = !drawerOpen)}>
					<Icon class="material-icons">{drawerOpen ? 'close' : 'menu'}</Icon>
				</IconButton>
				<Title>Fitness Tracker</Title>
			</Section>
			<Section align="end" toolbar>
				<span class="user-label">
					{data.session.user?.name ?? data.session.user?.email}
				</span>
			</Section>
		</Row>
	</TopAppBar>

	<Drawer bind:open={drawerOpen} variant="modal">
		<Header>
			<div class="drawer-header-row">
				<DrawerTitle>Menu</DrawerTitle>
				<IconButton class="drawer-close" onclick={() => (drawerOpen = false)}>
					<Icon class="material-icons">close</Icon>
				</IconButton>
			</div>
		</Header>
		<DrawerContent>
			<List>
				<Item href="/" activated={path === '/'} onclick={() => (drawerOpen = false)}>
					<Graphic class="material-icons">home</Graphic>
					<Text>Dashboard</Text>
				</Item>
				<Item
					href="/workouts"
					activated={path.startsWith('/workouts')}
					onclick={() => (drawerOpen = false)}
				>
					<Graphic class="material-icons">fitness_center</Graphic>
					<Text>Workouts</Text>
				</Item>
				<Item
					href="/exercises"
					activated={path.startsWith('/exercises')}
					onclick={() => (drawerOpen = false)}
				>
					<Graphic class="material-icons">list</Graphic>
					<Text>Exercises</Text>
				</Item>
				<Item
					href="/preferences"
					activated={path.startsWith('/preferences')}
					onclick={() => (drawerOpen = false)}
				>
					<Graphic class="material-icons">settings</Graphic>
					<Text>Preferences</Text>
				</Item>
			</List>
			<form method="POST" action="/logout?/default" style="padding: 1rem">
				<button type="submit" class="mdc-button mdc-button--raised">Sign out</button>
			</form>
		</DrawerContent>
	</Drawer>
	<Scrim />

	<div class="app-content" style="margin-top: 4rem">
		{@render children()}
	</div>
</div>

<ToastHost />

<style>
	.drawer-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		width: 100%;
		min-height: 3rem;
	}

	.drawer-header-row :global(.mdc-drawer__title) {
		flex: 1;
		margin: 0;
		min-width: 0;
	}

	.drawer-header-row :global(.mdc-drawer__title::before) {
		content: none;
	}

	.drawer-header-row :global(.drawer-close) {
		flex-shrink: 0;
		margin: 0 -0.5rem 0 0;
	}

	@media (max-width: 700px) {
		:global(.user-label) {
			display: none;
		}
	}
</style>
