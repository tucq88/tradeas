# tu.tradeas Design System

A design system for **tu.tradeas** — a personal, single-page crypto trading "overlord" dashboard. This is a solo tool, not a product: precision and readability take priority over decoration.

## Product context

- **Surface:** one desktop page, four panels — pre-trade calculator, open perp positions, spot portfolio, allocation pie chart.
- **User:** one person, all-day stare time. No mobile.
- **Data shape:** dense numerics — prices, PnL, %, sizes, leverage.
- **Mood:** trading terminal, but not intimidating. Calm, focused, low-distraction.
- **Stack target:** React + Tailwind + shadcn/ui. Tokens are exposed as CSS variables so they map directly to a Tailwind theme or `:root` in a shadcn config.

## Sources

No external codebase, Figma file, or brand kit was provided. The system below was authored from the brief. The lowercase wordmark `tu.tradeas` is treated as the brand. All values are placeholders ready for the user to refine.

## Index

- `README.md` — this file.
- `SKILL.md` — agent-skill manifest, cross-compatible with Claude Code.
- `colors_and_type.css` — CSS variables for colors (base + semantic), type ramp, spacing, radii, shadows, motion.
- `assets/` — `logo.svg`, `favicon.svg`.
- `preview/` — 19 design system cards (palettes, type, spacing, components, brand).
- `ui_kits/dashboard/` — interactive React recreation of the overlord dashboard.

## Content fundamentals

Copy is **terse, lowercase, and instrumental**. The product talks to one user — the person who built it — so it never sells, never explains, never apologizes.

- **Casing:** lowercase by default for labels and chrome (`size`, `leverage`, `entry`, `liq`). Numbers and tickers in their natural casing (`BTC`, `4,217.50`, `+12.4%`).
- **Voice:** no first or second person. The UI states facts. "near liquidation" not "you're near liquidation".
- **Density:** abbreviate ruthlessly. `pnl`, `liq`, `lev`, `qty`, `R:R`, `7d`, `24h`. Spell out only when ambiguous.
- **Numbers:** always formatted. Thousands separators, fixed decimals per asset class (USD = 2, BTC = 4, ETH = 3, alts = up to 6). Signed deltas always carry their `+` or `−` (use the minus sign `−`, not hyphen).
- **Tone:** factual, slightly dry. Loss states are quiet, not alarming — color carries the signal, not exclamation.
- **Emoji:** none. Ever.
- **Status words:** short and lowercase — `open`, `closed`, `wip`, `done`, `near liq`, `flat`.

Examples — `pnl  +$1,284.20  +4.2%` · `entry 64,210.0 → 65,418.5` · `liq in 8.4%` · `size 0.142 BTC`.

## Visual foundations

### Mood
A dark terminal that doesn't fight your eyes. Surfaces are near-black but warmed slightly so they aren't clinical. Type is the loudest thing on screen; chrome is whisper-quiet.

### Color
- **Base:** layered neutrals from `--bg-0` (page) through `--bg-3` (raised cards). Each step is a small luminance bump — never more than ~4% — so panels read as planes, not boxes.
- **Foreground:** four-stop ramp from `--fg-0` (primary numerics) to `--fg-3` (tertiary chrome). Most labels live at `--fg-2`.
- **Semantic:** `--profit` (green), `--loss` (red), `--warn` (amber, used only for liquidation proximity), `--neutral` (cool slate). Each has a `-soft` variant for backgrounds/badges.
- **Accent:** a single muted teal (`--accent`), used sparingly — focused inputs, the active tab, the selected pie segment. Never decorative.

### Typography
- **Sans:** **Geist** — labels, headings, chrome. Tight tracking, slight optical-size feel. Loaded from Google Fonts.
- **Mono:** **JetBrains Mono** — every number, every ticker, every price. `font-variant-numeric: tabular-nums` is on globally so columns align without effort.
- **Scale:** modular — `12 / 13 / 14 / 16 / 20 / 28 / 40 / 56`. The big metric numbers (40, 56) are the only places type goes large. Body chrome lives at 13–14.
- **Both fonts are loaded from Google Fonts** as a documented substitution — swap to your preferred foundry licenses anytime.

### Spacing & layout
- **Grid base:** 4px. Spacing tokens `--s-1` (4) through `--s-8` (48).
- **Dashboard layout:** 12-column CSS grid, 16px gap, 24px page padding. The four panels sit on a 2×2 grid at desktop widths (≥1280); each panel is a self-contained card.
- **Panel padding:** 20px. Internal section gap: 16px. Row gap inside tables: 8px.
- **Density:** rows are 36px tall — readable from across the room without wasting vertical space.

### Backgrounds, gradients, textures
None. No imagery, no gradients on chrome, no patterns. The only "gradient" allowed is the *protection fade* on the pie chart hover tooltip and the subtle `--bg-3` lift on hovered rows. Backgrounds are flat color planes.

### Borders, radii, shadow
- **Borders:** 1px hairlines at `--line` (a near-black warm gray). Used to separate planes that share a luminance, never as decoration.
- **Radii:** `--r-sm` 4px (inputs, badges), `--r-md` 8px (cards, panels), `--r-lg` 12px (modals only). No pill buttons.
- **Shadow:** one elevation, used only on floating menus and tooltips: `0 8px 24px -8px rgb(0 0 0 / 0.5)`. Cards do not cast shadows — they're flat planes separated by the luminance ramp.

### Animation
- **Durations:** 120ms (hover/press), 180ms (panel state), 240ms (tab change). Nothing longer.
- **Easing:** `cubic-bezier(0.2, 0, 0, 1)` — fast out, settled in.
- **Number transitions:** numbers do not animate position. Color flashes on update are allowed: a 600ms `--profit-soft` or `--loss-soft` background pulse on the cell that changed.
- **No bounces, no springs, no parallax.**

### Interaction states
- **Hover (rows, tabs):** `--bg-3` background bump. No color shift on text.
- **Hover (buttons):** background goes one step lighter; text stays put.
- **Press:** 96% scale on buttons (200ms ease-out back to 100%). Tabs and rows do not scale.
- **Focus:** 2px outline in `--accent`, 2px offset, on every interactive element. Always visible — keyboard is a first-class citizen here.
- **Disabled:** 40% opacity, no cursor change beyond `not-allowed`.

### Transparency & blur
Used in exactly two places: the floating tooltip backdrop (12px blur over `rgb(0 0 0 / 0.6)`) and the modal scrim (no blur, just `rgb(0 0 0 / 0.5)`). Never on chrome.

### Cards
A card is `--bg-1`, 1px `--line` border, 8px radius, 20px padding. No shadow. Header is a 13px uppercase tracked label in `--fg-2`. That's it.

## Iconography

- **Library:** **Lucide** (CDN, ESM build). Stroke-based, 1.5px weight, 16/20/24 sizes. Chosen because it's the de-facto pair for shadcn/ui and matches the system's restraint.
- **Usage rules:** icons are functional, never decorative. They appear next to actions and statuses, never inside metric cards or numbers. Stroke color always inherits `currentColor` — usually `--fg-2`.
- **Sizes:** 16px in dense rows, 20px in panel headers and buttons, 24px reserved for empty states.
- **Direction badges:** `↑` (long) and `↓` (down/short) are typeset arrows in mono, not Lucide icons — they read as data, not chrome.
- **No emoji. No unicode-as-icon beyond the typeset arrows above.**

The Lucide CDN is referenced from the UI kit via `https://unpkg.com/lucide-static`. If you want to bundle, copy the SVGs into `assets/icons/` and reference locally.

## Substitutions to confirm

- **Fonts** — `Geist` and `JetBrains Mono` loaded from Google Fonts. These are nearest-match open-license substitutions; swap to your own files when you have them. Flagged for review.
- **Logo** — provisional lowercase wordmark `tu.tradeas` rendered in Inter Tight. Replace `assets/logo.svg` when you have a real mark.
- **Icon set** — Lucide via CDN. Drop in your own SVGs if you'd like.
