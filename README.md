# Fitness Tracker

SvelteKit app for logging gym workouts — machines, cardio, and free weights. Uses [SMUI](https://sveltematerialui.com/) (Material Design for Svelte) and MySQL.

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

   Fill in `DATABASE_URL` and `AUTH_SECRET` (or use shared MySQL creds from `~/.cursor/mysql-credentials.env` and bootstrap the `fitness` database).

2. Create the database (if not already):

   ```bash
   bash ~/.cursor/skills/mysql/scripts/bootstrap-database.sh fitness
   ```

3. Install dependencies and compile SMUI themes:

   ```bash
   npm install
   npm run prepare
   ```

4. Push schema and seed the exercise catalog:

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

Register an account, then log workouts from the dashboard.

## Docker / production

The image is built without `.env` (see `.dockerignore`). At **runtime**, the container must receive at least:

- `DATABASE_URL` (or `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`)
- `AUTH_SECRET` (same value across deploys; generate with `openssl rand -base64 32`)

Apply schema to the production database (`npm run db:push` or `db:migrate` against that DB). Accounts are per-database — register on production if the DB is empty or different from local.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for layer boundaries, conventions, and how to extend the app without coupling routes to the database.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run db:push` | Apply Drizzle schema to MySQL |
| `npm run db:seed` | Seed system exercise catalog |
| `npm run db:studio` | Open Drizzle Studio |
