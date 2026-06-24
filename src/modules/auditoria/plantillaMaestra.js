// src/modules/auditoria/plantillaMaestra.js

export const APARTADOS_PLANTILLA = [
  {
    numero: 1,
    nombre: '1. Adquisición Paga',
    descripcion: 'Meta + TikTok + Google Ads',
    icono: '🎯',
    subitems: [
      'Estructura de campañas (CBO vs ABO, separación funnel)',
      'Audiencias activas (broad, intereses, LAL, retargeting)',
      'Cantidad y variedad de creativos activos',
      'Tipos de creativos: UGC, estático, video, carrusel',
      'Frecuencia de testeo creativo semanal',
      'Hooks utilizados (primeros 3 segundos)',
      'Copies y CTAs',
      'Píxel y CAPI funcionando correctamente',
      'Calidad de eventos (Event Match Quality)',
      'Distribución de gasto TOFU/MOFU/BOFU',
      'Performance por placement (feed, reels, stories)',
      'Plataformas activas (Meta, TikTok, Google)',
    ]
  },
  {
    numero: 2,
    nombre: '2. Sitio / PDP',
    descripcion: 'Home + Página de Producto',
    icono: '🛍️',
    subitems: [
      'Velocidad de carga mobile (<3 seg)',
      'Header con navegación clara y buscador',
      'Footer con FAQ, políticas y contacto',
      'Trust badges globales (pagos, envíos, seguridad)',
      'Pop-up de captación de email/WhatsApp',
      'Mapa de calor instalado (Hotjar/Clarity)',
      'Cantidad y calidad de fotos del producto',
      'Video del producto (uso, demo)',
      'Título claro y SEO friendly',
      'Bullets de beneficios arriba del fold',
      'Descripción extendida (problema-solución-producto)',
      'Tabla de talles con guía (si aplica)',
      'Reseñas del producto visibles',
      'Preguntas frecuentes en PDP',
      'Botón ATC visible y contrastante',
      'Sticky CTA en mobile',
      'Stock real / urgencia honesta',
      'Cuotas y financiación visibles',
      'Costo de envío estimado pre-checkout',
      'Política de cambios y devoluciones',
      'Cross-sell / upsell en PDP',
      'Tiempo de entrega por código postal',
    ]
  },
  {
    numero: 3,
    nombre: '3. Carrito / Checkout',
    descripcion: 'Cierre del funnel',
    icono: '🛒',
    subitems: [
      'Cantidad de pasos del checkout (idealmente 1-3)',
      'Checkout como invitado disponible',
      'Métodos de pago (MP, transferencia, tarjeta)',
      'Cantidad de cuotas sin interés',
      'Opciones y costos de envío claros',
      'Códigos de descuento visibles',
      'Upsell / Cross-sell en carrito',
      'Free shipping threshold optimizado',
      'Recordatorios de carrito abandonado (email + WhatsApp)',
      'Garantías visibles en checkout',
      'Indicador SSL / seguridad',
      'Test personal del checkout cada mes',
    ]
  },
  {
    numero: 4,
    nombre: '4. Pricing / Ofertas',
    descripcion: 'Palanca de AOV',
    icono: '🏷️',
    subitems: [
      'Estrategia de pricing vs competencia',
      'Margen real verificado por producto',
      'Oferta principal del mes (hero offer)',
      'Bundles activos (2x1, packs, combos)',
      'Cross-sells configurados',
      'Upsells post-compra (one-click)',
      'Free shipping threshold optimizado',
      'Cupones primera compra',
      'Cupones recuperación de carrito',
      'Descuentos por volumen',
      'Precios psicológicos ($9.990 vs $10.000)',
      'Calendario anual de promos (Hot Sale, Cyber, BF)',
    ]
  }
];

export const KPIS_MAESTROS_PLANTILLA = [
  { orden: 1, nombre: 'Revenue total',             definicion: 'Facturación bruta del mes en ARS',          objetivo: 'Crecimiento MoM', is_inverted: false },
  { orden: 2, nombre: 'ROAS blended',              definicion: 'Revenue total / Inversión total en ads',    objetivo: '2.5x - 4x',       is_inverted: false },
  { orden: 3, nombre: 'AOV (Average Order Value)', definicion: 'Ticket promedio por compra',                objetivo: '+10-20% trim',    is_inverted: false },
  { orden: 4, nombre: 'Conversion rate del sitio', definicion: 'Compras / Sesiones totales',                objetivo: '1.5% - 3%',       is_inverted: false },
  { orden: 5, nombre: 'CAC blended',               definicion: 'Costo de adquirir 1 cliente nuevo total',  objetivo: '<AOV',            is_inverted: true  },
  { orden: 6, nombre: 'LTV / CAC ratio',           definicion: 'Valor de vida del cliente / CAC',           objetivo: '>3:1',            is_inverted: false },
];
