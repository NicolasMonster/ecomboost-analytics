const BASE = '/api/metrics';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export async function loadFromCloud(accountId, date = todayStr()) {
  try {
    const res = await fetch(`${BASE}?accountId=${encodeURIComponent(accountId)}&date=${date}`);
    if (!res.ok) return null;
    const { data, stale } = await res.json();
    return { data, stale };
  } catch {
    return null;
  }
}

export async function saveToCloud(accountId, data, date = todayStr()) {
  try {
    await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, date, data }),
    });
  } catch {
    // Best-effort, localStorage is the fallback
  }
}
