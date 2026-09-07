// Daily Milk Tracker - Enhanced with goals, weekly overview, and filtering
// Stores entries and goals in localStorage

const STORAGE_KEY = 'milk_entries_v1';
const GOALS_KEY = 'milk_goals_v1';
const THEME_KEY = 'milk_app_theme';

const els = {
  form: document.getElementById('milkForm'),
  amount: document.getElementById('amount'),
  time: document.getElementById('time'),
  notes: document.getElementById('notes'),
  entryList: document.getElementById('entryList'),
  filteredEntryList: document.getElementById('filteredEntryList'),
  totalToday: document.getElementById('totalToday'),
  servingsToday: document.getElementById('servingsToday'),
  averageToday: document.getElementById('averageToday'),
  clearBtn: document.getElementById('clearBtn'),
  exportBtn: document.getElementById('exportBtn'),
  
  // Goals
  goalDisplay: document.getElementById('goalDisplay'),
  goalForm: document.getElementById('goalForm'),
  noGoalMsg: document.getElementById('noGoalMsg'),
  goalValue: document.getElementById('goalValue'),
  setGoalBtn: document.getElementById('setGoalBtn'),
  editGoalBtn: document.getElementById('editGoalBtn'),
  currentIntake: document.getElementById('currentIntake'),
  goalAmount: document.getElementById('goalAmount'),
  progressFill: document.getElementById('progressFill'),
  progressText: document.getElementById('progressText'),
  
  // Weekly
  weeklyChart: document.getElementById('weeklyChart'),
  
  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // Filtering
  filterFromDate: document.getElementById('filterFromDate'),
  filterToDate: document.getElementById('filterToDate'),
  applyFilterBtn: document.getElementById('applyFilterBtn'),
  resetFilterBtn: document.getElementById('resetFilterBtn')
};

let entries = loadEntries();
let goals = loadGoals();

// ============ Theme Management ============
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
  setTheme(savedTheme);
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      setTheme(theme);
      localStorage.setItem(THEME_KEY, theme);
    });
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-theme') === theme) {
      btn.classList.add('active');
    }
  });
}

// ============ Utilities ============
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

function loadGoals() {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load goals', e);
    return {};
  }
}

function saveGoals() {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function startOfLocalDay(d = new Date()) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function isSameLocalDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
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
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ============ Tab Management ============
function initTabs() {
  els.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      
      // Remove active from all
      els.tabBtns.forEach(b => b.classList.remove('active'));
      els.tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active to clicked
      btn.classList.add('active');
      document.getElementById(tabName + '-tab').classList.add('active');
      
      if (tabName === 'history') {
        renderFilteredHistory();
      }
    });
  });
}

// ============ Goals Management ============
function getTodayGoal() {
  const today = formatDate(new Date());
  return goals[today] || null;
}

function setTodayGoal(amount) {
  const today = formatDate(new Date());
  goals[today] = Number(amount);
  saveGoals();
  renderGoals();
}

function renderGoals() {
  const goal = getTodayGoal();
  
  if (!goal) {
    els.goalDisplay.style.display = 'none';
    els.noGoalMsg.style.display = 'block';
    els.goalForm.classList.remove('active');
    return;
  }
  
  els.noGoalMsg.style.display = 'none';
  els.goalForm.classList.remove('active');
  els.goalDisplay.style.display = 'block';
  
  const today = new Date();
  const todays = entries.filter(e => isSameLocalDay(e.createdAt, today));
  const current = todays.reduce((s, e) => s + Number(e.amount || 0), 0);
  const percentage = Math.min(100, Math.round((current / goal) * 100));
  
  els.currentIntake.textContent = current;
  els.goalAmount.textContent = goal;
  els.progressFill.style.width = percentage + '%';
  els.progressText.textContent = percentage + '% complete';
}

function initGoalHandlers() {
  els.editGoalBtn.addEventListener('click', () => {
    els.goalForm.classList.add('active');
    const current = getTodayGoal();
    if (current) els.goalValue.value = current;
    els.goalValue.focus();
  });
  
  els.setGoalBtn.addEventListener('click', () => {
    const amount = els.goalValue.value.trim();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter a valid goal amount');
      return;
    }
    setTodayGoal(amount);
    els.goalForm.classList.remove('active');
    els.goalValue.value = '';
  });
}

// ============ Weekly Chart ============
function renderWeeklyChart() {
  const today = new Date();
  const chartData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayEntries = entries.filter(e => isSameLocalDay(e.createdAt, date));
    const total = dayEntries.reduce((s, e) => s + Number(e.amount || 0), 0);
    
    chartData.push({
      date: date,
      total: total,
      day: date.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }
  
  // Find max for scaling
  const max = Math.max(...chartData.map(d => d.total), 1);
  
  els.weeklyChart.innerHTML = '';
  chartData.forEach(data => {
    const height = (data.total / max) * 150;
    const html = `
      <div class="day-bar">
        <div class="bar" style="height: ${height}px;" title="${data.total} ml"></div>
        <div class="day-label">${data.day}</div>
        <div class="day-value">${data.total} ml</div>
      </div>
    `;
    els.weeklyChart.innerHTML += html;
  });
}

// ============ Entry Rendering ============
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

  // Render today's list
  renderEntryList(els.entryList, todays);
  
  // Update goals display
  renderGoals();
  
  // Update weekly chart
  renderWeeklyChart();
}

function renderEntryList(container, entriesToShow) {
  container.innerHTML = '';
  const shown = entriesToShow.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (shown.length === 0) {
    container.innerHTML = '<li class="empty">No entries. Start by logging your first glass! 🥛</li>';
    return;
  }

  shown.forEach(e => {
    const li = document.createElement('li');
    li.className = 'entry-item';

    const left = document.createElement('div');
    left.className = 'entry-left';
    left.innerHTML = `<strong>${escapeHtml(e.amount)} ml</strong>
                      <div class="muted">${escapeHtml(e.time)} • ${formatTime(e.createdAt)}</div>`;
    
    if (e.notes) {
      left.innerHTML += `<div class="notes">"${escapeHtml(e.notes)}"</div>`;
    }

    const right = document.createElement('div');
    right.className = 'entry-right';
    right.innerHTML = `<button class="btn-delete" data-id="${e.id}" title="Delete entry">Delete</button>`;

    li.appendChild(left);
    li.appendChild(right);
    container.appendChild(li);
  });

  // Attach delete handlers
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const id = ev.currentTarget.getAttribute('data-id');
      deleteEntry(id);
    });
  });
}

function renderFilteredHistory() {
  const fromStr = els.filterFromDate.value;
  const toStr = els.filterToDate.value;
  
  let filtered = entries;
  
  if (fromStr) {
    const fromDate = new Date(fromStr);
    filtered = filtered.filter(e => new Date(e.createdAt) >= fromDate);
  }
  
  if (toStr) {
    const toDate = new Date(toStr);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(e => new Date(e.createdAt) <= toDate);
  }
  
  renderEntryList(els.filteredEntryList, filtered);
}

// ============ Entry Management ============
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
  if (!confirm('Clear all today\'s entries? This cannot be undone.')) return;
  const today = new Date();
  entries = entries.filter(e => !isSameLocalDay(e.createdAt, today));
  saveEntries();
  render();
}

function exportCSV() {
  if (entries.length === 0) {
    alert('No data to export');
    return;
  }
  const header = ['id', 'amount_ml', 'time_of_day', 'notes', 'createdAt'];
  const rows = entries.map(e => [
    e.id,
    e.amount,
    `"${(e.time || '')}"`,
    `"${(String(e.notes || '').replace(/"/g, '""'))}"`,
    e.createdAt
  ].join(','));

  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `milk_entries_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ============ Event Listeners ============
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

els.clearBtn.addEventListener('click', clearAll);
els.exportBtn.addEventListener('click', exportCSV);

// Filter handlers
els.applyFilterBtn.addEventListener('click', renderFilteredHistory);
els.resetFilterBtn.addEventListener('click', () => {
  els.filterFromDate.value = '';
  els.filterToDate.value = '';
  renderFilteredHistory();
});

// ============ Initialization ============
initTheme();
initTabs();
initGoalHandlers();
render();
