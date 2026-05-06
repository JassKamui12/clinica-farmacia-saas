# Key Facts

Non-sensitive project configuration and constants. Organize by category using bullet lists.

## ⚠️ SECURITY WARNING: What NOT to Store Here

**NEVER store passwords, API keys, or sensitive credentials in this file.** This file is committed to version control.

## Project Information

**Name:** clinica-farmacia-saas  
**Type:** Next.js 15 SaaS application  
**Stack:** Next.js 15, React 19, TypeScript, Prisma 6, PostgreSQL (Supabase), Tailwind CSS 3  
**Node Version:** Managed via nvm-windows  

## Database Configuration

**Provider:** PostgreSQL (hosted on Supabase)  
**Connection:** Via Prisma ORM  
**Schema File:** `prisma/schema.prisma`  
**Client Output:** `src/generated/prisma`  

**Environment Variables (stored in `.env`, not here):**
- `DATABASE_URL` - Supabase connection string with pgBouncer
- `DIRECT_URL` - Supabase direct connection string

## WhatsApp API Configuration

**API Version:** Facebook Graph API v18.0  
**Phone Number ID:** Stored in `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_PHONE_ID`  
**Business Account ID:** Stored in `WHATSAPP_BUSINESS_ACCOUNT_ID`  
**Webhook URL:** `/api/whatsapp/webhook`  

## AI/LLM Configuration

**Provider:** DeepSeek (via OpenAI-compatible API)  
**API Key Variable:** `DEEPSEEK_API_KEY` (not the actual key!)  
**Base URL:** `https://api.deepseek.com` (configured in code)  
**Uses:** OpenAI SDK with custom baseURL  

## Local Development Ports

**Next.js Dev Server:** `http://localhost:3000` (configured with `-H 0.0.0.0`)  
**Database:** PostgreSQL on Supabase (no local DB)  

## Authentication

**Strategy:** JWT (JSON Web Tokens)  
**Secret Variable:** `NEXTAUTH_SECRET`  
**Session Strategy:** JWT with 30-day max age  
**Roles:** ADMIN, DOCTOR, PHARMACIST  

## Important URLs

**Repository:** Local only (not specified)  
**Deployment Target:** Vercel (implied by `vercel-react-best-practices` skill)  
**Supabase Dashboard:** https://supabase.com/dashboard  

## Cron Jobs

**Cron Secret Variable:** `CRON_SECRET`  
**Endpoints:**
- `/api/cron/reminders-24h` - 24-hour appointment reminders
- `/api/cron/reminders-1h` - 1-hour appointment reminders  
- `/api/cron/prescription-notifications` - Prescription ready notifications
- `/api/cron/followup-check` - Patient follow-up checks
- `/api/cron/auto-followup` - Automated follow-up messages
