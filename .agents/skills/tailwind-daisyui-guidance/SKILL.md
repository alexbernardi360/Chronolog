---
name: tailwind-daisyui-guidance
description: Guidance for using Tailwind CSS v4 together with daisyUI, avoiding old Tailwind versions and UI hallucinations.
metadata:
  version: 1.0.0
  source: local
---

# Tailwind CSS v4 + daisyUI guidance

This skill exists to ensure the agent uses the latest Tailwind CSS v4 and relies on daisyUI for UI components and styling. Tailwind CSS should only be used for layout, spacing, and utility-level adjustments when daisyUI cannot cover a need.

## Core rules

1. Use only Tailwind CSS v4. Do not use or suggest older Tailwind versions such as v3 or below.
2. Do not invent Tailwind CSS v4 features that do not exist. If unsure, use daisyUI component classes instead.
3. Use daisyUI for UI components, buttons, forms, cards, alerts, navbar, modals, badges, tabs, and other interface elements.
4. Use Tailwind CSS utilities only for layout, spacing, alignment, flex/grid structure, responsive wrappers, and minor custom adjustments.
5. Prefer daisyUI class names for colors and theme-aware styling (`btn`, `input`, `card`, `badge`, `menu`, `dropdown`, etc.).
6. Avoid building full UI layouts with raw Tailwind component styling when daisyUI already provides a matching component.
7. If a design need cannot be satisfied by daisyUI, then use Tailwind utilities sparingly and only for the specific layout behavior or spacing requirement.
8. Do not use a `tailwind.config.js` file in Tailwind CSS v4 examples. Prefer `@import "tailwindcss";` and `@plugin "daisyui";` in the CSS file.
9. Do not mix daisyUI and Tailwind in a way that creates confusion between component semantics and utility-only layout helpers.

## Allowed usage patterns

- `class="btn btn-primary"` for buttons.
- `class="card bg-base-100 shadow-xl"` for cards.
- `class="grid grid-cols-1 md:grid-cols-2 gap-4"` for layout wrappers.
- `class="flex flex-col gap-6"` for spacing and responsive container structure.
- `class="mx-auto max-w-5xl px-4 sm:px-6"` for page layout and centering.
- `class="btn btn-secondary w-full"` when the component is a daisyUI button.

## Discouraged usage patterns

- `class="bg-blue-500 text-white rounded-xl px-6 py-3"` for a button when `btn` / `btn-primary` is available.
- `class="shadow-lg p-6 rounded-3xl"` to create a full card instead of using `card`.
- `class="text-gray-800 bg-gray-200"` for theme-aware color styling when daisyUI semantic colors exist.
- Using Tailwind utility classes to replace daisyUI component structure unless the component does not exist.

## Installation and CSS setup

Use the following CSS setup for Tailwind v4 + daisyUI:

```css
@import "tailwindcss";
@plugin "daisyui";
```

If you need custom daisyUI configuration, add it using `@plugin "daisyui" { ... }`.

## When to choose daisyUI vs Tailwind utilities

- Choose daisyUI for: buttons, alerts, badges, cards, forms, tabs, dropdowns, menus, modals, toast, avatar, progress, tooltip.
- Choose Tailwind utilities for: layout containers, responsive grids, spacing, alignment, width/height, flex behavior, and small overrides.

## Checking for hallucinations

- Always verify that the Tailwind version referenced is v4.
- Avoid suggestions that mention `tailwind.config.js` or older Tailwind v3 conventions.
- If suggesting component markup, favor daisyUI classes and only use Tailwind utilities where necessary for layout.

## Example guidance

- Correct: "Use a daisyUI `card` for the panel and apply `grid grid-cols-1 md:grid-cols-2 gap-6` for the layout wrapper."
- Incorrect: "Build the UI with raw Tailwind color utilities and custom button styling without daisyUI."

This skill is written for English-language behavior and should be used to keep UI generation aligned with daisyUI-first design and Tailwind v4 layout utilities only.
