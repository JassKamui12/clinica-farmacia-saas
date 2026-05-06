# Issues/Work Log

Simple log of completed work. Keep entries brief (1-2 lines). Full details in tickets.

## Format

Each entry should include:
- Date (YYYY-MM-DD)
- Brief description
- Status (optional: completed, in-progress, blocked)

Use bullet lists for simplicity.

### 2026-05-06 - Code Cleanup and Optimization

**Status:** Completed

- Removed duplicate `@next-auth/prisma-adapter` dependency (kept `@auth/prisma-adapter` v2)
- Removed unused `dotenv` dependency and cleaned `prisma/seed.ts`
- Deleted dead code file `src/proxy.ts` (logic moved to middleware.ts)
- Removed build cache `tsconfig.tsbuildinfo` from repository
- Deleted unused `src/lib/api-utils.ts` (functions never imported)
- Cleaned up `src/lib/whatsapp-templates.ts` (removed unused exports)
- Simplified `src/app/globals.css` (removed duplicate styles)
- Removed console.log statements from `src/app/api/auth/register/route.ts`
- Removed development login bypass from `src/lib/auth.ts`
- Enabled pharmacy navigation items in `src/components/Sidebar.tsx` (uncommented)

### 2026-05-06 - Set Up Project Memory System

**Status:** Completed

- Created `docs/project_notes/` directory with memory infrastructure
- Added bugs.md, decisions.md, key_facts.md, issues.md
- Configured CLAUDE.md with Project Memory System section
- Installed `project-memory` skill (spillwavesolutions/project-memory)

### 2026-05-06 - Fix Integration Issues in Consultations Page

**Status:** Completed

- Fixed hardcodeed doctor ID in `src/app/consultations/page.tsx`
- Added `useSession` to get authenticated user's ID
- Updated POST requests to use `doctorId` from session
- Added loading state check for session status
