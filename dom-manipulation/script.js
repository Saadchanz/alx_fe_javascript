/**
 * Dynamic Quote Generator
 * - Advanced DOM manipulation
 * - localStorage & sessionStorage
 * - JSON import/export
 * - category filtering persisted across sessions
 * - simulated server sync (JSONPlaceholder) with server-wins conflict resolution
 *
 * Put index.html, styles.css and this script in same folder.
 */

/* ---------- Storage keys ---------- */
const STORAGE_KEY = 'dqg_quotes_v1';
const FILTER_KEY = 'dqg_lastFilter_v1';
const SESSION_LAST_QUOTE = 'dqg_lastQuote_session';

/* ---------- DOM elements ---------- */
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteBtn = document.getElementById('newQuote');
const showAllBtn = document.getElementById('showAll');
const quoteListEl = document.getElementById('quoteList');
const categoryFilter = document.getElementById('categoryFilter');
const exportJsonBtn = document.getElementById('exportJson');
const importFileInput = document.getElementById('importFile');
const addForm = document.getElementById('addForm');
const newQuoteText = document.getElementById('newQuoteText');
const newQuoteCategory = document.getElementById('newQuoteCategory');
const notifications = document.getElementById('notifications');
const syncNowBtn = document.getElementById('syncNow');

/* ---------- In-memory data ---------- */
let quotes = []; // array of { id, text, category, lastModified }
let backupBeforeSync = null;

/* ---------- Utility helpers ---------- */
function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 10);
}
function nowIso() {
  return new Date().toISOString();
}
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  populateCategories();
  renderQuoteList(); // live update
}
function loadQuotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      quotes = parsed;
      return quotes;
    }
  } catch (e) {
    console.error('Failed to parse saved quotes', e);
  }
  return null;
}
function notify(html, timeout = 8000) {
  const n = document.createElement('div');
  n.className = 'notification';
  n.innerHTML = `<div>${html}</div>`;
  notifications.appendChild(n);
  if (timeout) setTimeout(() => { n.remove(); }, timeout);
  return n;
}

/* ---------- Initial sample quotes (used only if no saved quotes) ---------- */
const sampleQuotes = [
  { id: uid(), text: "The secret of getting ahead is getting started.", category: "Motivation", lastModified: nowIso() },
  { id: uid(), text: "Simplicity is the ultimate sophistication.", category: "Philosophy", lastModified: nowIso() },
  { id: uid(), text: "Do what you can, with what you have, where you are.", category: "Motivation", lastModified: nowIso() },
  { id: uid(), text: "An investment in knowledge pays the best interest.", category: "Learning", lastModified: nowIso() }
];

/* ---------- DOM: populate categories ---------- */
function populateCategories() {
  const existing = new Set(quotes.map(q => q.category));
  const saved = categoryFilter.value || localStorage.getItem(FILTER_KEY) || 'all';

  // clear dropdown
  while (categoryFilter.firstChild) categoryFilter.removeChild(categoryFilter.firstChild);
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'All Categories';
  categoryFilter.appendChild(optAll);

  Array.from(existing).sort().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  // restore last selected filter
  const last = localStorage.getItem(FILTER_KEY) || 'all';
  categoryFilter.value = last;
}

/* ---------- Show a random quote for the selected category ---------- */
function showRandomQuote() {
  const filter = categoryFilter.value || 'all';
  const pool = (filter === 'all') ? quotes : quotes.filter(q => q.category === filter);
  if (!pool.length) {
    quoteDisplay.textContent = "No quotes available for this category.";
    return;
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  renderQuote(q);
  // save last shown quote in sessionStorage
  sessionStorage.setItem(SESSION_LAST_QUOTE, JSON.stringify(q));
}

/* ---------- Render a quote into main display ---------- */
function renderQuote(q) {
  quoteDisplay.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = q.text;
  p.style.fontWeight = '600';
  const meta = document.createElement('div');
  meta.className = 'small';
  meta.textContent = `${q.category} • last updated ${new Date(q.lastModified).toLocaleString()}`;
  // action buttons
  const actions = document.createElement('div');
  actions.style.marginTop = '10px';
  const editBtn = document.createElement('button');
  editBtn.className = 'btn-link';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', () => startEditQuote(q.id));
  const delBtn = document.createElement('button');
  delBtn.className = 'btn-link';
  delBtn.textContent = 'Delete';
  delBtn.addEventListener('click', () => deleteQuote(q.id));
  actions.append(editBtn, delBtn);

  quoteDisplay.appendChild(p);
  quoteDisplay.appendChild(meta);
  quoteDisplay.appendChild(actions);
}

/* ---------- Render list of quotes (filtered) ---------- */
function renderQuoteList() {
  quoteListEl.innerHTML = '';
  quoteListEl.hidden = false;
  const filter = categoryFilter.value || 'all';
  const items = (filter === 'all') ? quotes : quotes.filter(q => q.category === filter);
  if (!items.length) {
    const e = document.createElement('div');
    e.className = 'small';
    e.textContent = 'No quotes to show.';
    quoteListEl.appendChild(e);
    return;
  }
  items.slice().sort((a,b)=>a.category.localeCompare(b.category)).forEach(q => {
    const el = document.createElement('div');
    el.className = 'quote-item';
    const left = document.createElement('div');
    left.innerHTML = `<div>${q.text}</div><div class="meta">${q.category} • ${new Date(q.lastModified).toLocaleString()}</div>`;
    const right = document.createElement('div');
    const useBtn = document.createElement('button');
    useBtn.className = 'btn-link';
    useBtn.textContent = 'Show';
    useBtn.addEventListener('click', () => renderQuote(q));
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-link';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEditQuote(q.id));
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-link';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteQuote(q.id));
    right.append(useBtn, editBtn, delBtn);
    el.append(left, right);
    quoteListEl.appendChild(el);
  });
}

/* ---------- Add a new quote (called from form) ---------- */
function addQuote(text, category) {
  const q = {
    id: uid(),
    text: text.trim(),
    category: category.trim(),
    lastModified: nowIso()
  };
  quotes.push(q);
  saveQuotes();
  notify(`Quote added in category "${q.category}"`, 4000);
  // update dropdown if new category
  populateCategories();
  // show the newly added quote
  renderQuote(q);
}

/* ---------- startEditQuote: create inline edit UI ---------- */
function startEditQuote(id) {
  const idx = quotes.findIndex(q => q.id === id);
  if (idx === -1) return;
  const q = quotes[idx];

  // replace quoteDisplay with edit form
  quoteDisplay.innerHTML = '';
  const txt = document.createElement('input');
  txt.type = 'text';
  txt.value = q.text;
  txt.style.width = '100%';
  const cat = document.createElement('input');
  cat.type = 'text';
  cat.value = q.category;
  cat.style.marginTop = '8px';
  cat.style.width = '100%';
  const save = document.createElement('button');
  save.textContent = 'Save';
  save.style.marginTop = '8px';
  save.addEventListener('click', () => {
    q.text = txt.value.trim() || q.text;
    q.category = cat.value.trim() || q.category;
    q.lastModified = nowIso();
    quotes[idx] = q;
    saveQuotes();
    notify('Quote updated', 3000);
    renderQuote(q);
  });
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.style.marginLeft = '8px';
  cancel.addEventListener('click', () => renderQuote(q));

  quoteDisplay.append(txt, cat, save, cancel);
}

/* ---------- deleteQuote ---------- */
function deleteQuote(id) {
  const i = quotes.findIndex(q => q.id === id);
  if (i === -1) return;
  const removed = quotes.splice(i,1)[0];
  saveQuotes();
  notify(`Deleted quote: "${removed.text.slice(0,60)}..."`, 3500);
  quoteDisplay.textContent = 'Quote deleted.';
}

/* ---------- JSON Export ---------- */
function exportToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dqg_quotes_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------- JSON Import ---------- */
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('JSON must be an array of quote objects');
      // normalize & merge
      const prepared = imported.map(item => ({
        id: item.id || uid(),
        text: item.text || '',
        category: item.category || 'Uncategorized',
        lastModified: item.lastModified || nowIso()
      }));
      quotes.push(...prepared);
      saveQuotes();
      notify(`Imported ${prepared.length} quotes`, 4000);
    } catch (err) {
      notify(`Import failed: ${err.message}`, 6000);
    } finally {
      importFileInput.value = ''; // clear input so same file can be re-imported if desired
    }
  };
  reader.readAsText(file);
}

/* ---------- Filtering logic ---------- */
function filterQuotes() {
  const sel = categoryFilter.value || 'all';
  localStorage.setItem(FILTER_KEY, sel);
  populateCategories(); // ensure options up to date
  renderQuoteList();
}

/* ---------- Session: restore last shown quote ---------- */
function restoreSessionLastQuote() {
  const raw = sessionStorage.getItem(SESSION_LAST_QUOTE);
  if (!raw) return;
  try {
    const q = JSON.parse(raw);
    if (q && q.text) renderQuote(q);
  } catch (_) {}
}

/* ---------- Simulated server sync ---------- */

/**
 * simulateFetchFromServer:
 * Uses JSONPlaceholder posts endpoint to fetch some "server quotes".
 * Maps posts to quote objects (category: 'server' + userId)
 * For a real app, replace URL with your server endpoint.
 */
async function simulateFetchFromServer() {
  const endpoint = 'https://jsonplaceholder.typicode.com/posts?_limit=5';
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('Failed to fetch simulated server data');
  const data = await res.json();

  // map to our quote shape
  return data.map(post => ({
    id: 'srv-' + post.id,
    text: (post.title || post.body || '').slice(0, 220),
    category: `server-${post.userId}`,
    lastModified: nowIso()
  }));
}

/* Conflict resolution strategy:
 * - We keep local quotes as-is except when server has an item with same id -> server wins (replace)
 * - If server introduces new id, we add it
 * - Before applying server changes, we keep a backup to allow undo
 */
async function syncWithServer() {
  notify('Syncing with server...', 2000);
  try {
    const serverQuotes = await simulateFetchFromServer();

    // backup local before changes
    backupBeforeSync = JSON.parse(JSON.stringify(quotes));

    // merge: create a map by id
    const localMap = new Map(quotes.map(q => [q.id, q]));
    let applied = 0;
    serverQuotes.forEach(sq => {
      const local = localMap.get(sq.id);
      if (local) {
        // conflict -> server wins (replace entire object)
        localMap.set(sq.id, sq);
        applied++;
      } else {
        localMap.set(sq.id, sq);
        applied++;
      }
    });

    // result -> array
    quotes = Array.from(localMap.values());
    saveQuotes();

    const n = serverQuotes.length;
    const message = `Applied ${applied} server updates (${n} items fetched). Server changes take precedence.`;
    const nEl = notify(`${message} <button id="undoSyncBtn" class="btn-link">Undo</button>`, 10000);
    // wire undo button
    const undoBtn = nEl.querySelector('#undoSyncBtn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        if (!backupBeforeSync) return;
        quotes = backupBeforeSync;
        saveQuotes();
        notify('Sync undone. Local state restored.', 4000);
      });
    }
  } catch (err) {
    notify(`Sync failed: ${err.message}`, 5000);
  }
}

/* ---------- Auto-sync setup ---------- */
let syncIntervalId = null;
function startAutoSync(intervalMs = 60000) { // default 60s
  if (syncIntervalId) clearInterval(syncIntervalId);
  syncIntervalId = setInterval(() => {
    syncWithServer();
  }, intervalMs);
}

/* ---------- Wiring UI ---------- */
newQuoteBtn.addEventListener('click', showRandomQuote);
showAllBtn.addEventListener('click', () => {
  renderQuoteList();
});
categoryFilter.addEventListener('change', filterQuotes);
exportJsonBtn.addEventListener('click', exportToJson);
importFileInput.addEventListener('change', importFromJsonFile);
addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = newQuoteText.value;
  const cat = newQuoteCategory.value || 'Uncategorized';
  if (!text.trim()) {
    notify('Please enter quote text', 3000);
    return;
  }
  addQuote(text, cat);
  newQuoteText.value = '';
  newQuoteCategory.value = '';
});
syncNowBtn.addEventListener('click', syncWithServer);

/* ---------- Boot (initialize) ---------- */
(function boot() {
  const loaded = loadQuotes();
  if (!loaded) {
    quotes = sampleQuotes.slice();
    saveQuotes();
  }
  populateCategories();
  // restore last filter selection
  const lastFilter = localStorage.getItem(FILTER_KEY) || 'all';
  categoryFilter.value = lastFilter;
  // restore last seen quote in session
  restoreSessionLastQuote();

  // show a random quote at boot for friendly UX
  showRandomQuote();

  // start auto-sync (simulation)
  startAutoSync(120000); // every 2 minutes to be less aggressive in dev
})();
