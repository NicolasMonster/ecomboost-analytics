import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verificar que el caller es un usuario master autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "No autorizado" }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) return json({ error: "No autorizado" }, 401);

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "master") {
      return json({ error: "Solo los usuarios master pueden gestionar usuarios" }, 403);
    }

    const body = await req.json();
    const { action } = body;

    // ─── CREAR USUARIO ────────────────────────────────────────────────────────
    if (action === "create") {
      const { name, email, password, role, accountIds } = body;

      if (!email || !password) return json({ error: "Email y contraseña son requeridos" }, 400);

      const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (createError) return json({ error: createError.message }, 400);

      const uid = newUser.id;

      await supabaseAdmin.from("profiles").upsert({ id: uid, email, name, role });

      if (accountIds?.length > 0) {
        await supabaseAdmin
          .from("account_access")
          .insert(accountIds.map((aid: string) => ({ profile_id: uid, account_id: aid })));
      }

      return json({ id: uid });
    }

    // ─── ELIMINAR USUARIO ─────────────────────────────────────────────────────
    if (action === "delete") {
      const { userId } = body;
      if (!userId) return json({ error: "userId requerido" }, 400);

      await supabaseAdmin.from("account_access").delete().eq("profile_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("id", userId);
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (delError) return json({ error: delError.message }, 400);

      return json({ ok: true });
    }

    return json({ error: "Acción desconocida" }, 400);

  } catch (e) {
    return json({ error: e.message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
