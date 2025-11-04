# Next Session Quick Start

**Last Session**: 2025-11-04
**Current Phase**: Phase 7 - Production Workflow UX
**Completed**: Step 1 of 8 (FHIR Server Connection)

---

## What to Do Next

### Priority 1: Library Manager UI (Step 2)

**Goal**: Allow users to browse CQL libraries from Medplum FHIR server and upload local .cql files

**File to Create**: `client/src/components/library/LibraryManager.tsx`

**Key Features**:
1. Browse Library resources from Medplum (use connected FHIR server)
2. Upload local .cql files (drag & drop support)
3. Parse and validate CQL syntax
4. Display library metadata (name, version, dependencies)
5. Select library for execution
6. Show validation status

**Medplum API to Use**:
```typescript
// Search for libraries
GET https://api.medplum.com/fhir/R4/Library

// Get specific library
GET https://api.medplum.com/fhir/R4/Library/{id}

// Library resource structure
{
  "resourceType": "Library",
  "name": "DiabetesScreening",
  "version": "1.0.0",
  "status": "active",
  "content": [
    {
      "contentType": "text/cql",
      "data": "<base64-encoded-cql>"
    }
  ]
}
```

**Zustand Store Integration**:
```typescript
const {
  libraries,
  selectedLibrary,
  addLibrary,
  selectLibrary,
  removeLibrary,
} = useAppStore();
```

**UI Components Needed**:
- Card with "Browse FHIR Server" and "Upload File" tabs
- Library list with metadata cards
- File upload dropzone
- CQL syntax preview
- Validation status badge
- Select button to mark as active library

---

## Quick Commands

```bash
# Navigate to project
cd c:\Users\default.LAPTOP-BOBEDDVK\OneDrive\Documents\GitHub\FhirQueryConverter

# Check current status
git status

# Type check
npm run check

# Start dev server (Windows)
npx tsx server/index.ts
```

---

## Current State

### Files Created in Last Session
```
PHASE7_PLAN.md                                    # Full implementation plan
PHASE7_STATUS.md                                  # Detailed status document
NEXT_SESSION.md                                   # This file
client/src/store/app-store.ts                     # Zustand state management
client/src/components/wizard/StepperNav.tsx       # Navigation components
client/src/components/connections/FhirServerConnect.tsx  # Step 1 ✅
client/src/hooks/useMediaQuery.ts                 # Responsive hook
client/src/pages/workflow.tsx                     # Main workflow page
```

### Workflow Steps Status
1. ✅ **FHIR Connection** - Complete (FhirServerConnect.tsx)
2. 🔄 **Library Loading** - Next (LibraryManager.tsx to create)
3. ⏳ **Terminology Connection** - Pending
4. ⏳ **Execution Dashboard** - Pending
5. ⏳ **SQL Translation** - Pending
6. ⏳ **Database Connection** - Pending
7. ⏳ **Write-Back** - Pending
8. ⏳ **View Management** - Pending

### Environment Setup
```env
VITE_MEDPLUM_BASE_URL=https://api.medplum.com
VITE_MEDPLUM_PROJECT_ID=ad4dd83d-398c-4356-899f-c875901ceb0a
VITE_TERMINOLOGY_SERVER_URL=https://tx.fhir.org/r4
```

---

## Architecture Reminder

```
User Workflow:
├── workflow.tsx (Main orchestrator)
│   ├── StepperNav (Progress visualization)
│   ├── Step Content (Current step component)
│   └── StepNavigation (Back/Next buttons)
│
State Management (Zustand):
├── Workflow state (current step, completed steps)
├── FHIR server connection
├── CQL libraries ← NEXT: Populate this
├── Terminology server
├── Execution results
├── SQL translation
├── Database connection
└── View definitions
```

---

## Sample Code Pattern

When creating LibraryManager.tsx, follow this pattern:

```typescript
import { useState } from 'react';
import { MedplumClient } from '@medplum/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/app-store';
import { FileCode, Upload, Database } from 'lucide-react';

export function LibraryManager() {
  const {
    fhirServer,
    libraries,
    addLibrary,
    selectLibrary,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(false);

  const handleBrowseFhirServer = async () => {
    setIsLoading(true);
    try {
      const client = new MedplumClient({
        baseUrl: fhirServer.baseUrl,
      });

      // Search for Library resources
      const bundle = await client.search('Library');

      // Process libraries
      // ...
    } catch (error) {
      console.error('Failed to fetch libraries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    // Read file, parse CQL, add to store
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          Load CQL Libraries
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Two tabs: Browse FHIR | Upload File */}
        {/* Library list */}
        {/* Selected library preview */}
      </CardContent>
    </Card>
  );
}
```

---

## Testing Checklist

Before committing:
- [ ] TypeScript compilation passes (`npm run check`)
- [ ] Component renders without errors
- [ ] Can browse libraries from FHIR server
- [ ] Can upload local .cql files
- [ ] Can select a library
- [ ] State persists in Zustand store
- [ ] Validation works correctly

---

## Git Workflow

```bash
# After implementing LibraryManager
git add .
git commit -m "Phase 7 Step 2: Implement Library Manager UI"
git push
```

---

## Reference Documents

- **Full Plan**: [PHASE7_PLAN.md](./PHASE7_PLAN.md)
- **Status**: [PHASE7_STATUS.md](./PHASE7_STATUS.md)
- **Phase 6 Recap**: [PHASE6_IMPLEMENTATION.md](./PHASE6_IMPLEMENTATION.md)

---

## Expected Session Output

By end of next session:
1. ✅ Library Manager component created
2. ✅ Can browse libraries from Medplum
3. ✅ Can upload .cql files
4. ✅ Library selection works
5. ✅ Integration with workflow page
6. ✅ TypeScript passing
7. 🎯 **Bonus**: Start Step 3 (Terminology Connection)

---

## Pro Tips

1. **Reuse patterns** from FhirServerConnect.tsx for consistency
2. **Use shadcn/ui components** already in the project
3. **Test with real Medplum server** (credentials in PHASE7_PLAN.md)
4. **Keep state in Zustand**, not local component state
5. **Add loading/error states** for better UX

---

## Commands Reference

```bash
# Type check only
npm run check

# Build client
npm run build:client

# Run dev server (if working)
npm run dev

# Or directly with tsx
npx tsx server/index.ts
```

---

Good luck! 🚀
