/**
 * Espejo mínimo del estado en IndexedDB, para que el service worker (que no
 * tiene acceso a localStorage) pueda revisar vencimientos en segundo plano.
 */

const DB_NAME = 'finanzas-notif';
const STORE = 'estado';
const KEY = 'actual';

export interface EgresoPendiente {
  id: string;
  detalle: string;
  monto: number;
  fecha: string;
}

interface NotifStoreData {
  pendientes: EgresoPendiente[];
  notificados: string[];
}

function abrirDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function leerEstado(db: IDBDatabase): Promise<NotifStoreData> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result ?? { pendientes: [], notificados: [] });
    req.onerror = () => reject(req.error);
  });
}

function escribirEstado(db: IDBDatabase, data: NotifStoreData): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function guardarPendientes(pendientes: EgresoPendiente[]): Promise<void> {
  const db = await abrirDb();
  const actual = await leerEstado(db);
  await escribirEstado(db, { ...actual, pendientes });
}

export async function marcarNotificado(id: string): Promise<void> {
  const db = await abrirDb();
  const actual = await leerEstado(db);
  if (!actual.notificados.includes(id)) {
    await escribirEstado(db, { ...actual, notificados: [...actual.notificados, id] });
  }
}

export async function obtenerEstadoNotif(): Promise<NotifStoreData> {
  const db = await abrirDb();
  return leerEstado(db);
}
