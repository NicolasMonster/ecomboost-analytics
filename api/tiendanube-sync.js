// api/tiendanube-sync.js — Vercel Serverless Function
// Proxy para la API de Tienda Nube (evita CORS desde el browser)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { store_id, token, from_date, to_date } = req.body || {};

  if (!store_id || !token) {
    return res.status(400).json({ error: 'store_id y token son requeridos' });
  }

  try {
    const params = new URLSearchParams({
      payment_status: 'paid',
      per_page: '200',
      created_at_min: `${from_date}T00:00:00-03:00`,
      created_at_max: `${to_date}T23:59:59-03:00`,
    });

    const url = `https://api.tiendanube.com/v1/${store_id}/orders?${params}`;

    const response = await fetch(url, {
      headers: {
        'Authentication': `bearer ${token}`,
        'User-Agent': 'EcomBoost Analytics (barone1551@gmail.com)',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: `Tienda Nube API error ${response.status}: ${text}`,
      });
    }

    const orders = await response.json();

    // Transformar órdenes en ventas (una fila por producto de cada orden)
    const ventas = [];
    for (const order of orders) {
      const fecha    = (order.created_at || '').split('T')[0];
      const cliente  = [order.customer?.name, order.customer?.surname].filter(Boolean).join(' ') || 'Sin nombre';
      const email    = order.customer?.email || '';
      const orden_id = `TN-${order.number}`;

      for (const product of (order.products || [])) {
        ventas.push({
          fecha,
          cliente,
          email,
          orden_id,
          sku:      product.sku || String(product.variant_id || product.product_id),
          producto: product.name,
          qty:      Number(product.quantity) || 1,
          monto:    parseFloat(product.price) * (Number(product.quantity) || 1),
          // cogs: calculado en el frontend cruzando con catálogo de productos
        });
      }
    }

    return res.status(200).json({ ventas, total: ventas.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
