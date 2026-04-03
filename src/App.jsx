import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from "recharts";


// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────

let _toastFn = null;
export function toast(msg, type = "success") { if (_toastFn) _toastFn(msg, type); }

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _toastFn = useCallback((msg, type) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 10, minWidth: 260, maxWidth: 360,
          background: t.type === "error" ? "#2d0a0a" : t.type === "warn" ? "#2a1f00" : "#0a2e1a",
          border: `1px solid ${t.type === "error" ? "#991b1b" : t.type === "warn" ? "#854d0e" : "#166534"}`,
          color: t.type === "error" ? "#f87171" : t.type === "warn" ? "#fbbf24" : "#4ade80",
          fontSize: 13, fontFamily: "'Inter',system-ui,sans-serif",
          animation: "slideIn 0.2s ease",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <span style={{ fontSize: 15 }}>{t.type === "error" ? "✗" : t.type === "warn" ? "⚠" : "✓"}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.6, fontSize: 16, padding: 0 }}>×</button>
        </div>
      ))}
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 20, radius = 6 }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: "linear-gradient(90deg,#1c1e22 25%,#252830 50%,#1c1e22 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
  );
}
function DashboardSkeleton() {
  return (
    <div style={{ padding: "18px 22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, marginBottom: 20 }}>
        {[...Array(5)].map((_, i) => <div key={i} style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 10, padding: "13px 15px" }}><Skeleton h={10} w="60%" radius={4} /><div style={{ marginTop: 10 }}><Skeleton h={26} radius={4} /></div></div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10, marginBottom: 20 }}>
        {[...Array(3)].map((_, i) => <div key={i} style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 10, padding: "13px 15px" }}><Skeleton h={10} w="60%" radius={4} /><div style={{ marginTop: 10 }}><Skeleton h={26} radius={4} /></div></div>)}
      </div>
      <div style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <Skeleton h={14} w="200px" radius={4} />
        <div style={{ marginTop: 16 }}><Skeleton h={185} radius={8} /></div>
      </div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

// ─── MOBILE HEADER ────────────────────────────────────────────────────────────
function MobileHeader({ account, onMenu, onPDF }) {
  return (
    <div className="mobile-header" style={{ display: "none", alignItems: "center", gap: 10, padding: "12px 16px", background: "#111215", borderBottom: "1px solid #1c1e22", position: "sticky", top: 0, zIndex: 20 }}>
      <button onClick={onMenu} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 20, padding: 0 }}>☰</button>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: account?.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>{account?.logo}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0" }}>{account?.name}</div>
      </div>
      <button onClick={onPDF} style={{ padding: "6px 12px", background: "#e8572a", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>PDF</button>
    </div>
  );
}

// ─── MOBILE SIDEBAR OVERLAY ───────────────────────────────────────────────────
function MobileSidebarOverlay({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div style={{ width: 260, background: "#111215", borderLeft: "1px solid #1c1e22", height: "100%", overflowY: "auto", position: "absolute", left: 0, top: 0, bottom: 0 }}>
        {children}
      </div>
    </div>
  );
}


// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ROLE_LABEL = { master: "Master", team: "Equipo", client: "Cliente" };
const ROLE_COLOR = { master: "#e8572a", team: "#60a5fa", client: "#a78bfa" };
const PRIORITY_COLOR = { high: "#f87171", medium: "#fbbf24", low: "#4ade80" };
const PRIORITY_LABEL = { high: "Alta", medium: "Media", low: "Baja" };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function sc(v, g, inv = false) {
  const r = inv ? g / v : v / g;
  if (r >= 1) return { bg: "#0a2e1a", text: "#4ade80", border: "#166534" };
  if (r >= 0.85) return { bg: "#2a1f00", text: "#fbbf24", border: "#854d0e" };
  return { bg: "#2d0a0a", text: "#f87171", border: "#991b1b" };
}

function fN(v, t) {
  if (t === "$") return `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;
  if (t === "%") return `${Number(v).toFixed(1)}%`;
  if (t === "x") return `${Number(v).toFixed(1)}x`;
  if (t === "k") {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
    return String(Math.round(v));
  }
  return String(v);
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const USERS = [
  { id: "u1", name: "Nico",             email: "nico@elevatearg.com",    role: "master", avatar: "N",  accounts: ["act_001","act_002","act_003"] },
  { id: "u2", name: "Tomas",            email: "tomas@elevatearg.com",   role: "team",   avatar: "T",  accounts: ["act_001","act_002","act_003"] },
  { id: "u3", name: "Cliente Ruby",     email: "cliente@ruby.com",       role: "client", avatar: "CR", accounts: ["act_002"] },
  { id: "u4", name: "Cliente Elemental",email: "cliente@elemental.com",  role: "client", avatar: "CE", accounts: ["act_003"] },
];

const ACCOUNTS = [
  {
    id: "act_001", name: "Powernax", color: "#e8572a", logo: "PX",
    goals: { roas: 3.5, cpa: 6.0, ctr: 1.8, budget: 2500 },
    funnel: {
      creativos: { alcance: 142000, impresiones: 801000, ctrUnico: 7.22, clicsEnlace: 6535, cpm: 2130 },
      acciones:  { addToCart: 913, pagosIniciados: 242, costoPagosIniciados: 7053 },
      conversion:{ inversion: 1840, facturacion: 7360, costoCompra: 5.2, roas: 4.0, conversiones: 354 },
    },
    daily: [
      { day: "Lun", spend: 263, revenue: 1051, roas: 4.0, conversions: 51 },
      { day: "Mar", spend: 280, revenue: 1176, roas: 4.2, conversions: 54 },
      { day: "Mié", spend: 245, revenue: 980,  roas: 4.0, conversions: 47 },
      { day: "Jue", spend: 271, revenue: 1138, roas: 4.2, conversions: 53 },
      { day: "Vie", spend: 310, revenue: 1333, roas: 4.3, conversions: 61 },
      { day: "Sáb", spend: 258, revenue: 955,  roas: 3.7, conversions: 50 },
      { day: "Dom", spend: 213, revenue: 727,  roas: 3.4, conversions: 38 },
    ],
    campaigns: [
      { id:"c1", name:"Proteinas - ABO Testing",   status:"ACTIVE", spend:420,  revenue:1890, roas:4.5, cpa:4.8, ctr:2.4, conversions:88  },
      { id:"c2", name:"Quemadores - CBO Scale",    status:"ACTIVE", spend:680,  revenue:2584, roas:3.8, cpa:5.6, ctr:2.1, conversions:121 },
      { id:"c3", name:"Aminoacidos - Retargeting", status:"ACTIVE", spend:310,  revenue:1364, roas:4.4, cpa:4.9, ctr:1.9, conversions:63  },
      { id:"c4", name:"Creatina - Testing",        status:"PAUSED", spend:240,  revenue:720,  roas:3.0, cpa:6.9, ctr:1.5, conversions:35  },
      { id:"c5", name:"Brand Awareness Q1",        status:"ACTIVE", spend:190,  revenue:802,  roas:4.2, cpa:5.4, ctr:1.8, conversions:35  },
    ],
  },
  {
    id: "act_002", name: "Ruby Fajas", color: "#d63384", logo: "RB",
    goals: { roas: 4.0, cpa: 8.0, ctr: 2.0, budget: 3200 },
    funnel: {
      creativos: { alcance: 220000, impresiones: 1200000, ctrUnico: 5.8, clicsEnlace: 9600, cpm: 2480 },
      acciones:  { addToCart: 1420, pagosIniciados: 398, costoPagosIniciados: 7490 },
      conversion:{ inversion: 2980, facturacion: 10430, costoCompra: 9.4, roas: 3.5, conversiones: 317 },
    },
    daily: [
      { day: "Lun", spend: 426, revenue: 1490, roas: 3.5, conversions: 45 },
      { day: "Mar", spend: 455, revenue: 1638, roas: 3.6, conversions: 49 },
      { day: "Mié", spend: 390, revenue: 1365, roas: 3.5, conversions: 41 },
      { day: "Jue", spend: 442, revenue: 1593, roas: 3.6, conversions: 48 },
      { day: "Vie", spend: 510, revenue: 1836, roas: 3.6, conversions: 55 },
      { day: "Sáb", spend: 398, revenue: 1393, roas: 3.5, conversions: 42 },
      { day: "Dom", spend: 359, revenue: 1115, roas: 3.1, conversions: 37 },
    ],
    campaigns: [
      { id:"c6", name:"Fajas Colombianas - Scale", status:"ACTIVE", spend:1200, revenue:4200, roas:3.5, cpa:9.8,  ctr:1.7, conversions:122 },
      { id:"c7", name:"Body Shapers - ABO Test",   status:"ACTIVE", spend:890,  revenue:2938, roas:3.3, cpa:9.1,  ctr:1.5, conversions:98  },
      { id:"c8", name:"Retargeting Abandonos",     status:"ACTIVE", spend:560,  revenue:2240, roas:4.0, cpa:8.0,  ctr:1.9, conversions:70  },
      { id:"c9", name:"Brasil - Prospecting",      status:"PAUSED", spend:330,  revenue:1052, roas:3.2, cpa:11.0, ctr:1.4, conversions:30  },
    ],
  },
  {
    id: "act_003", name: "Elemental Outfit", color: "#198754", logo: "EO",
    goals: { roas: 3.0, cpa: 12.0, ctr: 1.5, budget: 1200 },
    funnel: {
      creativos: { alcance: 71000, impresiones: 310000, ctrUnico: 4.9, clicsEnlace: 2800, cpm: 2870 },
      acciones:  { addToCart: 340, pagosIniciados: 102, costoPagosIniciados: 8730 },
      conversion:{ inversion: 890, facturacion: 2847, costoCompra: 11.1, roas: 3.2, conversiones: 80 },
    },
    daily: [
      { day: "Lun", spend: 127, revenue: 406, roas: 3.2, conversions: 11 },
      { day: "Mar", spend: 140, revenue: 476, roas: 3.4, conversions: 13 },
      { day: "Mié", spend: 119, revenue: 393, roas: 3.3, conversions: 11 },
      { day: "Jue", spend: 128, revenue: 422, roas: 3.3, conversions: 12 },
      { day: "Vie", spend: 155, revenue: 527, roas: 3.4, conversions: 14 },
      { day: "Sáb", spend: 110, revenue: 352, roas: 3.2, conversions: 10 },
      { day: "Dom", spend: 111, revenue: 271, roas: 2.4, conversions: 9  },
    ],
    campaigns: [
      { id:"c10", name:"Ropa Hombre - ABO",      status:"ACTIVE", spend:440, revenue:1496, roas:3.4, cpa:11.0, ctr:1.8, conversions:40 },
      { id:"c11", name:"Nueva Coleccion - Test",  status:"ACTIVE", spend:280, revenue:896,  roas:3.2, cpa:10.0, ctr:1.6, conversions:28 },
      { id:"c12", name:"Retargeting General",     status:"ACTIVE", spend:170, revenue:612,  roas:3.6, cpa:9.4,  ctr:1.9, conversions:18 },
    ],
  },
];

const CREATIVES = {
  act_001: [
    { id:"cr1", name:"Proteina Whey — UGC Testimonio",    campaign:"Proteinas - ABO Testing",  type:"VIDEO", thumb:"💪", color:"#e8572a", hookRate:38.2, ctr:3.1, cpm:1820, frecuencia:1.4, alcance:28000, clics:868,  conversions:72,  cpa:4.2, spend:302,  revenue:1512, roas:5.0, impressions:39200 },
    { id:"cr2", name:"Proteina Whey — Producto Plano",    campaign:"Proteinas - ABO Testing",  type:"IMAGE", thumb:"📦", color:"#f59e0b", hookRate:21.4, ctr:1.8, cpm:2140, frecuencia:1.9, alcance:18000, clics:324,  conversions:28,  cpa:7.1, spend:199,  revenue:672,  roas:3.4, impressions:34200 },
    { id:"cr3", name:"Quemador Fat Burn — Antes/Después", campaign:"Quemadores - CBO Scale",   type:"IMAGE", thumb:"🔥", color:"#dc2626", hookRate:44.7, ctr:3.8, cpm:1650, frecuencia:1.2, alcance:42000, clics:1596, conversions:118, cpa:3.9, spend:460,  revenue:2124, roas:4.6, impressions:50400 },
    { id:"cr4", name:"Quemador — Reels Lifestyle",        campaign:"Quemadores - CBO Scale",   type:"VIDEO", thumb:"🎬", color:"#8b5cf6", hookRate:29.1, ctr:2.2, cpm:2310, frecuencia:2.1, alcance:22000, clics:484,  conversions:38,  cpa:5.8, spend:220,  revenue:684,  roas:3.1, impressions:46200 },
    { id:"cr5", name:"Aminoácidos — Comparativa",         campaign:"Aminoacidos - Retargeting",type:"IMAGE", thumb:"⚗️",color:"#0891b2", hookRate:18.9, ctr:2.6, cpm:1980, frecuencia:2.8, alcance:14000, clics:364,  conversions:48,  cpa:4.4, spend:211,  revenue:912,  roas:4.3, impressions:39200 },
    { id:"cr6", name:"Creatina — Demo en Gym",            campaign:"Creatina - Testing",       type:"VIDEO", thumb:"🏋️",color:"#059669", hookRate:52.3, ctr:2.9, cpm:1720, frecuencia:1.1, alcance:19000, clics:551,  conversions:44,  cpa:3.6, spend:158,  revenue:704,  roas:4.5, impressions:20900 },
  ],
  act_002: [
    { id:"cr7",  name:"Faja Colombiana — Video Unboxing", campaign:"Fajas Colombianas - Scale",type:"VIDEO", thumb:"📦", color:"#d63384", hookRate:41.0, ctr:2.8, cpm:2100, frecuencia:1.3, alcance:55000, clics:1540, conversions:98,  cpa:8.2,  spend:803,  revenue:2842, roas:3.5, impressions:71500 },
    { id:"cr8",  name:"Body Shaper — Reels Transición",   campaign:"Body Shapers - ABO Test",  type:"VIDEO", thumb:"✨", color:"#9333ea", hookRate:58.4, ctr:3.5, cpm:1890, frecuencia:1.1, alcance:68000, clics:2380, conversions:142, cpa:7.1,  spend:1008, revenue:3976, roas:3.9, impressions:74800 },
    { id:"cr9",  name:"Faja — Foto Producto Blanco",      campaign:"Fajas Colombianas - Scale",type:"IMAGE", thumb:"🤍", color:"#6366f1", hookRate:15.2, ctr:1.2, cpm:2650, frecuencia:2.4, alcance:32000, clics:384,  conversions:31,  cpa:12.9, spend:400,  revenue:868,  roas:2.2, impressions:76800 },
    { id:"cr10", name:"Retargeting — Carrito Abandonado", campaign:"Retargeting Abandonos",    type:"IMAGE", thumb:"🛒", color:"#f59e0b", hookRate:22.1, ctr:4.2, cpm:1420, frecuencia:3.1, alcance:18000, clics:756,  conversions:88,  cpa:6.4,  spend:563,  revenue:2464, roas:4.4, impressions:55800 },
  ],
  act_003: [
    { id:"cr11", name:"Remera Oversize — Lifestyle",      campaign:"Ropa Hombre - ABO",        type:"IMAGE", thumb:"👕", color:"#198754", hookRate:27.3, ctr:2.1, cpm:2800, frecuencia:1.6, alcance:28000, clics:588,  conversions:34,  cpa:10.3, spend:350,  revenue:952,  roas:2.7, impressions:44800 },
    { id:"cr12", name:"Nueva Colección — Lookbook Video", campaign:"Nueva Coleccion - Test",   type:"VIDEO", thumb:"🎥", color:"#0ea5e9", hookRate:35.8, ctr:2.8, cpm:2400, frecuencia:1.2, alcance:22000, clics:616,  conversions:29,  cpa:9.7,  spend:281,  revenue:812,  roas:2.9, impressions:26400 },
    { id:"cr13", name:"Retargeting — Descuento 15%",      campaign:"Retargeting General",      type:"IMAGE", thumb:"🏷️",color:"#f59e0b", hookRate:19.5, ctr:3.9, cpm:1680, frecuencia:2.9, alcance:12000, clics:468,  conversions:22,  cpa:7.7,  spend:169,  revenue:616,  roas:3.6, impressions:34800 },
  ],
};

const INIT_TASKS = [
  { id:"t1", title:"Revisar creativos semana 12",    desc:"Analizar hook rate y decidir cuáles escalar", status:"todo",       priority:"high",   assignee:"u2", account:"act_001", dueDate:"2025-03-22", type:"team"   },
  { id:"t2", title:"Subir nuevos creativos al BM",   desc:"4 videos nuevos para testear en ABO",        status:"inprogress", priority:"high",   assignee:"u1", account:"act_001", dueDate:"2025-03-21", type:"team"   },
  { id:"t3", title:"Ajustar presupuesto campañas",   desc:"CBO Scale subir de $300 a $450/día",         status:"todo",       priority:"medium", assignee:"u1", account:"act_002", dueDate:"2025-03-23", type:"team"   },
  { id:"t4", title:"Enviar reporte semanal",         desc:"PDF con resultados de la semana 11",         status:"done",       priority:"low",    assignee:"u2", account:"act_001", dueDate:"2025-03-18", type:"team"   },
  { id:"t5", title:"Aprobar nuevas imágenes",        desc:"Confirmar los 3 banners para retargeting",   status:"todo",       priority:"high",   assignee:"u3", account:"act_002", dueDate:"2025-03-22", type:"client" },
  { id:"t6", title:"Revisar landing page checkout",  desc:"Problema con el botón en mobile",            status:"inprogress", priority:"medium", assignee:"u3", account:"act_002", dueDate:"2025-03-24", type:"client" },
  { id:"t7", title:"Confirmar catálogo de productos",desc:"Actualizar feed de productos en Meta",       status:"todo",       priority:"medium", assignee:"u4", account:"act_003", dueDate:"2025-03-25", type:"client" },
  { id:"t8", title:"Pausar campaña awareness",       desc:"Budget reasignado a conversiones",           status:"done",       priority:"low",    assignee:"u1", account:"act_003", dueDate:"2025-03-17", type:"team"   },
];

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size = 14 }) {
  return (
    <span style={{ fontWeight: 800, fontSize: size, letterSpacing: "-0.5px", lineHeight: 1 }}>
      <span style={{ color: "#fff" }}>Ecom</span>
      <span style={{ color: "#e8572a" }}>Boost</span>
      <span style={{ color: "#444", fontWeight: 400, fontSize: size * 0.75 }}> analytics</span>
    </span>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  function handle() {
    const u = USERS.find(u => u.email === email);
    if (!u) { setErr("Usuario no encontrado"); return; }
    onLogin(u);
  }

  const inp = {
    width: "100%", background: "#0d0f12", border: "1px solid #2a2d35",
    borderRadius: 8, color: "#f0f0f0", padding: "12px 14px",
    fontSize: 14, outline: "none", boxSizing: "border-box"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f12", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ width: 380, padding: 40, background: "#111215", border: "1px solid #1c1e22", borderRadius: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "#e8572a", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 auto 16px" }}>E</div>
          <Logo size={18} />
          <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>Plataforma de análisis · Meta Ads</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Email</div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" style={inp} onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Contraseña</div>
          <input type="password" placeholder="••••••••" style={inp} onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        {err && <div style={{ fontSize: 12, color: "#f87171", marginBottom: 12, textAlign: "center" }}>{err}</div>}
        <button onClick={handle} style={{ width: "100%", padding: 13, background: "#e8572a", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Ingresar
        </button>
        <div style={{ marginTop: 20, background: "#0d0f12", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Usuarios demo</div>
          {USERS.map(u => (
            <div key={u.id} onClick={() => setEmail(u.email)} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", cursor: "pointer", borderBottom: "1px solid #1a1c20" }}>
              <span style={{ fontSize: 12, color: email === u.email ? "#f0f0f0" : "#666" }}>{u.name}</span>
              <span style={{ fontSize: 10, color: ROLE_COLOR[u.role], fontWeight: 600 }}>{ROLE_LABEL[u.role]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GOALS MODAL ──────────────────────────────────────────────────────────────
function GoalsModal({ account, onSave, onClose }) {
  const [form, setForm] = useState({ ...account.goals });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ background: "#16181c", border: "1px solid #2a2d35", borderRadius: 16, padding: 32, width: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Objetivos · {account.name}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>
        {[
          { k: "roas", l: "ROAS objetivo", s: "x" },
          { k: "cpa",  l: "CPA objetivo",  p: "$" },
          { k: "ctr",  l: "CTR objetivo",  s: "%" },
          { k: "budget",l:"Presupuesto diario", p: "$" },
        ].map(({ k, l, p, s }) => (
          <div key={k} style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>{l}</div>
            <div style={{ display: "flex", alignItems: "center", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 8, padding: "0 12px" }}>
              {p && <span style={{ color: "#444" }}>{p}</span>}
              <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))}
                style={{ flex: 1, background: "none", border: "none", color: "#f0f0f0", fontSize: 15, padding: "11px 8px", outline: "none" }} />
              {s && <span style={{ color: "#444" }}>{s}</span>}
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: "none", border: "1px solid #2a2d35", borderRadius: 8, color: "#666", cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ flex: 1, padding: 11, background: "#e8572a", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PHASE BLOCK ──────────────────────────────────────────────────────────────
function PhaseBlock({ color, title, metrics }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ background: color, borderRadius: 9, padding: "9px 16px", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }} className="phase-grid">
        {metrics.map(({ label, value, type, goal, inv, highlight }) => {
          const c = goal ? sc(value, goal, inv) : null;
          return (
            <div key={label} style={{ background: "#111215", border: `1px solid ${c ? c.border : "#1c1e22"}`, borderRadius: 10, padding: "13px 15px", position: "relative", overflow: "hidden" }}>
              {c && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: c.text, opacity: 0.65 }} />}
              <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7 }}>{label}</div>
              <div style={{ fontSize: 21, fontWeight: 700, fontFamily: "monospace", color: c ? c.text : highlight || "#e0e0e0" }}>{fN(value, type)}</div>
              {goal && <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>Obj: <span style={{ color: "#777" }}>{fN(goal, type)}</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PERF CHART ───────────────────────────────────────────────────────────────
function PerfChart({ daily, color }) {
  const [m, setM] = useState("roas");
  const opts = [["roas","ROAS",color],["revenue","Revenue","#60a5fa"],["spend","Gasto","#f59e0b"],["conversions","Conv.","#a78bfa"]];
  const act = opts.find(o => o[0] === m);
  return (
    <div>
      <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
        {opts.map(([k, l, c]) => (
          <button key={k} onClick={() => setM(k)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 11, background: m === k ? c + "20" : "none", borderColor: m === k ? c : "#2a2d35", color: m === k ? c : "#555" }}>{l}</button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={185}>
        <LineChart data={daily} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1c20" />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#555" }} axisLine={false} tickLine={false} width={34} />
          <Tooltip contentStyle={{ background: "#16181c", border: "1px solid #2a2d35", borderRadius: 7, fontSize: 12 }} labelStyle={{ color: "#888" }} itemStyle={{ color: act[2] }} />
          <Line type="monotone" dataKey={m} stroke={act[2]} strokeWidth={2.5} dot={{ fill: act[2], r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── CAMPAIGNS TABLE ──────────────────────────────────────────────────────────
function CampaignsTable({ campaigns, goals }) {
  const [filter, setFilter] = useState("ALL");
  const [sk, setSk] = useState("spend");
  const [sd, setSd] = useState(-1);

  const rows = useMemo(() => {
    let d = filter === "ALL" ? campaigns : campaigns.filter(c => c.status === filter);
    return [...d].sort((a, b) => (a[sk] - b[sk]) * sd);
  }, [campaigns, filter, sk, sd]);

  function sort(k) {
    if (k === "name" || k === "status") return;
    setSd(d => sk === k ? d * -1 : -1);
    setSk(k);
  }

  const th = { fontSize: 10, color: "#555", letterSpacing: "0.07em", textTransform: "uppercase", padding: "8px 10px", textAlign: "left", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" };
  const td = { padding: "10px 10px", fontSize: 12, borderBottom: "1px solid #1a1c20", verticalAlign: "middle" };

  function Bdg({ v, g, t, inv }) {
    const c = sc(v, g, inv);
    return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 5, padding: "2px 7px", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{fN(v, t)}</span>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["ALL","ACTIVE","PAUSED"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 11, background: filter === f ? "#e8572a" : "none", borderColor: filter === f ? "#e8572a" : "#2a2d35", color: filter === f ? "#fff" : "#555" }}>
            {f === "ALL" ? "Todas" : f === "ACTIVE" ? "Activas" : "Pausadas"}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#555", alignSelf: "center" }}>{rows.length} campañas</span>
      </div>
      <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #1c1e22" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#0d0f12" }}>
              {[["name","Campaña"],["status","Estado"],["spend","Gasto"],["revenue","Revenue"],["roas","ROAS"],["cpa","CPA"],["ctr","CTR"],["conversions","Conv."]].map(([k, l]) => (
                <th key={k} style={th} onClick={() => sort(k)}>{l}{sk === k ? (sd === -1 ? " ↓" : " ↑") : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} style={{ background: i % 2 === 0 ? "#111215" : "#0f1114" }}
                onMouseEnter={e => e.currentTarget.style.background = "#14161a"}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#111215" : "#0f1114"}>
                <td style={{ ...td, color: "#ddd", fontWeight: 500, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.name}</td>
                <td style={td}>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: row.status === "ACTIVE" ? "#0a2e1a" : "#1a1a1a", color: row.status === "ACTIVE" ? "#4ade80" : "#555", border: `1px solid ${row.status === "ACTIVE" ? "#166534" : "#2a2d35"}`, fontWeight: 600 }}>
                    {row.status === "ACTIVE" ? "Activa" : "Pausada"}
                  </span>
                </td>
                <td style={{ ...td, color: "#bbb" }}>${row.spend.toLocaleString()}</td>
                <td style={{ ...td, color: "#bbb" }}>${row.revenue.toLocaleString()}</td>
                <td style={td}><Bdg v={row.roas} g={goals.roas} t="x" /></td>
                <td style={td}><Bdg v={row.cpa} g={goals.cpa} t="$" inv={true} /></td>
                <td style={td}><Bdg v={row.ctr} g={goals.ctr} t="%" /></td>
                <td style={{ ...td, color: "#bbb" }}>{row.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CREATIVOS ────────────────────────────────────────────────────────────────
function HookBar({ value }) {
  const pct = Math.min(100, (value / 60) * 100);
  const color = value >= 40 ? "#4ade80" : value >= 25 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "#1c1e22", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: "monospace", color, minWidth: 36, textAlign: "right" }}>{value.toFixed(1)}%</span>
    </div>
  );
}

function CreativeCard({ cr, rank, goals, onClick, isWinner }) {
  const roasOk = cr.roas >= goals.roas;
  const cpaOk  = cr.cpa  <= goals.cpa;
  const ctrOk  = cr.ctr  >= goals.ctr;
  return (
    <div onClick={onClick}
      style={{ background: "#111215", border: `1px solid ${isWinner ? "#e8572a55" : "#1c1e22"}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.18s" }}
      onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${cr.color}55`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${isWinner ? "#e8572a55" : "#1c1e22"}`; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ height: 100, background: `linear-gradient(135deg,${cr.color}22,${cr.color}08)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, borderBottom: "1px solid #1c1e22", position: "relative" }}>
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 5 }}>
          <span style={{ background: "#0d0f12cc", border: "1px solid #2a2d35", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#888" }}>#{rank}</span>
          {isWinner && <span style={{ background: "#e8572a", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#fff" }}>★ TOP</span>}
        </div>
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <span style={{ background: cr.type === "VIDEO" ? "#1a1a2e" : "#1a2e1a", border: `1px solid ${cr.type === "VIDEO" ? "#4f46e5" : "#166534"}`, borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 700, color: cr.type === "VIDEO" ? "#818cf8" : "#4ade80" }}>{cr.type}</span>
        </div>
        <span style={{ position: "relative", zIndex: 1 }}>{cr.thumb}</span>
      </div>
      <div style={{ padding: "11px 13px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", marginBottom: 3, lineHeight: 1.3, height: 30, overflow: "hidden" }}>{cr.name}</div>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cr.campaign}</div>
        <div style={{ marginBottom: 9 }}>
          <div style={{ fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Hook Rate</div>
          <HookBar value={cr.hookRate} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 9 }}>
          {[{ l: "ROAS", v: fN(cr.roas, "x"), ok: roasOk }, { l: "CPA", v: fN(cr.cpa, "$"), ok: cpaOk }, { l: "CTR", v: fN(cr.ctr, "%"), ok: ctrOk }].map(({ l, v, ok }) => (
            <div key={l} style={{ background: ok ? "#0a2e1a" : "#2d0a0a", border: `1px solid ${ok ? "#166534" : "#991b1b"}`, borderRadius: 5, padding: "4px 5px", textAlign: "center" }}>
              <div style={{ fontSize: 8, color: ok ? "#4ade80" : "#f87171", textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "monospace", color: ok ? "#4ade80" : "#f87171" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
          <span>${cr.spend.toLocaleString()}</span>
          <span>{fN(cr.alcance, "k")} alc.</span>
          <span style={{ color: cr.frecuencia > 2.5 ? "#f87171" : "#666" }}>f {cr.frecuencia.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}

function CreativeDetail({ cr, goals, onClose }) {
  if (!cr) return null;
  const roasOk = cr.roas >= goals.roas;
  const cpaOk  = cr.cpa  <= goals.cpa;
  const ctrOk  = cr.ctr  >= goals.ctr;
  const radar = [
    { m: "Hook",   v: Math.round(cr.hookRate / 60 * 100) },
    { m: "CTR",    v: Math.round(cr.ctr / 5 * 100) },
    { m: "ROAS",   v: Math.round(cr.roas / 6 * 100) },
    { m: "Conv.",  v: Math.round(cr.conversions / 150 * 100) },
    { m: "CPA",    v: Math.round((1 - cr.cpa / 20) * 100) },
    { m: "Alcance",v: Math.round(cr.alcance / 80000 * 100) },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ background: "#111215", border: "1px solid #2a2d35", borderRadius: 18, width: "100%", maxWidth: 800, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "20px 22px 16px", borderBottom: "1px solid #1c1e22" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: `linear-gradient(135deg,${cr.color}30,${cr.color}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{cr.thumb}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0", marginBottom: 3 }}>{cr.name}</div>
            <div style={{ fontSize: 12, color: "#555" }}>{cr.campaign}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>
        <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 230px", gap: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Todas las métricas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {[
                { l: "Hook Rate",   v: `${cr.hookRate.toFixed(1)}%` },
                { l: "CTR",         v: `${cr.ctr.toFixed(1)}%` },
                { l: "CPM",         v: `$${cr.cpm.toLocaleString()}` },
                { l: "Frecuencia",  v: `${cr.frecuencia.toFixed(1)}x` },
                { l: "Alcance",     v: fN(cr.alcance, "k") },
                { l: "Impresiones", v: fN(cr.impressions, "k") },
                { l: "Clics",       v: cr.clics.toLocaleString() },
                { l: "Conversiones",v: cr.conversions },
                { l: "ROAS",        v: `${cr.roas.toFixed(1)}x` },
                { l: "CPA",         v: `$${cr.cpa.toFixed(2)}` },
                { l: "Gasto",       v: `$${cr.spend.toLocaleString()}` },
                { l: "Revenue",     v: `$${cr.revenue.toLocaleString()}` },
              ].map(({ l, v }) => (
                <div key={l} style={{ background: "#0d0f12", border: "1px solid #1c1e22", borderRadius: 7, padding: "9px 11px" }}>
                  <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace", color: "#ddd" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Score visual</div>
            <div style={{ background: "#0d0f12", border: "1px solid #1c1e22", borderRadius: 10, padding: "10px 6px", marginBottom: 10 }}>
              <ResponsiveContainer width="100%" height={190}>
                <RadarChart data={radar}>
                  <PolarGrid stroke="#1c1e22" />
                  <PolarAngleAxis dataKey="m" tick={{ fontSize: 9, fill: "#666" }} />
                  <Radar dataKey="v" stroke={cr.color} fill={cr.color} fillOpacity={0.18} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#0d0f12", border: "1px solid #1c1e22", borderRadius: 10, padding: 13 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Hook Rate</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "monospace", color: cr.hookRate >= 40 ? "#4ade80" : cr.hookRate >= 25 ? "#fbbf24" : "#f87171", marginBottom: 5 }}>{cr.hookRate.toFixed(1)}%</div>
              <HookBar value={cr.hookRate} />
              <div style={{ fontSize: 11, color: "#555", marginTop: 8, lineHeight: 1.5 }}>
                {cr.hookRate >= 40 ? "Excelente. Escalar." : cr.hookRate >= 25 ? "Buen hook. Testear variantes." : "Hook débil. Rediseñar primeros 3s."}
              </div>
            </div>
          </div>
        </div>
        <div style={{ margin: "0 22px 20px", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 10, padding: "13px 15px" }}>
          <div style={{ fontSize: 10, color: "#e8572a", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 5 }}>Recomendación</div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.7 }}>
            {cr.hookRate >= 40 && roasOk && cpaOk
              ? `★ Top performer. ROAS ${cr.roas.toFixed(1)}x con hook ${cr.hookRate.toFixed(0)}%. Mover a CBO de escala.`
              : !roasOk && cr.hookRate >= 35
              ? `Hook excelente pero ROAS bajo objetivo. Revisar landing y oferta.`
              : cr.hookRate < 25
              ? `Hook débil (${cr.hookRate.toFixed(0)}%). Rediseñar primeros 3 segundos.`
              : `Buen performance. Monitorear frecuencia (${cr.frecuencia.toFixed(1)}x).`}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreativosModule({ account, goals }) {
  const creatives = CREATIVES[account.id] || [];
  const [cf, setCf] = useState("TODAS");
  const [tf, setTf] = useState("ALL");
  const [sb, setSb] = useState("roas");
  const [sel, setSel] = useState(null);

  const camps = ["TODAS", ...new Set(creatives.map(c => c.campaign))];
  const sorted = useMemo(() => {
    let d = creatives;
    if (cf !== "TODAS") d = d.filter(c => c.campaign === cf);
    if (tf !== "ALL")   d = d.filter(c => c.type === tf);
    return [...d].sort((a, b) => sb === "cpa" ? a[sb] - b[sb] : b[sb] - a[sb]);
  }, [creatives, cf, tf, sb]);

  const avgHook = (creatives.reduce((s, c) => s + c.hookRate, 0) / creatives.length).toFixed(1);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 18 }}>
        {[
          { l: "Creativos",      v: creatives.length,    c: "#ddd" },
          { l: "Hook Rate prom.",v: `${avgHook}%`,        c: parseFloat(avgHook) >= 35 ? "#4ade80" : parseFloat(avgHook) >= 25 ? "#fbbf24" : "#f87171" },
          { l: "ROAS promedio",  v: fN(creatives.reduce((s, c) => s + c.roas, 0) / creatives.length, "x"), c: "#ddd" },
          { l: "Videos",         v: creatives.filter(c => c.type === "VIDEO").length, c: "#818cf8" },
          { l: "Imágenes",       v: creatives.filter(c => c.type === "IMAGE").length, c: "#4ade80" },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["ALL","VIDEO","IMAGE"].map(t => (
            <button key={t} onClick={() => setTf(t)} style={{ padding: "4px 11px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 11, background: tf === t ? "#e8572a20" : "none", borderColor: tf === t ? "#e8572a" : "#2a2d35", color: tf === t ? "#e8572a" : "#555" }}>
              {t === "ALL" ? "Todos" : t === "VIDEO" ? "🎬 Video" : "📷 Imagen"}
            </button>
          ))}
        </div>
        <select value={cf} onChange={e => setCf(e.target.value)} style={{ background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 6, color: "#bbb", padding: "5px 10px", fontSize: 11, cursor: "pointer", outline: "none" }}>
          {camps.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#555" }}>Ordenar:</span>
          {[["roas","ROAS"],["hookRate","Hook"],["ctr","CTR"],["cpa","CPA"],["spend","Gasto"]].map(([k, l]) => (
            <button key={k} onClick={() => setSb(k)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid", cursor: "pointer", fontSize: 10, background: sb === k ? "#1c1e22" : "none", borderColor: sb === k ? "#60a5fa" : "#2a2d35", color: sb === k ? "#60a5fa" : "#555" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(215px,1fr))", gap: 13 }} className="creative-grid">
        {sorted.map((cr, i) => (
          <CreativeCard key={cr.id} cr={cr} rank={i + 1} goals={goals} isWinner={i === 0} onClick={() => setSel(cr)} />
        ))}
      </div>
      {sel && <CreativeDetail cr={sel} goals={goals} onClose={() => setSel(null)} />}
    </div>
  );
}

// ─── TASKS KANBAN ─────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: "todo",       label: "Por hacer",   color: "#555"    },
  { id: "inprogress", label: "En progreso", color: "#f59e0b" },
  { id: "done",       label: "Listo",       color: "#4ade80" },
];

function TaskCard({ task, canEdit, onMove, onDelete, allAccounts: taskAccounts, allUsers: taskUsers }) {
  const acc      = (taskAccounts || ACCOUNTS).find(a => a.id === task.account);
  const assignee = (taskUsers || USERS).find(u => u.id === task.assignee);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
  return (
    <div style={{ background: "#16181c", border: "1px solid #1c1e22", borderRadius: 10, padding: "12px 13px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 7 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", lineHeight: 1.4, marginBottom: 3 }}>{task.title}</div>
          {task.desc && <div style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}>{task.desc}</div>}
        </div>
        {canEdit && (
          <button onClick={() => onDelete(task.id)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0 }}>×</button>
        )}
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: PRIORITY_COLOR[task.priority] + "20", color: PRIORITY_COLOR[task.priority], border: `1px solid ${PRIORITY_COLOR[task.priority]}40`, fontWeight: 600 }}>{PRIORITY_LABEL[task.priority]}</span>
        {acc && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: acc.color + "20", color: acc.color, border: `1px solid ${acc.color}40` }}>{acc.name}</span>}
        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: task.type === "client" ? "#a78bfa20" : "#60a5fa20", color: task.type === "client" ? "#a78bfa" : "#60a5fa", border: `1px solid ${task.type === "client" ? "#a78bfa" : "#60a5fa"}40` }}>
          {task.type === "client" ? "Cliente" : "Equipo"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1c1e22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: ROLE_COLOR[assignee?.role || "team"] }}>{assignee?.avatar || "?"}</div>
          <span style={{ fontSize: 10, color: "#555" }}>{assignee?.name || "Sin asignar"}</span>
        </div>
        {task.dueDate && <span style={{ fontSize: 10, color: isOverdue ? "#f87171" : "#555" }}>{isOverdue ? "⚠ " : ""}{task.dueDate}</span>}
      </div>
      {canEdit && task.status !== "done" && (
        <div style={{ display: "flex", gap: 5, marginTop: 8, paddingTop: 8, borderTop: "1px solid #1c1e22" }}>
          {COLUMNS.filter(c => c.id !== task.status).map(col => (
            <button key={col.id} onClick={() => onMove(task.id, col.id)} style={{ flex: 1, padding: "4px 0", background: "none", border: `1px solid ${col.color}40`, borderRadius: 5, color: col.color, cursor: "pointer", fontSize: 10 }}>→ {col.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewTaskModal({ userAccounts, onSave, onClose, currentUser, activeProjectId, allUsers }) {
  const users = allUsers || USERS;
  const [form, setForm] = useState({
    title: "", desc: "", status: "todo", priority: "medium",
    assignee: currentUser.id, account: activeProjectId || userAccounts[0]?.id || "",
    dueDate: "", type: currentUser.role === "client" ? "client" : "team",
  });
  const eligible = currentUser.role === "client" ? users.filter(u => u.id === currentUser.id) : users;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ background: "#16181c", border: "1px solid #2a2d35", borderRadius: 16, padding: 28, width: 440 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Nueva tarea</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>
        {[{ k: "title", l: "Título", ph: "Descripción corta" }, { k: "desc", l: "Descripción (opcional)", ph: "Más detalle..." }].map(({ k, l, ph }) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>{l}</div>
            <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph}
              style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 7, color: "#f0f0f0", padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Prioridad</div>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 7, color: "#f0f0f0", padding: "9px 10px", fontSize: 12, outline: "none" }}>
              <option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Tipo</div>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 7, color: "#f0f0f0", padding: "9px 10px", fontSize: 12, outline: "none" }}>
              <option value="team">Equipo</option><option value="client">Cliente</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Asignar a</div>
            <select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 7, color: "#f0f0f0", padding: "9px 10px", fontSize: 12, outline: "none" }}>
              {eligible.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Fecha límite</div>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 7, color: "#f0f0f0", padding: "9px 10px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Cuenta</div>
          <select value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))} style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 7, color: "#f0f0f0", padding: "9px 10px", fontSize: 12, outline: "none" }}>
            {userAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: "none", border: "1px solid #2a2d35", borderRadius: 8, color: "#666", cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => { if (!form.title.trim()) return; onSave({ ...form, id: "t" + Date.now() }); }}
            style={{ flex: 1, padding: 11, background: "#e8572a", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Crear tarea</button>
        </div>
      </div>
    </div>
  );
}

function TasksModule({ currentUser, userAccounts, activeProjectId, allUsers, allAccounts }) {
  const [tasks, setTasks] = useState(() => {
    try { const s = localStorage.getItem("eg_tasks"); return s ? JSON.parse(s) : INIT_TASKS; } catch { return INIT_TASKS; }
  });
  useEffect(() => { try { localStorage.setItem("eg_tasks", JSON.stringify(tasks)); } catch {} }, [tasks]);
  const [showModal, setShowModal] = useState(false);
  const [viewFilter, setViewFilter] = useState("all");
  const [accFilter, setAccFilter] = useState("all");

  const isClient = currentUser.role === "client";
  const canEdit  = currentUser.role === "master" || currentUser.role === "team";

  const visible = useMemo(() => {
    let t = tasks;
    if (isClient) t = t.filter(x => x.type === "client" && userAccounts.some(a => a.id === x.account));
    if (viewFilter === "team")   t = t.filter(x => x.type === "team");
    if (viewFilter === "client") t = t.filter(x => x.type === "client");
    if (viewFilter === "mine")   t = t.filter(x => x.assignee === currentUser.id);
    if (accFilter !== "all")     t = t.filter(x => x.account === accFilter);
    return t;
  }, [tasks, viewFilter, accFilter, isClient, currentUser, userAccounts]);

  const stats = {
    todo:       tasks.filter(t => t.status === "todo").length,
    inprogress: tasks.filter(t => t.status === "inprogress").length,
    done:       tasks.filter(t => t.status === "done").length,
    overdue:    tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done").length,
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[{ l: "Por hacer", v: stats.todo, c: "#555" }, { l: "En progreso", v: stats.inprogress, c: "#f59e0b" }, { l: "Listas", v: stats.done, c: "#4ade80" }, { l: "Vencidas", v: stats.overdue, c: "#f87171" }].map(({ l, v, c }) => (
          <div key={l} style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: c }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {!isClient && (
          <div style={{ display: "flex", gap: 5 }}>
            {[["all","Todas"],["team","Equipo"],["client","Clientes"],["mine","Mías"]].map(([v, l]) => (
              <button key={v} onClick={() => setViewFilter(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 11, background: viewFilter === v ? "#e8572a" : "none", borderColor: viewFilter === v ? "#e8572a" : "#2a2d35", color: viewFilter === v ? "#fff" : "#555" }}>{l}</button>
            ))}
          </div>
        )}
        <select value={accFilter} onChange={e => setAccFilter(e.target.value)} style={{ background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 6, color: "#bbb", padding: "5px 10px", fontSize: 11, cursor: "pointer", outline: "none" }}>
          <option value="all">Todas las cuentas</option>
          {userAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button onClick={() => setShowModal(true)} style={{ marginLeft: "auto", padding: "7px 16px", background: "#e8572a", border: "none", borderRadius: 7, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Nueva tarea</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="kanban-grid">
        {COLUMNS.map(col => {
          const colTasks = visible.filter(t => t.status === col.id);
          return (
            <div key={col.id} style={{ background: "#0d0f12", borderRadius: 12, padding: "14px 12px", minHeight: 300 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{col.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 11, background: "#1c1e22", color: "#555", padding: "1px 7px", borderRadius: 10 }}>{colTasks.length}</span>
              </div>
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} canEdit={canEdit || isClient}
                  onMove={(id, s) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t))}
                  onDelete={id => setTasks(prev => prev.filter(t => t.id !== id))}
                  allAccounts={allAccounts} allUsers={allUsers} />
              ))}
              {colTasks.length === 0 && <div style={{ textAlign: "center", paddingTop: 40, color: "#2a2d35", fontSize: 12 }}>Sin tareas</div>}
            </div>
          );
        })}
      </div>
      {showModal && <NewTaskModal userAccounts={userAccounts} onSave={t => { setTasks(p => [...p, t]); setShowModal(false); toast("Tarea creada"); }} onClose={() => setShowModal(false)} currentUser={currentUser} activeProjectId={activeProjectId} allUsers={allUsers} />}
    </div>
  );
}

// ─── SETTINGS (META TOKEN) ────────────────────────────────────────────────────
function SettingsModule({ allAccounts, setAllAccounts, allUsers, setAllUsers }) {
  const [tab, setTab] = useState("accounts");

  // ── META API STATE ──────────────────────────────────────────────────────────
  const [metaConfigs, setMetaConfigs] = useState(
    Object.fromEntries(allAccounts.map(a => [a.id, { token: "", adAccountId: "", connected: false, lastSync: null, adAccounts: [] }]))
  );
  const [activeMetaAcc, setActiveMetaAcc] = useState(allAccounts[0]?.id || "");
  const [showToken, setShowToken]   = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [fetching, setFetching]     = useState(false);

  const metaCfg = metaConfigs[activeMetaAcc] || { token: "", adAccountId: "", connected: false, adAccounts: [] };
  const metaAcc = allAccounts.find(a => a.id === activeMetaAcc);
  function updMeta(patch) { setMetaConfigs(p => ({ ...p, [activeMetaAcc]: { ...p[activeMetaAcc], ...patch } })); }

  async function testToken() {
    if (!metaCfg.token.trim()) { setTestResult({ ok: false, msg: "Ingresá un token primero" }); return; }
    setTesting(true); setTestResult(null);
    await new Promise(r => setTimeout(r, 1600));
    if (metaCfg.token.startsWith("EAA") || metaCfg.token.length > 20) {
      setTestResult({ ok: true, msg: "Token válido · Conectado correctamente" });
      updMeta({ connected: true, lastSync: new Date().toLocaleString("es-AR") });
    } else {
      setTestResult({ ok: false, msg: "Token inválido o expirado." });
      updMeta({ connected: false });
    }
    setTesting(false);
  }

  async function fetchMetaAccounts() {
    if (!metaCfg.connected) { setTestResult({ ok: false, msg: "Primero verificá el token" }); return; }
    setFetching(true);
    await new Promise(r => setTimeout(r, 1200));
    updMeta({ adAccounts: [
      { id: "act_" + Math.random().toString(36).slice(2, 10), name: `${metaAcc?.name} — Principal` },
      { id: "act_" + Math.random().toString(36).slice(2, 10), name: `${metaAcc?.name} — Test` },
    ]});
    setFetching(false);
  }

  // ── ACCOUNTS STATE ──────────────────────────────────────────────────────────
  const [showAccModal, setShowAccModal] = useState(false);
  const [editingAcc,   setEditingAcc]   = useState(null);
  const COLORS = ["#e8572a","#d63384","#198754","#1877f2","#8b5cf6","#0891b2","#d97706","#dc2626","#059669","#0f766e"];
  const emptyAcc = () => ({ id: "act_" + Date.now(), name: "", logo: "", color: COLORS[0], goals: { roas: 3.0, cpa: 10.0, ctr: 1.5, budget: 1000 }, funnel: allAccounts[0]?.funnel, daily: allAccounts[0]?.daily, campaigns: [] });

  function saveAccount(form) {
    if (editingAcc) {
      setAllAccounts(p => p.map(a => a.id === form.id ? { ...a, ...form } : a));
      toast("Cuenta actualizada");
    } else {
      setAllAccounts(p => [...p, { ...emptyAcc(), ...form }]);
      toast("Cuenta creada correctamente");
    }
    setShowAccModal(false); setEditingAcc(null);
  }

  function deleteAccount(id) {
    if (!window.confirm("¿Eliminar esta cuenta? Se quitará de todos los usuarios.")) return;
    setAllAccounts(p => p.filter(a => a.id !== id));
    setAllUsers(p => p.map(u => ({ ...u, accounts: u.accounts.filter(aid => aid !== id) })));
    toast("Cuenta eliminada", "warn");
  }

  // ── USERS STATE ─────────────────────────────────────────────────────────────
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser,   setEditingUser]   = useState(null);
  const emptyUser = () => ({ id: "u" + Date.now(), name: "", email: "", role: "team", avatar: "", accounts: [] });

  function saveUser(form) {
    if (editingUser) {
      setAllUsers(p => p.map(u => u.id === form.id ? { ...u, ...form } : u));
      toast("Usuario actualizado");
    } else {
      setAllUsers(p => [...p, { ...emptyUser(), ...form }]);
      toast("Usuario creado correctamente");
    }
    setShowUserModal(false); setEditingUser(null);
  }

  function deleteUser(id) {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    setAllUsers(p => p.filter(u => u.id !== id));
    toast("Usuario eliminado", "warn");
  }

  // ── SHARED STYLES ───────────────────────────────────────────────────────────
  const TAB_ITEMS = [
    { id: "accounts", label: "Cuentas publicitarias", icon: "◈" },
    { id: "users",    label: "Usuarios y accesos",    icon: "◎" },
    { id: "meta",     label: "Meta API",              icon: "𝗳" },
  ];

  const inp = (extra = {}) => ({ background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 8, color: "#f0f0f0", padding: "10px 13px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", ...extra });

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", marginBottom: 3 }}>Administración</div>
        <div style={{ fontSize: 12, color: "#555" }}>Gestioná cuentas, usuarios y conexiones de Meta Ads API</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#0d0f12", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TAB_ITEMS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 600 : 400, background: tab === t.id ? "#111215" : "none", color: tab === t.id ? "#f0f0f0" : "#555", transition: "all 0.15s" }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: ACCOUNTS ── */}
      {tab === "accounts" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{allAccounts.length} cuentas configuradas</div>
            <button onClick={() => { setEditingAcc(null); setShowAccModal(true); }}
              style={{ marginLeft: "auto", padding: "8px 18px", background: "#e8572a", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              + Nueva cuenta
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allAccounts.map(acc => {
              const userCount = allUsers.filter(u => u.accounts.includes(acc.id)).length;
              const ok = acc.funnel?.conversion?.roas >= acc.goals?.roas;
              return (
                <div key={acc.id} style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: acc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{acc.logo || acc.name?.slice(0,2).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0", marginBottom: 3 }}>{acc.name}</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#555" }}>{acc.id}</span>
                      <span style={{ fontSize: 11, color: "#555" }}>·</span>
                      <span style={{ fontSize: 11, color: ok ? "#4ade80" : "#f87171" }}>ROAS {acc.funnel?.conversion?.roas?.toFixed(1)}x</span>
                      <span style={{ fontSize: 11, color: "#555" }}>·</span>
                      <span style={{ fontSize: 11, color: "#888" }}>Obj: {acc.goals?.roas}x</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "#555", background: "#0d0f12", border: "1px solid #1c1e22", borderRadius: 6, padding: "4px 10px" }}>
                      {userCount} usuario{userCount !== 1 ? "s" : ""}
                    </div>
                    <button onClick={() => { setEditingAcc(acc); setShowAccModal(true); }}
                      style={{ padding: "6px 12px", background: "none", border: "1px solid #2a2d35", borderRadius: 7, color: "#888", cursor: "pointer", fontSize: 11 }}>Editar</button>
                    <button onClick={() => deleteAccount(acc.id)}
                      style={{ padding: "6px 12px", background: "none", border: "1px solid #991b1b", borderRadius: 7, color: "#f87171", cursor: "pointer", fontSize: 11 }}>Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: USERS ── */}
      {tab === "users" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ccc" }}>{allUsers.length} usuarios</div>
            <button onClick={() => { setEditingUser(null); setShowUserModal(true); }}
              style={{ marginLeft: "auto", padding: "8px 18px", background: "#e8572a", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              + Nuevo usuario
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allUsers.map(u => {
              const userAccs = allAccounts.filter(a => u.accounts.includes(a.id));
              return (
                <div key={u.id} style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: userAccs.length > 0 ? 12 : 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1c1e22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: ROLE_COLOR[u.role], flexShrink: 0 }}>{u.avatar || u.name?.slice(0,2)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 5, background: ROLE_COLOR[u.role] + "20", color: ROLE_COLOR[u.role], border: `1px solid ${ROLE_COLOR[u.role]}40`, fontWeight: 600 }}>{ROLE_LABEL[u.role]}</span>
                    <button onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                      style={{ padding: "6px 12px", background: "none", border: "1px solid #2a2d35", borderRadius: 7, color: "#888", cursor: "pointer", fontSize: 11 }}>Editar</button>
                    <button onClick={() => deleteUser(u.id)}
                      style={{ padding: "6px 12px", background: "none", border: "1px solid #991b1b", borderRadius: 7, color: "#f87171", cursor: "pointer", fontSize: 11 }}>Eliminar</button>
                  </div>
                  {userAccs.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid #1c1e22" }}>
                      {userAccs.map(a => (
                        <span key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, padding: "3px 9px", borderRadius: 5, background: a.color + "18", color: a.color, border: `1px solid ${a.color}40` }}>
                          <span style={{ fontWeight: 700 }}>{a.logo}</span> {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {userAccs.length === 0 && (
                    <div style={{ paddingTop: 10, borderTop: "1px solid #1c1e22", fontSize: 11, color: "#444" }}>Sin cuentas asignadas</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: META API ── */}
      {tab === "meta" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {allAccounts.map(a => (
              <button key={a.id} onClick={() => { setActiveMetaAcc(a.id); setTestResult(null); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 9, border: "1px solid", cursor: "pointer", fontSize: 12, background: activeMetaAcc === a.id ? a.color + "18" : "#0d0f12", borderColor: activeMetaAcc === a.id ? a.color + "55" : "#2a2d35", color: activeMetaAcc === a.id ? "#f0f0f0" : "#666", fontWeight: activeMetaAcc === a.id ? 600 : 400 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff" }}>{a.logo}</div>
                {a.name}
                {metaConfigs[a.id]?.connected && <span style={{ fontSize: 9, background: "#0a2e1a", color: "#4ade80", border: "1px solid #166534", padding: "1px 5px", borderRadius: 4 }}>● ON</span>}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="settings-grid">
            {/* Token */}
            <div style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 14, padding: "20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#1877f220", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#1877f2" }}>f</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>Token de acceso</div><div style={{ fontSize: 11, color: "#555" }}>Graph API</div></div>
                {metaCfg.connected && <div style={{ marginLeft: "auto", fontSize: 10, background: "#0a2e1a", color: "#4ade80", border: "1px solid #166534", padding: "3px 8px", borderRadius: 6 }}>● ON</div>}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Access Token</div>
                <div style={{ position: "relative" }}>
                  <input type={showToken ? "text" : "password"} value={metaCfg.token} onChange={e => updMeta({ token: e.target.value, connected: false })} placeholder="EAAxxxxxxxxxxxxxxxxxx..."
                    style={{ ...inp(), paddingRight: 40, fontFamily: "monospace" }} />
                  <button onClick={() => setShowToken(s => !s)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 13 }}>{showToken ? "🙈" : "👁"}</button>
                </div>
                <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Permisos: <span style={{ fontFamily: "monospace", color: "#666", fontSize: 10 }}>ads_read, ads_management, business_management</span></div>
              </div>
              {testResult && <div style={{ marginBottom: 10, padding: "9px 12px", borderRadius: 7, background: testResult.ok ? "#0a2e1a" : "#2d0a0a", border: `1px solid ${testResult.ok ? "#166534" : "#991b1b"}`, fontSize: 12, color: testResult.ok ? "#4ade80" : "#f87171" }}>{testResult.ok ? "✓ " : "✗ "}{testResult.msg}</div>}
              <button onClick={testToken} disabled={testing || !metaCfg.token.trim()}
                style={{ width: "100%", padding: "10px 0", background: metaCfg.token.trim() ? "#1877f2" : "#1c1e22", border: "none", borderRadius: 8, color: metaCfg.token.trim() ? "#fff" : "#444", cursor: metaCfg.token.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {testing ? "⏳ Verificando..." : "🔗 Verificar y conectar"}
              </button>
              {metaCfg.lastSync && <div style={{ fontSize: 11, color: "#555", textAlign: "center" }}>Última sync: {metaCfg.lastSync}</div>}
              <div style={{ marginTop: 14, padding: 12, background: "#0d0f12", borderRadius: 9, border: "1px solid #1c1e22" }}>
                <div style={{ fontSize: 10, color: "#e8572a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Cómo obtener tu token</div>
                <div style={{ fontSize: 11, color: "#555", lineHeight: 1.9 }}>
                  1. Ir a <span style={{ color: "#60a5fa" }}>developers.facebook.com</span><br />
                  2. Crear app → tipo Business<br />
                  3. Graph API Explorer → generar token<br />
                  4. Para producción: token de sistema (no expira)
                </div>
              </div>
            </div>
            {/* Ad Account */}
            <div style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 14, padding: "20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: metaAcc?.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: metaAcc?.color }}>{metaAcc?.logo}</div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#ddd" }}>Cuenta publicitaria</div><div style={{ fontSize: 11, color: "#555" }}>Ad Account ID</div></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Ad Account ID</div>
                <input value={metaCfg.adAccountId} onChange={e => updMeta({ adAccountId: e.target.value })} placeholder="act_123456789012345"
                  style={{ ...inp(), fontFamily: "monospace" }} />
                <div style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Encontralo en Ads Manager → Configuración de cuenta</div>
              </div>
              <button onClick={fetchMetaAccounts} disabled={fetching || !metaCfg.connected}
                style={{ width: "100%", padding: "10px 0", background: "#0d0f12", border: `1px solid ${metaCfg.connected ? "#2a2d35" : "#1c1e22"}`, borderRadius: 8, color: metaCfg.connected ? "#bbb" : "#333", cursor: metaCfg.connected ? "pointer" : "not-allowed", fontSize: 12, marginBottom: 12 }}>
                {fetching ? "⏳ Buscando..." : "🔍 Buscar mis cuentas publicitarias"}
              </button>
              {metaCfg.adAccounts.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {metaCfg.adAccounts.map(a => (
                    <div key={a.id} onClick={() => updMeta({ adAccountId: a.id })}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: `1px solid ${metaCfg.adAccountId === a.id ? metaAcc?.color + "55" : "#1c1e22"}`, background: metaCfg.adAccountId === a.id ? metaAcc?.color + "10" : "#0d0f12", cursor: "pointer", marginBottom: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${metaCfg.adAccountId === a.id ? metaAcc?.color : "#2a2d35"}`, background: metaCfg.adAccountId === a.id ? metaAcc?.color : "none", flexShrink: 0 }} />
                      <div><div style={{ fontSize: 12, color: metaCfg.adAccountId === a.id ? "#f0f0f0" : "#888" }}>{a.name}</div><div style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>{a.id}</div></div>
                    </div>
                  ))}
                </div>
              )}
              {metaCfg.adAccountId && <div style={{ padding: "10px 12px", background: "#0a2e1a", border: "1px solid #166534", borderRadius: 8, marginBottom: 12 }}><div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, marginBottom: 2 }}>✓ Configurado</div><div style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>{metaCfg.adAccountId}</div></div>}
              <button onClick={() => { if (metaCfg.connected && metaCfg.adAccountId) alert("✓ Guardado correctamente."); }}
                style={{ width: "100%", padding: "10px 0", background: metaCfg.connected && metaCfg.adAccountId ? "#e8572a" : "#1c1e22", border: "none", borderRadius: 8, color: metaCfg.connected && metaCfg.adAccountId ? "#fff" : "#444", cursor: metaCfg.connected && metaCfg.adAccountId ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700 }}>
                💾 Guardar y sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNT MODAL ── */}
      {showAccModal && (
        <AccountModal
          initial={editingAcc}
          colors={COLORS}
          onSave={saveAccount}
          onClose={() => { setShowAccModal(false); setEditingAcc(null); }} />
      )}

      {/* ── USER MODAL ── */}
      {showUserModal && (
        <UserModal
          initial={editingUser}
          allAccounts={allAccounts}
          onSave={saveUser}
          onClose={() => { setShowUserModal(false); setEditingUser(null); }} />
      )}
    </div>
  );
}

// ─── ACCOUNT MODAL ────────────────────────────────────────────────────────────
const COLORS = ["#e8572a","#d63384","#198754","#1877f2","#8b5cf6","#0891b2","#d97706","#dc2626","#059669","#0f766e"];

function AccountModal({ initial, colors, onSave, onClose }) {
  const [form, setForm] = useState(initial
    ? { id: initial.id, name: initial.name, logo: initial.logo, color: initial.color, goals: { ...initial.goals } }
    : { id: "act_" + Date.now(), name: "", logo: "", color: colors[0], goals: { roas: 3.0, cpa: 10.0, ctr: 1.5, budget: 1000 } }
  );
  const inp = { background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 8, color: "#f0f0f0", padding: "10px 13px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ background: "#16181c", border: "1px solid #2a2d35", borderRadius: 16, padding: 30, width: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{initial ? "Editar cuenta" : "Nueva cuenta publicitaria"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Nombre de la cuenta</div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Powernax" style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Siglas (logo)</div>
            <input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value.slice(0,3).toUpperCase() }))} placeholder="PX" style={inp} maxLength={3} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Color</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {colors.map(c => (
              <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{ width: 28, height: 28, borderRadius: 6, background: c, cursor: "pointer", border: `3px solid ${form.color === c ? "#fff" : "transparent"}`, transition: "border 0.1s" }} />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Objetivos</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{k:"roas",l:"ROAS objetivo",s:"x"},{k:"cpa",l:"CPA objetivo",p:"$"},{k:"ctr",l:"CTR objetivo",s:"%"},{k:"budget",l:"Presupuesto diario",p:"$"}].map(({ k, l, p, s }) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>{l}</div>
                <div style={{ display: "flex", alignItems: "center", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 8, padding: "0 10px" }}>
                  {p && <span style={{ color: "#444", fontSize: 13 }}>{p}</span>}
                  <input type="number" value={form.goals[k]} onChange={e => setForm(f => ({ ...f, goals: { ...f.goals, [k]: parseFloat(e.target.value) || 0 } }))}
                    style={{ flex: 1, background: "none", border: "none", color: "#f0f0f0", fontSize: 13, padding: "9px 6px", outline: "none" }} />
                  {s && <span style={{ color: "#444", fontSize: 13 }}>{s}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background: "#0d0f12", borderRadius: 10, padding: "12px 14px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: form.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>{form.logo || "?"}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0" }}>{form.name || "Nombre de la cuenta"}</div>
            <div style={{ fontSize: 11, color: "#555" }}>ROAS obj: {form.goals.roas}x · CPA obj: ${form.goals.cpa}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: "none", border: "1px solid #2a2d35", borderRadius: 8, color: "#666", cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => { if (!form.name.trim()) return; onSave(form); }}
            style={{ flex: 1, padding: 11, background: "#e8572a", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
            {initial ? "Guardar cambios" : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── USER MODAL ───────────────────────────────────────────────────────────────
function UserModal({ initial, allAccounts, onSave, onClose }) {
  const [form, setForm] = useState(initial
    ? { ...initial }
    : { id: "u" + Date.now(), name: "", email: "", role: "team", avatar: "", accounts: [] }
  );

  function toggleAccess(id) {
    setForm(f => ({
      ...f,
      accounts: f.accounts.includes(id) ? f.accounts.filter(a => a !== id) : [...f.accounts, id]
    }));
  }

  const inp = { background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 8, color: "#f0f0f0", padding: "10px 13px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <div style={{ background: "#16181c", border: "1px solid #2a2d35", borderRadius: 16, padding: 30, width: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{initial ? "Editar usuario" : "Nuevo usuario"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Nombre</div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, avatar: e.target.value.slice(0,2).toUpperCase() }))} placeholder="Nombre completo" style={inp} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 5 }}>Email</div>
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@empresa.com" style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>Rol</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["team","Equipo","#60a5fa"],["client","Cliente","#a78bfa"],["master","Master","#e8572a"]].map(([v, l, c]) => (
              <button key={v} onClick={() => setForm(f => ({ ...f, role: v }))}
                style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${form.role === v ? c + "60" : "#2a2d35"}`, background: form.role === v ? c + "18" : "#0d0f12", color: form.role === v ? c : "#555", cursor: "pointer", fontSize: 12, fontWeight: form.role === v ? 700 : 400 }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#444", marginTop: 6 }}>
            {form.role === "client" ? "Solo ve Dashboard, Reportes y sus Tareas asignadas" : form.role === "team" ? "Acceso completo a todas las secciones" : "Acceso total + administración"}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#666", marginBottom: 10 }}>Cuentas con acceso</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {allAccounts.map(acc => {
              const has = form.accounts.includes(acc.id);
              return (
                <div key={acc.id} onClick={() => toggleAccess(acc.id)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: `1px solid ${has ? acc.color + "55" : "#1c1e22"}`, background: has ? acc.color + "12" : "#0d0f12", cursor: "pointer", transition: "all 0.12s" }}>
                  <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${has ? acc.color : "#2a2d35"}`, background: has ? acc.color : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: "#fff" }}>{has ? "✓" : ""}</div>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: acc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, color: "#fff" }}>{acc.logo}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: has ? 600 : 400, color: has ? "#f0f0f0" : "#888" }}>{acc.name}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>ROAS {acc.funnel?.conversion?.roas?.toFixed(1)}x</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, background: "none", border: "1px solid #2a2d35", borderRadius: 8, color: "#666", cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => { if (!form.name.trim() || !form.email.trim()) return; onSave(form); }}
            style={{ flex: 1, padding: 11, background: "#e8572a", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
            {initial ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", icon: "▦", label: "Dashboard" },
  { id: "campaigns", icon: "◈", label: "Campañas"  },
  { id: "creatives", icon: "◉", label: "Creativos" },
  { id: "reports",   icon: "⊟", label: "Reportes"  },
  { id: "tasks",     icon: "✓", label: "Tareas"    },
  { id: "clients",   icon: "◎", label: "Clientes"  },
  { id: "settings",  icon: "⚙", label: "Config"    },
];

// ─── PROJECT PICKER ───────────────────────────────────────────────────────────
function ProjectPicker({ user, allAccounts, accountGoals, onSelect, onLogout }) {
  const userAccounts = allAccounts.filter(a => user.accounts.includes(a.id));
  return (
    <div style={{ minHeight: "100vh", background: "#0d0f12", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter',system-ui,sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, background: "#e8572a", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 auto 16px" }}>E</div>
        <Logo size={20} />
        <div style={{ fontSize: 13, color: "#555", marginTop: 8 }}>Seleccioná el proyecto que querés analizar</div>
      </div>

      {/* Project cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, width: "100%", maxWidth: 860 }} className="picker-grid">
        {userAccounts.map(acc => {
          const g   = accountGoals[acc.id];
          const f   = acc.funnel;
          const roasOk = f.conversion.roas >= g.roas;
          const cpaOk  = f.conversion.costoCompra <= g.cpa;
          const profit = f.conversion.facturacion - f.conversion.inversion;
          return (
            <div key={acc.id} onClick={() => onSelect(acc.id)}
              style={{ background: "#111215", border: `1px solid ${acc.color}30`, borderRadius: 16, padding: "24px 24px", cursor: "pointer", transition: "all 0.18s", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${acc.color}80`; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${acc.color}18`; }}
              onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${acc.color}30`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

              {/* Color accent bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: acc.color, borderRadius: "16px 16px 0 0" }} />

              {/* Account header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: acc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{acc.logo}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{acc.id}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 18, color: "#333" }}>›</div>
              </div>

              {/* Key metrics */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[
                  { l: "ROAS",        v: `${f.conversion.roas.toFixed(1)}x`,             ok: roasOk },
                  { l: "CPA",         v: `$${f.conversion.costoCompra.toFixed(2)}`,       ok: cpaOk  },
                  { l: "Facturación", v: `$${f.conversion.facturacion.toLocaleString()}`, ok: true   },
                  { l: "Conversiones",v: f.conversion.conversiones,                       ok: true   },
                ].map(({ l, v, ok }) => (
                  <div key={l} style={{ background: "#0d0f12", borderRadius: 8, padding: "10px 12px", border: `1px solid ${ok === true ? "#1c1e22" : ok ? "#166534" : "#991b1b"}` }}>
                    <div style={{ fontSize: 9, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: ok === true ? "#ddd" : ok ? "#4ade80" : "#f87171" }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Ganancia + objetivo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${acc.color}20` }}>
                <div>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>Ganancia estimada</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#ddd" }}>${profit.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>ROAS objetivo</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "#666" }}>{g.roas}x</div>
                </div>
                <div style={{ padding: "8px 16px", background: acc.color, borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#fff" }}>Entrar →</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1c1e22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: ROLE_COLOR[user.role] }}>{user.avatar}</div>
        <span style={{ fontSize: 12, color: "#555" }}>{user.name} · <span style={{ color: ROLE_COLOR[user.role] }}>{ROLE_LABEL[user.role]}</span></span>
        <button onClick={onLogout} style={{ marginLeft: 8, background: "none", border: "1px solid #2a2d35", borderRadius: 6, color: "#555", cursor: "pointer", fontSize: 11, padding: "4px 10px" }}>↩ Salir</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]           = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [nav, setNav]             = useState("dashboard");
  const [sidebar, setSidebar]     = useState(true);
  const [dateRange, setDateRange] = useState("7d");
  const [goalsModal, setGoalsModal]   = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [accountGoals, setAccountGoals] = useState(
    Object.fromEntries(ACCOUNTS.map(a => [a.id, { ...a.goals }]))
  );
  // Global editable accounts + users (managed in Settings) — persisted in localStorage
  const [allAccounts, setAllAccounts] = useState(() => {
    try { const s = localStorage.getItem("eg_accounts"); return s ? JSON.parse(s) : ACCOUNTS; } catch { return ACCOUNTS; }
  });
  const [allUsers, setAllUsers] = useState(() => {
    try { const s = localStorage.getItem("eg_users"); return s ? JSON.parse(s) : USERS; } catch { return USERS; }
  });
  useEffect(() => { try { localStorage.setItem("eg_accounts", JSON.stringify(allAccounts)); } catch {} }, [allAccounts]);
  useEffect(() => { try { localStorage.setItem("eg_users", JSON.stringify(allUsers)); } catch {} }, [allUsers]);
  const [loading, setLoading]         = useState(false);
  const [mobileMenu, setMobileMenu]   = useState(false);

  function handleLogin(u) {
    setUser(u);
    const accs = allAccounts.filter(a => u.accounts.includes(a.id));
    if (accs.length === 1) setActiveProjectId(accs[0].id);
    else setActiveProjectId(null);
  }

  function selectProject(id) {
    setLoading(true);
    setActiveProjectId(id);
    setNav("dashboard");
    setTimeout(() => setLoading(false), 800);
  }

  function exitProject() {
    setActiveProjectId(null);
    setNav("dashboard");
  }

  const userAccounts  = user ? allAccounts.filter(a => user.accounts.includes(a.id)) : [];
  const mainAccount   = allAccounts.find(a => a.id === activeProjectId) || allAccounts[0];
  const goals         = accountGoals[mainAccount.id];
  const isClient      = user?.role === "client";
  const canEdit       = user?.role === "master" || user?.role === "team";

  // agg is now always just the single active project
  const agg = useMemo(() => {
    if (!mainAccount) return null;
    const f = mainAccount.funnel;
    return {
      spend:          f.conversion.inversion,
      revenue:        f.conversion.facturacion,
      conversions:    f.conversion.conversiones,
      impressions:    f.creativos.impresiones,
      alcance:        f.creativos.alcance,
      clics:          f.creativos.clicsEnlace,
      addToCart:      f.acciones.addToCart,
      pagosIniciados: f.acciones.pagosIniciados,
      roas:           f.conversion.roas,
      cpa:            f.conversion.costoCompra,
      ctr:            f.creativos.ctrUnico,
      cpm:            f.creativos.cpm,
      costoPagos:     f.acciones.costoPagosIniciados,
    };
  }, [mainAccount]);

  // ── SCREENS ──────────────────────────────────────────────────────────────
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // Show project picker if no active project (and user has multiple accounts)
  if (!activeProjectId) {
    return (
      <ProjectPicker
        user={user}
        allAccounts={allAccounts}
        accountGoals={accountGoals}
        onSelect={selectProject}
        onLogout={() => { setUser(null); setActiveProjectId(null); }}
      />
    );
  }

  if (!agg) return <div style={{ background: "#0d0f12", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Sin datos</div>;

  const navItems = NAV_ITEMS.filter(n => !isClient || ["dashboard","reports","tasks"].includes(n.id));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d0f12", fontFamily: "'Inter',system-ui,sans-serif", color: "#f0f0f0" }}>
      <ToastContainer />
      <MobileHeader account={mainAccount} onMenu={() => setMobileMenu(true)} onPDF={() => setReportModal(true)} />

      {/* MOBILE SIDEBAR */}
      <MobileSidebarOverlay open={mobileMenu} onClose={() => setMobileMenu(false)}>
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Logo size={14} />
            <button onClick={() => setMobileMenu(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20 }}>×</button>
          </div>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setNav(item.id); setMobileMenu(false); if (item.id === "reports") setReportModal(true); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: nav === item.id ? "#e8572a15" : "none", color: nav === item.id ? "#e8572a" : "#666" }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span style={{ fontSize: 13, fontWeight: nav === item.id ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
          {userAccounts.length > 1 && <button onClick={() => { exitProject(); setMobileMenu(false); }} style={{ width: "100%", marginTop: 12, padding: "9px 0", background: "none", border: "1px solid #2a2d35", borderRadius: 7, color: "#666", cursor: "pointer", fontSize: 12 }}>‹ Cambiar proyecto</button>}
        </div>
      </MobileSidebarOverlay>

      {/* SIDEBAR */}
      <div className="sidebar-full" style={{ width: sidebar ? 236 : 60, minHeight: "100vh", background: "#111215", borderRight: "1px solid #1c1e22", transition: "width 0.2s", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Logo row */}
        <div style={{ padding: sidebar ? "18px 18px 14px" : "16px 14px", borderBottom: "1px solid #1c1e22", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: "#e8572a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>E</div>
          {sidebar && <Logo size={13} />}
          <div style={{ marginLeft: "auto", cursor: "pointer", color: "#444", fontSize: 16, flexShrink: 0 }} onClick={() => setSidebar(o => !o)}>{sidebar ? "‹" : "›"}</div>
        </div>

        {/* Active project panel */}
        {sidebar && (
          <div style={{ borderBottom: "1px solid #1c1e22", flexShrink: 0 }}>
            <div style={{ padding: "10px 14px 4px" }}>
              <span style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Proyecto activo</span>
            </div>
            <div style={{ margin: "0 14px 6px", height: 1, background: "#1c1e22" }} />
            <div style={{ padding: "0 10px 10px" }}>
              {/* Active project card */}
              <div style={{ background: mainAccount.color + "15", border: `1px solid ${mainAccount.color}50`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: mainAccount.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{mainAccount.logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mainAccount.name}</div>
                    <div style={{ fontSize: 10, color: mainAccount.funnel.conversion.roas >= goals.roas ? "#4ade80" : "#f87171" }}>
                      ROAS {mainAccount.funnel.conversion.roas.toFixed(1)}x
                    </div>
                  </div>
                  {canEdit && (
                    <div style={{ fontSize: 11, color: "#444", cursor: "pointer", flexShrink: 0 }}
                      onClick={e => { e.stopPropagation(); setGoalsModal(true); }} title="Editar objetivos">⚙</div>
                  )}
                </div>
              </div>
              {/* Change project button — only if user has multiple accounts */}
              {userAccounts.length > 1 && (
                <button onClick={exitProject}
                  style={{ width: "100%", padding: "7px 0", background: "none", border: "1px solid #2a2d35", borderRadius: 7, color: "#666", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  ‹ Cambiar proyecto
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => { setNav(item.id); if (item.id === "reports") setReportModal(true); }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 2, background: nav === item.id ? "#e8572a15" : "none", color: nav === item.id ? "#e8572a" : "#555", transition: "all 0.15s" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {sidebar && <span style={{ fontSize: 13, fontWeight: nav === item.id ? 600 : 400 }}>{item.label}</span>}
              {sidebar && item.id === "creatives" && <span style={{ marginLeft: "auto", fontSize: 9, background: "#e8572a", color: "#fff", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>NEW</span>}
              {sidebar && item.id === "settings"  && <span style={{ marginLeft: "auto", fontSize: 9, background: "#1877f2", color: "#fff", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>API</span>}
            </div>
          ))}
        </nav>

        {/* User row */}
        {sidebar && (
          <div style={{ padding: "12px 14px", borderTop: "1px solid #1c1e22", display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1c1e22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: ROLE_COLOR[user.role], flexShrink: 0 }}>{user.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#ddd", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: ROLE_COLOR[user.role] }}>{ROLE_LABEL[user.role]}</div>
            </div>
            <button onClick={() => setUser(null)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>↩</button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderBottom: "1px solid #1c1e22", background: "#111215", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {nav === "tasks"     ? <span style={{ fontSize: 14, fontWeight: 700 }}>✓ Tareas</span>
              : nav === "settings" ? <span style={{ fontSize: 14, fontWeight: 700 }}>⚙ Config · Meta API</span>
              : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 700 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: mainAccount.color, display: "inline-block" }} />
                  {nav === "creatives" ? `Creativos · ${mainAccount.name}` : mainAccount.name}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>{nav === "settings" ? "Administración de cuentas y usuarios" : `Últimos ${dateRange} · Meta Ads`}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
            {canEdit && nav !== "settings" && ["7d","14d","30d"].map(d => (
              <button key={d} onClick={() => setDateRange(d)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid", cursor: "pointer", fontSize: 11, background: dateRange === d ? "#1c1e22" : "none", borderColor: dateRange === d ? "#e8572a" : "#2a2d35", color: dateRange === d ? "#f0f0f0" : "#555" }}>{d}</button>
            ))}
            {canEdit && nav !== "settings" && <button onClick={() => setGoalsModal(true)} style={{ padding: "4px 11px", borderRadius: 5, border: "1px solid #2a2d35", cursor: "pointer", fontSize: 11, background: "none", color: "#777" }}>⚙ Objetivos</button>}
            <button onClick={() => setReportModal(true)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, background: "#e8572a", color: "#fff", fontWeight: 700 }}>⬇ PDF</button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        {loading ? <DashboardSkeleton /> : null}
        <div style={{ padding: "18px 22px", display: loading ? "none" : "block" }}>
          {isClient && (
            <div style={{ background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 8, padding: "9px 14px", marginBottom: 16, fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#a78bfa" }}>◎</span> Viendo: <strong style={{ color: "#ddd" }}>{mainAccount.name}</strong> · Solo lectura
            </div>
          )}

          {/* DASHBOARD */}
          {nav === "dashboard" && (
            <>
              <PhaseBlock color="#1a56db" title="Primera fase del embudo: CREATIVOS"
                metrics={[{label:"Alcance",value:agg.alcance,type:"k"},{label:"Impresiones",value:agg.impressions,type:"k"},{label:"CTR Único",value:agg.ctr,type:"%",goal:goals.ctr,highlight:"#60a5fa"},{label:"Clics enlace",value:agg.clics,type:"k"},{label:"CPM",value:agg.cpm,type:"$"}]} />
              <PhaseBlock color="#d97706" title="Segunda fase del embudo: ACCIONES EN TIENDA"
                metrics={[{label:"Add to Cart",value:agg.addToCart,type:"k"},{label:"Pagos iniciados",value:agg.pagosIniciados,type:"k"},{label:"Costo pago inic.",value:agg.costoPagos,type:"$"}]} />
              <PhaseBlock color="#dc2626" title="Tercera fase del embudo: CONVERSIÓN"
                metrics={[{label:"Inversión",value:agg.spend,type:"$"},{label:"Facturación",value:agg.revenue,type:"$"},{label:"Costo x compra",value:agg.cpa,type:"$",goal:goals.cpa,inv:true},{label:"ROAS",value:agg.roas,type:"x",goal:goals.roas},{label:"Conversiones",value:agg.conversions,type:"k"}]} />
              {canEdit && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 210px", gap: 14, marginBottom: 20 }} className="main-grid-2col">
                    <div style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 12, padding: "15px 17px" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 11 }}>Performance semanal · {mainAccount.name}</div>
                      <PerfChart daily={mainAccount.daily} color={mainAccount.color} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      {[
                        { l: "Ganancia neta", v: `$${(agg.revenue - agg.spend).toLocaleString()}` },
                        { l: "ROI",           v: `${(((agg.revenue - agg.spend) / agg.spend) * 100).toFixed(0)}%` },
                        { l: "Conv. rate",    v: `${((agg.conversions / agg.clics) * 100).toFixed(1)}%` },
                        { l: "Ticket prom.",  v: `$${(agg.revenue / agg.conversions).toFixed(0)}` },
                        { l: "Pagos→Compra",  v: `${((agg.conversions / agg.pagosIniciados) * 100).toFixed(0)}%` },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 8, padding: "11px 13px" }}>
                          <div style={{ fontSize: 10, color: "#555", marginBottom: 2 }}>{l}</div>
                          <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace", color: "#ccc" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 12, padding: "15px 17px" }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>Campañas · {mainAccount.name}</div>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "#555" }}>{mainAccount.campaigns.filter(c => c.status === "ACTIVE").length} activas</span>
                    </div>
                    <CampaignsTable campaigns={mainAccount.campaigns} goals={goals} />
                  </div>
                </>
              )}
            </>
          )}

          {nav === "creatives" && <CreativosModule account={mainAccount} goals={goals} />}

          {nav === "campaigns" && canEdit && (
            <div style={{ background: "#111215", border: "1px solid #1c1e22", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ddd", marginBottom: 16 }}>Campañas · {mainAccount.name}</div>
              <CampaignsTable campaigns={mainAccount.campaigns} goals={goals} />
            </div>
          )}

          {nav === "tasks" && <TasksModule currentUser={user} userAccounts={userAccounts} activeProjectId={activeProjectId} allUsers={allUsers} allAccounts={allAccounts} />}

          {nav === "settings" && canEdit && <SettingsModule allAccounts={allAccounts} setAllAccounts={setAllAccounts} allUsers={allUsers} setAllUsers={setAllUsers} />}

          {nav === "clients" && canEdit && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#333" }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>◎</div>
              <div style={{ fontSize: 16, color: "#555", fontWeight: 500 }}>Portal de Clientes</div>
              <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>Próximamente · En desarrollo</div>
            </div>
          )}
        </div>
      </div>

      {goalsModal && (
        <GoalsModal account={mainAccount}
          onSave={g => { setAccountGoals(p => ({ ...p, [mainAccount.id]: g })); setGoalsModal(false); toast("Objetivos guardados correctamente"); }}
          onClose={() => setGoalsModal(false)} />
      )}

      {reportModal && (
        <ReportBuilder account={mainAccount} goals={goals} onClose={() => { setReportModal(false); setNav("dashboard"); }} />
      )}
    </div>
  );
}

// ─── REPORT BUILDER (full) ────────────────────────────────────────────────────
const PDF_BLOCKS = [
  { id: "summary",    label: "Resumen ejecutivo",       desc: "Análisis automático del período" },
  { id: "kpis",       label: "KPIs principales",         desc: "ROAS, CPA, CTR, Revenue, Gasto" },
  { id: "goals",      label: "Estado de objetivos",      desc: "Semáforo verde/rojo vs metas" },
  { id: "funnel",     label: "Métricas del embudo",      desc: "3 fases: Creativos→Acciones→Conv." },
  { id: "chart_roas", label: "Gráfico ROAS diario",      desc: "Evolución del ROAS en el período" },
  { id: "chart_rev",  label: "Gráfico Revenue vs Gasto", desc: "Barras comparativas diarias" },
  { id: "creativos",  label: "Top creativos",            desc: "Ranking por ROAS con hook rate" },
  { id: "campaigns",  label: "Tabla de campañas",        desc: "Performance por campaña activa" },
  { id: "reach",      label: "Alcance y frecuencia",     desc: "Impresiones, CPM, clics enlace" },
];

function ReportBuilder({ account, goals, onClose }) {
  const [sel, setSel]         = useState(["summary","kpis","goals","funnel","chart_roas","creativos","campaigns"]);
  const [dateFrom, setDateFrom] = useState("2025-03-10");
  const [dateTo, setDateTo]     = useState("2025-03-16");
  const [note, setNote]         = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview]   = useState(true);

  function toggle(id) { setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  function moveUp(i) { if (i === 0) return; const n = [...sel]; [n[i-1], n[i]] = [n[i], n[i-1]]; setSel(n); }
  function moveDn(i) { if (i === sel.length - 1) return; const n = [...sel]; [n[i], n[i+1]] = [n[i+1], n[i]]; setSel(n); }

  const f      = account.funnel;
  const roasOk = f.conversion.roas >= goals.roas;
  const cpaOk  = f.conversion.costoCompra <= goals.cpa;
  const ctrOk  = f.creativos.ctrUnico >= goals.ctr;
  const profit = f.conversion.facturacion - f.conversion.inversion;
  const roi    = ((profit / f.conversion.inversion) * 100).toFixed(0);
  const topCr  = (CREATIVES[account.id] || []).sort((a, b) => b.roas - a.roas).slice(0, 5);

  async function generatePDF() {
    setGenerating(true);
    if (!preview) setPreview(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      await new Promise((res, rej) => { if (window.html2canvas) return res(); const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      await new Promise((res, rej) => { if (window.jspdf) return res(); const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      const el = document.getElementById("pdf-target");
      if (!el) { setGenerating(false); return; }
      const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: el.scrollWidth, height: el.scrollHeight });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const cW = 186, imgH = (canvas.height * cW) / canvas.width;
      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        const sl = Math.min(273, imgH - y);
        const srcY = (y / imgH) * canvas.height, srcH = (sl / imgH) * canvas.height;
        const c2 = document.createElement("canvas"); c2.width = canvas.width; c2.height = srcH;
        c2.getContext("2d").drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        pdf.addImage(c2.toDataURL("image/jpeg", 0.92), "JPEG", 12, 12, cW, sl);
        y += sl;
      }
      pdf.save(`EcomBoost_${account.name}_${dateFrom}_${dateTo}.pdf`);
    } catch (e) { console.error(e); }
    setGenerating(false);
  }

  const cs = { border: "1px solid #e5e7eb", padding: "7px 10px", fontSize: 11, color: "#333" };
  const hs = { ...cs, background: "#f9fafb", fontWeight: 700, fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" };

  // ── PDF CONTENT (light, for capture) ──────────────────────────────────────
  function PDFContent() {
    return (
      <div id="pdf-target" style={{ background: "#fff", color: "#111", fontFamily: "Arial,sans-serif", padding: "28px 32px", minWidth: 640 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #e8572a", paddingBottom: 14, marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              <span style={{ color: "#111" }}>Ecom</span><span style={{ color: "#e8572a" }}>Boost</span>
              <span style={{ color: "#aaa", fontWeight: 400, fontSize: 12 }}> analytics</span>
            </div>
            <div style={{ fontSize: 11, color: "#777", marginTop: 3 }}>Reporte de Performance · Meta Ads</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: account.color }}>{account.name}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{dateFrom} → {dateTo}</div>
            <div style={{ fontSize: 10, color: "#bbb", marginTop: 1 }}>Generado: {new Date().toLocaleDateString("es-AR")}</div>
          </div>
        </div>

        {/* Resumen ejecutivo */}
        {sel.includes("summary") && (
          <div style={{ background: "#fff8f5", border: "1px solid #fcd5c0", borderRadius: 7, padding: "13px 15px", marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#e8572a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Resumen Ejecutivo</div>
            <div style={{ fontSize: 12, color: "#333", lineHeight: 1.75 }}>
              Durante el período <b>{dateFrom} al {dateTo}</b>, <b>{account.name}</b> generó <b>${f.conversion.facturacion.toLocaleString()}</b> en facturación con <b>${f.conversion.inversion.toLocaleString()}</b> de inversión,
              alcanzando un ROAS de <b>{f.conversion.roas.toFixed(1)}x</b> ({roasOk ? "por encima" : "por debajo"} del objetivo de {goals.roas}x).
              Se registraron <b>{f.conversion.conversiones} conversiones</b> con un CPA de <b>${f.conversion.costoCompra.toFixed(2)}</b>.
              El embudo generó <b>{fN(f.creativos.impresiones, "k")}</b> impresiones con un CTR único de <b>{f.creativos.ctrUnico}%</b>,
              derivando en <b>{f.acciones.pagosIniciados} pagos iniciados</b>.
              Ganancia estimada: <b>${profit.toLocaleString()}</b> (ROI: {roi}%).
            </div>
            {note && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #fcd5c0", fontSize: 11, color: "#555", fontStyle: "italic" }}><b style={{ color: "#e8572a", fontStyle: "normal" }}>Nota: </b>{note}</div>}
          </div>
        )}

        {/* Estado de objetivos */}
        {sel.includes("goals") && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Estado de Objetivos</div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 7, overflow: "hidden" }}>
              {[
                { l: "ROAS",     a: `${f.conversion.roas.toFixed(1)}x`,       o: `${goals.roas}x`,   ok: roasOk },
                { l: "CPA",      a: `$${f.conversion.costoCompra.toFixed(2)}`, o: `$${goals.cpa}`,   ok: cpaOk  },
                { l: "CTR Único",a: `${f.creativos.ctrUnico}%`,                o: `${goals.ctr}%`,   ok: ctrOk  },
              ].map(({ l, a, o, ok }, i) => (
                <div key={l} style={{ display: "flex", alignItems: "center", padding: "10px 13px", borderBottom: i < 2 ? "1px solid #f3f4f6" : "none", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: ok ? "#16a34a" : "#dc2626", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, marginRight: 10, flexShrink: 0 }}>{ok ? "✓" : "✗"}</div>
                  <div style={{ flex: 1, fontSize: 12, color: "#333" }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: ok ? "#16a34a" : "#dc2626", marginRight: 12 }}>{a}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>Meta: {o}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPIs principales */}
        {sel.includes("kpis") && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Métricas Principales</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
              {[
                { l: "ROAS",        v: `${f.conversion.roas.toFixed(1)}x`,             ok: roasOk },
                { l: "CPA",         v: `$${f.conversion.costoCompra.toFixed(2)}`,       ok: cpaOk  },
                { l: "CTR Único",   v: `${f.creativos.ctrUnico}%`,                     ok: ctrOk  },
                { l: "Facturación", v: `$${f.conversion.facturacion.toLocaleString()}`, ok: true   },
                { l: "Inversión",   v: `$${f.conversion.inversion.toLocaleString()}`,   ok: true   },
                { l: "Conversiones",v: f.conversion.conversiones,                       ok: true   },
              ].map(({ l, v, ok }) => (
                <div key={l} style={{ border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`, borderRadius: 7, padding: "10px 12px", background: ok ? "#f0fdf4" : "#fef2f2" }}>
                  <div style={{ fontSize: 9, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: ok ? "#15803d" : "#dc2626", fontFamily: "monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embudo completo */}
        {sel.includes("funnel") && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Métricas del Embudo</div>
            {[
              { title: "1ª Fase: Creativos",  color: "#1a56db", items: [{ l: "Alcance", v: fN(f.creativos.alcance, "k") }, { l: "Impresiones", v: fN(f.creativos.impresiones, "k") }, { l: "CTR Único", v: `${f.creativos.ctrUnico}%` }, { l: "Clics enlace", v: fN(f.creativos.clicsEnlace, "k") }, { l: "CPM", v: `$${f.creativos.cpm.toLocaleString()}` }] },
              { title: "2ª Fase: Acciones",   color: "#d97706", items: [{ l: "Add to Cart", v: f.acciones.addToCart.toLocaleString() }, { l: "Pagos iniciados", v: f.acciones.pagosIniciados.toLocaleString() }, { l: "Costo pago inic.", v: `$${f.acciones.costoPagosIniciados.toLocaleString()}` }] },
              { title: "3ª Fase: Conversión", color: "#dc2626", items: [{ l: "Inversión", v: `$${f.conversion.inversion.toLocaleString()}` }, { l: "Facturación", v: `$${f.conversion.facturacion.toLocaleString()}` }, { l: "Costo x compra", v: `$${f.conversion.costoCompra.toFixed(2)}` }, { l: "ROAS", v: `${f.conversion.roas.toFixed(1)}x` }] },
            ].map(({ title, color, items }) => (
              <div key={title} style={{ marginBottom: 9 }}>
                <div style={{ background: color, borderRadius: 5, padding: "5px 12px", marginBottom: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{title}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 6 }}>
                  {items.map(({ l, v }) => (
                    <div key={l} style={{ border: "1px solid #e5e7eb", borderRadius: 5, padding: "8px 10px" }}>
                      <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gráfico ROAS */}
        {sel.includes("chart_roas") && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Evolución del ROAS</div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: 12 }}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={account.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip />
                  <Line type="monotone" dataKey="roas" stroke="#e8572a" strokeWidth={2.5} dot={{ fill: "#e8572a", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gráfico Revenue vs Gasto */}
        {sel.includes("chart_rev") && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Revenue vs Gasto Diario</div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 7, padding: 12 }}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={account.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#e8572a" opacity={0.85} radius={[3,3,0,0]} name="Revenue" />
                  <Bar dataKey="spend"   fill="#3b82f6" opacity={0.7}  radius={[3,3,0,0]} name="Gasto"   />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top creativos */}
        {sel.includes("creativos") && topCr.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Top Creativos por ROAS</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["#","Creativo","Tipo","Hook Rate","ROAS","CPA","CTR","Conv."].map(h => <th key={h} style={hs}>{h}</th>)}</tr></thead>
              <tbody>
                {topCr.map((cr, i) => (
                  <tr key={cr.id} style={{ background: i === 0 ? "#fff8f5" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ ...cs, fontWeight: 700, color: i === 0 ? "#e8572a" : "#888" }}>{i === 0 ? "★" : i + 1}</td>
                    <td style={{ ...cs, fontWeight: 500, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cr.name}</td>
                    <td style={cs}><span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: cr.type === "VIDEO" ? "#ede9fe" : "#dcfce7", color: cr.type === "VIDEO" ? "#7c3aed" : "#15803d", fontWeight: 700 }}>{cr.type}</span></td>
                    <td style={{ ...cs, color: cr.hookRate >= 40 ? "#15803d" : cr.hookRate >= 25 ? "#92400e" : "#dc2626", fontWeight: 700 }}>{cr.hookRate.toFixed(1)}%</td>
                    <td style={{ ...cs, color: cr.roas >= goals.roas ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{cr.roas.toFixed(1)}x</td>
                    <td style={{ ...cs, color: cr.cpa <= goals.cpa ? "#16a34a" : "#dc2626", fontWeight: 700 }}>${cr.cpa.toFixed(1)}</td>
                    <td style={{ ...cs, color: cr.ctr >= goals.ctr ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{cr.ctr.toFixed(1)}%</td>
                    <td style={cs}>{cr.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Campañas */}
        {sel.includes("campaigns") && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Performance por Campaña</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Campaña","Gasto","Revenue","ROAS","CPA","CTR","Conv."].map(h => <th key={h} style={hs}>{h}</th>)}</tr></thead>
              <tbody>
                {account.campaigns.filter(c => c.status === "ACTIVE").map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ ...cs, fontWeight: 500 }}>{c.name}</td>
                    <td style={cs}>${c.spend.toLocaleString()}</td>
                    <td style={cs}>${c.revenue.toLocaleString()}</td>
                    <td style={{ ...cs, color: c.roas >= goals.roas ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{c.roas.toFixed(1)}x</td>
                    <td style={{ ...cs, color: c.cpa  <= goals.cpa  ? "#16a34a" : "#dc2626", fontWeight: 700 }}>${c.cpa.toFixed(1)}</td>
                    <td style={{ ...cs, color: c.ctr  >= goals.ctr  ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{c.ctr.toFixed(1)}%</td>
                    <td style={cs}>{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Alcance y frecuencia */}
        {sel.includes("reach") && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Alcance y Frecuencia</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[
                { l: "Impresiones",  v: fN(f.creativos.impresiones, "k") },
                { l: "Alcance",      v: fN(f.creativos.alcance, "k") },
                { l: "CPM",          v: `$${f.creativos.cpm.toLocaleString()}` },
                { l: "Clics enlace", v: fN(f.creativos.clicsEnlace, "k") },
              ].map(({ l, v }) => (
                <div key={l} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "9px 11px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111", fontFamily: "monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 18, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#ccc" }}>
          <span>EcomBoost Analytics · Confidencial</span>
          <span>{new Date().toLocaleDateString("es-AR")}</span>
        </div>
      </div>
    );
  }

  // ── LAYOUT ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 200, display: "flex", overflow: "hidden", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* Left panel: builder controls */}
      <div style={{ width: 290, background: "#111215", borderRight: "1px solid #1c1e22", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "15px 16px 12px", borderBottom: "1px solid #1c1e22", display: "flex", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Constructor de Reporte</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{account.name} · Armá tu PDF a medida</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "13px 13px" }}>

          {/* Date range */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Período</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["Desde", dateFrom, setDateFrom], ["Hasta", dateTo, setDateTo]].map(([l, v, sv]) => (
                <div key={l} style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>{l}</div>
                  <input type="date" value={v} onChange={e => sv(e.target.value)}
                    style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 6, color: "#ddd", padding: "7px 8px", fontSize: 11, boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Block toggles */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Secciones del reporte</div>
            {PDF_BLOCKS.map(b => {
              const on = sel.includes(b.id);
              return (
                <div key={b.id} onClick={() => toggle(b.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 7, border: `1px solid ${on ? "#e8572a40" : "#1c1e22"}`, background: on ? "#e8572a0d" : "#0d0f12", cursor: "pointer", marginBottom: 5, transition: "all 0.12s" }}>
                  <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${on ? "#e8572a" : "#333"}`, background: on ? "#e8572a" : "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8, color: "#fff" }}>{on ? "✓" : ""}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: on ? 600 : 400, color: on ? "#f0f0f0" : "#777" }}>{b.label}</div>
                    <div style={{ fontSize: 9, color: "#444", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order */}
          {sel.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Orden en el PDF</div>
              {sel.map((id, idx) => {
                const b = PDF_BLOCKS.find(x => x.id === id);
                return (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "#0d0f12", border: "1px solid #1c1e22", borderRadius: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "#444", minWidth: 16, textAlign: "center" }}>{idx + 1}</span>
                    <span style={{ flex: 1, fontSize: 10, color: "#999" }}>{b?.label}</span>
                    <button onClick={e => { e.stopPropagation(); moveUp(idx); }} style={{ background: "none", border: "1px solid #2a2d35", borderRadius: 3, color: "#555", cursor: "pointer", padding: "1px 5px", fontSize: 10 }}>↑</button>
                    <button onClick={e => { e.stopPropagation(); moveDn(idx); }} style={{ background: "none", border: "1px solid #2a2d35", borderRadius: 3, color: "#555", cursor: "pointer", padding: "1px 5px", fontSize: 10 }}>↓</button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Note */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Nota para el cliente</div>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Comentario adicional que aparece en el resumen..."
              style={{ width: "100%", background: "#0d0f12", border: "1px solid #2a2d35", borderRadius: 7, color: "#ddd", padding: "8px 10px", fontSize: 11, minHeight: 70, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: 11, borderTop: "1px solid #1c1e22", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setPreview(p => !p)} style={{ padding: "9px 0", background: "#1c1e22", border: "1px solid #2a2d35", borderRadius: 7, color: "#ccc", cursor: "pointer", fontSize: 12 }}>
            {preview ? "◂ Ocultar preview" : "▸ Ver preview"}
          </button>
          <button onClick={generatePDF} disabled={generating || sel.length === 0}
            style={{ padding: "11px 0", background: sel.length === 0 ? "#1c1e22" : "#e8572a", border: "none", borderRadius: 7, color: sel.length === 0 ? "#444" : "#fff", cursor: sel.length === 0 ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {generating ? "⏳ Generando..." : "⬇ Descargar PDF"}
          </button>
        </div>
      </div>

      {/* Right panel: preview */}
      <div style={{ flex: 1, overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {!preview
          ? (
            <div style={{ color: "#444", marginTop: 80, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>⊟</div>
              <div style={{ fontSize: 13, color: "#555" }}>Hacé clic en "Ver preview" para previsualizar el reporte</div>
            </div>
          )
          : (
            <div style={{ maxWidth: 740, width: "100%", boxShadow: "0 0 50px rgba(0,0,0,0.5)", borderRadius: 4 }}>
              <PDFContent />
            </div>
          )}
      </div>
    </div>
  );
}
