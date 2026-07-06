// Service worker de Mis Finanzas: habilita notificaciones locales y (si el
// navegador lo permite) un chequeo periódico en segundo plano de pagos por
// vencer, usando IndexedDB (el service worker no tiene acceso a localStorage).

const DB_NAME = 'finanzas-notif';
const STORE = 'estado';
const KEY = 'actual';
const UMBRAL_DIAS = 3;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function abrirDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function leerEstado(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || { pendientes: [], notificados: [] });
    req.onerror = () => reject(req.error);
  });
}

function escribirEstado(db, data) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function diasHasta(fechaIso) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaIso + 'T00:00:00');
  return Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
}

function mensajeVencimiento(dias) {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} día(s)`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} día(s)`;
}

async function revisarPendientes() {
  const db = await abrirDb();
  const { pendientes, notificados } = await leerEstado(db);
  const nuevosNotificados = notificados.slice();
  for (const e of pendientes) {
    if (notificados.includes(e.id)) continue;
    const dias = diasHasta(e.fecha);
    if (dias <= UMBRAL_DIAS) {
      await self.registration.showNotification('Pago próximo a vencer', {
        body: `${e.detalle} · S/ ${Number(e.monto).toLocaleString('es-PE')} · ${mensajeVencimiento(dias)}`,
        icon: '/favicon.svg',
        tag: e.id,
      });
      nuevosNotificados.push(e.id);
    }
  }
  if (nuevosNotificados.length !== notificados.length) {
    await escribirEstado(db, { pendientes, notificados: nuevosNotificados });
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'chequeo-vencimientos') {
    event.waitUntil(revisarPendientes());
  }
});

// Fallback para navegadores sin Periodic Background Sync pero que sí despiertan
// el service worker por otras razones (push, sync); no hace daño intentarlo.
self.addEventListener('sync', (event) => {
  if (event.tag === 'chequeo-vencimientos') {
    event.waitUntil(revisarPendientes());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      if (lista.length > 0) return lista[0].focus();
      return self.clients.openWindow('/');
    }),
  );
});
