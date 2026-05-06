# Bug Log

This file logs bugs and their solutions. Keep entries brief and chronological.

## Format

Each bug entry should include:
- Date (YYYY-MM-DD)
- Brief description of the bug/issue
- Solution or fix applied
- Any prevention notes (optional)

Use bullet lists for simplicity. Older entries can be manually removed when they become irrelevant.

### 2026-05-06 - Duplicate Prisma Adapter Dependency
- **Issue**: Both `@auth/prisma-adapter` (v2) and `@next-auth/prisma-adapter` (v1) in package.json
- **Root Cause**: Migration from NextAuth v4 to Auth.js v5 left old adapter
- **Solution**: Removed `@next-auth/prisma-adapter` from dependencies
- **Prevention**: When upgrading auth libraries, remove old packages

### 2026-05-06 - Unused Dependencies
- **Issue**: `dotenv` package installed but Next.js handles env vars natively
- **Root Cause**: Legacy pattern from non-Next.js projects
- **Solution**: Removed `dotenv` from dependencies and removed import from `prisma/seed.ts`
- **Prevention**: Next.js automatically loads `.env` files, no need for dotenv

### 2026-05-06 - Dead Code Files
- **Issue**: `src/proxy.ts` existed but was never imported anywhere
- **Root Cause**: Middleware logic was moved to `src/middleware.ts` but proxy.ts was not deleted
- **Solution**: Deleted `src/proxy.ts`
- **Prevention**: Check for dead code when refactoring

### 2026-05-06 - Build Cache in Repository
- **Issue**: `tsconfig.tsbuildinfo` was present in the repository
- **Root Cause**: Build artifacts should not be committed to version control
- **Solution**: Deleted file (already in `.gitignore` but was committed)
- **Prevention**: Ensure build artifacts are properly gitignored
