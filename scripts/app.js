// Simple Daily Milk Tracker - persistent client-side app
// Stores entries in localStorage under key 'milk_entries_v1'

const STORAGE_KEY = 'milk_entries_v1';

const els = {
  form: document.getElementById('milkForm'),
  amount: document.getElementById('amount'),
  time: document.getElementById('time'),
  notes: document.getElementById('notes'),
  entryList: document.getElementById('entryList'),
  totalToday: document.getElementById('totalToday'),
  servingsToday: document.getElementById('servingsToday'),
  averageToday: document.getElementById('averageToday'),
  clearBtn: document.getElementById('clearBtn'),
  exportBtn: document.getElementById('exportBtn')
};

let entries = loadEntries();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load entries', e);
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function startOfLocalDay(d = new Date()) {
  const t = new Date(d);
  t.setHours(0,0,0,0);
  return t;
}

function isSameLocalDay(a, b) {
  const da = new Date(a); const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth() === db.getMonth() &&
         da.getDate() === db.getDate();
}

function render() {
  // Today's entries
  const today = new Date();
  const todays = entries.filter(e => isSameLocalDay(e.createdAt, today));

  // Stats
  const total = todays.reduce((s, e) => s + Number(e.amount || 0), 0);
  const count = todays.length;
  const avg = count ? Math.round(total / count) : 0;

  els.totalToday.textContent = `${total} ml`;
  els.servingsToday.textContent = `${count}`;
  els.averageToday.textContent = `${avg} ml`;

  // Render list
  els.entryList.innerHTML = '';
  // show most-recent-first
  const shown = todays.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (shown.length === 0) {
    els.entryList.innerHTML = '<li class="empty">No entries for today</li>';
    return;
  }

  shown.forEach(e => {
    const li = document.createElement('li');
    li.className = 'entry-item';

    const left = document.createElement('div');
    left.className = 'entry-left';
    left.innerHTML = `<strong>${escapeHtml(e.amount)} ml</strong>
                      <div class="muted">${escapeHtml(e.time)} • ${formatTime(e.createdAt)}</div>`;

    const right = document.createElement('div');
    right.className = 'entry-right';
    const notes = e.notes ? `<div class="notes">${escapeHtml(e.notes)}</div>` : '';
    right.innerHTML = notes + `<button class="btn-delete" data-id="${e.id}" title="Delete entry">Delete</button>`;

    li.appendChild(left);
    li.appendChild(right);
    els.entryList.appendChild(li);
  });

  // Attach delete handlers
  Array.from(document.getElementsByClassName('btn-delete')).forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const id = ev.currentTarget.getAttribute('data-id');
      deleteEntry(id);
    });
  });
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function addEntry(amount, timeOfDay, notes) {
  const entry = {
    id: uid(),
    amount: Number(amount),
    time: timeOfDay,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  entries.push(entry);
  saveEntries();
  render();
}

function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id);
  saveEntries();
  render();
}

function clearAll() {
  if (!confirm('Clear all saved entries? This cannot be undone.')) return;
  entries = [];
  saveEntries();
  render();
}

function exportCSV() {
  if (entries.length === 0) {
    alert('No data to export');
    return;
  }
  const header = ['id','amount_ml','time_of_day','notes','createdAt'];
  const rows = entries.map(e => [
    e.id,
    e.amount,
    `"${(e.time || '')}"`,
    `"${(String(e.notes || '').replace(/"/g,'""'))}"`,
    e.createdAt
  ].join(','));

  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `milk_entries_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Form handlers
els.form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const amount = els.amount.value.trim();
  const time = els.time.value;
  const notes = els.notes.value.trim();

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    alert('Please enter a valid amount in ml.');
    els.amount.focus();
    return;
  }
  if (!time) {
    alert('Please select time of day.');
    els.time.focus();
    return;
  }

  addEntry(amount, time, notes);
  els.form.reset();
  els.amount.focus();
});

// Buttons
els.clearBtn.addEventListener('click', clearAll);
els.exportBtn.addEventListener('click', exportCSV);

// Initial render
render();
