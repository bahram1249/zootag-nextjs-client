# AGENTS.md

This file provides guidance for AI agents working on the Zootag Next.js client.

## Build, Lint, and Test Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint (ESLint)
npm run lint
```

## Project Structure

```
src/
├── app/                    # App Router pages and layouts
│   ├── globals.css         # Global Tailwind v4 styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Shared React components
├── lib/                    # Utility functions, API client, types
└── hooks/                  # Custom React hooks
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Linting**: ESLint 9 with `eslint-config-next`

## Code Style Guidelines

### Imports

- React/Next.js imports first, then third-party, then internal
- Use `@/` path alias for all internal imports (e.g., `@/components/Button`)
- Group imports with blank lines between groups

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/Button';
import { apiClient } from '@/lib/api-client';
```

### Components

- Use functional components with TypeScript
- Define props as TypeScript interfaces or types
- Use default exports for page components, named exports for shared components
- Place shared components in `src/components/`
- Use Server Components by default; add `'use client'` only when browser APIs or hooks are needed

```typescript
// src/components/Button.tsx
interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className="..." onClick={onClick}>
      {label}
    </button>
  );
}
```

### API Integration

- API calls go in `src/lib/api-client.ts` or similar service files
- Use fetch with proper error handling
- API base URL should come from environment variable `NEXT_PUBLIC_API_URL`

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchData<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

### Naming Conventions

- **Pages**: kebab-case directories (e.g., `src/app/admin/users/`)
- **Components**: PascalCase files (e.g., `UserList.tsx`, `Button.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`, `usePagination.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`, `api-client.ts`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`, `ApiResponse<T>`)

## Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## UI Component Library — `src/components/ui/`

A cohesive set of UI components with modern design. Import from `@/components/ui`:

```typescript
import { Input, Textarea, Select, Badge, PersianDatePicker } from '@/components/ui';
```

### Design Tokens

Defined in `src/app/globals.css` via `@theme inline`:

| Token                | Light                  | Dark                    |
| -------------------- | ---------------------- | ----------------------- |
| `--color-primary`    | `indigo-600`           | `indigo-400`            |
| `--color-success`    | `emerald-600`          | `emerald-400`           |
| `--color-warning`    | `amber-600`            | `amber-400`             |
| `--color-danger`     | `red-600`              | `red-400`               |
| `--color-info`       | `sky-600`              | `sky-400`               |
| `--color-surface`    | `white`                | `zinc-900`              |
| `--color-border`     | `zinc-200`             | `zinc-700`              |
| `--color-muted`      | `zinc-500`             | `zinc-400`              |

### Input — `input.tsx`

Text input with label, icon support, error/helper text.

```typescript
<Input label="Username" placeholder="Enter name" error="Required" />
<Input label="Email" leftIcon={<MailIcon />} helperText="We never share your email" />
```

Props: extends `InputHTMLAttributes`, adds `label`, `error`, `helperText`, `leftIcon`, `rightIcon`.

### Textarea — `textarea.tsx`

Multi-line text input with label and error/helper text.

```typescript
<Textarea label="Description" rows={4} placeholder="Write here..." />
```

Props: extends `TextareaHTMLAttributes`, adds `label`, `error`, `helperText`.

### Select — `select.tsx`

Dropdown select with custom chevron, label, error/helper text.

```typescript
<Select
  label="Category"
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
  ]}
  placeholder="Choose..."
/>
```

Props: extends `SelectHTMLAttributes`, adds `label`, `error`, `helperText`, `options: {value, label}[]`, `placeholder`.

### Badge — `badge.tsx`

Versatile badge with variants, sizes, icon support, and outline mode.

| Prop         | Values                                           |
| ------------ | ------------------------------------------------ |
| `variant`    | `default`, `primary`, `success`, `warning`, `danger`, `info` |
| `size`       | `sm`, `md`, `lg`                                 |
| `outline`    | `true` / `false`                                 |
| `icon`       | React node placed left or right                  |
| `iconPosition` | `left` (default), `right`                      |

```typescript
<Badge>Default</Badge>
<Badge variant="primary" size="sm">Active</Badge>
<Badge variant="success" icon={<CheckIcon />}>Verified</Badge>
<Badge variant="danger" outline>Inactive</Badge>
```

### PersianDatePicker — `persian-date-picker.tsx`

A Persian (Jalali) calendar date picker. Built with the `persian-date` npm package.

- Click the input to open the calendar popover
- Navigate months/years with arrow buttons
- "Today" button for quick reset
- Displays selected date in Persian digits

**Output via `onChange`** — receives an object with three formats:

```typescript
interface PersianDatePickerValue {
  persianDate: string;   // "1403-02-15" (Jalali)
  gregorianDate: string; // "2024-05-04" (Gregorian)
  isoDate: string;       // "2024-05-04T00:00:00.000Z" (ISO)
}
```

Usage:

```typescript
<PersianDatePicker
  label="تاریخ تولد"
  value={selectedDate}
  onChange={(val) => {
    console.log(val.persianDate);   // "1403-02-15"
    console.log(val.gregorianDate); // "2024-05-04"
    console.log(val.isoDate);       // "2024-05-04T00:00:00.000Z"
  }}
  error={errors.birthDate}
/>
```

Props: `label`, `value` (Date), `onChange`, `error`, `helperText`, `placeholder`, `disabled`.

## Backend Reference

See the root [AGENTS.md](../AGENTS.md) for backend API structure and the NestJS monorepo patterns in [zootag-nestjs-api/](../zootag-nestjs-api/).

## Note on Next.js Versions

This project uses Next.js 16. The `create-next-app` generator may include version-specific documentation in `node_modules/next/dist/docs/`. Refer to those guides for any API changes or deprecations.
