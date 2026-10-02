---
name: Premium Dark Glass
colors:
  surface: '#171219'
  surface-dim: '#171219'
  surface-bright: '#3d373f'
  surface-container-lowest: '#110c14'
  surface-container-low: '#1f1a21'
  surface-container: '#231e25'
  surface-container-high: '#2e2830'
  surface-container-highest: '#39333b'
  on-surface: '#eadfea'
  on-surface-variant: '#d0c2d3'
  inverse-surface: '#eadfea'
  inverse-on-surface: '#342e37'
  outline: '#998d9d'
  outline-variant: '#4d4351'
  surface-tint: '#e5b4ff'
  primary: '#e5b4ff'
  on-primary: '#4f0077'
  primary-container: '#bd6fec'
  on-primary-container: '#450069'
  inverse-primary: '#8639b4'
  secondary: '#f2affc'
  on-secondary: '#4d185b'
  secondary-container: '#693376'
  on-secondary-container: '#e2a2ed'
  tertiary: '#dac84e'
  on-tertiary: '#373100'
  tertiary-container: '#bdac35'
  on-tertiary-container: '#484000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#f5d9ff'
  primary-fixed-dim: '#e5b4ff'
  on-primary-fixed: '#30004b'
  on-primary-fixed-variant: '#6b1a9a'
  secondary-fixed: '#fdd6ff'
  secondary-fixed-dim: '#f2affc'
  on-secondary-fixed: '#340042'
  on-secondary-fixed-variant: '#663073'
  tertiary-fixed: '#f7e467'
  tertiary-fixed-dim: '#dac84e'
  on-tertiary-fixed: '#201c00'
  on-tertiary-fixed-variant: '#504700'
  background: '#171219'
  on-background: '#eadfea'
  surface-variant: '#39333b'
typography:
  h1:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 20px
  stack-gap: 16px
  section-padding: 32px
  inner-padding: 12px
---

## Brand & Style

This design system is engineered for high-end mobile experiences that demand a sense of exclusivity and technical precision. The brand personality is professional and sophisticated, utilizing a "Midnight Gallery" aesthetic where deep, desaturated backgrounds allow vibrant accents to pop with high-contrast energy.

The style is a disciplined fusion of **Modern Minimalism** and **Glassmorphism**. It avoids the clutter of traditional shadows, instead using light-refractive surfaces and translucent layers to establish a sense of physical depth. The emotional response is one of calm authority, making it ideal for premium fintech, luxury lifestyle, or high-performance productivity tools.

## Colors

The palette is anchored by a deep obsidian background (`#29262B`), providing a stable foundation for the high-contrast accents. The primary accent, a rich Electric Violet (`#AC5FDB`), is used for core interactions and brand presence. The secondary accent, a soft Lavender Pink (`#E3A2EE`), provides tonal variety and highlights.

Surface colors utilize the base `#3C3541` at varying opacities to create a sense of translucency. Neutral tones are strictly cool-shifted to maintain the professional atmosphere, ensuring that text remains highly legible against the dark, blurred backgrounds.

## Typography

The design system utilizes **Manrope** to fulfill the "System-UI" requirement while adding a refined, modern character that stock system fonts often lack. 

Headings are set with heavy weights and tighter letter spacing to project confidence and "boldness" as requested. The body text is locked at a comfortable 16px to ensure readability against dark backgrounds. Functional labels use an all-caps treatment with increased letter spacing to create a distinct visual hierarchy between content and metadata.

## Layout & Spacing

The layout follows a fluid-to-edge model tailored for mobile devices. It utilizes a 4-column grid with a consistent 20px outer margin. Spacing is governed by a strict 4px/8px incremental scale to ensure mathematical harmony.

Information is grouped into "Glass Containers" that use dynamic padding based on the importance of the content. High-level sections are separated by 32px of vertical space, while related items within a card maintain a 12px or 16px gap to preserve a tight, professional density.

## Elevation & Depth

Depth in this design system is achieved through **Glassmorphism** rather than traditional drop shadows. Surfaces are defined by three distinct layers:

1.  **Backdrop Blur:** A consistent 12px to 20px blur applied to everything behind the surface.
2.  **Translucent Fill:** The surface color (`#3C3541`) is applied with 60% to 80% opacity.
3.  **Inner Glow / Border:** A 1px solid border at 15% white opacity is applied to the top and left edges of cards to simulate a light source reflecting off a glass edge.

Higher elevation is indicated by increased opacity of the surface fill and a sharper inner glow, making the element appear closer to the user.

## Shapes

The design system employs a **Rounded** (Level 2) shape language. Standard UI elements like input fields and small buttons use a 0.5rem (8px) radius. Larger layout containers and cards use a 1rem (16px) radius to soften the high-contrast edges and make the glass effect feel more organic. Interactive elements should never be sharp, as the roundness reinforces the "premium" and "modern" feel of the interface.

## Components

**Buttons**
Primary buttons use a solid gradient from `#AC5FDB` to `#E3A2EE` with white bold text. Secondary buttons utilize the glass effect with a stroke using the primary accent color.

**Cards**
The core of the interface. All cards must feature `backdrop-filter: blur(16px)` and a background of `#3C3541` at 70% opacity. Borders should be a subtle 1px stroke at 10% white.

**Inputs**
Fields are dark-filled containers with a 1px bottom border. On focus, the bottom border glows with the primary accent color (`#AC5FDB`).

**Chips & Tags**
Small, pill-shaped glass elements with low-opacity fills of the secondary accent (`#E3A2EE` at 15%) and high-contrast text.

**Navigation Bar**
A persistent bottom-anchored bar using the highest level of backdrop blur (24px) and 90% surface opacity to ensure it remains distinct from the scrollable content behind it.