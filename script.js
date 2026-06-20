const STORAGE_KEY = 'kanban-board-v1';

const SEED = {
  columns: [
    { id:'todo', name:'To Do', cards:[] },
    { id:'inprogress', name:'In Progress', cards:[] },
    { id:'done', name:'Done', cards:[] }
  ]
};

const TAG_THEME = {
  design:'amber', ux:'amber',
  bug:'rose', frontend:'rose',
  backend:'blue', infra:'blue',
  feature:'green',
  docs:'plain', testing:'plain'
};

let state = loadState();
let cardsById = {};
let editingCardId = null;

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return structuredClone(SEED);
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function fmtDate(iso){
  if(!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {day:'numeric', month:'short'});
}

function themeFor(tags){
  for(const t of tags){
    const key = t.toLowerCase();
    if(TAG_THEME[key]) return TAG_THEME[key];
  }
  return 'plain';
}

function render(){
  cardsById = {};
  const board = document.getElementById('board');
  board.innerHTML = '';

  state.columns.forEach(col => {
    cardsById = { ...cardsById, ...Object.fromEntries(col.cards.map(c=>[c.id,c])) };

    const colEl = document.createElement('section');
    colEl.className = 'column';
    colEl.dataset.col = col.id;

    colEl.innerHTML = `
      <div class="column-head">
        <span class="col-pill"><span class="dot"></span>${col.name.toUpperCase()}</span>
        <span class="col-count">${col.cards.length}</span>
        <button class="col-add" title="Add card">+</button>
      </div>
      <div class="column-body" data-col="${col.id}"></div>
      <button class="add-card-btn">+ Add a card</button>
    `;

    const body = colEl.querySelector('.column-body');
    col.cards.forEach(card => body.appendChild(renderCard(card)));

    colEl.querySelector('.col-add').addEventListener('click', () => openModal('add', col.id));
    colEl.querySelector('.add-card-btn').addEventListener('click', () => openModal('add', col.id));

    body.addEventListener('dragover', e => {
      e.preventDefault();
      body.classList.add('drag-over');
      const dragging = document.querySelector('.dragging');
      if(!dragging) return;
      const after = getDragAfterElement(body, e.clientY);
      if(after == null) body.appendChild(dragging);
      else body.insertBefore(dragging, after);
    });
    body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
    body.addEventListener('drop', e => {
      e.preventDefault();
      body.classList.remove('drag-over');
    });

    board.appendChild(colEl);
  });

  updateStats();
}

function renderCard(card){
  const el = document.createElement('div');
  el.className = `card theme-${themeFor(card.tags)}`;
  el.draggable = true;
  el.dataset.id = card.id;

  el.innerHTML = `
    <div class="card-tags">${card.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    <h3 class="card-title">${card.title}</h3>
    <p class="card-desc">${card.desc || ''}</p>
    <div class="card-footer">
      <div class="avatar">${card.assignee || '—'}</div>
      <span class="priority ${card.priority}"><span class="dot"></span>${card.priority.toUpperCase()}</span>
      <span class="card-date">📅 ${fmtDate(card.date)}</span>
    </div>
  `;

  el.addEventListener('dragstart', () => el.classList.add('dragging'));
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    syncStateFromDOM();
    saveState();
    updateStats();
  });
  el.addEventListener('click', () => openModal('edit', null, card.id));

  return el;
}

function getDragAfterElement(container, y){
  const cards = [...container.querySelectorAll('.card:not(.dragging)')];
  return cards.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if(offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: -Infinity, element: null }).element;
}

function syncStateFromDOM(){
  state.columns.forEach(col => {
    const body = document.querySelector(`.column-body[data-col="${col.id}"]`);
    const ids = [...body.querySelectorAll('.card')].map(el => el.dataset.id);
    col.cards = ids.map(id => cardsById[id]).filter(Boolean);
  });
}

function updateStats(){
  const counts = {};
  let total = 0;
  state.columns.forEach(col => {
    counts[col.id] = col.cards.length;
    total += col.cards.length;
    const badge = document.querySelector(`.column[data-col="${col.id}"] .col-count`);
    if(badge) badge.textContent = col.cards.length;
  });
  document.getElementById('statTodo').textContent = counts.todo || 0;
  document.getElementById('statProgress').textContent = counts.inprogress || 0;
  document.getElementById('statDone').textContent = counts.done || 0;

  const pct = total ? Math.round((counts.done || 0) / total * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPct').textContent = pct + '%';
}

/* ---------- Modal logic ---------- */
const overlay = document.getElementById('overlay');
const form = document.getElementById('cardForm');
const deleteBtn = document.getElementById('deleteBtn');

function openModal(mode, columnId, cardId){
  editingCardId = mode === 'edit' ? cardId : null;
  document.getElementById('modalTitle').textContent = mode === 'edit' ? 'Edit card' : 'New card';
  deleteBtn.style.display = mode === 'edit' ? 'inline-block' : 'none';

  if(mode === 'edit'){
    const card = cardsById[cardId];
    document.getElementById('fTitle').value = card.title;
    document.getElementById('fDesc').value = card.desc || '';
    document.getElementById('fTags').value = card.tags.join(', ');
    document.getElementById('fPriority').value = card.priority;
    document.getElementById('fAssignee').value = card.assignee || '';
    document.getElementById('fDate').value = card.date || '';
    document.getElementById('fColumn').value = findColumnOf(cardId);
  } else {
    document.getElementById('fTitle').value = '';
    document.getElementById('fDesc').value = '';
    document.getElementById('fTags').value = '';
    document.getElementById('fPriority').value = 'medium';
    document.getElementById('fAssignee').value = '';
    document.getElementById('fDate').value = new Date().toISOString().slice(0,10);
    document.getElementById('fColumn').value = columnId;
  }
  overlay.classList.add('open');
  document.getElementById('fTitle').focus();
}
function closeModal(){
  overlay.classList.remove('open');
  editingCardId = null;
}
function findColumnOf(cardId){
  return state.columns.find(c => c.cards.some(card => card.id === cardId)).id;
}

document.getElementById('cancelBtn').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

form.addEventListener('submit', e => {
  e.preventDefault();
  const title = document.getElementById('fTitle').value.trim();
  if(!title) return;
  const tags = document.getElementById('fTags').value.split(',').map(t=>t.trim()).filter(Boolean);
  const payload = {
    title,
    desc: document.getElementById('fDesc').value.trim(),
    tags,
    priority: document.getElementById('fPriority').value,
    assignee: document.getElementById('fAssignee').value.trim().toUpperCase().slice(0,3),
    date: document.getElementById('fDate').value
  };
  const targetCol = document.getElementById('fColumn').value;

  if(editingCardId){
    const currentCol = findColumnOf(editingCardId);
    const card = cardsById[editingCardId];
    Object.assign(card, payload);
    if(currentCol !== targetCol){
      const fromCol = state.columns.find(c => c.id === currentCol);
      const toCol = state.columns.find(c => c.id === targetCol);
      fromCol.cards = fromCol.cards.filter(c => c.id !== editingCardId);
      toCol.cards.push(card);
    }
  } else {
    const newCard = { id: 'c' + Date.now(), ...payload };
    state.columns.find(c => c.id === targetCol).cards.push(newCard);
  }

  saveState();
  render();
  closeModal();
});

deleteBtn.addEventListener('click', () => {
  if(!editingCardId) return;
  if(!confirm('Delete this card?')) return;
  const col = state.columns.find(c => c.cards.some(card => card.id === editingCardId));
  col.cards = col.cards.filter(card => card.id !== editingCardId);
  saveState();
  render();
  closeModal();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if(!confirm('Reset board to default? This clears all changes.')) return;
  state = structuredClone(SEED);
  saveState();
  render();
});

render();