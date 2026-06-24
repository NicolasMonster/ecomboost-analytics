// src/modules/auditoria/KpisMaestrosEditor.jsx
import React, { useState } from 'react';
import { calcDelta, deltaColor, deltaSign } from './helpers';
import * as store from './auditoriaStore';

export default function KpisMaestrosEditor({ auditoria, onClose, onSaved, T }) {
  const [kpis, setKpis] = useState(() =>
    [...(auditoria?.kpis_maestros || [])].sort((a, b) => a.orden - b.orden)
  );
  const [saving, setSaving] = useState(false);

  const updateLocal = (idx, field, val) => {
    setKpis(prev => prev.map((k, i) => i === idx ? { ...k, [field]: val } : k));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(kpis.map(k =>
        store.updateKpi(k.id, {
          mes_anterior: k.mes_anterior,
          mes_actual: k.mes_actual,
          objetivo: k.objetivo,
        })
      ));
      onSaved?.();
      onClose();
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputSt = {
    background: T.bg2,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    color: T.text,
    padding: '6px 10px',
    fontSize: 13,
    width: '100%',
    outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16,
        width: '100%', maxWidth: 780, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>KPIs Maestros</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Editá los valores del mes para calcular el delta</div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: T.textMuted,
            fontSize: 22, cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px 24px' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 60px 1fr',
            gap: 8, padding: '14px 0 8px',
            fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase',
            letterSpacing: 0.5, borderBottom: `1px solid ${T.border}`,
          }}>
            <span>KPI</span>
            <span>Mes anterior</span>
            <span>Mes actual</span>
            <span style={{ textAlign: 'center' }}>Δ %</span>
            <span>Objetivo</span>
          </div>

          {kpis.map((k, idx) => {
            const delta = calcDelta(k.mes_anterior, k.mes_actual);
            const dc = deltaColor(delta, k.is_inverted);
            const sign = deltaSign(delta);
            return (
              <div key={k.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 60px 1fr',
                gap: 8, padding: '10px 0',
                borderBottom: `1px solid ${T.border}`,
                alignItems: 'center',
              }}>
                {/* KPI name + definición */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{k.nombre}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{k.definicion}</div>
                </div>
                {/* Mes anterior */}
                <input
                  style={inputSt}
                  value={k.mes_anterior || ''}
                  placeholder="Ej: $1.200.000"
                  onChange={e => updateLocal(idx, 'mes_anterior', e.target.value)}
                />
                {/* Mes actual */}
                <input
                  style={inputSt}
                  value={k.mes_actual || ''}
                  placeholder="Ej: $1.450.000"
                  onChange={e => updateLocal(idx, 'mes_actual', e.target.value)}
                />
                {/* Delta */}
                <div style={{
                  textAlign: 'center', fontSize: 13, fontWeight: 700, color: dc,
                }}>
                  {delta !== null ? `${sign}${delta.toFixed(1)}%` : '—'}
                </div>
                {/* Objetivo */}
                <input
                  style={inputSt}
                  value={k.objetivo || ''}
                  placeholder="Ej: >3x"
                  onChange={e => updateLocal(idx, 'objetivo', e.target.value)}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 8, border: `1px solid ${T.border}`,
            background: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 13,
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 22px', borderRadius: 8, border: 'none',
            background: '#e8572a', color: '#fff', fontWeight: 700,
            cursor: saving ? 'default' : 'pointer', fontSize: 13, opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Guardando…' : 'Guardar KPIs'}
          </button>
        </div>
      </div>
    </div>
  );
}
