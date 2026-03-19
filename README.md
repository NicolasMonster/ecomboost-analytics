# EcomBoost Analytics

Plataforma de análisis de Meta Ads para Elevate Group.

## Stack
- React 18 + Vite
- Recharts (gráficos)
- Sin backend — datos mockeados listos para conectar con Meta API

## Correr en local

```bash
npm install
npm run dev
```

Abre en http://localhost:5173

## Deploy en Vercel (5 minutos)

### Opción A — Vercel CLI (recomendado)

```bash
npm install -g vercel
npm install
vercel
```

Seguí los prompts:
- Set up and deploy? → Y
- Which scope? → tu cuenta
- Link to existing project? → N
- Project name → ecomboost-analytics
- Directory → ./
- Override build settings? → N

Vercel detecta Vite automáticamente. Deploy listo en ~60 segundos.

### Opción B — GitHub + Vercel UI

1. Subí esta carpeta a un repo de GitHub
2. Entrá a vercel.com → New Project
3. Importá el repo
4. Framework preset: Vite
5. Deploy

## Usuarios demo

| Email | Rol | Acceso |
|-------|-----|--------|
| nico@elevatearg.com | Master | Todo |
| tomas@elevatearg.com | Equipo | Todo |
| cliente@ruby.com | Cliente | Solo Ruby Fajas |
| cliente@elemental.com | Cliente | Solo Elemental |

## Conectar Meta API (cuando estés listo)

1. Login → Config → Meta API
2. Ingresá tu Access Token de Meta Business
3. Verificar y conectar
4. Buscar cuentas publicitarias → seleccionar

Para producción usar **System User Token** (no expira):
developers.facebook.com → App → System Users

## Variables de entorno (futuro)

```
VITE_META_APP_ID=tu_app_id
VITE_META_APP_SECRET=tu_secret
```

## Próximos pasos sugeridos

- [ ] Conectar Meta API real (reemplazar datos mock en `ACCOUNTS`)  
- [ ] Auth real con Supabase (reemplazar array `USERS`)
- [ ] Tienda Nube API (módulo de conversiones reales)
- [ ] Portal del cliente (URL dedicada por cliente)
- [ ] Gestión de usuarios (invitaciones por email)
