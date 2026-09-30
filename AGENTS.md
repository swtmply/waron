# Working on Waron

Follow [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for every UI change. The Figma
reference, palette, component choices, spacing, and URL state rules live there.

- Keep changes local and follow existing implementations. Use YAGNI; avoid new
  abstractions, dependencies, and features that the request does not need.
- Explain implementation decisions briefly and challenge requests when a simpler
  solution or an existing constraint matters.
- Use Tailwind utilities. Do not add custom CSS properties, inline styles, or
  bespoke CSS rules. Update the existing shadcn theme aliases only when necessary.
- Inspect installed shadcn components and their official documentation before
  building UI. This project uses Base UI, the `render` prop, and Hugeicons.
- Keep navigable UI state in validated search query params. Reuse
  `useDashboardSearch`; preserve the sidebar when navigating between views.
- Use React 19 form actions with `useActionState` for async form submissions.
  Vite runs the React Compiler; prefer direct render calculations over manual
  memoization unless stable identity is part of an external API contract.
- Infer and reuse TypeScript types. Avoid `any` and unnecessary `as` assertions;
  use discriminated unions when the data has different shapes.
- Do not add tests unless explicitly asked. Verify with the existing type check,
  lint, build, and focused browser checks.
- When using Argent, use a Luna Max subagent to run its commands.
