import { supabase, isSupabaseConfigured } from './supabase.js';

const LS_KEY = 'eb_saved_reports_v1';

function lsLoad() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

function lsSave(reports) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(reports));
  } catch (e) {
    if (e.name === 'QuotaExceededError') throw e;
  }
}

function lsId() {
  return 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function loadReports() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) return data;
  }
  return lsLoad().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

export async function createReport(name, config) {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('saved_reports')
      .insert({ name, config })
      .select()
      .single();
    if (!error && data) return data;
  }
  const report = { id: lsId(), name, config, created_at: now, updated_at: now };
  const reports = lsLoad();
  reports.unshift(report);
  lsSave(reports);
  return report;
}

export async function updateReport(id, config) {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('saved_reports')
      .update({ config, updated_at: now })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data;
  }
  const reports = lsLoad();
  const idx = reports.findIndex(r => r.id === id);
  if (idx >= 0) {
    reports[idx] = { ...reports[idx], config, updated_at: now };
    lsSave(reports);
    return reports[idx];
  }
  return null;
}

export async function renameReport(id, name) {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('saved_reports')
      .update({ name, updated_at: now })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data;
  }
  const reports = lsLoad();
  const idx = reports.findIndex(r => r.id === id);
  if (idx >= 0) {
    reports[idx] = { ...reports[idx], name, updated_at: now };
    lsSave(reports);
    return reports[idx];
  }
  return null;
}

export async function deleteReport(id) {
  if (isSupabaseConfigured) {
    await supabase.from('saved_reports').delete().eq('id', id);
    return;
  }
  lsSave(lsLoad().filter(r => r.id !== id));
}

export async function duplicateReport(id) {
  const reports = await loadReports();
  const src = reports.find(r => r.id === id);
  if (!src) return null;
  let name = `${src.name} (2)`;
  let n = 2;
  while (reports.some(r => r.name === name)) { n++; name = `${src.name} (${n})`; }
  return createReport(name, src.config);
}
