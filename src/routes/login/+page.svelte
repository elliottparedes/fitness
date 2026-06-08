<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let email = $state('');
	let password = $state('');
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-card-content">
			<h1 class="page-title auth-title">Sign in</h1>
			{#if data.registered}
				<p class="muted">Account created. Sign in to continue.</p>
			{/if}
			{#if form?.message}
				<p class="error-text">{form.message}</p>
			{/if}
			<form method="POST" class="form-stack auth-form">
				<input type="hidden" name="providerId" value="credentials" />
				<input type="hidden" name="redirectTo" value="/" />
				<div class="form-field">
					<label class="form-field__label" for="email">Email</label>
					<input
						id="email"
						class="native-input"
						type="email"
						name="email"
						bind:value={email}
						required
						autocomplete="email"
					/>
				</div>
				<div class="form-field">
					<label class="form-field__label" for="password">Password</label>
					<input
						id="password"
						class="native-input"
						type="password"
						name="password"
						bind:value={password}
						required
						autocomplete="current-password"
					/>
				</div>
				<button type="submit" class="btn btn--primary btn--block auth-submit">Sign in</button>
			</form>
			<p class="muted">
				No account? <a href="/register">Register</a>
			</p>
		</div>
	</div>
</div>
