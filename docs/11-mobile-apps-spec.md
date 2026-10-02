# 11 — Mobile Apps Specification

**Status:** Canonical. Covers the two React Native apps (Tradie and Member) delivered in a shared monorepo. Phase 2 delivery, after web MVP is live.

---

## 0. Read this first

Two apps, one repo, one backend. The apps share auth, API client, types, theming, and push-notification plumbing, but have **completely separate navigation trees and screens**.

Do not build a single-app-with-role-switch. That was explicitly rejected after architectural review — see conversation history. If you're tempted, stop and re-read.

**Target timeline:** Phase 2.A = Tradie app (4–6 weeks). Phase 2.B = Member app (3–4 weeks). 2.A ships first because mobile-first lead response is business-critical for tradies; members manage fine on mobile web until the member app lands.

---

## 1. Stack (locked)

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| Framework | React Native (via Expo) | SDK 55+ | Current as of this doc. New Architecture enabled by default. |
| Workflow | **Expo managed** + `expo-dev-client` | — | Avoid bare workflow unless forced. Dev client is required for push since SDK 53. |
| Language | TypeScript | 5.x | Same as web. |
| Navigation | React Navigation | 7.x | De facto standard. Native stack + bottom tabs. |
| State (server) | TanStack Query | 5.x | Caching, retries, invalidation. Replaces the web's Inertia-driven approach (we're REST now, not Inertia). |
| State (local) | React `useState` / `useReducer` + Zustand for cross-screen | Zustand 4.x | Small, adequate. No Redux. |
| Forms | React Hook Form + Zod | 7.x / 3.x | Same `zod` schemas can be shared with backend form requests (via a generator) later. |
| Styling | NativeWind | 4.x | Tailwind on RN. Matches web design tokens. |
| Icons | `lucide-react-native` | latest | Same icon set as web. |
| HTTP | `axios` | 1.x | Interceptors for auth, logging, retry. |
| Real-time | `laravel-echo` + `pusher-js` + polyfills | latest | Reverb works the same way as web; needs WebSocket polyfill on RN. |
| Push | `expo-notifications` | current | Expo Push service → APNs + FCM. |
| Storage | `expo-secure-store` (credentials), `@react-native-async-storage/async-storage` (non-secret cache) | latest | Keychain/Keystore-backed for tokens. |
| Biometrics | `expo-local-authentication` | current | Face ID / Touch ID / fingerprint / device PIN fallback. |
| Camera / image | `expo-image-picker` + `expo-camera` | current | Pick and take photos. |
| Maps | Native deep-links (`tel:`, `maps:`, `http://maps.google.com/?q=...`) | — | No in-app map at MVP. PHASE 3: Mapbox/Google Maps SDK for live tracking. |
| Error tracking | `@sentry/react-native` | latest | Same project as web, tagged per-app. |
| OTA | Expo Updates | current | Ship JS-only fixes without store submission. |
| Build | EAS Build | current | Expo's cloud build service. Alternative: local Xcode/Android Studio builds. |
| Distribution | TestFlight (iOS), Play Console internal (Android), EAS Update channels | — | |
| E2E testing | Maestro | latest | Lightweight, YAML-driven. Jest for unit. |

**AGENT NOTE:** If a task would require deviating from this list, stop and ask. In particular: **do not swap push providers** (no OneSignal, no Firebase Cloud Messaging direct). Expo Push wraps APNs + FCM and is one integration the Laravel backend will call.

---

## 2. Monorepo structure

We use a flat pnpm/yarn workspace (not Turborepo — simpler, adequate at this scale). Optional: add Turbo later if build times become a problem.

```
tradify/                              # repo root
├── web/                              # the Laravel + Inertia app (moved from repo root)
│   ├── app/
│   ├── resources/
│   ├── routes/
│   └── ...
│
├── apps/
│   ├── tradie-app/
│   │   ├── app.json                  # Expo config
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── App.tsx
│   │   ├── src/
│   │   │   ├── navigation/
│   │   │   ├── screens/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/             # wraps shared API for this app's needs
│   │   │   └── theme/
│   │   └── assets/
│   │
│   └── member-app/
│       ├── app.json
│       ├── package.json
│       ├── tsconfig.json
│       ├── App.tsx
│       ├── src/
│       │   ├── navigation/
│       │   ├── screens/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── services/
│       │   └── theme/
│       └── assets/
│
├── packages/
│   ├── shared/                       # used by both apps AND (a subset) by web
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── api/                  # API client + typed endpoints (calls /api/v1/...)
│   │   │   │   ├── client.ts
│   │   │   │   ├── auth.ts
│   │   │   │   ├── jobs.ts
│   │   │   │   ├── leads.ts
│   │   │   │   ├── properties.ts
│   │   │   │   └── ...
│   │   │   ├── auth/
│   │   │   │   ├── useAuth.ts        # hook shared across apps
│   │   │   │   └── tokenStore.ts     # interface; implementation injected per-app
│   │   │   ├── types/                # Job, JobOffer, User, etc.
│   │   │   ├── schemas/              # zod schemas (forms)
│   │   │   ├── formatters/           # currency, dates, phone numbers (AU)
│   │   │   ├── constants/            # enums mirroring backend
│   │   │   └── echo/                 # shared Reverb setup
│   │   └── tsconfig.json
│   │
│   └── ui/                           # shared RN primitives (NOT web components)
│       ├── package.json
│       ├── src/
│       │   ├── Button.tsx
│       │   ├── TextInput.tsx
│       │   ├── Checkbox.tsx
│       │   ├── Toast.tsx
│       │   ├── Sheet.tsx
│       │   ├── Countdown.tsx
│       │   └── ...
│       └── tsconfig.json
│
├── pnpm-workspace.yaml (or package.json workspaces)
├── CLAUDE.md                          # updated to reference mobile paths
├── docs/
│   └── 11-mobile-apps-spec.md         # this doc
└── PROVISIONING.md
```

**Why `packages/ui/` separate from web components:** React Native's `View`, `Text`, `TouchableOpacity` are not browser DOM elements. The web app uses HTML + Tailwind; the mobile apps use RN primitives + NativeWind. You cannot share a `<Button>` across both. `packages/ui/` is the mobile-only UI primitives shared between the tradie and member apps.

**Root `package.json` scripts (abridged):**

```json
{
  "scripts": {
    "tradie:dev": "pnpm --filter tradie-app dev",
    "tradie:ios": "pnpm --filter tradie-app ios",
    "tradie:android": "pnpm --filter tradie-app android",
    "tradie:build:preview": "pnpm --filter tradie-app eas build --profile preview",
    "tradie:build:prod": "pnpm --filter tradie-app eas build --profile production",

    "member:dev": "pnpm --filter member-app dev",
    "member:ios": "pnpm --filter member-app ios",
    "member:android": "pnpm --filter member-app android",

    "shared:typecheck": "pnpm --filter @tradify/shared typecheck",
    "ui:typecheck": "pnpm --filter @tradify/ui typecheck",

    "lint": "eslint apps packages",
    "typecheck": "pnpm -r typecheck"
  }
}
```

---

## 3. Authentication

### 3.1 Auth model

Mobile apps use the API surface defined under `routes/api.php` (scaffolded empty at web MVP — Phase 2 fills it in).

- **Credential flow:** email + password → `POST /api/v1/auth/login` → returns a **Sanctum personal access token** and a refresh token.
- **Token storage:** tokens in `expo-secure-store` (Keychain on iOS, Keystore on Android). Never in AsyncStorage. Never in memory-only.
- **Token lifetime:** access token 1 hour; refresh token 30 days (rolling — refresh rolls the refresh token too).
- **Biometric unlock:** on subsequent app opens, `expo-local-authentication` gates access to stored tokens. Fallback chain: biometric → device PIN → email+password.

### 3.2 Backend endpoints (new — to add to `04-api-spec.md` as part of Phase 2)

```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/register-device       # store push token
DELETE /api/v1/auth/unregister-device
```

`POST /api/v1/auth/login` request:
```json
{
  "email": "...",
  "password": "...",
  "device_name": "iPhone 15 — Mike"
}
```

Response:
```json
{
  "access_token": "1|abc...",
  "refresh_token": "re_...",
  "expires_in": 3600,
  "user": { "id": 42, "role": "tradie", "first_name": "Mike", ... }
}
```

### 3.3 Token refresh flow

Axios interceptor in `packages/shared/api/client.ts`:

1. On `401 Unauthorized`, pause other requests (queue them).
2. Call `POST /api/v1/auth/refresh` with the refresh token.
3. On success, retry the original request + drain the queue.
4. On failure (refresh token expired), clear tokens, redirect to login.

**AGENT NOTE (crucial):** A race happens when multiple requests 401 at once. The queue-and-replay pattern is non-negotiable. Use a shared `refreshPromise` so only one refresh happens at a time.

### 3.4 Device registration

After login, the app calls `POST /api/v1/auth/register-device`:
```json
{
  "expo_push_token": "ExponentPushToken[...]",
  "platform": "ios",
  "app": "tradie",
  "device_name": "iPhone 15 — Mike",
  "app_version": "1.0.0"
}
```

Backend stores in a new `user_devices` table (schema addition in Phase 2):
```
user_devices
  id, user_id, expo_push_token (unique), platform, app, device_name, app_version,
  last_active_at, created_at, updated_at
```

On logout, the app calls `DELETE /api/v1/auth/unregister-device` to remove the token. The backend also prunes stale devices (last_active_at > 90 days) via a scheduled job.

### 3.5 Role gating

Login checks the user's role. The tradie app rejects login for any user whose role is not `tradie`. Same for member app (reject non-`member`). Admin users use the web console only.

Error message on wrong role:
> This account is for members. Use the Tradify Members app (or tradify.au) to access your account.

---

## 4. API client (shared package)

`packages/shared/api/client.ts` — a configured axios instance with:

- Base URL from env (`EXPO_PUBLIC_API_URL`)
- `Authorization: Bearer <token>` header (from secure store, injected per-request)
- Refresh-on-401 interceptor (see §3.3)
- Request ID header for server-side log correlation
- 15-second timeout (dispatch SMS links are urgent — don't let the app hang)
- Network-error retry with exponential backoff (3 tries on GETs only; mutations never auto-retry)

Each resource has a typed module: `jobs.ts`, `leads.ts`, `properties.ts`, etc. Example:

```ts
// packages/shared/api/leads.ts
import { client } from './client';
import type { LeadOffer } from '../types';

export const leadsApi = {
  list: () => client.get<{ data: LeadOffer[] }>('/api/v1/tradie/leads'),
  show: (offerId: number) => client.get<LeadOffer>(`/api/v1/tradie/leads/${offerId}`),
  accept: (offerId: number) => client.post<{ job_id: number }>(`/api/v1/tradie/leads/${offerId}/accept`),
  decline: (offerId: number, reason: string) =>
    client.post(`/api/v1/tradie/leads/${offerId}/decline`, { reason }),
};
```

TanStack Query hooks wrap these — per app, in each app's `src/hooks/` so the cache key strategy matches the app's UI needs.

---

## 5. Real-time (Reverb)

Same channels as web (`04-api-spec.md §6`). React Native needs WebSocket polyfills:

```ts
// packages/shared/echo/index.ts
import 'react-native-url-polyfill/auto';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

export function createEcho(config: EchoConfig) {
  return new Echo({
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

**Foreground only.** Echo connections don't survive the app being backgrounded on iOS, and on Android they die quickly too. Do not treat Reverb as the primary notification channel — it's a UI-update mechanism while the app is open. **Push notifications are the primary wake-up mechanism.**

When the app foregrounds (`AppState` listener), reconnect Echo and invalidate the active-data queries so UI catches up.

---

## 6. Push notifications

### 6.1 Overview

- Expo Push API is called from the Laravel backend.
- Laravel integrates via `laravel-notification-channels/expo` (or equivalent package; verify current name on install).
- Every `outbound_messages` row with `channel = 'push'` is also logged, same pattern as SMS/email.
- Delivery receipts come back via the Expo Push API (async, 15+ min after send) — worth checking in a scheduled job.

### 6.2 Backend additions (Phase 2.A, before tradie app ships)

New Laravel Notification channel `ExpoPushChannel`. Every notification in `08-notifications.md` gets a `toExpo($notifiable)` method where appropriate.

Example:
```php
class LeadOfferedNotification extends Notification implements ShouldQueue
{
    public function via($notifiable): array {
        return ['twilio', 'expo', 'mail'];   // SMS + push + email
    }

    public function toExpo($notifiable) {
        $offer = $this->offer;
        return new ExpoPushMessage(
            to: $notifiable->tradieExpoTokens(),       // all registered tradie app devices
            title: "New lead: {$offer->job->category->name}",
            body: "{$offer->job->urgency_label} in {$offer->job->property->suburb->name}. Expires in {$offer->minutesUntilExpiry()}m.",
            data: [
                'type' => 'lead_offered',
                'offer_id' => $offer->id,
                'job_public_id' => $offer->job->public_id,
            ],
            sound: 'default',
            priority: 'high',
            categoryIdentifier: 'LEAD_OFFERED',        // iOS interactive notification category
            channelId: 'leads',                        // Android notification channel
        );
    }
}
```

### 6.3 Android notification channels

Android requires pre-registered notification channels with importance levels. Register on app startup:

```ts
// apps/tradie-app/src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('leads', {
    name: 'Lead offers',
    importance: Notifications.AndroidImportance.HIGH,   // heads-up (pop-on-screen)
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
    enableVibrate: true,
  });

  await Notifications.setNotificationChannelAsync('jobs', {
    name: 'Job updates',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('account', {
    name: 'Account & billing',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}
```

Member app has its own channels: `job_status`, `account`.

**AGENT NOTE (critical):** Without a registered channel, Android **silently drops** notifications. No error, no log. This is the #1 cause of "push works on iOS but not Android."

### 6.4 iOS notification categories (for action buttons)

Lead notifications have two-tap actions: "Accept" and "Decline." Register on app startup:

```ts
await Notifications.setNotificationCategoryAsync('LEAD_OFFERED', [
  { identifier: 'ACCEPT', buttonTitle: 'Accept', options: { opensAppToForeground: true } },
  { identifier: 'DECLINE', buttonTitle: 'Decline', options: { isDestructive: true } },
]);
```

In the notification response handler, route accordingly. Decline-from-notification needs a reason, so it does open the app (to the Decline sheet) rather than fire-and-forget.

### 6.5 Deep-link routing

Every push carries `data.type` and entity ID. A single `handleNotificationResponse` function routes to the right screen:

```ts
Notifications.addNotificationResponseReceivedListener((response) => {
  const { type, offer_id, job_public_id } = response.notification.request.content.data ?? {};

  switch (type) {
    case 'lead_offered':
      navigationRef.navigate('LeadDetail', { offerId: offer_id });
      break;
    case 'job_disputed':
      navigationRef.navigate('JobDetail', { publicId: job_public_id });
      break;
    case 'member_tradie_assigned':   // member app
      navigationRef.navigate('JobDetail', { publicId: job_public_id });
      break;
    // ...
  }
});
```

### 6.6 Foreground notification handling

When the app is open, show an in-app toast instead of the system banner:

```ts
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,   // don't duplicate — show our own toast
    shouldShowList: true,
  }),
});
```

The toast is handled by the shared Toast component. For lead offers specifically, the toast is tappable and navigates to Lead Detail.

### 6.7 Permissions UX

First-time permission ask should be **contextual, not on app launch**. The tradie app asks after login on a dedicated "Stay on top of leads" screen. Rejecting is allowed but shows a reminder on leads inbox every session until granted or dismissed-forever.

Never use the default system prompt on cold start without context — Apple rejects apps that do, and users dismiss out of habit.

### 6.8 Quiet hours

Not in MVP mobile (Phase 2). PHASE 3: per-tradie quiet hours. Until then, lead pushes fire whenever the backend sends them. This is deliberate — a tradie signed up to accept emergency leads.

---

## 7. Design system (components)

Shared `packages/ui/` exports RN primitives used by both apps. See **§12 Visual design system** for colours, typography, spacing, and glass-panel rules. This section lists the components themselves.

- `Button` (primary, secondary, ghost, destructive — sizes sm/md/lg)
- `TextInput`, `TextArea`, `Select`, `Checkbox`, `Radio`, `Toggle`
- `FormField` (label + input + error, renders errors below)
- `GlassCard` (default card with glass tint + border — see §12.10)
- `FrostedSheet` (bottom sheet with `BlurView` — see §12.10)
- `Toast`
- `Pill` / `Badge` (urgency, status variants — see §12.2 for semantic colour tokens)
- `Countdown`
- `EmptyState`
- `Spinner`
- `Avatar`
- `ScreenBackground` (gradient wrapper — see §12.11)
- `GlassHeader`, `GlassBottomBar` (screen chrome pattern — §12.11)

**Design tokens** live in `packages/ui/src/theme/tokens.ts`. These are **mobile-only** and deliberately diverge from the web's Tailwind config (see §12.1 rationale). Do not try to unify them.

**Accessibility baseline (non-negotiable):**
- Every interactive element has `accessibilityLabel`
- Every icon-only button has `accessibilityHint`
- Colour contrast WCAG AA (4.5:1 body on glass — see §12.3 for the contrast floor rule)
- Support OS font scaling (don't lock font sizes)
- Respect `AccessibilityInfo.isReduceMotionEnabled()` for animations

---

## 8. TRADIE APP — Navigation shape

Four-tab bottom navigator:

1. **Leads** (home tab — index 0)
2. **Jobs**
3. **Performance**
4. **More** (settings/profile)

Stack inside each tab. Some screens are modal-style (pushed on root):
- Login / Onboarding (outside tabs, auth-gated root stack)
- Completion form (modal on top of Jobs tab)
- Decline reason sheet (bottom sheet)

Navigation file: `apps/tradie-app/src/navigation/RootNavigator.tsx` with `AuthStack` and `AppStack` based on auth state.

---

## 9. TRADIE APP — Page-by-page requirements

Each page has: **Purpose · Data loaded · UI · Interactions · Navigation targets · Edge cases · Push/deep-link behaviour · Acceptance criteria.**

### 9.1 Splash / Auth-check

**Purpose:** Determine auth state and route to login or main tabs.

**Behaviour:**
- On mount: check secure store for tokens.
- If no tokens → Login.
- If tokens present → check biometric preference. If enabled, prompt biometric. On success → restore tokens → call `GET /api/v1/me` to refresh user → main tabs. On failure → Login.
- If biometric disabled → validate tokens silently via `/api/v1/me`. If 401 → attempt refresh. If refresh fails → Login.

**UI:** Logo centered, tiny activity indicator. No interactive elements.

**Acceptance:**
- [ ] Under 1.5 seconds from cold start to main tabs (warm cache)
- [ ] Biometric prompt appears once, not twice
- [ ] Network failure shows "No connection — retry" after 5s timeout; does not hang

---

### 9.2 Login

**Purpose:** Email + password login.

**Data:** none loaded; submits on form.

**UI:**
- Logo
- Email field (keyboardType=email-address, autoCapitalize=none)
- Password field (secureTextEntry)
- "Log in" primary button (disabled until both fields present, loading state while submitting)
- "Forgot password?" link — opens `https://tradify.au/password/forgot` in browser (no native reset flow at MVP)
- "Register as a tradie" link — opens `https://tradify.au/register/tradie/step-1` in browser (tradie registration involves document uploads; native flow is Phase 3)

**Interactions:**
- Submit → `POST /api/v1/auth/login` with `device_name` from `Device.deviceName`
- Success → store tokens → register device push token → go to main tabs
- Error 401 → inline error "Wrong email or password"
- Error 403 with role mismatch → "This account is for members. Download the Tradify Members app."
- Network error → toast "Couldn't reach Tradify. Check your connection."

**Edge cases:**
- Rapid double-submit — debounce 500ms
- Paste-password field — allow (don't be precious)
- Show/hide password toggle

**Acceptance:**
- [ ] Successful login takes user to Leads tab
- [ ] Wrong role shows specific error, not generic 403
- [ ] Keyboard dismisses on submit

---

### 9.3 First-time onboarding

**Purpose:** Permission asks + what to expect. Shown once per device after first successful login.

**Screens (3, swipeable):**

1. **"Leads arrive fast"** — explanation of lead windows and why push is critical. CTA: "Enable notifications" → `Notifications.requestPermissionsAsync()`.
2. **"You're in control"** — explanation of Accept/Decline, not obligated, windows show countdown. No permission ask on this screen.
3. **"Set your availability"** — short explanation of service areas, categories, availability hours. CTA: "Review my settings" → deep-link into Settings > Service Areas (optional; can skip).

**Interactions:**
- Swipe or "Next" buttons between screens
- "Skip" top-right on every screen
- After last screen or skip → mark onboarding complete in secure store → Leads tab

**Acceptance:**
- [ ] Shown exactly once per device (persists across logout/login of same user — but a new user on the same device sees it again)
- [ ] Skip on any screen counts as completion
- [ ] Notification permission ask is the first time the system prompt appears

---

### 9.4 Leads inbox (main screen — most-used)

**Purpose:** Show all currently-offered leads. One-handed, outdoor-readable, obvious actions.

**Data loaded:**
- `GET /api/v1/tradie/leads` — active leads for this tradie
- Subscribe to `private-tradie.{companyId}` channel for `LeadOffered` and `LeadWithdrawn`

**UI:**
- Header: "Leads" + subtle connection indicator (green dot when Reverb connected, amber if polling fallback)
- Pull-to-refresh
- List of lead cards (FlatList for perf)

Each card shows:
- Urgency pill (big, coloured): EMERGENCY (red) / SAME DAY (orange) / WITHIN 48H (blue) / FLEXIBLE (grey)
- Category + issue: "Plumber — Burst pipe"
- Suburb + postcode
- Short description preview (1 line, ellipsis)
- Countdown: "Expires in 1:45" (live ticking)
- Right chevron → Lead Detail

Empty state: illustration, "No active leads. New leads will appear here." + last-updated timestamp.

**Interactions:**
- Tap card → Lead Detail
- Pull down → refetch
- Reverb `LeadOffered` → prepend new card with subtle animation + haptic + (optional) sound if app is foreground
- Reverb `LeadWithdrawn` → remove card with dim-out animation
- Countdown hits 0:00 → card shows "Expired" state for 3s, then removed

**Edge cases:**
- List scroll + live update race: use stable keys (offer_id), never reorder existing items
- Multiple leads arrive in same second: haptic only on first within a 2s window
- Offline: show cached leads with amber banner "Offline — showing cached leads"

**Push behaviour:**
- Tapping a lead push notification routes to Lead Detail (not this screen)
- Foreground receipt of lead push → tappable toast appears + card appears in list (both)

**Acceptance:**
- [ ] Cold-open-to-interactive < 2s on mid-range device (Pixel 6a equiv)
- [ ] Countdown ticks smoothly every second without jank
- [ ] Reverb live update shows a new lead within 3s of backend creation
- [ ] Empty state renders when zero leads
- [ ] Offline banner appears within 5s of connection loss

---

### 9.5 Lead detail (pre-accept)

**Purpose:** Show all context for one lead and offer Accept / Decline.

**Data loaded:**
- `GET /api/v1/tradie/leads/{offerId}` — returns `JobPublicResource` (member contact details NOT included pre-accept per `04-api-spec.md §2`)

**UI (scrollable):**
- Top bar: back arrow, countdown timer (pinned, doesn't scroll away)
- Urgency pill
- Category + issue type as big heading
- Suburb + postcode (no street address pre-accept)
- Property type
- Description (multi-line, full)
- Photos (horizontal scroll of thumbnails, tappable to full-screen viewer)
- Member plan pill (Pro / Investor = small "Priority member" badge)
- Offered-at + expires-at timestamps

- Sticky bottom bar (over content):
  - **Accept** primary button (full width, green) — takes ~60% of the bar
  - **Decline** secondary button (~40%) — ghost style, not destructive-red, because declining is normal

**Interactions:**
- Accept → `POST /api/v1/tradie/leads/{offerId}/accept`
  - Optimistic UI: disable button, show loading state
  - Success (200) → navigate to Job Detail (now with full member contact)
  - 410 Gone → sheet "Sorry, this lead expired. Pull to refresh leads."
  - 409 Conflict (parallel mode) → sheet "Another tradie accepted first. Pull to refresh leads."
  - Network error → toast + re-enable button
- Decline → open bottom sheet with reason options:
  - Too far from my area
  - Currently busy
  - Not the type of work I do
  - Other (text field)
  - Cancel
  → `POST /api/v1/tradie/leads/{offerId}/decline` with reason → pop back to Leads

**Edge cases:**
- User opens lead 0:05 before expiry: don't block Accept (server will reject if actually expired; UI shows "Expires in 0:05")
- User has the screen open when lead expires: swap bottom bar for a disabled "Expired" button + "Find more leads" link back to inbox
- Backgrounding during decline sheet open — sheet persists on return

**Push behaviour:**
- Opened via push notification → same screen, with `from_push: true` tracked for analytics (Phase 3)

**Acceptance:**
- [ ] Lead detail fully rendered within 1s on a good connection
- [ ] Accept/Decline persist optimistically — no double-tap accepts
- [ ] Countdown remains accurate (server time vs device time clock drift handled)
- [ ] Decline reason persists to backend (verifiable in job_offers.declined_reason)

---

### 9.6 Jobs inbox

**Purpose:** All jobs this tradie is assigned to or has completed.

**Data:** `GET /api/v1/tradie/jobs` with optional `?status=active|completed`.

**UI:**
- Top segmented control: Active | Completed
- List of job cards, grouped by date (Today, Yesterday, This week, Earlier)
- Each card: member first name + last initial, suburb, category, current status pill, scheduled time if any

**Interactions:**
- Tap card → Job Detail
- Pull to refresh
- Infinite scroll (page size 20)

**Edge cases:**
- Empty active → "No active jobs. Accept a lead to get started." + button to Leads tab
- Empty completed → "You haven't completed any jobs yet."

**Acceptance:**
- [ ] Status pill colour matches web (consistency)
- [ ] Pagination works past 20 jobs

---

### 9.7 Job detail (post-accept)

**Purpose:** The tradie's working screen while doing a job. Must be usable one-handed on a roof.

**Data:** `GET /api/v1/tradie/jobs/{publicId}` (full resource now — member phone, address, photos, status history)

**UI (scrollable):**
- Top bar: job public_id, status pill
- **Member contact card** (prominent):
  - Name
  - `[📞 Call]` button — `tel:` link
  - `[💬 SMS]` button — `sms:` link
  - Tradie never sees the phone number as a visible string — just the buttons (privacy, minor but thoughtful)

Wait — on reflection, they do need to see the number for writing it down or dialing on another device. **Decision:** show the full number under the buttons as selectable text.

- **Address card**:
  - Full street address
  - `[🗺️ Open in Maps]` button — `http://maps.google.com/?q=<encoded address>` (opens native maps app on both platforms)

- **Job summary**:
  - Urgency pill
  - Category + issue type
  - Description
  - Property type + access notes (if any)
  - Photos (horizontal scroll, tap to view)

- **Status timeline** (vertical list):
  - Submitted → Offered → Assigned (✓ with timestamp) → On the way → Started → Completed
  - Current status highlighted; future statuses greyed

- **Sticky bottom action bar** (changes based on status):
  - `assigned` → "I'm on the way" button
  - `tradie_on_the_way` → "I've started" button
  - `in_progress` → "Mark complete" button (opens Completion form modal)
  - `completed` → "Awaiting member review" info text, no button

**Interactions:**
- Status transition → `POST /api/v1/tradie/jobs/{publicId}/status` with `to_status`
  - Optimistic UI: update pill + timeline immediately
  - Rollback on error
- "Mark complete" → open Completion form modal (see 9.8)
- Call / SMS / Maps → native apps
- Pull to refresh

**Push behaviour:**
- Member cancels a job → push `member_job_cancelled_by_tradie` (reverse recipient of `tradie_job_cancelled_by_member`) routes here
- Member disputes → push `tradie_job_disputed` routes here

**Edge cases:**
- Offline: status transition queues locally; shows "Will sync when online" badge. On reconnect, replays — if server rejects (stale state), prompt user
- Concurrent update: if Reverb pushes a status change the tradie didn't make (admin cancelled), reload with subtle toast "This job was updated"

**Acceptance:**
- [ ] All three tap-to-native actions work on iOS and Android
- [ ] Status transition reflects in under 1s
- [ ] Timeline visually clear which step is current
- [ ] Offline queue works for status transitions

---

### 9.8 Completion form (modal)

**Purpose:** Submit the completion report. The other half of the benefits-confirmation trust loop (member does theirs after).

Presented as a multi-step form to reduce cognitive load. Each step has Next; last has Submit.

**Step 1: Summary of work**
- Large text area, 10–2000 chars
- "What did you do?" helper text
- Next disabled until 10 chars

**Step 2: Invoice total**
- Number input formatted as currency (AUD)
- Keyboard: numeric with decimal
- Stored internally as integer cents
- Next requires value ≥ $0

**Step 3: Benefits honoured**
- Two toggles:
  - "No call-out fee charged" (default on)
  - "Member discount applied"
- If discount toggle on → "Discount amount" field (currency input, default 10% of invoice total, editable)
- **AGENT NOTE:** The tradie self-reports here; member confirms in their own review. This is the first half of the trust loop.

**Step 4: Photos + invoice upload**
- Optional before/after photos (use `expo-image-picker` for gallery, `expo-camera` for live)
- Optional invoice PDF upload (use `expo-document-picker`)
- All upload immediately to `POST /api/v1/tradie/uploads/completion-doc` and `/api/v1/tradie/uploads/job-image`
- Show upload progress
- Max 10 photos, max 20MB each (enforced client-side)

**Step 5: Review & submit**
- Read-only summary of all steps
- Edit button on each section (jumps back)
- "Submit completion report" primary button
- Submits `POST /api/v1/tradie/jobs/{publicId}/complete` with all fields

**Interactions:**
- Back arrow: goes to previous step. On step 1, prompts "Discard completion report?" confirm sheet
- Submit success → toast "Completion sent. Waiting for member to confirm." → close modal, back to Job Detail (now `completed` status)
- Submit error → stay on review step, show error

**Edge cases:**
- Network drops mid-upload: progress bar shows red, retry button, form state preserved
- User accidentally swipes away from modal: prompt to save draft locally (stored in AsyncStorage per-job-id) — Phase 3 nice-to-have
- Invoice total massively off from typical (e.g., $10,000 for a tap) → non-blocking warning "Are you sure?"

**Acceptance:**
- [ ] Five steps all rendered, navigable
- [ ] Invoice total input accepts $, commas, and plain numbers
- [ ] Photos upload and persist across step navigation
- [ ] Submission updates job status to `completed`

---

### 9.9 Performance dashboard

**Purpose:** Tradie's view of their own stats — the selling point for staying on Premium + the honest mirror if things are slipping.

**Data:** `GET /api/v1/tradie/performance?range=90d`

**UI:**
- Top filter: 7d / 30d / 90d (segmented control, default 90d)
- Hero tile: Rating (big number, stars, review count)
- Grid of stat tiles:
  - Leads received
  - Acceptance rate (%)
  - Avg response time (mm:ss)
  - Jobs completed
  - Reported revenue (AUD)
  - Discount given (AUD)
- Small line chart: jobs-per-week (uses `victory-native` or `react-native-chart-kit` — pick one)
- Below: "Top suburbs" and "Top issue types" compact tables
- Footer: small ROI text: "You've earned $X through Tradify leads this period."

**Interactions:**
- Change range → refetch
- Pull to refresh

**Edge cases:**
- New tradie with no data: show "Not enough data yet — keep accepting leads to see your performance" empty state, but still show the 0-value tiles

**Acceptance:**
- [ ] Chart renders on low-end Android without dropped frames
- [ ] Numbers match web performance page for same tradie + date range (consistency test)

---

### 9.10 Service areas

**Purpose:** Manage which suburbs this tradie services.

**Data:** `GET /api/v1/tradie/service-areas`

**UI:**
- List of current suburbs with remove (`×`) button per row
- Big "+ Add suburb" button at top → opens search modal
- Search modal: typeahead over `suburbs` table, debounced 300ms, tap to add

**Interactions:**
- Add suburb → `POST /api/v1/tradie/service-areas` with suburb_id → optimistic add to list
- Remove suburb → `DELETE /api/v1/tradie/service-areas/{id}` → optimistic remove with undo toast (5s)

**Acceptance:**
- [ ] Cannot add duplicate suburb (grey out in search results)
- [ ] Cannot have zero active suburbs (warn + block last remove: "You need at least one service area to receive leads")

---

### 9.11 Categories

**Purpose:** Toggle which categories this tradie serves.

**Data:** `GET /api/v1/tradie/categories` returns list of all categories + which are active for this tradie.

**UI:**
- Heading "Which categories do you service?"
- List of all 8 categories as toggle rows
- Disclaimer: "You can only accept leads in categories you've enabled."

**Interactions:**
- Toggle on/off → `POST /api/v1/tradie/categories` (idempotent upsert)
- Optimistic update with undo on failure

**Acceptance:**
- [ ] Turning off all categories is blocked (at least one must be active)

---

### 9.12 Availability

**Purpose:** Operating hours per day + emergency opt-in.

**Data:** `GET /api/v1/tradie/availability`

**UI:**
- Seven rows (Mon–Sun)
- Each row: day label + toggle (open/closed) + time pickers (opens, closes)
- Below: big toggle "Accept emergency leads outside my hours"
- Info text: "Emergency leads pay more, but you're on call."

**Interactions:**
- Toggle day closed → hide time pickers
- Time picker uses native iOS/Android time picker
- Save button at bottom → `PATCH /api/v1/tradie/availability`
- Navigating away with unsaved changes → prompt

**Edge cases:**
- Opens_at after closes_at → validation error "Open time must be before close time"
- All 7 days closed + emergency off → block save "You'll never receive leads. Enable at least one day or emergency."

**Acceptance:**
- [ ] Settings persist after app restart
- [ ] Reflected in backend availability check during dispatch

---

### 9.13 Subscription status

**Purpose:** Show plan, renewal date, deep-link to web for billing changes.

**Data:** `GET /api/v1/tradie/subscription`

**UI:**
- Plan name ("Premium" / "Standard")
- Plan price (AUD/year)
- Auto-renew status
- "Renews on [date]" or "Expires on [date]"
- Benefits summary (bulleted list from plan config)
- **[ Manage subscription ]** button → opens web (`https://tradify.au/tradie/subscription`) in in-app browser (`expo-web-browser`)

**AGENT NOTE:** We do NOT implement in-app purchase. Stripe Checkout is web-only at MVP. This is deliberate — adding in-app purchase means Apple/Google take 30% commission, which destroys the margin on a ~$500/year subscription. The deep-link-to-web pattern is allowed by App Store guidelines for "external purchase" of digital services **as long as** the app doesn't UI-steer the user inside the app. Acceptable framing: "Manage subscription" button that opens a web browser.

**Edge cases:**
- Subscription expired / past_due → big red banner "Your subscription is inactive. Leads are paused." + CTA "Reactivate now" → web
- Subscription active, auto-renew off → amber banner "Auto-renew is off. Your subscription will end on [date]."

**Acceptance:**
- [ ] Current plan matches backend
- [ ] Manage link opens in secure web browser (Safari View Controller / Chrome Custom Tabs), not embedded WebView

---

### 9.14 Profile & settings (More tab root)

**Purpose:** Account info + notification prefs + sign out + support.

**UI (list):**
- Header: name + email + avatar initials
- Sections:
  - **Account:** Name · Email · Phone · Change password (deep-links to web)
  - **Business:** Business name · ABN · Licence number (read-only; changes go through admin in MVP)
  - **Notifications:**
    - Lead notifications (always on, disabled toggle with note "Required to receive leads")
    - Job update notifications (toggle)
    - Account notifications (toggle, default on)
  - **Privacy:** Privacy policy link · Terms link · "Delete my account" → opens web
  - **App:** Version number · Build number · Clear cache · Report a problem
  - **Sign out** (destructive, with confirm)

**Interactions:**
- Notification toggles → `PATCH /api/v1/tradie/settings` (new endpoint, Phase 2)
- Sign out → confirm → `POST /api/v1/auth/logout` → clear secure store → deregister push token → back to Login

**Acceptance:**
- [ ] Sign out removes tokens and push registration
- [ ] Back-button from Login after sign out doesn't let user back in without re-auth

---

### 9.15 Error and offline states (cross-cutting)

Three top-level UI treatments:

1. **Offline banner** — thin amber bar at top of every screen when `NetInfo` reports no connection. Dismisses on reconnect. Does not block UI; reads appear as cached, mutations queue where sensible (status transitions) or show inline error (accepts, completes).

2. **Session expired modal** — full-screen when 401 after refresh fails. "Your session expired. Sign in to continue." + sign-in button. Prevents any interaction with cached data until re-auth.

3. **Maintenance mode** — backend returns 503 with custom header `X-Maintenance: true` → full-screen "Tradify is getting an update. Back shortly." + retry button.

**Acceptance:**
- [ ] Offline banner appears within 5s of connection loss
- [ ] Session expired cannot be dismissed except via login
- [ ] Maintenance mode screen retry checks server every tap

---

## 10. MEMBER APP — Navigation shape

Four-tab bottom navigator:

1. **Home** (dashboard — index 0)
2. **Jobs**
3. **Properties**
4. **More** (settings, membership, saved tradies, support)

Root stack for login/onboarding.

---

## 11. MEMBER APP — Page-by-page requirements

(Same template as tradie app screens.)

### 11.1 Splash / Auth check

Same as tradie 9.1 — checks tokens and biometric, routes.

### 11.2 Login

Same shape as tradie 9.2. Error for wrong role: "This account is for tradies. Download the Tradify Tradies app."

Registration link → `https://tradify.au/register/member`.

### 11.3 Onboarding

Two screens (simpler than tradie):

1. "Stay updated on your jobs" — notification permission ask
2. "Welcome to Tradify" — one CTA "Submit your first request" → Home tab

### 11.4 Home (dashboard)

**Purpose:** Landing screen after auth. Quick view of what's active + way to start something new.

**Data:**
- `GET /api/v1/member/dashboard` — returns `stats`, `active_jobs`, `recent_activity`

**UI:**
- Greeting: "Hi, [first name]"
- Big primary CTA: **"Request a tradie"** button → Submit wizard
- Stats row (3 tiles, compact):
  - Jobs this year
  - Saved in fees ($)
  - Properties
- Active jobs section:
  - List of cards (max 3), each shows: category, suburb, urgency pill, status pill, submitted time
  - "See all" → Jobs tab
- Empty state if no active jobs: illustration, "No active requests" + the big CTA

**Interactions:**
- Request a tradie → Submit wizard modal
- Tap active job → Job detail
- Pull to refresh

**Push behaviour:**
- Tapping home notification is rare; most pushes deep-link to Job Detail

**Acceptance:**
- [ ] Home loads in < 1s on warm cache
- [ ] Stats match web dashboard exactly

### 11.5 Submit request wizard (modal, multi-step)

Same logic as web's `Member/Jobs/Wizard` (see `06-frontend-spec.md §7.1`), but native UI patterns.

**Steps:**

1. **Property select** (skip if only 1)
   - Big tappable cards per property
   - "+ Add property" at bottom → Property form

2. **Category**
   - Grid of 8 big tappable cards with icon per category (Plumber, Electrician, etc.)

3. **Issue type**
   - List of issue types for chosen category
   - "Other" text input at bottom
   - Skip if category has no issue types

4. **Urgency**
   - Four tappable rows (Emergency / Same day / Within 48h / Flexible) with descriptions

5. **Description**
   - Multi-line text input (max 2000)
   - Placeholder: "What's happening? Include any details that'll help the tradie."

6. **Photos** (optional)
   - "Add photo" → native camera sheet: Take photo / Choose from library
   - Uploaded immediately to `POST /api/v1/uploads/job-image`
   - Show thumbnails with remove buttons
   - Max 5 photos (enough; constraint for UX not storage)

7. **Review**
   - Read-only summary of everything
   - Edit buttons per section
   - Submit button → `POST /api/v1/jobs`

**Interactions:**
- Progress indicator at top (step X of 7)
- Back/Next swipe gestures disabled — use explicit buttons to reduce accidental navigation
- On success → close modal, navigate to Job Detail with the new job
- Error 402 (subscription inactive) → close wizard, show "Your membership is inactive. Renew to submit jobs." + link to web

**Edge cases:**
- Exits mid-wizard: prompt "Discard this request?" on back from step 1 or swipe-dismiss
- Network fails on submit: stay on Review step, show retry — form state preserved
- Photo upload fails: specific photo shows red border + retry button; don't block other photos

**Acceptance:**
- [ ] Happy path from start to Job Detail in < 90 seconds manual test
- [ ] Photos uploaded before submit — submit doesn't re-upload
- [ ] Cancelling doesn't leak orphan photos (they're auto-cleaned on server after 24h anyway)

### 11.6 Properties list

**Purpose:** Manage properties.

**Data:** `GET /api/v1/member/properties`

**UI:**
- List of property cards: label, address, primary badge, property type icon
- "+ Add property" button at top (disabled if at plan limit, with tooltip)
- Tap card → Property detail/edit

**Interactions:**
- Long-press or swipe-left reveals Delete (disabled if property has non-terminal jobs)

### 11.7 Property detail / edit

**Purpose:** Create or edit a property.

**UI:**
- Label
- Address autocomplete (uses the web's Google Places proxy endpoint — same as `04-api-spec.md §2.13`)
- Property type picker
- Gate code (optional)
- Access notes (optional, multi-line)
- Is primary toggle (only visible if user has >1 property)
- Save button

**Interactions:**
- Address autocomplete is a typeahead, debounced
- Selection populates street + suburb_id
- Save → `POST` or `PATCH /api/v1/member/properties[/id]`

**Edge cases:**
- Plan limit reached on Add → blocked with "Upgrade your plan to add more properties" deep-link
- Cannot delete if any non-terminal jobs for that property → block with explanation

### 11.8 Jobs list

**Purpose:** All jobs across all properties.

Same pattern as tradie 9.6. Segmented: Active | Completed. Group by date. Pull to refresh. Infinite scroll.

### 11.9 Job detail (member-facing)

**Purpose:** Track a single job from submission through completion and review.

**Data:** `GET /api/v1/member/jobs/{publicId}` + subscribe to `private-member.{userId}` for `JobStatusChanged`

**UI — changes based on status:**

All statuses:
- Top: job public_id, status pill
- Property label + address
- Category + issue + urgency pill
- Description
- Photos (tappable, horizontal scroll)
- Status timeline (vertical, same pattern as tradie view)

**Status-specific sections:**

- `pending_dispatch` / `offered`:
  - Big "Finding your tradie..." animated spinner
  - Helper text: "We're offering this to the best-matched tradie. You'll be notified when someone accepts."
  - Cancel button (secondary)

- `assigned` / `tradie_on_the_way` / `in_progress`:
  - **Assigned tradie card:**
    - Business name, rating (stars + count)
    - Premium badge if applicable
    - `[📞 Call]` `[💬 SMS]` buttons
    - Phone number as selectable text
  - Status-specific messages: "On the way" / "Job in progress"

- `completed`:
  - Full completion report visible (summary, invoice amount, benefits self-reported by tradie)
  - **Big CTA: "Leave your review"** — required to confirm benefits (the member's side of the trust loop)

- `confirmed` / `disputed`:
  - Read-only review summary

- `cancelled`:
  - Reason, who cancelled, timestamp

**Interactions:**
- Call/SMS/cancel/review as above
- Cancel → confirm sheet with optional reason → `POST /api/v1/member/jobs/{publicId}/cancel`
- Review → push Review form (11.10)

**Push behaviour:**
- `member_tradie_assigned` push → opens this screen
- `member_tradie_on_the_way` push → opens this screen, status reflects new state (Echo should have updated too)
- `member_job_completed_prompt_review` push → opens this screen, review CTA prominent

### 11.10 Review form

**Purpose:** Member's benefit confirmation + rating. The second half of the trust loop.

**UI (single screen, short):**

- Top text: "How did [Business Name] do?"
- Three questions (radio groups):
  1. "Was the work completed?" — Yes / Partially / No
  2. "Was the call-out fee waived?" — Yes / No
  3. "Was your 10% discount applied?" — Yes / No / Not applicable
- Star rating: 5-tap row
- Optional comment box
- Submit button

**Interactions:**
- Submit → `POST /api/v1/member/jobs/{publicId}/review`
- Success → toast "Thanks — review submitted." → back to Job Detail (now `confirmed` or `disputed`)

**Edge cases:**
- Any "No" to benefits → backend marks job `disputed`. App shows a brief "We've flagged this for our team to check. They'll be in touch." sheet before returning.
- Dismiss without submitting → prompt "Save for later?" (no: discard; yes: stays accessible from Job Detail)

### 11.11 Saved tradies

**Purpose:** View and manage saved tradies (can request again directly in the future — Phase 3; MVP just the list).

**Data:** `GET /api/v1/member/saved-tradies`

**UI:**
- List of tradie cards: business name, category, rating, saved date
- Swipe to unsave

### 11.12 Membership

**Purpose:** Plan info + deep-link to web for billing.

Same pattern as tradie 9.13:
- Plan name, price, renewal date
- Benefits list
- "Manage membership" button → web

### 11.13 Profile & settings (More tab root)

Same pattern as tradie 9.14. Sections:
- Account
- Notifications (no "required" leads channel — members aren't receiving leads)
- Privacy / Legal
- App info
- Sign out

### 11.14 Support

**Purpose:** Contact support.

**MVP UI:** Just a tappable email link "Email support" → native mail app with pre-filled "To: support@tradify.au" + device/app version in body.

**PHASE 3:** In-app form with categories and optional screenshot.

---

## 12. Visual design system (dark + glassmorphic)

This section is authoritative. The design direction is **dark mode, glassmorphic**, and differs from the web app (which is light + neutral). The agent builds to these rules whether or not a Stitch design reference is present.

### 12.1 Core commitments

- **Theme:** dark mode only at MVP. No light-mode toggle. The system status bar is light-text-on-dark.
- **Aesthetic:** glassmorphism — frosted translucent surfaces on top of richer coloured/gradient backgrounds.
- **Divergence from web is intentional.** The web app stays light and neutral (see `06-frontend-spec.md §11`). Do not try to unify. The `packages/ui/` design tokens described below are mobile-only.

### 12.2 Colour tokens

Tokens live in `packages/ui/src/theme/tokens.ts`. **Every colour in a screen comes from here — never hardcoded hex in component code.**

```ts
export const colors = {
  // Backgrounds (base layers, behind everything)
  bg: {
    base: '#0A0B12',          // deepest background
    surface: '#12141D',       // one layer up (cards that aren't glass)
    gradientFrom: '#1A1B2E',  // top-left of app-wide gradient
    gradientTo: '#0A0B12',    // bottom-right of app-wide gradient
  },

  // Glass panels (semi-transparent, rendered over bg)
  glass: {
    light: 'rgba(255, 255, 255, 0.08)',   // subtle surfaces
    medium: 'rgba(255, 255, 255, 0.12)',  // default cards
    heavy: 'rgba(255, 255, 255, 0.18)',   // elevated (modal, sheet)
    border: 'rgba(255, 255, 255, 0.10)',  // glass edge highlight
  },

  // Text
  text: {
    primary: '#F5F7FA',        // titles, body on glass
    secondary: '#B4B9C5',      // labels, metadata
    tertiary: '#7C8293',       // captions, placeholders
    inverse: '#0A0B12',        // text on bright accent buttons (rare)
  },

  // Accent (primary CTA, focus, interactive)
  accent: {
    500: '#6366F1',            // default accent (adjust to brand once locked)
    400: '#818CF8',            // hover/press lighter
    600: '#4F46E5',            // active/depressed
    glow: 'rgba(99, 102, 241, 0.24)', // used under Accept-button halo, etc.
  },

  // Semantic (urgency pills, status pills)
  urgency: {
    emergency: '#EF4444',
    emergencyGlow: 'rgba(239, 68, 68, 0.24)',
    sameDay: '#F59E0B',
    sameDayGlow: 'rgba(245, 158, 11, 0.24)',
    within48h: '#3B82F6',
    within48hGlow: 'rgba(59, 130, 246, 0.24)',
    flexible: '#6B7280',
    flexibleGlow: 'rgba(107, 114, 128, 0.18)',
  },

  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger:  '#EF4444',
    info:    '#3B82F6',
  },

  // Overlays
  overlay: {
    modal: 'rgba(0, 0, 0, 0.60)',       // behind modals + sheets
    scrim: 'rgba(0, 0, 0, 0.40)',       // under images, toasts
  },
} as const;
```

**AGENT NOTE:** The accent palette is a placeholder — swap when branding is locked. All OTHER tokens are fixed for MVP.

### 12.3 Contrast floor (non-negotiable)

Glassmorphism commonly fails WCAG AA contrast. To ensure accessibility compliance (which `06-frontend-spec.md §9` requires at 4.5:1 for body text):

- **Body text on glass** must render ≥ 4.5:1 contrast against the darkest pixel of the underlying background. We achieve this by keeping `bg.base` dark enough and setting the glass tint with enough lightness that white text always reads.
- **Minimum glass-panel opacity:** 0.85 when text content sits on top. If a glass panel has only decorative content (icon + colour), opacity can drop to 0.60.
- **Outdoor readability mode:** settings screen has a "High contrast mode" toggle. When enabled, glass panels lose transparency and render as `bg.surface` opaque. Tradies working in direct sunlight get a functional app. This is a mobile-only accessibility win — not an afterthought.

**Verify contrast** with any one of: the WebAIM contrast checker, Stark Figma plugin, or React Native Accessibility Inspector. The agent must not ship a screen without running the contrast check on every text element.

### 12.4 Blur and performance

`expo-blur` / `BlurView` uses `backdrop-filter: blur()` on iOS and a native blur on Android — GPU-expensive on both. Rules:

**Allowed (unconditional):**
- Tab bar — single instance, always visible
- Modals and bottom sheets — not in scroll paths
- Toast banners — ephemeral, single instance
- Status pills on hero cards (one or two per screen max)

**Allowed with care:**
- The top glass header on each screen — fine, but `intensity` ≤ 40 on Android (Android's blur is coarser and more expensive)

**NOT allowed:**
- `BlurView` inside `FlatList` item renderers. Lead cards and job cards use `colors.glass.medium` tinted `View` components with `backgroundColor`, not `BlurView`. Same visual at 10% the cost.
- Nested `BlurView`s.
- `BlurView` behind animated elements (the animation re-rasterises the blur every frame).

**The look without `BlurView`:** a `View` with `backgroundColor: rgba(255,255,255,0.08)` + a subtle `borderColor: rgba(255,255,255,0.10)` + `borderRadius` hits 90% of the glass aesthetic at a fraction of the cost. Reserve true frosted blur for moments that matter.

### 12.5 Elevation and depth

Dark UI doesn't have natural shadow language the way light UI does. Depth comes from:

- **Glass tint stacking:** `glass.light` (0.08) < `glass.medium` (0.12) < `glass.heavy` (0.18). Higher surfaces use higher tint.
- **Subtle inner stroke:** `borderWidth: 1` with `borderColor: colors.glass.border` on every glass surface gives the "etched" glass feel.
- **Accent glow** under primary CTAs: a soft radial `shadowColor: colors.accent.glow` with `shadowOpacity: 0.5` and `shadowRadius: 16` (iOS) / elevation + `shadowColor` on Android.

### 12.6 Typography

Using system font stack at MVP (`System` on iOS maps to SF Pro; `sans-serif` on Android maps to Roboto). These render well in dark mode without tuning.

```ts
export const typography = {
  display: { fontSize: 32, fontWeight: '700', lineHeight: 40 },  // rare — hero numbers only
  h1:      { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  h2:      { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  h3:      { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  bodyLg:  { fontSize: 17, fontWeight: '400', lineHeight: 26 },  // Lead card description
  body:    { fontSize: 16, fontWeight: '400', lineHeight: 24 },  // default
  bodyMd:  { fontSize: 15, fontWeight: '500', lineHeight: 22 },  // button text, labels
  small:   { fontSize: 14, fontWeight: '400', lineHeight: 20 },  // metadata
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },  // timestamps
  mono:    { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), fontSize: 14 },
} as const;
```

**Tradies work outdoors** — minimum body text size is 16. Do not use `small` or `caption` for anything tappable or critical.

### 12.7 Spacing and layout

Standard 4-point scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Expose as `spacing.xs` through `spacing['2xl']`.

**Standard touch target: 48×48 minimum.** Enforced in `Button` and `IconButton` primitives.

**Screen padding:** `spacing.lg` (16pt) horizontal as default. Tradie screens used one-handed get `spacing.md` (12pt) only when vertical real estate is critical (e.g., Leads Inbox cards).

### 12.8 Motion

- Default easing: `Easing.bezier(0.4, 0, 0.2, 1)` (standard "ease-in-out")
- Default duration: 200ms for micro-interactions, 300ms for modal transitions, 400ms for hero reveals
- `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` for list insertions/removals
- **Never animate blur.** Cross-fade instead.
- **Reduce motion setting respected** — `AccessibilityInfo.isReduceMotionEnabled()` disables non-essential animation.

### 12.9 Iconography

`lucide-react-native` at stroke width 1.75 (slightly lighter than default 2 — reads better on dark). Colour defaults to `text.secondary`; `text.primary` for emphasis; `accent.500` for interactive.

### 12.10 Component primitives cheatsheet

For the agent, here's what each `packages/ui/` primitive does in this theme:

- **`<GlassCard>`** — default card wrapper. Renders a `View` with `glass.medium` tint, `glass.border` stroke, `borderRadius: 16`, padding `spacing.lg`. No `BlurView`.
- **`<FrostedSheet>`** — bottom sheet. Uses `BlurView` at intensity 60 on iOS, 40 on Android. One visible at a time.
- **`<Button variant="primary">`** — `accent.500` background, `text.inverse` text, `accent.glow` shadow, 48pt tall.
- **`<Button variant="secondary">`** — glass tint, `glass.border` stroke, `text.primary` text.
- **`<Button variant="ghost">`** — no bg, no stroke, `accent.500` text.
- **`<Pill variant="urgency" value="emergency">`** — bg is `urgency.emergency` at 20% alpha, text is `urgency.emergency` full. Glow optional.
- **`<Countdown>`** — monospace numerals, size `bodyLg`, changes colour to `status.danger` when < 30s remaining.

### 12.11 Screen chrome pattern

Every screen (except Splash and the wizard modals) follows this outer structure:

```
<ScreenBackground>                      {/* gradient backdrop */}
  <SafeAreaView>
    <GlassHeader>                       {/* translucent top bar */}
      Back / Title / Actions
    </GlassHeader>
    <ScrollView> or <FlatList>
      ...content (glass cards over gradient)
    </ScrollView>
    <GlassBottomBar> (if actions)       {/* translucent bottom bar */}
      Primary action
    </GlassBottomBar>
  </SafeAreaView>
</ScreenBackground>
```

`<ScreenBackground>` is a single gradient `View` per screen — **not** repeated per card. Reuse costs nothing since each screen is one instance.

---

## 13. Using the Stitch design exports

You have Stitch-generated React Native code for every screen. These are **visual references and styling guides, not drop-in production code**. The agent must understand the distinction before starting any screen work.

### 13.1 What Stitch gives you

Per screen, expect:
- React Native JSX component with the visual layout
- Inline `StyleSheet.create` with hardcoded colours, spacing, and typography
- Mock data inline (e.g., hardcoded lead cards)
- Possibly inlined SVG icons as paths
- Possibly library imports we haven't whitelisted

### 13.2 What the agent should do with them

**Treat Stitch code as a spec for visuals, not a spec for behaviour.**

For each screen:

1. **Read the spec section** in `11-mobile-apps-spec.md` for behaviour, state, API calls, navigation, edge cases, and acceptance criteria. Behaviour is authoritative.
2. **Read the Stitch code** at `docs/design/<app>/<screen-id>.tsx` for visual structure — component tree, spacing, colour choices, typography, iconography.
3. **Re-implement the screen from scratch** in the app, using:
   - `packages/ui/` primitives (`GlassCard`, `Button`, `Pill`, etc.) — not raw `View`/`TouchableOpacity`
   - Design tokens from `packages/ui/src/theme/tokens.ts` — no hardcoded colours or numbers
   - NativeWind classes where they exist, StyleSheet only where they don't
   - `lucide-react-native` icons — not inlined SVGs
   - TanStack Query hooks for data (`useLeadsQuery`, `useAcceptOfferMutation`, etc.) — not mock data
   - React Hook Form + Zod for any form input
4. **Match the visual outcome, not the code.** If the Stitch layout and our spec disagree, spec wins. If Stitch uses a library we haven't whitelisted, do not install it — replicate the look with whitelisted tools.
5. **Mark each screen as `Design-matched`** in a PR note once complete, so human review can verify against the Stitch reference.

### 13.3 What the agent must NOT do

- **Do not paste Stitch code as-is** and wire state into it. The result will drift from the design system, use unlisted libraries, and fight every future change.
- **Do not modify the Stitch files in `docs/design/`.** They are immutable references. If the design needs to change, update the reference in Stitch first, re-export, replace the file, and note the change in a commit.
- **Do not copy inlined SVG icons.** Always use `lucide-react-native` (or the project icon system if it evolves).
- **Do not hardcode colours or dimensions seen in the Stitch file.** Add tokens if a new value is genuinely needed.
- **Do not install a library just because it appears in a Stitch file.** Cross-reference the package whitelist in `09-development-guide.md §16` and this doc's §1. If the library isn't listed, stop and ask.

### 13.4 Handling drift between Stitch and the spec

When the Stitch design shows something not described in the spec (extra field, reordered section, surprising animation):

- If it's an enhancement consistent with the spec's intent → build it, note the addition in the PR, and update the spec in the same commit.
- If it contradicts the spec → stop and ask. Either the spec is wrong or the design is. Do not silently prefer one.
- If it's pure visual polish (a gradient, a shadow, a micro-interaction) → build it; no spec update needed.

### 13.5 When a screen has no Stitch reference

If `docs/design/<app>/<screen-id>.tsx` is missing or empty:

1. Check `docs/design/README.md` for the mapping status.
2. If the screen is genuinely un-designed, build to the spec using the visual tokens (§12). Use the agent's judgement, keep it consistent with other screens.
3. Note in the PR: "Screen built to spec only — no Stitch design was provided."

---

## 14. Cross-cutting concerns

### 12.1 iOS specifics

- **Bundle ID:** `au.tradify.tradie` and `au.tradify.member`
- **APNs:** generated via EAS Credentials automatically when building for production
- **Info.plist additions:**
  - `NSCameraUsageDescription`: "Take photos of the issue for your tradie."
  - `NSPhotoLibraryUsageDescription`: "Choose photos from your library."
  - `NSFaceIDUsageDescription`: "Unlock Tradify with Face ID."
  - `NSUserNotificationsUsageDescription`: only if present; Expo handles
- **Background modes:** remote-notification (for silent push updates if needed later)
- **App Store review notes:** disclose that membership/subscription is processed on the web. Provide a demo account and explain Tradify is a marketplace-adjacent service (not pure content). Expect ~1 week review.

### 12.2 Android specifics

- **Package name:** `au.tradify.tradie` and `au.tradify.member`
- **FCM:** via EAS Credentials
- **Required permissions (AndroidManifest via app.json):**
  - `CAMERA`
  - `READ_MEDIA_IMAGES` (Android 13+)
  - `POST_NOTIFICATIONS` (Android 13+)
  - `USE_BIOMETRIC`
- **Notification channels:** registered on app startup (see §6.3)
- **Target SDK:** 34 or higher (Play Store requirement moves yearly)
- **Deep link verification:** `autoVerify` with a `.well-known/assetlinks.json` file at `https://tradify.au/.well-known/assetlinks.json`

### 12.3 Universal / app links

SMS lead notifications currently link to `https://tradify.au/l/...` which redirects to the full URL. In Phase 2, the apps register universal links so tapping an SMS link on a device with the app installed opens the app directly.

- iOS: `apple-app-site-association` file at `https://tradify.au/.well-known/apple-app-site-association` listing the bundle IDs
- Android: `assetlinks.json` at `https://tradify.au/.well-known/assetlinks.json`

Both files are served by Laravel (`routes/web.php` has dedicated routes returning the JSON).

Link patterns handled:
- `https://tradify.au/l/{publicId}` — job lead offer, tradie app handles
- `https://tradify.au/j/{publicId}` — job status, member app handles

### 12.4 OTA updates

Expo Updates configured per app with channels: `production`, `staging`, `development`.

- Binary releases go through App Store / Play Console (slow)
- JS-only fixes go out via `eas update --channel production` (instant)
- Critical fixes hit users within hours, not weeks

Hard rule: **never OTA a fix that changes native dependencies.** If `expo-notifications` upgrades, that's a new binary release.

### 12.5 Analytics

MVP: **none.** Sentry catches crashes; Laravel logs catch funnel issues.

Phase 3: PostHog or Mixpanel for in-app funnel analysis (onboarding completion, lead acceptance rate by device, etc.).

### 12.6 Crash reporting

`@sentry/react-native` wraps both apps. Same Sentry project as web, tagged:
- `app: tradie` or `app: member`
- `platform: ios | android`
- `build: <buildNumber>`
- `user: { id, role }` set on login

Sampling: 100% errors, 20% traces.

---

## 15. Build + release pipeline

### 13.1 EAS configuration

Each app has `eas.json`:

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "http://localhost:8000" }
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "env": { "EXPO_PUBLIC_API_URL": "https://staging.tradify.au" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://tradify.au" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "dev@tradify.au", "ascAppId": "...", "appleTeamId": "..." },
      "android": { "serviceAccountKeyPath": "./path/to/service-account.json", "track": "internal" }
    }
  }
}
```

### 13.2 Distribution channels

1. **Development:** `eas build --profile development` → installed via QR code on team devices (with dev client)
2. **Preview:** `eas build --profile preview` → internal distribution for testing staging, available to invited testers via EAS link
3. **Production:** `eas build --profile production` → `eas submit` → TestFlight (iOS) / Play Console internal (Android) → production after review

### 13.3 Versioning

- `version` in `app.json`: semver, bumped manually per release (e.g., 1.2.0)
- `buildNumber` (iOS) + `versionCode` (Android): auto-incremented by EAS
- Release notes live in `apps/<app>/CHANGELOG.md` and are copied into the store listings

### 13.4 Store account ownership

**`DECISION REQUIRED: store account ownership`** — needs to be resolved before first submission:

- **Apple Developer Program** ($99 USD/year) — individual or business. Recommend **business** (Apple ID under a company email) because you'll hand it off if you ever sell or bring on a partner.
- **Google Play Console** ($25 USD one-time) — same.

### 13.5 Release cadence

MVP: bi-weekly binary releases + OTA as needed. After launch stabilises, switch to monthly binaries + on-demand OTA.

---

## 16. Testing strategy

### 14.1 Unit tests (Jest)

- Pure functions in `packages/shared/` (formatters, validators, schemas)
- Hooks in isolation (React Testing Library for RN)
- Target coverage: 70%+ on `packages/shared/`

### 14.2 Component tests

- Critical components: LeadCard, Countdown, StatusTimeline
- Use React Testing Library + `@testing-library/react-native`

### 14.3 E2E (Maestro)

Minimum flows tested on a physical device before each release:

**Tradie app:**
- Login → Leads inbox → Lead detail → Accept → Job detail
- Login → Job detail → Status transitions to complete → Completion form submit
- Login → Performance dashboard → Change range

**Member app:**
- Login → Home → Request a tradie (full 7-step wizard) → Submit → Job detail
- Login → Job detail (completed) → Review form → Submit
- Login → Properties → Add property

### 14.4 Device test matrix (minimum)

- iOS: iPhone 13 / iOS 17, iPhone 15 / iOS 18
- Android: Pixel 6a / Android 13, a Samsung mid-range / Android 14

Add newer flagships as they ship. Always test on a real phone before release — simulators lie about performance.

---

## 17. Phase-by-phase delivery (within Phase 2)

### Phase 2.A — Tradie app (4–6 weeks)

**Week 1 — Foundation:**
- Monorepo setup, pnpm workspace, TypeScript paths
- Create `tradie-app` + `packages/shared` + `packages/ui`
- Set up Expo, NativeWind, dev client build
- Auth flow end-to-end (login, secure store, refresh interceptor)
- Notification permission + push token registration

**Week 2–3 — Core flows:**
- Leads inbox with live updates (Reverb)
- Lead detail + Accept/Decline
- Jobs inbox + Job detail + status transitions
- Completion form (all 5 steps)

**Week 4 — Settings & polish:**
- Service areas, Categories, Availability, Subscription, Profile
- Performance dashboard
- Error/offline/maintenance states
- Onboarding

**Week 5 — Store prep:**
- EAS production builds, credentials
- Privacy policy, Terms of service updates for mobile
- App Store + Play Store listings (screenshots, descriptions)
- Submit to TestFlight + Play internal track
- Dogfood with 3–5 real tradies for 1 week

**Week 6 — Launch:**
- Address review feedback
- Store approval
- Production release to existing tradies (announce via email)
- Monitor Sentry + support inbox closely for 2 weeks

**Phase 2.A acceptance gate:**
- [ ] Both platforms (iOS + Android) in production stores
- [ ] At least 20 tradies have installed and used for a real job
- [ ] Lead-offer push → accept in under 60 seconds achievable in tests
- [ ] Crash-free sessions ≥ 99% for 2 weeks

### Phase 2.B — Member app (3–4 weeks)

**Week 1:** Reuse foundation from 2.A. Create `member-app`. Auth flow (trivially copy from tradie app).

**Week 2–3:** Home, Submit wizard, Jobs, Job detail, Review form, Properties.

**Week 4:** Settings, Membership, Saved tradies, store prep, submit, launch.

**Phase 2.B acceptance gate:**
- [ ] Member signup + first job submitted end-to-end on mobile
- [ ] Photo upload works on both platforms at 4G speeds
- [ ] Review form completes benefit-confirmation loop correctly (disputed vs confirmed)

---

## 18. Open decisions

| # | Decision | Status |
|---|---|---|
| 1 | Store account ownership (personal vs company) | Open — §15.4 |
| 2 | Chart library (Victory Native vs react-native-chart-kit) | Open — §9.9 |
| 3 | Draft-save on Completion form | Deferred — Phase 3 nice-to-have |
| 4 | Support: email-only vs in-app form | **Resolved:** email-only at MVP, in-app form Phase 3 |
| 5 | Mobile app branding vs web | **Resolved:** mobile is dark+glass (§12); web stays light+neutral (`06-frontend-spec.md §11`) |
| 6 | Biometric unlock default (on/off) | **Resolved:** on by default, user-toggleable in settings |
| 7 | Member app feature parity threshold | **Resolved:** §11 is the parity list; no further scope question |
| 8 | Accent colour (brand primary) | Open — `colors.accent.500` is placeholder until branding locked |
| 9 | High-contrast mode — always on for outdoor use, or user toggle | Open — default user-toggle in settings (§12.3) |

---

## 19. What is deliberately NOT in this spec

- Messaging between member and tradie (Phase 2.B adds this after core mobile lands, or Phase 2.C)
- Masked voice calls (Phase 2.C)
- Real-time tradie location tracking (Phase 3)
- AI-assisted photo-to-category suggestion (Phase 3)
- Investor analytics in member app (Phase 3)
- Staff/team accounts in tradie app (Phase 3; tradie company with multiple users)
- In-app purchase / subscription management (never — stays on web)

These all belong in a future doc.

---

## 20. Backend changes required for mobile (summary)

For the agent building this: before mobile can ship, the Laravel backend needs these Phase 2 additions:

1. **API routes** in `routes/api.php` mirroring the web endpoints, under `/api/v1/*`
2. **Sanctum** configured with personal access tokens + refresh-token pattern
3. **`user_devices` table** (migration) for push tokens
4. **`laravel-notification-channels/expo`** (or equivalent) installed and configured
5. **`toExpo($notifiable)`** method added to every Notification class in `app/Notifications/`
6. **New endpoints:**
   - `POST /api/v1/auth/login`, `refresh`, `logout`
   - `POST /api/v1/auth/register-device`, `DELETE /api/v1/auth/unregister-device`
   - `PATCH /api/v1/tradie/settings` (notification prefs)
7. **Universal-links JSON files** at `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`

These are in scope for Phase 2.A week 1 — they must land before the app can be end-to-end tested.
