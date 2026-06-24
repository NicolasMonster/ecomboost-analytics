// src/modules/auditoria/helpers.js

// REGLA: scores siempre enteros 1-5. Promedio redondeado con Math.round()

export function calcScoreApartado(subitems) {
  const scored = (subitems || []).filter(s => s.score != null);
  if (scored.length === 0) return 0;
  return Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length);
}

export function calcScoreGlobal(apartados) {
  const scores = (apartados || []).map(a => calcScoreApartado(a.subitems)).filter(s => s > 0);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function stateColor(score, mode = 'dark') {
  if (mode === 'dark') {
    if (score <= 1) return '#f87171';
    if (score === 2) return '#fca5a5';
    if (score === 3) return '#fbbf24';
    if (score === 4) return '#a3e635';
    return '#4ade80';
  }
  if (score <= 1) return '#dc2626';
  if (score === 2) return '#ef4444';
  if (score === 3) return '#a16207';
  if (score === 4) return '#65a30d';
  return '#16a34a';
}

export function stateLabel(score) {
  if (!score || score === 0) return 'SIN DATOS';
  if (score <= 1) return 'CRÍTICO';
  if (score === 2) return 'DEFICIENTE';
  if (score === 3) return 'ACEPTABLE';
  if (score === 4) return 'BUENO';
  return 'EXCELENTE';
}

export function prioColor(prioridad) {
  if (prioridad === 'Alta')  return '#f87171';
  if (prioridad === 'Media') return '#fbbf24';
  return '#888';
}

export function parseNumKpi(str) {
  if (!str) return null;
  const cleaned = String(str).replace(/[$\s.]/g, '').replace(',', '.').replace(/[x%]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function calcDelta(mesAnterior, mesActual) {
  const a = parseNumKpi(mesAnterior);
  const b = parseNumKpi(mesActual);
  if (a === null || b === null || a === 0) return null;
  return ((b - a) / a) * 100;
}

export function deltaColor(delta, isInverted) {
  if (delta === null) return '#888';
  if (isInverted) return delta < 0 ? '#4ade80' : delta > 0 ? '#f87171' : '#888';
  return delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#888';
}

export function deltaSign(delta) {
  if (delta === null) return '';
  return delta > 0 ? '+' : '';
}
