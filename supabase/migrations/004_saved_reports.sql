-- ═══════════════════════════════════════════════════════════════════════════════
-- 004_saved_reports.sql — Persistencia de Reportes Personalizados
-- EcomBoost Analytics
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.saved_reports (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  config     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_reports_updated ON public.saved_reports(updated_at DESC);

-- Auto-update updated_at usando la función ya existente
DROP TRIGGER IF EXISTS trg_saved_reports_updated_at ON public.saved_reports;
CREATE TRIGGER trg_saved_reports_updated_at
  BEFORE UPDATE ON public.saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS: acceso completo para anon y authenticated (la app usa anon key sin auth de Supabase)
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_reports_anon"  ON public.saved_reports;
DROP POLICY IF EXISTS "saved_reports_auth"  ON public.saved_reports;

CREATE POLICY "saved_reports_anon" ON public.saved_reports
  FOR ALL TO anon        USING (true) WITH CHECK (true);
CREATE POLICY "saved_reports_auth" ON public.saved_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
