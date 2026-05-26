<script lang="ts">
	import Button, { Label } from '@smui/button';
	import Textfield from '@smui/textfield';
	import Card, { Content } from '@smui/card';
	import HiddenField from '$lib/components/HiddenField.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let password = $state('');
</script>

<div class="auth-page">
	<Card class="auth-card">
		<Content class="form-stack" style="padding: 1.5rem">
			<h1 class="page-title" style="margin-bottom: 0.5rem">Sign in</h1>
			{#if data.registered}
				<p class="muted">Account created. Sign in to continue.</p>
			{/if}
			<form method="POST" class="form-stack">
				<input type="hidden" name="providerId" value="credentials" />
				<input type="hidden" name="redirectTo" value="/" />
				<HiddenField name="email" value={email} />
				<HiddenField name="password" value={password} />
				<Textfield bind:value={email} label="Email" type="email" required style="width: 100%" />
				<Textfield bind:value={password} label="Password" type="password" required style="width: 100%" />
				<Button variant="raised" type="submit" style="width: 100%">
					<Label>Sign in</Label>
				</Button>
			</form>
			<p class="muted">
				No account? <a href="/register">Register</a>
			</p>
		</Content>
	</Card>
</div>
