import { useState, useMemo, useEffect, useCallback, useRef, createContext, useContext } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from "recharts";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import * as reportStore from "./lib/reportStore";
import AuditoriaPage from "./modules/auditoria/AuditoriaPage";
import GananciasModule from "./modules/ganancias/GananciasModule";

// ─── THEME ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext(null);
function useT() { return useContext(ThemeCtx); }

const DARK = {
  mode: "dark",
  bg: "#13161d", bg1: "#191c25", bg2: "#1e222c",
  border: "#262a35", border2: "#313643",
  text: "#f0f0f0", textSub: "#ddd", textMuted: "#888", textDim: "#555", textFaint: "#444",
  hover: "#1c2030", divider: "#21252f",
  ok:   { bg: "#0a2e1a", text: "#4ade80", border: "#166534" },
  warn: { bg: "#2a1f00", text: "#fbbf24", border: "#854d0e" },
  bad:  { bg: "#2d0a0a", text: "#f87171", border: "#991b1b" },
};
const LIGHT = {
  mode: "light",
  bg: "#f0f4f8", bg1: "#ffffff", bg2: "#f8fafc",
  border: "#e2e8f0", border2: "#cbd5e1",
  text: "#1e293b", textSub: "#374151", textMuted: "#6b7280", textDim: "#94a3b8", textFaint: "#cbd5e1",
  hover: "#f1f5f9", divider: "#f1f5f9",
  ok:   { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
  warn: { bg: "#fef9c3", text: "#a16207", border: "#fde047" },
  bad:  { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
};

// ─── TOAST ────────────────────────────────────────────────────────────────────
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
    <div style={{ position:"fixed",top:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:10,minWidth:260,maxWidth:360,
          background:t.type==="error"?"#2d0a0a":t.type==="warn"?"#2a1f00":"#0a2e1a",
          border:`1px solid ${t.type==="error"?"#991b1b":t.type==="warn"?"#854d0e":"#166534"}`,
          color:t.type==="error"?"#f87171":t.type==="warn"?"#fbbf24":"#4ade80",
          fontSize:13,fontFamily:"'Inter',system-ui,sans-serif",
          animation:"slideIn 0.2s ease",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
        }}>
          <span style={{fontSize:15}}>{t.type==="error"?"✗":t.type==="warn"?"⚠":"✓"}</span>
          <span style={{flex:1}}>{t.msg}</span>
          <button onClick={()=>setToasts(p=>p.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",color:"inherit",cursor:"pointer",opacity:0.6,fontSize:16,padding:0}}>×</button>
        </div>
      ))}
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({ w="100%", h=20, radius=6 }) {
  return <div style={{width:w,height:h,borderRadius:radius,background:"linear-gradient(90deg,#1c1e22 25%,#252830 50%,#1c1e22 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.4s infinite"}} />;
}
function DashboardSkeleton() {
  return (
    <div style={{padding:"18px 22px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:20}}>
        {[...Array(5)].map((_,i)=><div key={i} style={{background:"#111215",border:"1px solid #1c1e22",borderRadius:10,padding:"13px 15px"}}><Skeleton h={10} w="60%" radius={4}/><div style={{marginTop:10}}><Skeleton h={26} radius={4}/></div></div>)}
      </div>
      <div style={{background:"#111215",border:"1px solid #1c1e22",borderRadius:12,padding:"18px 20px",marginBottom:20}}>
        <Skeleton h={14} w="200px" radius={4}/>
        <div style={{marginTop:16}}><Skeleton h={185} radius={8}/></div>
      </div>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

// ─── MOBILE HEADER ────────────────────────────────────────────────────────────
function MobileHeader({ account, onMenu, onPDF }) {
  const T = useT();
  return (
    <div className="mobile-header" style={{display:"none",alignItems:"center",gap:10,padding:"12px 16px",background:T.bg1,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:20}}>
      <button onClick={onMenu} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:20,padding:0}}>☰</button>
      <div style={{width:28,height:28,borderRadius:7,background:account?.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{account?.logo}</div>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.text}}>{account?.name}</div></div>
      <button onClick={onPDF} style={{padding:"6px 12px",background:"#e8572a",border:"none",borderRadius:7,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>PDF</button>
    </div>
  );
}
function MobileSidebarOverlay({ open, onClose, children }) {
  const T = useT();
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:100,display:"flex"}}>
      <div style={{flex:1,background:"rgba(0,0,0,0.6)"}} onClick={onClose}/>
      <div style={{width:260,background:T.bg1,borderRight:`1px solid ${T.border}`,height:"100%",overflowY:"auto",position:"absolute",left:0,top:0,bottom:0}}>{children}</div>
    </div>
  );
}

// ─── CONSTANTS & HELPERS ──────────────────────────────────────────────────────
const ROLE_LABEL = { master:"Master", team:"Equipo", client:"Cliente" };
const ROLE_COLOR = { master:"#e8572a", team:"#60a5fa", client:"#a78bfa" };
const PRIORITY_COLOR = { high:"#f87171", medium:"#fbbf24", low:"#4ade80" };
const PRIORITY_LABEL = { high:"Alta", medium:"Media", low:"Baja" };
const ACCOUNT_COLORS = ["#e8572a","#d63384","#198754","#1877f2","#8b5cf6","#0891b2","#d97706","#dc2626","#059669","#0f766e"];

function sc(v, g, inv=false, T=DARK) {
  const r = inv ? g/v : v/g;
  if (r>=1) return T.ok;
  if (r>=0.85) return T.warn;
  return T.bad;
}
function fN(v, t) {
  if (t==="$") return `$${Number(v).toLocaleString("es-AR",{minimumFractionDigits:0})}`;
  if (t==="%") return `${Number(v).toFixed(1)}%`;
  if (t==="x") return `${Number(v).toFixed(1)}x`;
  if (t==="k") { if (v>=1000000) return `${(v/1000000).toFixed(1)}M`; if (v>=1000) return `${(v/1000).toFixed(0)}k`; return String(Math.round(v)); }
  return String(v);
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  { id:"u1", name:"Nicolas",          email:"nicolas@elevatearg.com",   role:"master", avatar:"NB", accounts:["act_001","act_002","act_003"] },
  { id:"u2", name:"Tomas",            email:"tomas@elevatearg.com",     role:"team",   avatar:"T",  accounts:["act_001","act_002","act_003"] },
  { id:"u3", name:"Cliente Ruby",     email:"cliente@ruby.com",         role:"client", avatar:"CR", accounts:["act_002"] },
  { id:"u4", name:"Cliente Elemental",email:"cliente@elemental.com",    role:"client", avatar:"CE", accounts:["act_003"] },
];
const DEMO_ACCOUNTS = [
  { id:"act_001",name:"Powernax",color:"#e8572a",logo:"PX",client_name:null,client_email:null,logo_url:null,
    goals:{roas:3.5,cpa:6.0,ctr:1.8,budget:2500},
    funnel:{creativos:{alcance:142000,impresiones:801000,ctrUnico:7.22,clicsEnlace:6535,cpm:2130},acciones:{addToCart:913,pagosIniciados:242,costoPagosIniciados:7053},conversion:{inversion:1840,facturacion:7360,costoCompra:5.2,roas:4.0,conversiones:354}},
    daily:[{day:"Lun",spend:263,revenue:1051,roas:4.0,conversions:51},{day:"Mar",spend:280,revenue:1176,roas:4.2,conversions:54},{day:"Mié",spend:245,revenue:980,roas:4.0,conversions:47},{day:"Jue",spend:271,revenue:1138,roas:4.2,conversions:53},{day:"Vie",spend:310,revenue:1333,roas:4.3,conversions:61},{day:"Sáb",spend:258,revenue:955,roas:3.7,conversions:50},{day:"Dom",spend:213,revenue:727,roas:3.4,conversions:38}],
    campaigns:[{id:"c1",name:"Proteinas - ABO Testing",status:"ACTIVE",spend:420,revenue:1890,roas:4.5,cpa:4.8,ctr:2.4,conversions:88},{id:"c2",name:"Quemadores - CBO Scale",status:"ACTIVE",spend:680,revenue:2584,roas:3.8,cpa:5.6,ctr:2.1,conversions:121},{id:"c3",name:"Aminoacidos - Retargeting",status:"ACTIVE",spend:310,revenue:1364,roas:4.4,cpa:4.9,ctr:1.9,conversions:63},{id:"c4",name:"Creatina - Testing",status:"PAUSED",spend:240,revenue:720,roas:3.0,cpa:6.9,ctr:1.5,conversions:35}],
  },
  { id:"act_002",name:"Ruby Fajas",color:"#d63384",logo:"RB",client_name:"Ruby Estévez",client_email:"ruby@rubyfajas.com",logo_url:null,
    goals:{roas:4.0,cpa:8.0,ctr:2.0,budget:3200},
    funnel:{creativos:{alcance:220000,impresiones:1200000,ctrUnico:5.8,clicsEnlace:9600,cpm:2480},acciones:{addToCart:1420,pagosIniciados:398,costoPagosIniciados:7490},conversion:{inversion:2980,facturacion:10430,costoCompra:9.4,roas:3.5,conversiones:317}},
    daily:[{day:"Lun",spend:426,revenue:1490,roas:3.5,conversions:45},{day:"Mar",spend:455,revenue:1638,roas:3.6,conversions:49},{day:"Mié",spend:390,revenue:1365,roas:3.5,conversions:41},{day:"Jue",spend:442,revenue:1593,roas:3.6,conversions:48},{day:"Vie",spend:510,revenue:1836,roas:3.6,conversions:55},{day:"Sáb",spend:398,revenue:1393,roas:3.5,conversions:42},{day:"Dom",spend:359,revenue:1115,roas:3.1,conversions:37}],
    campaigns:[{id:"c6",name:"Fajas Colombianas - Scale",status:"ACTIVE",spend:1200,revenue:4200,roas:3.5,cpa:9.8,ctr:1.7,conversions:122},{id:"c7",name:"Body Shapers - ABO Test",status:"ACTIVE",spend:890,revenue:2938,roas:3.3,cpa:9.1,ctr:1.5,conversions:98},{id:"c8",name:"Retargeting Abandonos",status:"ACTIVE",spend:560,revenue:2240,roas:4.0,cpa:8.0,ctr:1.9,conversions:70}],
  },
  { id:"act_003",name:"Elemental Outfit",color:"#198754",logo:"EO",client_name:null,client_email:null,logo_url:null,
    goals:{roas:3.0,cpa:12.0,ctr:1.5,budget:1200},
    funnel:{creativos:{alcance:71000,impresiones:310000,ctrUnico:4.9,clicsEnlace:2800,cpm:2870},acciones:{addToCart:340,pagosIniciados:102,costoPagosIniciados:8730},conversion:{inversion:890,facturacion:2847,costoCompra:11.1,roas:3.2,conversiones:80}},
    daily:[{day:"Lun",spend:127,revenue:406,roas:3.2,conversions:11},{day:"Mar",spend:140,revenue:476,roas:3.4,conversions:13},{day:"Mié",spend:119,revenue:393,roas:3.3,conversions:11},{day:"Jue",spend:128,revenue:422,roas:3.3,conversions:12},{day:"Vie",spend:155,revenue:527,roas:3.4,conversions:14},{day:"Sáb",spend:110,revenue:352,roas:3.2,conversions:10},{day:"Dom",spend:111,revenue:271,roas:2.4,conversions:9}],
    campaigns:[{id:"c10",name:"Ropa Hombre - ABO",status:"ACTIVE",spend:440,revenue:1496,roas:3.4,cpa:11.0,ctr:1.8,conversions:40},{id:"c11",name:"Nueva Coleccion - Test",status:"ACTIVE",spend:280,revenue:896,roas:3.2,cpa:10.0,ctr:1.6,conversions:28},{id:"c12",name:"Retargeting General",status:"ACTIVE",spend:170,revenue:612,roas:3.6,cpa:9.4,ctr:1.9,conversions:18}],
  },
];
const DEMO_TASKS = [
  {id:"t1",title:"Revisar creativos semana 12",desc:"Analizar hook rate y decidir cuáles escalar",status:"todo",priority:"high",assignee:"u2",account:"act_001",dueDate:"2025-06-15",type:"team"},
  {id:"t2",title:"Subir nuevos creativos al BM",desc:"4 videos nuevos para testear en ABO",status:"inprogress",priority:"high",assignee:"u1",account:"act_001",dueDate:"2025-06-14",type:"team"},
  {id:"t3",title:"Ajustar presupuesto campañas",desc:"CBO Scale subir de $300 a $450/día",status:"todo",priority:"medium",assignee:"u1",account:"act_002",dueDate:"2025-06-16",type:"team"},
  {id:"t4",title:"Enviar reporte semanal",desc:"PDF con resultados",status:"done",priority:"low",assignee:"u2",account:"act_001",dueDate:"2025-06-10",type:"team"},
  {id:"t5",title:"Aprobar nuevas imágenes",desc:"Confirmar los 3 banners para retargeting",status:"todo",priority:"high",assignee:"u3",account:"act_002",dueDate:"2025-06-15",type:"client"},
  {id:"t6",title:"Revisar landing page checkout",desc:"Problema con el botón en mobile",status:"inprogress",priority:"medium",assignee:"u3",account:"act_002",dueDate:"2025-06-17",type:"client"},
  {id:"t7",title:"Confirmar catálogo de productos",desc:"Actualizar feed de productos en Meta",status:"todo",priority:"medium",assignee:"u4",account:"act_003",dueDate:"2025-06-18",type:"client"},
];
const CREATIVES = {
  act_001:[
    {id:"cr1",name:"Proteina Whey — UGC Testimonio",campaign:"Proteinas - ABO Testing",type:"VIDEO",thumb:"💪",color:"#e8572a",hookRate:38.2,ctr:3.1,cpm:1820,frecuencia:1.4,alcance:28000,clics:868,conversions:72,cpa:4.2,spend:302,revenue:1512,roas:5.0,impressions:39200},
    {id:"cr2",name:"Proteina Whey — Producto Plano",campaign:"Proteinas - ABO Testing",type:"IMAGE",thumb:"📦",color:"#f59e0b",hookRate:21.4,ctr:1.8,cpm:2140,frecuencia:1.9,alcance:18000,clics:324,conversions:28,cpa:7.1,spend:199,revenue:672,roas:3.4,impressions:34200},
    {id:"cr3",name:"Quemador Fat Burn — Antes/Después",campaign:"Quemadores - CBO Scale",type:"IMAGE",thumb:"🔥",color:"#dc2626",hookRate:44.7,ctr:3.8,cpm:1650,frecuencia:1.2,alcance:42000,clics:1596,conversions:118,cpa:3.9,spend:460,revenue:2124,roas:4.6,impressions:50400},
    {id:"cr4",name:"Quemador — Reels Lifestyle",campaign:"Quemadores - CBO Scale",type:"VIDEO",thumb:"🎬",color:"#8b5cf6",hookRate:29.1,ctr:2.2,cpm:2310,frecuencia:2.1,alcance:22000,clics:484,conversions:38,cpa:5.8,spend:220,revenue:684,roas:3.1,impressions:46200},
    {id:"cr5",name:"Aminoácidos — Comparativa",campaign:"Aminoacidos - Retargeting",type:"IMAGE",thumb:"⚗️",color:"#0891b2",hookRate:18.9,ctr:2.6,cpm:1980,frecuencia:2.8,alcance:14000,clics:364,conversions:48,cpa:4.4,spend:211,revenue:912,roas:4.3,impressions:39200},
    {id:"cr6",name:"Creatina — Demo en Gym",campaign:"Creatina - Testing",type:"VIDEO",thumb:"🏋️",color:"#059669",hookRate:52.3,ctr:2.9,cpm:1720,frecuencia:1.1,alcance:19000,clics:551,conversions:44,cpa:3.6,spend:158,revenue:704,roas:4.5,impressions:20900},
  ],
  act_002:[
    {id:"cr7",name:"Faja Colombiana — Video Unboxing",campaign:"Fajas Colombianas - Scale",type:"VIDEO",thumb:"📦",color:"#d63384",hookRate:41.0,ctr:2.8,cpm:2100,frecuencia:1.3,alcance:55000,clics:1540,conversions:98,cpa:8.2,spend:803,revenue:2842,roas:3.5,impressions:71500},
    {id:"cr8",name:"Body Shaper — Reels Transición",campaign:"Body Shapers - ABO Test",type:"VIDEO",thumb:"✨",color:"#9333ea",hookRate:58.4,ctr:3.5,cpm:1890,frecuencia:1.1,alcance:68000,clics:2380,conversions:142,cpa:7.1,spend:1008,revenue:3976,roas:3.9,impressions:74800},
    {id:"cr9",name:"Faja — Foto Producto Blanco",campaign:"Fajas Colombianas - Scale",type:"IMAGE",thumb:"🤍",color:"#6366f1",hookRate:15.2,ctr:1.2,cpm:2650,frecuencia:2.4,alcance:32000,clics:384,conversions:31,cpa:12.9,spend:400,revenue:868,roas:2.2,impressions:76800},
    {id:"cr10",name:"Retargeting — Carrito Abandonado",campaign:"Retargeting Abandonos",type:"IMAGE",thumb:"🛒",color:"#f59e0b",hookRate:22.1,ctr:4.2,cpm:1420,frecuencia:3.1,alcance:18000,clics:756,conversions:88,cpa:6.4,spend:563,revenue:2464,roas:4.4,impressions:55800},
  ],
  act_003:[
    {id:"cr11",name:"Remera Oversize — Lifestyle",campaign:"Ropa Hombre - ABO",type:"IMAGE",thumb:"👕",color:"#198754",hookRate:27.3,ctr:2.1,cpm:2800,frecuencia:1.6,alcance:28000,clics:588,conversions:34,cpa:10.3,spend:350,revenue:952,roas:2.7,impressions:44800},
    {id:"cr12",name:"Nueva Colección — Lookbook Video",campaign:"Nueva Coleccion - Test",type:"VIDEO",thumb:"🎥",color:"#0ea5e9",hookRate:35.8,ctr:2.8,cpm:2400,frecuencia:1.2,alcance:22000,clics:616,conversions:29,cpa:9.7,spend:281,revenue:812,roas:2.9,impressions:26400},
    {id:"cr13",name:"Retargeting — Descuento 15%",campaign:"Retargeting General",type:"IMAGE",thumb:"🏷️",color:"#f59e0b",hookRate:19.5,ctr:3.9,cpm:1680,frecuencia:2.9,alcance:12000,clics:468,conversions:22,cpa:7.7,spend:169,revenue:616,roas:3.6,impressions:34800},
  ],
};

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({ size=14 }) {
  return (
    <span style={{fontWeight:800,fontSize:size,letterSpacing:"-0.5px",lineHeight:1}}>
      <span style={{color:"#fff"}}>Ecom</span>
      <span style={{color:"#e8572a"}}>Boost</span>
      <span style={{color:"#555",fontWeight:400,fontSize:size*0.75}}> analytics</span>
    </span>
  );
}
function LogoLight({ size=14 }) {
  return (
    <span style={{fontWeight:800,fontSize:size,letterSpacing:"-0.5px",lineHeight:1}}>
      <span style={{color:"#1e293b"}}>Ecom</span>
      <span style={{color:"#e8572a"}}>Boost</span>
      <span style={{color:"#94a3b8",fontWeight:400,fontSize:size*0.75}}> analytics</span>
    </span>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const T = useT();
  const [email, setEmail]   = useState("");
  const [pass,  setPass]    = useState("");
  const [err,   setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const inp = { width:"100%",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,padding:"12px 14px",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Inter',system-ui,sans-serif" };

  async function handle() {
    if (!email.trim()) { setErr("Ingresá tu email"); return; }
    setLoading(true); setErr("");
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) { setErr(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : error.message); setLoading(false); return; }
      // Profile loaded by App via onAuthStateChange
    } else {
      // Demo mode
      const u = DEMO_USERS.find(u => u.email === email.trim());
      if (!u) { setErr("Usuario no encontrado (modo demo)"); setLoading(false); return; }
      onLogin(u);
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif",transition:"background 0.3s"}}>
      <div style={{width:380,padding:40,background:T.bg1,border:`1px solid ${T.border}`,borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{marginBottom:16}}>
            {T.mode==="dark" ? <Logo size={28}/> : <LogoLight size={28}/>}
          </div>
          <div style={{fontSize:12,color:T.textDim,marginTop:6}}>Plataforma de análisis · Meta Ads</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Email</div>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" style={inp} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Contraseña{!isSupabaseConfigured&&<span style={{color:T.textFaint,fontSize:10}}> (cualquiera en modo demo)</span>}</div>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={inp} onKeyDown={e=>e.key==="Enter"&&handle()}/>
        </div>
        {err && <div style={{fontSize:12,color:"#f87171",marginBottom:12,textAlign:"center"}}>{err}</div>}
        <button onClick={handle} disabled={loading} style={{width:"100%",padding:13,background:"#e8572a",border:"none",borderRadius:10,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"Ingresando...":"Ingresar"}
        </button>
        {isSupabaseConfigured && (
          <div style={{marginTop:14,padding:"8px 12px",background:T.bg,borderRadius:8,border:`1px solid ${T.border}`,textAlign:"center"}}>
            <span style={{fontSize:11,color:T.textDim}}>● Conectado a Supabase</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GOALS MODAL ──────────────────────────────────────────────────────────────
function GoalsModal({ account, onSave, onClose }) {
  const T = useT();
  const [form, setForm] = useState({roas:3,cpa:10,ctr:1.5,budget:1000,...(account.goals||{})});
  const inp = {flex:1,background:"none",border:"none",color:T.text,fontSize:15,padding:"11px 8px",outline:"none"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:16,padding:32,width:400}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:24}}>
          <div style={{fontSize:15,fontWeight:700,color:T.text}}>Objetivos · {account.name}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:22}}>×</button>
        </div>
        {[{k:"roas",l:"ROAS objetivo",s:"x"},{k:"cpa",l:"CPA objetivo",p:"$"},{k:"ctr",l:"CTR objetivo",s:"%"},{k:"budget",l:"Presupuesto diario",p:"$"}].map(({k,l,p,s})=>(
          <div key={k} style={{marginBottom:13}}>
            <div style={{fontSize:11,color:T.textDim,marginBottom:5}}>{l}</div>
            <div style={{display:"flex",alignItems:"center",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:8,padding:"0 12px"}}>
              {p&&<span style={{color:T.textFaint}}>{p}</span>}
              <input type="number" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:parseFloat(e.target.value)||0}))} style={inp}/>
              {s&&<span style={{color:T.textFaint}}>{s}</span>}
            </div>
          </div>
        ))}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={onClose} style={{flex:1,padding:11,background:"none",border:`1px solid ${T.border2}`,borderRadius:8,color:T.textMuted,cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>onSave(form)} style={{flex:1,padding:11,background:"#e8572a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontWeight:700}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── PHASE BLOCK ──────────────────────────────────────────────────────────────
function PhaseBlock({ color, title, metrics }) {
  const T = useT();
  return (
    <div style={{marginBottom:20}}>
      <div style={{background:color,borderRadius:9,padding:"9px 16px",marginBottom:10}}>
        <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>{title}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}} className="phase-grid phase-metrics-grid">
        {metrics.map(({label,value,type,goal,inv,highlight})=>{
          const c = goal ? sc(value,goal,inv,T) : null;
          return (
            <div key={label} style={{background:T.bg1,border:`1px solid ${c?c.border:T.border}`,borderRadius:10,padding:"13px 15px",position:"relative",overflow:"hidden"}}>
              {c&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:c.text,opacity:0.65}}/>}
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:7}}>{label}</div>
              <div style={{fontSize:21,fontWeight:700,fontFamily:"monospace",color:c?c.text:highlight||T.textSub}}>{fN(value,type)}</div>
              {goal&&<div style={{fontSize:10,color:T.textFaint,marginTop:3}}>Obj: <span style={{color:T.textDim}}>{fN(goal,type)}</span></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PERF CHART ───────────────────────────────────────────────────────────────
function PerfChart({ daily, color }) {
  const T = useT();
  const [m, setM] = useState("roas");
  const opts = [["roas","ROAS",color],["revenue","Revenue","#60a5fa"],["spend","Gasto","#f59e0b"],["conversions","Conv.","#a78bfa"]];
  const act = opts.find(o=>o[0]===m);
  return (
    <div>
      <div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>
        {opts.map(([k,l,c])=>(
          <button key={k} onClick={()=>setM(k)} style={{padding:"4px 10px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,background:m===k?c+"20":"none",borderColor:m===k?c:T.border2,color:m===k?c:T.textDim}}>{l}</button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={185}>
        <LineChart data={daily} margin={{top:4,right:8,left:0,bottom:4}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="day" tick={{fontSize:10,fill:T.textDim}} axisLine={false} tickLine={false}/>
          <YAxis tick={{fontSize:10,fill:T.textDim}} axisLine={false} tickLine={false} width={34}/>
          <Tooltip contentStyle={{background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,fontSize:12,color:T.text}} labelStyle={{color:T.textMuted}} itemStyle={{color:act[2]}}/>
          <Line type="monotone" dataKey={m} stroke={act[2]} strokeWidth={2.5} dot={{fill:act[2],r:3}} activeDot={{r:5}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── CAMPAIGNS TABLE ──────────────────────────────────────────────────────────
function CampaignsTable({ campaigns, goals }) {
  const T = useT();
  const [filter, setFilter] = useState(() => { try { return localStorage.getItem('camp_filter')||"ALL"; } catch { return "ALL"; } });
  const [sk, setSk]         = useState(() => { try { return localStorage.getItem('camp_sk')||"spend"; } catch { return "spend"; } });
  const [sd, setSd]         = useState(() => { try { return Number(localStorage.getItem('camp_sd')||"-1"); } catch { return -1; } });
  useEffect(() => { try { localStorage.setItem('camp_filter', filter); } catch {} }, [filter]);
  useEffect(() => { try { localStorage.setItem('camp_sk', sk); }     catch {} }, [sk]);
  useEffect(() => { try { localStorage.setItem('camp_sd', String(sd)); } catch {} }, [sd]);
  const rows = useMemo(()=>{
    let d = filter==="ALL"?campaigns:campaigns.filter(c=>c.status===filter);
    return [...d].sort((a,b)=>(a[sk]-b[sk])*sd);
  },[campaigns,filter,sk,sd]);
  function sort(k){if(k==="name"||k==="status")return;setSd(d=>sk===k?d*-1:-1);setSk(k);}
  const th={fontSize:10,color:T.textDim,letterSpacing:"0.07em",textTransform:"uppercase",padding:"8px 10px",textAlign:"left",cursor:"pointer",userSelect:"none",whiteSpace:"nowrap",background:T.bg};
  const td={padding:"10px 10px",fontSize:12,borderBottom:`1px solid ${T.divider}`,verticalAlign:"middle"};
  function Bdg({v,g,t,inv}){const c=sc(v,g,inv,T);return <span style={{background:c.bg,color:c.text,border:`1px solid ${c.border}`,borderRadius:5,padding:"2px 7px",fontSize:11,fontFamily:"monospace",fontWeight:600}}>{fN(v,t)}</span>;}
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {["ALL","ACTIVE","PAUSED"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:11,background:filter===f?"#e8572a":"none",borderColor:filter===f?"#e8572a":T.border2,color:filter===f?"#fff":T.textDim}}>
            {f==="ALL"?"Todas":f==="ACTIVE"?"Activas":"Pausadas"}
          </button>
        ))}
        <span style={{marginLeft:"auto",fontSize:11,color:T.textDim,alignSelf:"center"}}>{rows.length} campañas</span>
      </div>
      <div className="campaigns-table-wrap" style={{overflowX:"auto",borderRadius:8,border:`1px solid ${T.border}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
          <thead>
            <tr>
              {[["name","Campaña"],["status","Estado"],["spend","Gasto"],["revenue","Revenue"],["roas","ROAS"],["cpa","CPA"],["ctr","CTR"],["conversions","Conv."]].map(([k,l])=>(
                <th key={k} style={th} onClick={()=>sort(k)}>{l}{sk===k?(sd===-1?" ↓":" ↑"):""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,i)=>(
              <tr key={row.id} style={{background:i%2===0?T.bg1:T.bg}}
                onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                onMouseLeave={e=>e.currentTarget.style.background=i%2===0?T.bg1:T.bg}>
                <td style={{...td,color:T.textSub,fontWeight:500,maxWidth:180,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{row.name}</td>
                <td style={td}>
                  <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:row.status==="ACTIVE"?"#0a2e1a":"#1a1a1a",color:row.status==="ACTIVE"?"#4ade80":T.textDim,border:`1px solid ${row.status==="ACTIVE"?"#166534":T.border}`,fontWeight:600}}>
                    {row.status==="ACTIVE"?"Activa":"Pausada"}
                  </span>
                </td>
                <td style={{...td,color:T.textMuted}}>${row.spend.toLocaleString()}</td>
                <td style={{...td,color:T.textMuted}}>${row.revenue.toLocaleString()}</td>
                <td style={td}><Bdg v={row.roas} g={goals.roas} t="x"/></td>
                <td style={td}><Bdg v={row.cpa} g={goals.cpa} t="$" inv={true}/></td>
                <td style={td}><Bdg v={row.ctr} g={goals.ctr} t="%"/></td>
                <td style={{...td,color:T.textMuted}}>{row.conversions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CREATIVOS ────────────────────────────────────────────────────────────────
function MetricBar({ value, max=100, color="#e8572a", label, sublabel }) {
  const T = useT();
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:11,color:T.textMuted}}>{label}</span>
        <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color}}>{sublabel||`${value.toFixed(1)}%`}</span>
      </div>
      <div style={{height:6,background:T.border,borderRadius:3}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width 0.4s"}}/>
      </div>
    </div>
  );
}

function RetentionCurve({ cr }) {
  const T = useT();
  if (!cr.videoViews3s) return null;
  const hookColor = cr.hookRate>=30?"#4ade80":cr.hookRate>=15?"#fbbf24":"#f87171";
  const retPts = [
    { label:"25%",  value:cr.retention25,  color:"#60a5fa" },
    { label:"50%",  value:cr.retention50,  color:"#a78bfa" },
    { label:"75%",  value:cr.retention75,  color:"#f59e0b" },
    { label:"95%",  value:cr.retention95,  color:"#f87171" },
    { label:"100%", value:cr.retention100, color:"#4ade80" },
  ];
  return (
    <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Retención de video</div>
      {/* Hook Rate como card destacada */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bg1,border:`1px solid ${hookColor}44`,borderRadius:7,padding:"8px 12px",marginBottom:10}}>
        <span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>Hook Rate</span>
        <span style={{fontSize:15,fontWeight:800,fontFamily:"monospace",color:hookColor}}>{cr.hookRate.toFixed(1)}%</span>
      </div>
      {/* Barras de retención por porcentaje de video */}
      {retPts.map(p => <MetricBar key={p.label} label={p.label} value={p.value} color={p.color}/>)}
      {cr.avgWatchTime > 0 && (
        <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:T.textMuted}}>Tiempo prom. reproducción</span>
          <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:T.textSub}}>{cr.avgWatchTime.toFixed(1)}s</span>
        </div>
      )}
      {cr.thruplays > 0 && (
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:11,color:T.textMuted}}>ThruPlays (reproducción completa)</span>
          <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:"#4ade80"}}>{cr.thruplays.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function creativeRecommendation(cr, goals) {
  const roasOk = cr.roas >= goals.roas;
  const cpaOk  = cr.cpa <= goals.cpa || cr.cpa === 0;
  const hook   = cr.hookRate;
  const freq   = cr.frecuencia;
  const ret50  = cr.retention50;
  if (hook >= 35 && roasOk && cpaOk) return `★ Top performer — ROAS ${cr.roas.toFixed(1)}x con hook ${hook.toFixed(0)}%. Escalar en CBO con presupuesto ampliado.`;
  if (hook >= 35 && !roasOk) return `Hook excelente (${hook.toFixed(0)}%) pero ROAS bajo objetivo. Revisar landing page, oferta y precio.`;
  if (hook >= 20 && hook < 35 && roasOk) return `Hook mejorable. Testear variantes de los primeros 3s para subir de ${hook.toFixed(0)}% a +35%.`;
  if (hook < 20) return `Hook muy débil (${hook.toFixed(0)}%). Rediseñar los primeros 3 segundos del creative — cambiar imagen/texto inicial.`;
  if (ret50 < 30 && cr.videoViews3s > 0) return `Alta retención temprana pero se pierde a mitad del video (${ret50.toFixed(0)}% llega al 50%). Acortar el video o cambiar el ritmo.`;
  if (freq > 3) return `Frecuencia alta (${freq.toFixed(1)}x) — posible fatiga creativa. Rotar con nuevas versiones del creative.`;
  return `Performance estable. Monitorear frecuencia (${freq.toFixed(1)}x) y CTR (${cr.ctr.toFixed(2)}%).`;
}

// ─── RETENTION BAR ───────────────────────────────────────────────────────────
function RetentionBar({ cr }) {
  const T = useT();
  if (cr.type !== "VIDEO" || !cr.videoViews3s) return null;

  const W = 300, H = 36;
  const uid = `r${(cr.id||"").replace(/\D/g,"").slice(-8)}`;

  // Raw retention data points [videoProgress, retentionPct]
  const raw = [
    [0,   100],
    [25,  cr.retention25  || 0],
    [50,  cr.retention50  || 0],
    [75,  cr.retention75  || 0],
    [95,  cr.retention95  || 0],
    [100, cr.retention100 || 0],
  ];

  // Keep only points with data; monotonically clamp so curve never goes up
  let prev = 100;
  const pts = raw.map(([x, y]) => {
    const clamped = Math.min(prev, y);
    prev = clamped;
    return [x, clamped];
  });

  // SVG coordinate converters
  const sx = x => (x / 100) * W;
  const sy = y => H - (Math.max(0, Math.min(100, y)) / 100) * H;

  // Catmull-Rom → cubic Bezier smooth curve
  const buildPath = (points) => {
    if (points.length < 2) return "";
    let d = `M ${sx(points[0][0])},${sy(points[0][1])}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[Math.max(0, i - 2)];
      const p1 = points[i - 1];
      const p2 = points[i];
      const p3 = points[Math.min(points.length - 1, i + 1)];
      const cp1x = sx(p1[0] + (p2[0] - p0[0]) / 6);
      const cp1y = sy(p1[1] + (p2[1] - p0[1]) / 6);
      const cp2x = sx(p2[0] - (p3[0] - p1[0]) / 6);
      const cp2y = sy(p2[1] - (p3[1] - p1[1]) / 6);
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${sx(p2[0])},${sy(p2[1])}`;
    }
    return d;
  };

  const linePath = buildPath(pts);
  const fillPath = `${linePath} L ${W},${H} L 0,${H} Z`;
  const ticks = [25, 50, 75, 100];

  return (
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Retención</span>
        <span style={{fontSize:9,fontFamily:"monospace",color:"#a78bfa"}}>
          {cr.retention50 > 0 ? `50% → ${cr.retention50.toFixed(0)}%` : ""}
          {cr.avgWatchTime > 0 ? `  ${cr.avgWatchTime.toFixed(1)}s` : ""}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 6}`} preserveAspectRatio="none" style={{display:"block",overflow:"visible"}}>
        <defs>
          <linearGradient id={`${uid}f`} x1="0" x2="1">
            <stop offset="0%"   stopColor="#4ade80" stopOpacity="0.4"/>
            <stop offset="45%"  stopColor="#fbbf24" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.08"/>
          </linearGradient>
          <linearGradient id={`${uid}l`} x1="0" x2="1">
            <stop offset="0%"   stopColor="#4ade80"/>
            <stop offset="50%"  stopColor="#fbbf24"/>
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.5"/>
          </linearGradient>
        </defs>
        <path d={fillPath} fill={`url(#${uid}f)`}/>
        <path d={linePath} fill="none" stroke={`url(#${uid}l)`} strokeWidth="2" strokeLinecap="round"/>
        {ticks.map(t => (
          <g key={t}>
            <line x1={sx(t)} y1={H} x2={sx(t)} y2={H+5} stroke={T.border2} strokeWidth="1"/>
            <text x={sx(t)} y={H+10} textAnchor="middle" fontSize="7" fill={T.textFaint}>{t}%</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ImgFade({ src, style, ...props }) {
  const [loaded, setLoaded] = useState(false);
  return <img src={src} loading="eager" decoding="async" onLoad={()=>setLoaded(true)} style={{...style, opacity:loaded?1:0, transition:"opacity 0.3s ease"}} {...props}/>;
}

function CreativeCard({ cr, rank, goals, onClick, isWinner }) {
  const T = useT();
  const roasOk=cr.roas>=goals.roas, cpaOk=cr.cpa<=goals.cpa||cr.cpa===0, ctrOk=cr.ctr>=goals.ctr;
  const hookColor = cr.hookRate>=30?"#4ade80":cr.hookRate>=15?"#fbbf24":"#f87171";
  const isVideo = cr.type === "VIDEO";
  return (
    <div onClick={onClick} style={{background:T.bg1,border:`1px solid ${isWinner?"#e8572a66":T.border}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s,box-shadow 0.15s,border-color 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.28)";e.currentTarget.style.borderColor="#e8572a55";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor=isWinner?"#e8572a66":T.border;}}>
      {/* Thumbnail — placeholder siempre visible, imagen encima via CSS background-image.
          CSS background-image no tiene restricciones CORS y carga cualquier URL válida. */}
      <div style={{height:168, position:"relative", overflow:"hidden", borderBottom:`1px solid ${T.border}`}}>
        {/* Placeholder siempre visible como base */}
        <div style={{position:"absolute",inset:0,background:`linear-gradient(145deg,${cr.color||"#e8572a"}1a 0%,${T.bg2} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8}}>
          <span style={{fontSize:44,lineHeight:1}}>{cr.thumb||(isVideo?"🎬":"📷")}</span>
          <span style={{fontSize:9,color:T.textFaint,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600}}>{isVideo?"Video":"Imagen"}</span>
        </div>
        {/* Imagen encima del placeholder via CSS (sin restricciones CORS, fallback automático si falla) */}
        {cr.thumbnailUrl && (
          <div style={{position:"absolute",inset:0,backgroundImage:`url("${cr.thumbnailUrl}")`,backgroundSize:"cover",backgroundPosition:"center top"}}/>
        )}
        <div style={{position:"absolute",top:8,left:8,display:"flex",gap:4}}>
          <span style={{background:"rgba(0,0,0,0.72)",backdropFilter:"blur(6px)",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fff"}}>#{rank}</span>
          {isWinner && <span style={{background:"#e8572a",backdropFilter:"blur(4px)",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fff"}}>★ TOP</span>}
        </div>
        <div style={{position:"absolute",top:8,right:8}}>
          <span style={{background:isVideo?"rgba(79,70,229,0.82)":"rgba(22,101,52,0.82)",backdropFilter:"blur(6px)",borderRadius:5,padding:"2px 8px",fontSize:9,fontWeight:700,color:"#fff"}}>{isVideo?"🎬 VIDEO":"📷 IMG"}</span>
        </div>
        {cr.status && cr.status !== "ACTIVE" && (
          <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.72)",backdropFilter:"blur(4px)",padding:"4px 8px",fontSize:9,color:"#fbbf24",textAlign:"center",fontWeight:700,letterSpacing:"0.06em"}}>⏸ PAUSADO</div>
        )}
      </div>
      <div style={{padding:"11px 13px"}}>
        <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:2,lineHeight:1.3,height:32,overflow:"hidden"}}>{cr.name}</div>
        <div style={{fontSize:10,color:T.textDim,marginBottom:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cr.campaign||"—"}</div>
        {isVideo && (
          <div style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em"}}>Hook Rate</span>
              <span style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:hookColor}}>{cr.hookRate.toFixed(1)}%</span>
            </div>
            <div style={{height:4,background:T.border,borderRadius:3,marginBottom:8}}>
              <div style={{height:"100%",width:`${Math.min(100,(cr.hookRate/60)*100)}%`,background:hookColor,borderRadius:3}}/>
            </div>
            <RetentionBar cr={cr}/>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:3,marginBottom:8}}>
          {[
            {l:"ROAS", v:fN(cr.roas,"x"),                      ok:roasOk, bad:!roasOk},
            {l:"CPA",  v:cr.cpa>0?fN(cr.cpa,"$"):"—",          ok:cpaOk,  bad:!cpaOk},
            {l:"CTR",  v:fN(cr.ctr,"%"),                        ok:ctrOk,  bad:!ctrOk},
            {l:"Compras", v:cr.conversions>0?cr.conversions:"—", ok:cr.conversions>0, bad:cr.conversions===0},
          ].map(({l,v,ok,bad})=>(
            <div key={l} style={{background:ok?T.ok.bg:bad?T.bad.bg:T.bg2,border:`1px solid ${ok?T.ok.border:bad?T.bad.border:T.border}`,borderRadius:5,padding:"4px 3px",textAlign:"center"}}>
              <div style={{fontSize:7,color:ok?T.ok.text:bad?T.bad.text:T.textDim,textTransform:"uppercase",letterSpacing:"0.04em"}}>{l}</div>
              <div style={{fontSize:11,fontWeight:700,fontFamily:"monospace",color:ok?T.ok.text:bad?T.bad.text:T.textMuted}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.textDim}}>
          <span>${cr.spend.toLocaleString()}</span>
          <span>{cr.impressions>=1000?`${(cr.impressions/1000).toFixed(0)}k imp`:cr.impressions+" imp"}</span>
          <span style={{color:cr.frecuencia>2.5?"#f87171":T.textDim}}>f {cr.frecuencia.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}

function CreativeDetail({ cr, goals, onClose, daily }) {
  const T = useT();
  if (!cr) return null;
  const roasOk=cr.roas>=goals.roas, cpaOk=cr.cpa<=goals.cpa||cr.cpa===0, ctrOk=cr.ctr>=goals.ctr;
  const isVideo = cr.type === "VIDEO";
  const hookColor = cr.hookRate>=30?"#4ade80":cr.hookRate>=15?"#fbbf24":"#f87171";
  const radar=[{m:"Hook",v:Math.round(Math.min(cr.hookRate,60)/60*100)},{m:"CTR",v:Math.round(Math.min(cr.ctr,5)/5*100)},{m:"ROAS",v:Math.round(Math.min(cr.roas,6)/6*100)},{m:"Conv.",v:Math.min(100,Math.round(cr.conversions/50*100))},{m:"CPA ok",v:cr.cpa>0?Math.round(Math.max(0,1-cr.cpa/goals.cpa)*100):50},{m:"Alcance",v:Math.min(100,Math.round(cr.alcance/50000*100))}];

  const allMetrics = [
    {l:"Gasto",          v:`$${cr.spend.toLocaleString()}`},
    {l:"Revenue",        v:`$${cr.revenue.toLocaleString()}`},
    {l:"ROAS",           v:`${cr.roas.toFixed(2)}x`,   ok:roasOk},
    {l:"CPA",            v:cr.cpa>0?`$${cr.cpa.toFixed(2)}`:"—", ok:cpaOk},
    {l:"CTR",            v:`${cr.ctr.toFixed(2)}%`,     ok:ctrOk},
    {l:"CPM",            v:`$${cr.cpm.toFixed(2)}`},
    {l:"CPC",            v:cr.cpc>0?`$${cr.cpc.toFixed(2)}`:"—"},
    {l:"Impresiones",    v:(cr.impressions||0).toLocaleString()},
    {l:"Alcance",        v:(cr.alcance||0).toLocaleString()},
    {l:"Clics",          v:(cr.clics||0).toLocaleString()},
    {l:"Conversiones",   v:(cr.conversions||0).toLocaleString()},
    {l:"Frecuencia",     v:`${cr.frecuencia.toFixed(2)}x`, ok:cr.frecuencia<=2.5},
    ...(isVideo ? [
      {l:"Hook Rate",      v:`${cr.hookRate.toFixed(1)}%`,  ok:cr.hookRate>=30},
      {l:"Views 3s",       v:(cr.videoViews3s||0).toLocaleString()},
      {l:"Ret. 25%",       v:`${cr.retention25.toFixed(1)}%`},
      {l:"Ret. 50%",       v:`${cr.retention50.toFixed(1)}%`},
      {l:"Ret. 75%",       v:`${cr.retention75.toFixed(1)}%`},
      {l:"Ret. 95%",       v:`${cr.retention95.toFixed(1)}%`},
      {l:"Ret. 100%",      v:`${cr.retention100.toFixed(1)}%`},
      {l:"ThruPlays",      v:(cr.thruplays||0).toLocaleString()},
      {l:"Tiempo prom.",   v:cr.avgWatchTime>0?`${cr.avgWatchTime.toFixed(1)}s`:"—"},
    ] : []),
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:18,width:"100%",maxWidth:860,maxHeight:"92vh",overflow:"auto"}}>
        {/* Header con thumbnail grande */}
        {cr.thumbnailUrl && (
          <div style={{height:220, position:"relative", overflow:"hidden", borderBottom:`1px solid ${T.border}`, background:`linear-gradient(145deg,${cr.color||"#e8572a"}33,${T.bg2})`}}>
            <div style={{position:"absolute",inset:0,backgroundImage:`url("${cr.thumbnailUrl}")`,backgroundSize:"cover",backgroundPosition:"center top"}}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.82) 100%)"}}/>
            <div style={{position:"absolute",bottom:14,left:18,right:48}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                {cr.type==="VIDEO" && <span style={{background:"rgba(79,70,229,0.85)",backdropFilter:"blur(4px)",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fff"}}>🎬 VIDEO</span>}
                {cr.status==="ACTIVE"
                  ? <span style={{background:"rgba(22,101,52,0.85)",backdropFilter:"blur(4px)",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#4ade80"}}>● ACTIVO</span>
                  : <span style={{background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,color:"#fbbf24"}}>⏸ PAUSADO</span>
                }
              </div>
              <div style={{fontSize:15,fontWeight:700,color:"#fff",textShadow:"0 1px 6px rgba(0,0,0,0.8)",lineHeight:1.3}}>{cr.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",marginTop:3}}>{cr.campaign||"—"}</div>
            </div>
            <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(6px)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",cursor:"pointer",fontSize:18,lineHeight:1,width:32,height:32,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        )}
        {!cr.thumbnailUrl && (
          <div style={{display:"flex",alignItems:"flex-start",gap:14,padding:"18px 22px 14px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",flexShrink:0,background:T.bg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
              {cr.thumb}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <span style={{fontSize:15,fontWeight:700,color:T.text}}>{cr.name}</span>
                {cr.type==="VIDEO" && <span style={{background:"#4f46e522",border:"1px solid #4f46e544",borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700,color:"#818cf8"}}>🎬 VIDEO</span>}
                {cr.status==="ACTIVE" && <span style={{background:"#16a34a22",border:"1px solid #16a34a44",borderRadius:5,padding:"1px 7px",fontSize:10,fontWeight:700,color:"#4ade80"}}>ACTIVO</span>}
              </div>
              <div style={{fontSize:12,color:T.textDim}}>{cr.campaign||"—"}</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:24,lineHeight:1}}>×</button>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:0}}>
          {/* Left: all metrics */}
          <div style={{padding:"18px 22px",borderRight:`1px solid ${T.border}`}}>
            <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Todas las métricas</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
              {allMetrics.map(({l,v,ok})=>(
                <div key={l} style={{background:ok===true?T.ok.bg:ok===false?T.bad.bg:T.bg,border:`1px solid ${ok===true?T.ok.border:ok===false?T.bad.border:T.border}`,borderRadius:7,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:ok===true?T.ok.text:ok===false?T.bad.text:T.textDim,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:2}}>{l}</div>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:ok===true?T.ok.text:ok===false?T.bad.text:T.textSub}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: charts */}
          <div style={{padding:"18px 16px"}}>
            {/* Radar */}
            <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 4px",marginBottom:12}}>
              <ResponsiveContainer width="100%" height={170}>
                <RadarChart data={radar}>
                  <PolarGrid stroke={T.border}/>
                  <PolarAngleAxis dataKey="m" tick={{fontSize:9,fill:T.textDim}}/>
                  <Radar dataKey="v" stroke="#e8572a" fill="#e8572a" fillOpacity={0.2} strokeWidth={1.5}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Hook Rate */}
            <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>Hook Rate</div>
              <div style={{fontSize:28,fontWeight:800,fontFamily:"monospace",color:hookColor,marginBottom:4}}>{cr.hookRate.toFixed(1)}%</div>
              <div style={{height:6,background:T.border,borderRadius:3,marginBottom:6}}>
                <div style={{height:"100%",width:`${Math.min(100,(cr.hookRate/60)*100)}%`,background:hookColor,borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:T.textDim,lineHeight:1.5}}>
                {cr.hookRate>=35?"Excelente — escalar":cr.hookRate>=20?"Buen hook — testear variantes":"Hook débil — rediseñar primeros 3s"}
              </div>
            </div>
            {/* Retention curve */}
            {isVideo && <RetentionCurve cr={cr}/>}
          </div>
        </div>

        {/* Línea de tiempo — ancho completo, para todo tipo de creativo */}
        {daily?.length > 0 && (
          <div style={{margin:"0 22px 20px"}}>
            <CreativeTimeline daily={daily}/>
          </div>
        )}

        {/* Recommendation */}
        <div style={{margin:"0 22px 20px",background:"#e8572a0d",border:`1px solid #e8572a33`,borderRadius:10,padding:"13px 16px"}}>
          <div style={{fontSize:10,color:"#e8572a",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>Recomendación</div>
          <div style={{fontSize:13,color:T.textSub,lineHeight:1.7}}>{creativeRecommendation(cr, goals)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── CREATIVE TIMELINE ───────────────────────────────────────────────────────
const TIMELINE_METRICS = [
  { key:"roas",        label:"ROAS",       color:"#60a5fa", fmt: v=>`${v.toFixed(2)}x` },
  { key:"spend",       label:"Gasto $",    color:"#f87171", fmt: v=>`$${v.toLocaleString("es-AR",{maximumFractionDigits:0})}` },
  { key:"revenue",     label:"Revenue $",  color:"#4ade80", fmt: v=>`$${v.toLocaleString("es-AR",{maximumFractionDigits:0})}` },
  { key:"conversions", label:"Compras",    color:"#a78bfa", fmt: v=>String(Math.round(v)) },
  { key:"ctr",         label:"CTR %",      color:"#fbbf24", fmt: v=>`${v.toFixed(2)}%` },
  { key:"cpm",         label:"CPM $",      color:"#f59e0b", fmt: v=>`$${v.toFixed(2)}` },
  { key:"cpa",         label:"CPA $",      color:"#e879f9", fmt: v=>`$${v.toFixed(2)}` },
  { key:"impressions", label:"Impresiones",color:"#94a3b8", fmt: v=>v>=1000?`${(v/1000).toFixed(0)}k`:String(v) },
];

function CreativeTimeline({ daily }) {
  const T = useT();
  const [metric, setMetric] = useState("roas");
  if (!daily?.length) return null;
  const m = TIMELINE_METRICS.find(x=>x.key===metric) || TIMELINE_METRICS[0];

  const fmt = date => {
    const d = new Date(date+"T00:00:00");
    return `${d.getDate()}/${d.getMonth()+1}`;
  };

  const minVal = Math.min(...daily.map(d=>d[metric]||0));
  const maxVal = Math.max(...daily.map(d=>d[metric]||0));
  const pad = (maxVal-minVal)*0.15 || 1;

  return (
    <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px",marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Evolución del período</span>
        <div style={{marginLeft:"auto",display:"flex",gap:4,flexWrap:"wrap"}}>
          {TIMELINE_METRICS.map(mx=>(
            <button key={mx.key} onClick={()=>setMetric(mx.key)}
              style={{padding:"3px 9px",borderRadius:5,border:`1px solid`,cursor:"pointer",fontSize:10,fontWeight:metric===mx.key?700:400,
                background:metric===mx.key?`${mx.color}22`:"none",
                borderColor:metric===mx.key?mx.color:T.border2,
                color:metric===mx.key?mx.color:T.textDim}}>
              {mx.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={daily} margin={{top:4,right:4,bottom:0,left:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
          <XAxis dataKey="day" tickFormatter={fmt} tick={{fontSize:9,fill:T.textDim}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
          <YAxis domain={[Math.max(0,minVal-pad), maxVal+pad]} tick={{fontSize:9,fill:T.textDim}} axisLine={false} tickLine={false} tickFormatter={m.fmt} width={52}/>
          <Tooltip
            contentStyle={{background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:8,fontSize:11}}
            labelStyle={{color:T.textMuted,fontSize:10}}
            labelFormatter={v=>`Día ${fmt(v)}`}
            formatter={(v)=>[m.fmt(v), m.label]}
          />
          <Line type="monotone" dataKey={metric} stroke={m.color} strokeWidth={2} dot={false} activeDot={{r:4,fill:m.color}}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CreativosModule({ account, goals }) {
  const T = useT();
  const creatives = account.creatives?.length ? account.creatives : (CREATIVES[account.id] || []);
  const isLive = !!account.creatives?.length;
  const ak = account?.id || 'x';

  const [tf, setTf] = useState(() => { try { return localStorage.getItem(`cr_tf_${ak}`)||"ALL"; } catch { return "ALL"; } });
  const [sb, setSb] = useState(() => { try { return localStorage.getItem(`cr_sb_${ak}`)||"roas"; } catch { return "roas"; } });
  const [sel, setSel] = useState(null);

  // Normalizar nombre para comparación robusta (case-insensitive + trim)
  const norm = s => (s||"").trim().toLowerCase();

  const campaignList = useMemo(() => {
    return [...new Set(creatives.map(c => c.campaign).filter(Boolean))];
  }, [creatives]);

  const [selectedCampaigns, setSelectedCampaigns] = useState(() => {
    try { const s = localStorage.getItem(`cr_sel_${ak}`); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  // Cuando cambian los datos, descartar selecciones que ya no existen
  useEffect(() => {
    if (!campaignList.length) return;
    const validNorms = campaignList.map(norm);
    setSelectedCampaigns(prev => {
      const cleaned = prev.filter(n => validNorms.includes(norm(n)));
      return cleaned.length !== prev.length ? cleaned : prev;
    });
  }, [campaignList.join("|")]);

  useEffect(() => { try { localStorage.setItem(`cr_tf_${ak}`,  tf);  } catch {} }, [tf,  ak]);
  useEffect(() => { try { localStorage.setItem(`cr_sb_${ak}`,  sb);  } catch {} }, [sb,  ak]);
  useEffect(() => { try { localStorage.setItem(`cr_sel_${ak}`, JSON.stringify(selectedCampaigns)); } catch {} }, [selectedCampaigns, ak]);

  const toggleCampaign = (name) => {
    setSelectedCampaigns(prev =>
      prev.some(n => norm(n) === norm(name))
        ? prev.filter(n => norm(n) !== norm(name))
        : [...prev, name]
    );
  };

  const toggleAll = () => {
    setSelectedCampaigns(prev =>
      prev.length === campaignList.length ? [] : [...campaignList]
    );
  };

  const hasSelection = selectedCampaigns.length > 0;

  const filteredCreatives = useMemo(() => {
    if (!hasSelection) return [];
    const selectedNorms = selectedCampaigns.map(norm);
    return creatives.filter(c => selectedNorms.includes(norm(c.campaign)));
  }, [creatives, selectedCampaigns, hasSelection]);

  const sorted = useMemo(() => {
    let d = filteredCreatives;
    if (tf !== "ALL") d = d.filter(c => c.type === tf);
    return [...d].sort((a, b) => sb==="cpa" ? (a[sb]||0)-(b[sb]||0) : (b[sb]||0)-(a[sb]||0));
  }, [filteredCreatives, tf, sb]);

  const videos = filteredCreatives.filter(c => c.type === "VIDEO");
  const avgHook    = videos.length ? (videos.reduce((s,c) => s+c.hookRate, 0) / videos.length) : 0;
  const totalSpend   = filteredCreatives.reduce((s,c) => s+(c.spend   ||0), 0);
  const totalRevenue = filteredCreatives.reduce((s,c) => s+(c.revenue  ||0), 0);
  const totalClicks  = filteredCreatives.reduce((s,c) => s+(c.clics    ||0), 0);
  const totalImpr    = filteredCreatives.reduce((s,c) => s+(c.impressions||0), 0);
  // ROAS correcto: revenue total / spend total (no promedio de ROAS individuales)
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  // CTR correcto: clics totales / impresiones totales
  const avgCtr  = totalImpr  > 0 ? (totalClicks / totalImpr) * 100 : 0;

  if (!creatives.length) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,color:T.textFaint,gap:12,textAlign:"center"}}>
      <div style={{fontSize:32}}>🎨</div>
      <div style={{fontSize:14,fontWeight:600,color:T.textSub}}>Sin datos de creativos</div>
      <div style={{fontSize:12,color:T.textDim,maxWidth:340}}>
        {account.meta_token ? "Actualizá los datos con el botón \"↻ Sincronización\" en la barra superior." : "Conectá la Meta API en Ajustes → editar cuenta para ver métricas reales de creativos."}
      </div>
    </div>
  );

  return (
    <div>
      {!isLive && <div style={{background:"#f59e0b11",border:"1px solid #f59e0b33",borderRadius:8,padding:"8px 14px",marginBottom:14,fontSize:12,color:"#f59e0b"}}>Mostrando datos de demo — conectá la Meta API para ver métricas reales.</div>}

      {/* Campaign selector */}
      <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <span style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Seleccioná campañas para ver creativos</span>
          <button onClick={toggleAll} style={{marginLeft:"auto",padding:"3px 10px",borderRadius:5,border:`1px solid ${T.border2}`,background:"none",color:T.textDim,fontSize:10,cursor:"pointer"}}>
            {selectedCampaigns.length === campaignList.length ? "Deseleccionar todo" : "Seleccionar todo"}
          </button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {campaignList.map(name => {
            const checked = selectedCampaigns.some(n => norm(n) === norm(name));
            const count = creatives.filter(c => norm(c.campaign) === norm(name)).length;
            return (
              <label key={name} onClick={()=>toggleCampaign(name)} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:7,border:`1px solid ${checked?"#e8572a":T.border2}`,background:checked?"#e8572a18":"none",cursor:"pointer",userSelect:"none"}}>
                <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${checked?"#e8572a":T.border2}`,background:checked?"#e8572a":"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {checked && <span style={{color:"#fff",fontSize:9,lineHeight:1,fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:12,color:checked?T.text:T.textMuted,fontWeight:checked?600:400}}>{name}</span>
                <span style={{fontSize:10,color:checked?"#e8572a99":T.textFaint,fontWeight:500}}>({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Empty state when no campaign selected */}
      {!hasSelection && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:60,color:T.textFaint,gap:10,textAlign:"center",background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10}}>
          <div style={{fontSize:32}}>👆</div>
          <div style={{fontSize:14,fontWeight:600,color:T.textSub}}>Seleccioná al menos una campaña</div>
          <div style={{fontSize:12,color:T.textDim}}>Los creativos se mostrarán según las campañas que elijas arriba.</div>
        </div>
      )}

      {hasSelection && (
        <>
          {/* KPI row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:18}}>
            {[
              {l:"Total creativos", v:filteredCreatives.length,            c:T.text},
              {l:"Videos",          v:videos.length,               c:"#818cf8"},
              {l:"Imágenes",        v:filteredCreatives.length-videos.length, c:"#4ade80"},
              {l:"Compras totales", v:filteredCreatives.reduce((s,c)=>s+(c.conversions||0),0), c:"#a78bfa"},
              {l:"Hook Rate prom.", v:`${avgHook.toFixed(1)}%`,    c:avgHook>=30?"#4ade80":avgHook>=15?"#fbbf24":"#f87171"},
              {l:"CTR",            v:`${avgCtr.toFixed(2)}%`,      c:T.textSub},
              {l:"ROAS",           v:`${avgRoas.toFixed(2)}x`,     c:avgRoas>=goals.roas?"#4ade80":"#f87171"},
              {l:"Revenue",        v:`$${totalRevenue.toLocaleString()}`, c:"#4ade80"},
              {l:"Gasto total",    v:`$${totalSpend.toLocaleString()}`,   c:T.textSub},
            ].map(({l,v,c})=>(
              <div key={l} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:9,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{l}</div>
                <div style={{fontSize:19,fontWeight:700,fontFamily:"monospace",color:c}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",gap:5}}>
              {["ALL","VIDEO","IMAGE"].map(t=>(
                <button key={t} onClick={()=>setTf(t)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid",cursor:"pointer",fontSize:11,background:tf===t?"#e8572a20":"none",borderColor:tf===t?"#e8572a":T.border2,color:tf===t?"#e8572a":T.textDim}}>
                  {t==="ALL"?"Todos":t==="VIDEO"?"🎬 Video":"📷 Imagen"}
                </button>
              ))}
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:10,color:T.textDim}}>Ordenar:</span>
              {[["roas","ROAS"],["hookRate","Hook"],["ctr","CTR"],["cpa","CPA"],["spend","Gasto"],["frecuencia","Frec."]].map(([k,l])=>(
                <button key={k} onClick={()=>setSb(k)} style={{padding:"3px 9px",borderRadius:5,border:"1px solid",cursor:"pointer",fontSize:10,background:sb===k?"#3b82f622":"none",borderColor:sb===k?"#60a5fa":T.border2,color:sb===k?"#60a5fa":T.textDim,fontWeight:sb===k?700:400}}>{l}</button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div className="creatives-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:13}}>
            {sorted.map((cr,i) => <CreativeCard key={cr.id} cr={cr} rank={i+1} goals={goals} isWinner={i===0} onClick={()=>setSel(cr)}/>)}
          </div>
          {sel && <CreativeDetail cr={sel} goals={goals} onClose={()=>setSel(null)} daily={account.daily||[]}/>}
        </>
      )}
    </div>
  );
}

// ─── TASKS KANBAN ─────────────────────────────────────────────────────────────
const COLUMNS = [
  {id:"todo",label:"Por hacer",color:"#555"},
  {id:"inprogress",label:"En progreso",color:"#f59e0b"},
  {id:"done",label:"Listo",color:"#4ade80"},
];

function TaskCard({ task, canEdit, allUsers, onMove, onDelete }) {
  const T = useT();
  const assignee = allUsers.find(u=>u.id===(task.assignee_id||task.assignee));
  const isOverdue = task.dueDate && new Date(task.dueDate)<new Date() && task.status!=="done";
  return (
    <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 13px",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:6,marginBottom:7}}>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:600,color:T.textSub,lineHeight:1.4,marginBottom:3}}>{task.title}</div>
          {task.desc&&<div style={{fontSize:11,color:T.textDim,lineHeight:1.4}}>{task.desc}</div>}
        </div>
        {canEdit&&<button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:14,padding:0,flexShrink:0}}>×</button>}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
        <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:PRIORITY_COLOR[task.priority]+"20",color:PRIORITY_COLOR[task.priority],border:`1px solid ${PRIORITY_COLOR[task.priority]}40`,fontWeight:600}}>{PRIORITY_LABEL[task.priority]}</span>
        <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:task.type==="client"?"#a78bfa20":"#60a5fa20",color:task.type==="client"?"#a78bfa":"#60a5fa",border:`1px solid ${task.type==="client"?"#a78bfa40":"#60a5fa40"}`}}>
          {task.type==="client"?"Cliente":"Equipo"}
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:T.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:ROLE_COLOR[assignee?.role||"team"]}}>{assignee?.avatar||"?"}</div>
          <span style={{fontSize:10,color:T.textDim}}>{assignee?.name||"Sin asignar"}</span>
        </div>
        {task.dueDate&&<span style={{fontSize:10,color:isOverdue?"#f87171":T.textDim}}>{isOverdue?"⚠ ":""}{task.dueDate}</span>}
      </div>
      {canEdit&&task.status!=="done"&&(
        <div style={{display:"flex",gap:5,marginTop:8,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
          {COLUMNS.filter(c=>c.id!==task.status).map(col=>(
            <button key={col.id} onClick={()=>onMove(task.id,col.id)} style={{flex:1,padding:"4px 0",background:"none",border:`1px solid ${col.color}40`,borderRadius:5,color:col.color,cursor:"pointer",fontSize:10}}>→ {col.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewTaskModal({ userAccounts, allUsers, onSave, onClose, currentUser, activeProjectId }) {
  const T = useT();
  const [form, setForm] = useState({
    title:"",desc:"",status:"todo",priority:"medium",
    assignee_id:currentUser.id,account_id:activeProjectId||userAccounts[0]?.id||"",
    dueDate:"",type:currentUser.role==="client"?"client":"team",
  });
  const eligible = currentUser.role==="client" ? allUsers.filter(u=>u.id===currentUser.id) : allUsers;
  const inp={width:"100%",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:7,color:T.text,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box"};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:16,padding:28,width:440}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:14,fontWeight:700,color:T.text}}>Nueva tarea</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:20}}>×</button>
        </div>
        {[{k:"title",l:"Título",ph:"Descripción corta"},{k:"desc",l:"Descripción (opcional)",ph:"Más detalle..."}].map(({k,l,ph})=>(
          <div key={k} style={{marginBottom:12}}>
            <div style={{fontSize:11,color:T.textDim,marginBottom:5}}>{l}</div>
            <input value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} style={inp}/>
          </div>
        ))}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:T.textDim,marginBottom:5}}>Prioridad</div>
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...inp,padding:"9px 10px"}}>
              <option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option>
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textDim,marginBottom:5}}>Tipo</div>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{...inp,padding:"9px 10px"}}>
              <option value="team">Equipo</option><option value="client">Cliente</option>
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:T.textDim,marginBottom:5}}>Asignar a</div>
            <select value={form.assignee_id} onChange={e=>setForm(f=>({...f,assignee_id:e.target.value}))} style={{...inp,padding:"9px 10px"}}>
              {eligible.map(u=><option key={u.id} value={u.id}>{u.name||u.email}</option>)}
            </select>
          </div>
          <div>
            <div style={{fontSize:11,color:T.textDim,marginBottom:5}}>Fecha límite</div>
            <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} style={{...inp,padding:"9px 10px"}}/>
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:T.textDim,marginBottom:5}}>Cuenta</div>
          <select value={form.account_id} onChange={e=>setForm(f=>({...f,account_id:e.target.value}))} style={{...inp,padding:"9px 10px"}}>
            {userAccounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:11,background:"none",border:`1px solid ${T.border2}`,borderRadius:8,color:T.textDim,cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{if(!form.title.trim())return;onSave({...form,id:"t"+Date.now()});}}
            style={{flex:1,padding:11,background:"#e8572a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontWeight:700}}>Crear tarea</button>
        </div>
      </div>
    </div>
  );
}

function TasksModule({ currentUser, userAccounts, allUsers, tasks, setTasks, activeProjectId }) {
  const T = useT();
  const [showModal, setShowModal] = useState(false);
  const [viewFilter, setViewFilter] = useState("all");
  const isClient = currentUser.role==="client";
  const canEdit  = currentUser.role==="master"||currentUser.role==="team";

  async function handleCreate(task) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("tasks").insert({
        id: task.id, title: task.title, description: task.desc,
        status: task.status, priority: task.priority, type: task.type,
        assignee_id: task.assignee_id||null, account_id: task.account_id||null,
        due_date: task.dueDate||null,
      });
      if (error) { toast("Error al crear tarea: "+error.message,"error"); return; }
    }
    setTasks(p=>[...p,task]);
    setShowModal(false); toast("Tarea creada");
  }

  async function handleMove(id, status) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from("tasks").update({status}).eq("id",id);
    }
    setTasks(prev=>prev.map(t=>t.id===id?{...t,status}:t));
  }

  async function handleDelete(id) {
    if (isSupabaseConfigured && supabase) {
      await supabase.from("tasks").delete().eq("id",id);
    }
    setTasks(prev=>prev.filter(t=>t.id!==id));
    toast("Tarea eliminada","warn");
  }

  // Base: tareas de la marca activa (las sin marca asignada se muestran en todas)
  const brandTasks = useMemo(()=>{
    if (!activeProjectId) return tasks;
    return tasks.filter(x=>{ const aid=x.account_id||x.account; return !aid||aid===activeProjectId; });
  },[tasks,activeProjectId]);

  const visible = useMemo(()=>{
    let t=brandTasks;
    if (isClient) t=t.filter(x=>x.type==="client"&&userAccounts.some(a=>a.id===(x.account_id||x.account)));
    if (viewFilter==="team")   t=t.filter(x=>x.type==="team");
    if (viewFilter==="client") t=t.filter(x=>x.type==="client");
    if (viewFilter==="mine")   t=t.filter(x=>(x.assignee_id||x.assignee)===currentUser.id);
    return t;
  },[brandTasks,viewFilter,isClient,currentUser,userAccounts]);

  const stats={
    todo:brandTasks.filter(t=>t.status==="todo").length,
    inprogress:brandTasks.filter(t=>t.status==="inprogress").length,
    done:brandTasks.filter(t=>t.status==="done").length,
    overdue:brandTasks.filter(t=>t.dueDate&&new Date(t.dueDate)<new Date()&&t.status!=="done").length,
  };

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[{l:"Por hacer",v:stats.todo,c:T.textMuted},{l:"En progreso",v:stats.inprogress,c:"#f59e0b"},{l:"Listas",v:stats.done,c:"#4ade80"},{l:"Vencidas",v:stats.overdue,c:"#f87171"}].map(({l,v,c})=>(
          <div key={l} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:5}}>{l}</div>
            <div style={{fontSize:24,fontWeight:700,fontFamily:"monospace",color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        {!isClient&&(
          <div style={{display:"flex",gap:5}}>
            {[["all","Todas"],["team","Equipo"],["client","Clientes"],["mine","Mías"]].map(([v,l])=>(
              <button key={v} onClick={()=>setViewFilter(v)} style={{padding:"5px 12px",borderRadius:6,border:"1px solid",cursor:"pointer",fontSize:11,background:viewFilter===v?"#e8572a":"none",borderColor:viewFilter===v?"#e8572a":T.border2,color:viewFilter===v?"#fff":T.textDim}}>{l}</button>
            ))}
          </div>
        )}
        <button onClick={()=>setShowModal(true)} style={{marginLeft:"auto",padding:"7px 16px",background:"#e8572a",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>+ Nueva tarea</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}} className="kanban-grid">
        {COLUMNS.map(col=>{
          const colTasks=visible.filter(t=>t.status===col.id);
          return (
            <div key={col.id} style={{background:T.bg,borderRadius:12,padding:"14px 12px",minHeight:300,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:col.color}}/>
                <span style={{fontSize:12,fontWeight:600,color:T.textSub}}>{col.label}</span>
                <span style={{marginLeft:"auto",fontSize:11,background:T.border,color:T.textDim,padding:"1px 7px",borderRadius:10}}>{colTasks.length}</span>
              </div>
              {colTasks.map(task=>(
                <TaskCard key={task.id} task={task} canEdit={canEdit||isClient} allUsers={allUsers}
                  onMove={handleMove} onDelete={handleDelete}/>
              ))}
              {colTasks.length===0&&<div style={{textAlign:"center",paddingTop:40,color:T.textFaint,fontSize:12}}>Sin tareas</div>}
            </div>
          );
        })}
      </div>
      {showModal&&<NewTaskModal userAccounts={userAccounts} allUsers={allUsers} onSave={handleCreate} onClose={()=>setShowModal(false)} currentUser={currentUser} activeProjectId={activeProjectId}/>}
    </div>
  );
}

// ─── ACCOUNT MODAL ───────────────────────────────────────────────────────────
function AccountModal({account, onSave, onClose}) {
  const T = useT();
  const isNew = !account;
  const dk = isNew ? 'acc_draft_new' : `acc_draft_${account.id}`;

  const readDraft = (field, fallback) => {
    if (!isNew) return fallback;
    try { const d = localStorage.getItem(dk); return d ? (JSON.parse(d)[field] ?? fallback) : fallback; } catch { return fallback; }
  };
  const saveDraft = (patch) => {
    try {
      const prev = JSON.parse(localStorage.getItem(dk)||'{}');
      localStorage.setItem(dk, JSON.stringify({...prev, ...patch}));
    } catch {}
  };
  const clearDraft = () => { try { localStorage.removeItem(dk); } catch {} };

  const [name,       setName]       = useState(() => readDraft('name',       account?.name||""));
  const [clientName, setClientName] = useState(() => readDraft('clientName', account?.client_name||""));
  const [clientEmail,setClientEmail]= useState(() => readDraft('clientEmail',account?.client_email||""));
  const [logoUrl,    setLogoUrl]    = useState(account?.logo_url||"");
  const [logoFile,   setLogoFile]   = useState(null);
  const [logoPreview,setLogoPreview]= useState(account?.logo_url||"");
  const [metaToken,  setMetaToken]  = useState(() => readDraft('metaToken',  account?.meta_token||""));
  const [metaAdAccId,setMetaAdAccId]= useState(() => readDraft('metaAdAccId',account?.meta_ad_account_id||""));
  const [metaTestStatus, setMetaTestStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  // Persiste borrador automáticamente mientras el usuario escribe
  useEffect(() => { saveDraft({name, clientName, clientEmail, metaToken, metaAdAccId}); }, [name, clientName, clientEmail, metaToken, metaAdAccId]);

  async function testMetaConnection() {
    if (!metaToken.trim() || !metaAdAccId.trim()) return;
    setMetaTestStatus("testing");
    const accId = metaAdAccId.trim().startsWith("act_") ? metaAdAccId.trim() : `act_${metaAdAccId.trim()}`;
    try {
      const params = new URLSearchParams({ access_token: metaToken.trim(), fields: "name,currency,account_status" });
      const res = await fetch(`https://graph.facebook.com/v22.0/${accId}?${params}`);
      const json = await res.json();
      if (json.error) setMetaTestStatus({ error: `[${json.error.code}] ${json.error.message}` });
      else setMetaTestStatus({ ok: true, name: json.name, currency: json.currency, status: json.account_status });
    } catch(e) {
      setMetaTestStatus({ error: e.message });
    }
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    let finalLogoUrl = logoUrl;
    if (logoFile && isSupabaseConfigured && supabase) {
      // Refrescar sesión antes de subir para evitar token expirado
      try { await supabase.auth.refreshSession(); } catch {}
      const ext = logoFile.name.split('.').pop();
      const path = `logos/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("logos").upload(path, logoFile, {upsert:true});
      if (!upErr) {
        const { data } = supabase.storage.from("logos").getPublicUrl(path);
        finalLogoUrl = data.publicUrl;
      } else {
        toast("Error al subir imagen: " + upErr.message + ". Guardando localmente.", "warn");
        finalLogoUrl = logoPreview;
      }
    } else if (logoFile) {
      finalLogoUrl = logoPreview;
    }
    await onSave({ name: name.trim(), client_name: clientName.trim(), client_email: clientEmail.trim(), logo_url: finalLogoUrl, metaToken: metaToken.trim(), metaAdAccId: metaAdAccId.trim() });
    clearDraft();
    setSaving(false);
  }

  const overlay = {position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
  const box = {background:T.bg1,border:`1px solid ${T.border}`,borderRadius:14,padding:28,width:460,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"};
  const inp = {width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",marginBottom:5,fontSize:12,color:T.textMuted,fontWeight:600};
  const row = {marginBottom:16};

  return (
    <div style={overlay} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={box}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontWeight:700,color:T.text,fontSize:15}}>{account?"Editar cuenta":"Nueva cuenta"}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        <div style={row}>
          <label style={lbl}>Nombre de la cuenta *</label>
          <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Powernax"/>
        </div>
        <div style={row}>
          <label style={lbl}>Nombre del cliente</label>
          <input style={inp} value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Nombre completo del cliente"/>
        </div>
        <div style={row}>
          <label style={lbl}>Email del cliente</label>
          <input style={inp} type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="cliente@empresa.com"/>
        </div>
        <div style={row}>
          <label style={lbl}>Logo del cliente</label>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {logoPreview && <img src={logoPreview} alt="logo" style={{width:48,height:48,objectFit:"contain",borderRadius:8,border:`1px solid ${T.border}`}}/>}
            <label style={{padding:"7px 14px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,cursor:"pointer",color:T.textSub,fontSize:12}}>
              Subir imagen
              <input type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoChange}/>
            </label>
            {logoPreview && <button onClick={()=>{setLogoPreview("");setLogoFile(null);setLogoUrl("");}} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:12}}>Quitar</button>}
          </div>
        </div>

        <div style={{borderTop:`1px solid ${T.border}`,margin:"20px 0",paddingTop:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Meta Ads API</span>
            {account?.meta_token && <span style={{fontSize:11,background:"#16a34a22",color:"#16a34a",border:"1px solid #16a34a44",borderRadius:20,padding:"2px 10px",fontWeight:600}}>Conectado</span>}
          </div>
          <div style={row}>
            <label style={lbl}>Access Token</label>
            <input style={inp} type="password" value={metaToken} onChange={e=>{ setMetaToken(e.target.value); setMetaTestStatus(null); }} placeholder="EAAxxxxxxxxxxxxxxxxx"/>
          </div>
          <div style={row}>
            <label style={lbl}>ID de cuenta publicitaria</label>
            <input style={inp} value={metaAdAccId} onChange={e=>{ setMetaAdAccId(e.target.value); setMetaTestStatus(null); }} placeholder="act_123456789"/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <button
              onClick={testMetaConnection}
              disabled={!metaToken.trim()||!metaAdAccId.trim()||metaTestStatus==="testing"}
              style={{padding:"6px 14px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:12,fontWeight:600,opacity:(!metaToken.trim()||!metaAdAccId.trim())?0.5:1}}
            >
              {metaTestStatus==="testing" ? "Probando..." : "Probar conexión"}
            </button>
            {metaTestStatus?.ok && (
              <span style={{fontSize:12,color:"#16a34a",fontWeight:600}}>
                ✓ Conectado · {metaTestStatus.name} · {metaTestStatus.currency}
              </span>
            )}
            {metaTestStatus?.error && (
              <span style={{fontSize:11,color:"#f87171",fontWeight:600}}>{metaTestStatus.error}</span>
            )}
          </div>
          <p style={{fontSize:11,color:T.textFaint,margin:"4px 0 0"}}>El ID puede ir con o sin prefijo <code>act_</code>. Dejá en blanco para no modificar la configuración existente.</p>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button onClick={onClose} style={{padding:"8px 18px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,color:T.textSub,cursor:"pointer",fontSize:13}}>Cancelar</button>
          <button onClick={handleSave} disabled={saving||!name.trim()} style={{padding:"8px 18px",background:"#e8572a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,opacity:saving?0.7:1}}>
            {saving?"Guardando...":"Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── USER MODAL ──────────────────────────────────────────────────────────────
function UserModal({user, onSave, onClose}) {
  const T = useT();
  const [name, setName] = useState(user?.name||"");
  const [email, setEmail] = useState(user?.email||"");
  const [role, setRole] = useState(user?.role||"team");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), email: email.trim(), role });
    setSaving(false);
  }

  const overlay = {position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
  const box = {background:T.bg1,border:`1px solid ${T.border}`,borderRadius:14,padding:28,width:400,maxWidth:"95vw"};
  const inp = {width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",marginBottom:5,fontSize:12,color:T.textMuted,fontWeight:600};
  const row = {marginBottom:16};

  return (
    <div style={overlay} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={box}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontWeight:700,color:T.text,fontSize:15}}>{user?"Editar usuario":"Nuevo usuario"}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        {!user && (
          <div style={{background:T.warn.bg,border:`1px solid ${T.warn.border}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.warn.text}}>
            Para crear un usuario con acceso real, primero crealo en el panel de Supabase (Authentication → Users), luego edita su perfil aquí.
          </div>
        )}
        <div style={row}>
          <label style={lbl}>Nombre *</label>
          <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo"/>
        </div>
        <div style={row}>
          <label style={lbl}>Email *</label>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@empresa.com" disabled={!!user}/>
        </div>
        <div style={row}>
          <label style={lbl}>Rol</label>
          <select value={role} onChange={e=>setRole(e.target.value)} style={{...inp,cursor:"pointer"}}>
            <option value="master">Master</option>
            <option value="team">Equipo</option>
            <option value="client">Cliente</option>
          </select>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button onClick={onClose} style={{padding:"8px 18px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,color:T.textSub,cursor:"pointer",fontSize:13}}>Cancelar</button>
          <button onClick={handleSave} disabled={saving||!name.trim()||!email.trim()} style={{padding:"8px 18px",background:"#e8572a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,opacity:saving?0.7:1}}>
            {saving?"Guardando...":"Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── INVITE USER MODAL ───────────────────────────────────────────────────────
function InviteUserModal({user, allAccounts, currentAccounts=[], onSave, onClose, toast: toastProp}) {
  const T = useT();
  const [name, setName]       = useState(user?.name||"");
  const [email, setEmail]     = useState(user?.email||"");
  const [role, setRole]       = useState(user?.role||"team");
  const [password, setPassword] = useState("");
  const [selAccounts, setSelAccounts] = useState(currentAccounts);
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(null);
  const [formError, setFormError] = useState("");

  const isEdit = !!user;

  function showErr(msg) {
    setFormError(msg);
    // También intentar toast por si funciona
    try { toastProp?.(msg, "error"); } catch {}
    try { toast(msg, "error"); } catch {}
  }

  function toggleAcc(id) {
    setSelAccounts(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  }

  async function handleSave() {
    setFormError("");
    if (!email.trim()) { setFormError("El email es requerido"); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await onSave({ name: name.trim(), email: email.trim(), role, selAccounts });
      } else {
        if (!password.trim()) { showErr("Ingresá una contraseña temporal (mín. 6 caracteres)"); setSaving(false); return; }
        if (password.trim().length < 6) { showErr("La contraseña debe tener al menos 6 caracteres"); setSaving(false); return; }

        const { data: result, error } = await supabase.functions.invoke("swift-task", {
          body: { action: "create", name: name.trim(), email: email.trim(), password: password.trim(), role, accountIds: selAccounts },
        });

        if (error) { showErr("Error de conexión: " + (error?.message || "no se pudo contactar la función")); setSaving(false); return; }
        if (result?.error) { showErr("Error: " + result.error); setSaving(false); return; }
        if (!result?.id) { showErr("La función no devolvió un ID de usuario. Revisá los logs de la Edge Function en Supabase."); setSaving(false); return; }

        await onSave({ name: name.trim(), email: email.trim(), role, selAccounts, id: result.id });
        setDone(password.trim());
        setSaving(false);
        return;
      }
    } catch(e) {
      showErr("Error inesperado: " + e.message);
    }
    setSaving(false);
    onClose();
  }

  const overlay = {position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000};
  const box = {background:T.bg1,border:`1px solid ${T.border}`,borderRadius:14,padding:28,width:460,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto"};
  const inp = {width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",marginBottom:5,fontSize:12,color:T.textMuted,fontWeight:600};
  const row = {marginBottom:14};

  if (done) return (
    <div style={overlay}>
      <div style={{...box,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:12}}>✅</div>
        <div style={{fontWeight:700,color:T.text,fontSize:16,marginBottom:8}}>Usuario creado</div>
        <div style={{fontSize:13,color:T.textMuted,marginBottom:16}}>Compartí estos datos con <b>{email}</b>:</div>
        <div style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,padding:16,marginBottom:20,textAlign:"left"}}>
          <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Email</div>
          <div style={{fontSize:14,fontWeight:600,color:T.text,marginBottom:12}}>{email}</div>
          <div style={{fontSize:12,color:T.textMuted,marginBottom:4}}>Contraseña temporal</div>
          <div style={{fontSize:14,fontWeight:700,color:"#e8572a",fontFamily:"monospace"}}>{done}</div>
        </div>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:16}}>El usuario puede cambiar la contraseña desde su perfil después de ingresar.</div>
        <button onClick={onClose} style={{padding:"9px 28px",background:"#e8572a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700}}>Listo</button>
      </div>
    </div>
  );

  return (
    <div style={overlay} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={box}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontWeight:700,color:T.text,fontSize:15}}>{isEdit?"Editar usuario":"Invitar usuario"}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,fontSize:20,cursor:"pointer"}}>×</button>
        </div>
        <div style={row}>
          <label style={lbl}>Nombre</label>
          <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo"/>
        </div>
        <div style={row}>
          <label style={lbl}>Email *</label>
          <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@empresa.com" disabled={isEdit}/>
        </div>
        {!isEdit && (
          <div style={row}>
            <label style={lbl}>Contraseña temporal *</label>
            <input style={inp} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"/>
            <div style={{fontSize:11,color:T.textMuted,marginTop:4}}>El usuario puede cambiarla después de ingresar.</div>
          </div>
        )}
        <div style={row}>
          <label style={lbl}>Rol</label>
          <select value={role} onChange={e=>setRole(e.target.value)} style={{...inp,cursor:"pointer"}}>
            <option value="master">Master — acceso total a todo</option>
            <option value="team">Equipo — solo las cuentas asignadas, puede editar</option>
            <option value="client">Cliente — solo las cuentas asignadas, vista limitada</option>
          </select>
        </div>
        {role !== "master" && (
          <div style={row}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
              <label style={{...lbl,marginBottom:0}}>
                Acceso a cuentas
                <span style={{marginLeft:6,fontSize:10,color:T.textFaint,fontWeight:400}}>({selAccounts.length}/{allAccounts.length} seleccionadas)</span>
              </label>
              <button
                type="button"
                onClick={()=>selAccounts.length===allAccounts.length?setSelAccounts([]):setSelAccounts(allAccounts.map(a=>a.id))}
                style={{fontSize:10,padding:"2px 10px",background:"none",border:`1px solid ${T.border2}`,borderRadius:6,color:T.textMuted,cursor:"pointer"}}
              >
                {selAccounts.length===allAccounts.length?"Deseleccionar todo":"Seleccionar todo"}
              </button>
            </div>
            {allAccounts.length === 0 ? (
              <div style={{textAlign:"center",padding:"14px 0",color:T.textFaint,fontSize:12}}>No hay cuentas creadas todavía</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:200,overflowY:"auto",padding:"2px 0"}}>
                {allAccounts.map(acc=>{
                  const sel = selAccounts.includes(acc.id);
                  return (
                    <div key={acc.id} onClick={()=>toggleAcc(acc.id)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
                        border:`1px solid ${sel?"#e8572a55":T.border}`,
                        background:sel?"#e8572a0d":T.bg2,cursor:"pointer",transition:"all .12s"}}>
                      <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${sel?"#e8572a":T.border2}`,
                        background:sel?"#e8572a":"none",display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:10,color:"#fff",flexShrink:0,fontWeight:800}}>
                        {sel?"✓":""}
                      </div>
                      {acc.logo_url
                        ? <img src={acc.logo_url} alt="" style={{width:20,height:20,borderRadius:4,objectFit:"contain",flexShrink:0}}/>
                        : <div style={{width:20,height:20,borderRadius:4,background:acc.color||"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",flexShrink:0}}>{acc.name?.[0]}</div>
                      }
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:sel?700:500,color:sel?T.text:T.textSub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{acc.name}</div>
                        {acc.client_name && <div style={{fontSize:10,color:T.textFaint}}>{acc.client_name}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selAccounts.length === 0 && (
              <div style={{fontSize:11,color:T.warn.text,background:T.warn.bg,border:`1px solid ${T.warn.border}`,borderRadius:6,padding:"6px 10px",marginTop:6}}>
                ⚠ El usuario no podrá ver ninguna cuenta sin tener al menos una asignada
              </div>
            )}
          </div>
        )}
        {role === "master" && (
          <div style={{...row,padding:"10px 12px",background:T.ok.bg,border:`1px solid ${T.ok.border}`,borderRadius:8}}>
            <div style={{fontSize:12,color:T.ok.text,fontWeight:600}}>★ Acceso total a todas las cuentas presentes y futuras</div>
            <div style={{fontSize:11,color:T.ok.text,opacity:0.8,marginTop:2}}>Los usuarios Master no necesitan asignación de cuentas</div>
          </div>
        )}
        {/* Error inline — siempre visible dentro del modal */}
        {formError && (
          <div style={{marginTop:4,marginBottom:8,padding:"10px 14px",background:"#2d0a0a",border:"1px solid #991b1b",borderRadius:8,color:"#f87171",fontSize:12,lineHeight:1.5}}>
            ✗ {formError}
          </div>
        )}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:12}}>
          <button onClick={onClose} style={{padding:"9px 20px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,color:T.textSub,cursor:"pointer",fontSize:13}}>Cancelar</button>
          <button onClick={handleSave} disabled={saving||!email.trim()} style={{padding:"9px 22px",background:"#e8572a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,opacity:saving||!email.trim()?0.6:1}}>
            {saving?"Guardando...":(isEdit?"Guardar cambios":"Crear usuario")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── META GUIDE ──────────────────────────────────────────────────────────────
function MetaGuide() {
  const T = useT();
  const [open, setOpen] = useState(false);

  const steps = [
    {
      num: "01",
      title: "Crear un Usuario del Sistema en Meta Business",
      color: "#3b82f6",
      items: [
        "Entrá a business.facebook.com → Configuración del negocio",
        "En el menú izquierdo: Usuarios → Usuarios del sistema",
        "Clic en «Agregar» → escribí el nombre (ej: EcomBoost Analytics) → Rol: Administrador",
        "Hacé clic en «Crear usuario del sistema»",
      ],
      note: "Los tokens de Usuarios del Sistema NO vencen — son permanentes. No uses tu token personal de usuario normal (vence en 60 días).",
    },
    {
      num: "02",
      title: "Generar el Access Token",
      color: "#8b5cf6",
      items: [
        "Dentro del Usuario del Sistema → clic en «Generar nuevo token»",
        "Seleccioná la app de tu negocio (o creá una en developers.facebook.com)",
        "Permisos necesarios: ads_read · ads_management · read_insights · business_management",
        "Hacé clic en «Generar token» y copiá el resultado",
      ],
      note: "Guardá el token en un lugar seguro — solo se muestra una vez. Si lo perdés, generá uno nuevo.",
    },
    {
      num: "03",
      title: "Obtener el ID de la cuenta publicitaria",
      color: "#f59e0b",
      items: [
        "Entrá a Ads Manager: adsmanager.facebook.com",
        "En la URL vas a ver: ?act=XXXXXXXXX — ese número es tu ID",
        "También en: Configuración del negocio → Cuentas → Cuentas publicitarias",
        "El formato es act_XXXXXXXXX (la app agrega el «act_» automáticamente)",
      ],
      note: null,
    },
    {
      num: "04",
      title: "Dar acceso al Usuario del Sistema a la cuenta publicitaria",
      color: "#e8572a",
      items: [
        "Configuración del negocio → Cuentas → Cuentas publicitarias",
        "Seleccioná la cuenta → pestaña «Asignar socios» o «Personas»",
        "Agregá el Usuario del Sistema con rol «Analista» como mínimo",
        "Sin este paso el token no tiene permiso para leer los datos",
      ],
      note: "Si el token falla con «#100 — unsupported get request» o «#200 — permission error», es por falta de acceso.",
    },
  ];

  const tip = (icon, text, sub) => (
    <div style={{display:"flex",gap:10,padding:"10px 14px",background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,marginBottom:6}}>
      <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
      <div>
        <div style={{fontSize:12,fontWeight:600,color:T.textSub}}>{text}</div>
        {sub && <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div style={{marginTop:22,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden"}}>
      <div onClick={()=>setOpen(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,padding:"13px 18px",background:T.bg1,cursor:"pointer",userSelect:"none"}}>
        <span style={{fontSize:16}}>📘</span>
        <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Cómo conectar la API de Meta Ads</span>
        <span style={{fontSize:11,color:T.textMuted,marginRight:6}}>Token · ID · Permisos · Extensión</span>
        <span style={{color:T.textDim,fontSize:13}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{padding:"18px 20px",background:T.bg,borderTop:`1px solid ${T.border}`}}>

          {/* Steps */}
          {steps.map(s=>(
            <div key={s.num} style={{marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:s.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{s.num}</div>
                <span style={{fontSize:13,fontWeight:700,color:T.text}}>{s.title}</span>
              </div>
              <div style={{paddingLeft:38}}>
                {s.items.map((item,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                    <span style={{color:s.color,fontSize:11,marginTop:1,flexShrink:0}}>→</span>
                    <span style={{fontSize:12,color:T.textSub,lineHeight:1.5}}>{item}</span>
                  </div>
                ))}
                {s.note && (
                  <div style={{display:"flex",gap:8,marginTop:8,padding:"8px 12px",background:s.color+"11",border:`1px solid ${s.color}33`,borderRadius:7}}>
                    <span style={{fontSize:13,flexShrink:0}}>⚠</span>
                    <span style={{fontSize:11,color:T.textSub,lineHeight:1.5}}>{s.note}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Token types */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>⏱ Duración de los tokens</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {tipo:"Token de usuario",duracion:"60 días",color:"#f87171",nota:"Vence — no recomendado para producción"},
                {tipo:"Token de página",duracion:"Sin vencimiento",color:"#fbbf24",nota:"Solo para páginas, no para Ads"},
                {tipo:"Token de Usuario del Sistema",duracion:"Sin vencimiento ✓",color:"#4ade80",nota:"Recomendado — permanente y seguro"},
              ].map(t=>(
                <div key={t.tipo} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 13px"}}>
                  <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>{t.tipo}</div>
                  <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:4}}>{t.duracion}</div>
                  <div style={{fontSize:10,color:T.textFaint,lineHeight:1.4}}>{t.nota}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick tips */}
          <div>
            <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>💡 Errores frecuentes</div>
            {tip("🔑", "Token inválido o expirado", "Generá uno nuevo desde el Usuario del Sistema en business.facebook.com")}
            {tip("🚫", "Permission error (#200)", "El Usuario del Sistema no tiene acceso a esa cuenta publicitaria. Agregarlo en Configuración del negocio → Cuentas publicitarias")}
            {tip("📋", "Unsupported get request (#100)", "Verificá que los permisos ads_read y read_insights estén activados en el token")}
            {tip("🔢", "ID de cuenta incorrecto", "Debe ser solo el número (ej: 123456789). La app agrega act_ automáticamente. No uses el ID del BM ni de la página")}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS MODULE ─────────────────────────────────────────────────────────
function SettingsModule({currentUser, allAccounts, allUsers, setAllAccounts, setAllUsers, toast, onMetaSaved}) {
  const T = useT();
  const [tab, setTab] = useState("accounts");
  const [showAccModal, setShowAccModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editAcc, setEditAcc] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [userAccesses, setUserAccesses] = useState({});   // { userId: [accountId, ...] }
  const [editUserAccounts, setEditUserAccounts] = useState([]);

  const isMaster = currentUser?.role === "master";

  // Cargar usuarios y accesos cuando se abre la pestaña de usuarios
  useEffect(() => {
    if (tab === "users" && isMaster) {
      refreshUsers();
      loadAllAccesses();
    }
  }, [tab]);

  async function refreshUsers() {
    if (!isSupabaseConfigured || !supabase) return;
    const { data, error } = await supabase.from("profiles").select("*").order("name");
    if (!error && data && data.length > 0) setAllUsers(data);
  }

  async function loadAllAccesses() {
    if (!isSupabaseConfigured || !supabase) return;
    const { data } = await supabase.from("account_access").select("profile_id, account_id");
    if (data) {
      const map = {};
      data.forEach(row => {
        if (!map[row.profile_id]) map[row.profile_id] = [];
        map[row.profile_id].push(row.account_id);
      });
      setUserAccesses(map);
    }
  }

  function openEditUser(u) {
    setEditUser(u);
    setEditUserAccounts(userAccesses[u.id] || []);
    setShowUserModal(true);
  }

  async function handleSaveAccount(data) {
    const accountId = editAcc ? editAcc.id : (crypto.randomUUID?.() || Date.now().toString());
    const adAccId = data.metaAdAccId ? (data.metaAdAccId.startsWith("act_") ? data.metaAdAccId : `act_${data.metaAdAccId}`) : null;
    const metaFields = data.metaToken ? { meta_token: data.metaToken, meta_ad_account_id: adAccId } : {};

    if (editAcc) {
      if (isSupabaseConfigured && supabase) {
        const {error} = await supabase.from("accounts")
          .update({name:data.name, client_name:data.client_name, client_email:data.client_email, logo_url:data.logo_url, ...metaFields})
          .eq("id", accountId);
        if (error) { toast("Error: "+error.message,"error"); return; }
      }
      const updated = {...editAcc, ...data, ...metaFields};
      setAllAccounts(p=>p.map(a=>a.id===accountId ? updated : a));
      toast("Cuenta actualizada");
    } else {
      const acc = {id:accountId, ...data, ...metaFields, spend:0, revenue:0, roas:0, cpc:0, ctr:0, impressions:0, clicks:0, conversions:0, phases:[]};
      if (isSupabaseConfigured && supabase) {
        const {error} = await supabase.from("accounts")
          .insert({id:accountId, name:data.name, client_name:data.client_name, client_email:data.client_email, logo_url:data.logo_url, ...metaFields});
        if (error) { toast("Error: "+error.message,"error"); return; }
      }
      setAllAccounts(p=>[...p, acc]);
      toast("Cuenta creada");
    }
    setShowAccModal(false); setEditAcc(null);
  }

  async function handleDeleteAccount(id) {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    if (isSupabaseConfigured && supabase) {
      const {error} = await supabase.from("accounts").delete().eq("id", id);
      if (error) { toast("Error al eliminar: "+error.message,"error"); return; }
    }
    setAllAccounts(p=>p.filter(a=>a.id!==id));
    toast("Cuenta eliminada");
  }

  async function handleSaveUser(data) {
    if (editUser) {
      if (isSupabaseConfigured && supabase) {
        const {error} = await supabase.from("profiles").update({name:data.name, role:data.role}).eq("id", editUser.id);
        if (error) { toast("Error: "+error.message,"error"); return; }
        // Actualizar accesos a cuentas
        if (data.selAccounts !== undefined) {
          await supabase.from("account_access").delete().eq("profile_id", editUser.id);
          if (data.selAccounts.length > 0) {
            await supabase.from("account_access").insert(data.selAccounts.map(aid=>({profile_id: editUser.id, account_id: aid})));
          }
        }
      }
      setAllUsers(p=>p.map(u=>u.id===editUser.id?{...u,...data}:u));
      toast("Usuario actualizado");
      setShowUserModal(false); setEditUser(null); setEditUserAccounts([]);
      setTimeout(loadAllAccesses, 500);
    } else {
      // Nuevo usuario — agregar a estado local inmediatamente
      // Agregar inmediatamente al estado local con todos los campos correctos
      const newU = {
        id: data.id || Date.now().toString(),
        name: data.name || "",
        email: data.email || "",
        role: data.role || "team",
        avatar: (data.name || data.email || "?")[0].toUpperCase()
      };
      setAllUsers(p => [...p, newU]);
      setShowUserModal(false); setEditUser(null); setEditUserAccounts([]);
      toast("Usuario creado ✓");
      // Re-fetch para confirmar y sincronizar con DB (esperamos 1.5s para que la Edge Function termine)
      if (isSupabaseConfigured && supabase) {
        setTimeout(async () => {
          const { data: users, error } = await supabase.from("profiles").select("*").order("name");
          if (!error && users) setAllUsers(users);
          loadAllAccesses();
        }, 1500);
      }
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm("¿Eliminar este usuario?")) return;
    if (isSupabaseConfigured && supabase) {
      const { data: result, error } = await supabase.functions.invoke("swift-task", {
        body: { action: "delete", userId: id },
      });
      if (error || result?.error) { toast("Error al eliminar: "+(result?.error || error?.message),"error"); return; }
    }
    setAllUsers(p=>p.filter(u=>u.id!==id));
    toast("Usuario eliminado");
  }

  const tabStyle = active => ({padding:"8px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:active?700:400,background:active?"#e8572a":T.bg2,color:active?"#fff":T.textSub});
  const card = {background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 18px",marginBottom:10,display:"flex",alignItems:"center",gap:14};
  const inp = {background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"9px 12px",color:T.text,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"};

  return (
    <div style={{padding:"24px 28px",maxWidth:800}}>
      <h2 style={{fontSize:20,fontWeight:700,color:T.text,margin:"0 0 20px"}}>Configuración</h2>
      <div style={{display:"flex",gap:8,marginBottom:22}}>
        {isMaster && <button style={tabStyle(tab==="accounts")} onClick={()=>setTab("accounts")}>Cuentas</button>}
        {isMaster && <button style={tabStyle(tab==="users")} onClick={()=>setTab("users")}>Usuarios</button>}
      </div>

      {tab==="accounts" && isMaster && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontSize:14,fontWeight:600,color:T.textSub}}>Cuentas publicitarias</span>
            <button onClick={()=>{setEditAcc(null);setShowAccModal(true)}} style={{padding:"7px 16px",background:"#e8572a",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>+ Nueva cuenta</button>
          </div>
          {allAccounts.map(acc=>(
            <div key={acc.id} style={card}>
              {acc.logo_url ? <img src={acc.logo_url} alt="logo" style={{width:38,height:38,objectFit:"contain",borderRadius:6,border:`1px solid ${T.border}`}}/> : <div style={{width:38,height:38,borderRadius:6,background:"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14}}>{acc.name?.[0]||"?"}</div>}
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:T.text,fontSize:13}}>{acc.name}</div>
                {acc.client_name && <div style={{fontSize:11,color:T.textMuted}}>{acc.client_name}{acc.client_email?" · "+acc.client_email:""}</div>}
                {acc.meta_connected && <div style={{fontSize:10,color:"#16a34a",fontWeight:600,marginTop:2}}>● Meta API conectada</div>}
              </div>
              <button onClick={()=>{setEditAcc(acc);setShowAccModal(true)}} style={{padding:"5px 12px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:6,color:T.textSub,cursor:"pointer",fontSize:12}}>Editar</button>
              <button onClick={()=>handleDeleteAccount(acc.id)} style={{padding:"5px 12px",background:T.bad.bg,border:`1px solid ${T.bad.border}`,borderRadius:6,color:T.bad.text,cursor:"pointer",fontSize:12}}>Eliminar</button>
            </div>
          ))}
          {allAccounts.length===0 && <div style={{textAlign:"center",padding:40,color:T.textFaint,fontSize:13}}>Sin cuentas. Creá la primera.</div>}
          {showAccModal && <AccountModal account={editAcc} onSave={handleSaveAccount} onClose={()=>{setShowAccModal(false);setEditAcc(null)}}/>}
          <MetaGuide/>
        </div>
      )}

      {tab==="users" && isMaster && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div>
              <span style={{fontSize:14,fontWeight:600,color:T.textSub}}>Usuarios del sistema</span>
              <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{allUsers.length} usuario{allUsers.length!==1?"s":""} registrado{allUsers.length!==1?"s":""}</div>
            </div>
            <button onClick={()=>{setEditUser(null);setEditUserAccounts([]);setShowUserModal(true)}} style={{padding:"7px 16px",background:"#e8572a",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>+ Invitar usuario</button>
          </div>

          {/* Leyenda de roles */}
          <div style={{display:"flex",gap:12,marginBottom:14,padding:"8px 12px",background:T.bg2,borderRadius:8,flexWrap:"wrap"}}>
            {Object.entries(ROLE_LABEL).map(([role,label])=>(
              <span key={role} style={{fontSize:11,color:ROLE_COLOR[role],fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:ROLE_COLOR[role],display:"inline-block"}}/>
                {label}
              </span>
            ))}
            <span style={{fontSize:11,color:T.textFaint,marginLeft:"auto"}}>
              Master: acceso total · Equipo: todas las cuentas · Cliente: solo sus cuentas
            </span>
          </div>

          {allUsers.map(u=>{
            const accIds = userAccesses[u.id] || [];
            const userAccNames = accIds.map(id=>allAccounts.find(a=>a.id===id)?.name).filter(Boolean);
            const isMe = u.id === currentUser?.id;
            return (
              <div key={u.id} style={{...card, flexWrap:"wrap", alignItems:"flex-start", gap:12}}>
                {/* Avatar */}
                <div style={{width:40,height:40,borderRadius:"50%",background:ROLE_COLOR[u.role]||"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:14,flexShrink:0,border:`2px solid ${ROLE_COLOR[u.role]}33`}}>
                  {(u.name||u.email||"?")[0].toUpperCase()}
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontWeight:700,color:T.text,fontSize:13}}>{u.name||"Sin nombre"}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:ROLE_COLOR[u.role]+"22",color:ROLE_COLOR[u.role],border:`1px solid ${ROLE_COLOR[u.role]}44`,fontWeight:700}}>
                      {ROLE_LABEL[u.role]||u.role}
                    </span>
                    {isMe && <span style={{fontSize:10,color:T.textFaint,fontStyle:"italic"}}>· Vos</span>}
                  </div>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{u.email}</div>
                  {/* Accesos a cuentas */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>
                    {u.role==="master" ? (
                      <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:"#e8572a22",color:"#e8572a",border:"1px solid #e8572a44",fontWeight:600}}>
                        ★ Acceso total a todas las cuentas
                      </span>
                    ) : userAccNames.length > 0 ? (
                      <>
                        {userAccNames.slice(0,4).map(name=>(
                          <span key={name} style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:T.bg2,color:T.textSub,border:`1px solid ${T.border}`,fontWeight:500}}>
                            {name}
                          </span>
                        ))}
                        {userAccNames.length > 4 && (
                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:T.bg2,color:T.textFaint,border:`1px solid ${T.border}`}}>
                            +{userAccNames.length - 4} más
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{fontSize:10,padding:"2px 6px",borderRadius:8,background:T.warn.bg,color:T.warn.text,border:`1px solid ${T.warn.border}`,fontWeight:600}}>
                        ⚠ Sin acceso a cuentas
                      </span>
                    )}
                  </div>
                </div>
                {/* Acciones */}
                {!isMe && (
                  <div style={{display:"flex",gap:6,flexShrink:0,alignSelf:"center"}}>
                    <button onClick={()=>openEditUser(u)} style={{padding:"6px 14px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:12,fontWeight:600}}>✏ Editar</button>
                    <button onClick={()=>handleDeleteUser(u.id)} style={{padding:"6px 12px",background:T.bad.bg,border:`1px solid ${T.bad.border}`,borderRadius:7,color:T.bad.text,cursor:"pointer",fontSize:12,fontWeight:600}}>🗑</button>
                  </div>
                )}
              </div>
            );
          })}
          {allUsers.length===0 && (
            <div style={{textAlign:"center",padding:"40px 20px",color:T.textFaint,fontSize:13}}>
              <div style={{fontSize:32,marginBottom:10,opacity:0.3}}>👥</div>
              <div style={{fontWeight:600,color:T.textSub,marginBottom:4}}>Sin usuarios todavía</div>
              <div>Invitá el primero con el botón de arriba</div>
            </div>
          )}
          {showUserModal && (
            <InviteUserModal
              user={editUser}
              allAccounts={allAccounts}
              currentAccounts={editUserAccounts}
              onSave={handleSaveUser}
              onClose={()=>{setShowUserModal(false);setEditUser(null);setEditUserAccounts([]);}}
              toast={toast}
            />
          )}
        </div>
      )}

    </div>
  );
}

// ─── DATE RANGE HELPERS ───────────────────────────────────────────────────────
function fmtDate(d) { return d.toISOString().split("T")[0]; }
function getPresetRange(preset) {
  const today = new Date();
  switch(preset) {
    case "today":      return { from: fmtDate(today), to: fmtDate(today) };
    case "yesterday":  { const d=new Date(today); d.setDate(d.getDate()-1); return { from:fmtDate(d), to:fmtDate(d) }; }
    case "last_7":     { const d=new Date(today); d.setDate(d.getDate()-6); return { from:fmtDate(d), to:fmtDate(today) }; }
    case "last_14":    { const d=new Date(today); d.setDate(d.getDate()-13); return { from:fmtDate(d), to:fmtDate(today) }; }
    case "last_30":    { const d=new Date(today); d.setDate(d.getDate()-29); return { from:fmtDate(d), to:fmtDate(today) }; }
    case "this_month": { const d=new Date(today.getFullYear(),today.getMonth(),1); return { from:fmtDate(d), to:fmtDate(today) }; }
    case "last_month": { const f=new Date(today.getFullYear(),today.getMonth()-1,1); const t=new Date(today.getFullYear(),today.getMonth(),0); return { from:fmtDate(f), to:fmtDate(t) }; }
    default: return { from:fmtDate(today), to:fmtDate(today) };
  }
}
const DATE_PRESETS = [
  {id:"today",      label:"Hoy"},
  {id:"yesterday",  label:"Ayer"},
  {id:"last_7",     label:"Últimos 7 días"},
  {id:"last_14",    label:"Últimos 14 días"},
  {id:"last_30",    label:"Últimos 30 días"},
  {id:"this_month", label:"Este mes"},
  {id:"last_month", label:"Mes anterior"},
  {id:"custom",     label:"Personalizado"},
];

// ─── DATE RANGE PICKER ────────────────────────────────────────────────────────
function DateRangePicker({ dateRange, onChange }) {
  const T = useT();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateRange.from);
  const [customTo,   setCustomTo]   = useState(dateRange.to);

  function selectPreset(id) {
    if (id === "custom") { onChange({...dateRange, preset:"custom"}); return; }
    onChange({ preset: id, ...getPresetRange(id) });
    setOpen(false);
  }
  function applyCustom() {
    onChange({ preset:"custom", from:customFrom, to:customTo });
    setOpen(false);
  }

  const label = DATE_PRESETS.find(p=>p.id===dateRange.preset)?.label || `${dateRange.from} → ${dateRange.to}`;
  const btnStyle = (active) => ({
    display:"block", width:"100%", textAlign:"left", padding:"8px 12px",
    background: active ? "#e8572a22" : "transparent",
    border:"none", borderRadius:7,
    color: active ? "#e8572a" : T.text,
    cursor:"pointer", fontSize:13, fontWeight: active ? 700 : 400,
  });

  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} style={{padding:"6px 12px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
        📅 {label} <span style={{color:T.textMuted,fontSize:10}}>▼</span>
      </button>
      {open && <>
        <div style={{position:"fixed",inset:0,zIndex:998}} onClick={()=>setOpen(false)}/>
        <div className="date-range-drop" style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10,padding:8,zIndex:999,minWidth:210,boxShadow:"0 8px 32px rgba(0,0,0,0.35)"}}>
          {DATE_PRESETS.map(p=>(
            <button key={p.id} style={btnStyle(dateRange.preset===p.id)} onClick={()=>selectPreset(p.id)}>{p.label}</button>
          ))}
          {dateRange.preset==="custom" && (
            <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`,marginTop:4}}>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>Desde</div>
                <input type="date" value={customFrom} onChange={e=>setCustomFrom(e.target.value)} style={{width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:6,padding:"5px 8px",color:T.text,fontSize:12,outline:"none"}}/>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:3}}>Hasta</div>
                <input type="date" value={customTo} onChange={e=>setCustomTo(e.target.value)} style={{width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:6,padding:"5px 8px",color:T.text,fontSize:12,outline:"none"}}/>
              </div>
              <button onClick={applyCustom} disabled={!customFrom||!customTo||customFrom>customTo} style={{width:"100%",padding:"7px",background:"#e8572a",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700}}>Aplicar</button>
            </div>
          )}
        </div>
      </>}
    </div>
  );
}

// ─── PROJECT PICKER ──────────────────────────────────────────────────────────
function ProjectPicker({accounts, activeId, onSelect, onClose}) {
  const T = useT();
  const [search, setSearch] = useState("");
  const filtered = accounts.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || (a.client_name||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:16,padding:24,width:460,maxWidth:"95vw",maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <span style={{fontWeight:700,fontSize:16,color:T.text}}>Seleccionar cuenta</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar cuenta..." style={{background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:8,padding:"8px 12px",color:T.text,fontSize:13,outline:"none",marginBottom:14}}/>
        <div style={{overflowY:"auto",flex:1}}>
          {filtered.map(acc=>(
            <div key={acc.id} onClick={()=>{onSelect(acc.id);onClose()}} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:10,cursor:"pointer",background:acc.id===activeId?T.hover:"transparent",border:`1px solid ${acc.id===activeId?T.border2:"transparent"}`,marginBottom:6,transition:"background .15s"}}>
              {acc.logo_url
                ? <img src={acc.logo_url} alt="logo" style={{width:40,height:40,objectFit:"contain",borderRadius:8,border:`1px solid ${T.border}`}}/>
                : <div style={{width:40,height:40,borderRadius:8,background:"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0}}>{acc.name?.[0]||"?"}</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,color:T.text,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{acc.name}</div>
                {acc.client_name && <div style={{fontSize:11,color:T.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{acc.client_name}{acc.client_email?" · "+acc.client_email:""}</div>}
              </div>
              {acc.id===activeId && <span style={{color:"#e8572a",fontSize:18}}>✓</span>}
            </div>
          ))}
          {filtered.length===0 && <div style={{textAlign:"center",padding:30,color:T.textFaint,fontSize:13}}>Sin resultados</div>}
        </div>
      </div>
    </div>
  );
}

// ─── MONTHLY REPORT HELPERS ──────────────────────────────────────────────────
const MONTHLY_BLOCKS = [
  { id:"m_kpis",        label:"📊 Métricas Importantes",    desc:"KPI cards con % variación vs período anterior" },
  { id:"m_charts",      label:"📈 Gráficos de Evolución",   desc:"Inversión/Compras + ROAS en el tiempo" },
  { id:"m_platform",    label:"🍩 Ventas por Plataforma",   desc:"Donas por placement y plataforma" },
  { id:"m_campaigns",   label:"🎯 Resultados por Campaña",  desc:"Tabla con % variación vs anterior" },
  { id:"m_creatives",   label:"🎨 Resultados por Creativos", desc:"Thumbnails con variación %" },
  { id:"m_demo",        label:"👥 Demografía",              desc:"Edades top y ubicaciones top" },
  { id:"m_conclusions", label:"📝 Conclusiones",            desc:"Análisis, trabajo y objetivos del mes" },
];

function DonutChart({ data, title, size=120 }) {
  const total = data.reduce((s,d)=>s+(d.value||0),0);
  if (!total) return (
    <div style={{textAlign:"center",padding:"12px 0"}}>
      <div style={{fontSize:9,color:"#bbb",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{title}</div>
      <div style={{fontSize:10,color:"#ccc"}}>Sin datos</div>
    </div>
  );
  const cx=size/2, cy=size/2, R=size/2-4, r=R*0.54;
  let angle=-Math.PI/2;
  const slices=data.map(d=>{
    const sweep=(d.value/total)*2*Math.PI;
    if(sweep===0)return null;
    const x1=cx+R*Math.cos(angle),y1=cy+R*Math.sin(angle);
    const x2=cx+R*Math.cos(angle+sweep),y2=cy+R*Math.sin(angle+sweep);
    const ix1=cx+r*Math.cos(angle+sweep),iy1=cy+r*Math.sin(angle+sweep);
    const ix2=cx+r*Math.cos(angle),iy2=cy+r*Math.sin(angle);
    const lg=sweep>Math.PI?1:0;
    const path=`M${x1},${y1} A${R},${R} 0 ${lg} 1 ${x2},${y2} L${ix1},${iy1} A${r},${r} 0 ${lg} 0 ${ix2},${iy2} Z`;
    angle+=sweep;
    return {...d,path,pct:(d.value/total)*100};
  }).filter(Boolean);
  return (
    <div style={{flex:1,minWidth:0}}>
      <div style={{fontSize:9,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:7}}>{title}</div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
          {slices.map((s,i)=><path key={i} d={s.path} fill={s.color}/>)}
        </svg>
        <div style={{flex:1,minWidth:0}}>
          {slices.map(s=>(
            <div key={s.label} style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
              <div style={{width:7,height:7,borderRadius:2,background:s.color,flexShrink:0}}/>
              <span style={{fontSize:8,color:"#555",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.label}</span>
              <span style={{fontSize:8,fontWeight:700,color:"#111"}}>{s.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REPORT BUILDER ──────────────────────────────────────────────────────────
const PDF_BLOCKS = [
  { id:"summary",    label:"Resumen ejecutivo",       desc:"Análisis automático del período" },
  { id:"kpis",       label:"KPIs principales",         desc:"ROAS, CPA, CTR, Revenue, Gasto" },
  { id:"goals",      label:"Estado de objetivos",      desc:"Semáforo verde/rojo vs metas" },
  { id:"funnel",     label:"Métricas del embudo",      desc:"3 fases: Creativos→Acciones→Conv." },
  { id:"chart_roas", label:"Gráfico ROAS diario",      desc:"Evolución del ROAS en el período" },
  { id:"chart_rev",  label:"Gráfico Revenue vs Gasto", desc:"Barras comparativas diarias" },
  { id:"creativos",  label:"Top creativos",            desc:"Ranking por ROAS con hook rate" },
  { id:"campaigns",  label:"Tabla de campañas",        desc:"Performance por campaña activa" },
  { id:"reach",      label:"Alcance y frecuencia",     desc:"Impresiones, CPM, clics enlace" },
  { id:"custom_summary", label:"Resumen personalizado", desc:"Texto libre editable para el reporte" },
];

function ReportBuilder({ account, tasks, dateRange, onDateRangeChange }) {
  const T = useT();
  const [sel, setSel]         = useState(["summary","kpis","goals","funnel","chart_roas","creativos","campaigns"]);
  const dateFrom = dateRange?.from || new Date(Date.now()-7*86400000).toISOString().slice(0,10);
  const dateTo   = dateRange?.to   || new Date().toISOString().slice(0,10);
  function setDateFrom(v) { onDateRangeChange?.({ preset:"custom", from:v, to:dateTo }); }
  function setDateTo(v)   { onDateRangeChange?.({ preset:"custom", from:dateFrom, to:v }); }
  const [note, setNote]         = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview]   = useState(true);
  const [reportMode,    setReportMode]   = useState("classic");
  const [monthlySel,    setMonthlySel]   = useState(["m_kpis","m_charts","m_platform","m_campaigns","m_creatives","m_demo","m_conclusions"]);
  const [monthlyLoading,setMonthlyLoading]= useState(false);
  const [monthlyData,   setMonthlyData]  = useState(null);
  const [monthlyPrevData,setMonthlyPrevData]= useState(null);
  const [monthlyPrevCamps,setMonthlyPrevCamps]= useState([]);
  const [mPreview,      setMPreview]     = useState(true);
  const [mGenerating,   setMGenerating]  = useState(false);
  const [conclAnalisis, setConclAnalisis]= useState("");
  const [conclTrabajo,  setConclTrabajo] = useState([""]);
  const [conclProximo,  setConclProximo] = useState([""]);
  const [conclObj,      setConclObj]     = useState({facturacion:"",roas:"",cpa:""});
  // ─── Saved Reports state ─────────────────────────────────────────────────────
  const [savedReports,     setSavedReports]     = useState([]);
  const [activeReportId,   setActiveReportId]   = useState(null);
  const [activeReportName, setActiveReportName] = useState("");
  const [saveStatus,       setSaveStatus]       = useState("idle"); // "idle"|"saving"|"saved"
  const [showNameModal,    setShowNameModal]    = useState(false);
  const [nameInput,        setNameInput]        = useState("");
  const [nameError,        setNameError]        = useState("");
  const [renameId,         setRenameId]         = useState(null);
  const [renameInput,      setRenameInput]      = useState("");
  const [deleteConfirmId,  setDeleteConfirmId]  = useState(null);
  const autosaveTimerRef = useRef(null);
  const skipAutosaveRef  = useRef(false);
  const activeIdRef      = useRef(null);
  activeIdRef.current    = activeReportId;
  const buildConfigRef   = useRef(null);
  buildConfigRef.current = () => ({
    sel, monthlySel, reportMode, note, customSummary,
    conclAnalisis, conclTrabajo, conclProximo, conclObj,
    dateFrom, dateTo, accountId: account?.id,
  });

  if (!account) return <div style={{padding:40,textAlign:"center",color:T.textFaint,fontSize:14}}>Seleccioná una cuenta para generar el reporte.</div>;

  const f     = account.funnel||{creativos:{},acciones:{},conversion:{}};
  const goals = account.goals||{roas:3,cpa:10,ctr:1.5,budget:1000};
  const cr = f.creativos||{}; const ac = f.acciones||{}; const cv = f.conversion||{};
  const roasOk = (cv.roas||0) >= goals.roas;
  const cpaOk  = (cv.costoCompra||0) <= goals.cpa;
  const ctrOk  = (cr.ctrUnico||0) >= goals.ctr;
  const profit = (cv.facturacion||0) - (cv.inversion||0);
  const roi    = cv.inversion ? ((profit / cv.inversion) * 100).toFixed(0) : "0";
  const topCr  = (CREATIVES[account.id] || []).sort((a,b) => b.roas - a.roas).slice(0, 5);

  function toggle(id) { setSel(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]); }
  function moveUp(i) { if(i===0)return; const n=[...sel]; [n[i-1],n[i]]=[n[i],n[i-1]]; setSel(n); }
  function moveDn(i) { if(i===sel.length-1)return; const n=[...sel]; [n[i],n[i+1]]=[n[i+1],n[i]]; setSel(n); }

  async function generatePDF() {
    setGenerating(true);
    if (!preview) setPreview(true);
    await new Promise(r=>setTimeout(r,600));
    try {
      await new Promise((res,rej)=>{ if(window.html2canvas)return res(); const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      await new Promise((res,rej)=>{ if(window.jspdf)return res(); const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      const el = document.getElementById("pdf-target");
      if (!el) { setGenerating(false); return; }
      const canvas = await window.html2canvas(el, { scale:2, useCORS:true, backgroundColor:"#ffffff", width:el.scrollWidth, height:el.scrollHeight });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const cW=186, imgH=(canvas.height*cW)/canvas.width;
      let y=0;
      while(y<imgH) {
        if(y>0) pdf.addPage();
        const sl=Math.min(273,imgH-y);
        const srcY=(y/imgH)*canvas.height, srcH=(sl/imgH)*canvas.height;
        const c2=document.createElement("canvas"); c2.width=canvas.width; c2.height=srcH;
        c2.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
        pdf.addImage(c2.toDataURL("image/jpeg",0.92),"JPEG",12,12,cW,sl);
        y+=sl;
      }
      pdf.save(`EcomBoost_${account.name}_${dateFrom}_${dateTo}.pdf`);
    } catch(e) { console.error(e); }
    setGenerating(false);
  }

  async function fetchMonthlyData() {
    if (!account?.meta_token || !account?.meta_ad_account_id) return;
    setMonthlyLoading(true);
    const token = account.meta_token;
    const accId = account.meta_ad_account_id.startsWith("act_") ? account.meta_ad_account_id : `act_${account.meta_ad_account_id}`;
    const META_V = "v22.0";
    const tr = JSON.stringify({ since: dateFrom, until: dateTo });
    const days = Math.max(1, Math.round((new Date(dateTo)-new Date(dateFrom))/86400000));
    const prevTo   = new Date(new Date(dateFrom).getTime()-86400000).toISOString().slice(0,10);
    const prevFrom = new Date(new Date(dateFrom).getTime()-days*86400000).toISOString().slice(0,10);
    const prevTr   = JSON.stringify({ since: prevFrom, until: prevTo });
    const baseF    = "spend,impressions,reach,outbound_clicks,actions,action_values,cpm,cpc,ctr,unique_ctr";
    try {
      const [platR,ageR,regionR,prevR,prevCampR] = await Promise.all([
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${new URLSearchParams({access_token:token,fields:"spend,actions,action_values,impressions",time_range:tr,level:"account",breakdowns:"publisher_platform,platform_position"})}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${new URLSearchParams({access_token:token,fields:"actions,action_values,impressions",time_range:tr,level:"account",breakdowns:"age"})}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${new URLSearchParams({access_token:token,fields:"outbound_clicks,impressions",time_range:tr,level:"account",breakdowns:"region"})}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${new URLSearchParams({access_token:token,fields:baseF,time_range:prevTr,level:"account"})}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${new URLSearchParams({access_token:token,fields:"campaign_name,campaign_id,spend,actions,action_values",time_range:prevTr,level:"campaign"})}`).then(r=>r.json()),
      ]);
      setMonthlyData({ plat:platR.data||[], age:ageR.data||[], region:regionR.data||[] });
      setMonthlyPrevData(prevR.data?.[0]||null);
      setMonthlyPrevCamps(prevCampR.data||[]);
    } catch(e) { console.error("Monthly fetch:",e); }
    setMonthlyLoading(false);
  }

  async function generateMonthlyPDF() {
    setMGenerating(true);
    if (!mPreview) setMPreview(true);
    await new Promise(r=>setTimeout(r,600));
    try {
      await new Promise((res,rej)=>{ if(window.html2canvas)return res(); const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      await new Promise((res,rej)=>{ if(window.jspdf)return res(); const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
      const el = document.getElementById("monthly-pdf-target");
      if (!el) { setMGenerating(false); return; }
      const canvas = await window.html2canvas(el, { scale:2, useCORS:true, backgroundColor:"#ffffff", width:el.scrollWidth, height:el.scrollHeight });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const cW=186, imgH=(canvas.height*cW)/canvas.width;
      let y=0;
      while(y<imgH) {
        if(y>0) pdf.addPage();
        const sl=Math.min(273,imgH-y);
        const srcY=(y/imgH)*canvas.height, srcH=(sl/imgH)*canvas.height;
        const c2=document.createElement("canvas"); c2.width=canvas.width; c2.height=srcH;
        c2.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
        pdf.addImage(c2.toDataURL("image/jpeg",0.92),"JPEG",12,12,cW,sl);
        y+=sl;
      }
      pdf.save(`EcomBoost_Mensual_${account.name}_${dateFrom}_${dateTo}.pdf`);
    } catch(e) { console.error(e); }
    setMGenerating(false);
  }

  function MonthlyPDFContent() {
    const PTYPES = ["purchase","offsite_conversion.fb_pixel_purchase","omni_purchase","web_in_store_purchase"];
    const gPurch = (actions) => { if(!actions)return 0; for(const t of PTYPES){const v=parseFloat(actions.find(a=>a.action_type===t)?.value||0);if(v>0)return v;} return 0; };
    const gVal   = (action_values) => { if(!action_values)return 0; for(const t of PTYPES){const v=parseFloat(action_values.find(a=>a.action_type===t)?.value||0);if(v>0)return v;} return 0; };
    const gClks  = (f) => { if(!f)return 0; if(Array.isArray(f))return parseInt(f.find(x=>x.action_type==="outbound_click")?.value||f[0]?.value||0); return parseInt(f||0); };

    const prev = monthlyPrevData;
    const prevSpend     = parseFloat(prev?.spend||0);
    const prevPurch     = gPurch(prev?.actions);
    const prevRev       = gVal(prev?.action_values);
    const prevRoas      = prevSpend>0?prevRev/prevSpend:0;
    const prevCpa       = prevPurch>0?prevSpend/prevPurch:0;
    const prevAtc       = parseFloat(prev?.actions?.find(a=>a.action_type==="add_to_cart")?.value||0);
    const prevClks      = gClks(prev?.outbound_clicks);
    const prevCpm       = parseFloat(prev?.cpm||0);
    const prevConvRate  = prevClks>0?(prevPurch/prevClks)*100:0;

    const spend     = cv.inversion||0;
    const roas      = cv.roas||0;
    const purchases = cv.conversiones||0;
    const cpa       = cv.costoCompra||0;
    const atc       = ac.addToCart||0;
    const convRate  = cv.tasaConversionWeb||0;
    const clicks    = cr.clicsEnlace||0;
    const cpm       = cr.cpm||0;

    const vBadge = (cur, prv, inv=false) => {
      if(!prv||prv===0) return null;
      const pct=((cur-prv)/Math.abs(prv))*100;
      const up=inv?pct<=0:pct>=0;
      return <span style={{fontSize:8,fontWeight:700,padding:"1px 4px",borderRadius:3,background:up?"#dcfce7":"#fee2e2",color:up?"#16a34a":"#dc2626"}}>{pct>=0?"▲":"▼"}{Math.abs(pct).toFixed(1)}%</span>;
    };

    // Platform
    const PCOLORS=["#e1306c","#833ab4","#1877f2","#f59e0b","#4ade80","#3b5998","#fd1d1d","#64748b"];
    const platRaw = monthlyData?.plat||[];
    const placMap={};
    platRaw.forEach(row=>{ const k=`${row.publisher_platform}-${row.platform_position}`; placMap[k]=(placMap[k]||0)+gPurch(row.actions); });
    const placData=Object.entries(placMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v],i)=>({label:k,value:v,color:PCOLORS[i]||"#94a3b8"}));
    const platMap={};
    platRaw.forEach(row=>{ const k=row.publisher_platform; platMap[k]=(platMap[k]||0)+gPurch(row.actions); });
    const platData=Object.entries(platMap).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>({label:k.charAt(0).toUpperCase()+k.slice(1),value:v,color:PCOLORS[i]||"#94a3b8"}));

    // Age & region
    const ACOLORS=["#60a5fa","#a78bfa","#f59e0b","#f87171","#4ade80","#94a3b8"];
    const RCOLORS=["#e8572a","#3b82f6","#a78bfa","#f59e0b","#4ade80","#f87171","#94a3b8"];
    const ageData=(monthlyData?.age||[]).map((row,i)=>({label:row.age,value:gPurch(row.actions),color:ACOLORS[i]||"#94a3b8"})).filter(d=>d.value>0).sort((a,b)=>b.value-a.value).slice(0,6);
    const regionData=(monthlyData?.region||[]).map((row,i)=>({label:row.region,value:gClks(row.outbound_clicks),color:RCOLORS[i]||"#94a3b8"})).filter(d=>d.value>0).sort((a,b)=>b.value-a.value).slice(0,7);

    // Campaign prev map
    const prevCampMap={};
    monthlyPrevCamps.forEach(c=>{prevCampMap[c.campaign_id]=c;});

    // Objectives check
    const objOk = conclObj.facturacion && conclObj.roas && conclObj.cpa &&
      (cv.facturacion||0)>=parseFloat(conclObj.facturacion) &&
      roas>=parseFloat(conclObj.roas) &&
      cpa>0 && cpa<=parseFloat(conclObj.cpa);

    const hs2={border:"1px solid #e5e7eb",padding:"7px 8px",fontSize:9,color:"#888",background:"#f9fafb",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",textAlign:"left"};
    const cs2={border:"1px solid #f3f4f6",padding:"7px 8px",fontSize:10,color:"#333",verticalAlign:"middle"};

    return (
      <div id="monthly-pdf-target" style={{background:"#fff",color:"#111",fontFamily:"Arial,sans-serif",padding:"28px 32px",minWidth:640}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"3px solid #e8572a",paddingBottom:14,marginBottom:22}}>
          <div>
            {account.logo_url&&<img src={account.logo_url} alt="logo" style={{height:40,objectFit:"contain",marginBottom:6,display:"block"}}/>}
            <div style={{fontSize:22,fontWeight:800}}><span style={{color:"#111"}}>Ecom</span><span style={{color:"#e8572a"}}>Boost</span><span style={{color:"#aaa",fontWeight:400,fontSize:12}}> analytics</span></div>
            <div style={{fontSize:11,color:"#777",marginTop:3}}>Reporte Mensual · Meta Ads</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:700,color:account.color||"#e8572a"}}>{account.name}</div>
            {account.client_name&&<div style={{fontSize:11,color:"#555",marginTop:2}}>{account.client_name}</div>}
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{dateFrom} → {dateTo}</div>
            <div style={{fontSize:10,color:"#bbb",marginTop:1}}>Generado: {new Date().toLocaleDateString("es-AR")}</div>
          </div>
        </div>

        {/* S1 KPIs */}
        {monthlySel.includes("m_kpis")&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>📊 Métricas Importantes</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[
                {l:"Inversión",    v:`$${spend.toLocaleString()}`,       b:vBadge(spend,prevSpend)},
                {l:"ROAS",         v:`${roas.toFixed(2)}x`,              b:vBadge(roas,prevRoas)},
                {l:"Compras",      v:purchases.toLocaleString(),          b:vBadge(purchases,prevPurch)},
                {l:"Costo/Compra", v:`$${cpa.toFixed(2)}`,               b:vBadge(cpa,prevCpa,true)},
                {l:"Add to Cart",  v:atc.toLocaleString(),               b:vBadge(atc,prevAtc)},
                {l:"Tasa Conv.",   v:`${convRate.toFixed(2)}%`,          b:vBadge(convRate,prevConvRate)},
                {l:"Clics Enlace", v:clicks.toLocaleString(),            b:vBadge(clicks,prevClks)},
                {l:"CPM",          v:`$${cpm.toFixed(2)}`,               b:vBadge(cpm,prevCpm,true)},
              ].map(({l,v,b})=>(
                <div key={l} style={{border:"1px solid #e5e7eb",borderRadius:8,padding:"11px 12px",background:"#fafafa"}}>
                  <div style={{fontSize:8,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:4}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:800,color:"#111",fontFamily:"monospace",marginBottom:4}}>{v}</div>
                  <div>{b||<span style={{fontSize:8,color:"#ddd"}}>vs período ant.</span>}</div>
                  <div style={{fontSize:7,color:"#ccc",marginTop:2}}>{dateFrom} → {dateTo}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* S2 Charts */}
        {monthlySel.includes("m_charts")&&(account.daily||[]).length>0&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>📈 Gráficos de Evolución</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{border:"1px solid #e5e7eb",borderRadius:7,padding:"12px 10px"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#555",marginBottom:6}}>Inversión & Compras</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={account.daily} margin={{top:4,right:4,bottom:0,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="day" tick={{fontSize:8,fill:"#aaa"}} axisLine={false} tickLine={false}/>
                    <YAxis yAxisId="l" tick={{fontSize:8,fill:"#aaa"}} axisLine={false} tickLine={false} width={36}/>
                    <YAxis yAxisId="r" orientation="right" tick={{fontSize:8,fill:"#aaa"}} axisLine={false} tickLine={false} width={22}/>
                    <Tooltip contentStyle={{fontSize:10}}/>
                    <Line yAxisId="l" type="monotone" dataKey="spend"   stroke="#e8572a" strokeWidth={2} dot={false} name="Inversión"/>
                    <Line yAxisId="r" type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2} dot={false} name="Valor Compras"/>
                  </LineChart>
                </ResponsiveContainer>
                <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:4}}>
                  <span style={{fontSize:8,color:"#e8572a",fontWeight:700}}>● Inversión</span>
                  <span style={{fontSize:8,color:"#4ade80",fontWeight:700}}>● Valor Compras</span>
                </div>
              </div>
              <div style={{border:"1px solid #e5e7eb",borderRadius:7,padding:"12px 10px"}}>
                <div style={{fontSize:10,fontWeight:600,color:"#555",marginBottom:6}}>Evolución ROAS</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={account.daily} margin={{top:4,right:4,bottom:0,left:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="day" tick={{fontSize:8,fill:"#aaa"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:8,fill:"#aaa"}} axisLine={false} tickLine={false} width={24}/>
                    <Tooltip contentStyle={{fontSize:10}}/>
                    <Bar dataKey="roas" fill="#e8572a" opacity={0.85} radius={[3,3,0,0]} name="ROAS"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* S3 Platform */}
        {monthlySel.includes("m_platform")&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>🍩 Ventas por Plataforma</div>
            {(placData.length>0||platData.length>0)?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,border:"1px solid #e5e7eb",borderRadius:7,padding:16}}>
                <DonutChart data={placData} title="Por Placement" size={110}/>
                <DonutChart data={platData} title="Por Plataforma" size={110}/>
              </div>
            ):(
              <div style={{border:"1px solid #e5e7eb",borderRadius:7,padding:16,textAlign:"center",color:"#bbb",fontSize:11}}>Cargá datos comparativos para ver este gráfico</div>
            )}
          </div>
        )}

        {/* S4 Campaigns */}
        {monthlySel.includes("m_campaigns")&&(account.campaigns||[]).length>0&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>🎯 Resultados a Nivel Campañas</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Campaña","Gasto","Compras","ROAS","Conv. Value","LPV"].map(h=><th key={h} style={hs2}>{h}</th>)}</tr></thead>
              <tbody>
                {account.campaigns.map((c,i)=>{
                  const pc=prevCampMap[c.id];
                  const pSp=parseFloat(pc?.spend||0);
                  const pPu=gPurch(pc?.actions);
                  const pRv=gVal(pc?.action_values);
                  const pRo=pSp>0?pRv/pSp:0;
                  return(
                    <tr key={c.id} style={{background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{...cs2,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{c.name}</td>
                      <td style={cs2}><div style={{fontWeight:700}}>${c.spend.toLocaleString()}</div>{vBadge(c.spend,pSp)}</td>
                      <td style={cs2}><div style={{fontWeight:700}}>{c.conversions}</div>{vBadge(c.conversions,pPu)}</td>
                      <td style={{...cs2,color:c.roas>=(goals.roas||3)?"#16a34a":"#dc2626",fontWeight:700}}><div>{c.roas.toFixed(2)}x</div>{vBadge(c.roas,pRo)}</td>
                      <td style={cs2}>${c.revenue.toLocaleString()}</td>
                      <td style={{...cs2,color:"#bbb"}}>—</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* S5 Creatives */}
        {monthlySel.includes("m_creatives")&&(account.creatives||[]).length>0&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>🎨 Resultados a Nivel Creativos</div>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["","Creativo","CTR Único","ROAS","Compras","Gasto"].map(h=><th key={h} style={hs2}>{h}</th>)}</tr></thead>
              <tbody>
                {[...account.creatives].sort((a,b)=>b.roas-a.roas).slice(0,10).map((c,i)=>(
                  <tr key={c.id} style={{background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{...cs2,width:36,padding:4}}>
                      {c.thumbnailUrl?<img src={c.thumbnailUrl} alt="" style={{width:32,height:32,objectFit:"cover",borderRadius:4,display:"block"}}/>:<div style={{width:32,height:32,background:"#f3f4f6",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{c.type==="VIDEO"?"🎬":"📷"}</div>}
                    </td>
                    <td style={{...cs2,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}}>{c.name}</td>
                    <td style={cs2}>{c.ctr.toFixed(2)}%</td>
                    <td style={{...cs2,color:c.roas>=(goals.roas||3)?"#16a34a":"#dc2626",fontWeight:700}}>{c.roas.toFixed(2)}x</td>
                    <td style={cs2}>{c.conversions}</td>
                    <td style={cs2}>${c.spend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* S6 Demographics */}
        {monthlySel.includes("m_demo")&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>👥 Demografía</div>
            {(ageData.length>0||regionData.length>0)?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,border:"1px solid #e5e7eb",borderRadius:7,padding:16}}>
                <DonutChart data={ageData} title="Edades que más compraron" size={110}/>
                <DonutChart data={regionData} title="Ubicaciones por clics" size={110}/>
              </div>
            ):(
              <div style={{border:"1px solid #e5e7eb",borderRadius:7,padding:16,textAlign:"center",color:"#bbb",fontSize:11}}>Cargá datos comparativos para ver demografía</div>
            )}
          </div>
        )}

        {/* S7 Conclusions */}
        {monthlySel.includes("m_conclusions")&&(conclAnalisis||conclTrabajo.some(t=>t.trim())||conclObj.facturacion||conclProximo.some(t=>t.trim()))&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:10,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>📝 Conclusiones</div>
            {conclAnalisis.trim()&&<div style={{marginBottom:10,border:"1px solid #e5e7eb",borderRadius:7,padding:"11px 13px"}}><div style={{fontSize:8,fontWeight:700,color:"#aaa",textTransform:"uppercase",marginBottom:4}}>Análisis Superficial</div><div style={{fontSize:11,color:"#333",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{conclAnalisis}</div></div>}
            {conclTrabajo.some(t=>t.trim())&&<div style={{marginBottom:10,border:"1px solid #e5e7eb",borderRadius:7,padding:"11px 13px"}}><div style={{fontSize:8,fontWeight:700,color:"#aaa",textTransform:"uppercase",marginBottom:6}}>Trabajo Realizado en el Mes</div>{conclTrabajo.filter(t=>t.trim()).map((t,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:3,fontSize:11,color:"#333"}}><span style={{color:"#e8572a",fontWeight:700}}>✓</span><span>{t}</span></div>)}</div>}
            {(conclObj.facturacion||conclObj.roas||conclObj.cpa)&&(
              <div style={{marginBottom:10,border:"1px solid #e5e7eb",borderRadius:7,padding:"11px 13px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{fontSize:8,fontWeight:700,color:"#aaa",textTransform:"uppercase"}}>Objetivo Mensual</div>
                  {objOk&&<span style={{fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:4,background:"#dcfce7",color:"#16a34a",border:"1px solid #bbf7d0"}}>✓ OBJETIVO CUMPLIDO</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[{l:"Facturación",obj:conclObj.facturacion,act:cv.facturacion||0,fmt:v=>`$${parseFloat(v).toLocaleString()}`,inv:false},{l:"ROAS",obj:conclObj.roas,act:roas,fmt:v=>`${parseFloat(v).toFixed(2)}x`,inv:false},{l:"CPA",obj:conclObj.cpa,act:cpa,fmt:v=>`$${parseFloat(v).toFixed(2)}`,inv:true}].filter(x=>x.obj).map(({l,obj,act,fmt,inv})=>{
                    const ok=inv?act<=parseFloat(obj):act>=parseFloat(obj);
                    return <div key={l} style={{border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`,borderRadius:5,padding:"8px 10px",background:ok?"#f0fdf4":"#fef2f2"}}><div style={{fontSize:8,color:"#aaa",marginBottom:3}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:ok?"#15803d":"#dc2626",fontFamily:"monospace"}}>{fmt(act)}</div><div style={{fontSize:8,color:"#aaa",marginTop:2}}>Meta: {fmt(obj)}</div></div>;
                  })}
                </div>
              </div>
            )}
            {conclProximo.some(t=>t.trim())&&<div style={{border:"1px solid #e5e7eb",borderRadius:7,padding:"11px 13px"}}><div style={{fontSize:8,fontWeight:700,color:"#aaa",textTransform:"uppercase",marginBottom:6}}>Acciones Mes Próximo</div>{conclProximo.filter(t=>t.trim()).map((t,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:3,fontSize:11,color:"#333"}}><span style={{color:"#3b82f6",fontWeight:700}}>→</span><span>{t}</span></div>)}</div>}
          </div>
        )}

        {/* Footer */}
        <div style={{borderTop:"1px solid #e5e7eb",marginTop:18,paddingTop:12,display:"flex",justifyContent:"space-between",fontSize:10,color:"#ccc"}}>
          <span>EcomBoost Analytics · Reporte Mensual · Confidencial</span>
          <span>{new Date().toLocaleDateString("es-AR")}</span>
        </div>
      </div>
    );
  }

  const cs = { border:"1px solid #e5e7eb", padding:"7px 10px", fontSize:11, color:"#333" };
  const hs = { ...cs, background:"#f9fafb", fontWeight:700, fontSize:10, color:"#888", textTransform:"uppercase", letterSpacing:"0.05em" };

  function PDFContent() {
    return (
      <div id="pdf-target" style={{ background:"#fff", color:"#111", fontFamily:"Arial,sans-serif", padding:"28px 32px", minWidth:640 }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:"3px solid #e8572a", paddingBottom:14, marginBottom:22 }}>
          <div>
            {account.logo_url && <img src={account.logo_url} alt="logo" style={{height:40,objectFit:"contain",marginBottom:6,display:"block"}}/>}
            <div style={{ fontSize:22, fontWeight:800 }}>
              <span style={{color:"#111"}}>Ecom</span><span style={{color:"#e8572a"}}>Boost</span>
              <span style={{color:"#aaa",fontWeight:400,fontSize:12}}> analytics</span>
            </div>
            <div style={{ fontSize:11, color:"#777", marginTop:3 }}>Reporte de Performance · Meta Ads</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:14, fontWeight:700, color:account.color||"#e8572a" }}>{account.name}</div>
            {account.client_name && <div style={{fontSize:11,color:"#555",marginTop:2}}>{account.client_name}</div>}
            <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{dateFrom} → {dateTo}</div>
            <div style={{ fontSize:10, color:"#bbb", marginTop:1 }}>Generado: {new Date().toLocaleDateString("es-AR")}</div>
          </div>
        </div>

        {/* Resumen ejecutivo */}
        {sel.includes("summary") && (
          <div style={{ background:"#fff8f5", border:"1px solid #fcd5c0", borderRadius:7, padding:"13px 15px", marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#e8572a", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Resumen Ejecutivo</div>
            <div style={{ fontSize:12, color:"#333", lineHeight:1.75 }}>
              Durante el período <b>{dateFrom} al {dateTo}</b>, <b>{account.name}</b> generó <b>${(cv.facturacion||0).toLocaleString()}</b> en facturación con <b>${(cv.inversion||0).toLocaleString()}</b> de inversión,
              alcanzando un ROAS de <b>{(cv.roas||0).toFixed(1)}x</b> ({roasOk?"por encima":"por debajo"} del objetivo de {goals.roas}x).
              Se registraron <b>{cv.conversiones||0} conversiones</b> con un CPA de <b>${(cv.costoCompra||0).toFixed(2)}</b>.
              El embudo generó <b>{fN(cr.impresiones||0,"k")}</b> impresiones con un CTR único de <b>{cr.ctrUnico||0}%</b>,
              derivando en <b>{ac.pagosIniciados||0} pagos iniciados</b>.
              Ganancia estimada: <b>${profit.toLocaleString()}</b> (ROI: {roi}%).
            </div>
            {note && <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid #fcd5c0", fontSize:11, color:"#555", fontStyle:"italic" }}><b style={{color:"#e8572a",fontStyle:"normal"}}>Nota: </b>{note}</div>}
          </div>
        )}

        {/* Resumen personalizado */}
        {sel.includes("custom_summary") && customSummary.trim() && (
          <div style={{ background:"#fff8f5", border:"1px solid #fcd5c0", borderRadius:7, padding:"13px 15px", marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#e8572a", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Resumen Personalizado</div>
            <div style={{ fontSize:12, color:"#333", lineHeight:1.75, whiteSpace:"pre-wrap" }}>{customSummary}</div>
          </div>
        )}

        {/* Estado de objetivos */}
        {sel.includes("goals") && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Estado de Objetivos</div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:7, overflow:"hidden" }}>
              {[
                { l:"ROAS",      a:`${(cv.roas||0).toFixed(1)}x`,         o:`${goals.roas}x`,  ok:roasOk },
                { l:"CPA",       a:`$${(cv.costoCompra||0).toFixed(2)}`,   o:`$${goals.cpa}`,  ok:cpaOk  },
                { l:"CTR Único", a:`${cr.ctrUnico||0}%`,                   o:`${goals.ctr}%`,  ok:ctrOk  },
              ].map(({l,a,o,ok},i)=>(
                <div key={l} style={{ display:"flex", alignItems:"center", padding:"10px 13px", borderBottom:i<2?"1px solid #f3f4f6":"none", background:i%2===0?"#fafafa":"#fff" }}>
                  <div style={{ width:16, height:16, borderRadius:"50%", background:ok?"#16a34a":"#dc2626", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, marginRight:10, flexShrink:0 }}>{ok?"✓":"✗"}</div>
                  <div style={{ flex:1, fontSize:12, color:"#333" }}>{l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:ok?"#16a34a":"#dc2626", marginRight:12 }}>{a}</div>
                  <div style={{ fontSize:11, color:"#aaa" }}>Meta: {o}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPIs */}
        {sel.includes("kpis") && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Métricas Principales</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9 }}>
              {[
                { l:"ROAS",        v:`${(cv.roas||0).toFixed(1)}x`,               ok:roasOk },
                { l:"CPA",         v:`$${(cv.costoCompra||0).toFixed(2)}`,         ok:cpaOk  },
                { l:"CTR Único",   v:`${cr.ctrUnico||0}%`,                         ok:ctrOk  },
                { l:"Facturación", v:`$${(cv.facturacion||0).toLocaleString()}`,    ok:true   },
                { l:"Inversión",   v:`$${(cv.inversion||0).toLocaleString()}`,      ok:true   },
                { l:"Conversiones",v:cv.conversiones||0,                            ok:true   },
              ].map(({l,v,ok})=>(
                <div key={l} style={{ border:`1px solid ${ok?"#bbf7d0":"#fecaca"}`, borderRadius:7, padding:"10px 12px", background:ok?"#f0fdf4":"#fef2f2" }}>
                  <div style={{ fontSize:9, color:"#999", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:ok?"#15803d":"#dc2626", fontFamily:"monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embudo */}
        {sel.includes("funnel") && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Métricas del Embudo</div>
            {[
              { title:"1ª Fase: CREATIVOS",          color:"#1a56db", items:[{l:"Alcance",v:fN(cr.alcance||0,"k")},{l:"Impresiones",v:fN(cr.impresiones||0,"k")},{l:"CTR Único",v:`${cr.ctrUnico||0}%`},{l:"Clics enlace",v:fN(cr.clicsEnlace||0,"k")},{l:"CPM",v:`$${(cr.cpm||0).toLocaleString()}`}] },
              { title:"2ª Fase: ACCIONES EN TIENDA", color:"#d97706", items:[{l:"Add to Cart",v:(ac.addToCart||0).toLocaleString()},{l:"Pagos iniciados",v:(ac.pagosIniciados||0).toLocaleString()},{l:"Costo pago inic.",v:`$${(ac.costoPagosIniciados||0).toLocaleString()}`}] },
              { title:"3ª Fase: CONVERSIÓN",         color:"#dc2626", items:[{l:"Inversión",v:`$${(cv.inversion||0).toLocaleString()}`},{l:"Facturación",v:`$${(cv.facturacion||0).toLocaleString()}`},{l:"Costo x compra",v:`$${(cv.costoCompra||0).toFixed(2)}`},{l:"ROAS",v:`${(cv.roas||0).toFixed(1)}x`}] },
            ].map(({title,color,items})=>(
              <div key={title} style={{ marginBottom:9 }}>
                <div style={{ background:color, borderRadius:5, padding:"5px 12px", marginBottom:7 }}><span style={{ fontSize:10, fontWeight:700, color:"#fff" }}>{title}</span></div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:6 }}>
                  {items.map(({l,v})=>(
                    <div key={l} style={{ border:"1px solid #e5e7eb", borderRadius:5, padding:"8px 10px" }}>
                      <div style={{ fontSize:9, color:"#aaa", textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:"#111", fontFamily:"monospace" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gráfico ROAS */}
        {sel.includes("chart_roas") && account.daily?.length > 0 && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Evolución del ROAS</div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:7, padding:12 }}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={account.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="day" tick={{fontSize:10,fill:"#888"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:"#888"}} axisLine={false} tickLine={false} width={28}/>
                  <Tooltip/>
                  <Line type="monotone" dataKey="roas" stroke="#e8572a" strokeWidth={2.5} dot={{fill:"#e8572a",r:3}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gráfico Revenue vs Gasto */}
        {sel.includes("chart_rev") && account.daily?.length > 0 && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Revenue vs Gasto Diario</div>
            <div style={{ border:"1px solid #e5e7eb", borderRadius:7, padding:12 }}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={account.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="day" tick={{fontSize:10,fill:"#888"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:"#888"}} axisLine={false} tickLine={false} width={36}/>
                  <Tooltip/>
                  <Bar dataKey="revenue" fill="#e8572a" opacity={0.85} radius={[3,3,0,0]} name="Revenue"/>
                  <Bar dataKey="spend"   fill="#3b82f6" opacity={0.7}  radius={[3,3,0,0]} name="Gasto"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top creativos */}
        {sel.includes("creativos") && topCr.length > 0 && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Top Creativos por ROAS</div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["#","Creativo","Tipo","Hook Rate","ROAS","CPA","CTR","Conv."].map(h=><th key={h} style={hs}>{h}</th>)}</tr></thead>
              <tbody>
                {topCr.map((c,i)=>(
                  <tr key={c.id} style={{background:i===0?"#fff8f5":i%2===0?"#fff":"#fafafa"}}>
                    <td style={{...cs,fontWeight:700,color:i===0?"#e8572a":"#888"}}>{i===0?"★":i+1}</td>
                    <td style={{...cs,fontWeight:500,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</td>
                    <td style={cs}><span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:c.type==="VIDEO"?"#ede9fe":"#dcfce7",color:c.type==="VIDEO"?"#7c3aed":"#15803d",fontWeight:700}}>{c.type}</span></td>
                    <td style={{...cs,color:c.hookRate>=40?"#15803d":c.hookRate>=25?"#92400e":"#dc2626",fontWeight:700}}>{c.hookRate.toFixed(1)}%</td>
                    <td style={{...cs,color:c.roas>=goals.roas?"#16a34a":"#dc2626",fontWeight:700}}>{c.roas.toFixed(1)}x</td>
                    <td style={{...cs,color:c.cpa<=goals.cpa?"#16a34a":"#dc2626",fontWeight:700}}>${c.cpa.toFixed(1)}</td>
                    <td style={{...cs,color:c.ctr>=goals.ctr?"#16a34a":"#dc2626",fontWeight:700}}>{c.ctr.toFixed(1)}%</td>
                    <td style={cs}>{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Campañas */}
        {sel.includes("campaigns") && account.campaigns?.length > 0 && (
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Performance por Campaña</div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Campaña","Gasto","Revenue","ROAS","CPA","CTR","Conv."].map(h=><th key={h} style={hs}>{h}</th>)}</tr></thead>
              <tbody>
                {account.campaigns.filter(c=>c.status==="ACTIVE").map((c,i)=>(
                  <tr key={c.id} style={{background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{...cs,fontWeight:500}}>{c.name}</td>
                    <td style={cs}>${c.spend.toLocaleString()}</td>
                    <td style={cs}>${c.revenue.toLocaleString()}</td>
                    <td style={{...cs,color:c.roas>=goals.roas?"#16a34a":"#dc2626",fontWeight:700}}>{c.roas.toFixed(1)}x</td>
                    <td style={{...cs,color:c.cpa<=goals.cpa?"#16a34a":"#dc2626",fontWeight:700}}>${c.cpa.toFixed(1)}</td>
                    <td style={{...cs,color:c.ctr>=goals.ctr?"#16a34a":"#dc2626",fontWeight:700}}>{c.ctr.toFixed(1)}%</td>
                    <td style={cs}>{c.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Alcance y frecuencia */}
        {sel.includes("reach") && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Alcance y Frecuencia</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
              {[
                {l:"Impresiones", v:fN(cr.impresiones||0,"k")},
                {l:"Alcance",     v:fN(cr.alcance||0,"k")},
                {l:"CPM",         v:`$${(cr.cpm||0).toLocaleString()}`},
                {l:"Clics enlace",v:fN(cr.clicsEnlace||0,"k")},
              ].map(({l,v})=>(
                <div key={l} style={{ border:"1px solid #e5e7eb", borderRadius:6, padding:"9px 11px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"#aaa", textTransform:"uppercase", marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#111", fontFamily:"monospace" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop:"1px solid #e5e7eb", marginTop:18, paddingTop:12, display:"flex", justifyContent:"space-between", fontSize:10, color:"#ccc" }}>
          <span>EcomBoost Analytics · Confidencial</span>
          <span>{new Date().toLocaleDateString("es-AR")}</span>
        </div>
      </div>
    );
  }

  // ─── Saved Reports Logic ─────────────────────────────────────────────────────

  // Load on mount + save-on-unmount
  useEffect(()=>{
    reportStore.loadReports().then(setSavedReports).catch(()=>{});
    return ()=>{
      clearTimeout(autosaveTimerRef.current);
      if(activeIdRef.current&&buildConfigRef.current)
        reportStore.updateReport(activeIdRef.current,buildConfigRef.current()).catch(()=>{});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Autosave with 1s debounce
  useEffect(()=>{
    if(skipAutosaveRef.current||!activeIdRef.current)return;
    setSaveStatus("saving");
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current=setTimeout(async()=>{
      try{
        await reportStore.updateReport(activeIdRef.current,buildConfigRef.current());
        setSavedReports(await reportStore.loadReports());
        setSaveStatus("saved");
      }catch{setSaveStatus("idle");}
    },1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sel,monthlySel,reportMode,note,customSummary,conclAnalisis,conclTrabajo,conclProximo,conclObj,dateFrom,dateTo]);

  function buildConfig(){ return buildConfigRef.current(); }

  function applyConfig(c){
    skipAutosaveRef.current=true;
    if(c.sel)setSel(c.sel);
    if(c.monthlySel)setMonthlySel(c.monthlySel);
    if(c.reportMode)setReportMode(c.reportMode);
    if(c.note!==undefined)setNote(c.note);
    if(c.customSummary!==undefined)setCustomSummary(c.customSummary);
    if(c.conclAnalisis!==undefined)setConclAnalisis(c.conclAnalisis);
    if(c.conclTrabajo)setConclTrabajo(c.conclTrabajo);
    if(c.conclProximo)setConclProximo(c.conclProximo);
    if(c.conclObj)setConclObj(c.conclObj);
    if(c.dateFrom&&c.dateTo)onDateRangeChange?.({preset:"custom",from:c.dateFrom,to:c.dateTo});
    setTimeout(()=>{ skipAutosaveRef.current=false; },200);
  }

  async function handleSave(){
    if(!activeIdRef.current)return;
    setSaveStatus("saving");
    clearTimeout(autosaveTimerRef.current);
    try{
      await reportStore.updateReport(activeIdRef.current,buildConfig());
      setSavedReports(await reportStore.loadReports());
      setSaveStatus("saved");
    }catch{ setSaveStatus("idle"); toast("Error al guardar","error"); }
  }

  async function handleConfirmCreate(){
    const name=nameInput.trim();
    if(!name){setNameError("El nombre es obligatorio");return;}
    let finalName=name;
    if(savedReports.some(r=>r.name===finalName)){
      let n=2;
      while(savedReports.some(r=>r.name===`${name} (${n})`))n++;
      finalName=`${name} (${n})`;
    }
    try{
      const r=await reportStore.createReport(finalName,buildConfig());
      setSavedReports(await reportStore.loadReports());
      setActiveReportId(r.id);
      setActiveReportName(r.name);
      setSaveStatus("saved");
      setShowNameModal(false);
      setNameInput("");
    }catch(e){
      if(e?.name==="QuotaExceededError")toast("Almacenamiento lleno. Eliminá reportes para continuar.","error");
      else toast("Error al crear el reporte","error");
    }
  }

  async function handleOpenReport(r){
    applyConfig(r.config||{});
    setActiveReportId(r.id);
    setActiveReportName(r.name);
    setSaveStatus("saved");
  }

  async function handleDuplicate(id){
    try{
      await reportStore.duplicateReport(id);
      setSavedReports(await reportStore.loadReports());
      toast("Reporte duplicado");
    }catch{ toast("Error al duplicar","error"); }
  }

  async function handleDelete(id){
    await reportStore.deleteReport(id);
    if(activeIdRef.current===id){setActiveReportId(null);setActiveReportName("");setSaveStatus("idle");}
    setSavedReports(await reportStore.loadReports());
    setDeleteConfirmId(null);
    toast("Reporte eliminado","warn");
  }

  async function handleRenameConfirm(){
    const name=renameInput.trim();
    if(!name){setRenameId(null);return;}
    try{
      await reportStore.renameReport(renameId,name);
      if(activeIdRef.current===renameId)setActiveReportName(name);
      setSavedReports(await reportStore.loadReports());
      setRenameId(null);
    }catch{ toast("Error al renombrar","error"); }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{position:"relative",display:"flex",height:"calc(100vh - 56px)",overflow:"hidden",fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* ── Name modal ── */}
      {showNameModal&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:12,padding:24,width:340,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:4}}>Nombre del reporte</div>
            <div style={{fontSize:12,color:T.textMuted,marginBottom:16}}>Elegí un nombre para identificarlo</div>
            <input
              autoFocus
              value={nameInput}
              onChange={e=>{setNameInput(e.target.value);setNameError("");}}
              onKeyDown={e=>{if(e.key==="Enter")handleConfirmCreate();if(e.key==="Escape")setShowNameModal(false);}}
              placeholder="Ej: Reporte Junio 2026"
              style={{width:"100%",background:T.bg2,border:`1px solid ${nameError?"#f87171":T.border2}`,borderRadius:8,color:T.text,padding:"10px 12px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:nameError?6:16}}
            />
            {nameError&&<div style={{fontSize:11,color:"#f87171",marginBottom:16}}>{nameError}</div>}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowNameModal(false)} style={{flex:1,padding:"10px 0",background:"none",border:`1px solid ${T.border2}`,borderRadius:8,color:T.textSub,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancelar</button>
              <button onClick={handleConfirmCreate} style={{flex:1,padding:"10px 0",background:"#e8572a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirmId&&(
        <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.72)",zIndex:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:12,padding:24,width:320,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text,marginBottom:8}}>¿Eliminar reporte?</div>
            <div style={{fontSize:13,color:T.textMuted,marginBottom:20}}>
              El reporte <b style={{color:T.text}}>"{savedReports.find(r=>r.id===deleteConfirmId)?.name}"</b> se eliminará permanentemente.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setDeleteConfirmId(null)} style={{flex:1,padding:"10px 0",background:"none",border:`1px solid ${T.border2}`,borderRadius:8,color:T.textSub,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancelar</button>
              <button onClick={()=>handleDelete(deleteConfirmId)} style={{flex:1,padding:"10px 0",background:"#dc2626",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved reports sidebar ── */}
      <div style={{width:220,background:T.bg1,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 12px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div style={{fontSize:12,fontWeight:700,color:T.text,whiteSpace:"nowrap"}}>Reportes guardados</div>
          <button
            onClick={()=>{setNameInput("");setNameError("");setShowNameModal(true);}}
            style={{padding:"4px 10px",background:"#e8572a",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"inherit",flexShrink:0}}
          >+ Nuevo</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:8}}>
          {savedReports.length===0?(
            <div style={{padding:"28px 12px",textAlign:"center",color:T.textFaint,fontSize:11,lineHeight:1.6}}>
              <div style={{fontSize:22,marginBottom:8,opacity:0.3}}>📄</div>
              Creá tu primer reporte con "+ Nuevo"
            </div>
          ):savedReports.map(r=>{
            const isActive=r.id===activeReportId;
            return(
              <div key={r.id} style={{borderRadius:8,border:`1px solid ${isActive?"#e8572a55":T.border}`,background:isActive?"#e8572a08":T.bg2,marginBottom:6,overflow:"hidden",transition:"border-color .15s"}}>
                {renameId===r.id?(
                  <div style={{padding:"8px 10px"}}>
                    <input
                      autoFocus
                      value={renameInput}
                      onChange={e=>setRenameInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter")handleRenameConfirm();if(e.key==="Escape")setRenameId(null);}}
                      onBlur={handleRenameConfirm}
                      style={{width:"100%",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:5,color:T.text,padding:"5px 8px",fontSize:12,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
                    />
                  </div>
                ):(
                  <div onClick={()=>handleOpenReport(r)} style={{padding:"8px 10px 4px",cursor:"pointer"}}>
                    <div style={{fontSize:12,fontWeight:600,color:isActive?"#e8572a":T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                    <div style={{fontSize:9,color:T.textFaint,marginTop:2}}>
                      {new Date(r.updated_at).toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",borderTop:`1px solid ${T.border}`,padding:"2px 4px",gap:0}}>
                  <button title="Abrir" onClick={()=>handleOpenReport(r)} style={{flex:1,background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:10,padding:"4px 0",fontFamily:"inherit"}}>Abrir</button>
                  <button title="Renombrar" onClick={e=>{e.stopPropagation();setRenameId(r.id);setRenameInput(r.name);}} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:12,padding:"4px 6px",lineHeight:1}}>✏</button>
                  <button title="Duplicar" onClick={e=>{e.stopPropagation();handleDuplicate(r.id);}} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:12,padding:"4px 6px",lineHeight:1}}>⧉</button>
                  <button title="Eliminar" onClick={e=>{e.stopPropagation();setDeleteConfirmId(r.id);}} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:12,padding:"4px 6px",lineHeight:1}}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Left panel (config) ── */}
      <div style={{width:280,background:T.bg1,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
        <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeReportName||"Constructor de Reporte"}</div>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
            <div style={{fontSize:10,color:T.textMuted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{account.name} · PDF a medida</div>
            {activeReportId&&<span style={{fontSize:9,fontWeight:600,flexShrink:0,color:saveStatus==="saving"?"#f59e0b":saveStatus==="saved"?"#4ade80":T.textFaint}}>
              {saveStatus==="saving"?"Guardando...":saveStatus==="saved"?"Guardado ✓":""}
            </span>}
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 12px"}}>
          {/* Date range (shared) */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>Período</div>
            <div style={{display:"flex",gap:8}}>
              {[["Desde",dateFrom,setDateFrom],["Hasta",dateTo,setDateTo]].map(([l,v,sv])=>(
                <div key={l} style={{flex:1}}>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>{l}</div>
                  <input type="date" value={v} onChange={e=>sv(e.target.value)} style={{width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:6,color:T.text,padding:"6px 8px",fontSize:11,boxSizing:"border-box",outline:"none"}}/>
                </div>
              ))}
            </div>
          </div>
          {/* Load comparison data */}
          <div style={{marginBottom:14}}>
            <button onClick={fetchMonthlyData} disabled={monthlyLoading||!account.meta_token} style={{width:"100%",padding:"9px 0",background:account.meta_token?"#3b82f622":"#1a1a2200",border:`1px solid ${account.meta_token?"#3b82f644":T.border2}`,borderRadius:7,color:account.meta_token?"#60a5fa":T.textFaint,cursor:account.meta_token?"pointer":"not-allowed",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
              {monthlyLoading?"⏳ Cargando...":monthlyData?"↻ Actualizar datos comparativos":"⬇ Cargar datos comparativos"}
            </button>
            {monthlyData&&<div style={{fontSize:10,color:T.ok.text,marginTop:4,textAlign:"center"}}>✓ Datos cargados</div>}
            {!account.meta_token&&<div style={{fontSize:10,color:T.textFaint,marginTop:4,textAlign:"center"}}>Conectá Meta API en Ajustes</div>}
          </div>
          {/* Sections */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7}}>Secciones del reporte</div>
            {MONTHLY_BLOCKS.map(b=>{
              const on=monthlySel.includes(b.id);
              return (
                <div key={b.id} onClick={()=>setMonthlySel(s=>s.includes(b.id)?s.filter(x=>x!==b.id):[...s,b.id])} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:7,border:`1px solid ${on?"#a78bfa40":T.border}`,background:on?"#a78bfa0d":T.bg2,cursor:"pointer",marginBottom:4}}>
                  <div style={{width:13,height:13,borderRadius:3,border:`1.5px solid ${on?"#a78bfa":T.border2}`,background:on?"#a78bfa":"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:8,color:"#fff"}}>{on?"✓":""}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:on?600:400,color:on?T.text:T.textMuted}}>{b.label}</div>
                    <div style={{fontSize:9,color:T.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Conclusiones editor */}
          {monthlySel.includes("m_conclusions")&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Conclusiones</div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Análisis superficial</div>
                <textarea value={conclAnalisis} onChange={e=>setConclAnalisis(e.target.value)} placeholder="Escribe el análisis del mes..." style={{width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:6,color:T.text,padding:"7px 9px",fontSize:11,minHeight:72,resize:"vertical",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Trabajo realizado en el mes</div>
                {conclTrabajo.map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:4,marginBottom:4}}>
                    <input value={t} onChange={e=>{const n=[...conclTrabajo];n[i]=e.target.value;setConclTrabajo(n);}} placeholder={`Ítem ${i+1}...`} style={{flex:1,background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:5,color:T.text,padding:"5px 8px",fontSize:11,outline:"none",fontFamily:"inherit"}}/>
                    <button onClick={()=>setConclTrabajo(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:`1px solid ${T.border2}`,borderRadius:5,color:"#f87171",cursor:"pointer",padding:"0 7px",fontSize:13}}>✕</button>
                  </div>
                ))}
                <button onClick={()=>setConclTrabajo(p=>[...p,""])} style={{width:"100%",padding:"5px 0",background:"none",border:`1px dashed ${T.border2}`,borderRadius:5,color:T.textDim,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>+ Agregar ítem</button>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Objetivo mensual</div>
                {[["facturacion","Facturación $"],["roas","ROAS x"],["cpa","CPA $"]].map(([k,l])=>(
                  <div key={k} style={{marginBottom:6}}>
                    <div style={{fontSize:9,color:T.textFaint,marginBottom:2}}>{l}</div>
                    <input type="number" value={conclObj[k]} onChange={e=>setConclObj(p=>({...p,[k]:e.target.value}))} style={{width:"100%",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:5,color:T.text,padding:"5px 8px",fontSize:11,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:10,color:T.textDim,marginBottom:4}}>Acciones mes próximo</div>
                {conclProximo.map((t,i)=>(
                  <div key={i} style={{display:"flex",gap:4,marginBottom:4}}>
                    <input value={t} onChange={e=>{const n=[...conclProximo];n[i]=e.target.value;setConclProximo(n);}} placeholder={`Acción ${i+1}...`} style={{flex:1,background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:5,color:T.text,padding:"5px 8px",fontSize:11,outline:"none",fontFamily:"inherit"}}/>
                    <button onClick={()=>setConclProximo(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:`1px solid ${T.border2}`,borderRadius:5,color:"#f87171",cursor:"pointer",padding:"0 7px",fontSize:13}}>✕</button>
                  </div>
                ))}
                <button onClick={()=>setConclProximo(p=>[...p,""])} style={{width:"100%",padding:"5px 0",background:"none",border:`1px dashed ${T.border2}`,borderRadius:5,color:T.textDim,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>+ Agregar acción</button>
              </div>
            </div>
          )}
        </div>
        <div style={{padding:10,borderTop:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:8}}>
          {activeReportId
            ?<button onClick={handleSave} disabled={saveStatus==="saving"} style={{padding:"8px 0",background:"#e8572a11",border:`1px solid #e8572a44`,borderRadius:7,color:"#e8572a",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit",opacity:saveStatus==="saving"?0.6:1}}>
               {saveStatus==="saving"?"Guardando...":"Guardar"}
             </button>
            :<button onClick={()=>{setNameInput("");setNameError("");setShowNameModal(true);}} style={{padding:"8px 0",background:"#e8572a11",border:`1px solid #e8572a44`,borderRadius:7,color:"#e8572a",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>
               + Crear reporte
             </button>
          }
          <button onClick={()=>setMPreview(p=>!p)} style={{padding:"8px 0",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
            {mPreview?"◂ Ocultar preview":"▸ Ver preview"}
          </button>
          <button onClick={generateMonthlyPDF} disabled={mGenerating||monthlySel.length===0} style={{padding:"11px 0",background:monthlySel.length===0?T.bg2:"#a78bfa",border:"none",borderRadius:7,color:monthlySel.length===0?T.textFaint:"#fff",cursor:monthlySel.length===0?"not-allowed":"pointer",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit"}}>
            {mGenerating?"⏳ Generando PDF...":"⬇ Descargar Reporte Mensual"}
          </button>
        </div>
      </div>

      {/* ── Right: preview ── */}
      <div style={{flex:1,overflowY:"auto",padding:24,background:T.bg,display:"flex",flexDirection:"column",alignItems:"center"}}>
        {!mPreview
          ? <div style={{color:T.textFaint,marginTop:80,textAlign:"center"}}><div style={{fontSize:32,marginBottom:12,opacity:0.2}}>⊟</div><div style={{fontSize:13}}>Hacé clic en "Ver preview" para previsualizar el reporte</div></div>
          : <div style={{maxWidth:740,width:"100%",boxShadow:"0 0 50px rgba(0,0,0,0.3)",borderRadius:4}}><MonthlyPDFContent/></div>
        }
      </div>
    </div>
  );
}

// ─── CLIENT PORTAL ───────────────────────────────────────────────────────────
function ClientPortal({account, tasks, currentUser, toast}) {
  const T = useT();
  if (!account) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
      <div style={{fontSize:40}}>📊</div>
      <div style={{fontSize:18,fontWeight:700,color:T.text}}>Bienvenido, {currentUser?.name||"cliente"}</div>
      <div style={{fontSize:13,color:T.textMuted}}>No tenés cuentas asignadas aún.</div>
    </div>
  );

  const accTasks = tasks.filter(t=>t.account_id===account.id);
  const doneCount = accTasks.filter(t=>t.status==="done").length;
  const progressCount = accTasks.filter(t=>t.status==="inprogress").length;

  return (
    <div style={{padding:"24px 28px",maxWidth:800}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,background:T.bg1,border:`1px solid ${T.border}`,borderRadius:14,padding:"18px 20px"}}>
        {account.logo_url ? <img src={account.logo_url} alt="logo" style={{width:52,height:52,objectFit:"contain",borderRadius:10,border:`1px solid ${T.border}`}}/> : <div style={{width:52,height:52,borderRadius:10,background:"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:20}}>{account.name?.[0]||"?"}</div>}
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:18,color:T.text}}>{account.name}</div>
          <div style={{fontSize:13,color:T.textMuted}}>Portal del cliente</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          {label:"Inversión",val:`$${(account.spend||0).toLocaleString("es-AR")}`,color:"#e8572a"},
          {label:"Ingresos",val:`$${(account.revenue||0).toLocaleString("es-AR")}`,color:T.ok.text},
          {label:"ROAS",val:`${(account.roas||0).toFixed(2)}x`,color:"#60a5fa"},
          {label:"Conversiones",val:account.conversions||0,color:"#a78bfa"},
        ].map(m=>(
          <div key={m.label} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:m.color}}>{m.val}</div>
          </div>
        ))}
      </div>
      <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"18px 20px",marginBottom:16}}>
        <div style={{fontWeight:600,color:T.textSub,marginBottom:14,fontSize:13}}>Estado de tareas</div>
        <div style={{display:"flex",gap:16,marginBottom:14}}>
          <div style={{flex:1,background:T.ok.bg,border:`1px solid ${T.ok.border}`,borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:T.ok.text}}>{doneCount}</div>
            <div style={{fontSize:11,color:T.ok.text}}>Completadas</div>
          </div>
          <div style={{flex:1,background:T.warn.bg,border:`1px solid ${T.warn.border}`,borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:T.warn.text}}>{progressCount}</div>
            <div style={{fontSize:11,color:T.warn.text}}>En progreso</div>
          </div>
          <div style={{flex:1,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:T.textSub}}>{accTasks.length-doneCount-progressCount}</div>
            <div style={{fontSize:11,color:T.textMuted}}>Pendientes</div>
          </div>
        </div>
        {accTasks.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${T.divider}`}}>
            <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:t.status==="done"?T.ok.bg:t.status==="inprogress"?T.warn.bg:T.bg2,color:t.status==="done"?T.ok.text:t.status==="inprogress"?T.warn.text:T.textDim,fontWeight:600,whiteSpace:"nowrap"}}>{t.status==="done"?"✓ Hecho":t.status==="inprogress"?"● En progreso":"○ Pendiente"}</span>
            <span style={{fontSize:13,color:T.text,flex:1}}>{t.title}</span>
            {t.priority==="high"&&<span style={{fontSize:10,color:T.bad.text,background:T.bad.bg,padding:"1px 6px",borderRadius:10}}>Alta</span>}
          </div>
        ))}
        {accTasks.length===0&&<div style={{textAlign:"center",padding:20,color:T.textFaint,fontSize:13}}>Sin tareas asignadas.</div>}
      </div>
    </div>
  );
}

// ─── RENTABILIDAD MODULE ─────────────────────────────────────────────────────
function RentabilidadModule({ account }) {
  const T = useT();
  const accountId = account?.id || "global";
  const LS = `eb_profit_v2_${accountId}`;
  const load = () => { try { return JSON.parse(localStorage.getItem(LS)||"{}"); } catch { return {}; } };
  const s = useMemo(load, [LS]);

  // A — Costos Variables (%)
  const [cogs,    setCogs]    = useState(s.cogs    ?? "");
  const [envio,   setEnvio]   = useState(s.envio   ?? "");
  const [transac, setTransac] = useState(s.transac ?? "");
  const [ingBrut, setIngBrut] = useState(s.ingBrut ?? "");
  const [devoluc, setDevoluc] = useState(s.devoluc ?? "");
  const [agencia, setAgencia] = useState(s.agencia ?? "");
  const [otrosV,  setOtrosV]  = useState(s.otrosV  ?? "");

  // B — Costos Fijos ($)
  const [empls,  setEmpls]  = useState(s.empls  ?? "");
  const [provs,  setProvs]  = useState(s.provs  ?? "");
  const [herrs,  setHerrs]  = useState(s.herrs  ?? "");
  const [logis,  setLogis]  = useState(s.logis  ?? "");
  const [otrosF, setOtrosF] = useState(s.otrosF ?? "");

  // D — Simulator axes
  const [invRows,  setInvRows]  = useState(s.invRows  ?? [1000000,1500000,2000000,2500000,3000000]);
  const [roasCols, setRoasCols] = useState(s.roasCols ?? [5,6,7,8,9,10,11,12,13,14]);

  // E — P&G
  const [pgInv,  setPgInv]  = useState(s.pgInv  ?? "");
  const [pgRoas, setPgRoas] = useState(s.pgRoas ?? "");

  // Persist
  useEffect(() => {
    try { localStorage.setItem(LS, JSON.stringify({cogs,envio,transac,ingBrut,devoluc,agencia,otrosV,empls,provs,herrs,logis,otrosF,invRows,roasCols,pgInv,pgRoas})); } catch {}
  }, [cogs,envio,transac,ingBrut,devoluc,agencia,otrosV,empls,provs,herrs,logis,otrosF,invRows,roasCols,pgInv,pgRoas]);

  const p    = v => parseFloat(v)||0;
  const fmt$ = v => `$${Math.round(v).toLocaleString("es-AR")}`;
  const fmtP = v => `${Number(v).toFixed(2)}%`;

  // Derived calculations
  const cvTotal      = [p(cogs),p(envio),p(transac),p(ingBrut),p(devoluc),p(agencia),p(otrosV)].reduce((a,b)=>a+b,0);
  const margenBrutoP = 100 - cvTotal;
  const beRoas       = cvTotal < 100 ? 100 / (100 - cvTotal) : Infinity;
  const cfTotal      = p(empls)+p(provs)+p(herrs)+p(logis)+p(otrosF);
  const ebitdaCalc   = (inv, roas) => inv * roas * (1 - cvTotal/100) - inv - cfTotal;

  // P&G
  const pgI = p(pgInv); const pgR = p(pgRoas);
  const pgIngresos    = pgI * pgR;
  const pgDev         = pgIngresos * p(devoluc)/100;
  const pgProd        = pgIngresos * p(cogs)/100;
  const pgEnvios      = pgIngresos * p(envio)/100;
  const pgUtilBruta   = pgIngresos - pgDev - pgProd - pgEnvios;
  const pgTransac     = pgIngresos * p(transac)/100;
  const pgIngBrut     = pgIngresos * p(ingBrut)/100;
  const pgAgencia     = pgIngresos * p(agencia)/100;
  const pgOtrosV      = pgIngresos * p(otrosV)/100;
  const pgMargenContr = pgUtilBruta - pgI - pgTransac - pgIngBrut - pgAgencia - pgOtrosV;
  const pgEbitda      = pgMargenContr - cfTotal;
  const pgCostTot     = pgDev+pgProd+pgEnvios+pgI+pgTransac+pgIngBrut+pgAgencia+pgOtrosV+cfTotal;

  // Styles
  const card = {background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 22px",marginBottom:20};
  const stit = {fontSize:13,fontWeight:700,color:T.text,marginBottom:16,display:"flex",alignItems:"center",gap:8};
  const lbl  = {fontSize:11,color:T.textDim,marginBottom:5};
  const inp  = {width:"100%",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:7,color:T.text,padding:"8px 11px 8px 11px",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"};

  function CalcRow({label,value,bold,color}) {
    return (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderTop:`1px solid ${T.border}`}}>
        <span style={{fontSize:12,color:bold?T.text:T.textMuted,fontWeight:bold?600:400}}>{label}</span>
        <span style={{fontSize:bold?14:13,fontWeight:bold?700:500,fontFamily:"monospace",color:color||T.textSub}}>{value}</span>
      </div>
    );
  }

  function Field({label, value, onChange, suffix="%"}) {
    return (
      <div>
        <div style={lbl}>{label}</div>
        <div style={{position:"relative"}}>
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={e => {
              // Permitir solo números, punto y coma decimal
              const v = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
              onChange(v);
            }}
            onBlur={e => {
              // Al salir, limpiar punto/coma colgante
              const v = e.target.value.replace(",", ".");
              const n = parseFloat(v);
              if (!isNaN(n)) onChange(String(n));
            }}
            style={{...inp, paddingRight:32}}
            placeholder="0"
          />
          <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:11,color:T.textFaint,pointerEvents:"none"}}>{suffix}</span>
        </div>
      </div>
    );
  }

  const r2 = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12};

  return (
    <div style={{padding:"20px 24px",maxWidth:1100,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{marginBottom:22}}>
        <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:4}}>Calculadora de Rentabilidad</div>
        <div style={{fontSize:12,color:T.textMuted}}>Modelá tu estructura de costos y proyectá el EBITDA de tu negocio</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* A — Costos Variables */}
        <div style={card}>
          <div style={stit}>📉 A — Costos Variables</div>
          <div style={r2}>
            <Field label="Costo de producción (COGS)" value={cogs}    onChange={setCogs}/>
            <Field label="Costo de envío"              value={envio}   onChange={setEnvio}/>
          </div>
          <div style={r2}>
            <Field label="Costo de transacciones"      value={transac} onChange={setTransac}/>
            <Field label="Ingresos Brutos"             value={ingBrut} onChange={setIngBrut}/>
          </div>
          <div style={r2}>
            <Field label="Costo de devoluciones"       value={devoluc} onChange={setDevoluc}/>
            <Field label="Agencia de Marketing"        value={agencia} onChange={setAgencia}/>
          </div>
          <div style={{marginBottom:14}}><Field label="Otros" value={otrosV} onChange={setOtrosV}/></div>
          <CalcRow label="Costos Variables Totales" value={fmtP(cvTotal)}      bold color={cvTotal>80?"#f87171":cvTotal>60?"#f59e0b":T.textSub}/>
          <CalcRow label="% Margen Bruto"           value={fmtP(margenBrutoP)} bold color={margenBrutoP<0?"#f87171":margenBrutoP<20?"#f59e0b":"#4ade80"}/>
        </div>

        {/* B + C */}
        <div>
          <div style={card}>
            <div style={stit}>🏢 B — Costos Fijos (mensual)</div>
            <div style={r2}>
              <Field label="Empleados"    value={empls}  onChange={setEmpls}  suffix="$"/>
              <Field label="Proveedores"  value={provs}  onChange={setProvs}  suffix="$"/>
            </div>
            <div style={r2}>
              <Field label="Herramientas" value={herrs}  onChange={setHerrs}  suffix="$"/>
              <Field label="Logística"    value={logis}  onChange={setLogis}  suffix="$"/>
            </div>
            <div style={{marginBottom:14}}><Field label="Otros" value={otrosF} onChange={setOtrosF} suffix="$"/></div>
            <CalcRow label="Costos Fijos Totales" value={fmt$(cfTotal)} bold/>
          </div>

          {/* C — Break Even ROAS */}
          <div style={card}>
            <div style={stit}>⚖️ C — Break Even ROAS</div>
            <div style={{background:T.bg,border:`1px solid ${T.border2}`,borderRadius:10,padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>ROAS mínimo para no perder dinero en costos variables</div>
              <div style={{fontSize:42,fontWeight:800,fontFamily:"monospace",lineHeight:1,color:beRoas<Infinity?(beRoas<=4?"#4ade80":beRoas<=7?"#f59e0b":"#f87171"):T.textFaint}}>
                {beRoas<Infinity?`${beRoas.toFixed(2)}x`:"∞"}
              </div>
              <div style={{fontSize:10,color:T.textFaint,marginTop:8}}>
                = 1 ÷ (1 − {cvTotal.toFixed(1)}% costos variables)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* D — Simulador EBITDA */}
      <div style={card}>
        <div style={stit}>🔢 D — Simulador EBITDA</div>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:14}}>
          Cada celda = <code style={{background:T.bg,padding:"1px 6px",borderRadius:4,fontSize:10,color:T.textDim}}>Inversión × ROAS × (1 − {cvTotal.toFixed(1)}% CVars) − Inversión − {fmt$(cfTotal)} CF</code>
        </div>
        <div style={{overflowX:"auto",borderRadius:8,border:`1px solid ${T.border}`}}>
          <table style={{borderCollapse:"collapse",fontSize:11,width:"100%",minWidth:600}}>
            <thead>
              <tr>
                <th style={{padding:"10px 14px",background:T.bg2,borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,color:T.textDim,fontSize:10,fontWeight:600,whiteSpace:"nowrap",textAlign:"left"}}>
                  Inv. ↓ · ROAS →
                </th>
                {roasCols.map((roas,ci)=>(
                  <th key={ci} style={{padding:"6px 4px",background:T.bg2,borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,minWidth:88,textAlign:"center"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2}}>
                      <input type="text" inputMode="decimal" value={roas}
                        onChange={e=>{const v=parseFloat(e.target.value.replace(",","."));if(!isNaN(v)){const n=[...roasCols];n[ci]=v;setRoasCols(n);}}}
                        style={{width:48,background:"none",border:`1px solid ${T.border2}`,borderRadius:4,color:T.textSub,padding:"3px 4px",fontSize:11,outline:"none",textAlign:"center",fontFamily:"inherit"}}
                      />
                      <span style={{fontSize:10,color:T.textFaint}}>x</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invRows.map((inv,ri)=>(
                <tr key={ri}>
                  <td style={{padding:"5px 8px",background:T.bg2,borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`}}>
                    <input type="text" inputMode="decimal" value={inv}
                      onChange={e=>{const v=e.target.value.replace(/[^0-9.,]/g,"").replace(",",".");const n=[...invRows];n[ri]=v;setInvRows(n);}}
                      onBlur={e=>{const v=parseFloat(e.target.value.replace(",","."));if(!isNaN(v)){const n=[...invRows];n[ri]=v;setInvRows(n);}}}
                      style={{width:116,background:"none",border:`1px solid ${T.border2}`,borderRadius:4,color:T.textSub,padding:"4px 7px",fontSize:11,outline:"none",fontFamily:"inherit"}}
                    />
                  </td>
                  {roasCols.map((roas,ci)=>{
                    const eb = ebitdaCalc(inv,roas);
                    const ok = eb >= 0;
                    return (
                      <td key={ci} style={{padding:"7px 10px",borderBottom:`1px solid ${T.border}`,borderRight:`1px solid ${T.border}`,background:ok?"#0a2e1a":"#2d0a0a",textAlign:"right",fontFamily:"monospace",fontWeight:600,fontSize:11,color:ok?"#4ade80":"#f87171",whiteSpace:"nowrap"}}>
                        {eb>=0?"+":""}{Math.round(eb).toLocaleString("es-AR")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          {[
            ["+ Fila inv.", ()=>setInvRows(p=>[...p,Math.round((p[p.length-1]||1000000)*1.33)])],
            ["− Fila",      ()=>invRows.length>1&&setInvRows(p=>p.slice(0,-1))],
            ["+ Col ROAS",  ()=>setRoasCols(p=>[...p,Math.round((p[p.length-1]||5)+1)])],
            ["− Col",       ()=>roasCols.length>1&&setRoasCols(p=>p.slice(0,-1))],
          ].map(([l,fn])=>(
            <button key={l} onClick={fn} style={{padding:"5px 12px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:6,color:T.textDim,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* E — P&G Proyectado */}
      <div style={card}>
        <div style={stit}>📋 E — P&G Proyectado Mensual</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
          <Field label="Inversión en publicidad ($)" value={pgInv}  onChange={setPgInv}  suffix="$"/>
          <Field label="ROAS objetivo"               value={pgRoas} onChange={setPgRoas} suffix="x"/>
        </div>
        {(pgI>0&&pgR>0) ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            {/* Left: Estado de resultados */}
            <div>
              <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Estado de Resultados</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0"}}>
                <span style={{fontSize:12,fontWeight:700,color:T.text}}>Ingresos</span>
                <span style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:"#4ade80"}}>{fmt$(pgIngresos)}</span>
              </div>
              <CalcRow label="(-) Devoluciones"             value={fmt$(-pgDev)}/>
              <CalcRow label="(-) Costos de producción"     value={fmt$(-pgProd)}/>
              <CalcRow label="(-) Envíos"                   value={fmt$(-pgEnvios)}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`2px solid ${T.border2}`,marginTop:2}}>
                <span style={{fontSize:12,fontWeight:700,color:T.text}}>Utilidad Bruta</span>
                <span style={{fontSize:13,fontWeight:700,fontFamily:"monospace",color:pgUtilBruta>=0?"#60a5fa":"#f87171"}}>{fmt$(pgUtilBruta)}</span>
              </div>
              <CalcRow label="(-) Inversión en publicidad"  value={fmt$(-pgI)}/>
              <CalcRow label="(-) Costos de transacciones"  value={fmt$(-pgTransac)}/>
              <CalcRow label="(-) Ingresos Brutos"          value={fmt$(-pgIngBrut)}/>
              <CalcRow label="(-) Agencia de Marketing"     value={fmt$(-pgAgencia)}/>
              <CalcRow label="(-) Otros costos variables"   value={fmt$(-pgOtrosV)}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`2px solid ${T.border2}`,marginTop:2}}>
                <span style={{fontSize:12,fontWeight:700,color:T.text}}>Margen de Contribución</span>
                <span style={{fontSize:13,fontWeight:700,fontFamily:"monospace",color:pgMargenContr>=0?"#a78bfa":"#f87171"}}>{fmt$(pgMargenContr)}</span>
              </div>
              <CalcRow label="(-) Empleados"    value={fmt$(-p(empls))}/>
              <CalcRow label="(-) Proveedores"  value={fmt$(-p(provs))}/>
              <CalcRow label="(-) Herramientas" value={fmt$(-p(herrs))}/>
              <CalcRow label="(-) Logística"    value={fmt$(-p(logis))}/>
              <CalcRow label="(-) Otros fijos"  value={fmt$(-p(otrosF))}/>
              <CalcRow label="Costos Totales"   value={fmt$(pgCostTot)} bold/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderTop:`2px solid ${T.border2}`,marginTop:4,background:pgEbitda>=0?"#0a2e1a44":"#2d0a0a44",borderRadius:8}}>
                <span style={{fontSize:13,fontWeight:800,color:T.text}}>EBITDA</span>
                <span style={{fontSize:20,fontWeight:800,fontFamily:"monospace",color:pgEbitda>=0?"#4ade80":"#f87171"}}>{pgEbitda>=0?"+":""}{fmt$(pgEbitda)}</span>
              </div>
            </div>
            {/* Right: Resumen + Márgenes */}
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px"}}>
                <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Resumen</div>
                {[
                  {l:"Ingresos",          v:fmt$(pgIngresos),    c:"#4ade80"},
                  {l:"Costos totales",    v:fmt$(pgCostTot),     c:"#f87171"},
                  {l:"Margen contrib.",   v:fmt$(pgMargenContr), c:pgMargenContr>=0?"#a78bfa":"#f87171"},
                  {l:"EBITDA",           v:fmt$(pgEbitda),      c:pgEbitda>=0?"#4ade80":"#f87171"},
                ].map(({l,v,c})=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <span style={{fontSize:11,color:T.textMuted}}>{l}</span>
                    <span style={{fontSize:15,fontWeight:700,fontFamily:"monospace",color:c}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px"}}>
                <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Márgenes</div>
                {[
                  {l:"Margen Bruto",         v:pgIngresos>0?fmtP((pgUtilBruta/pgIngresos)*100):"—"},
                  {l:"Margen Contribución",  v:pgIngresos>0?fmtP((pgMargenContr/pgIngresos)*100):"—"},
                  {l:"Margen EBITDA",        v:pgIngresos>0?fmtP((pgEbitda/pgIngresos)*100):"—"},
                ].map(({l,v})=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:11,color:T.textMuted}}>{l}</span>
                    <span style={{fontSize:13,fontWeight:700,fontFamily:"monospace",color:T.textSub}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px 18px"}}>
                <div style={{fontSize:10,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Break Even ROAS actual</div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:28,fontWeight:800,fontFamily:"monospace",color:beRoas<Infinity?(beRoas<=4?"#4ade80":beRoas<=7?"#f59e0b":"#f87171"):T.textFaint}}>
                    {beRoas<Infinity?`${beRoas.toFixed(2)}x`:"∞"}
                  </div>
                  <div style={{fontSize:10,color:T.textFaint,marginTop:4}}>
                    ROAS objetivo ({pgR.toFixed(2)}x) {pgR>=beRoas?"✓ supera":"✗ no supera"} el break even
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{textAlign:"center",padding:"36px 20px",color:T.textFaint,fontSize:12,background:T.bg,borderRadius:10,border:`1px dashed ${T.border2}`}}>
            <div style={{fontSize:32,marginBottom:8}}>💡</div>
            Ingresá la inversión en publicidad y el ROAS objetivo para ver el estado de resultados proyectado
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {id:"dashboard", label:"Dashboard",    icon:"📊"},
  {id:"campaigns", label:"Campañas",     icon:"📣"},
  {id:"creatives", label:"Creativos",    icon:"🎨"},
  {id:"tasks",     label:"Tareas",       icon:"✅"},
  {id:"audit",      label:"Auditoría",    icon:"📋"},
  {id:"ganancias",  label:"Ganancias",    icon:"💸"},
  {id:"report",     label:"Reporte",      icon:"📄"},
  {id:"profit",     label:"Rentabilidad", icon:"💰"},
  {id:"settings",  label:"Ajustes",      icon:"⚙️"},
];

// ─── OVERVIEW MODULE ─────────────────────────────────────────────────────────
function OverviewModule({ accounts, tasks, onSelect }) {
  const T = useT();

  return (
    <div className="page-pad" style={{padding:"28px 20px",maxWidth:900,margin:"0 auto"}}>
      <div style={{marginBottom:22}}>
        <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:6}}>Seleccioná una cuenta</div>
        <div style={{fontSize:13,color:T.textMuted}}>{accounts.length} cuenta{accounts.length!==1?"s":""} disponible{accounts.length!==1?"s":""} según tus accesos</div>
      </div>

      {/* Account cards */}
      <div className="account-cards-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {accounts.map(acc=>{
          const cv  = acc.funnel?.conversion||{};
          const cr  = acc.funnel?.creativos||{};
          const g   = acc.goals||{roas:3,cpa:10,ctr:1.5};
          const roas = cv.roas||0;
          const cpa  = cv.costoCompra||0;
          const ctr  = cr.ctrUnico||0;
          const roasOk = roas>=g.roas;
          const cpaOk  = cpa<=g.cpa||cpa===0;
          const ctrOk  = ctr>=g.ctr;
          const pendingTasks = tasks.filter(t=>t.status!=="done"&&(t.account_id||t.account)===acc.id).length;
          const hasData = (cv.inversion||0)>0;

          return (
            <div key={acc.id} onClick={()=>onSelect(acc.id)}
              style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"transform 0.15s,border-color 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="#e8572a55";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor=T.border;}}>

              {/* Card header */}
              <div style={{height:5,background:acc.color||"#e8572a"}}/>
              <div style={{padding:"14px 16px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
                {acc.logo_url
                  ? <img src={acc.logo_url} alt="logo" style={{width:36,height:36,objectFit:"contain",borderRadius:7,border:`1px solid ${T.border}`,flexShrink:0}}/>
                  : <div style={{width:36,height:36,borderRadius:7,background:acc.color||"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,flexShrink:0}}>{acc.name?.[0]||"?"}</div>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{acc.name}</div>
                  {acc.client_name&&<div style={{fontSize:11,color:T.textMuted}}>{acc.client_name}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  {acc.meta_token
                    ? <span style={{fontSize:10,background:"#16a34a22",color:"#4ade80",border:"1px solid #16a34a44",borderRadius:10,padding:"1px 8px",fontWeight:600}}>Meta ●</span>
                    : <span style={{fontSize:10,background:T.bg2,color:T.textFaint,border:`1px solid ${T.border}`,borderRadius:10,padding:"1px 8px"}}>Sin API</span>
                  }
                  {pendingTasks>0&&<span style={{fontSize:10,background:"#f59e0b22",color:"#f59e0b",border:"1px solid #f59e0b44",borderRadius:10,padding:"1px 8px",fontWeight:600}}>{pendingTasks} tarea{pendingTasks!==1?"s":""}</span>}
                </div>
              </div>

              {/* KPIs */}
              <div style={{padding:"12px 16px"}}>
                {!hasData ? (
                  <div style={{textAlign:"center",padding:"18px 0",color:T.textFaint,fontSize:12}}>Sin datos — conectá Meta API o seleccioná un período</div>
                ) : (
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                      {[
                        {l:"ROAS",  v:`${roas.toFixed(1)}x`,  ok:roasOk},
                        {l:"CPA",   v:cpa>0?`$${cpa.toFixed(0)}`:"—", ok:cpaOk},
                        {l:"CTR",   v:`${ctr.toFixed(1)}%`,   ok:ctrOk},
                      ].map(({l,v,ok})=>(
                        <div key={l} style={{background:ok?T.ok.bg:T.bad.bg,border:`1px solid ${ok?T.ok.border:T.bad.border}`,borderRadius:7,padding:"7px 8px",textAlign:"center"}}>
                          <div style={{fontSize:9,color:ok?T.ok.text:T.bad.text,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{l}</div>
                          <div style={{fontSize:14,fontWeight:700,fontFamily:"monospace",color:ok?T.ok.text:T.bad.text}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textMuted,paddingTop:8,borderTop:`1px solid ${T.border}`}}>
                      <span>Inv. <b style={{color:T.textSub}}>${(cv.inversion||0).toLocaleString("es-AR",{maximumFractionDigits:0})}</b></span>
                      <span>Rev. <b style={{color:"#4ade80"}}>${(cv.facturacion||0).toLocaleString("es-AR",{maximumFractionDigits:0})}</b></span>
                      <span>Conv. <b style={{color:T.textSub}}>{cv.conversiones||0}</b></span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── META CACHE ───────────────────────────────────────────────────────────────
const META_CACHE_TTL = 5 * 60 * 1000;
const META_CACHE_PREFIX = "meta_cache_v10_";
function getMetaCache(accountId, from, to) {
  try {
    const raw = localStorage.getItem(`${META_CACHE_PREFIX}${accountId}_${from}_${to}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > META_CACHE_TTL) return null;
    return data;
  } catch { return null; }
}
function setMetaCache(accountId, from, to, data) {
  try {
    localStorage.setItem(`${META_CACHE_PREFIX}${accountId}_${from}_${to}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}
function clearAllMetaCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(META_CACHE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

// ─── CUSTOM METRICS ───────────────────────────────────────────────────────────
function formatCmVal(v, fmt) {
  const n = Number(v) || 0;
  if (fmt==="$") return `$${n.toLocaleString("es-AR",{minimumFractionDigits:0})}`;
  if (fmt==="%") return `${n.toFixed(1)}%`;
  if (fmt==="x") return `${n.toFixed(2)}x`;
  if (fmt==="s") return `${n.toFixed(1)}s`;
  if (fmt==="k") {
    if (n>=1000000) return `${(n/1000000).toFixed(1)}M`;
    if (n>=1000) return `${(n/1000).toFixed(0)}k`;
    return String(Math.round(n));
  }
  return String(Math.round(n));
}

const CUSTOM_METRICS_CATALOG = [
  // ── Performance ──
  { id:"cm_impressions",       cat:"📊 Performance", label:"Impresiones",                fmt:"k", getValue: a => a.funnel?.creativos?.impresiones||0 },
  { id:"cm_reach",             cat:"📊 Performance", label:"Alcance",                    fmt:"k", getValue: a => a.funnel?.creativos?.alcance||0 },
  { id:"cm_frequency",         cat:"📊 Performance", label:"Frecuencia",                 fmt:"x", getValue: a => a.funnel?.creativos?.frecuencia||0 },
  { id:"cm_clicks_all",        cat:"📊 Performance", label:"Clics (Todos)",              fmt:"k", getValue: a => a.funnel?.creativos?.clicsTodos||0 },
  { id:"cm_link_clicks",       cat:"📊 Performance", label:"Clics en el Enlace",         fmt:"k", getValue: a => a.funnel?.creativos?.clicsEnlace||0 },
  { id:"cm_unique_link_clicks",cat:"📊 Performance", label:"Clics Únicos en el Enlace",  fmt:"k", getValue: a => a.funnel?.creativos?.clicsUnicosEnlace||0 },
  { id:"cm_ctr_all",           cat:"📊 Performance", label:"CTR (Todos)",                fmt:"%", getValue: a => a.funnel?.creativos?.ctrTodos||0 },
  { id:"cm_ctr_link",          cat:"📊 Performance", label:"CTR (Enlace)",               fmt:"%", getValue: a => a.funnel?.creativos?.ctrUnico||0 },
  { id:"cm_cpc_all",           cat:"📊 Performance", label:"CPC (Todos)",                fmt:"$", getValue: a => a.funnel?.creativos?.cpcTodos||0 },
  { id:"cm_cpc_link",          cat:"📊 Performance", label:"CPC (Enlace)",               fmt:"$", getValue: a => a.funnel?.creativos?.cpcEnlace||0 },
  { id:"cm_cpm",               cat:"📊 Performance", label:"CPM",                        fmt:"$", getValue: a => a.funnel?.creativos?.cpm||0 },
  { id:"cm_spend",             cat:"📊 Performance", label:"Gasto",                      fmt:"$", getValue: a => a.funnel?.conversion?.inversion||0 },
  { id:"cm_roas",              cat:"📊 Performance", label:"ROAS",                       fmt:"x", getValue: a => a.funnel?.conversion?.roas||0 },
  { id:"cm_conversions",       cat:"📊 Performance", label:"Conversiones",               fmt:"k", getValue: a => a.funnel?.conversion?.conversiones||0 },
  { id:"cm_cpr",               cat:"📊 Performance", label:"Costo por Resultado",        fmt:"$", getValue: a => a.funnel?.conversion?.costoCompra||0 },
  { id:"cm_results",           cat:"📊 Performance", label:"Resultados",                 fmt:"k", getValue: a => a.funnel?.conversion?.conversiones||0 },
  { id:"cm_result_rate",       cat:"📊 Performance", label:"Tasa de Resultados",         fmt:"%", getValue: a => {
    const imp = a.funnel?.creativos?.impresiones||0;
    const conv = a.funnel?.conversion?.conversiones||0;
    return imp > 0 ? (conv/imp)*100 : 0;
  }},
  // ── Creativo ──
  { id:"cm_video_plays",       cat:"🎨 Creativo", label:"Reproducciones de Video",        fmt:"k", getValue: a => a.funnel?.creativos?.videoPlays||0 },
  { id:"cm_video_2s",          cat:"🎨 Creativo", label:"Reproducciones de 2 Segundos",   fmt:"k", getValue: a => a.funnel?.creativos?.videoViews2s||0 },
  { id:"cm_thruplay",          cat:"🎨 Creativo", label:"Reproducciones ThruPlay",         fmt:"k", getValue: a => a.funnel?.creativos?.videoThruplay||0 },
  { id:"cm_avg_watch",         cat:"🎨 Creativo", label:"Tiempo Prom. de Reproducción",   fmt:"s", getValue: a => a.funnel?.creativos?.videoAvgTime||0 },
  { id:"cm_hook_rate",         cat:"🎨 Creativo", label:"Hook Rate (3s / Impresiones)",    fmt:"%", getValue: a => {
    const cr = a.funnel?.creativos;
    return cr?.impresiones > 0 ? ((cr?.videoPlays||0)/cr.impresiones)*100 : 0;
  }},
  { id:"cm_thumbstop",         cat:"🎨 Creativo", label:"Thumbstop Rate (2s / Impresiones)",fmt:"%", getValue: a => {
    const cr = a.funnel?.creativos;
    return cr?.impresiones > 0 ? ((cr?.videoViews2s||0)/cr.impresiones)*100 : 0;
  }},
  { id:"cm_cr_unique_link",    cat:"🎨 Creativo", label:"Clics Únicos en el Enlace",      fmt:"k", getValue: a => a.funnel?.creativos?.clicsUnicosEnlace||0 },
  { id:"cm_cr_frequency",      cat:"🎨 Creativo", label:"Frecuencia",                     fmt:"x", getValue: a => a.funnel?.creativos?.frecuencia||0 },
  // ── Conversión ──
  { id:"cm_purchases",         cat:"💰 Conversión", label:"Compras",                      fmt:"k", getValue: a => a.funnel?.conversion?.conversiones||0 },
  { id:"cm_cost_purchase",     cat:"💰 Conversión", label:"Costo por Compra",             fmt:"$", getValue: a => a.funnel?.conversion?.costoCompra||0 },
  { id:"cm_atc",               cat:"💰 Conversión", label:"Agregar al Carrito",           fmt:"k", getValue: a => a.funnel?.acciones?.addToCart||0 },
  { id:"cm_cost_atc",          cat:"💰 Conversión", label:"Costo por ATC",               fmt:"$", getValue: a => a.funnel?.acciones?.costoCarrito||0 },
  { id:"cm_initiate_checkout", cat:"💰 Conversión", label:"Inicio de Pago",              fmt:"k", getValue: a => a.funnel?.acciones?.pagosIniciados||0 },
  { id:"cm_cost_checkout",     cat:"💰 Conversión", label:"Costo por Inicio de Pago",    fmt:"$", getValue: a => a.funnel?.acciones?.costoPagosIniciados||0 },
  { id:"cm_leads",             cat:"💰 Conversión", label:"Leads",                       fmt:"k", getValue: a => a.funnel?.acciones?.leads||0 },
  { id:"cm_cost_lead",         cat:"💰 Conversión", label:"Costo por Lead",              fmt:"$", getValue: a => a.funnel?.acciones?.costoLead||0 },
  { id:"cm_ticket",            cat:"💰 Conversión", label:"Ticket Promedio",             fmt:"$", getValue: a => a.funnel?.conversion?.ticketPromedio||0 },
  { id:"cm_conv_rate",         cat:"💰 Conversión", label:"Tasa de Conversión Web",      fmt:"%", getValue: a => a.funnel?.conversion?.tasaConversionWeb||0 },
  // ── Audiencia ──
  { id:"cm_new_convos",        cat:"👥 Audiencia", label:"Nuevas Conversaciones",         fmt:"k", getValue: a => a.funnel?.acciones?.nuevasConversaciones||0 },
  { id:"cm_convos_started",    cat:"👥 Audiencia", label:"Conversaciones Iniciadas",     fmt:"k", getValue: a => a.funnel?.acciones?.conversacionesIniciadas||0 },
  { id:"cm_page_likes",        cat:"👥 Audiencia", label:"Me Gusta en la Página",        fmt:"k", getValue: a => a.funnel?.acciones?.meLikesPagina||0 },
  { id:"cm_interactions",      cat:"👥 Audiencia", label:"Interacciones",                fmt:"k", getValue: a => {
    const ac = a.funnel?.acciones||{};
    return (ac.reacciones||0)+(ac.comentarios||0)+(ac.compartidos||0);
  }},
  { id:"cm_reactions",         cat:"👥 Audiencia", label:"Reacciones",                   fmt:"k", getValue: a => a.funnel?.acciones?.reacciones||0 },
  { id:"cm_comments",          cat:"👥 Audiencia", label:"Comentarios",                  fmt:"k", getValue: a => a.funnel?.acciones?.comentarios||0 },
  { id:"cm_shares",            cat:"👥 Audiencia", label:"Compartidos",                  fmt:"k", getValue: a => a.funnel?.acciones?.compartidos||0 },
  { id:"cm_photo_views",       cat:"👥 Audiencia", label:"Visualizaciones de Fotos",    fmt:"k", getValue: a => a.funnel?.acciones?.fotosVistas||0 },
  // ── Atribución ──
  { id:"cm_attr_click_1d",     cat:"📎 Atribución", label:"Conv. clic 1 día",            fmt:"k", getValue: a => a.funnel?.atribucion?.click1d||0 },
  { id:"cm_attr_click_7d",     cat:"📎 Atribución", label:"Conv. clic 7 días",           fmt:"k", getValue: a => a.funnel?.atribucion?.click7d||0 },
  { id:"cm_attr_view_1d",      cat:"📎 Atribución", label:"Conv. vista 1 día",           fmt:"k", getValue: a => a.funnel?.atribucion?.view1d||0 },
  { id:"cm_attr_7d_1d",        cat:"📎 Atribución", label:"Conv. clic 7d + vista 1d",    fmt:"k", getValue: a => a.funnel?.atribucion?.click7dView1d||0 },
];

// Evaluador aritmético seguro (sin eval / Function)
function safeEval(expr) {
  const src = String(expr).replace(/×/g,"*").replace(/÷/g,"/").replace(/\s+/g,"");
  const toks = [];
  let i = 0;
  while (i < src.length) {
    if (/[\d.]/.test(src[i])) {
      let n = ""; while (i < src.length && /[\d.]/.test(src[i])) n += src[i++];
      toks.push({ t:"n", v: parseFloat(n) });
    } else if ("+-*/()".includes(src[i])) {
      toks.push({ t:"op", v: src[i++] });
    } else i++;
  }
  let pos = 0;
  const peek = () => toks[pos] || null;
  const eat  = () => toks[pos++];
  function expr2() {
    let l = term();
    while (peek() && (peek().v==="+"||peek().v==="-")) { const op=eat().v; const r=term(); l=op==="+"?l+r:l-r; }
    return l;
  }
  function term() {
    let l = factor();
    while (peek() && (peek().v==="*"||peek().v==="/")) { const op=eat().v; const r=factor(); l=op==="*"?l*r:(r!==0?l/r:0); }
    return l;
  }
  function factor() {
    const t = peek();
    if (!t) return 0;
    if (t.t==="n") { eat(); return t.v; }
    if (t.v==="(") { eat(); const v=expr2(); if(peek()?.v===")") eat(); return v; }
    if (t.v==="-") { eat(); return -factor(); }
    return 0;
  }
  try { return expr2(); } catch { return 0; }
}

function evaluateCustomMetric(def, account) {
  if (!def?.formula?.length) return 0;
  const expr = def.formula.map(t => {
    if (t.type==="metric") {
      const m = CUSTOM_METRICS_CATALOG.find(m => m.id===t.id);
      return String(m ? (m.getValue(account)||0) : 0);
    }
    return t.value || "";
  }).join(" ");
  return safeEval(expr);
}

// ── Creador de métrica personalizada (estilo Meta) ────────────────────────────
const CM_FMT_OPTS = [
  { value:"k", label:"Numérico (123)" },
  { value:"%", label:"Porcentaje (%)" },
  { value:"$", label:"Divisa ($)"     },
  { value:"x", label:"Ratio (x)"      },
  { value:"s", label:"Segundos (s)"   },
];
const CM_OPS = ["+","-","×","÷","(", ")"];

function CustomMetricCreatorModal({ onSave, onClose, initial = null }) {
  const T = useT();
  const [formula, setFormula]   = useState(initial?.formula || []);
  const [name,    setName]      = useState(initial?.name || "");
  const [desc,    setDesc]      = useState(initial?.description || "");
  const [fmt,     setFmt]       = useState(initial?.fmt || "k");
  const [mSearch, setMSearch]   = useState("");
  const [picker,  setPicker]    = useState(false);

  const pickerMetrics = useMemo(() => {
    const q = mSearch.toLowerCase().trim();
    return q ? CUSTOM_METRICS_CATALOG.filter(m => m.label.toLowerCase().includes(q)||m.cat.toLowerCase().includes(q)) : CUSTOM_METRICS_CATALOG;
  }, [mSearch]);

  const addMetric = m => { setFormula(f=>[...f,{type:"metric",id:m.id,value:m.label}]); setPicker(false); setMSearch(""); };
  const addOp     = op => setFormula(f=>[...f,{type:"op",value:op}]);
  const removeLast= () => setFormula(f=>f.slice(0,-1));
  const clearAll  = () => setFormula([]);

  const canSave = name.trim().length > 0 && formula.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ id: initial?.id || `custom_${Date.now()}`, name:name.trim(), description:desc.trim(), fmt, formula });
  };

  const inp = { background:T.bg, border:`1px solid ${T.border2}`, borderRadius:7, color:T.text, padding:"9px 12px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:18,width:"100%",maxWidth:660,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"20px 24px 14px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
            <div style={{fontSize:15,fontWeight:700,color:T.text}}>{initial?"Editar":"Crear"} métrica personalizada</div>
            <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:22,padding:0,lineHeight:1}}>×</button>
          </div>
          <div style={{fontSize:12,color:T.textDim}}>Combiná métricas de Meta Ads con una fórmula personalizada</div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

          {/* ── Fórmula ── */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:9}}>Fórmula</div>

            {/* Barra de herramientas */}
            <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
              {/* Selector de métrica */}
              <div style={{position:"relative"}}>
                <button onClick={()=>setPicker(p=>!p)} style={{padding:"7px 11px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                  Seleccionar métrica <span style={{fontSize:9,opacity:0.55}}>▼</span>
                </button>
                {picker && (
                  <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:20,background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:10,width:290,maxHeight:270,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 10px 36px rgba(0,0,0,0.45)"}}>
                    <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
                      <input value={mSearch} onChange={e=>setMSearch(e.target.value)} placeholder="Buscar métrica..." autoFocus style={{...inp,padding:"6px 10px",fontSize:12}}/>
                    </div>
                    <div style={{overflowY:"auto"}}>
                      {pickerMetrics.map(m=>(
                        <div key={m.id} onClick={()=>addMetric(m)} style={{padding:"8px 13px",cursor:"pointer",borderBottom:`1px solid ${T.divider}`}}
                          onMouseEnter={e=>e.currentTarget.style.background=T.hover}
                          onMouseLeave={e=>e.currentTarget.style.background="none"}>
                          <div style={{fontSize:12,color:T.textSub,fontWeight:500}}>{m.label}</div>
                          <div style={{fontSize:10,color:T.textFaint,marginTop:1}}>{m.cat}</div>
                        </div>
                      ))}
                      {!pickerMetrics.length && <div style={{padding:16,textAlign:"center",color:T.textFaint,fontSize:12}}>Sin resultados</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Operadores */}
              {CM_OPS.map(op=>(
                <button key={op} onClick={()=>addOp(op)} style={{width:34,height:34,background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {op}
                </button>
              ))}

              {/* Borrar último */}
              <button onClick={removeLast} disabled={!formula.length} style={{padding:"7px 11px",background:"none",border:`1px solid ${T.border2}`,borderRadius:7,color:"#f87171",cursor:formula.length?"pointer":"default",fontSize:12,fontWeight:600,opacity:formula.length?1:0.4,marginLeft:"auto"}}>
                ← Borrar
              </button>
            </div>

            {/* Display fórmula */}
            <div onClick={()=>setPicker(true)} style={{minHeight:64,background:T.bg,border:`1px solid ${T.border2}`,borderRadius:8,padding:"10px 13px",cursor:"text"}}>
              {formula.length > 0 ? (
                <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                  {formula.map((t,i)=>(
                    <span key={i} style={{
                      display:"inline-flex",alignItems:"center",padding:t.type==="metric"?"3px 9px":"3px 7px",
                      borderRadius:5, margin:1,
                      background:t.type==="metric"?"#3b82f622":"#f59e0b22",
                      border:`1px solid ${t.type==="metric"?"#3b82f644":"#f59e0b44"}`,
                      color:t.type==="metric"?"#60a5fa":"#f59e0b",
                      fontSize:12,fontWeight:600,
                    }}>{t.value}</span>
                  ))}
                </div>
              ) : (
                <div style={{color:T.textFaint,fontSize:12,lineHeight:1.5}}>
                  Para combinar las métricas en una fórmula, seleccioná Métricas en el menú desplegable o presioná un operador.
                  <br/><span style={{color:T.textDim}}>Ejemplo: Gasto ÷ Compras</span>
                </div>
              )}
            </div>
            {formula.length > 0 && (
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:5}}>
                <button onClick={clearAll} style={{background:"none",border:"none",color:T.textFaint,cursor:"pointer",fontSize:11,padding:0}}>Limpiar fórmula</button>
              </div>
            )}
          </div>

          {/* ── Nombre + Formato ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 180px",gap:12,marginBottom:14}}>
            <div>
              <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Nombre</div>
              <div style={{position:"relative"}}>
                <input value={name} onChange={e=>setName(e.target.value.slice(0,100))} placeholder="Asigná un nombre a esta métrica" style={{...inp,paddingRight:44}}/>
                <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:10,color:T.textFaint}}>{name.length}/100</span>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Formato</div>
              <select value={fmt} onChange={e=>setFmt(e.target.value)} style={{...inp,padding:"9px 10px",cursor:"pointer"}}>
                {CM_FMT_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* ── Descripción ── */}
          <div>
            <div style={{fontSize:11,color:T.textDim,marginBottom:6}}>Descripción · <span style={{color:T.textFaint}}>Opcional</span></div>
            <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describe esta métrica" style={inp}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{padding:"14px 24px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10,justifyContent:"flex-end",flexShrink:0}}>
          <button onClick={onClose} style={{padding:"8px 18px",background:"none",border:`1px solid ${T.border2}`,borderRadius:7,color:T.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!canSave} style={{padding:"8px 22px",background:canSave?"#a78bfa":"#333",border:"none",borderRadius:7,color:"#fff",cursor:canSave?"pointer":"default",fontSize:13,fontWeight:700,fontFamily:"inherit",opacity:canSave?1:0.5}}>
            {initial?"Guardar cambios":"Guardar métrica"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomMetricsModal({ selected, customDefs, onSave, onClose }) {
  const T = useT();
  const [tab,      setTab]      = useState("catalog");        // "catalog" | "custom"
  const [query,    setQuery]    = useState("");
  const [localSel, setLocalSel] = useState(() => new Set(selected));
  const [localDefs,setLocalDefs]= useState(customDefs || []);
  const [creator,  setCreator]  = useState(null);             // null | "new" | {def}

  // ── Catálogo ──
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? CUSTOM_METRICS_CATALOG.filter(m => m.label.toLowerCase().includes(q)||m.cat.toLowerCase().includes(q)) : CUSTOM_METRICS_CATALOG;
  }, [query]);
  const categories = useMemo(() => {
    const map = {};
    filtered.forEach(m => { if (!map[m.cat]) map[m.cat]=[]; map[m.cat].push(m); });
    return map;
  }, [filtered]);

  const toggleCatalog = id => setLocalSel(prev => {
    const next = new Set(prev); next.has(id)?next.delete(id):next.add(id); return next;
  });
  const toggleCustom = id => setLocalSel(prev => {
    const next = new Set(prev); next.has(id)?next.delete(id):next.add(id); return next;
  });

  // ── Creador ──
  const handleSaveDef = def => {
    const isEdit = localDefs.some(d=>d.id===def.id);
    const newDefs = isEdit ? localDefs.map(d=>d.id===def.id?def:d) : [...localDefs,def];
    setLocalDefs(newDefs);
    setLocalSel(prev=>{ const n=new Set(prev); n.add(def.id); return n; });
    setCreator(null);
  };
  const deleteDef = id => {
    setLocalDefs(prev=>prev.filter(d=>d.id!==id));
    setLocalSel(prev=>{ const n=new Set(prev); n.delete(id); return n; });
  };

  const totalSel = localSel.size;

  if (creator) {
    return (
      <CustomMetricCreatorModal
        initial={creator==="new"?null:creator}
        onSave={handleSaveDef}
        onClose={()=>setCreator(null)}
      />
    );
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <div style={{background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:18,width:"100%",maxWidth:720,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* ── Header ── */}
        <div style={{padding:"18px 24px 0",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:T.text}}>Métricas del Dashboard</div>
              <div style={{fontSize:12,color:T.textDim,marginTop:2}}>{totalSel} seleccionadas · se anclan al Dashboard</div>
            </div>
            <button onClick={onClose} style={{background:"none",border:"none",color:T.textDim,cursor:"pointer",fontSize:24,lineHeight:1,padding:0,marginTop:2}}>×</button>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:0,borderBottom:`1px solid ${T.border}`}}>
            {[["catalog","Catálogo de métricas"],["custom","Mis métricas personalizadas"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setTab(id);setQuery("");}} style={{padding:"9px 18px",background:"none",border:"none",borderBottom:`2px solid ${tab===id?"#a78bfa":"transparent"}`,color:tab===id?"#a78bfa":T.textMuted,cursor:"pointer",fontSize:13,fontWeight:tab===id?700:400,fontFamily:"inherit",marginBottom:-1}}>
                {label}{id==="custom"&&localDefs.length>0&&<span style={{marginLeft:6,background:"#a78bfa22",border:"1px solid #a78bfa44",borderRadius:10,padding:"0 6px",fontSize:10,color:"#a78bfa"}}>{localDefs.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>

          {tab==="catalog" && (
            <>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Buscar entre ${CUSTOM_METRICS_CATALOG.length} métricas...`} autoFocus
                style={{width:"100%",background:T.bg,border:`1px solid ${T.border2}`,borderRadius:8,color:T.text,padding:"9px 13px",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:16}}/>
              {Object.entries(categories).map(([cat,metrics])=>(
                <div key={cat} style={{marginBottom:20}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.textDim,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${T.border}`}}>{cat}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
                    {metrics.map(m=>{
                      const chk = localSel.has(m.id);
                      return (
                        <label key={m.id} onClick={()=>toggleCatalog(m.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,border:`1px solid ${chk?"#a78bfa55":T.border}`,background:chk?"#a78bfa0d":T.bg,cursor:"pointer",userSelect:"none"}}>
                          <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${chk?"#a78bfa":T.border2}`,background:chk?"#a78bfa":"none",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            {chk&&<span style={{color:"#fff",fontSize:9,fontWeight:900,lineHeight:1}}>✓</span>}
                          </div>
                          <span style={{fontSize:12,color:chk?T.text:T.textMuted,fontWeight:chk?600:400}}>{m.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!Object.keys(categories).length && <div style={{textAlign:"center",padding:48,color:T.textFaint,fontSize:13}}>Sin resultados para "{query}"</div>}
            </>
          )}

          {tab==="custom" && (
            <div>
              {/* Botón crear */}
              <button onClick={()=>setCreator("new")} style={{width:"100%",padding:"12px 16px",background:"#a78bfa0d",border:"2px dashed #a78bfa44",borderRadius:10,color:"#a78bfa",cursor:"pointer",fontSize:13,fontWeight:700,marginBottom:20,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span style={{fontSize:16}}>+</span> Crear métrica personalizada
              </button>

              {localDefs.length === 0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",color:T.textFaint,fontSize:13}}>
                  <div style={{fontSize:28,marginBottom:12}}>🧮</div>
                  <div style={{fontWeight:600,color:T.textSub,marginBottom:4}}>Todavía no tenés métricas personalizadas</div>
                  <div>Creá tu primera métrica combinando las de Meta Ads con una fórmula</div>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {localDefs.map(def=>{
                    const chk = localSel.has(def.id);
                    const fmt = CM_FMT_OPTS.find(o=>o.value===def.fmt)?.label||def.fmt;
                    return (
                      <div key={def.id} style={{background:T.bg,border:`1px solid ${chk?"#a78bfa55":T.border}`,borderRadius:10,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                        {/* Checkbox */}
                        <div onClick={()=>toggleCustom(def.id)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${chk?"#a78bfa":T.border2}`,background:chk?"#a78bfa":"none",flexShrink:0,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {chk&&<span style={{color:"#fff",fontSize:10,fontWeight:900,lineHeight:1}}>✓</span>}
                        </div>
                        {/* Info */}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{def.name}</div>
                          <div style={{display:"flex",flexWrap:"wrap",gap:4,alignItems:"center"}}>
                            {def.formula.map((t,i)=>(
                              <span key={i} style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:t.type==="metric"?"#3b82f622":"#f59e0b22",color:t.type==="metric"?"#60a5fa":"#f59e0b",border:`1px solid ${t.type==="metric"?"#3b82f644":"#f59e0b44"}`,fontWeight:600}}>
                                {t.value}
                              </span>
                            ))}
                          </div>
                          {def.description && <div style={{fontSize:11,color:T.textFaint,marginTop:4}}>{def.description}</div>}
                        </div>
                        {/* Formato */}
                        <span style={{fontSize:10,color:T.textDim,flexShrink:0,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:5,padding:"2px 7px"}}>{fmt}</span>
                        {/* Acciones */}
                        <div style={{display:"flex",gap:5,flexShrink:0}}>
                          <button onClick={()=>setCreator(def)} style={{padding:"4px 10px",background:"none",border:`1px solid ${T.border2}`,borderRadius:6,color:T.textMuted,cursor:"pointer",fontSize:11,fontWeight:600}}>Editar</button>
                          <button onClick={()=>deleteDef(def.id)} style={{padding:"4px 8px",background:"none",border:"1px solid #991b1b44",borderRadius:6,color:"#f87171",cursor:"pointer",fontSize:11,fontWeight:600}}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{padding:"12px 24px",borderTop:`1px solid ${T.border}`,display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
          <button onClick={()=>setLocalSel(new Set())} style={{padding:"7px 14px",background:"none",border:`1px solid ${T.border2}`,borderRadius:7,color:T.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Limpiar</button>
          <span style={{flex:1,fontSize:12,color:T.textFaint,paddingLeft:2}}>{totalSel} métrica{totalSel!==1?"s":""} anclada{totalSel!==1?"s":""}</span>
          <button onClick={onClose} style={{padding:"7px 16px",background:"none",border:`1px solid ${T.border2}`,borderRadius:7,color:T.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Cancelar</button>
          <button onClick={()=>onSave([...localSel],localDefs)} style={{padding:"7px 20px",background:"#a78bfa",border:"none",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function CustomMetricsSection({ account, selected, customDefs, onOpen }) {
  const T = useT();
  // Resuelve cada ID seleccionado a una definición de métrica (catálogo o personalizada)
  const resolved = selected.map(id => {
    const catalog = CUSTOM_METRICS_CATALOG.find(m => m.id === id);
    if (catalog) return { id, label: catalog.label, fmt: catalog.fmt, getValue: a => catalog.getValue(a) };
    const custom  = customDefs.find(d => d.id === id);
    if (custom)  return { id, label: custom.name,   fmt: custom.fmt,  getValue: a => evaluateCustomMetric(custom, a) };
    return null;
  }).filter(Boolean);

  const hasAny = resolved.length > 0;

  return (
    <div style={{marginTop:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:10,height:10,borderRadius:2,background:"#a78bfa",flexShrink:0}}/>
        <span style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.07em"}}>Métricas Personalizadas</span>
        <span style={{fontSize:10,color:T.textFaint,marginLeft:2}}>· {CUSTOM_METRICS_CATALOG.length} disponibles</span>
        <button onClick={onOpen} style={{marginLeft:"auto",padding:"5px 13px",background:"#a78bfa22",border:"1px solid #a78bfa44",borderRadius:6,color:"#a78bfa",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          {hasAny ? "✏ Editar" : "+ Agregar métricas"}
        </button>
      </div>
      {hasAny ? (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
          {resolved.map(m => (
            <div key={m.id} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:10,padding:"13px 15px"}}>
              <div style={{fontSize:10,color:T.textDim,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:7,lineHeight:1.4}}>{m.label}</div>
              <div style={{fontSize:21,fontWeight:700,fontFamily:"monospace",color:T.textSub}}>{formatCmVal(m.getValue(account), m.fmt)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div onClick={onOpen} style={{background:T.bg1,border:`2px dashed ${T.border2}`,borderRadius:10,padding:"30px 20px",textAlign:"center",cursor:"pointer"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor="#a78bfa66"}
          onMouseLeave={e=>e.currentTarget.style.borderColor=T.border2}>
          <div style={{fontSize:24,marginBottom:8}}>📊</div>
          <div style={{fontSize:13,fontWeight:600,color:T.textSub,marginBottom:4}}>Agregá métricas personalizadas</div>
          <div style={{fontSize:12,color:T.textDim}}>Elegí del catálogo o creá tus propias fórmulas</div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function DashboardPage({ account }) {
  const T = useT();
  const [showCM, setShowCM] = useState(false);
  const [selectedCM, setSelectedCM] = useState(() => {
    try { const s = localStorage.getItem('eb_custom_metrics_v1'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [customDefs, setCustomDefs] = useState(() => {
    try { const s = localStorage.getItem('eb_custom_defs_v1'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const saveCM = (ids, defs) => {
    setSelectedCM(ids);
    setCustomDefs(defs);
    try {
      localStorage.setItem('eb_custom_metrics_v1', JSON.stringify(ids));
      localStorage.setItem('eb_custom_defs_v1', JSON.stringify(defs));
    } catch {}
  };

  if (!account) return <div style={{padding:40,textAlign:"center",color:T.textFaint,fontSize:14}}>Seleccioná una cuenta para continuar.</div>;
  const f = account.funnel||{creativos:{},acciones:{},conversion:{}};
  const g = account.goals||{roas:3,cpa:10,ctr:1.5,budget:1000};
  const cr = f.creativos||{}; const ac = f.acciones||{}; const cv = f.conversion||{};
  return (
    <div className="page-pad" style={{padding:"20px 24px"}}>
      <PhaseBlock color="#60a5fa" title="CREATIVOS"
        metrics={[
          {label:"Alcance",          value:cr.alcance||0,          type:"num"},
          {label:"Impresiones",      value:cr.impresiones||0,      type:"num"},
          {label:"CTR Único",        value:cr.ctrUnico||0,         type:"%", goal:g.ctr},
          {label:"Clics en Enlace",  value:cr.clicsEnlace||0,      type:"num"},
          {label:"CPM",              value:cr.cpm||0,              type:"$", inv:true},
          {label:"Clics Únicos Enlace", value:cr.clicsUnicosEnlace||0, type:"k"},
          {label:"Frecuencia",       value:cr.frecuencia||0,       type:"x"},
        ]}
      />
      <PhaseBlock color="#f59e0b" title="ACCIONES EN TIENDA"
        metrics={[
          {label:"Add to Cart",    value:ac.addToCart||0,           type:"num"},
          {label:"Pagos Iniciados",value:ac.pagosIniciados||0,      type:"num"},
          {label:"Costo Pagos",    value:ac.costoPagosIniciados||0, type:"$", inv:true},
        ]}
      />
      <PhaseBlock color="#4ade80" title="CONVERSIÓN"
        metrics={[
          {label:"Inversión",      value:cv.inversion||0,    type:"$"},
          {label:"Facturación",    value:cv.facturacion||0,  type:"$"},
          {label:"Costo/Compra",   value:cv.costoCompra||0,  type:"$", inv:true, goal:g.cpa},
          {label:"ROAS",           value:cv.roas||0,         type:"x", goal:g.roas},
          {label:"Conversiones",   value:cv.conversiones||0, type:"num"},
          {label:"Compras",        value:cv.conversiones||0, type:"k"},
          {label:"Ticket Promedio",value:cv.ticketPromedio||0, type:"$"},
          {label:"Tasa Conv. Web", value:cv.tasaConversionWeb||0, type:"%"},
        ]}
      />
      <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px",marginTop:4}}>
        <PerfChart daily={account.daily||[]} color={account.color||"#e8572a"}/>
      </div>
      <CustomMetricsSection account={account} selected={selectedCM} customDefs={customDefs} onOpen={()=>setShowCM(true)}/>
      {showCM && <CustomMetricsModal selected={selectedCM} customDefs={customDefs} onSave={(ids,defs)=>{saveCM(ids,defs);setShowCM(false);}} onClose={()=>setShowCM(false)}/>}
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const T = darkMode ? DARK : LIGHT;

  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [allAccounts, setAllAccounts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(() => {
    try { return localStorage.getItem("eb_active_project") || null; } catch { return null; }
  });
  const [page, setPage] = useState(() => {
    try { return localStorage.getItem("eb_page") || "dashboard"; } catch { return "dashboard"; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [dateRange, setDateRange] = useState(() => {
    try {
      const saved = localStorage.getItem("eb_date_range");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { preset:"last_30", ...getPresetRange("last_30") };
  });
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState(null);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  function toast(msg, type="success") {
    const id = Date.now();
    setToasts(p=>[...p, {id, msg, type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 3500);
  }

  // Persistir estado crítico en localStorage — sobrevive tab discard, recarga y cierre del browser
  useEffect(() => {
    try {
      if (activeProjectId) localStorage.setItem("eb_active_project", activeProjectId);
      else localStorage.removeItem("eb_active_project");
    } catch {}
  }, [activeProjectId]);
  useEffect(() => {
    // No persistir "overview" — es pantalla de bienvenida/selección, no una sección permanente
    try { if (page !== "overview") localStorage.setItem("eb_page", page); } catch {}
  }, [page]);
  useEffect(() => {
    try { localStorage.setItem("eb_date_range", JSON.stringify(dateRange)); } catch {}
  }, [dateRange]);

  // Apply CSS variables for theme transitions
  useEffect(()=>{
    const r = document.documentElement;
    r.style.setProperty("--bg", T.bg);
    r.style.setProperty("--text", T.text);
    r.style.setProperty("--border", T.border);
    document.body.style.background = T.bg;
    document.body.style.color = T.text;
    document.body.style.transition = "background .25s, color .25s";
  }, [darkMode]);

  // Supabase auth + data load
  useEffect(()=>{
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    // loaded evita que un TOKEN_REFRESHED/SIGNED_IN secundario re-ejecute
    // loadUserData y pise la página en la que está el usuario
    let loaded = false;

    // Verificar sesión: solo chequea si hay sesión activa, NO bloquea en carga de datos
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loaded = true;
        // Hay sesión: mostrar app de inmediato, cargar datos en background
        const u = { id: session.user.id, email: session.user.email, name: session.user.email, role: "team" };
        setUser(u);
        loadUserData(session.user.id, session.user.email).catch(console.error);
      }
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));

    // Escuchar login/logout futuros.
    // IMPORTANTE: no re-ejecutar loadUserData si ya cargamos datos (evita reset al renovar token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        if (!loaded) {
          // Login real (no renovación de token)
          loaded = true;
          const u = { id: session.user.id, email: session.user.email, name: session.user.email, role: "team" };
          setUser(u);
          loadUserData(session.user.id, session.user.email).catch(console.error);
        }
      } else if (event === 'SIGNED_OUT') {
        loaded = false;
        setUser(null);
        setAllAccounts([]);
        setAllUsers([]);
        setTasks([]);
        setActiveProjectId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData(userId, email) {
    const t = ms => new Promise((_,r)=>setTimeout(()=>r(new Error("timeout")),ms));

    // 1. Perfil — con timeout de 5s
    let role = "master"; // asumir master si falla (solo el master user existe ahora)
    let name = email;
    try {
      const { data: profile } = await Promise.race([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        t(5000)
      ]);
      if (profile) { role = profile.role||"team"; name = profile.name||email; }
    } catch(e) { console.warn("profile:", e.message); }

    const userObj = { id: userId, email, name, role };
    setUser(userObj);

    // 2. Cuentas + meta_configs
    // Master: ve todas. Team y Client: solo las que tienen en account_access
    try {
      let accs = [];
      if (role === "master") {
        const { data } = await Promise.race([supabase.from("accounts").select("*").order("name"), t(5000)]);
        accs = data || [];
      } else {
        // team y client: solo cuentas asignadas
        const { data: access } = await Promise.race([supabase.from("account_access").select("account_id").eq("profile_id", userId), t(5000)]);
        const ids = (access||[]).map(a=>a.account_id);
        if (ids.length > 0) {
          const { data } = await Promise.race([supabase.from("accounts").select("*").in("id", ids).order("name"), t(5000)]);
          accs = data || [];
        }
      }
      // Enriquecer con estado meta_connected
      try {
        const { data: metas } = await Promise.race([supabase.from("meta_configs").select("account_id,connected"), t(3000)]);
        if (metas) {
          const metaMap = {};
          metas.forEach(m => { metaMap[m.account_id] = m.connected; });
          accs = accs.map(a => ({...a, meta_connected: metaMap[a.id]||false}));
        }
      } catch(e) { /* meta_configs opcional */ }
      setAllAccounts(accs);
      if (accs.length > 0) {
        const savedId = localStorage.getItem("eb_active_project");
        const savedValid = savedId && accs.some(a => a.id === savedId);
        if (savedValid) {
          // Usuario recurrente: ir directo a la cuenta y sección que tenía
        } else if (accs.length === 1) {
          // Una sola cuenta disponible: entrar directo sin pantalla de selección
          setActiveProjectId(accs[0].id);
        } else {
          // Múltiples cuentas, sin preferencia guardada: mostrar pantalla de selección
          setPage("overview");
        }
      }
    } catch(e) { console.warn("accounts:", e.message); }

    // 3. Usuarios (solo master)
    if (role === "master") {
      try {
        const { data: users } = await Promise.race([supabase.from("profiles").select("*").order("name"), t(5000)]);
        setAllUsers(users || []);
      } catch(e) { console.warn("users:", e.message); }
    }

    // 4. Tareas
    try {
      const { data: tasksData } = await Promise.race([supabase.from("tasks").select("*").order("created_at"), t(5000)]);
      setTasks(tasksData || []);
    } catch(e) { console.warn("tasks:", e.message); }
  }

  function handleDemoLogin(demoUser) {
    setUser(demoUser);
    setAllAccounts(DEMO_ACCOUNTS);
    setAllUsers(DEMO_USERS);
    setTasks(DEMO_TASKS);
    const savedId = localStorage.getItem("eb_active_project");
    const savedValid = savedId && DEMO_ACCOUNTS.some(a => a.id === savedId);
    if (!savedValid) setPage("overview");
  }

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    try { localStorage.removeItem("eb_active_project"); localStorage.removeItem("eb_page"); } catch {}
    setUser(null);
    setAllAccounts([]);
    setAllUsers([]);
    setTasks([]);
    setActiveProjectId(null);
    setPage("dashboard");
  }

  // Listener visibilitychange: cuando el usuario vuelve a la pestaña después de tab discard,
  // la página recarga y los useState ya leyeron de localStorage. Este listener maneja el caso
  // donde el JS no se mató (cambio rápido de pestaña) pero los datos de Meta podrían estar stale.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      // Si el estado en memoria es válido, no hacer nada
      if (allAccounts.length === 0 && user) {
        // Estado perdido (tab fue descartada) — recargar datos de usuario
        loadUserData(user.id, user.email).catch(console.error);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [allAccounts.length, user]);

  // Fetch Meta API cuando cambia la cuenta activa o el rango de fechas
  // El token viene directo del account (no de meta_configs)
  useEffect(() => {
    const acc = allAccounts.find(a => a.id === activeProjectId);
    if (!acc?.meta_token || !acc?.meta_ad_account_id) return;
    fetchMetaData(activeProjectId, acc.meta_token, acc.meta_ad_account_id, dateRange.from, dateRange.to);
  }, [activeProjectId, dateRange, allAccounts.length]);

  async function handleSaveGoals(goals) {
    if (isSupabaseConfigured && supabase && activeProjectId) {
      const { error } = await supabase.from("accounts").update({ goals }).eq("id", activeProjectId);
      if (error) { toast("Error guardando objetivos: " + error.message, "error"); return; }
    }
    setAllAccounts(prev => prev.map(a => a.id === activeProjectId ? {...a, goals} : a));
    setShowGoalsModal(false);
    toast("Objetivos guardados ✓");
  }

  async function fetchMetaData(accountId, token, adAccountId, from, to) {
    if (!token || !adAccountId) { toast("Falta token o ID de cuenta Meta","error"); return; }
    const accId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;

    // Cache: si hay datos recientes (< 5 min) los usamos directamente sin fetch
    const cached = getMetaCache(accountId, from, to);
    if (cached) {
      setAllAccounts(prev => prev.map(a => a.id===accountId ? {...a, ...cached} : a));
      toast("Datos cargados desde cache ✓");
      return;
    }

    setMetaLoading(true);
    try {
      const tr = JSON.stringify({ since: from, until: to });
      // outbound_clicks = "Clics en Enlace" real (excluye reacciones/shares)
      // unique_ctr      = "CTR Único" real
      const fields = "spend,impressions,reach,outbound_clicks,actions,action_values,cpm,cpc,ctr,unique_ctr,unique_outbound_clicks,frequency,clicks,website_purchase_roas,purchase_roas,video_thruplay_watched_actions,video_avg_time_watched_actions";

      const mkParams = extra => new URLSearchParams({ access_token: token, fields, time_range: tr, ...extra }).toString();

      const campFields = "campaign_name,campaign_id,spend,impressions,reach,outbound_clicks,actions,action_values,cpm,cpc,ctr,unique_ctr";
      const adInsFields = "ad_id,ad_name,adset_name,spend,impressions,reach,outbound_clicks,actions,action_values,cpm,cpc,ctr,unique_ctr,frequency,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions,video_avg_time_watched_actions,video_thruplay_watched_actions";

      // PASO 1: 5 llamadas en paralelo (sin metadata de ads — se obtiene después)
      const META_V = "v22.0";
      const [insJson, dailyJson, campJson, campNamesJson, adInsJson] = await Promise.all([
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${mkParams({ level:"account" })}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${mkParams({ level:"account", time_increment:"1" })}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${new URLSearchParams({ access_token:token, fields:campFields, time_range:tr, level:"campaign" })}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/campaigns?${new URLSearchParams({ access_token:token, fields:"id,name,status", limit:"200" })}`).then(r=>r.json()),
        fetch(`https://graph.facebook.com/${META_V}/${accId}/insights?${new URLSearchParams({ access_token:token, fields:adInsFields, time_range:tr, level:"ad", limit:"200" })}`).then(r=>r.json()),
      ]);

      // Verificar errores en TODOS los requests, no solo insJson
      if (insJson.error)     throw new Error(`Cuenta: [${insJson.error.code}] ${insJson.error.message}`);
      if (campNamesJson.error) throw new Error(`Campañas: [${campNamesJson.error.code}] ${campNamesJson.error.message}`);
      if (campJson.error)    throw new Error(`Insights campañas: [${campJson.error.code}] ${campJson.error.message}`);
      if (adInsJson.error)   throw new Error(`Creativos: [${adInsJson.error.code}] ${adInsJson.error.message}`);

      // PASO 2: obtener metadata de exactamente los ads que tienen insights.
      // NO usar /ads?limit=200 — eso trae los primeros 200 sin filtrar por período
      // y los ads activos pueden estar más allá de esa posición → thumbnailUrl = null.
      // Con /?ids=... pedimos solo los que necesitamos, sin importar cuántos ads totales haya.
      const adIds = [...new Set((adInsJson.data||[]).map(r=>r.ad_id).filter(Boolean))];
      const adMetaMap = {};
      if (adIds.length > 0) {
        // image_url = cover del video en scontent CDN (funciona en browser)
        // thumbnail_url = puede ser lookaside.fbsbx.com (requiere cookies de Facebook)
        const adMetaFields = "name,status,creative{thumbnail_url,image_url},adset{name}";
        const batches = [];
        for (let i = 0; i < adIds.length; i += 50) {
          const ids = adIds.slice(i, i + 50).join(",");
          batches.push(
            fetch(`https://graph.facebook.com/${META_V}/?ids=${ids}&fields=${adMetaFields}&access_token=${token}`)
              .then(r => r.json())
          );
        }
        const results = await Promise.all(batches);
        results.forEach(res => {
          if (res && !res.error && typeof res === "object") {
            Object.entries(res).forEach(([id, ad]) => {
              if (ad && !ad.error) adMetaMap[id] = ad;
            });
          }
        });
      }

      // Waterfall: evita doble conteo. "purchase" primero = tipo unificado que Ads Manager muestra.
      const PURCHASE_PRIORITY = [
        "purchase",                              // Unificado CAPI+Pixel — igual a Ads Manager
        "offsite_conversion.fb_pixel_purchase",  // Pixel solo — fallback
        "omni_purchase",
        "app_custom_event.fb_mobile_purchase",
        "onsite_conversion.flow_complete",
        "web_in_store_purchase",
      ];
      const CART_PRIORITY = [
        "add_to_cart",
        "offsite_conversion.fb_pixel_add_to_cart",
        "omni_add_to_cart",
      ];
      const CHECKOUT_PRIORITY = [
        "initiate_checkout",
        "offsite_conversion.fb_pixel_initiate_checkout",
        "omni_initiated_checkout",
      ];

      // Retorna el primer tipo con valor > 0 (evita doble conteo)
      const gaFirst = (arr, types) => {
        if (!arr) return 0;
        for (const type of types) {
          const v = parseFloat(arr.find(a => a.action_type === type)?.value || 0);
          if (v > 0) return v;
        }
        return 0;
      };

      // Con fallback catch-all para naming no estándar de algunos BMs
      const getPurchase = (arr) => {
        if (!arr) return 0;
        const v = gaFirst(arr, PURCHASE_PRIORITY);
        if (v > 0) return v;
        const fallback = arr.filter(a => a.action_type.includes("purchase"));
        return fallback.length ? Math.max(...fallback.map(a => parseFloat(a.value || 0))) : 0;
      };

      // outbound_clicks viene como array [{action_type:"outbound_click", value:"N"}]
      const parseOutboundClicks = (field) => {
        if (!field) return 0;
        if (Array.isArray(field)) return parseInt(field.find(x=>x.action_type==="outbound_click")?.value || field[0]?.value || 0);
        return parseInt(field || 0);
      };

      // gv: busca por action_type (soporta múltiples tipos, devuelve el primero con valor > 0)
      const gv = (arr, ...types) => {
        if (!arr) return 0;
        for (const t of types) {
          const v = parseFloat(arr.find(a => a.action_type === t)?.value || 0);
          if (v > 0) return v;
        }
        return 0;
      };
      // gvVid: suma todos los valores de un campo de video (robusto ante cambios de action_type)
      const gvVid = arr => {
        if (!arr || !arr.length) return 0;
        return arr.reduce((acc, a) => acc + parseFloat(a.value || 0), 0);
      };

      const LEAD_PRIORITY = [
        "lead", "offsite_conversion.fb_pixel_lead",
        "onsite_conversion.lead_grouped", "leadgen_other",
      ];

      const s = insJson.data?.[0] || {};
      const spend = parseFloat(s.spend||0);
      const conv  = gaFirst(s.actions,       PURCHASE_PRIORITY);
      let   rev   = gaFirst(s.action_values, PURCHASE_PRIORITY);
      // Fallback: si action_values da 0, usar website_purchase_roas × spend
      if (rev === 0 && spend > 0) {
        const metaRoas = parseFloat(s.website_purchase_roas?.[0]?.value || s.purchase_roas?.[0]?.value || 0);
        if (metaRoas > 0) rev = metaRoas * spend;
      }
      const cart     = gaFirst(s.actions, CART_PRIORITY);
      const checkout = gaFirst(s.actions, CHECKOUT_PRIORITY);
      const leads    = gaFirst(s.actions, LEAD_PRIORITY);

      // Acciones sociales
      const reacciones              = gv(s.actions, "post_reaction", "like_reaction");
      const comentarios             = gv(s.actions, "comment");
      const compartidos             = gv(s.actions, "post");
      const meLikesPagina           = gv(s.actions, "like");
      const fotosVistas             = gv(s.actions, "photo_view");
      const conversacionesIniciadas = gv(s.actions, "onsite_conversion.messaging_conversation_started_7d");
      const nuevasConversaciones    = gv(s.actions, "onsite_conversion.messaging_first_reply");

      // Video a nivel de cuenta — video_view viene del array actions (campo ya solicitado)
      const v3sAccount    = gv(s.actions, "video_view");
      const videoViews2s  = 0; // No existe campo válido de 2s en Meta Ads Insights API
      const videoThruplay = gvVid(s.video_thruplay_watched_actions);
      const rawAvgTAcc    = gvVid(s.video_avg_time_watched_actions);
      const videoAvgTime  = rawAvgTAcc > 1000 ? rawAvgTAcc / 1000 : rawAvgTAcc;

      // Derivadas
      const clicsEnlace       = parseOutboundClicks(s.outbound_clicks);
      const impresiones       = parseInt(s.impressions||0);
      const ticketPromedio    = conv > 0 ? rev / conv : 0;
      const tasaConversionWeb = clicsEnlace > 0 ? (conv / clicsEnlace) * 100 : 0;

      const funnel = {
        creativos: {
          alcance:            parseInt(s.reach||0),
          impresiones,
          ctrUnico:           parseFloat(s.unique_ctr||s.ctr||0),
          clicsEnlace,
          cpm:                parseFloat(s.cpm||0),
          clicsUnicosEnlace:  parseInt(s.unique_outbound_clicks||0),
          frecuencia:         parseFloat(s.frequency||0),
          clicsTodos:         parseInt(s.clicks||0),
          ctrTodos:           parseFloat(s.ctr||0),
          cpcTodos:           parseFloat(s.cpc||0),
          cpcEnlace:          clicsEnlace > 0 ? spend / clicsEnlace : 0,
          videoPlays:         v3sAccount,
          videoViews2s,
          videoThruplay,
          videoAvgTime,
        },
        acciones: {
          addToCart:            cart,
          pagosIniciados:       checkout,
          costoPagosIniciados:  checkout > 0 ? spend / checkout : 0,
          costoCarrito:         cart > 0 ? spend / cart : 0,
          leads,
          costoLead:            leads > 0 ? spend / leads : 0,
          reacciones, comentarios, compartidos,
          meLikesPagina, fotosVistas,
          conversacionesIniciadas, nuevasConversaciones,
        },
        conversion: {
          inversion:          spend,
          facturacion:        rev,
          costoCompra:        conv > 0 ? spend / conv : 0,
          roas:               spend > 0 ? rev / spend : 0,
          conversiones:       conv,
          ticketPromedio,
          tasaConversionWeb,
        },
      };

      const daily = (dailyJson.data||[]).map(d => {
        const sp = parseFloat(d.spend||0);
        const rv = gaFirst(d.action_values, PURCHASE_PRIORITY);
        const cn   = gaFirst(d.actions, PURCHASE_PRIORITY);
        const impr = parseInt(d.impressions||0);
        const clks = parseOutboundClicks(d.outbound_clicks);
        return {
          day: d.date_start, spend: sp, revenue: rv,
          roas: sp>0?rv/sp:0, conversions: cn,
          impressions: impr,
          ctr: parseFloat(d.unique_ctr||d.ctr||0),
          cpm: parseFloat(d.cpm||0),
          cpc: parseFloat(d.cpc||0),
          clicks: clks,
          cpa: cn>0 ? sp/cn : 0,
        };
      });

      // Mapa de id → status/nombre desde el endpoint de campañas sin time_range
      const campStatusMap = {};
      (campNamesJson.data||[]).forEach(c => { campStatusMap[c.id] = { name:c.name, status:c.status }; });

      // Insights por campaña con time_range correcto
      const campaigns = (campJson.data||[]).map(row => {
        const sp = parseFloat(row.spend||0);
        const rv = getPurchase(row.action_values);
        const cn = getPurchase(row.actions);
        const meta = campStatusMap[row.campaign_id] || {};
        return {
          id:     row.campaign_id,
          name:   row.campaign_name || meta.name || row.campaign_id,
          status: meta.status || "ACTIVE",
          spend:  sp,
          revenue:rv,
          roas:   sp > 0 ? rv / sp : 0,
          cpa:    cn > 0 ? sp / cn : 0,
          ctr:    parseFloat(row.unique_ctr||row.ctr||0),
          conversions: cn,
        };
      });

      // adMetaMap ya fue construido arriba con los IDs exactos de insights
      // gv y gvVid definidos antes del funnel — reutilizados aquí para creativos

      const creatives = (adInsJson.data||[]).map(row => {
        const meta = adMetaMap[row.ad_id] || {};
        const sp   = parseFloat(row.spend||0);
        const rv   = getPurchase(row.action_values);
        const cn   = getPurchase(row.actions);
        const impr = parseInt(row.impressions||0);
        const v3s  = gv(row.actions, "video_view");
        const p25  = gvVid(row.video_p25_watched_actions);
        const p50  = gvVid(row.video_p50_watched_actions);
        const p75  = gvVid(row.video_p75_watched_actions);
        const p95  = gvVid(row.video_p95_watched_actions);
        const p100 = gvVid(row.video_p100_watched_actions);
        const thr  = gvVid(row.video_thruplay_watched_actions);
        const rawAvgT = gvVid(row.video_avg_time_watched_actions);
        // Meta v16+ devuelve avg_time en milisegundos; versiones anteriores en segundos
        const avgT = rawAvgT > 1000 ? rawAvgT / 1000 : rawAvgT;
        const isVideo = v3s > 0;
        // Hook Rate = ThruPlays / total video views × 100 (único proxy válido disponible en Meta API)
        const hookRate = v3s > 0 ? (thr / v3s) * 100 : 0;
        return {
          id: row.ad_id, name: row.ad_name || meta.name || row.ad_id,
          status: meta.status || "ACTIVE",
          type: isVideo ? "VIDEO" : "IMAGE",
          thumb: isVideo ? "🎬" : "📷",
          // Preferir image_url (scontent CDN, carga siempre) sobre thumbnail_url
          // thumbnail_url para videos suele ser lookaside.fbsbx.com (requiere cookies Facebook)
          thumbnailUrl: (() => {
            const c = meta.creative;
            if (!c) return null;
            const iurl = c.image_url;
            const turl = c.thumbnail_url;
            // Si image_url existe y es CDN público → usarla
            if (iurl && !iurl.includes("lookaside")) return iurl;
            // Si thumbnail_url es CDN público → usarla
            if (turl && !turl.includes("lookaside")) return turl;
            // Último recurso: cualquier URL que haya
            return iurl || turl || null;
          })(),
          campaign: row.adset_name || meta.adset?.name || "",
          hookRate, thumbstopRate: hookRate,
          retention25:  v3s > 0 ? (p25  / v3s) * 100 : 0,
          retention50:  v3s > 0 ? (p50  / v3s) * 100 : 0,
          retention75:  v3s > 0 ? (p75  / v3s) * 100 : 0,
          retention95:  v3s > 0 ? (p95  / v3s) * 100 : 0,
          retention100: v3s > 0 ? (p100 / v3s) * 100 : 0,
          thruplays: thr, avgWatchTime: avgT, videoViews3s: v3s,
          ctr: parseFloat(row.unique_ctr||row.ctr||0), cpm: parseFloat(row.cpm||0),
          cpc: parseFloat(row.cpc||0), frecuencia: parseFloat(row.frequency||0),
          alcance: parseInt(row.reach||0), impressions: impr,
          clics: parseOutboundClicks(row.outbound_clicks), conversions: cn,
          spend: sp, revenue: rv,
          cpa: cn > 0 ? sp / cn : 0,
          roas: sp > 0 ? rv / sp : 0,
          color: "#e8572a",
        };
      });

      const payload = { funnel, daily, campaigns, creatives };
      setMetaCache(accountId, from, to, payload);
      setAllAccounts(prev => prev.map(a => a.id===accountId ? {...a, ...payload} : a));
      setMetaError(null);
      const label = insJson.data?.length ? "Datos Meta actualizados ✓" : "Meta conectada — sin datos en el período seleccionado";
      toast(label, insJson.data?.length ? "success" : "info");
    } catch(e) {
      console.error("Meta API:", e);
      setMetaError(e.message);
      toast("Error Meta API: " + e.message, "error");
    }
    setMetaLoading(false);
  }

  if (authLoading) return (
    <ThemeCtx.Provider value={T}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:T.bg,flexDirection:"column",gap:16}}>
        <Logo/>
        <div style={{color:T.textMuted,fontSize:13}}>Cargando...</div>
      </div>
    </ThemeCtx.Provider>
  );

  if (!user) return (
    <ThemeCtx.Provider value={T}>
      <LoginScreen onLogin={handleDemoLogin} onDarkMode={setDarkMode} darkMode={darkMode}/>
      <ToastContainer toasts={toasts}/>
    </ThemeCtx.Provider>
  );

  const isClient = user.role === "client";
  const isMaster = user.role === "master";
  const canEdit = user.role === "master" || user.role === "team";

  const activeAccount = allAccounts.find(a=>a.id===activeProjectId)||allAccounts[0]||null;

  // Client portal — simplified view
  if (isClient) return (
    <ThemeCtx.Provider value={T}>
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column"}}>
        <div style={{background:T.bg1,borderBottom:`1px solid ${T.border}`,padding:"0 24px",height:56,display:"flex",alignItems:"center",gap:14}}>
          <Logo/>
          <span style={{marginLeft:"auto",fontSize:12,color:T.textMuted}}>{user.name||user.email}</span>
          <button onClick={handleLogout} style={{padding:"5px 14px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:6,color:T.textSub,cursor:"pointer",fontSize:12}}>Salir</button>
        </div>
        <div style={{flex:1}}>
          <ClientPortal account={activeAccount} tasks={tasks} currentUser={user} toast={toast}/>
        </div>
      </div>
      <ToastContainer toasts={toasts}/>
    </ThemeCtx.Provider>
  );

  // Visible nav items
  const navItems = NAV_ITEMS.filter(n=>{
    if (isClient) return n.id==="dashboard" || n.id==="report";
    if (n.id==="settings") return canEdit;
    return true;
  });

  // Sidebar width
  const sw = sidebarOpen ? 220 : 60;
  const reportOpen = page === "report";

  function renderPage() {
    const noAcc = <div style={{padding:40,textAlign:"center",color:T.textFaint,fontSize:14}}>Seleccioná una cuenta para continuar.</div>;
    switch(page) {
      case "overview":  return <OverviewModule accounts={allAccounts} tasks={tasks} onSelect={id=>{setActiveProjectId(id);setPage("dashboard");}}/>;
      case "dashboard": return <DashboardPage account={activeAccount}/>;
      case "campaigns": return activeAccount ? <div style={{padding:"20px 24px"}}><CampaignsTable campaigns={activeAccount.campaigns||[]} goals={activeAccount.goals||{roas:3,cpa:10,ctr:1.5}}/></div> : noAcc;
      case "creatives": return activeAccount ? <CreativosModule account={activeAccount} goals={activeAccount.goals||{}}/> : noAcc;
      case "tasks":     return <TasksModule userAccounts={allAccounts} allUsers={allUsers} tasks={tasks} setTasks={setTasks} currentUser={user} activeProjectId={activeProjectId}/>;
      case "audit":     return activeAccount
        ? <AuditoriaPage
            account={activeAccount}
            currentUser={user}
            allUsers={allUsers}
            dateRange={dateRange}
            T={T}
            onTasksChanged={()=>{
              supabase.from("tasks").select("*").order("created_at")
                .then(({data})=>setTasks(data||[]));
            }}
          />
        : noAcc;
      case "ganancias": return <GananciasModule account={activeAccount} currentUser={user} T={T} onAccountUpdated={(updatedAcc)=>setAllAccounts(prev=>prev.map(a=>a.id===updatedAcc.id?{...a,...updatedAcc}:a))}/>;
      case "report":    return <ReportBuilder account={activeAccount} tasks={tasks} dateRange={dateRange} onDateRangeChange={rng=>{setDateRange(rng);const acc=allAccounts.find(a=>a.id===activeProjectId);if(acc?.meta_token)fetchMetaData(activeProjectId,acc.meta_token,acc.meta_ad_account_id,rng.from,rng.to);}}/>;
      case "profit":    return <RentabilidadModule key={activeAccount?.id||"global"} account={activeAccount}/>;
      case "settings":  return canEdit ? <SettingsModule currentUser={user} allAccounts={allAccounts} allUsers={allUsers} setAllAccounts={setAllAccounts} setAllUsers={setAllUsers} toast={toast} onMetaSaved={(cfg,accId)=>{if(accId===activeProjectId){setAllAccounts(prev=>prev.map(a=>a.id===accId?{...a,...cfg}:a));}}}/> : null;
      default:          return null;
    }
  }

  return (
    <ThemeCtx.Provider value={T}>
      <div style={{display:"flex",minHeight:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif",filter:reportOpen?"blur(5px) brightness(0.45)":"none",transition:"filter 0.25s",pointerEvents:reportOpen?"none":"auto",userSelect:reportOpen?"none":"auto"}}>
        {/* Sidebar */}
        <div className="sidebar-desktop sidebar-full" style={{width:sw,minHeight:"100vh",background:T.bg1,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width .2s",overflow:"hidden",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
          {/* Logo */}
          <div style={{height:56,display:"flex",alignItems:"center",padding:sidebarOpen?"0 16px":"0 10px",gap:10,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            {sidebarOpen ? <Logo/> : <div style={{width:36,height:36,borderRadius:8,background:"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:14}}>E</div>}
            <button onClick={()=>setSidebarOpen(p=>!p)} style={{marginLeft:"auto",background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18,padding:4,lineHeight:1,flexShrink:0}}>
              {sidebarOpen?"‹":"›"}
            </button>
          </div>

          {/* Account selector */}
          {sidebarOpen && (
            <div onClick={()=>setShowPicker(true)} style={{margin:"12px 10px",padding:"10px 12px",background:T.bg2,border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              {activeAccount?.logo_url
                ? <img src={activeAccount.logo_url} alt="logo" style={{width:28,height:28,objectFit:"contain",borderRadius:5,flexShrink:0}}/>
                : <div style={{width:28,height:28,borderRadius:5,background:"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>{activeAccount?.name?.[0]||"?"}</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{activeAccount?.name||"Seleccionar"}</div>
                {activeAccount?.client_name&&<div style={{fontSize:10,color:T.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{activeAccount.client_name}</div>}
              </div>
              <span style={{color:T.textDim,fontSize:12,flexShrink:0}}>▼</span>
            </div>
          )}
          {!sidebarOpen && (
            <div onClick={()=>setShowPicker(true)} style={{margin:"12px 10px",padding:"6px",display:"flex",justifyContent:"center",cursor:"pointer"}}>
              {activeAccount?.logo_url
                ? <img src={activeAccount.logo_url} alt="logo" style={{width:32,height:32,objectFit:"contain",borderRadius:6}}/>
                : <div style={{width:32,height:32,borderRadius:6,background:"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:13}}>{activeAccount?.name?.[0]||"?"}</div>
              }
            </div>
          )}

          {/* Nav */}
          <nav style={{flex:1,padding:"6px 0",overflowY:"auto"}}>
            {navItems.map(n=>{
              const active = page===n.id;
              return (
                <div key={n.id} onClick={()=>setPage(n.id)} title={!sidebarOpen?n.label:""} style={{display:"flex",alignItems:"center",gap:12,padding:sidebarOpen?"10px 16px":"10px",margin:"1px 8px",borderRadius:8,cursor:"pointer",background:active?"#e8572a":T.hover==="transparent"?"transparent":undefined,color:active?"#fff":T.textMuted,transition:"background .15s",whiteSpace:"nowrap"}}>
                  <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
                  {sidebarOpen&&<span style={{fontSize:13,fontWeight:active?600:400}}>{n.label}</span>}
                </div>
              );
            })}
          </nav>

          {/* Bottom: theme toggle + user */}
          <div style={{borderTop:`1px solid ${T.border}`,padding:"12px 10px",flexShrink:0}}>
            <div onClick={()=>setDarkMode(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px",borderRadius:8,cursor:"pointer",marginBottom:8}}>
              <span style={{fontSize:16}}>{darkMode?"☀️":"🌙"}</span>
              {sidebarOpen&&<span style={{fontSize:12,color:T.textMuted}}>{darkMode?"Modo claro":"Modo oscuro"}</span>}
            </div>
            {sidebarOpen && (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>{(user.name||user.email||"?")[0].toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.textSub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.name||user.email}</div>
                  <div style={{fontSize:10,color:T.textMuted,textTransform:"capitalize"}}>{user.role}</div>
                </div>
                <button onClick={handleLogout} title="Cerrar sesión" style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:14,padding:2}}>↩</button>
              </div>
            )}
            {!sidebarOpen && (
              <div style={{display:"flex",justifyContent:"center"}}>
                <button onClick={handleLogout} title="Cerrar sesión" style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:16,padding:4}}>↩</button>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
          {/* Topbar */}
          <div style={{height:56,background:T.bg1,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 14px",gap:10,flexShrink:0,position:"sticky",top:0,zIndex:100}}>
            {/* Hamburguesa móvil — abre/cierra sidebar */}
            <button className="mobile-hamburger" onClick={()=>setSidebarOpen(p=>!p)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:22,padding:"4px 6px",lineHeight:1,flexShrink:0,WebkitTapHighlightColor:"transparent"}}>☰</button>
            <span style={{fontSize:15,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1}}>{navItems.find(n=>n.id===page)?.label||"Dashboard"}</span>
            {/* Selector de cuenta en topbar — solo móvil */}
            {activeAccount && (
              <button className="mobile-account-btn" onClick={()=>setShowPicker(true)}
                style={{display:"none",alignItems:"center",gap:7,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 10px",cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent",maxWidth:130,overflow:"hidden"}}>
                <div style={{width:22,height:22,borderRadius:5,background:activeAccount.color||"#e8572a",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:10,flexShrink:0}}>{activeAccount.name?.[0]||"?"}</div>
                <span style={{fontSize:11,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeAccount.name}</span>
                <span style={{color:T.textDim,fontSize:10,flexShrink:0}}>▼</span>
              </button>
            )}
            {activeAccount && (
              <span className="hide-mobile" style={{fontSize:12,color:T.textMuted,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 10px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:140,flexShrink:0}}>
                {activeAccount.name}
              </span>
            )}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
              {page === "dashboard" && activeAccount && (
                <button onClick={()=>setShowGoalsModal(true)} style={{padding:"5px 12px",background:T.bg2,border:`1px solid ${T.border2}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                  🎯 Objetivos
                </button>
              )}
              {["dashboard","campaigns","creatives"].includes(page) && (
                <span className="hide-mobile"><DateRangePicker dateRange={dateRange} onChange={setDateRange}/></span>
              )}
              {metaLoading && (
                <span style={{fontSize:11,background:"#3b82f622",border:"1px solid #3b82f644",color:"#60a5fa",borderRadius:6,padding:"3px 10px"}}>
                  Actualizando...
                </span>
              )}
              {activeAccount?.meta_token && !metaLoading && (
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  {metaError && (
                    <div style={{display:"flex",alignItems:"center",gap:6,background:"#2d0a0a",border:"1px solid #991b1b",borderRadius:7,padding:"5px 10px",maxWidth:340}}>
                      <span style={{fontSize:13,flexShrink:0}}>⚠</span>
                      <span style={{fontSize:11,color:"#f87171",lineHeight:1.35,wordBreak:"break-word"}}>{metaError}</span>
                      <button onClick={()=>setMetaError(null)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:14,lineHeight:1,padding:0,flexShrink:0,opacity:0.7}}>×</button>
                    </div>
                  )}
                  <button
                    onClick={e=>{
                      if(e.shiftKey){ clearAllMetaCache(); toast("Cache limpiado — refetch forzado","warn"); }
                      fetchMetaData(activeProjectId,activeAccount.meta_token,activeAccount.meta_ad_account_id,dateRange.from,dateRange.to);
                    }}
                    title="Click: sync · Shift+Click: limpiar cache y forzar refetch"
                    style={{fontSize:11,background:metaError?"#2d0a0a":"#16a34a22",border:`1px solid ${metaError?"#991b1b":"#16a34a44"}`,color:metaError?"#f87171":"#16a34a",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,WebkitTapHighlightColor:"transparent"}}>
                    {metaError ? "⚠ Error — Reintentar" : "↻ Sincronización"}
                  </button>
                </div>
              )}
              {!isSupabaseConfigured && (
                <span style={{fontSize:11,background:T.warn.bg,border:`1px solid ${T.warn.border}`,color:T.warn.text,borderRadius:6,padding:"3px 10px"}}>Demo</span>
              )}
            </div>
          </div>
          {/* Barra de fecha+sync para móvil — debajo del topbar */}
          {["dashboard","campaigns","creatives"].includes(page) && activeAccount && (
            <div className="mobile-date-bar" style={{display:"none",alignItems:"center",gap:8,padding:"8px 14px",background:T.bg2,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
              <DateRangePicker dateRange={dateRange} onChange={rng=>{setDateRange(rng);const acc=allAccounts.find(a=>a.id===activeProjectId);if(acc?.meta_token)fetchMetaData(activeProjectId,acc.meta_token,acc.meta_ad_account_id,rng.from,rng.to);}}/>
              {activeAccount.meta_token && !metaLoading && (
                <button onClick={()=>fetchMetaData(activeProjectId,activeAccount.meta_token,activeAccount.meta_ad_account_id,dateRange.from,dateRange.to)}
                  style={{flexShrink:0,fontSize:12,background:"#16a34a22",border:"1px solid #16a34a44",color:"#16a34a",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:700,WebkitTapHighlightColor:"transparent"}}>
                  ↻
                </button>
              )}
            </div>
          )}
          <div className="main-scroll" style={{flex:1,overflowY:"auto",paddingBottom:0}}>
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Backdrop para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div className="mobile-sidebar-backdrop"
          onClick={()=>setSidebarOpen(false)}
          style={{display:"none",position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:499}}/>
      )}

      {/* Barra de navegación inferior — solo móvil, sin estado adicional */}
      <div className="mobile-bottom-nav" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,zIndex:200,height:56,alignItems:"center",background:T.bg1,borderTop:`1px solid ${T.border}`}}>
        {["dashboard","campaigns","creatives","tasks"].map(id=>{
          const n = NAV_ITEMS.find(x=>x.id===id);
          if (!n) return null;
          const active = page===id;
          return (
            <button key={id} onClick={()=>setPage(id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 2px",color:active?"#e8572a":T.textMuted}}>
              <span style={{fontSize:20,lineHeight:1}}>{n.icon}</span>
              <span style={{fontSize:9,fontWeight:active?700:400}}>{n.label}</span>
            </button>
          );
        })}
        <button onClick={()=>setSidebarOpen(p=>!p)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 2px",color:T.textMuted}}>
          <span style={{fontSize:20,lineHeight:1}}>☰</span>
          <span style={{fontSize:9}}>Más</span>
        </button>
      </div>

      {showPicker && <ProjectPicker accounts={allAccounts} activeId={activeProjectId} onSelect={setActiveProjectId} onClose={()=>setShowPicker(false)}/>}
      {showGoalsModal && activeAccount && <GoalsModal account={activeAccount} onSave={handleSaveGoals} onClose={()=>setShowGoalsModal(false)}/>}

      {/* Report overlay — full screen, encima del blur */}
      {reportOpen && (
        <div style={{position:"fixed",inset:0,zIndex:300,background:T.bg,display:"flex",flexDirection:"column",fontFamily:"'Inter',system-ui,sans-serif"}}>
          {/* Header del reporte */}
          <div style={{height:56,background:T.bg1,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:14,flexShrink:0}}>
            <button onClick={()=>setPage("dashboard")} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1px solid ${T.border2}`,borderRadius:7,color:T.textSub,cursor:"pointer",fontSize:12,fontWeight:600,padding:"5px 12px"}}>
              ← Salir
            </button>
            <span style={{fontSize:16,fontWeight:700,color:T.text}}>Constructor de Reporte</span>
            {activeAccount && (
              <span style={{fontSize:12,color:T.textMuted,background:T.bg2,border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 10px"}}>{activeAccount.name}</span>
            )}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
              {metaLoading && <span style={{fontSize:11,background:"#3b82f622",border:"1px solid #3b82f644",color:"#60a5fa",borderRadius:6,padding:"3px 10px"}}>Actualizando Meta...</span>}
              {activeAccount?.meta_token && !metaLoading && (
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  {metaError && (
                    <div style={{display:"flex",alignItems:"center",gap:6,background:"#2d0a0a",border:"1px solid #991b1b",borderRadius:7,padding:"5px 10px",maxWidth:320}}>
                      <span style={{fontSize:12}}>⚠</span>
                      <span style={{fontSize:11,color:"#f87171",lineHeight:1.35,wordBreak:"break-word"}}>{metaError}</span>
                      <button onClick={()=>setMetaError(null)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:14,padding:0,flexShrink:0,opacity:0.7}}>×</button>
                    </div>
                  )}
                  <span style={{fontSize:11,background:metaError?"#2d0a0a":"#16a34a22",border:`1px solid ${metaError?"#991b1b":"#16a34a44"}`,color:metaError?"#f87171":"#16a34a",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontWeight:600}} title="Click: sync · Shift+Click: limpiar cache" onClick={e=>{if(e.shiftKey){clearAllMetaCache();toast("Cache limpiado","warn");}fetchMetaData(activeProjectId,activeAccount.meta_token,activeAccount.meta_ad_account_id,dateRange.from,dateRange.to);}}>
                    {metaError ? "⚠ Error — Reintentar" : "↻ Sincronización"}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Contenido del reporte */}
          <div style={{flex:1,overflow:"hidden"}}>
            <ReportBuilder account={activeAccount} tasks={tasks} dateRange={dateRange} onDateRangeChange={rng=>{ setDateRange(rng); const acc=allAccounts.find(a=>a.id===activeProjectId); if(acc?.meta_token) fetchMetaData(activeProjectId,acc.meta_token,acc.meta_ad_account_id,rng.from,rng.to); }}/>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts}/>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 3px; }
        .kanban-grid { grid-template-columns: repeat(3,1fr) !important; }
        @media(max-width:900px) { .kanban-grid { grid-template-columns: 1fr !important; } }

        /* Hamburguesa: oculta en desktop */
        .mobile-hamburger { display: none; }

        @media(max-width:768px) {
          /* Sidebar: oculta via clase sidebar-full del index.html */
          /* Hamburguesa, barra inferior y barra de fecha visibles */
          .mobile-hamburger { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
          .mobile-date-bar { display: flex !important; }
          .mobile-account-btn { display: flex !important; }

          /* Espacio para la barra inferior */
          .main-scroll { padding-bottom: 60px !important; }

          /* Grids adaptativos */
          .phase-metrics-grid { grid-template-columns: repeat(2,1fr) !important; gap:8px !important; }
          .creatives-grid { grid-template-columns: repeat(2,1fr) !important; gap:10px !important; }
          .account-cards-grid { grid-template-columns: 1fr !important; }
          .kanban-grid { grid-template-columns: 1fr !important; }
          .campaigns-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }

          /* Padding reducido */
          .page-pad { padding: 12px !important; }

          /* DatePicker oculto en topbar */
          .hide-mobile { display: none !important; }

          /* Sidebar: oculta por defecto en móvil */
          .sidebar-desktop { display: none !important; }

          /* Sidebar abierta (width:220px) → overlay encima del contenido */
          .sidebar-desktop:not([style*="width: 60"]) {
            display: flex !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important; bottom: 0 !important;
            height: 100vh !important;
            z-index: 500 !important;
            box-shadow: 4px 0 32px rgba(0,0,0,0.5) !important;
          }

          /* Backdrop detrás de la sidebar abierta */
          .mobile-sidebar-backdrop { display: block !important; position: fixed !important; inset: 0 !important; z-index: 499 !important; }
        }

        /* DateRangePicker dropdown centrado en móvil */
        @media(max-width:768px) {
          .date-range-drop {
            position: fixed !important;
            top: auto !important;
            bottom: 70px !important;
            left: 14px !important;
            right: 14px !important;
            width: auto !important;
            min-width: unset !important;
            max-height: 65vh !important;
            overflow-y: auto !important;
            border-radius: 14px !important;
          }
        }

        @media(max-width:420px) {
          .creatives-grid { grid-template-columns: 1fr !important; }
          .phase-metrics-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </ThemeCtx.Provider>
  );
}
