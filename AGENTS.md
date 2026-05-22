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

## Backend Reference

See the root [AGENTS.md](../AGENTS.md) for backend API structure and the NestJS monorepo patterns in [zootag-nestjs-api/](../zootag-nestjs-api/).

## Note on Next.js Versions

This project uses Next.js 16. The `create-next-app` generator may include version-specific documentation in `node_modules/next/dist/docs/`. Refer to those guides for any API changes or deprecations.
