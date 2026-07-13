// Daily Milk App - Main Application Logic

class MilkTracker {
    constructor() {
        this.storageKey = 'milkAppData';
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const form = document.getElementById('milkForm');
        const clearBtn = document.getElementById('clearBtn');
        const exportBtn = document.getElementById('exportBtn');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        clearBtn.addEventListener('click', () => this.clearAll());
        exportBtn.addEventListener('click', () => this.exportData());
    }

    handleSubmit(e) {
        e.preventDefault();

        const amount = parseInt(document.getElementById('amount').value);
        const time = document.getElementById('time').value;
        const notes = document.getElementById('notes').value;

        if (!amount || !time) {
            alert('Please fill in all required fields');
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (!this.data[today]) {
            this.data[today] = [];
        }

        const entry = {
            id: Date.now(),
            amount: amount,
            time: time,
            notes: notes,
            timestamp: new Date().toLocaleTimeString()
        };

        this.data[today].push(entry);
        this.saveData();
        this.render();

        // Reset form
        document.getElementById('milkForm').reset();
    }

    deleteEntry(id) {
        const today = new Date().toISOString().split('T')[0];
        if (this.data[today]) {
            this.data[today] = this.data[today].filter(entry => entry.id !== id);
            this.saveData();
            this.render();
        }
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all entries for today?')) {
            const today = new Date().toISOString().split('T')[0];
            this.data[today] = [];
            this.saveData();
            this.render();
        }
    }

    exportData() {
        const today = new Date().toISOString().split('T')[0];
        const entries = this.data[today] || [];
        const json = JSON.stringify(entries, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `milk-data-${today}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    calculateStats() {
        const today = new Date().toISOString().split('T')[0];
        const entries = this.data[today] || [];

        if (entries.length === 0) {
            return { total: 0, count: 0, average: 0 };
        }

        const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
        const count = entries.length;
        const average = Math.round(total / count);

        return { total, count, average };
    }

    render() {
        this.renderStats();
        this.renderEntries();
    }

    renderStats() {
        const stats = this.calculateStats();
        document.getElementById('totalToday').textContent = `${stats.total} ml`;
        document.getElementById('servingsToday').textContent = stats.count;
        document.getElementById('averageToday').textContent = `${stats.average} ml`;
    }

    renderEntries() {
        const today = new Date().toISOString().split('T')[0];
        const entries = this.data[today] || [];
        const entryList = document.getElementById('entryList');

        if (entries.length === 0) {
            entryList.innerHTML = '<div class="empty-state"><p>No entries yet. Start tracking your milk consumption!</p></div>';
            return;
        }

        // Sort entries by time added (most recent first)
        const sortedEntries = [...entries].reverse();

        entryList.innerHTML = sortedEntries.map(entry => `
            <li class="entry-item">
                <div class="entry-info">
                    <h4>${this.capitalizeFirstLetter(entry.time)}</h4>
                    <p>${entry.timestamp}</p>
                    ${entry.notes ? `<p><em>${entry.notes}</em></p>` : ''}
                </div>
                <div class="entry-amount">${entry.amount} ml</div>
                <button class="btn-delete" onclick="app.deleteEntry(${entry.id})">Delete</button>
            </li>
        `).join('');
    }

    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    loadData() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : {};
    }
}

// Initialize app
const app = new MilkTracker();
