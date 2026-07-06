import { useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  registrarServiceWorker,
  intentarActivarChequeoEnSegundoPlano,
  sincronizarPendientesParaNotificar,
  revisarYNotificarAhora,
} from '../lib/notificaciones';

const QUINCE_MINUTOS = 15 * 60 * 1000;

/** Sin UI propia: registra el service worker y mantiene al día el chequeo de vencimientos. */
export function NotificationSync() {
  const { state } = useFinance();
  const registradoRef = useRef(false);

  useEffect(() => {
    if (registradoRef.current) return;
    registradoRef.current = true;
    registrarServiceWorker().then((reg) => {
      if (reg) void intentarActivarChequeoEnSegundoPlano(reg);
    });
  }, []);

  useEffect(() => {
    void sincronizarPendientesParaNotificar(state).then(() => revisarYNotificarAhora());
  }, [state]);

  useEffect(() => {
    function alVolverVisible() {
      if (document.visibilityState === 'visible') void revisarYNotificarAhora();
    }
    document.addEventListener('visibilitychange', alVolverVisible);
    window.addEventListener('focus', alVolverVisible);
    const intervalo = window.setInterval(() => void revisarYNotificarAhora(), QUINCE_MINUTOS);
    return () => {
      document.removeEventListener('visibilitychange', alVolverVisible);
      window.removeEventListener('focus', alVolverVisible);
      window.clearInterval(intervalo);
    };
  }, []);

  return null;
}
