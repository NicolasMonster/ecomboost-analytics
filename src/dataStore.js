const SNAPSHOTS_KEY   = 'eg_daily_metrics';
const ACCOUNTS_KEY    = 'eg_accounts';
const DATA_FILES      = ['/data/act_001.json', '/data/act_002.json', '/data/act_003.json'];

export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function getSnapshots() {
  try { return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || '{}'); }
  catch { return {}; }
}

function writeSnapshot(accounts) {
  const snapshots = getSnapshots();
  snapshots[todayStr()] = Object.fromEntries(accounts.map(a => [a.id, a]));
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

// Sync-load: most recent snapshot → localStorage fallback → hardcoded defaults
export function loadAccounts(defaults) {
  try {
    const snapshots = getSnapshots();
    const dates = Object.keys(snapshots).sort().reverse();
    if (dates.length > 0) return Object.values(snapshots[dates[0]]);
    const s = localStorage.getItem(ACCOUNTS_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return defaults;
}

// Async-load from /public/data/*.json files (used on first ever visit)
export async function loadAccountsFromFiles() {
  const results = await Promise.all(
    DATA_FILES.map(f =>
      fetch(f)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );
  return results.filter(Boolean);
}

// Save accounts to localStorage + today's snapshot
export function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    writeSnapshot(accounts);
  } catch {}
}

// Update a single account's data file snapshot for today
export function saveAccountSnapshot(account) {
  const snapshots = getSnapshots();
  const today = todayStr();
  if (!snapshots[today]) snapshots[today] = {};
  snapshots[today][account.id] = { ...account, updatedAt: today };
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

export function exportMetrics() {
  const data = {
    exportedAt: new Date().toISOString(),
    snapshots: getSnapshots(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecomboost-metricas-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importMetrics(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.snapshots) { reject('Formato inválido'); return; }
        const merged = { ...getSnapshots(), ...data.snapshots };
        localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(merged));
        resolve(merged);
      } catch { reject('Error al leer el archivo'); }
    };
    reader.readAsText(file);
  });
}
