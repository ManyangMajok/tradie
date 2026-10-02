# Kenyan mobile demonstration

Both mobile apps in this copy use the same Laravel/MySQL demo and existing native design: `apps/member-app` and `apps/tradie-app`. The mobile runtime is Expo SDK 57, React Native 0.86.3 and React 19.2.3. The historical production mobile specification does not require cloud integrations for this demo.

## Install and start

First complete the root README web setup and keep `composer run dev` running in `web/` (web server, queue and scheduler). Install Node 22.13 or newer and pnpm 9.12.0. From the repository root:

```sh
pnpm install --frozen-lockfile
```

Choose the API address:

| Device | API address |
|---|---|
| Android Studio emulator | `http://10.0.2.2:8000` (default on Android) |
| iOS simulator on the server's Mac | `http://127.0.0.1:8000` (default on iOS) |
| Physical phone | Computer's LAN IPv4 address, for example `http://192.168.1.20:8001` |

For a physical phone, keep it on the same trusted Wi-Fi as the computer. Start an additional Laravel listener from `web/` with `php artisan serve --host=0.0.0.0 --port=8001`; keep the existing queue/scheduler running. Allow PHP and Node through the private-network firewall if prompted. Do not use the phone's localhost or the emulator-only 10.0.2.2 address.

Copy each app's `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the applicable address, with no `/api/v1` suffix. Restart Metro after changing it. This is a public server address, never a place for passwords or keys.

Start each app in a separate terminal from the repository root:

```sh
pnpm --filter member-app exec expo start --go --port 8081
pnpm --filter tradie-app exec expo start --go --port 8082
```

Use an Expo Go installation compatible with **SDK 57**, or a local native development build using the project's pinned runtime. An incompatible Expo Go version cannot open this project. Android emulators work on Windows; iOS simulators require macOS. The terminal QR code opens the app on a phone. No tunnel, EAS account, Sentry, Redis, payment provider or push provider is needed. Native store packages/APKs are not produced by the JavaScript export checks below.

## Demonstrate the flow

1. In Members sign in as `member@tradify.dev`, password `password`. The saved member is Wanjiku Mwangi in Westlands, Nairobi.
2. Choose Post a Job, select the Westlands property and Plumbing, use Flexible urgency, and describe the issue. Find local fundis, compare ratings and select one. The list includes every eligible company for that property's service area and category, ranked highest rating first, with unrated companies last. No automatic choice or premium boost is used.
3. Select Westlands Plumbing & Electrical to use `tradie@tradify.dev` / `password` in the Fundis app. Nairobi HomeCare Fundis uses `tradie2@tradify.dev` / `password`. Refresh the leads inbox, accept, then update the job to On the Way and In Progress.
4. Submit a completion report with KSh values, then refresh the member job and review it, explicitly confirming the work, call-out fee and discount. Amounts are stored in minor units (100 per shilling).
5. If a selected fundi declines or the offer expires, refresh the member job and choose another available company. No replacement is selected automatically.
6. Properties use the seeded Kenyan area selector. Fundis can edit their service areas, categories and availability; these affect eligibility. Membership links open the local website and require a separate web sign-in. Payments there are simulated.

## Demo boundaries

External push and background delivery are disabled; refresh the inbox/job screens while demonstrating. Email remains in Laravel's local log. Existing web upload flows save files locally, but the mobile request and completion forms do not upload attachments; the inherited completion photo picker was removed because it never sent its selected files. Mobile personal-account editing remains outside this demo; the account screen displays identity. No real payment is collected. The seeded annual amounts remain illustrative KSh placeholders.

## Checks and updates

After pulling an update, follow the root README web update commands, then run `pnpm install --frozen-lockfile` at the root and restart Metro. Retain each app's `.env`.

```sh
pnpm typecheck
pnpm lint
pnpm --filter member-app exec expo export --platform android --platform ios --output-dir dist
pnpm --filter tradie-app exec expo export --platform android --platform ios --output-dir dist
```

Root mobile lint reuses the ESLint/TypeScript toolchain installed by `npm ci` in `web/`. Backend tests include bearer-token member login, local ratings discovery, member choice, fundi acceptance, status progression, KSh completion and member review. Bundle and API checks do not replace a hands-on device check; no browser or device was operated during this update.

### iPhone opens Expo Go but does not load the project

The mobile `.env.example` sets `EXPO_NO_REDIRECT_PAGE=1` so the QR code opens Expo Go directly. Keep this value in your local `.env` and restart Metro after changing it. The inherited development-client dependency otherwise displays an app chooser; choosing Development Build cannot work without a separately installed native build. Use the fresh QR code after restarting. If Expo Go itself still closes, capture its version and any iPhone error; this redirect fix does not establish the cause of a native crash.

### SDK compatibility

Both apps were upgraded together to SDK 57 after the physical iPhone reported Expo Go SDK 57. Dependencies follow expo@57.0.26 bundledNativeModules.json, including shared UI native modules. The unused NativeWind dependency and obsolete @types/react-native stub were removed; screens continue to use their existing StyleSheet design. babel-preset-expo is now explicit in each app. Use the committed pnpm lockfile, then restart Metro with a cleared cache after pulling this upgrade.
