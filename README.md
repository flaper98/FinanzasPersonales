# Mis Finanzas — Control de Ingresos y Egresos Personales

App para reemplazar el registro manual en Excel de ingresos y egresos mensuales, con manejo automático de cuotas, alertas de vencimiento, gráficos y arrastre de gastos fijos entre meses.

## Cómo funciona la persistencia (importante)

Esta app tiene **cuentas de usuario reales**: cada persona se registra con su correo y contraseña, y sus ingresos/egresos se guardan en una base de datos Postgres del lado del servidor (no en el navegador). Así, cada usuario ve lo mismo sin importar desde qué dispositivo entre, y los datos de una persona nunca se mezclan con los de otra.

El backend son funciones serverless de Vercel (carpeta `/api`) — no es un servidor tradicional que corre 24/7, sino código que se ejecuta bajo demanda en cada request, dentro del mismo proyecto de Vercel que sirve el frontend.

**Si venías usando una versión anterior sin login** (datos guardados en `localStorage`): al registrarte, si la app detecta datos viejos en ese navegador y tu cuenta nueva está vacía, te ofrece importarlos automáticamente.

## Funcionalidades

- CRUD de ingresos y egresos, organizados por mes.
- Marcar un egreso como **PAGADO** solo registra que ya se pagó este mes (no mueve la cuota). La cuota actual sube +1 automáticamente **al crear el mes siguiente** (ej. 5/10 en julio pasa a 6/10 en agosto), y si llega al total se marca como **finalizado** (deja de arrastrarse).
- Egresos recurrentes sin fin ("siempre": luz, internet, streaming, etc.) solo alternan Pagado/No Pagado, sin descontar cuotas.
- Ingresos también pueden marcarse como **Fijo** (ej. sueldo mensual) y como **COBRADO/NO COBRADO**.
- Dashboard con **Saldo real** (ingresos cobrados − egresos pagados, se actualiza al instante al marcar cada uno) y **Balance proyectado** (totales del mes, sin importar el estado), además de desglose de cobrado/por cobrar y pagado/pendiente.
- **Planificador de deudas**: asigna cada egreso al ingreso con el que planeas pagarlo (ej. "Internet y Celular con el Sueldo", "tal deuda con la Gratificación"). Muestra cuánto de cada ingreso ya está comprometido, cuánto queda disponible, y avisa en rojo si se asignó más de lo que ese ingreso cubre. El vínculo se mantiene automáticamente al crear un mes nuevo si tanto el ingreso como el egreso son fijos.
- Gráficos: gasto por detalle (pie), FIJO vs NO FIJO (barras), histórico ingresos vs egresos (línea).
- Alertas de vencimiento: egresos NO PAGADO que vencen en 5 días o menos, u ya vencidos, ordenados por urgencia.
- "+ Nuevo mes": crea el mes siguiente y copia automáticamente los ingresos y egresos marcados como **Fijo** (los egresos con cuotas numéricas se arrastran hasta finalizar; los ingresos fijos y los egresos "siempre" se arrastran indefinidamente). Todo lo NO FIJO / no marcado como fijo se carga a mano cada mes, y el estado (COBRADO/PAGADO) se reinicia en el mes nuevo.
- **Notificaciones de vencimiento** (opcional, ver sección abajo): la propia web te avisa con una notificación cuando un egreso está por vencer, sin depender de ningún servicio externo.
- Historial: navega entre todos los meses registrados.
- Exportar/Importar backup completo en JSON, exportar un mes a Excel (.xlsx), e importar Excel/CSV existente.
- Cuentas de usuario: cada persona se registra con correo y contraseña y ve únicamente sus propios datos.
- Interfaz en español, pensada para marcar pagado en un clic, responsive para usarla desde el celular.

## Stack

React + Vite + TypeScript + Tailwind CSS + Recharts (gráficos) + date-fns + SheetJS (`xlsx`, import/export Excel/CSV) en el frontend. Backend: funciones serverless de Vercel (`/api`) + Postgres (Neon) + `bcryptjs` (contraseñas) + `jose` (sesiones JWT en cookie).

## Backend y cuentas de usuario

Necesitás dos cosas antes de poder registrar usuarios: una base de datos Postgres y un secreto para firmar las sesiones.

1. **Base de datos**: creá un proyecto gratuito en [neon.tech](https://neon.tech) (o usá Vercel Postgres, que por debajo también es Neon). Copiá la cadena de conexión que te dan (empieza con `postgres://...`) — usá la versión "pooled" si te dan a elegir.
2. **Secreto de sesión**: generá un valor aleatorio, por ejemplo con `openssl rand -base64 32` (o cualquier generador de contraseñas largas).
3. **Localmente**: copiá `.env.example` a `.env` y completá:
   ```
   DATABASE_URL=postgres://usuario:password@...neon.tech/neondb
   JWT_SECRET=el-valor-aleatorio-que-generaste
   ```
4. **En Vercel**: Project Settings → Environment Variables → agregá `DATABASE_URL` y `JWT_SECRET` con los mismos valores (podés usar una base de datos distinta a la local si preferís separar desarrollo de producción) → desplegá.

Las tablas de la base de datos (`users`, `finance_data`) se crean solas la primera vez que se llama a la API — no hace falta correr ninguna migración a mano.

**No hay que crear cuentas manualmente**: cualquiera que entre a la app puede registrarse desde la pantalla de login. Cada cuenta ve únicamente sus propios ingresos y egresos.

## Recuperar contraseña

Desde la pantalla de login, "¿Olvidaste tu contraseña?" envía un correo con un link de un solo uso (vence en 1 hora) para elegir una contraseña nueva. Para que esto funcione hace falta una cuenta en [resend.com](https://resend.com) (tiene un free tier de 3000 correos/mes, de sobra para uso personal):

1. Creá una cuenta gratis en Resend y generá una API key.
2. Elegí el remitente:
   - **Para probar rápido**: usá `EMAIL_FROM=onboarding@resend.dev` (el dominio de pruebas que da Resend, no requiere verificación).
   - **Para producción**: verificá tu propio dominio en Resend (Domains → Add Domain) y usá una dirección de ese dominio, ej. `EMAIL_FROM=noreply@tudominio.com`.
3. Agregá `RESEND_API_KEY` y `EMAIL_FROM` a tu `.env` local y, para que funcione en producción, también en Vercel → Project Settings → Environment Variables.

Si no configurás estas variables, el resto de la app funciona igual — solo falla el botón de "¿Olvidaste tu contraseña?" con un error indicando qué variable falta.

## Instalación y uso local

Requiere Node.js 20 o superior (usa `process.loadEnvFile`), y haber completado el paso anterior (`.env` con `DATABASE_URL` y `JWT_SECRET`).

Como el login y los datos ahora dependen de funciones serverless (`/api`), **`npm run dev` (Vite solo) no las ejecuta**. Hay dos formas de correr la app completa en local:

**Opción A — sin cuenta de Vercel (recomendado para probar rápido):**
```bash
npm install
npm run dev:local
```
Esto levanta dos procesos juntos: Vite (frontend) y un servidor local liviano (`dev-server.ts`) que corre los mismos handlers de `/api` directamente con Node, sin necesitar `vercel login` ni ningún proyecto de Vercel. Vite hace de proxy de `/api` hacia ese servidor, así el navegador ve todo bajo un solo origen (`http://localhost:5173`), igual que en producción. Es una réplica simplificada de las funciones reales, pensada solo para desarrollo local — el código que se despliega a Vercel es el mismo, esto no lo reemplaza, solo evita necesitar login para probar.

**Opción B — con el CLI de Vercel (emula Vercel exactamente):**
```bash
npm install
npx vercel login     # una sola vez, cuenta gratuita
npx vercel link       # une esta carpeta a un proyecto de Vercel (una sola vez)
npm run dev:full      # equivale a `vercel dev`
```

Con cualquiera de las dos, abrí la URL que te muestre la terminal.

Si solo estás retocando estilos o pantallas que no dependen del login (ej. componentes visuales sueltos), `npm run dev` sigue sirviendo para iterar más rápido, pero cualquier pantalla que llame a `/api` (login, guardar datos) no va a responder en ese modo.

Para generar el build de producción y previsualizar el frontend (sin las funciones `/api`):

```bash
npm run build
npm run preview
```

## Desplegar en Vercel

El proyecto está listo para desplegarse tal cual (incluye `vercel.json`), pero necesita las variables de entorno `DATABASE_URL` y `JWT_SECRET` configuradas (ver sección "Backend y cuentas de usuario" arriba) — sin ellas, el login y el guardado de datos van a fallar aunque el sitio cargue.

**Opción A — desde el dashboard de Vercel:**
1. Sube este repositorio a GitHub/GitLab/Bitbucket.
2. En [vercel.com](https://vercel.com), "Add New Project" → importa el repositorio.
3. Antes de desplegar (o en Project Settings luego), agregá `DATABASE_URL` y `JWT_SECRET` en Environment Variables.
4. Vercel detecta automáticamente el framework Vite (build command `npm run build`, output `dist`) y las funciones en `/api`. Confirma y despliega.

**Opción B — con Vercel CLI:**
```bash
npm i -g vercel
vercel        # despliegue de prueba
vercel --prod # despliegue a producción
```

## Notificaciones de vencimiento

La app puede avisarte con una notificación del navegador cuando un egreso NO PAGADO está por vencer (3 días o menos) o ya venció. No usa ningún servicio externo ni backend: es la API de Notificaciones del navegador + un Service Worker, ambos nativos de la web.

**Cómo activarlas**: pestaña **Backup** → "Activar notificaciones" → aceptar el permiso que pide el navegador. Hay un botón "Probar notificación" para confirmar que se ven bien en tu dispositivo.

**Qué tan confiable es esto — importante leerlo:**

- **Con la app abierta o en una pestaña en segundo plano**: siempre funciona. Al abrir la app, al volver a la pestaña, o cada 15 minutos mientras sigue abierta, revisa si algo está por vencer y te avisa (sin repetir el mismo aviso dos veces).
- **Con la app cerrada, instalada en el celular ("agregar a pantalla de inicio")**:
  - **Android (Chrome/Edge)**: la app intenta activar un chequeo periódico en segundo plano (Periodic Background Sync). Es *best-effort*: el navegador decide si te lo otorga (según cuánto uses la app) y cada cuánto corre (normalmente no menos de ~12 horas, sin horario exacto garantizado). No es tan confiable como una notificación push real, pero no requiere backend ni cuenta externa.
  - **iPhone (Safari)**: las notificaciones **solo** funcionan si agregaste la app a la pantalla de inicio y la abriste desde ese ícono (no desde una pestaña normal de Safari) — es una restricción de iOS, no de esta app. iOS no tiene un equivalente a Periodic Background Sync, así que con la app cerrada no hay chequeo en segundo plano en iPhone: vas a recibir el aviso recién cuando abras la app.
- Para una garantía real de aviso con la app 100% cerrada en cualquier dispositivo, la única forma es un push notification real, que requiere un backend propio (ej. una función serverless en Vercel con un cron diario) guardando tu suscripción — es un cambio de arquitectura más grande que no está incluido, para mantener la app simple y sin costos de infraestructura.

**En resumen**: para que te avise de forma confiable, lo mejor es agregar la app a tu pantalla de inicio y abrirla al menos una vez al día (por ejemplo, cuando revisás tus pagos). El chequeo en segundo plano de Android es un extra que puede ayudar, pero no reemplaza abrir la app.

## Importar tu registro actual desde Excel/CSV

En la pestaña **Backup** → "Importar Excel/CSV":

- Si subes un `.xlsx` con hojas llamadas `Ingreso` y/o `Egreso`, se leen ambas.
- Si subes un `.csv` de una sola tabla, se detecta automáticamente si es de ingresos o egresos según sus columnas.
- Columnas esperadas:
  - **Ingreso**: `Detalle`, `Monto`, `Fecha` (o `Definir` si aún no hay fecha), `Fijo` (`SI`/`NO`, opcional, por defecto NO), `Estado` (`COBRADO`/`NO COBRADO`, opcional, por defecto NO COBRADO).
  - **Egreso**: `Detalle`, `Monto`, `Fecha`, `Tipo de Egreso` (`FIJO`/`NO FIJO`), `Cuotas Totales` (número o `siempre`), `Cuota Actual` (número o `siempre`), `Accion` (`PAGADO`/`NO PAGADO`).
- Las filas importadas se agregan al mes que tengas seleccionado en ese momento.
- El export a Excel incluye una columna informativa "Pagar Con" (a qué ingreso está asignado cada egreso), pero al importar un archivo los egresos siempre entran sin asignar — reasígnalos desde la pestaña Planificador.

## Estructura del proyecto

```
api/
  _lib/
    db.ts                   Cliente Neon + creación de tablas
    auth.ts                 Hash de contraseñas, JWT de sesión, cookies
    email.ts                 Envío de correos vía Resend (recuperación de contraseña)
  auth/
    register.ts, login.ts, logout.ts, me.ts   Endpoints de autenticación
    forgot-password.ts, reset-password.ts     Pedir y confirmar recuperación de contraseña
  finance.ts                GET/PUT de los datos (ingresos/egresos) del usuario autenticado
dev-server.ts              Servidor local que corre /api sin Vercel (ver npm run dev:local)
public/
  sw.js                    Service worker: notificaciones + chequeo en segundo plano (best-effort)
  manifest.webmanifest     Manifest PWA (para "agregar a pantalla de inicio")
src/
  types.ts                 Tipos de datos (Ingreso, Egreso, etc.)
  lib/
    calculations.ts         Lógica de cuotas, totales del dashboard, alertas, arrastre de mes, planificador
    monthUtils.ts            Utilidades de fechas y claves de mes
    text.ts                  Normalización del texto de "Detalle"
    storage.ts               Lectura de datos viejos en localStorage (solo para la migración a cuenta)
    api.ts                   Cliente fetch hacia /api
    excel.ts                 Exportar/Importar JSON y Excel/CSV
    notifStore.ts            Espejo en IndexedDB para que el service worker lea los pendientes
    notificaciones.ts        Permisos, registro del service worker, disparo de notificaciones
  context/
    AuthContext.tsx          Sesión: login, registro, logout, usuario actual
    FinanceContext.tsx       Estado de ingresos/egresos y acciones, persistido vía /api/finance
  components/
    Auth/LoginPage.tsx       Pantalla de login/registro/recuperar contraseña
    Auth/ResetPasswordPage.tsx  Pantalla para elegir la contraseña nueva (desde el link del correo)
    NotificationSync.tsx     Sin UI: mantiene sincronizado el chequeo de vencimientos
    Layout/                  Sidebar (con cuenta/cerrar sesión) y selector de mes
    Dashboard/                Resumen y alertas
    Ingresos/, Egresos/       CRUD de cada tabla
    Planificador/             Asignar egresos a la fuente de ingreso que los paga
    Charts/                   Gráficos
    Backup/                   Exportar/Importar, gestión de mes, notificaciones
```
