---
name: tradeas-design
description: Use this skill to generate well-branded interfaces and assets for Tradeas, a personal crypto trading dashboard, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. The system is dark-first, numbers-heavy, and lowercase — copy the tokens from `colors_and_type.css` and the patterns from `ui_kits/dashboard/` rather than inventing new ones.

If working on production code (React + Tailwind + shadcn/ui target), copy the CSS variables out of `colors_and_type.css` into your theme config, load the same Google Fonts (Geist + JetBrains Mono), and follow the visual rules in README.md (no emoji, no gradients, lowercase chrome, mono for numbers).

Key contracts to respect:
- Numbers always use `font-variant-numeric: tabular-nums` and the JetBrains Mono stack.
- Profit is `--profit` green, loss is `--loss` red, near-liquidation is `--warn` amber. The accent teal is for focus/selection only — never decoration.
- Cards are flat planes (no shadow), separated by the `bg-0 → bg-3` luminance ramp. Shadows only appear on floating menus and tooltips.
- Use the typeset arrow `↑` / `↓` for direction, never an icon.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some clarifying questions, and act as an expert designer who outputs HTML artifacts or production code, depending on the need.

## Files
- `README.md` — full design system documentation.
- `colors_and_type.css` — drop-in CSS variables for colors, type, spacing, radii, shadows, motion.
- `assets/logo.svg`, `assets/favicon.svg` — provisional brand marks.
- `preview/` — design system reference cards (palettes, type, components).
- `ui_kits/dashboard/` — pixel-fidelity recreation of the four-panel overlord dashboard.
