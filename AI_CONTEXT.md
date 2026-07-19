# Project Overview

ChipKeep is a premium companion web app for tracking chips during physical card games such as Teen Patti and Poker.

The app is designed to be used on a single device by a player or host to keep score during a real-world game. It does **not** play the game and does **not** determine winners. It only tracks:

- Players
- Chips
- Bets
- Pot
- Winner (recorded manually)

The goal is a clean, trustworthy, mobile-first tool that feels as polished as modern finance or chess apps, not a flashy casino product.

---

# Current Tech Stack

- **React** (v19) — UI library
- **TypeScript** — typed source
- **Vite** (v8) — build tool / dev server
- **react-router-dom** — client-side routing (installed as a dependency)
- **No backend** — fully client-side
- **Single-device, offline MVP** — no login, no network, no persistence yet

---

# Current Folder Structure

```
src/
  assets/        # Static assets (currently empty after default Vite assets were removed)
  components/    # Reusable UI components (currently empty, reserved)
  contexts/      # React context providers (currently empty, reserved)
  hooks/         # Custom React hooks (currently empty, reserved)
  layouts/       # Layout wrappers (MainLayout)
  pages/         # Route pages (Home, CreateGame, Game, Settings)
  styles/        # Global styles (globals.css design system)
  types/         # TypeScript type/interface definitions (currently empty, reserved)
  utils/         # Helper/utility functions (currently empty, reserved)
```

`src/main.tsx` mounts the app inside `<BrowserRouter>` and renders `<App />`.
`src/App.tsx` defines the route table using `<Routes>` / `<Route>`.

---

# Current Progress

Features that **actually exist** today:

- Project initialized with Vite (React + TypeScript).
- Basic project structure created (`assets`, `components`, `contexts`, `hooks`, `layouts`, `pages`, `styles`, `types`, `utils`).
- Global design system implemented in `src/styles/globals.css` (dark theme, CSS variables, premium styling).
- Routing configured with `react-router-dom`:
  - `/` → Home
  - `/create` → Create Game
  - `/settings` → Settings
  - `/game` → Game (placeholder)
- Home screen implemented with premium dark UI:
  - Logo + subtitle
  - Four large rounded action cards (New Game, Continue, Statistics, Settings)
  - New Game navigates to `/create`
  - Settings navigates to `/settings`
  - Continue and Statistics are disabled
- Navigation working (buttons use `useNavigate`).
- Create Game page implemented with:
  - Back button (returns to Home)
  - Starting Chips dropdown (1000, 5000, 10000, 25000, 50000, Custom)
  - Custom numeric input shown when "Custom" is selected
  - "Add Player" button opening a modal
  - Modal with Player Name field, Cancel, and Add
  - Player list displaying each player's name with a delete icon
  - Validation: empty names rejected, duplicate names rejected, maximum 10 players enforced
  - "Start Game" button disabled until at least 2 players exist
  - Start Game navigates to `/game`
  - **No game logic, no chip calculations**
- Settings page exists (app title, back button, placeholder text).
- Game page placeholder exists (simple stub at `/game`).

---

# Design Philosophy

Visual direction:

- **Mobile-first** — designed for phone screens, centered with a mobile max-width on desktop.
- **Premium** — refined, calm, high-quality feel (think Notion Dark, Revolut, Chess.com).
- **Dark theme** — deep slate background (`#0f172a`), elevated card surfaces (`#1e293b`).
- **Minimal** — only what is needed, generous whitespace.
- **Rounded cards** — 18px radius, soft elegant shadows.
- **Modern typography** — system font stack, clear hierarchy, large logo.
- **Clean spacing** — consistent rhythm, no clutter.
- **Avoid flashy casino aesthetics** — no neon, no bright gradients, no cartoon styles.

---

# Development Rules

- Never redesign existing screens without explicit approval.
- Build one feature at a time.
- Keep components modular and small.
- Prefer reusable components over duplication.
- Keep business logic separate from UI (state/handlers in pages or hooks, not inline sprawl).
- Never place all code inside `App.tsx`.
- Use TypeScript properly (typed props, states, and handlers).
- Write production-quality code (clear names, no TODO hacks, handled edge cases).
- Do not install packages unless strictly required for the task.

---

# Roadmap

Future milestones in order:

1. Home
2. Create Game
3. Player Management
4. Game Screen
5. Betting
6. Pot Logic
7. Winner Selection
8. Undo
9. Save Game
10. Statistics
11. Animations
12. Multiplayer

---

# Coding Standards

- Clean architecture: separate `pages`, `components`, `layouts`, `hooks`, `context`, `types`, `utils`.
- Functional React components (`function Component()` or `React.FC`), no class components.
- Reusable components placed in `src/components`.
- Strong typing: define interfaces/types in `src/types` and use them.
- Descriptive variable and function names (no `tmp`, `x`, `data` unless truly generic).
- Modular CSS: global tokens in `globals.css`; component-specific styles co-located or added to the global sheet with clear class naming.
- Avoid duplication: extract repeated UI into reusable components or shared helpers.

---

# UI Standards

- **Spacing:** consistent scale using rem; section gaps ~2rem, element gaps ~0.75–1rem.
- **Button sizes:** primary action cards are large and touch-friendly (min-height ~120px, padding 1.5rem). Inline buttons use comfortable padding (~0.75rem 1.25rem).
- **Responsiveness:** mobile-first; `.home-container` max-width 375px (480px on larger phones), centered on desktop via `.app-container`.
- **Colors:** dark slate palette defined as CSS variables (`--background`, `--card`, `--border`, `--muted`, `--primary` indigo `#6366f1`, etc.). Disabled elements use reduced opacity.
- **Typography:** system font stack; logo ~2.5rem bold, subtitles ~1rem muted, body ~1rem.
- **Interaction quality:** subtle hover lift (`translateY(-2px)`), smooth `0.2s` transitions, clear focus outlines, disabled states with `not-allowed` cursor, modal overlay with backdrop dimming.

---

# Next Immediate Task

Implement the **Game Screen** (the page rendered at `/game`).

This is the screen that players see during an active game. It should be built as a new page (or set of components) that receives the players created on the Create Game screen and presents them in a tracking-friendly layout. For this first iteration, focus on the UI shell and structure only — no betting math, no pot calculations, no winner logic. Keep the same premium dark design language and routing pattern already established.
