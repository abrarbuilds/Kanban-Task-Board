/* ---------- dragdrop.js ----------
   Owns: HTML5 Drag and Drop helpers.
   getDragAfterElement = classic DnD reorder-position calculation.
   syncStateFromDOM = after a drag finishes, re-read column order
   from the live DOM and write it back into `state`.
*/

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