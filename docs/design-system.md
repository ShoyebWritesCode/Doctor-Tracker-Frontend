# Doctor Tracker Design System

Status: accepted foundation

Doctor Tracker is an operations product, not a marketing site. The design language prioritizes legibility, predictable interaction, and useful information density over decoration.

## Principles

1. **Calm utility.** Warm neutral surfaces, dark ink, and one restrained teal action color.
2. **Hierarchy through structure.** Borders, spacing, alignment, and typography do more work than shadows or cards.
3. **Data first.** Tables and record lists remain the primary information surfaces; charts answer specific questions.
4. **Responsive by prioritization.** Desktop tables become purpose-built mobile record lists rather than horizontally compressed tables.
5. **Accessible by construction.** Controls have visible labels, 44 px targets, strong focus, semantic states, and reduced-motion behavior.

## Visual tokens

Tokens live in `src/app/globals.css` and are mapped into Tailwind utilities.

- Canvas: warm green-gray `#f4f6f3`.
- Primary surface: `#fcfdfb`; raised surface: white.
- Ink: `#15201e`; secondary text: `#4d5c58`.
- Primary action: deep teal `#0a655e`; hover: `#084f4a`.
- Danger: muted brick red `#a53636`.
- Success: forest green `#256846`; warning: ochre `#835d0d`.
- Default border: `#d4dcd8`; strong border: `#aebbb6`.
- Controls use an 8 px radius; panels use 10 px.
- The single panel shadow is intentionally quiet and reserved for overlays/raised surfaces.
- Typography uses the operating system's variable UI sans where available, with stable system fallbacks.
- Numeric data uses tabular figures.

## Content density

- Base spacing rhythm: 4/8 px increments.
- Minimum interactive height: 44 px.
- Desktop page content max width: approximately 1440 px.
- Table rows target 52-60 px depending on secondary content.
- Pills are reserved for statuses and compact filter tokens.
- Sentence case is used throughout.

## Explicit exclusions

No gradients, glass effects, glowing borders, floating blobs, oversized hero copy, stock clinical photography, emoji, arbitrary dashboard cards, decorative charts, or invented metrics. Component primitives are restyled and composed for this product rather than displayed with library defaults.

## Screen wireframes

### Login

```text
Desktop                                    Mobile
┌──────────────────────────────────────┐   ┌────────────────────┐
│ Doctor Tracker      ┌──────────────┐ │   │ Doctor Tracker     │
│ Secure admin work   │ Sign in      │ │   │                    │
│ Short purpose copy  │ Email        │ │   │ Sign in            │
│                     │ Password     │ │   │ Email              │
│                     │ [ Continue ] │ │   │ Password           │
│                     └──────────────┘ │   │ [ Continue ]       │
└──────────────────────────────────────┘   └────────────────────┘
```

### Dashboard

```text
┌──────────┬────────────────────────────────────────────────────┐
│ Nav      │ Dashboard                         [Date range ▾]   │
│          │ Total doctors  Total patients  New  Average        │
│          ├──────────────────────────────┬─────────────────────┤
│          │ Patients over time           │ Patients by doctor  │
│          │ ─── chart + text summary     │ horizontal ranking  │
│          ├──────────────────────────────┴─────────────────────┤
│          │ Operational context / no invented activity feed   │
└──────────┴────────────────────────────────────────────────────┘
```

On mobile, metrics form a two-column summary, charts stack, and navigation moves to a drawer.

### Doctors

```text
┌──────────┬────────────────────────────────────────────────────┐
│ Nav      │ Doctors                              [Add doctor]  │
│          │ [Search…………] [Specialization ▾] [Hospital ▾]      │
│          │ Doctor | Specialty | Hospital | Patients | Added  │
│          │ rows…                                      pages  │
└──────────┴────────────────────────────────────────────────────┘
```

Mobile records prioritize doctor name, specialty, hospital, and patient count; secondary contact and actions remain reachable without horizontal scrolling.

### Doctor detail

```text
┌──────────┬────────────────────────────────────────────────────┐
│ Nav      │ ← Doctors / Dr. name                               │
│          │ Identity + contact (compact, not a profile hero)   │
│          ├────────────────────────────────────────────────────┤
│          │ Patients               [Search……] [Add patient]    │
│          │ Patient records / filters / pagination             │
└──────────┴────────────────────────────────────────────────────┘
```

### Patients

```text
┌──────────┬────────────────────────────────────────────────────┐
│ Nav      │ Patients                                           │
│          │ [Search……] [Doctor ▾] [Condition ▾] [Status ▾]    │
│          │ Patient | Doctor | Condition | Status | Last visit │
│          │ rows…                                      pages  │
└──────────┴────────────────────────────────────────────────────┘
```

## Component ownership

The project owns visual components under `src/components`. Radix supplies behavior for difficult primitives such as focus-trapped dialogs, menus, select, checkbox, tooltip, and toast; it does not dictate appearance. Feature code must use the shared primitives rather than introduce isolated colors, radii, focus rings, or overlay patterns.

## Responsive review widths

- 360 px: compact phone baseline.
- 768 px: tablet and mobile navigation transition.
- 1024 px: compact desktop.
- 1440 px: full operations workspace.

Every screen is also checked with long names, empty data, API errors, slow loading, keyboard-only navigation, and reduced motion.
