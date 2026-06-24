-- ═══════════════════════════════════════════════════════════════════════════════
-- 002_auditoria.sql — Módulo Auditoría de Funnel
-- EcomBoost Analytics
-- ═══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- AUDITORÍAS: una por cliente por mes
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auditorias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      text NOT NULL,
  mes_auditado    text NOT NULL,                  -- '2026-05'
  fecha_auditoria date NOT NULL DEFAULT CURRENT_DATE,
  auditor_id      uuid REFERENCES public.profiles(id),
  diagnostico     text DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (account_id, mes_auditado)
);
CREATE INDEX IF NOT EXISTS idx_auditorias_account ON public.auditorias(account_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_mes    ON public.auditorias(mes_auditado);

-- ────────────────────────────────────────────────────────────────────────────
-- APARTADOS: los 4 puntos del funnel
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apartados (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id    uuid NOT NULL REFERENCES public.auditorias(id) ON DELETE CASCADE,
  numero          smallint NOT NULL,
  nombre          text NOT NULL,
  descripcion     text DEFAULT '',
  icono           text DEFAULT '🎯',
  orden           smallint NOT NULL,
  created_at      timestamptz DEFAULT now(),
  UNIQUE (auditoria_id, numero)
);
CREATE INDEX IF NOT EXISTS idx_apartados_auditoria ON public.apartados(auditoria_id);

-- ────────────────────────────────────────────────────────────────────────────
-- SUB-ÍTEMS: el checklist de cada apartado
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subitems (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartado_id     uuid NOT NULL REFERENCES public.apartados(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  estado_actual   text DEFAULT '',
  score           smallint CHECK (score BETWEEN 1 AND 5),
  orden           smallint NOT NULL,
  task_id         text REFERENCES public.tasks(id) ON DELETE SET NULL,
  impacto         text DEFAULT '',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subitems_apartado ON public.subitems(apartado_id);
CREATE INDEX IF NOT EXISTS idx_subitems_task     ON public.subitems(task_id);

-- ────────────────────────────────────────────────────────────────────────────
-- KPIS MAESTROS: 6 por auditoría
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kpis_maestros (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auditoria_id    uuid NOT NULL REFERENCES public.auditorias(id) ON DELETE CASCADE,
  nombre          text NOT NULL,
  definicion      text DEFAULT '',
  objetivo        text DEFAULT '',
  mes_anterior    text DEFAULT '',
  mes_actual      text DEFAULT '',
  orden           smallint NOT NULL,
  is_inverted     boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE (auditoria_id, orden)
);
CREATE INDEX IF NOT EXISTS idx_kpis_auditoria ON public.kpis_maestros(auditoria_id);

-- ────────────────────────────────────────────────────────────────────────────
-- AMPLIAR tabla tasks: origen + link a subitem
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS origen text DEFAULT 'manual'
  CHECK (origen IN ('manual', 'auditoria'));
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subitem_id uuid
  REFERENCES public.subitems(id) ON DELETE SET NULL;
-- (subitem_id es uuid porque subitems.id es uuid)
CREATE INDEX IF NOT EXISTS idx_tasks_subitem ON public.tasks(subitem_id);

-- ────────────────────────────────────────────────────────────────────────────
-- TRIGGERS de updated_at
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_auditorias_updated_at ON public.auditorias;
CREATE TRIGGER trg_auditorias_updated_at BEFORE UPDATE ON public.auditorias
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_subitems_updated_at ON public.subitems;
CREATE TRIGGER trg_subitems_updated_at BEFORE UPDATE ON public.subitems
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_kpis_updated_at ON public.kpis_maestros;
CREATE TRIGGER trg_kpis_updated_at BEFORE UPDATE ON public.kpis_maestros
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- RLS — sigue patrón de 001_setup.sql
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.has_account_access(p_account_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_master()
    OR EXISTS (SELECT 1 FROM public.account_access
               WHERE profile_id = auth.uid() AND account_id = p_account_id);
$$;

-- AUDITORIAS
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auditorias_select" ON public.auditorias;
DROP POLICY IF EXISTS "auditorias_write"  ON public.auditorias;
CREATE POLICY "auditorias_select" ON public.auditorias FOR SELECT
  USING (has_account_access(account_id));
CREATE POLICY "auditorias_write" ON public.auditorias FOR ALL
  USING (is_master() OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'team'));

-- APARTADOS
ALTER TABLE public.apartados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "apartados_select" ON public.apartados;
DROP POLICY IF EXISTS "apartados_write"  ON public.apartados;
CREATE POLICY "apartados_select" ON public.apartados FOR SELECT
  USING (EXISTS (SELECT 1 FROM auditorias a WHERE a.id = auditoria_id AND has_account_access(a.account_id)));
CREATE POLICY "apartados_write" ON public.apartados FOR ALL
  USING (is_master() OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'team'));

-- SUBITEMS
ALTER TABLE public.subitems ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subitems_select" ON public.subitems;
DROP POLICY IF EXISTS "subitems_write"  ON public.subitems;
CREATE POLICY "subitems_select" ON public.subitems FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM apartados ap
    JOIN auditorias a ON a.id = ap.auditoria_id
    WHERE ap.id = apartado_id AND has_account_access(a.account_id)
  ));
CREATE POLICY "subitems_write" ON public.subitems FOR ALL
  USING (is_master() OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'team'));

-- KPIS MAESTROS
ALTER TABLE public.kpis_maestros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kpis_select" ON public.kpis_maestros;
DROP POLICY IF EXISTS "kpis_write"  ON public.kpis_maestros;
CREATE POLICY "kpis_select" ON public.kpis_maestros FOR SELECT
  USING (EXISTS (SELECT 1 FROM auditorias a WHERE a.id = auditoria_id AND has_account_access(a.account_id)));
CREATE POLICY "kpis_write" ON public.kpis_maestros FOR ALL
  USING (is_master() OR EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'team'));
