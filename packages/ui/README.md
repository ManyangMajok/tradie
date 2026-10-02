# @tradify/ui

Shared React Native UI primitives used by both mobile apps.

Components (per `docs/11-mobile-apps-spec.md §12.10`):
- `<GlassCard>`, `<FrostedSheet>`, `<ScreenBackground>`, `<GlassHeader>`, `<GlassBottomBar>`
- `<Button>` (primary / secondary / ghost / destructive)
- `<TextInput>`, `<TextArea>`, `<Select>`, `<Checkbox>`, `<Radio>`, `<Toggle>`
- `<Pill>`, `<Countdown>`, `<Avatar>`, `<Toast>`, `<Spinner>`, `<EmptyState>`
- Design tokens (`src/theme/tokens.ts`) — colours, typography, spacing

NativeWind + React Native primitives. Dark + glassmorphic theme (mobile-only).

Do NOT share tokens with the web's Tailwind config — intentional divergence. See `docs/11-mobile-apps-spec.md §12.1`.
