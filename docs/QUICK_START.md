# Quick Start - Modular Architecture

## Import Patterns

### Types
```typescript
import type { SchoolType, FacultyType, DepartmentType } from "@/types/auth";
```

### API Client
```typescript
import { apiClient } from "@/lib/api-client";

// Usage
const schools = await apiClient.getSchools();
const faculties = await apiClient.getFaculties(schoolId);
```

### UI Components
```typescript
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

// Usage
<ErrorMessage message="Failed to load" />
<LoadingSkeleton count={3} height="h-16" />
```

### Shared Components
```typescript
import { ProgressDots } from "@/components/shared/ProgressDots";
import { SearchInput } from "@/components/shared/SearchInput";
import { SelectionList } from "@/components/shared/SelectionList";

// Usage
<ProgressDots currentStep="faculty" />
<SearchInput placeholder="Search..." value={q} onChange={setQ} />
<SelectionList items={items} selectedId={id} onSelect={setId} filterQuery={q} isLoading={loading} />
```

---

## Common Patterns

### Fetching Data
```typescript
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetch = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getData();
      setData(result);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  
  fetch();
}, [dependency]);
```

### Handling Errors
```typescript
{error && <ErrorMessage message={error} />}

{loading ? (
  <LoadingSkeleton />
) : (
  <YourComponent />
)}
```

### Selection List
```typescript
<SelectionList
  items={items.map(item => ({
    id: item.id,
    name: item.name,
    code: item.code,
    icon: <MdIcon className="w-8 h-8" />,
  }))}
  selectedId={selected?.id || null}
  onSelect={id => {
    const item = items.find(i => i.id === id);
    setSelected(item);
  }}
  filterQuery={searchQuery}
  isLoading={loading}
/>
```

---

## Adding New API Endpoints

Edit `/lib/api-client.ts`:

```typescript
// Add method to ApiClient class
async getNewData(id: string): Promise<NewType[]> {
  return this.request<NewType[]>(`/new-endpoint/${id}`);
}
```

Use in component:
```typescript
const data = await apiClient.getNewData(id);
```

---

## Creating New Shared Component

1. Create file: `/components/shared/ComponentName.tsx`
   ```typescript
   interface ComponentNameProps {
     prop1: string;
     prop2: () => void;
   }
   
   export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
     return <div>...</div>;
   }
   ```

2. Import in page:
   ```typescript
   import { ComponentName } from "@/components/shared/ComponentName";
   
   <ComponentName prop1="value" prop2={handleClick} />
   ```

---

## Creating New UI Component

1. Create file: `/components/ui/ComponentName.tsx`
   ```typescript
   interface ComponentNameProps {
     text: string;
     variant?: "primary" | "secondary";
   }
   
   export function ComponentName({ text, variant = "primary" }: ComponentNameProps) {
     return <button className={`btn-${variant}`}>{text}</button>;
   }
   ```

2. Import everywhere:
   ```typescript
   import { ComponentName } from "@/components/ui/ComponentName";
   ```

---

## Creating New Type File

1. Create file: `/types/feature-name.ts`
   ```typescript
   export interface Entity {
     id: string;
     name: string;
   }
   
   export interface FormData {
     field1: string;
     field2: string;
   }
   ```

2. Import in pages and components:
   ```typescript
   import type { Entity, FormData } from "@/types/feature-name";
   ```

---

## File Naming

- **Pages:** `/app/[feature]/page.tsx`
- **Types:** `/types/[domain].ts` (e.g., `auth.ts`, `marketplace.ts`)
- **Components:** `/components/[category]/ComponentName.tsx`
- **Utilities:** `/lib/[utility].ts` (e.g., `api-client.ts`, `validators.ts`)

---

## Don't

❌ Don't hardcode API URLs in components
❌ Don't create inline components for every page
❌ Don't mix types with component files
❌ Don't fetch data without error handling
❌ Don't use different patterns across pages

## Do

✅ Use `apiClient` from `/lib/api-client.ts`
✅ Create shared components in `/components/shared/`
✅ Define types in `/types/` folder
✅ Always handle loading and error states
✅ Follow consistent patterns across codebase

