# Design references

This folder contains the Stitch-exported React Native code for every mobile screen. These files are **visual references only** — they are not part of the build output, not imported by either app, and must not be edited except to replace with a new Stitch export.

## Purpose

Every screen in `docs/11-mobile-apps-spec.md` has a behavioural spec (data, interactions, acceptance criteria) and a visual design (this folder). The agent building each screen is expected to use **both**:

- Spec is authoritative for **behaviour**.
- Stitch file is authoritative for **visuals**.
- If they disagree, stop and ask (see `docs/11-mobile-apps-spec.md §13.4`).

## How the agent uses these files

See `docs/11-mobile-apps-spec.md §13` for the full procedure. Summary:

1. Read the spec section for the screen.
2. Open the Stitch file here for visual structure — layout, spacing, colour usage, typography, icon choices.
3. Build the screen from scratch in the app using:
   - `packages/ui/` primitives (not raw `View`/`TouchableOpacity`)
   - Design tokens from `packages/ui/src/theme/tokens.ts` (not hardcoded hex)
   - Whitelisted libraries only (not whatever Stitch imported)
4. Match the visual outcome, not the code.

**Do not paste Stitch code into app source.** Re-implement.

## Folder structure

```
docs/design/
├── README.md                           (this file)
├── tradie/
│   ├── 09.1-splash.tsx
│   ├── 09.2-login.tsx
│   ├── 09.3-onboarding.tsx
│   ├── 09.4-leads-inbox.tsx
│   ├── 09.5-lead-detail.tsx
│   ├── 09.6-jobs-inbox.tsx
│   ├── 09.7-job-detail.tsx
│   ├── 09.8-completion-form.tsx
│   ├── 09.9-performance.tsx
│   ├── 09.10-service-areas.tsx
│   ├── 09.11-categories.tsx
│   ├── 09.12-availability.tsx
│   ├── 09.13-subscription.tsx
│   └── 09.14-profile-settings.tsx
├── member/
│   ├── 11.1-splash.tsx
│   ├── 11.2-login.tsx
│   ├── 11.3-onboarding.tsx
│   ├── 11.4-home.tsx
│   ├── 11.5-submit-request.tsx
│   ├── 11.6-properties-list.tsx
│   ├── 11.7-property-detail.tsx
│   ├── 11.8-jobs-list.tsx
│   ├── 11.9-job-detail.tsx
│   ├── 11.10-review-form.tsx
│   ├── 11.11-saved-tradies.tsx
│   ├── 11.12-membership.tsx
│   ├── 11.13-profile-settings.tsx
│   └── 11.14-support.tsx
└── global/
    ├── offline-banner.tsx
    ├── session-expired.tsx
    └── maintenance-mode.tsx
```

File numbering matches the section numbering in `docs/11-mobile-apps-spec.md`. So §9.4 "Leads inbox" in the spec maps to `docs/design/tradie/09.4-leads-inbox.tsx` here.

See `docs/design-mapping.md` for the full lookup table.

## When you re-export from Stitch

1. Export the updated screen from Stitch.
2. Replace the existing file here (don't create a new one with a different name).
3. In the commit message: `docs(design): update <screen-id> from Stitch`.
4. If the update introduces a behavioural change (e.g., a new field on the form), update `docs/11-mobile-apps-spec.md` in the same commit.
5. If the update introduces a new visual token (colour, spacing value) that didn't exist before, update `packages/ui/src/theme/tokens.ts` once the mobile repo exists.

## When a screen isn't designed yet

If a file for a screen is missing:
- The agent builds to spec using visual tokens (`11-mobile-apps-spec.md §12`).
- PR notes state "Built to spec only — no Stitch reference."
- You drop the design in later; a polish PR can bring the screen into alignment.

## What these files are NOT

- Not production code. Do not import them.
- Not a design system library. The design system lives in `packages/ui/`.
- Not documentation of behaviour. That's the spec.
- Not editable by the agent. If the design needs to change, that happens in Stitch.
