> **Member-choice demo update:** The web job wizard now ends with a location-based, rating-ranked tradie choice. Pending member-selected jobs show a choose-again form after decline/expiry. See docs/DEMO.md and the root README for the approved demo flow.

# 06 — Frontend Specification

**Status:** Canonical. Maps 1:1 to the wireframes (reference: `/docs-source/wireframes.html` when present).

---

## 0. Stack recap

- React 19 + TypeScript 6
- Inertia.js v3 with `@inertiajs/react`
- Tailwind CSS 4
- Vite for bundling
- Forms: Inertia's `useForm`; validation piggy-backs on Laravel's Form Requests (server-side validation is canonical)
- Icons: `lucide-react`
- Date formatting: `date-fns`
- Realtime: `laravel-echo` + `pusher-js` (pointed at Reverb)
- Charts (tradie performance, admin metrics): `recharts`

No Redux. No Zustand. Page-level state via `useState`/`useReducer`. Shared state (auth user, flash messages) via Inertia shared props + a thin `useAuth()` hook.

---

## 1. Route map

Every route in `routes/web.php` maps to exactly one Inertia page component in `resources/js/Pages/`.

### Public
| URL | Page |
|---|---|
| `/` | `Public/Home` |
| `/pricing` | `Public/Pricing` |
| `/for-tradies` | `Public/ForTradies` |
| `/about` | `Public/About` (PHASE 2) |
| `/privacy`, `/terms` | `Public/Legal/*` |

### Auth
| URL | Page |
|---|---|
| `/login` | `Auth/Login` |
| `/register/member` | `Auth/Register/MemberAccount` |
| `/register/member/property` | `Auth/Register/MemberProperty` |
| `/register/member/plan` | `Auth/Register/MemberPlan` |
| `/register/tradie/step-1` .. `step-4` | `Auth/Register/Tradie/Step1` .. `Step4` |
| `/register/tradie/pending` | `Auth/Register/Tradie/Pending` |
| `/password/forgot` | `Auth/ForgotPassword` |
| `/password/reset/{token}` | `Auth/ResetPassword` |
| `/verify-phone` | `Auth/VerifyPhone` (PHASE 2) |

### Member
| URL | Page |
|---|---|
| `/dashboard` | `Member/Dashboard` |
| `/properties` | `Member/Properties/Index` |
| `/properties/{id}/edit` | `Member/Properties/Edit` |
| `/jobs` | `Member/Jobs/Index` |
| `/jobs/new` | `Member/Jobs/Wizard` |
| `/jobs/{publicId}` | `Member/Jobs/Show` |
| `/membership` | `Member/Membership` |
| `/saved-tradies` | `Member/SavedTradies` |
| `/support` | `Member/Support` (basic contact form PHASE 2) |

### Tradie
| URL | Page |
|---|---|
| `/tradie` | `Tradie/Leads/Index` (default) |
| `/tradie/leads/{offer}` | `Tradie/Leads/Show` |
| `/tradie/jobs` | `Tradie/Jobs/Index` |
| `/tradie/jobs/{publicId}` | `Tradie/Jobs/Show` |
| `/tradie/jobs/{publicId}/complete` | `Tradie/Jobs/Complete` |
| `/tradie/performance` | `Tradie/Performance` |
| `/tradie/service-areas` | `Tradie/ServiceAreas` |
| `/tradie/categories` | `Tradie/Categories` |
| `/tradie/availability` | `Tradie/Availability` |
| `/tradie/subscription` | `Tradie/Subscription` |
| `/tradie/settings` | `Tradie/Settings` |
| `/tradie/activate-subscription` | `Tradie/ActivateSubscription` (post-approval) |

### Admin
| URL | Page |
|---|---|
| `/admin` | `Admin/Overview` |
| `/admin/jobs` | `Admin/Jobs/Index` |
| `/admin/jobs/{publicId}` | `Admin/Jobs/Show` |
| `/admin/tradies` | `Admin/Tradies/Index` |
| `/admin/tradies/{id}` | `Admin/Tradies/Show` |
| `/admin/applications` | `Admin/Applications` |
| `/admin/members` | `Admin/Members/Index` |
| `/admin/members/{id}` | `Admin/Members/Show` |
| `/admin/disputes` | `Admin/Disputes` |
| `/admin/metrics` | `Admin/Metrics` |
| `/admin/suburbs` | `Admin/Suburbs` |
| `/admin/categories` | `Admin/Categories` |
| `/admin/issue-types` | `Admin/IssueTypes` |

---

## 2. Layout hierarchy

```
AppProviders (Inertia, error boundary, toast, echo)
  └─ RoleLayout (picked based on auth user role)
       ├─ PublicLayout      — unauthed pages
       ├─ MemberLayout      — sidebar, topbar, main
       ├─ TradieLayout      — sidebar, topbar with online/offline toggle
       ├─ AdminLayout       — sidebar (admin nav), topbar, main
       └─ AuthLayout        — centered card, used for login/signup flows
```

Laid out in `resources/js/Layouts/`. Each page exports `Page.layout = MemberLayout;` so Inertia reuses the layout across navigation (no re-mount).

---

## 3. Component library

### 3.1 Primitives (`resources/js/Components/ui/`)

Build these first. All primitives are Tailwind-styled, typed, accessible.

- `Button` (variants: primary, secondary, ghost, destructive; sizes: sm, md, lg)
- `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Toggle`
- `Label`, `FormField` (wraps label + input + error)
- `Card`, `CardHeader`, `CardBody`, `CardFooter`
- `Modal`, `Dialog`, `AlertDialog`
- `Toast` (consumed via `useToast()` hook — driven by Inertia flash messages)
- `Pill` / `Badge` (status indicators — accept `variant` for colour)
- `Spinner`, `ProgressBar`
- `Table`, `TablePagination`
- `Tabs`, `TabPanel`
- `EmptyState` (icon, title, body, primary CTA)
- `Skeleton` (loading placeholders)
- `Countdown` — renders a decreasing mm:ss timer given a target Date. Used on lead cards.

### 3.2 Domain components (`resources/js/Components/domain/`)

- `JobStatusPill` — maps status enum to colour + label
- `UrgencyPill`
- `LeadCard` — tradie lead inbox row. Takes an offer + job, shows countdown.
- `JobCard` — member dashboard / job list row.
- `StatusTimeline` — vertical list of status_log entries.
- `AddressAutocomplete` — async `combobox` hitting `/properties/address-autocomplete`.
- `PhotoUploader` — drag-drop, pre-uploads via `/uploads/job-image`.
- `TradieProfileCard` — name, rating, jobs count, top suburbs.
- `PerformanceStatTile` — label + big number + delta.
- `BenefitsReminder` — reusable "✓ No call-out fee ✓ 10% discount" callout.

### 3.3 Forms

Every form is a dedicated component that wraps `useForm`:

```tsx
import { useForm } from '@inertiajs/react';

export function AddPropertyForm({ suburbs }: Props) {
  const { data, setData, post, errors, processing } = useForm({
    label: '',
    address_line_1: '',
    suburb_id: null as number | null,
    property_type: 'house' as PropertyType,
    // ...
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('properties.store'));
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* fields */}
    </form>
  );
}
```

**AGENT NOTE on the `route()` helper:** Use Ziggy (`tightenco/ziggy`). It exposes Laravel's named routes to JavaScript with type-safe names if `ziggy:generate --types` is run.

---

## 4. State management rules

1. **Server state lives on the server.** Inertia's props are the source of truth for page data. Don't cache in client state.
2. **Form state** uses `useForm`.
3. **Ephemeral UI state** (modal open, toggle, etc.) uses `useState`.
4. **Shared derived state** (counts, filters) uses `useReducer` if there are >3 related fields.
5. **Cross-page state** (auth user, flash messages) comes from Inertia shared props via `usePage()`.
6. **Realtime updates** come from Echo channel subscriptions inside a `useEffect` on pages that need them. They trigger an Inertia partial reload (`router.reload({ only: ['job'] })`) rather than merging into local state — keeps the server as the single source of truth.

No Redux, no Zustand, no Jotai, no React Query. We have a server; it's the store.

---

## 5. Inertia shared props

Shared via `HandleInertiaRequests` middleware. Keep small — every page ships these.

```php
return [
    'auth' => fn() => [
        'user' => $request->user()?->only(['id', 'first_name', 'last_name', 'email', 'role']),
    ],
    'flash' => fn() => [
        'success' => $request->session()->get('success'),
        'error'   => $request->session()->get('error'),
    ],
    'csrf_token' => fn() => csrf_token(),
    'reverb' => [
        'key'    => config('broadcasting.connections.reverb.key'),
        'host'   => config('broadcasting.connections.reverb.options.host'),
        'port'   => config('broadcasting.connections.reverb.options.port'),
        'scheme' => config('broadcasting.connections.reverb.options.scheme'),
    ],
    'feature_flags' => fn() => [
        'phone_verification' => config('features.phone_verification', false),
        // ...
    ],
];
```

---

## 6. Echo / Reverb client setup

`resources/js/lib/echo.ts`:

```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

declare global {
  interface Window {
    Echo: Echo;
    Pusher: typeof Pusher;
  }
}

export function initEcho(config: ReverbConfig) {
  window.Echo = new Echo({
    broadcaster: 'reverb',
    key: config.key,
    wsHost: config.host,
    wsPort: config.port,
    wssPort: config.port,
    forceTLS: config.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
  });
}
```

Hook usage in a page:

```tsx
useEffect(() => {
  const channel = window.Echo.private(`tradie.${companyId}`);
  channel.listen('.LeadOffered', (e) => {
    router.reload({ only: ['leads'] });
    toast.info('New lead available');
  });
  return () => channel.stopListening('.LeadOffered');
}, [companyId]);
```

The `.` prefix on the event name is required because our events use `broadcastAs()` to give them clean names without the `App\\Events\\` prefix.

---

## 7. Page specifications (key pages)

### 7.1 `Member/Jobs/Wizard` — Request-a-tradie

The 7-step flow from the wireframes. Implemented as a single page with internal `step` state.

**State shape:**
```ts
type WizardState = {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  property_id: number | null;
  tradie_category_id: number | null;
  issue_type_id: number | null;
  custom_issue: string | null;
  urgency: Urgency | null;
  description: string;
  best_contact_time: string;
  uploaded_image_ids: number[];
};
```

**Behaviour:**
- Each step validates its own fields before `setStep(n+1)`.
- Back button preserves state (just decrement step).
- Photos are uploaded as they're selected (step 6), not held in memory. Returns `image_id` stored in state.
- Final submit (step 7) posts the full body to `POST /jobs`.
- After successful submit, redirect to `/jobs/{public_id}` which shows the "finding your tradie" state.

**Validation:**
- Client-side validation mirrors server rules for UX feedback
- Server validation is canonical; client can be more lax

**Skip rules:**
- If member has exactly 1 property, skip step 1 (auto-select)
- If category has no issue types (shouldn't happen but handle), skip step 3

### 7.2 `Tradie/Leads/Index`

**State:**
- Polls every 30 seconds as a fallback (via Inertia partial reload).
- Realtime updates via Echo `private-tradie.{companyId}` channel.
- On `LeadOffered` event → partial reload.
- On `LeadWithdrawn` event → partial reload.

**Behaviour:**
- Lead cards show `Countdown` component ticking down `expires_at`.
- Accept button triggers `POST /tradie/leads/{offer}/accept`.
  - On success (200), redirect to `/tradie/jobs/{publicId}` — contact revealed.
  - On 410 (expired), show toast "Offer expired" + reload list.
  - On 409 (superseded), show toast "Another tradie accepted" + reload list.
- Decline opens a small modal with reason dropdown, then posts.

### 7.3 `Member/Jobs/Show`

**Behaviour:**
- Echo `private-member.{userId}` channel listening for `JobStatusChanged` for this job.
- On status change → partial reload page.
- Status-specific CTAs:
  - `pending_dispatch` / `offered`: show "Dispatching..." with animation. Allow cancel.
  - `assigned` / `tradie_on_the_way`: show tradie card with tel-link and map link.
  - `in_progress`: same + "Tradie is working" indicator.
  - `completed` (no review yet): show the review form.
  - `confirmed`: show review summary.
  - `disputed`: show dispute state + admin contact.
  - `cancelled`: show cancellation reason.

### 7.4 `Admin/Overview`

Server-rendered with Inertia, no realtime dependency for MVP. Refresh on manual page load.

Cards:
- Active members / tradies / this month jobs (big stat tiles)
- Attention required (list of categories with counts)
- Live jobs table (last 20)

---

## 8. Form validation UX rules

- Never swallow a validation error. Every field that the server validates gets a visible error message under the field on submission failure.
- Disable submit while `processing`. Show spinner.
- On success, the server's redirect handles the next screen. Frontend only clears the form if staying on the same page.
- Number inputs for money: accept `"$34.00"` or `"34"` and convert to cents before submit. Never store floats in state.

---

## 9. Accessibility baseline (non-negotiable)

- Every form field has a `<label>` tied via `htmlFor`.
- Interactive non-button elements use `role="button"` + `onKeyDown` handlers.
- Colour contrast meets WCAG AA (≥4.5:1 for body text). Tailwind's `gray-700` on `white` passes; `gray-500` does not.
- Focus rings visible (don't `outline-none` without a replacement).
- All modals trap focus + close on Escape.
- All images have `alt` (decorative images use `alt=""`).

---

## 10. Mobile responsiveness

- MVP design target: 360px → 1440px.
- Breakpoints: use Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280).
- Sidebar layouts collapse to a drawer below `md`.
- Tradie dashboard must be usable on a phone (lead acceptance is field-first). Test at 360px.
- Admin dashboard can assume ≥1024px. Don't waste time polishing it on mobile.

---

## 11. Styling conventions

- **Use Tailwind utility classes directly.** No `@apply` except in `resources/css/app.css` for truly global utilities.
- **Colour tokens** are defined in `resources/css/app.css` via `@theme {}` blocks (Tailwind 4 CSS-first config — no `tailwind.config.js`):
  - `--color-brand-*` (50..900) — replaced once branding is decided
  - `--color-neutral-*` — grays for text and borders
  - `--color-success-*` / `--color-warning-*` / `--color-danger-*` — semantic
- **Font**: system font stack at MVP (`font-sans`). Swap in a display font once branding is chosen.
- No component library (no shadcn/ui, no Material). Hand-built primitives so they match the eventual brand.

**Web is light + neutral by default.** This is a deliberate divergence from the mobile apps, which are dark + glassmorphic (see `11-mobile-apps-spec.md §12`). Rationale:

- Web audience skews toward admin dashboards, longer-session tasks (submitting jobs, reviewing performance), and desktop viewing — all better served by a conventional light UI.
- Mobile audience is one-handed, often outdoors, often one-task-and-close — better served by a differentiated, app-like aesthetic.
- Trying to unify would drag one down to the other's constraints. Two surfaces, two design languages, both intentional.

Do not share design tokens between the web's `@theme {}` CSS block and the mobile `packages/ui/src/theme/tokens.ts`. They diverge on purpose.

**Branding (MVP defaults):** Primary indigo `#4f46e5` (already applied to email header and nav), Tailwind slate for neutrals, Inter/system-sans typography. Swap in a full brand guide as a single PR when ready.

---

## 12. Error boundaries and fallbacks

Top-level `<ErrorBoundary>` in `resources/js/app.tsx`. Catches render errors, shows "Something went wrong — we've been notified" page with a reload button. Reports to Sentry.

Per-page `Suspense` not needed at MVP (no lazy routes).

---

## 13. Performance targets

- First contentful paint < 1.5s on 3G fast.
- Bundle: main chunk < 200kb gzipped. Enforce with `vite-bundle-visualizer` checked in CI.
- Images: only serve signed S3 URLs with `?w=800` resize params (if the CDN supports; otherwise serve full).
- Lazy-load images below the fold with `loading="lazy"`.

---

## 14. Open decisions

| # | Decision | Impact |
|---|---|---|
| 1 | Branding (colours, fonts, logo) | `@theme {}` block in `app.css` + `AuthLayout`. |
| 2 | Copy tone + final plan names | All user-facing strings — collate in `resources/js/lib/strings.ts` first so changes are one PR. |
| 3 | Time-zone display strategy | Default to Australia/Perth; offer per-user pref (Phase 2). |
