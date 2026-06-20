/* ---------- modal.js ----------
   Owns: the add/edit card modal — opening it, filling it,
   saving the form back into state, and deleting a card.
*/

const todayISO = new Date().toISOString().slice(0,10);
document.getElementById('fDate').min = todayISO;

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
    document.getElementById('fDate').value = todayISO;
    document.getElementById('fColumn').value = columnId;
  }
  overlay.classList.add('open');
  document.getElementById('fTitle').focus();
}

function closeModal(){
  overlay.classList.remove('open');
  editingCardId = null;
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