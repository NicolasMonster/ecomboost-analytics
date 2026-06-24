// src/modules/auditoria/useAuditoria.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import * as store from './auditoriaStore';

export function useAuditoria(accountId, mes) {
  const [auditoria, setAuditoria]   = useState(null);
  const [acciones, setAcciones]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const refresh = useCallback(async () => {
    if (!accountId || !mes) { setLoading(false); return; }
    setLoading(true);
    try {
      let data = await store.getAuditoria(accountId, mes);
      if (!data) {
        const { data: { user } } = await supabase.auth.getUser();
        data = await store.createAuditoria(accountId, mes, user?.id);
      }
      setAuditoria(data);

      // Cargar tasks de auditoría asociadas a estos subitems
      const subitemIds = (data?.apartados || []).flatMap(a => (a.subitems || []).map(s => s.id));
      if (subitemIds.length) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('origen', 'auditoria')
          .in('subitem_id', subitemIds);
        setAcciones(tasks || []);
      } else {
        setAcciones([]);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [accountId, mes]);

  useEffect(() => { refresh(); }, [refresh]);

  return { auditoria, acciones, loading, error, refresh, store };
}
