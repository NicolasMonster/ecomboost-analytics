// src/modules/auditoria/AuditoriaPage.jsx
import React, { useState, useContext } from 'react';
import { useAuditoria } from './useAuditoria';
import { calcScoreApartado, calcScoreGlobal, stateColor, stateLabel, prioColor, calcDelta, deltaColor, deltaSign } from './helpers';
import * as store from './auditoriaStore';
import AuditoriaEditor from './AuditoriaEditor';
import KpisMaestrosEditor from './KpisMaestrosEditor';

// Mes actual por defecto: 'YYYY-MM'
function mesActualStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mesLabel(str) {
  if (!str) return '';
  const [y, m] = str.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${meses[parseInt(m, 10) - 1]} ${y}`;
}

// ── Score ring SVG ─────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 96, mode }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const fill = score ? (score / 5) * circ : 0;
  const color = score ? stateColor(score, mode) : '#444';
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#333" strokeWidth={6}/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.5s' }}
      />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={score ? 24 : 18} fontWeight={900} fill={color}>
        {score || '—'}
      </text>
    </svg>
  );
}

export default function AuditoriaPage({ account, currentUser, allUsers, onTasksChanged, T }) {
  const [mes, setMes] = useState(mesActualStr());
  const [showEditor, setShowEditor] = useState(false);
  const [editorAptId, setEditorAptId] = useState(null);
  const [showKpisEditor, setShowKpisEditor] = useState(false);
  const [diagEdit, setDiagEdit] = useState(false);
  const [diagDraft, setDiagDraft] = useState('');

  const isDark = T.mode === 'dark';
  const mode = isDark ? 'dark' : 'light';

  const canEdit = currentUser?.role === 'master' || currentUser?.role === 'team';

  const { auditoria, acciones, loading, error, refresh } = useAuditoria(account?.id, mes);

  const scoreGlobal = calcScoreGlobal(auditoria?.apartados || []);
  const colorGlobal = stateColor(scoreGlobal, mode);
  const labelGlobal = stateLabel(scoreGlobal);

  // ─── Diagnóstico ───────────────────────────────────────────────────────────
  const handleSaveDiag = async () => {
    try {
      await store.updateAuditoria(auditoria.id, { diagnostico: diagDraft });
      await refresh();
    } catch (e) {}
    setDiagEdit(false);
  };

  // ─── Top acciones (prioridad Alta primero) ─────────────────────────────────
  const sortedAcciones = [...acciones].sort((a, b) => {
    const p = { Alta: 0, Media: 1, Baja: 2 };
    return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
  });
  const topAcciones = sortedAcciones.slice(0, 5);

  // ─── KPIs Maestros ─────────────────────────────────────────────────────────
  const kpis = [...(auditoria?.kpis_maestros || [])].sort((a, b) => a.orden - b.orden);

  const inputSt = {
    background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.text, padding: '8px 14px', fontSize: 13, outline: 'none',
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.textMuted, fontSize: 14 }}>
      Cargando auditoría…
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#f87171', fontSize: 14 }}>
      Error: {error}
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>📋 Auditoría de Funnel</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>
            {account?.name} · {mesLabel(mes)}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Selector de mes */}
          <input
            type="month"
            value={mes}
            onChange={e => setMes(e.target.value)}
            style={{ ...inputSt, padding: '7px 12px', fontSize: 13 }}
          />
          {canEdit && (
            <button
              onClick={() => { setEditorAptId(null); setShowEditor(true); }}
              style={{
                padding: '9px 18px', borderRadius: 8, border: 'none',
                background: '#e8572a', color: '#fff', fontWeight: 700,
                cursor: 'pointer', fontSize: 13,
              }}
            >✏️ Editar auditoría</button>
          )}
        </div>
      </div>

      {/* ── Score Global Card ─────────────────────────────────────────────────── */}
      <div style={{
        background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: '24px 28px', marginBottom: 20,
        display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap',
      }}>
        {/* Ring */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <ScoreRing score={scoreGlobal} size={108} mode={mode} />
          <div style={{
            fontSize: 11, fontWeight: 800, color: colorGlobal,
            textTransform: 'uppercase', letterSpacing: 1,
          }}>
            {labelGlobal}
          </div>
        </div>

        {/* Diagnóstico */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Diagnóstico general
          </div>
          {diagEdit ? (
            <div>
              <textarea
                autoFocus
                rows={4}
                value={diagDraft}
                onChange={e => setDiagDraft(e.target.value)}
                style={{
                  ...inputSt, width: '100%', resize: 'vertical', fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
                placeholder="Resumen del estado actual del funnel…"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={handleSaveDiag} style={{
                  padding: '7px 16px', borderRadius: 7, border: 'none',
                  background: '#e8572a', color: '#fff', fontWeight: 700,
                  cursor: 'pointer', fontSize: 12,
                }}>Guardar</button>
                <button onClick={() => setDiagEdit(false)} style={{
                  padding: '7px 16px', borderRadius: 7, border: `1px solid ${T.border}`,
                  background: 'none', color: T.textMuted, cursor: 'pointer', fontSize: 12,
                }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                fontSize: 14, color: T.text, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                minHeight: 40,
              }}>
                {auditoria?.diagnostico || <span style={{ color: T.textMuted, fontStyle: 'italic' }}>Sin diagnóstico cargado</span>}
              </div>
              {canEdit && (
                <button
                  onClick={() => { setDiagDraft(auditoria?.diagnostico || ''); setDiagEdit(true); }}
                  style={{
                    marginTop: 8, padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${T.border}`, background: 'none',
                    color: T.textMuted, cursor: 'pointer', fontSize: 12,
                  }}
                >✏️ Editar diagnóstico</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid 4 apartados ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14, marginBottom: 24,
      }}>
        {(auditoria?.apartados || []).map(ap => {
          const sc = calcScoreApartado(ap.subitems || []);
          const col = stateColor(sc, mode);
          const scored = (ap.subitems || []).filter(s => s.score != null).length;
          const total = (ap.subitems || []).length;
          return (
            <div
              key={ap.id}
              onClick={() => { if (canEdit) { setEditorAptId(ap.id); setShowEditor(true); } }}
              style={{
                background: T.bg1, border: `1px solid ${sc ? col + '55' : T.border}`,
                borderRadius: 12, padding: '18px 20px',
                cursor: canEdit ? 'pointer' : 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { if (canEdit) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{ap.icono}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                {ap.nombre}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>
                {ap.descripcion}
              </div>
              {/* Score grande */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: sc ? col : T.textMuted }}>
                  {sc || '—'}
                </span>
                <span style={{ fontSize: 11, color: sc ? col : T.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                  {stateLabel(sc)}
                </span>
              </div>
              {/* Barra */}
              <div style={{ height: 4, background: T.bg2, borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  width: `${(sc / 5) * 100}%`, height: '100%',
                  background: sc ? col : T.border, borderRadius: 2, transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 11, color: T.textMuted }}>
                {scored} / {total} ítems evaluados
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Acciones planificadas ─────────────────────────────────────────────── */}
      <div style={{
        background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>⚡ Acciones planificadas</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
              {acciones.length} tarea{acciones.length !== 1 ? 's' : ''} vinculada{acciones.length !== 1 ? 's' : ''} a esta auditoría
            </div>
          </div>
        </div>

        {topAcciones.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: T.textMuted, fontSize: 13, fontStyle: 'italic' }}>
            No hay acciones cargadas aún. Editá la auditoría para agregar tareas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topAcciones.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8,
              }}>
                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: task.status === 'done' ? '#4ade80' : task.status === 'inprogress' ? '#fbbf24' : T.border,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: task.status === 'done' ? T.textMuted : T.text,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{task.title}</div>
                </div>
                {/* Prioridad badge */}
                <div style={{
                  fontSize: 10, fontWeight: 700, color: prioColor(task.priority),
                  padding: '2px 8px', borderRadius: 10, border: `1px solid ${prioColor(task.priority)}44`,
                  textTransform: 'uppercase',
                }}>{task.priority || 'Media'}</div>
                {/* Status */}
                <div style={{
                  fontSize: 11, color: T.textMuted, minWidth: 70, textAlign: 'right',
                }}>
                  {task.status === 'done' ? '✅ Hecha' : task.status === 'inprogress' ? '🔄 En curso' : '🕐 Pendiente'}
                </div>
              </div>
            ))}
            {acciones.length > 5 && (
              <div style={{ textAlign: 'center', fontSize: 12, color: T.textMuted, paddingTop: 4 }}>
                +{acciones.length - 5} más en el módulo de Tareas
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── KPIs Maestros ─────────────────────────────────────────────────────── */}
      <div style={{
        background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>📈 KPIs Maestros</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
              Métricas clave del mes vs mes anterior
            </div>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowKpisEditor(true)}
              style={{
                padding: '7px 16px', borderRadius: 8,
                border: `1px solid ${T.border}`, background: T.bg2,
                color: T.text, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >✏️ Editar valores</button>
          )}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12,
        }}>
          {kpis.map(k => {
            const delta = calcDelta(k.mes_anterior, k.mes_actual);
            const dc = deltaColor(delta, k.is_inverted);
            const sign = deltaSign(delta);
            return (
              <div key={k.id} style={{
                background: T.bg, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '16px 18px',
              }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontWeight: 600 }}>
                  {k.nombre}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 4 }}>
                  {k.mes_actual || <span style={{ color: T.textMuted, fontSize: 14, fontWeight: 400 }}>Sin datos</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {delta !== null && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: dc }}>
                      {sign}{delta.toFixed(1)}%
                    </span>
                  )}
                  {k.mes_anterior && (
                    <span style={{ fontSize: 11, color: T.textMuted }}>vs {k.mes_anterior}</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>
                  Objetivo: {k.objetivo}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modales ───────────────────────────────────────────────────────────── */}
      {showEditor && auditoria && (
        <AuditoriaEditor
          auditoria={auditoria}
          apartadoIdActivo={editorAptId}
          onClose={() => { setShowEditor(false); setEditorAptId(null); }}
          onSaved={() => { refresh(); onTasksChanged?.(); }}
          allUsers={allUsers}
          accountId={account?.id}
          T={T}
        />
      )}

      {showKpisEditor && auditoria && (
        <KpisMaestrosEditor
          auditoria={auditoria}
          onClose={() => setShowKpisEditor(false)}
          onSaved={() => refresh()}
          T={T}
        />
      )}
    </div>
  );
}
