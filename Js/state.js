/* ---------- state.js ----------
   Owns: storage key, seed data, in-memory board state, load/save.
   No DOM rendering or event logic lives here.
*/

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

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function findColumnOf(cardId){
  return state.columns.find(c => c.cards.some(card => card.id === cardId)).id;
}