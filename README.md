# Clínica + Farmacia SaaS

Plataforma SaaS para clínica con farmacia integrada, IA asistiva y canal de WhatsApp automatizado.

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Base de datos**: SQLite (dev) → PostgreSQL / Supabase (prod)
- **ORM**: Prisma 6
- **Auth**: NextAuth.js v5 (credenciales + JWT)
- **WhatsApp**: Meta Cloud API
- **IA**: Anthropic Claude
- **UI**: Tailwind CSS
- **Deploy**: Vercel

## Instalación

```bash
npm install
```

### Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
DATABASE_URL="file:./dev.db"          # SQLite local / Supabase PostgreSQL
NEXTAUTH_SECRET="..."                 # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_ACCESS_TOKEN="EAAG..."
WHATSAPP_VERIFY_TOKEN="..."
WHATSAPP_BUSINESS_ACCOUNT_ID="..."
CRON_SECRET="..."
```

### Base de datos

```bash
# Dev (SQLite)
npm run db:push        # Sincronizar schema
npm run db:seed        # Datos de prueba

# Prod (PostgreSQL / Supabase)
# Cambiar DATABASE_URL y provider en prisma/schema.prisma a "postgresql"
DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@clinica.com | admin123 |
| Doctor | doctor@clinica.com | doctor123 |
| Farmacia | farmacia@clinica.com | pharm123 |

## Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── appointments/          # CRUD + disponibilidad
│   │   │   └── availability/      # Horarios libres
│   │   ├── auth/
│   │   │   ├── [...nextauth]/     # Login
│   │   │   └── register/          # Registro
│   │   ├── cron/                  # Vercel Cron jobs
│   │   │   ├── reminders-24h/     # Recordatorio 24h
│   │   │   ├── reminders-1h/      # Recordatorio 1h
│   │   │   ├── followup-check/    # Check-in tratamiento
│   │   │   ├── auto-followup/     # Auto-crear seguimientos
│   │   │   └── prescription-notifications/
│   │   ├── followups/             # Seguimiento pacientes
│   │   ├── whatsapp/
│   │   │   ├── webhook/           # Meta webhook
│   │   │   ├── send/              # Enviar mensajes
│   │   │   └── messages/          # Historial
│   │   └── ...
│   ├── appointments/              # Página de citas
│   ├── followups/                 # Panel seguimiento
│   ├── login/                     # Autenticación
│   └── ...
├── lib/
│   ├── auth.ts                    # NextAuth config
│   ├── whatsapp.ts                # Envío de mensajes
│   ├── whatsapp-bot.ts            # Bot conversacional IA
│   ├── whatsapp-templates.ts      # Plantillas predefinidas
│   ├── clinicaAi.ts               # IA diagnóstica
│   └── prisma.ts
├── middleware.ts                  # Protección por rol
└── types/
```

## WhatsApp + IA

### Flujos del Bot

El paciente escribe al número de WhatsApp y el bot responde:

```
1️⃣ Agendar cita → Pregunta fecha, hora, asigna doctor
2️⃣ Consultar cita → Muestra próxima cita programada
3️⃣ Seguimiento → Escala 1-4 de bienestar, genera alertas
4️⃣ Consultar receta → Muestra última receta
5️⃣ Humano → Notifica al equipo
```

### Automatizaciones (Vercel Cron)

| Job | Schedule | Acción |
|---|---|---|
| Reminders 24h | 0 8 * * * | Envía recordatorio 1 día antes |
| Reminders 1h | 0 * * * * | Envía recordatorio 1h antes |
| Follow-up check | 0 9 * * * | Check-in a pacientes en seguimiento |
| Auto follow-up | 0 20 * * * | Crea seguimiento tras consulta |
| Prescription notifs | */30 * * * * | Notifica recetas nuevas |

### Webhook

Configura en [Meta Developers](https://developers.facebook.com/):
- **Callback URL**: `https://tu-dominio.vercel.app/api/whatsapp/webhook`
- **Verify Token**: El valor de `WHATSAPP_VERIFY_TOKEN`

## Producción

### Base de datos (Supabase)

1. Crear proyecto en [Supabase](https://supabase.com)
2. Copiar `DATABASE_URL` desde Settings → Database
3. Cambiar `provider` en `prisma/schema.prisma` a `"postgresql"`
4. Ejecutar `npx prisma migrate deploy`

### Deploy (Vercel)

1. Conectar repositorio a Vercel
2. Agregar variables de entorno
3. Deploy automático

### Configurar WhatsApp

1. Crear app en [Meta Developers](https://developers.facebook.com/)
2. Agregar producto WhatsApp
3. Obtener `Phone Number ID` y `Access Token`
4. Configurar webhook con tu URL de producción
5. Crear plantillas en WhatsApp Manager

## Licencia

MIT
