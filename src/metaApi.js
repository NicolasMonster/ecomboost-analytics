const API = 'https://graph.facebook.com/v21.0';
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function ga(arr = [], ...types) {
  for (const t of types) {
    const v = parseFloat(arr?.find(a => a.action_type === t)?.value || 0);
    if (v > 0) return v;
  }
  return 0;
}

function getConversions(actions) {
  return ga(actions,
    'purchase',
    'offsite_conversion.fb_pixel_purchase',
    'onsite_web_purchase',
    'omni_purchase'
  );
}

function getRevenue(actionValues) {
  return ga(actionValues,
    'purchase',
    'offsite_conversion.fb_pixel_purchase',
    'onsite_web_purchase',
    'omni_purchase'
  );
}

function getAddToCart(actions) {
  return ga(actions,
    'add_to_cart',
    'offsite_conversion.fb_pixel_add_to_cart',
    'omni_add_to_cart'
  );
}

function getCheckout(actions) {
  return ga(actions,
    'offsite_conversion.fb_pixel_initiate_checkout',
    'initiate_checkout',
    'omni_initiated_checkout'
  );
}

async function apiFetch(path, token, params = '') {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${API}${path}${sep}${params ? params + '&' : ''}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function verifyToken(token) {
  return apiFetch('/me', token, 'fields=id,name');
}

export async function getAdAccounts(token) {
  const data = await apiFetch('/me/adaccounts', token, 'fields=id,name,currency,account_status&limit=50');
  return data.data || [];
}

export async function fetchAccountMetrics(adAccountId, token) {
  const accId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const fields = 'spend,impressions,reach,clicks,ctr,cpm,actions,action_values,purchase_roas';

  const [overallRes, dailyRes, campaignsRes] = await Promise.all([
    apiFetch(`/${accId}/insights`, token, `fields=${fields}&date_preset=last_7d`),
    apiFetch(`/${accId}/insights`, token, `fields=${fields}&date_preset=last_7d&time_increment=1`),
    apiFetch(`/${accId}/campaigns`,  token,
      `fields=id,name,status,insights.date_preset(last_7d){${fields}}&limit=30`),
  ]);

  const ins        = overallRes.data?.[0] || {};
  const spend      = parseFloat(ins.spend || 0);
  const impressions= parseInt(ins.impressions || 0);
  const reach      = parseInt(ins.reach || 0);
  const clicks     = parseInt(ins.clicks || 0);
  const ctr        = parseFloat(ins.ctr || 0);
  const cpm        = parseFloat(ins.cpm || 0);
  const conversions= getConversions(ins.actions);
  const revenue    = getRevenue(ins.action_values);
  const addToCart  = getAddToCart(ins.actions);
  const initiated  = getCheckout(ins.actions);
  const roas       = spend > 0 ? revenue / spend : parseFloat(ins.purchase_roas?.[0]?.value || 0);
  const cpa        = conversions > 0 ? spend / conversions : 0;

  const funnel = {
    creativos: {
      alcance:     reach,
      impresiones: impressions,
      ctrUnico:    ctr,
      clicsEnlace: clicks,
      cpm,
    },
    acciones: {
      addToCart,
      pagosIniciados:      initiated,
      costoPagosIniciados: initiated > 0 ? spend / initiated : 0,
    },
    conversion: {
      inversion:   spend,
      facturacion: revenue,
      costoCompra: cpa,
      roas,
      conversiones: conversions,
    },
  };

  const daily = (dailyRes.data || []).map(d => {
    const ds = parseFloat(d.spend || 0);
    const dc = getConversions(d.actions);
    const dr = getRevenue(d.action_values);
    const date = new Date(d.date_start + 'T12:00:00');
    return {
      day:         DAYS_ES[date.getDay()],
      date:        d.date_start,
      spend:       ds,
      revenue:     dr,
      roas:        ds > 0 ? dr / ds : 0,
      conversions: dc,
    };
  });

  const campaigns = (campaignsRes.data || []).map(c => {
    const ci = c.insights?.data?.[0] || {};
    const cs = parseFloat(ci.spend || 0);
    const cc = getConversions(ci.actions);
    const cr = getRevenue(ci.action_values);
    return {
      id:          c.id,
      name:        c.name,
      status:      c.status,
      spend:       cs,
      revenue:     cr,
      roas:        cs > 0 ? cr / cs : 0,
      cpa:         cc > 0 ? cs / cc : 0,
      ctr:         parseFloat(ci.ctr || 0),
      conversions: cc,
    };
  });

  return { funnel, daily, campaigns };
}
