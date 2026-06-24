// src/modules/auditoria/AuditoriaEditor.jsx
import React, { useState, useEffect } from 'react';
import { calcScoreApartado, stateColor, stateLabel, prioColor } from './helpers';
import * as store from './auditoriaStore';

export default function AuditoriaEditor({
  auditoria: initialAuditoria,
  apartadoIdActivo,
  onClose,
  onSaved,
  allUsers,
  accountId,
  T,
}) {
  const [auditoria, setAuditoria] = useState(initialAuditoria);
  const [activeAptId, setActiveAptId] = useState(
    apartadoIdActivo || initialAuditoria?.apartados?.[0]?.id
  );
  const [expandedSubitem, setExpandedSubitem] = useState(null);
  const [savingSubitem, setSavingSubitem] = useState(null);
  const [accionDraft, setAccionDraft] = useState({});
  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');

  const isDark = T.mode === 'dark';
  const scoreColor = s => stateColor(s, isDark ? 'dark' : 'light');

  const activeApt = auditoria?.apartados?.find(a => a.id === activeAptId);
  const subitems = activeApt?.subitems || [];
  const aptScore = calcScoreApartado(subitems);

  // ─── Score click ──────────────────────────────────────────────────────────
  const handleScoreClick = async (subitem, score) => {
    const newScore = subitem.score === score ? null : score;
    // Optimistic update
    setAuditoria(prev => ({
      ...prev,
      apartados: prev.apartados.map(a => ({
        ...a,
        subitems: a.subitems.map(s =>
          s.id === subitem.id ? { ...s, score: newScore } : s
        ),
      })),
    }));
    try {
      await store.updateSubitem(subitem.id, { score: newScore });
    } catch (e) {
      // revert on error
      setAuditoria(prev => ({
        ...prev,
        apartados: prev.apartados.map(a => ({
          ...a,
          subitems: a.subitems.map(s =>
            s.id === subitem.id ? { ...s, score: subitem.score } : s
          ),
        })),
      }));
    }
  };

  // ─── Estado actual blur ───────────────────────────────────────────────────
  const handleEstadoBlur = async (subitem, val) => {
    if (val === subitem.estado_actual) return;
    setAuditoria(prev => ({
      ...prev,
      apartados: prev.apartados.map(a => ({
        ...a,
        subitems: a.subitems.map(s =>
          s.id === subitem.id ? { ...s, estado_actual: val } : s
        ),
      })),
    }));
    await store.updateSubitem(subitem.id, { estado_actual: val }).catch(() => {});
  };

  // ─── Acción (task) ────────────────────────────────────────────────────────
  const getDraftForSub = (subId) => accionDraft[subId] || {};
  const setDraft = (subId, fields) => setAccionDraft(p => ({ ...p, [subId]: { ...getDraftForSub(subId), ...fields } }));

  const handleGuardarAccion = async (subitem) => {
    const draft = getDraftForSub(subitem.id);
    if (!draft.descripcion?.trim()) return;
    setSavingSubitem(subitem.id);
    try {
      const taskId = await store.upsertAccion(subitem, {
        descripcion: draft.descripcion,
        responsable_id: draft.responsable_id || null,
        deadline: draft.deadline || null,
        impacto: draft.impacto || '',
        prioridad: draft.prioridad || 'Media',
      }, accountId);
      // Update local state
      setAuditoria(prev => ({
        ...prev,
        apartados: prev.apartados.map(a => ({
          ...a,
          subitems: a.subitems.map(s =>
            s.id === subitem.id
              ? { ...s, task_id: taskId, impacto: draft.impacto || '' }
              : s
          ),
        })),
      }));
      onSaved?.();
    } catch (e) {
      alert('Error al guardar acción: ' + e.message);
    } finally {
      setSavingSubitem(null);
    }
  };

  const handleRemoveAccion = async (subitem) => {
    if (!window.confirm('¿Eliminar la tarea vinculada?')) return;
    await store.removeAccion(subitem).catch(() => {});
    setAuditoria(prev => ({
      ...prev,
      apartados: prev.apartados.map(a => ({
        ...a,
        subitems: a.subitems.map(s =>
          s.id === subitem.id ? { ...s, task_id: null, impacto: '' } : s
        ),
      })),
    }));
    setDraft(subitem.id, { descripcion: '', responsable_id: null, deadline: '', impacto: '', prioridad: 'Media' });
    onSaved?.();
  };

  // Initialize drafts from existing tasks
  useEffect(() => {
    if (!auditoria) return;
    const drafts = {};
    auditoria.apartados?.forEach(ap => {
      ap.subitems?.forEach(s => {
        if (s.task_id) {
          drafts[s.id] = {
            descripcion: s.titulo || '',
            impacto: s.impacto || '',
            prioridad: 'Media',
          };
        }
      });
    });
    setAccionDraft(drafts);
  }, []);

  // ─── Agregar ítem custom ──────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    try {
      const newSub = await store.addSubitem(activeAptId, newItemTitle.trim(), subitems.length);
      setAuditoria(prev => ({
        ...prev,
        apartados: prev.apartados.map(a =>
          a.id === activeAptId ? { ...a, subitems: [...a.subitems, newSub] } : a
        ),
      }));
      setNewItemTitle('');
      setAddingItem(false);
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  const handleDeleteSubitem = async (subitem) => {
    if (!window.confirm(`¿Eliminar "${subitem.titulo}"?`)) return;
    await store.deleteSubitem(subitem.id).catch(() => {});
    setAuditoria(prev => ({
      ...prev,
      apartados: prev.apartados.map(a =>
        a.id === activeAptId
          ? { ...a, subitems: a.subitems.filter(s => s.id !== subitem.id) }
          : a
      ),
    }));
  };

  const inputSt = {
    background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6,
    color: T.text, padding: '6px 10px', fontSize: 13, width: '100%', outline: 'none',
  };

  const accionCount = subitems.filter(s => s.task_id).length;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: T.bg1, borderBottom: `1px solid ${T.border}`,
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: T.textMuted,
          cursor: 'pointer', fontSize: 20, lineHeight: 1,
        }}>←</button>
        <span style={{ fontSize: 18 }}>{activeApt?.icono}</span>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>
          {activeApt?.nombre}
        </div>
        <div style={{ fontSize: 12, color: T.textMuted }}>
          {accionCount} acción{accionCount !== 1 ? 'es' : ''} cargada{accionCount !== 1 ? 's' : ''}
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: T.textMuted,
          fontSize: 22, cursor: 'pointer', lineHeight: 1,
        }}>×</button>
      </div>

      {/* Chips de apartados */}
      <div style={{
        background: T.bg1, borderBottom: `1px solid ${T.border}`,
        padding: '10px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0,
      }}>
        {auditoria?.apartados?.map(ap => (
          <button
            key={ap.id}
            onClick={() => { setActiveAptId(ap.id); setExpandedSubitem(null); }}
            style={{
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              border: `1px solid ${ap.id === activeAptId ? '#e8572a' : T.border}`,
              background: ap.id === activeAptId ? '#e8572a22' : T.bg2,
              color: ap.id === activeAptId ? '#e8572a' : T.textMuted,
              transition: 'all 0.15s',
            }}
          >
            {ap.icono} {ap.nombre}
          </button>
        ))}
      </div>

      {/* Score banda */}
      <div style={{
        background: T.bg1, borderBottom: `1px solid ${T.border}`,
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        <div style={{
          fontSize: 28, fontWeight: 900, color: aptScore ? scoreColor(aptScore) : T.textMuted,
          minWidth: 36,
        }}>
          {aptScore || '—'}
        </div>
        {/* Barra de progreso */}
        <div style={{ flex: 1, height: 6, background: T.bg2, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${(aptScore / 5) * 100}%`, height: '100%',
            background: aptScore ? scoreColor(aptScore) : T.border,
            borderRadius: 3, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: aptScore ? scoreColor(aptScore) : T.textMuted,
          textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 80, textAlign: 'right',
        }}>
          {stateLabel(aptScore)}
        </div>
      </div>

      {/* Lista de subitems */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
        {subitems.map((sub, idx) => {
          const isExpanded = expandedSubitem === sub.id;
          const draft = getDraftForSub(sub.id);
          const hasTask = !!sub.task_id;

          return (
            <div key={sub.id} style={{
              marginBottom: 10, borderRadius: 10, overflow: 'hidden',
              border: `1px solid ${isExpanded ? '#e8572a55' : T.border}`,
              background: T.bg1,
            }}>
              {/* Fila principal */}
              <div style={{
                padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                {/* Índice */}
                <div style={{ fontSize: 11, color: T.textMuted, minWidth: 20, paddingTop: 2 }}>
                  {idx + 1}.
                </div>

                {/* Título + estado actual */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                    {sub.titulo}
                  </div>
                  <input
                    style={{ ...inputSt, fontSize: 12 }}
                    placeholder="Estado actual (ej: Configurado correctamente)"
                    defaultValue={sub.estado_actual || ''}
                    onBlur={e => handleEstadoBlur(sub, e.target.value)}
                  />
                </div>

                {/* Bloques 1-5 */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => handleScoreClick(sub, n)}
                      title={stateLabel(n)}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        cursor: 'pointer', fontWeight: 700, fontSize: 12,
                        background: sub.score === n ? scoreColor(n) : T.bg2,
                        color: sub.score === n ? '#fff' : T.textMuted,
                        transition: 'all 0.15s',
                      }}
                    >{n}</button>
                  ))}
                </div>

                {/* Botón acción */}
                <button
                  onClick={() => setExpandedSubitem(isExpanded ? null : sub.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                    fontWeight: 600, border: `1px solid ${hasTask ? '#4ade8066' : T.border}`,
                    background: hasTask ? '#4ade8022' : T.bg2,
                    color: hasTask ? '#4ade80' : T.textMuted, flexShrink: 0,
                  }}
                >
                  {hasTask ? '✅ Acción' : '+ Acción'}
                </button>

                {/* Papelera */}
                <button
                  onClick={() => handleDeleteSubitem(sub)}
                  title="Eliminar ítem"
                  style={{
                    background: 'none', border: 'none', color: T.textMuted,
                    cursor: 'pointer', fontSize: 15, padding: '2px 4px', flexShrink: 0,
                  }}
                >🗑</button>
              </div>

              {/* Panel expandido de acción */}
              {isExpanded && (
                <div style={{
                  padding: '14px 16px 16px',
                  borderTop: `1px solid ${T.border}`,
                  background: T.bg,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                    Acción vinculada
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    {/* Descripción */}
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 4 }}>Descripción de la acción *</label>
                      <input
                        style={inputSt}
                        placeholder="Ej: Configurar campaña de retargeting con 14 días de ventana"
                        value={draft.descripcion || ''}
                        onChange={e => setDraft(sub.id, { descripcion: e.target.value })}
                      />
                    </div>

                    {/* Responsable */}
                    <div>
                      <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 4 }}>Responsable</label>
                      <select
                        style={{ ...inputSt, cursor: 'pointer' }}
                        value={draft.responsable_id || ''}
                        onChange={e => setDraft(sub.id, { responsable_id: e.target.value || null })}
                      >
                        <option value="">Sin asignar</option>
                        {(allUsers || []).map(u => (
                          <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                        ))}
                      </select>
                    </div>

                    {/* Prioridad */}
                    <div>
                      <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 4 }}>Prioridad</label>
                      <select
                        style={{ ...inputSt, cursor: 'pointer' }}
                        value={draft.prioridad || 'Media'}
                        onChange={e => setDraft(sub.id, { prioridad: e.target.value })}
                      >
                        <option>Alta</option>
                        <option>Media</option>
                        <option>Baja</option>
                      </select>
                    </div>

                    {/* Deadline */}
                    <div>
                      <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 4 }}>Deadline</label>
                      <input
                        type="date"
                        style={inputSt}
                        value={draft.deadline || ''}
                        onChange={e => setDraft(sub.id, { deadline: e.target.value })}
                      />
                    </div>

                    {/* Impacto */}
                    <div>
                      <label style={{ fontSize: 11, color: T.textMuted, display: 'block', marginBottom: 4 }}>Impacto estimado</label>
                      <input
                        style={inputSt}
                        placeholder="Ej: AOV +20%"
                        value={draft.impacto || ''}
                        onChange={e => setDraft(sub.id, { impacto: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleGuardarAccion(sub)}
                      disabled={savingSubitem === sub.id}
                      style={{
                        padding: '7px 16px', borderRadius: 7, border: 'none',
                        background: '#e8572a', color: '#fff', fontWeight: 700,
                        cursor: savingSubitem === sub.id ? 'default' : 'pointer',
                        fontSize: 12, opacity: savingSubitem === sub.id ? 0.7 : 1,
                      }}
                    >
                      {savingSubitem === sub.id ? 'Guardando…' : hasTask ? 'Actualizar tarea' : 'Crear tarea'}
                    </button>
                    {hasTask && (
                      <button
                        onClick={() => handleRemoveAccion(sub)}
                        style={{
                          padding: '7px 16px', borderRadius: 7,
                          border: `1px solid ${T.border}`,
                          background: 'none', color: '#f87171',
                          cursor: 'pointer', fontSize: 12,
                        }}
                      >Eliminar tarea</button>
                    )}
                    <button
                      onClick={() => setExpandedSubitem(null)}
                      style={{
                        padding: '7px 16px', borderRadius: 7,
                        border: `1px solid ${T.border}`,
                        background: 'none', color: T.textMuted,
                        cursor: 'pointer', fontSize: 12, marginLeft: 'auto',
                      }}
                    >Cerrar</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Agregar nuevo ítem */}
        {addingItem ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              autoFocus
              style={{
                flex: 1, background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 8, color: T.text, padding: '9px 14px', fontSize: 13, outline: 'none',
              }}
              placeholder="Título del nuevo ítem..."
              value={newItemTitle}
              onChange={e => setNewItemTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); if (e.key === 'Escape') setAddingItem(false); }}
            />
            <button onClick={handleAddItem} style={{
              padding: '9px 16px', borderRadius: 8, border: 'none',
              background: '#e8572a', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
            }}>Agregar</button>
            <button onClick={() => { setAddingItem(false); setNewItemTitle(''); }} style={{
              padding: '9px 16px', borderRadius: 8, border: `1px solid ${T.border}`,
              background: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 13,
            }}>✕</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingItem(true)}
            style={{
              marginTop: 8, width: '100%', padding: '10px', borderRadius: 8,
              border: `1px dashed ${T.border}`, background: 'none',
              color: T.textMuted, cursor: 'pointer', fontSize: 13,
            }}
          >+ Agregar ítem personalizado</button>
        )}
      </div>
    </div>
  );
}
