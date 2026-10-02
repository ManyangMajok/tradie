# FIRST STEPS

You've unpacked the `my-tradie/` scaffold. Here's what to do before you open VS Code.

---

## Step 1: Place the folder

Put `my-tradie/` wherever you keep your projects. Common spots:

- macOS/Linux: `~/Projects/my-tradie/` or `~/Code/my-tradie/`
- Windows: `C:\Users\YOU\Projects\my-tradie\`

Avoid paths with spaces or non-ASCII characters — some CLI tools get confused.

---

## Step 2: Install prerequisites

Confirm you have these installed (see versions in `README.md` § Local development prerequisites):

```bash
php --version        # should be 8.3+
composer --version   # 2.x
node --version       # 20+
pnpm --version       # 9+ (install via: npm install -g pnpm)
psql --version       # 16+ (Postgres)
redis-cli --version  # 7+
git --version        # any recent version
```

If any are missing, install them before continuing. On macOS, Homebrew handles all of them.

---

## Step 3: Initialise git

```bash
cd my-tradie
git init -b main
git add .
git commit -m "chore: initial scaffold

- Documentation pack (docs/, CLAUDE.md, and ops docs at root)
- Empty monorepo structure (web/, apps/, packages/, deploy/)
- Root workspace configuration (pnpm-workspace.yaml, package.json)
- .gitignore, .editorconfig, README"
```

---

## Step 4: Create a private GitHub repo

### Option A — via GitHub CLI (recommended)

```bash
# One-time install: brew install gh  (macOS) or https://cli.github.com/
gh auth login
gh repo create my-tradie --private --source=. --remote=origin --push
```

Done — pushed to `github.com/<your-username>/my-tradie`.

### Option B — via GitHub website

1. Go to https://github.com/new
2. Repository name: `my-tradie`
3. Visibility: **Private**
4. Do NOT check "Add a README" or "Add .gitignore" (you already have them)
5. Click "Create repository"
6. Copy the `git remote add origin ...` command GitHub shows you, then:

```bash
git remote add origin git@github.com:<your-username>/my-tradie.git
git push -u origin main
```

### Verify

```bash
git remote -v
# should show: origin  git@github.com:<your-username>/my-tradie.git
```

---

## Step 5: Install JS workspace dependencies

```bash
pnpm install
```

This installs the root-level TypeScript dev dependency. Apps and packages aren't populated yet, so this is quick. pnpm will create `node_modules/` and `pnpm-lock.yaml`.

Commit the lockfile:

```bash
git add pnpm-lock.yaml
git commit -m "chore: add pnpm lockfile"
git push
```

---

## Step 6: Open in VS Code

```bash
code my-tradie
```

Install the Claude Code extension if you haven't already:
- VS Code marketplace → search "Claude Code" → install

---

## Step 7: Point Claude Code at the project

With VS Code open at the `my-tradie/` root, start a Claude Code session. The agent automatically reads `CLAUDE.md` at the repo root.

Good first prompts:

**To orient the agent:**
> Read CLAUDE.md. Then read docs/00-README.md and docs/10-build-phases.md. Summarise where we are in the build and what Phase 0 requires.

**To start Phase 0:**
> Begin Phase 0 — Foundation setup — per docs/10-build-phases.md. Initialise the Laravel 13 project in the web/ directory following docs/02-architecture.md. Do NOT run migrations yet; stop after `composer install` and verifying the framework runs.

**Reminders for the agent (it should know these from CLAUDE.md, but explicit reinforcement doesn't hurt):**
> - The Laravel app lives in web/ — cd in before running artisan/composer commands.
> - Mobile work is deferred to Phase 2. Do not touch apps/ or packages/ yet.
> - Do not change the documented stack (Laravel 13, Postgres 16, Redis 7, Reverb, Cashier, Resend, Sentry) without asking.

---

## Step 8: Before you run anything in production

Before you write a line of code, make sure `LEGAL.md` Red items are at least started:

- [ ] Business entity / ABN registered
- [ ] Accountant retained
- [ ] Lawyer engaged for T&Cs and privacy policy
- [ ] Stripe account in progress

These take weeks and block launch. Start them in parallel with the build, not at the end.

---

## You're ready

From here on, the build happens through `docs/10-build-phases.md`. Each phase has acceptance criteria. Don't skip them. Claude Code will follow if you point it at the doc and hold it to the gates.

Good luck.
