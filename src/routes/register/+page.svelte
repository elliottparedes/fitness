<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
</script>

<div class="auth-page">
	<div class="auth-card">
		<div class="auth-card-content form-stack">
			<h1 class="page-title" style="margin-bottom: 0.5rem">Create account</h1>
			{#if form?.message}
				<p class="error-text">{form.message}</p>
			{/if}
			<form method="POST" class="form-stack">
				<div class="form-field">
					<label class="form-field__label" for="name">Name</label>
					<input
						id="name"
						class="native-input"
						type="text"
						name="name"
						bind:value={name}
						required
						autocomplete="name"
					/>
				</div>
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
					<label class="form-field__label" for="password">Password (min 8 characters)</label>
					<input
						id="password"
						class="native-input"
						type="password"
						name="password"
						bind:value={password}
						required
						minlength="8"
						autocomplete="new-password"
					/>
				</div>
				<button type="submit" class="btn btn--primary btn--block">Register</button>
			</form>
			<p class="muted">
				Already have an account? <a href="/login">Sign in</a>
			</p>
		</div>
	</div>
</div>
