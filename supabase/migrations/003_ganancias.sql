-- ═══════════════════════════════════════════════════════════════════════════════
-- 003_ganancias.sql — Módulo Ganancias
-- EcomBoost Analytics
-- ═══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- PRODUCTOS: catálogo de productos por cuenta
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  text NOT NULL,
  sku         text NOT NULL,
  nombre      text NOT NULL,
  categoria   text DEFAULT '',
  proveedor   text DEFAULT '',
  costo       numeric(12,2) DEFAULT 0,
  precio      numeric(12,2) DEFAULT 0,
  stock       integer DEFAULT 0,
  descripcion text DEFAULT '',
  url         text DEFAULT '',
  activo      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (account_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_productos_account ON public.productos(account_id);

-- ────────────────────────────────────────────────────────────────────────────
-- VENTAS: registro de ventas por cuenta
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ventas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  text NOT NULL,
  fecha       date NOT NULL DEFAULT CURRENT_DATE,
  cliente     text DEFAULT '',
  email       text DEFAULT '',
  orden_id    text DEFAULT '',
  sku         text NOT NULL,
  producto    text DEFAULT '',
  qty         integer DEFAULT 1,
  monto       numeric(12,2) DEFAULT 0,
  cogs        numeric(12,2) DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ventas_account ON public.ventas(account_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha   ON public.ventas(fecha);

-- ────────────────────────────────────────────────────────────────────────────
-- TRIGGERS updated_at
-- ────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_productos_updated_at ON public.productos;
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON public.productos
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "productos_select" ON public.productos;
DROP POLICY IF EXISTS "productos_write"  ON public.productos;
CREATE POLICY "productos_select" ON public.productos FOR SELECT
  USING (has_account_access(account_id));
CREATE POLICY "productos_write"  ON public.productos FOR ALL
  USING (can_write_audit());

ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ventas_select" ON public.ventas;
DROP POLICY IF EXISTS "ventas_write"  ON public.ventas;
CREATE POLICY "ventas_select" ON public.ventas FOR SELECT
  USING (has_account_access(account_id));
CREATE POLICY "ventas_write"  ON public.ventas FOR ALL
  USING (can_write_audit());
