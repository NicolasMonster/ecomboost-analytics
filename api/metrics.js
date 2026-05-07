import { put, list, del } from '@vercel/blob';

const CACHE_HOURS = 1;

function blobKey(accountId, date) {
  return `metrics/${date}/${accountId}.json`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { accountId, date } = req.method === 'GET' ? req.query : req.body;

  if (!accountId || !date) {
    return res.status(400).json({ error: 'accountId and date are required' });
  }

  const key = blobKey(accountId, date);

  // ── GET: read from blob ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: key });
      if (blobs.length === 0) return res.status(404).json({ error: 'not_found' });

      const blob = blobs[0];
      const ageHours = (Date.now() - new Date(blob.uploadedAt).getTime()) / 3600000;

      const response = await fetch(blob.url);
      const data = await response.json();

      return res.json({ data, stale: ageHours > CACHE_HOURS, updatedAt: blob.uploadedAt });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: save to blob ───────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { data } = req.body;
      if (!data) return res.status(400).json({ error: 'data is required' });

      // Delete old blob for same key before writing new one
      const { blobs } = await list({ prefix: key });
      await Promise.all(blobs.map(b => del(b.url)));

      const blob = await put(key, JSON.stringify({ ...data, savedAt: new Date().toISOString() }), {
        access: 'public',
        contentType: 'application/json',
      });

      return res.json({ success: true, url: blob.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
