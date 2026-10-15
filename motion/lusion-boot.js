/* Theben motion — boot (blocking, tiny).
   Runs in <head> before first paint so the page-transition cover
   is visible immediately and the page never flashes underneath it. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('lx-js');
  if (reduce) { root.classList.add('lx-reduce'); return; }

  var store = null;
  try { store = window.sessionStorage; } catch (e) { store = null; }

  var mode = 'none';
  try {
    if (store && store.getItem('lx-transition') === '1') {
      mode = 'enter';
      store.removeItem('lx-transition');
    }
  } catch (e) { mode = 'none'; }

  if (mode !== 'none') {
    root.classList.add('lx-cover', 'lx-mode-' + mode);
    // Safety net: never leave the page covered if the main script fails.
    setTimeout(function () { root.classList.remove('lx-cover'); }, 6000);
  }
  window.__lxMode = mode;
})();
