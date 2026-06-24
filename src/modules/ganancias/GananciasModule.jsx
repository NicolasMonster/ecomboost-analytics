// src/modules/ganancias/GananciasModule.jsx
import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt    = n => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n || 0);
const fmtPct = n => `${(n || 0).toFixed(1)}%`;

function getDateRange(periodo) {
  const today = new Date();
  const to    = today.toISOString().split("T")[0];
  const from  = new Date();
  if (periodo === "hoy") {
    return { from: to, to };
  } else if (periodo === "semana") {
    from.setDate(today.getDate() - 6);
  } else {
    from.setDate(1); // primer día del mes actual
  }
  return { from: from.toISOString().split("T")[0], to };
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function GananciasModule({ account, currentUser, T, onAccountUpdated }) {
  const [tab, setTab]         = useState("resumen");
  const [periodo, setPeriodo] = useState("mes");

  // ── Data
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas]       = useState([]);
  const [loadingP, setLoadingP]   = useState(true);
  const [loadingV, setLoadingV]   = useState(true);
  const [error, setError]         = useState(null);

  // ── Modales
  const [modalProducto, setModalProducto] = useState(false);
  const [modalVenta, setModalVenta]       = useState(false);
  const [savingP, setSavingP]             = useState(false);
  const [savingV, setSavingV]             = useState(false);
  const [editProducto, setEditProducto]   = useState(null);

  // ── TN Integration state
  const [tnStoreId, setTnStoreId]   = useState("");
  const [tnToken, setTnToken]       = useState("");
  const [tnSaving, setTnSaving]     = useState(false);
  const [tnSyncing, setTnSyncing]   = useState(false);
  const [tnSyncMsg, setTnSyncMsg]   = useState(null); // {type:"ok"|"error", text}
  const [tnShowForm, setTnShowForm] = useState(false);

  // ── Forms
  const emptyProd  = { sku: "", nombre: "", categoria: "", proveedor: "", costo: "", precio: "", stock: "", descripcion: "", url: "" };
  const emptyVenta = { fecha: new Date().toISOString().split("T")[0], cliente: "", email: "", orden_id: "", sku: "", qty: "1", monto: "" };
  const [prodForm, setProdForm]   = useState(emptyProd);
  const [ventaForm, setVentaForm] = useState(emptyVenta);
  const [busqueda, setBusqueda]   = useState("");

  const canEdit   = currentUser?.role === "master" || currentUser?.role === "team";
  const isMaster  = currentUser?.role === "master";
  const accountId = account?.id;

  // ─── Estado real de integraciones ──────────────────────────────────────────
  const metaConectado = !!(account?.meta_token);
  const tnConectado   = !!(account?.tiendanube_token && account?.tiendanube_store_id);
  const mpConectado   = false; // placeholder

  // ─── Fetch productos ─────────────────────────────────────────────────────────
  const fetchProductos = useCallback(async () => {
    if (!accountId || !isSupabaseConfigured) { setLoadingP(false); return; }
    setLoadingP(true);
    try {
      const { data, error } = await supabase.from("productos").select("*").eq("account_id", accountId).order("nombre");
      if (error) throw error;
      setProductos(data || []);
    } catch (e) { setError(e.message); }
    finally { setLoadingP(false); }
  }, [accountId]);

  // ─── Fetch ventas filtradas por período ──────────────────────────────────────
  const fetchVentas = useCallback(async () => {
    if (!accountId || !isSupabaseConfigured) { setLoadingV(false); return; }
    setLoadingV(true);
    try {
      const { from, to } = getDateRange(periodo);
      const { data, error } = await supabase.from("ventas").select("*")
        .eq("account_id", accountId)
        .gte("fecha", from).lte("fecha", to)
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setVentas(data || []);
    } catch (e) { setError(e.message); }
    finally { setLoadingV(false); }
  }, [accountId, periodo]);

  useEffect(() => { fetchProductos(); }, [fetchProductos]);
  useEffect(() => { fetchVentas(); },    [fetchVentas]);

  // ─── Guardar producto ────────────────────────────────────────────────────────
  const guardarProducto = async () => {
    if (!prodForm.sku || !prodForm.nombre || !prodForm.costo) return;
    setSavingP(true);
    try {
      const payload = {
        account_id: accountId,
        sku: prodForm.sku.trim().toUpperCase(),
        nombre: prodForm.nombre.trim(),
        categoria: prodForm.categoria.trim(),
        proveedor: prodForm.proveedor.trim(),
        costo: Number(prodForm.costo) || 0,
        precio: Number(prodForm.precio) || 0,
        stock: Number(prodForm.stock) || 0,
        descripcion: prodForm.descripcion.trim(),
        url: prodForm.url.trim(),
        activo: true,
      };
      if (editProducto) {
        const { error } = await supabase.from("productos").update(payload).eq("id", editProducto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("productos").insert(payload);
        if (error) throw error;
      }
      await fetchProductos();
      setProdForm(emptyProd); setEditProducto(null); setModalProducto(false);
    } catch (e) { alert("Error: " + e.message); }
    finally { setSavingP(false); }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    await supabase.from("productos").delete().eq("id", id).catch(() => {});
    await fetchProductos();
  };

  const toggleActivo = async (prod) => {
    await supabase.from("productos").update({ activo: !prod.activo }).eq("id", prod.id).catch(() => {});
    await fetchProductos();
  };

  // ─── Guardar venta manual ────────────────────────────────────────────────────
  const guardarVenta = async () => {
    if (!ventaForm.sku || !ventaForm.monto) return;
    setSavingV(true);
    try {
      const prod = productos.find(p => p.sku.toUpperCase() === ventaForm.sku.trim().toUpperCase());
      const qty  = Number(ventaForm.qty) || 1;
      const cogs = prod ? prod.costo * qty : 0;
      const { error } = await supabase.from("ventas").insert({
        account_id: accountId,
        fecha: ventaForm.fecha,
        cliente: ventaForm.cliente.trim(),
        email: ventaForm.email.trim(),
        orden_id: ventaForm.orden_id.trim(),
        sku: ventaForm.sku.trim().toUpperCase(),
        producto: prod?.nombre || ventaForm.sku,
        qty, monto: Number(ventaForm.monto) || 0, cogs,
      });
      if (error) throw error;
      await fetchVentas();
      setVentaForm(emptyVenta); setModalVenta(false);
    } catch (e) { alert("Error: " + e.message); }
    finally { setSavingV(false); }
  };

  // ─── Conectar Tienda Nube ────────────────────────────────────────────────────
  const conectarTiendaNube = async () => {
    if (!tnStoreId.trim() || !tnToken.trim()) return;
    setTnSaving(true);
    try {
      const { error } = await supabase.from("accounts").update({
        tiendanube_store_id: tnStoreId.trim(),
        tiendanube_token:    tnToken.trim(),
      }).eq("id", accountId);
      if (error) throw error;
      onAccountUpdated?.({ ...account, tiendanube_store_id: tnStoreId.trim(), tiendanube_token: tnToken.trim() });
      setTnShowForm(false);
      setTnSyncMsg({ type: "ok", text: "Tienda Nube conectada correctamente." });
    } catch (e) {
      setTnSyncMsg({ type: "error", text: "Error al guardar: " + e.message });
    } finally { setTnSaving(false); }
  };

  const desconectarTN = async () => {
    if (!window.confirm("¿Desconectar Tienda Nube?")) return;
    await supabase.from("accounts").update({ tiendanube_store_id: null, tiendanube_token: null }).eq("id", accountId).catch(() => {});
    onAccountUpdated?.({ ...account, tiendanube_store_id: null, tiendanube_token: null });
    setTnSyncMsg(null);
  };

  // ─── Sincronizar ventas desde Tienda Nube ────────────────────────────────────
  const sincronizarTN = async () => {
    if (!account?.tiendanube_store_id || !account?.tiendanube_token) return;
    setTnSyncing(true);
    setTnSyncMsg(null);
    try {
      const { from, to } = getDateRange(periodo);
      const res = await fetch("/api/tiendanube-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: account.tiendanube_store_id,
          token:    account.tiendanube_token,
          from_date: from,
          to_date:   to,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error desconocido");

      const ventasRaw = json.ventas || [];
      if (ventasRaw.length === 0) {
        setTnSyncMsg({ type: "ok", text: "No hay órdenes nuevas en este período." });
        setTnSyncing(false); return;
      }

      // Buscar orden_ids ya existentes para no duplicar
      const ordenIds = [...new Set(ventasRaw.map(v => v.orden_id))];
      const { data: existing } = await supabase.from("ventas")
        .select("orden_id, sku")
        .eq("account_id", accountId)
        .in("orden_id", ordenIds);
      const existingKeys = new Set((existing || []).map(e => `${e.orden_id}__${e.sku}`));

      // Calcular COGS y filtrar duplicados
      const nuevas = ventasRaw
        .filter(v => !existingKeys.has(`${v.orden_id}__${v.sku}`))
        .map(v => {
          const prod = productos.find(p => p.sku.toUpperCase() === (v.sku || "").toUpperCase());
          return { ...v, account_id: accountId, cogs: prod ? prod.costo * v.qty : 0 };
        });

      if (nuevas.length === 0) {
        setTnSyncMsg({ type: "ok", text: "Todo sincronizado — no hay ventas nuevas." });
        setTnSyncing(false); return;
      }

      const { error } = await supabase.from("ventas").insert(nuevas);
      if (error) throw error;

      await fetchVentas();
      setTnSyncMsg({ type: "ok", text: `✓ ${nuevas.length} venta${nuevas.length !== 1 ? "s" : ""} importada${nuevas.length !== 1 ? "s" : ""} desde Tienda Nube.` });
    } catch (e) {
      setTnSyncMsg({ type: "error", text: "Error: " + e.message });
    } finally { setTnSyncing(false); }
  };

  // ─── Métricas ────────────────────────────────────────────────────────────────
  const totalVentas    = ventas.reduce((s, v) => s + Number(v.monto), 0);
  const totalCogs      = ventas.reduce((s, v) => s + Number(v.cogs), 0);
  const gananciaNeta   = totalVentas - totalCogs;
  const margen         = totalVentas > 0 ? (gananciaNeta / totalVentas) * 100 : 0;
  const pedidos        = ventas.length;
  const ticketPromedio = pedidos > 0 ? Math.round(totalVentas / pedidos) : 0;

  const topProductos = Object.values(
    ventas.reduce((acc, v) => {
      const k = v.sku;
      if (!acc[k]) acc[k] = { sku: k, producto: v.producto, ganancia: 0, ventas: 0 };
      acc[k].ganancia += Number(v.monto) - Number(v.cogs);
      acc[k].ventas   += Number(v.monto);
      return acc;
    }, {})
  ).sort((a, b) => b.ganancia - a.ganancia);

  const ventasFiltradas = ventas.filter(v => {
    const q = busqueda.toLowerCase();
    return !q || v.cliente?.toLowerCase().includes(q) || v.sku?.toLowerCase().includes(q) || v.producto?.toLowerCase().includes(q) || v.orden_id?.toLowerCase().includes(q);
  });

  const loading = loadingP || loadingV;

  const card    = { background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" };
  const inputSt = { background: T.bg2, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };

  const TABS = [
    { id: "resumen",       label: "Resumen",       icon: "📊" },
    { id: "ventas",        label: "Ventas",         icon: "🧾" },
    { id: "productos",     label: "Productos",      icon: "📦" },
    { id: "integraciones", label: "Integraciones",  icon: "🔌" },
  ];

  if (!account) return (
    <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 14 }}>
      Seleccioná una cuenta para ver las ganancias.
    </div>
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>💸 Ganancias</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>{account.name}</span>
            {metaConectado && (
              <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: T.ok.bg, color: T.ok.text, border: `1px solid ${T.ok.border}`, fontWeight: 600 }}>
                📢 Meta {account.meta_ad_account_id}
              </span>
            )}
            {tnConectado && (
              <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: T.ok.bg, color: T.ok.text, border: `1px solid ${T.ok.border}`, fontWeight: 600 }}>
                🛍️ TN #{account.tiendanube_store_id}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {tnConectado && (tab === "ventas" || tab === "resumen") && (
            <button onClick={sincronizarTN} disabled={tnSyncing} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.ok.border}`,
              background: T.ok.bg, color: T.ok.text, fontSize: 13, fontWeight: 700,
              cursor: tnSyncing ? "default" : "pointer", opacity: tnSyncing ? 0.7 : 1,
            }}>
              {tnSyncing ? "⏳ Sincronizando..." : "↻ Sync TN"}
            </button>
          )}
          {canEdit && tab === "ventas" && (
            <button onClick={() => { setVentaForm(emptyVenta); setModalVenta(true); }} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.bg2, color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>+ Venta manual</button>
          )}
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            style={{ ...inputSt, width: "auto", cursor: "pointer", padding: "8px 14px" }}>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>
        </div>
      </div>

      {/* ── Mensaje sync TN ───────────────────────────────────────────────────── */}
      {tnSyncMsg && (
        <div style={{
          padding: "11px 16px", borderRadius: 10, marginBottom: 16, fontSize: 13,
          background: tnSyncMsg.type === "ok" ? T.ok.bg : T.bad.bg,
          border: `1px solid ${tnSyncMsg.type === "ok" ? T.ok.border : T.bad.border}`,
          color: tnSyncMsg.type === "ok" ? T.ok.text : T.bad.text,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {tnSyncMsg.text}
          <button onClick={() => setTnSyncMsg(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16, padding: 0, opacity: 0.7 }}>×</button>
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: T.bad.bg, border: `1px solid ${T.bad.border}`, borderRadius: 10, color: T.bad.text, fontSize: 13, marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "transparent", border: "none",
            borderBottom: tab === t.id ? "2px solid #e8572a" : "2px solid transparent",
            color: tab === t.id ? "#e8572a" : T.textMuted,
            padding: "9px 18px", fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
            cursor: "pointer", transition: "all 0.15s", marginBottom: -1, whiteSpace: "nowrap",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 80, background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, opacity: 0.4 }} />)}
        </div>
      ) : (
        <>
          {/* ══ RESUMEN ═════════════════════════════════════════════════════════ */}
          {tab === "resumen" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 20 }}>
                <StatCard T={T} label="Total generado"  value={fmt(totalVentas)}    sub={`${pedidos} venta${pedidos !== 1 ? "s" : ""}`} />
                <StatCard T={T} label="Costo productos" value={fmt(totalCogs)}       sub={totalVentas > 0 ? `${fmtPct((totalCogs/totalVentas)*100)} del ingreso` : "—"} />
                <StatCard T={T} label="Ganancia neta"   value={fmt(gananciaNeta)}    sub={`Margen: ${fmtPct(margen)}`} subColor={T.ok.text} highlight />
                <StatCard T={T} label="Ticket promedio" value={fmt(ticketPromedio)}  sub={`${pedidos} pedido${pedidos !== 1 ? "s" : ""}`} />
              </div>

              {ventas.length === 0 ? (
                <EmptyState T={T} icon="🧾"
                  msg="No hay ventas en este período."
                  sub={tnConectado ? "Usá '↻ Sync TN' para importar las ventas de Tienda Nube." : "Conectá Tienda Nube o cargá ventas manuales."} />
              ) : (
                <>
                  <div style={{ ...card, marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Desglose del período</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <Row T={T} label="Ingresos totales"            value={fmt(totalVentas)} />
                      <Row T={T} label="− Costo de productos (COGS)" value={`− ${fmt(totalCogs)}`} valueColor={T.bad.text} />
                      <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                      <Row T={T} label="Ganancia neta"               value={fmt(gananciaNeta)} bold valueColor={T.ok.text} />
                    </div>
                  </div>

                  {topProductos.length > 0 && (
                    <div style={card}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Top productos por ganancia</div>
                      {topProductos.map((p, i) => (
                        <div key={p.sku} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: i < topProductos.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: i === 0 ? "#e8572a22" : T.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: i === 0 ? "#e8572a" : T.textMuted }}>{i + 1}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.producto}</div>
                              <div style={{ fontSize: 11, color: T.textMuted }}>{p.sku}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.ok.text }}>{fmt(p.ganancia)}</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>{fmt(p.ventas)} en ventas</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ══ VENTAS ══════════════════════════════════════════════════════════ */}
          {tab === "ventas" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <input placeholder="Buscar por cliente, SKU, producto u orden..." value={busqueda}
                  onChange={e => setBusqueda(e.target.value)} style={{ ...inputSt, flex: 1, minWidth: 200 }} />
                <button style={{ background: T.bg2, border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>⬇ Exportar</button>
              </div>

              {ventas.length === 0 ? (
                <EmptyState T={T} icon="🧾" msg="No hay ventas en este período."
                  sub={canEdit ? "Usá '↻ Sync TN' o '+ Venta manual'." : "Sin ventas registradas."} />
              ) : (
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg2 }}>
                          {["Fecha","Cliente","Orden","Producto (SKU)","Cant.","Monto","COGS","Ganancia"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ventasFiltradas.map(v => {
                          const ganancia = Number(v.monto) - Number(v.cogs);
                          const margenV  = v.monto > 0 ? ((ganancia / v.monto) * 100).toFixed(0) : 0;
                          return (
                            <tr key={v.id} style={{ borderBottom: `1px solid ${T.border}`, transition: "background 0.1s" }}
                              onMouseEnter={e => e.currentTarget.style.background = T.hover}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "11px 14px", color: T.textMuted, whiteSpace: "nowrap" }}>{v.fecha}</td>
                              <td style={{ padding: "11px 14px" }}>
                                <div style={{ fontWeight: 600, color: T.text }}>{v.cliente || "—"}</div>
                                {v.email && <div style={{ fontSize: 11, color: T.textMuted }}>{v.email}</div>}
                              </td>
                              <td style={{ padding: "11px 14px", color: T.textDim, fontSize: 12 }}>{v.orden_id || "—"}</td>
                              <td style={{ padding: "11px 14px" }}>
                                <span style={{ color: T.text }}>{v.producto}</span>
                                <span style={{ marginLeft: 6, fontSize: 11, color: T.textMuted, background: T.bg2, padding: "2px 7px", borderRadius: 4 }}>{v.sku}</span>
                              </td>
                              <td style={{ padding: "11px 14px", textAlign: "center", color: T.textMuted }}>{v.qty}</td>
                              <td style={{ padding: "11px 14px", fontWeight: 600, color: T.text }}>{fmt(v.monto)}</td>
                              <td style={{ padding: "11px 14px", color: T.bad.text }}>{fmt(v.cogs)}</td>
                              <td style={{ padding: "11px 14px" }}>
                                <span style={{ background: ganancia >= 0 ? T.ok.bg : T.bad.bg, color: ganancia >= 0 ? T.ok.text : T.bad.text, border: `1px solid ${ganancia >= 0 ? T.ok.border : T.bad.border}`, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                                  {fmt(ganancia)} <span style={{ opacity: 0.6, fontSize: 10 }}>({margenV}%)</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: `2px solid ${T.border}`, background: T.bg2 }}>
                          <td colSpan={5} style={{ padding: "10px 14px", fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{ventasFiltradas.length} venta{ventasFiltradas.length !== 1 ? "s" : ""}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: T.text }}>{fmt(ventasFiltradas.reduce((s,v)=>s+Number(v.monto),0))}</td>
                          <td style={{ padding: "10px 14px", fontWeight: 700, color: T.bad.text }}>{fmt(ventasFiltradas.reduce((s,v)=>s+Number(v.cogs),0))}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ background: T.ok.bg, color: T.ok.text, border: `1px solid ${T.ok.border}`, padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                              {fmt(ventasFiltradas.reduce((s,v)=>s+(Number(v.monto)-Number(v.cogs)),0))}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 12, color: T.textDim, marginTop: 10 }}>
                ℹ El COGS se calcula cruzando el SKU de cada venta con el costo cargado en Productos.
              </div>
            </div>
          )}

          {/* ══ PRODUCTOS ═══════════════════════════════════════════════════════ */}
          {tab === "productos" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 13, color: T.textMuted }}>{productos.length} producto{productos.length !== 1 ? "s" : ""} en catálogo</div>
                {canEdit && (
                  <button onClick={() => { setProdForm(emptyProd); setEditProducto(null); setModalProducto(true); }}
                    style={{ background: "#e8572a", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    + Nuevo producto
                  </button>
                )}
              </div>

              {productos.length === 0 ? (
                <EmptyState T={T} icon="📦" msg="No hay productos en el catálogo."
                  sub={canEdit ? "Agregá el primer producto para calcular el COGS automáticamente." : "Sin productos registrados."} />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
                  {productos.map(p => {
                    const margenP   = p.precio > 0 ? ((p.precio - p.costo) / p.precio * 100).toFixed(0) : 0;
                    const stockBajo = p.activo && p.stock < 20;
                    return (
                      <div key={p.id} style={{ ...card, padding: 16 }}>
                        <div style={{ width: "100%", height: 64, background: T.bg2, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 26 }}>📦</div>
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>SKU: {p.sku}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{p.nombre}</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8 }}>{fmt(p.costo)} costo · {p.proveedor || "—"}</div>
                        {p.precio > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: T.ok.text, marginBottom: 8 }}>{margenP}% margen · PVP {fmt(p.precio)}</div>}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, fontWeight: 600, background: !p.activo ? T.bg2 : stockBajo ? T.warn.bg : T.ok.bg, color: !p.activo ? T.textMuted : stockBajo ? T.warn.text : T.ok.text, border: `1px solid ${!p.activo ? T.border : stockBajo ? T.warn.border : T.ok.border}` }}>
                            {!p.activo ? "Inactivo" : stockBajo ? `⚠ Stock ${p.stock}` : `Stock ${p.stock}`}
                          </span>
                          {canEdit && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => { setProdForm({ sku: p.sku, nombre: p.nombre, categoria: p.categoria, proveedor: p.proveedor, costo: p.costo, precio: p.precio, stock: p.stock, descripcion: p.descripcion, url: p.url }); setEditProducto(p); setModalProducto(true); }}
                                style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>✏️</button>
                              <button onClick={() => toggleActivo(p)}
                                style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 13, padding: "2px 4px" }}>{p.activo ? "⏸" : "▶"}</button>
                              <button onClick={() => eliminarProducto(p.id)}
                                style={{ background: "none", border: "none", color: T.bad.text, cursor: "pointer", fontSize: 14, padding: "2px 4px" }}>🗑</button>
                            </div>
                          )}
                        </div>
                        {p.categoria && <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>{p.categoria}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ INTEGRACIONES ═══════════════════════════════════════════════════ */}
          {tab === "integraciones" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* ── Meta Ads ── */}
              <div style={{ ...card }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: T.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📢</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Meta Ads</span>
                      {metaConectado
                        ? <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: T.ok.bg, color: T.ok.text, border: `1px solid ${T.ok.border}`, fontWeight: 600 }}>✓ Conectado</span>
                        : <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: T.bg2, color: T.textMuted, border: `1px solid ${T.border}`, fontWeight: 600 }}>Sin conectar</span>
                      }
                    </div>
                    {metaConectado
                      ? <div style={{ fontSize: 12, color: T.textMuted }}>Cuenta publicitaria: <span style={{ fontWeight: 600, color: T.text }}>{account.meta_ad_account_id}</span> · El gasto se sincroniza desde el Dashboard.</div>
                      : <div style={{ fontSize: 12, color: T.textMuted }}>Importa gasto diario en publicidad para calcular ROAS automático por campaña.</div>
                    }
                  </div>
                  {!metaConectado && isMaster && (
                    <a href="#" onClick={e => { e.preventDefault(); }} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "#e8572a", color: "#fff", fontWeight: 700, textDecoration: "none", flexShrink: 0, cursor: "pointer" }}>
                      Configurar en Ajustes
                    </a>
                  )}
                </div>
              </div>

              {/* ── Tienda Nube ── */}
              <div style={{ ...card }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: T.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🛍️</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Tienda Nube</span>
                      {tnConectado
                        ? <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: T.ok.bg, color: T.ok.text, border: `1px solid ${T.ok.border}`, fontWeight: 600 }}>✓ Conectado</span>
                        : <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: T.bad.bg, color: T.bad.text, border: `1px solid ${T.bad.border}`, fontWeight: 600 }}>Sin conectar</span>
                      }
                    </div>

                    {tnConectado ? (
                      <div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>
                          Store ID: <span style={{ fontWeight: 600, color: T.text }}>{account.tiendanube_store_id}</span> · Las ventas pagadas se importan automáticamente con el botón "↻ Sync TN".
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={sincronizarTN} disabled={tnSyncing} style={{ padding: "7px 16px", borderRadius: 7, border: `1px solid ${T.ok.border}`, background: T.ok.bg, color: T.ok.text, fontSize: 12, fontWeight: 700, cursor: tnSyncing ? "default" : "pointer", opacity: tnSyncing ? 0.7 : 1 }}>
                            {tnSyncing ? "Sincronizando..." : "↻ Sincronizar ventas"}
                          </button>
                          {isMaster && (
                            <button onClick={desconectarTN} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "none", color: T.bad.text, fontSize: 12, cursor: "pointer" }}>
                              Desconectar
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>
                          Sincronizá ventas pagadas automáticamente cruzando el SKU con tu catálogo para calcular el COGS.
                        </div>
                        {canEdit && (
                          !tnShowForm ? (
                            <button onClick={() => setTnShowForm(true)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "#e8572a", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              Conectar Tienda Nube
                            </button>
                          ) : (
                            <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginTop: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>Credenciales de Tienda Nube</div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                <div>
                                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, display: "block", marginBottom: 4 }}>Store ID *</label>
                                  <input value={tnStoreId} onChange={e => setTnStoreId(e.target.value)}
                                    placeholder="Ej: 1234567" style={inputSt} />
                                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 3 }}>Número en tu URL de TN admin</div>
                                </div>
                                <div>
                                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, display: "block", marginBottom: 4 }}>Access Token *</label>
                                  <input value={tnToken} onChange={e => setTnToken(e.target.value)}
                                    placeholder="tu_access_token" type="password" style={inputSt} />
                                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 3 }}>Desde TN → API → Mis Aplicaciones</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={conectarTiendaNube} disabled={tnSaving || !tnStoreId || !tnToken} style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#e8572a", color: "#fff", fontSize: 12, fontWeight: 700, cursor: tnSaving ? "default" : "pointer", opacity: (!tnStoreId || !tnToken || tnSaving) ? 0.6 : 1 }}>
                                  {tnSaving ? "Guardando…" : "Guardar y conectar"}
                                </button>
                                <button onClick={() => setTnShowForm(false)} style={{ padding: "8px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: "none", color: T.textMuted, fontSize: 12, cursor: "pointer" }}>Cancelar</button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── MercadoPago ── */}
              <div style={{ ...card, opacity: 0.7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 10, background: T.bg2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>💳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>MercadoPago</span>
                      <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: T.bg2, color: T.textMuted, border: `1px solid ${T.border}`, fontWeight: 600 }}>Próximamente</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted }}>Registrará cobros y descontará comisiones automáticamente del ingreso neto.</div>
                  </div>
                </div>
              </div>

              {/* Guía Store ID */}
              <div style={card}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e8572a", marginBottom: 14 }}>🔧 Cómo obtener el Store ID y Token de Tienda Nube</div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.textMuted, lineHeight: 2.1 }}>
                  <li>Entrá a tu admin de Tienda Nube</li>
                  <li>El Store ID es el número que aparece en la URL: <code style={{ background: T.bg2, padding: "1px 7px", borderRadius: 4, color: T.warn.text, fontSize: 12 }}>admin.tiendanube.com/123456/</code></li>
                  <li>Para el Token: Configuración → Aplicaciones y canales de venta → Mis aplicaciones</li>
                  <li>Creá o copiá el Access Token de la aplicación EcomBoost</li>
                </ol>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ MODAL: Producto ══════════════════════════════════════════════════════ */}
      {modalProducto && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
          <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{editProducto ? "✏️ Editar producto" : "📦 Nuevo producto"}</div>
              <button onClick={() => { setModalProducto(false); setEditProducto(null); }} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { key: "sku",       label: "SKU *",           placeholder: "Ej: GC-01" },
                { key: "nombre",    label: "Nombre *",        placeholder: "Nombre del producto" },
                { key: "categoria", label: "Categoría",       placeholder: "Ej: Suplementos" },
                { key: "proveedor", label: "Proveedor",       placeholder: "Nombre del proveedor" },
                { key: "costo",     label: "Costo unitario *",placeholder: "0", type: "number" },
                { key: "precio",    label: "Precio de venta", placeholder: "0", type: "number" },
                { key: "stock",     label: "Stock actual",    placeholder: "0", type: "number" },
                { key: "url",       label: "URL del producto",placeholder: "https://..." },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</label>
                  <input type={type || "text"} placeholder={placeholder} value={prodForm[key]}
                    onChange={e => setProdForm(f => ({ ...f, [key]: e.target.value }))} style={inputSt} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>Descripción</label>
              <textarea placeholder="Descripción opcional..." value={prodForm.descripcion}
                onChange={e => setProdForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2} style={{ ...inputSt, resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => { setModalProducto(false); setEditProducto(null); }} style={{ flex: 1, background: "none", border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardarProducto} disabled={savingP} style={{ flex: 1, background: "#e8572a", border: "none", color: "#fff", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: savingP ? "default" : "pointer", opacity: savingP ? 0.7 : 1 }}>
                {savingP ? "Guardando…" : editProducto ? "Guardar cambios" : "Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Venta manual ══════════════════════════════════════════════════ */}
      {modalVenta && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
          <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 460 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>🧾 Nueva venta</div>
              <button onClick={() => setModalVenta(false)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { key: "fecha",    label: "Fecha",         type: "date" },
                { key: "orden_id", label: "N° Orden",      placeholder: "Ej: TN-10421" },
                { key: "cliente",  label: "Cliente",       placeholder: "Nombre del cliente" },
                { key: "email",    label: "Email",         placeholder: "cliente@mail.com" },
                { key: "sku",      label: "SKU *",         placeholder: "Ej: GC-01" },
                { key: "qty",      label: "Cantidad *",    type: "number", placeholder: "1" },
                { key: "monto",    label: "Monto total *", type: "number", placeholder: "0" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</label>
                  <input type={type || "text"} placeholder={placeholder} value={ventaForm[key]}
                    onChange={e => setVentaForm(f => ({ ...f, [key]: e.target.value }))} style={inputSt} />
                </div>
              ))}
            </div>
            {ventaForm.sku && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: T.bg2, borderRadius: 8, fontSize: 12, color: T.textMuted }}>
                {(() => { const p = productos.find(x => x.sku.toUpperCase() === ventaForm.sku.trim().toUpperCase()); const qty = Number(ventaForm.qty)||1; return p ? `COGS calculado: ${fmt(p.costo * qty)} (${fmt(p.costo)} × ${qty} u.)` : "SKU no encontrado — COGS quedará en $0."; })()}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setModalVenta(false)} style={{ flex: 1, background: "none", border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardarVenta} disabled={savingV} style={{ flex: 1, background: "#e8572a", border: "none", color: "#fff", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 700, cursor: savingV ? "default" : "pointer", opacity: savingV ? 0.7 : 1 }}>
                {savingV ? "Guardando…" : "Registrar venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ T, label, value, sub, subColor, highlight }) {
  return (
    <div style={{ background: highlight ? T.ok.bg : T.bg1, border: `1px solid ${highlight ? T.ok.border : T.border}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: highlight ? T.ok.text : T.text, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor || T.textMuted }}>{sub}</div>
    </div>
  );
}

function Row({ T, label, value, bold, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "center" }}>
      <span style={{ color: T.textMuted }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, color: valueColor || T.text }}>{value}</span>
    </div>
  );
}

function EmptyState({ T, icon, msg, sub }) {
  return (
    <div style={{ padding: "48px 20px", textAlign: "center", color: T.textMuted }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 6 }}>{msg}</div>
      <div style={{ fontSize: 13 }}>{sub}</div>
    </div>
  );
}
