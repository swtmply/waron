# Waron design system

Use the [Kliniko dashboard in Figma](https://www.figma.com/design/dPk87pg4uk6YFwltHnDTyW/Waron?node-id=10-632)
as the visual reference. The Patients screen implements the reference; the same
shell and components serve Dashboard, Calendar, Treatments, and Practitioners.
Use the real clinic records rather than copying Figma's example patient data.

## Palette

Use Tailwind's named colors through the existing shadcn aliases in
[`src/styles.css`](./src/styles.css). Do not duplicate hex or OKLCH values in
components or introduce custom CSS properties.

| Role                                | Tailwind color               | Existing semantic classes                             |
| ----------------------------------- | ---------------------------- | ----------------------------------------------------- |
| Primary actions, active tabs, focus | `teal-600`                   | `bg-primary`, `text-primary`, `ring-ring`             |
| Primary action text                 | `white`                      | `text-primary-foreground`                             |
| Secondary / selected background     | `teal-50`                    | `bg-secondary`, `bg-accent`                           |
| Secondary / selected foreground     | `teal-600`                   | `text-secondary-foreground`, `text-accent-foreground` |
| Main text / black                   | `neutral-900`                | `text-foreground`                                     |
| Surfaces / white                    | `white`                      | `bg-background`, `bg-card`, `bg-popover`              |
| Borders / light gray                | `neutral-300`                | `border-border`, `border-input`                       |
| Supporting text / gray              | `neutral-500`                | `text-muted-foreground`                               |
| Quiet surface tint                  | `neutral-300` at low opacity | `bg-muted/10`, `bg-muted/20`                          |

Secondary controls always pair a teal-50 background with teal-600 foreground.
Use the existing destructive variant for errors and destructive actions.
Practitioner calendar colors identify providers; preserve their existing
teal, blue, violet, and amber choices rather than using them for decorative UI.

## Type, spacing, and surfaces

- **Font:** the installed DM Sans Variable for body text and headings.
- **Page title / brand:** `text-xl font-semibold tracking-tight`.
- **Navigation / tabs:** `text-base font-medium`.
- **Table / controls:** `text-sm`; supporting labels use `text-xs`.
- **Spacing:** Tailwind's 4px scale. Prefer `gap-2`, `gap-4`, and `gap-6`.
- **Rounding:** `rounded-lg` for actions; `rounded-2xl` for search, filters,
  navigation highlights, and table containers. Avatars use `rounded-full`.
- **Surfaces:** white, light borders, and quiet gray tints. Avoid decorative
  gradients or large shadows. Keep table overflow horizontal on narrow screens.

## Shell and navigation

- Desktop sidebar: `w-66` (264px), collapsing to `w-18` (72px).
- Use the local shadcn `SidebarProvider`, `Sidebar`, header, content, groups,
  menus, and footer. The provider is controlled by URL state and uses no cookie.
- Place `SidebarTrigger` in the sidebar footer at the bottom left. Keep the
  mobile trigger fixed at `bottom-4 left-4`; mobile navigation uses a shadcn Sheet.
- Sidebar selection pairs `bg-sidebar-accent` with
  `text-sidebar-accent-foreground`. Use the matching Hugeicons with `currentColor`
  for navigation: selected icons are teal-600 and idle icons are neutral-900.
  Keep icon links labeled when collapsed.
- Header: white, bottom border, `p-4`, minimum height 76px. Put the title on the
  left, search in the middle when space permits, and the administrator control
  on the right.
- Main content: `p-4 pt-7`, with `gap-4` or `gap-6` between sections.
- Use brief titles and one clear primary action in each view.
- The Figma Treatments link opens the existing treatment-plan and installment
  screen at `/installments`; do not create another treatment workflow.

## Components

Before building a component, inspect `src/components/ui`, run
`bunx --bun shadcn@latest docs <component>`, and read the official documentation.
Add only missing components from the explicit `@shadcn` registry.
Do not overwrite existing components when adding dependencies.

| Need                           | Local shadcn component / pattern                                          |
| ------------------------------ | ------------------------------------------------------------------------- |
| Primary action                 | `Button`, default variant                                                 |
| Soft action / selected filter  | `Button variant="secondary"`                                              |
| Unselected dashed filter       | `Button variant="filter"`                                                 |
| Search with an icon            | `InputGroup`, `InputGroupAddon`, `InputGroupInput`                        |
| Patient view selection         | `Tabs`, `TabsList variant="line"`, `TabsTrigger`, `TabsContent`           |
| Radio filter / row actions     | `DropdownMenu`, with items inside a Group or RadioGroup                   |
| Patient / appointment lists    | `ClinicTable`, composing shadcn Table and TanStack Table                  |
| Initials                       | `Avatar` with `AvatarFallback`; patient rows use the small size           |
| Summary / practitioner surface | `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`               |
| Forms                          | `FieldGroup`, `Field`, `FieldLabel`, existing Input / Combobox / Textarea |
| Modal                          | `Dialog` with `DialogTitle` and `DialogDescription`                       |
| Failure / no results           | `Alert` / `Empty`                                                         |

Use `CardTitle variant="metric"` for dashboard summary numbers.

Use Base UI's `render` prop for link-backed controls, rather than Radix `asChild`.
When a `Button` renders a `Link`, set `nativeButton={false}`.
Use `cn` for conditional classes. Put visual variants in the local UI component;
use callsite classes for layout. Prefer native date inputs and existing native
selects when they already satisfy the workflow.

Search fields are 44px tall. Primary actions and icon buttons are 40px tall;
table headers are 48px tall and data rows use `px-4 py-3`. Keep names and avatars
together, metadata quiet, and row actions in a menu. A row can open the record,
but its name must also be a keyboard-accessible link.

Figma icons are saved in `public/icons`. Preserve their intrinsic dimensions
and use them in their original slots. Use the installed Hugeicons for additional
actions. Never reference expiring Figma URLs or use a screenshot as an app asset.

## URL state

The root route validates search params with `dashboardSearchSchema` in
[`src/lib/dashboard-search.ts`](./src/lib/dashboard-search.ts). Read and update
them with `useDashboardSearch`; do not mirror them into component state.

| Param              | Meaning                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `sidebar`          | `expanded` or `collapsed`; omitted defaults to open on desktop and closed on mobile |
| `q`                | Current view's search text; the header and table search share it                    |
| `tab`              | `active` for Active Treatments; omitted means All Patients                          |
| `treatment`        | Patient treatment filter                                                            |
| `practitionerId`   | Patient or treatment-plan practitioner filter                                       |
| `practitionerIds`  | Calendar's multiple practitioner selections                                         |
| `patientId`        | Treatment-plan patient filter                                                       |
| `week`             | Calendar date as `YYYY-MM-DD`; the calendar shows its Monday-based week             |
| `sort`, `order`    | Table column ID and `asc` / `desc`                                                  |
| `page`             | One-based table page; 20 rows per page                                              |
| `form`, `recordId` | Open create/edit/payment form and relevant record ID                                |

Merge updates with the previous search object. Remove optional params for
default values. Reset the page when search, sorting, filters, or tabs change.
Use history replacement for typing and preserve scroll. Discrete changes retain
browser history. Navigation between sections carries the sidebar preference and
clears section-specific filters. Reloads and browser Back/Forward restore the UI.

Keep unsaved form drafts, validation errors, saving flags, focus, and transient
menu state local. Do not put clinical notes, contact details, or unsaved payment
amounts in the URL. Active Treatments includes patients with scheduled visits
or outstanding treatment-plan balances; Last Visit uses completed visits only.

Verify affected screens at desktop and mobile widths, including collapse,
keyboard navigation, filters, and refresh. Run existing typecheck, lint, and
build commands; do not add tests unless Allen asks.
