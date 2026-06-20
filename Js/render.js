/* ---------- render.js ----------
   Owns: turning `state` into DOM, and the stats/progress readout.
   Reads from state.js globals (state, cardsById, TAG_THEME).
   Drag listeners attached here call into dragdrop.js helpers.
*/

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