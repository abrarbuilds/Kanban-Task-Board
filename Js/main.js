/* ---------- main.js ----------
   Entry point. Wires the one global control (Reset) and
   triggers the first render. Loaded last, after every
   other module is in place.
*/
 
document.getElementById('resetBtn').addEventListener('click', () => {
  if(!confirm('Reset board to default? This clears all changes.')) return;
  state = structuredClone(SEED);
  saveState();
  render();
});
 
render();