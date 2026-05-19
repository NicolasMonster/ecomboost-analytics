-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     text NOT NULL,
  name      text NOT NULL DEFAULT '',
  role      text NOT NULL DEFAULT 'team' CHECK (role IN ('master','team','client')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Función helper: devuelve true si el usuario actual es master (SECURITY DEFINER evita recursión)
CREATE OR REPLACE FUNCTION public.is_master()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'master' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Policies para profiles
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_master" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_master" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_master" ON public.profiles;

CREATE POLICY "profiles_select_own"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_master" ON public.profiles FOR SELECT USING (is_master());
CREATE POLICY "profiles_update_own"    ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_master" ON public.profiles FOR UPDATE USING (is_master());
CREATE POLICY "profiles_delete_master" ON public.profiles FOR DELETE USING (is_master());
-- INSERT solo vía service role (Edge Function) — no se necesita policy de INSERT para el cliente


-- ─── ACCOUNT ACCESS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_access (
  id         bigserial PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, account_id)
);

ALTER TABLE public.account_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_select_own"    ON public.account_access;
DROP POLICY IF EXISTS "access_select_master" ON public.account_access;
DROP POLICY IF EXISTS "access_insert_master" ON public.account_access;
DROP POLICY IF EXISTS "access_delete_master" ON public.account_access;

CREATE POLICY "access_select_own"    ON public.account_access FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "access_select_master" ON public.account_access FOR SELECT USING (is_master());
CREATE POLICY "access_insert_master" ON public.account_access FOR INSERT WITH CHECK (is_master());
CREATE POLICY "access_delete_master" ON public.account_access FOR DELETE USING (is_master());


-- ─── ACCOUNTS ────────────────────────────────────────────────────────────────
-- Asegurarse de que RLS esté activo (la tabla probablemente ya existe)
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts_select_auth"  ON public.accounts;
DROP POLICY IF EXISTS "accounts_write_master" ON public.accounts;

-- Cualquier usuario autenticado puede leer cuentas (el filtro por acceso se hace en la app)
CREATE POLICY "accounts_select_auth"  ON public.accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "accounts_write_master" ON public.accounts FOR ALL   USING (is_master());
