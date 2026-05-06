# Architectural Decisions

This file logs architectural decisions (ADRs). Use bullet lists for clarity.

## Format

Each decision should include:
- Date and ADR number
- Context (why the decision was needed)
- Decision (what was chosen)
- Alternatives considered
- Consequences (trade-offs, implications)

### ADR-001: Use NextAuth.js v5 (Auth.js) for Authentication (2026-05-06)

**Context:**
- Need authentication system for clinic/pharmacy SaaS
- Support for credentials and JWT sessions
- Role-based access (ADMIN, DOCTOR, PHARMACIST)

**Decision:**
- Use NextAuth.js v5 (Auth.js) with Prisma adapter
- Credentials provider with bcrypt for password hashing
- JWT session strategy with custom fields (role, whatsappPhone)

**Alternatives Considered:**
- NextAuth v4 → Rejected: v5 has better TypeScript support
- Custom auth system → Rejected: security risk, reinventing the wheel
- Supabase Auth → Rejected: want to keep auth in same DB

**Consequences:**
- ✅ Well-documented, widely used
- ✅ Built-in Prisma adapter
- ✅ Role-based session data
- ❌ Learning curve for v5 changes from v4
- ❌ Credentials provider less secure than OAuth (trade-off accepted)

### ADR-002: Use Prisma ORM with PostgreSQL (2026-05-06)

**Context:**
- Need type-safe database access
- PostgreSQL compatibility required (hosting on Supabase)
- Schema migrations needed

**Decision:**
- Use Prisma ORM v6 with PostgreSQL
- Schema defined in `prisma/schema.prisma`
- Output client to `src/generated/prisma`

**Alternatives Considered:**
- Raw SQL → Rejected: no type safety
- TypeORM → Rejected: less Prisma ecosystem
- Drizzle ORM → Considered but Prisma has better Next.js integration

**Consequences:**
- ✅ Excellent TypeScript integration
- ✅ Visual schema designer available
- ✅ Easy migrations
- ❌ Prisma Client bundle size
- ❌ Some performance overhead vs raw SQL

### ADR-003: Meta WhatsApp Cloud API for Notifications (2026-05-06)

**Context:**
- Need to send appointment reminders, prescription notifications
- Want automated chatbot for patient interactions
- WhatsApp is primary communication channel in target market

**Decision:**
- Use Meta WhatsApp Cloud API (not third-party wrapper)
- Direct integration with Facebook Graph API v18.0
- Template messages for notifications, text messages for bot

**Alternatives Considered:**
- Twilio WhatsApp API → Rejected: higher cost
- 360Dialog → Rejected: another intermediary
- Build custom WhatsApp bot platform → Rejected: too complex

**Consequences:**
- ✅ Direct API, no middleware costs
- ✅ Official Meta support
- ✅ Template messages approved by WhatsApp
- ❌ Need Meta Business verification
- ❌ Template approval process can be slow

### ADR-004: DeepSeek AI for Medical Assistance (2026-05-06)

**Context:**
- Need AI for symptom triage and pharmacy recommendations
- Cost-effective solution required
- Must integrate with existing OpenAI SDK

**Decision:**
- Use DeepSeek API (via OpenAI SDK compatibility)
- Same interface as OpenAI but lower cost
- Two use cases: clinical diagnosis (`/api/ai/diagnose`) and pharmacy suggestions (`/api/ai/pharmacy`)

**Alternatives Considered:**
- OpenAI GPT-4 → Rejected: higher cost per token
- Claude (Anthropic) → Considered but DeepSeek cheaper
- Local LLM → Rejected: infrastructure overhead

**Consequences:**
- ✅ Cost-effective (much cheaper than GPT-4)
- ✅ OpenAI SDK compatibility (easy to switch if needed)
- ✅ Good performance for medical queries
- ❌ Less known than OpenAI/Claude
- ❌ API stability (newer service)
