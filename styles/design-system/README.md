# Design system

These files come from the **Private Wealth Institute** design system
(https://claude.ai/artifact/HTUSi2EESbnkwwxdCrDheq). Do not edit them here:
change the design system, then copy the new files in.

| File here | File in the design system |
| --- | --- |
| `tokens.css` | `project/tokens.css` (generated from `tokens.json`) |
| `tokens.json` | `project/tokens.json` |
| `bundle.css` | `project/components/bundle.css` |

`app/layout.tsx` loads `tokens.css` and `bundle.css` before `app/globals.css`, so every page can use
the tokens (`var(--ink)`, `var(--accent)`, `var(--space-5)` …) and the `pwi-…` component classes.

Rules for site code:

- Use tokens, never a hex code. Prefer semantic tokens (`--bg`, `--fg`, `--fg-muted`, `--accent`,
  `--border`) over brand primitives (`--ink`, `--sand`, `--red`).
- Black sections set `data-theme="dark"`; the semantic tokens switch automatically.
- Charts follow the design system's Charts rules (headline with the finding, numbers as HTML text,
  a details panel instead of tooltips).

The design system's `bundle.js` (motion and chart helpers, `window.PWI`) is not loaded yet.
