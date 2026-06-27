# Deployment Configuration

## Vercel Environment Variables (CRITICAL)

### NEXTAUTH_SECRET
- **Value**: `s1Qk+Q9rEywu6ItxV+ZKRHTIgEu62GbAy8nBKXQV0CI=`
- **Generated**: 2026-05-06
- **Action Required**: Add this in Vercel Dashboard → Settings → Environment Variables
- **Environments**: Production, Preview, Development

### How to add:
1. Go to https://vercel.com/dashboard
2. Select project: clinica-farmacia-saas
3. Settings → Environment Variables
4. Add:
   - Name: `NEXTAUTH_SECRET`
   - Value: `s1Qk+Q9rEywu6ItxV+ZKRHTIgEu62GbAy8nBKXQV0CI=`
   - Environment: Select ALL (Production, Preview, Development)
5. Click Save
6. Go to Deployments → Redeploy latest commit

## Other Environment Variables (verify these are set)
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection (for Prisma)
- `NEXTAUTH_URL`: https://your-vercel-domain.vercel.app
- `WHATSAPP_*`: WhatsApp API credentials
- `GROQ_API_KEY`: AI service API key (bot-service, Llama 3.3 70B vía Groq)
- `CRON_SECRET`: protege /api/cron/reminders (recordatorios de cita 24h/1h + check-ins de adherencia)

## Base de datos (2026-06-27)
- **Producción = Neon** (proyecto `salus-ia`, id `misty-bird-08780860`, Postgres 17, us-east-1).
  - El Supabase anterior (`gdebmvpbbytdytjgqjkx`) quedó descartado; Supabase ahora es solo de Agéndalo IA.
  - `DATABASE_URL` = endpoint pooled (`-pooler`, con `pgbouncer=true`); `DIRECT_URL` = endpoint directo (sin `-pooler`) para `prisma db push`.
- El cron de recordatorios lo dispara el **bot-service de Railway** (scheduler interno cada 30 min), NO el cron de Vercel (plan Hobby).

## Latest Deployment
- Commit: f1527a2
- Date: 2026-05-06
- Status: Check Vercel dashboard
- Fixes included: Prisma schema, ESLint, NextAuth session
