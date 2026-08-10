# SCH Hub Frontend - Modular Project Structure

## Overview
This document outlines the modular and scalable architecture of the SCH Hub frontend project.

## Directory Structure

### `/types`
Centralized location for all TypeScript interfaces and type definitions.

**Files:**
- `auth.ts` - Authentication and registration related types
  - `SchoolType` - School entity interface
  - `FacultyType` - Faculty entity interface
  - `DepartmentType` - Department entity interface
  - `RegistrationFormData` - Registration form state interface
  - `RegistrationStep` - Type for registration steps
- `icons.ts` - Icon imports
- `images.ts` - Image imports

**Convention:** One type file per feature/domain (e.g., `auth.ts`, `marketplace.ts`, `community.ts`)

---

### `/lib`
Utility functions and service modules used across the application.

**Files:**
- `api-client.ts` - Centralized API client
  - Single instance: `apiClient`
  - Methods:
    - `getSchools()` - Fetch all schools
    - `getFaculties(schoolId)` - Fetch faculties by school
    - `getDepartments(facultyId)` - Fetch departments by faculty
    - `register()` - Register new user
    - `login()` - Login user
  - Handles: API URL from env, request/response formatting, error handling
- `biometrics.ts` - Biometric authentication utilities

**Convention:** One module per service/utility (e.g., `api-client.ts`, `storage.ts`, `validators.ts`)

**Usage:**
```typescript
import { apiClient } from "@/lib/api-client";

const schools = await apiClient.getSchools();
```

---

### `/components`

#### `/components/ui`
Low-level, reusable UI components with no business logic.

**Files:**
- `LoadingSkeleton.tsx` - Loading placeholder skeleton
  - Props: `count`, `height`
- `ErrorMessage.tsx` - Error alert component
  - Props: `message`

**Convention:** Presentational components, no state management, pure props-based rendering

**Usage:**
```typescript
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

<LoadingSkeleton count={3} height="h-16" />
<ErrorMessage message="Failed to load data" />
```

---

#### `/components/shared`
Feature-specific components that are shared across multiple pages/features.

**Files:**
- `ProgressDots.tsx` - Registration progress indicator
  - Props: `currentStep`
- `SearchInput.tsx` - Reusable search input
  - Props: `placeholder`, `value`, `onChange`
- `SelectionList.tsx` - Reusable item selection list
  - Props: `items`, `selectedId`, `onSelect`, `filterQuery`, `isLoading`

**Convention:** Components that appear in multiple pages, handle common logic

**Usage:**
```typescript
import { ProgressDots } from "@/components/shared/ProgressDots";
import { SelectionList } from "@/components/shared/SelectionList";

<ProgressDots currentStep="faculty" />
<SelectionList 
  items={...} 
  selectedId={...} 
  onSelect={...} 
  filterQuery={...} 
  isLoading={...} 
/>
```

---

### `/app`
Next.js app directory with page components.

**Structure:**
```
/app
  /register
    page.tsx - Registration page (uses modular components and api-client)
  /login
    page.tsx - Login page
  /dashboard
    page.tsx - Dashboard
```

**Convention:** Pages import from `/components` and `/lib` only, no business logic inline

---

## Data Flow Architecture

```
Page Component (page.tsx)
    ↓
imports from:
    ├── @/lib/api-client (for API calls)
    ├── @/components/shared/* (for UI components)
    ├── @/components/ui/* (for base UI)
    └── @/types/auth (for types)
    ↓
API Client
    ↓
Environment Variables (.env)
    ├── NEXT_PUBLIC_API_URL
    └── AUTH_COOKIE_NAME
```

---

## Environment Variables

**File:** `.env`

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
AUTH_COOKIE_NAME=accessToken
```

**Usage in code:**
```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
```

---

## How to Add New Features

### 1. Add Types
File: `/types/[feature].ts`
```typescript
export interface NewEntity {
  id: string;
  name: string;
}

export interface NewFormData {
  field1: string;
  field2: string;
}
```

### 2. Add API Methods
File: `/lib/api-client.ts`
```typescript
async getNewData(): Promise<NewEntity[]> {
  return this.request<NewEntity[]>("/endpoint");
}

async createNewData(data: NewFormData): Promise<any> {
  return this.request("/endpoint", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

### 3. Create Shared Components (if reusable)
File: `/components/shared/[ComponentName].tsx`
- Keep component focused on single responsibility
- Accept all needed data via props
- Export component and types

### 4. Create UI Components (if low-level)
File: `/components/ui/[ComponentName].tsx`
- Pure presentational components
- No API calls or business logic
- Minimal props, maximum reusability

### 5. Use in Pages
File: `/app/[feature]/page.tsx`
```typescript
import { apiClient } from "@/lib/api-client";
import { YourComponent } from "@/components/shared/YourComponent";
import type { YourType } from "@/types/[feature]";

export default function Page() {
  // Component logic using modular imports
}
```

---

## Best Practices

1. **Single Responsibility:** Each file/component does one thing well
2. **Props-Based:** Pass data via props, not context (except for auth)
3. **Reusability:** If used in 2+ places, extract to `/components/shared`
4. **Types First:** Define types before implementation
5. **Environment-Safe:** Use env variables for configuration
6. **Clean Imports:** Use `@/` alias for absolute imports

---

## Benefits of This Structure

✅ **Scalability:** Easy to add new features without modifying existing code
✅ **Maintainability:** Clear separation of concerns
✅ **Reusability:** Components and functions shared across pages
✅ **Testing:** Modular structure makes unit testing easier
✅ **Team Collaboration:** Clear conventions for new developers
✅ **Performance:** Easier to optimize and lazy-load components

---

## Migration Guide: Old → New

### Before (Inline everything)
```typescript
// app/page.tsx
const API_URL = "http://localhost:3000/api/v1";

export default function Page() {
  const [schools, setSchools] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/schools`)
      .then(res => res.json())
      .then(data => setSchools(data));
  }, []);
  
  return <div>{/* inline JSX */}</div>;
}
```

### After (Modular)
```typescript
// app/page.tsx
import { apiClient } from "@/lib/api-client";
import { MyComponent } from "@/components/shared/MyComponent";
import type { SchoolType } from "@/types/auth";

export default function Page() {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  
  useEffect(() => {
    apiClient.getSchools().then(setSchools);
  }, []);
  
  return <MyComponent schools={schools} />;
}
```

---

## File Naming Conventions

- **Components:** PascalCase (e.g., `ProgressDots.tsx`)
- **Types:** PascalCase interfaces, camelCase file (e.g., `auth.ts`)
- **Functions:** camelCase (e.g., `getSchools`)
- **Constants:** UPPER_SNAKE_CASE
- **Files/Folders:** kebab-case for directories, specific naming for files

