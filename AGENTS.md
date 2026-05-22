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

Required variables — add to `.env.local`:

```env
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3000

The API client uses this value as-is (no `/api` suffix appended). Include the full versioned path in every request, e.g. `/v1/api/zootag/admin/manufacturers`.

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

## API Client — `src/lib/api-client.ts`

A typed fetch wrapper matching the NestJS backend's JSON response format. Import the singleton:

```typescript
import { apiClient, ApiError } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/lib/api-types';
```

### Response Envelope

Every backend response follows this envelope:

```typescript
interface ApiSuccessResponse<T> {
  statusCode: number;
  reqId: string;
  message: string;
  result: T;            // single object or array
  timestamp: string;
  path: string;
  total?: number;       // present on paginated list endpoints
}
```

### Methods

| Method | Signature                                           |
| ------ | --------------------------------------------------- |
| `get`  | `get<T>(path, params?, signal?)`                    |
| `post` | `post<T>(path, body?, signal?)`                     |
| `put`  | `put<T>(path, body?, signal?)`                      |
| `delete` | `delete<T>(path, signal?)`                        |

All methods return `Promise<ApiSuccessResponse<T>>`. The `path` must include the full versioned route (e.g., `'/v1/api/zootag/admin/manufacturers'`). `params` is serialized as flat query string by default (e.g., `{ limit: 10, offset: 0 }` → `?limit=10&offset=0`). Objects passed as `filter` use deep object notation (`filter[key]=value`) — but prefer flat params since the backend `ListFilter` DTO expects them at the top level.

### Authentication (low-level)

```typescript
import { apiClient } from '@/lib/api-client';

// After login
apiClient.setToken(jwtToken);

// Clear on logout
apiClient.clearToken();
```

The token is sent as `Authorization: Bearer <token>` on every request.

## Auth System — `src/lib/auth.ts` + `src/contexts/auth-context.tsx`

Complete auth solution for both SSR and CSR, matching the NestJS backend at `/v1/api/core/auth/*`.

### Backend Auth Endpoints

| Method | Path                           | Description               |
| ------ | ------------------------------ | ------------------------- |
| POST   | `/v1/api/core/auth/signup`     | Register new user         |
| POST   | `/v1/api/core/auth/signin`     | Login                     |
| POST   | `/v1/api/core/auth/refresh`    | Rotate tokens             |
| POST   | `/v1/api/core/auth/logout`     | Revoke current session    |
| GET    | `/v1/api/core/auth/sessions`   | List active sessions      |
| DELETE | `/v1/api/core/auth/sessions/:id` | Revoke specific session |

### Auth Response (from signin / signup / refresh)

```typescript
interface AuthResponse {
  access_token: string;            // JWT (Bearer)
  expires_in: number;              // seconds (default 900 = 15min)
  expires_at: string;              // ISO timestamp
  refresh_token: string;           // raw refresh token
  refresh_token_expires_at: string; // ISO timestamp (default 7 days)
  session_id: number;              // CoreSession DB id
}
```

### CSR Usage — `useAuth()` hook

Wrap the app with `AuthProvider`, then use `useAuth()` in client components:

```tsx
// app/layout.tsx
import { AuthProvider } from '@/contexts/auth-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

```tsx
'use client';
import { useAuth } from '@/contexts/auth-context';

function LoginPage() {
  const { signin, isAuthenticated, isLoading } = useAuth();
  // ...
  await signin(username, password);
}
```

Available from `useAuth()`:

| Method            | Returns                              | Description                    |
| ----------------- | -----------------------------------  | ------------------------------ |
| `signin`          | `Promise<AuthResponse>`              | Login + store tokens           |
| `signup`          | `Promise<AuthResponse>`              | Register + store tokens        |
| `logout`          | `Promise<void>`                      | Logout + clear tokens          |
| `refreshSession`  | `Promise<AuthResponse \| null>`      | Refresh access token           |
| `getToken`        | `string \| null`                     | Current access token           |
| `isAuthenticated` | `boolean`                            | Whether token exists           |
| `isLoading`       | `boolean`                            | True while restoring on mount  |

### SSR Protection — `proxy.ts`

Next.js 16 proxy (replaces middleware) checks the `access_token` cookie and redirects unauthenticated requests to `/login`:

```typescript
const publicPaths = ['/login', '/signup', '/api/auth/refresh'];
```

### Token Refresh

**CSR path** — tokens are stored in cookies. `refreshSession()` reads them and calls `/v1/api/core/auth/refresh`, then stores new tokens.

**SSR path** — the `/api/auth/refresh` Next.js API route reads tokens from headers (passed by CSR) and refreshes through the backend, setting new httpOnly cookies.

### Storage Strategy

| Cookie           | Type         | Purpose                          |
| ---------------- | ------------ | -------------------------------- |
| `access_token`   | non-httpOnly | Bearer token for API calls       |
| `refresh_token`  | non-httpOnly | Used to refresh access token     |
| `session_id`     | non-httpOnly | Required for token refresh       |

### Standalone Auth Functions

```typescript
import { signin, signup, logout, refreshTokens, fetchSessions, checkUsername } from '@/lib/auth';

await signin({ username: 'admin', password: 'secret' });
await signup({ username: 'newuser', password: 'secret' });
await logout();
await refreshTokens({ refresh_token: '...', sessionId: 1 });
const sessions = await fetchSessions();
const isAvailable = await checkUsername('admin');
```

### Error Handling

On non-2xx responses, the client throws an `ApiError`:

```typescript
import { ApiError } from '@/lib/api-client';

try {
  const res = await apiClient.get<Manufacturer[]>('/v1/api/zootag/admin/manufacturers');
  // res.result is typed as Manufacturer[]
  // res.total is the count
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.statusCode); // 404, 400, etc.
    console.error(error.message);    // "Manufacturer not found"
    console.error(error.errors);     // ["Manufacturer not found"]
  }
}
```

### Usage Examples

```typescript
// Fetch paginated list — flat params (NOT under filter)
const { result, total } = await apiClient.get<DeviceType[]>('/v1/api/zootag/admin/deviceTypes', {
  limit: 10, offset: 0, search: 'GPS',
});
```

## Menus Endpoint

`GET /v1/api/core/user/menus` — returns the menu tree for the current authenticated user based on their roles/permissions.

**Parameters**: pass flat query params (NOT nested under `filter`):

```typescript
// Correct — flat params
apiClient.get<MenuNode[]>('/v1/api/core/user/menus', { ignorePaging: true });

// Wrong — do NOT use filter object for this endpoint
apiClient.get<MenuNode[]>('/v1/api/core/user/menus', { filter: { ignorePaging: true } });
```

The response is an array of `MenuNode` objects with recursive `subMenus`.

## CRUD Architecture

Every admin page that has full CRUD (POST/PUT/DELETE) from the backend follows a consistent pattern:

### Components

| Component | Purpose |
|---|---|
| `CrudModal` | Modal dialog with form for create/edit |
| `ConfirmDialog` | Modal dialog for delete confirmation |
| `LookupDialog` | Searchable, paginated modal with mini DataTable for FK entity lookup. Header has `افزودن` button for inline CRUD. Each row has one `انتخاب` button (no edit/delete) |
| `DataTable` | Server-side paginated table (list view) |

All are imported from `@/components/ui`.

### Page Pattern (simple entity with no FK)

```tsx
import { useState } from 'react';
import { DataTable, CrudModal, ConfirmDialog } from '@/components/ui';
import type { Column, FieldDef } from '@/components/ui';
import { apiClient, ApiError } from '@/lib/api-client';

interface Entity { id: number; /* ...fields */ }

const modalFields: FieldDef[] = [
  { name: 'fieldName', label: 'Field Label', type: 'string', required: true },
];

export default function EntityPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<Entity | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Entity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // ... handlers ...
  return (
    <div>
      <button onClick={handleCreate}>افزودن</button>
      <DataTable key={refreshKey} ... />
      <CrudModal ... />
      <ConfirmDialog ... />
    </div>
  );
}
```

### FieldDef Type

```typescript
interface FieldDef {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  minLength?: number;
  maxLength?: number;
}
```

**Important**: `type: 'date'` fields render the `PersianDatePicker` component (Jalali calendar), NOT a native `<input type="date">`. The value stored is the `isoDate` string from the picker (e.g., `"2026-01-15T00:00:00.000Z"`). The `initialValues` are converted from ISO string to `Date` object via a `toDate()` helper before being passed to the picker.

### FK Reference Handling

Two strategies for FK fields in create/edit forms:

1. **Status tables** (e.g. `DeviceStatus`, `ContractStatus`) — Use a `<select>` element rendered via `renderCustomField` prop on `CrudModal`. Options are fetched from the status endpoint (e.g. `/v1/api/zootag/admin/deviceStatuses`) when the modal opens.

2. **Regular entity lookups** (e.g. `Manufacturer`, `Company`, `Currency`, `DeviceType`) — Use `LookupDialog` opened via `renderCustomField`. The dialog shows a searchable, paginated mini DataTable with inline CRUD (`افزودن` button in header) for the lookup entity. Each row has a single "انتخاب" button — edit/delete icons are NOT shown in the lookup table. Selecting a row fills the FK field and closes the dialog.

#### Pattern for FK Lookups (example with manufacturerId):

```tsx
const lookupConfig: LookupConfig = {
  endpoint: '/v1/api/...', labelKey: 'name', valueKey: 'id',
  title: 'Title', columns: [...], formFields: [...],
};

// In page component state:
const [selectedLookupId, setSelectedLookupId] = useState<number | null>(null);
const [selectedLookupName, setSelectedLookupName] = useState('');
const [lookupOpen, setLookupOpen] = useState(false);
const pendingOnChangeRef = useRef<((v: unknown) => void) | null>(null);

// In renderCustomField:
if (field.name === 'fkFieldName') {
  return (
    <div>
      <input type="text" value={selectedLookupName} disabled />
      <button onClick={() => setLookupOpen(true)}>انتخاب</button>
      <button onClick={() => { setSelectedLookupId(null); setSelectedLookupName(''); }}>×</button>
    </div>
  );
}
```

#### Pattern for Status Select (example with deviceStatusId):

```tsx
useEffect(() => {
  if (!modalOpen) return;
  apiClient.get('/v1/api/.../deviceStatuses').then(({ result }) =>
    setStatusOptions(result.map(s => ({ value: s.id, label: s.name })))
  );
}, [modalOpen]);

// In renderCustomField:
if (field.name === 'deviceStatusId') {
  return (
    <select value={selectedStatusId ?? ''} onChange={...}>
      {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  );
}
```

### Pages Summary

| Page | Backend Endpoint | CRUD | FKs |
|---|---|---|---|
| Users | `/v1/api/core/admin/users` | Create/Edit (no DELETE) | roles (omitted) |
| Roles | `/v1/api/core/admin/roles` | Full | permissions (omitted) |
| Permissions | `/v1/api/core/admin/permissions` | Read-only | — |
| Permission Groups | `/v1/api/core/admin/permissionGroups` | Read-only | — |
| Menus | `/v1/api/core/admin/menus` | Create/Edit (no DELETE) | parentMenuId (omitted) |
| Manufacturers | `/v1/api/zootag/admin/manufacturers` | Full | — |
| Currencies | `/v1/api/zootag/admin/currencies` | Full | — |
| Companies | `/v1/api/zootag/admin/companies` | Full | — |
| Device Types | `/v1/api/zootag/admin/deviceTypes` | Full | manufacturerId (lookup) |
| Contracts | `/v1/api/zootag/admin/contracts` | Full | companyId (lookup), currencyId (lookup), contractStatusId (select) |
| Devices | `/v1/api/zootag/admin/devices` | Full | companyId (lookup), deviceTypeId (lookup), deviceStatusId (select) |

### Re-fetch After CRUD

The DataTable uses `key={refreshKey}` to force re-mount and re-fetch after any create/edit/delete. Increment `refreshKey` after successful API call. The LookupDialog also uses the same pattern internally (`key` through `refreshKey` state).

**Important**: Do NOT use `filter: { ... }` wrapper for pagination params. Send `limit`, `offset`, `search` as flat top-level keys. The backend `ListFilter` DTO expects them at the query root (e.g., `?limit=10&offset=0`), not nested under `filter`.

### Known Issues

- `roles` FK on Users and `permissions` FK on Roles omitted from forms (multi-select complex — manage via dedicated Role/Permission management pages)
- `parentMenuId` FK on Menus omitted (self-referencing — manage via direct DB or API)
- Pre-existing lint error in `src/components/ui/crud-modal.tsx:78` (setState-in-effect, not related to CRUD changes)
- Pre-existing lint warning in `src/components/ui/persian-date-picker.tsx:63` (setState-in-effect, not related to CRUD changes)

## Backend Reference

See the root [AGENTS.md](../AGENTS.md) for backend API structure and the NestJS monorepo patterns in [zootag-nestjs-api/](../zootag-nestjs-api/).

## Note on Next.js Versions

This project uses Next.js 16. The `create-next-app` generator may include version-specific documentation in `node_modules/next/dist/docs/`. Refer to those guides for any API changes or deprecations.
