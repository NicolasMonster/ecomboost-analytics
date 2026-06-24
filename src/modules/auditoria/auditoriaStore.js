// src/modules/auditoria/auditoriaStore.js
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { APARTADOS_PLANTILLA, KPIS_MAESTROS_PLANTILLA } from './plantillaMaestra';

// ─── OBTENER AUDITORÍA CON TODO EL ÁRBOL ─────────────────────────────────────
export async function getAuditoria(accountId, mes) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('auditorias')
    .select(`
      *,
      apartados (
        *,
        subitems (*)
      ),
      kpis_maestros (*)
    `)
    .eq('account_id', accountId)
    .eq('mes_auditado', mes)
    .maybeSingle();
  if (error) throw error;

  // Ordenar subitems dentro de cada apartado
  if (data?.apartados) {
    data.apartados.sort((a, b) => a.orden - b.orden);
    data.apartados.forEach(ap => {
      if (ap.subitems) ap.subitems.sort((a, b) => a.orden - b.orden);
    });
  }
  if (data?.kpis_maestros) {
    data.kpis_maestros.sort((a, b) => a.orden - b.orden);
  }
  return data;
}

// ─── CREAR AUDITORÍA DESDE PLANTILLA ─────────────────────────────────────────
export async function createAuditoria(accountId, mes, auditorId) {
  // Buscar última auditoría previa para precargar valores anteriores de KPIs
  const { data: ultima } = await supabase
    .from('auditorias')
    .select('id, kpis_maestros (orden, mes_actual)')
    .eq('account_id', accountId)
    .lt('mes_auditado', mes)
    .order('mes_auditado', { ascending: false })
    .limit(1)
    .maybeSingle();

  const valoresAnteriores = {};
  ultima?.kpis_maestros?.forEach(k => { valoresAnteriores[k.orden] = k.mes_actual; });

  // 1. Crear auditoría
  const { data: audit, error: e1 } = await supabase
    .from('auditorias')
    .insert({ account_id: accountId, mes_auditado: mes, auditor_id: auditorId })
    .select()
    .single();
  if (e1) throw e1;

  // 2. Crear apartados
  const { data: apartados, error: e2 } = await supabase
    .from('apartados')
    .insert(APARTADOS_PLANTILLA.map((a, idx) => ({
      auditoria_id: audit.id,
      numero: a.numero,
      nombre: a.nombre,
      descripcion: a.descripcion,
      icono: a.icono,
      orden: idx,
    })))
    .select();
  if (e2) throw e2;

  // 3. Crear subitems
  const subitemsToInsert = [];
  apartados.forEach(apt => {
    const plantilla = APARTADOS_PLANTILLA.find(p => p.numero === apt.numero);
    plantilla.subitems.forEach((titulo, idx) => {
      subitemsToInsert.push({
        apartado_id: apt.id,
        titulo,
        orden: idx,
        score: null,
        estado_actual: '',
      });
    });
  });
  await supabase.from('subitems').insert(subitemsToInsert);

  // 4. Crear KPIs maestros
  await supabase.from('kpis_maestros').insert(
    KPIS_MAESTROS_PLANTILLA.map(k => ({
      auditoria_id: audit.id,
      nombre: k.nombre,
      definicion: k.definicion,
      objetivo: k.objetivo,
      orden: k.orden,
      is_inverted: k.is_inverted,
      mes_anterior: valoresAnteriores[k.orden] || '',
      mes_actual: '',
    }))
  );

  return getAuditoria(accountId, mes);
}

// ─── UPDATES ─────────────────────────────────────────────────────────────────
export async function updateSubitem(id, fields) {
  const { error } = await supabase.from('subitems').update(fields).eq('id', id);
  if (error) throw error;
}

export async function updateApartado(id, fields) {
  const { error } = await supabase.from('apartados').update(fields).eq('id', id);
  if (error) throw error;
}

export async function updateAuditoria(id, fields) {
  const { error } = await supabase.from('auditorias').update(fields).eq('id', id);
  if (error) throw error;
}

export async function updateKpi(id, fields) {
  const { error } = await supabase.from('kpis_maestros').update(fields).eq('id', id);
  if (error) throw error;
}

// ─── ACCIONES = TASKS (clave de la integración) ───────────────────────────────
export async function upsertAccion(subitem, fields, accountId) {
  // fields = { descripcion, responsable_id, deadline, impacto, prioridad }

  if (subitem.task_id) {
    const { error } = await supabase.from('tasks').update({
      title: fields.descripcion,
      priority: fields.prioridad,
      assignee_id: fields.responsable_id || null,
      due_date: fields.deadline || null,
    }).eq('id', subitem.task_id);
    if (error) throw error;

    await supabase.from('subitems').update({ impacto: fields.impacto }).eq('id', subitem.id);
    return subitem.task_id;
  }

  // Crear task nueva (tasks.id es text)
  const newTaskId = crypto.randomUUID();   // string UUID, compatible con text
  const { error } = await supabase.from('tasks').insert({
    id: newTaskId,
    title: fields.descripcion,
    description: 'Originada en auditoría',
    status: 'todo',
    priority: fields.prioridad,
    type: 'team',
    assignee_id: fields.responsable_id || null,
    account_id: accountId,
    due_date: fields.deadline || null,
    origen: 'auditoria',
    subitem_id: subitem.id,
  });
  if (error) throw error;

  await supabase.from('subitems').update({
    task_id: newTaskId,
    impacto: fields.impacto,
  }).eq('id', subitem.id);

  return newTaskId;
}

export async function removeAccion(subitem) {
  if (!subitem.task_id) return;
  await supabase.from('tasks').delete().eq('id', subitem.task_id);
  await supabase.from('subitems').update({ task_id: null, impacto: '' }).eq('id', subitem.id);
}

// ─── SUBITEMS CUSTOM ─────────────────────────────────────────────────────────
export async function addSubitem(apartadoId, titulo, orden) {
  const { data, error } = await supabase
    .from('subitems')
    .insert({ apartado_id: apartadoId, titulo, orden, score: null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubitem(id) {
  const { data: sub } = await supabase.from('subitems').select('task_id').eq('id', id).single();
  if (sub?.task_id) await supabase.from('tasks').delete().eq('id', sub.task_id);
  const { error } = await supabase.from('subitems').delete().eq('id', id);
  if (error) throw error;
}
