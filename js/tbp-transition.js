/* ============================================================
   THE BROWN PRINT — filmstrip page-wipe transition
   Vanilla JS, no dependencies. Pairs with tbp-transition.css
   ------------------------------------------------------------
   How it works:
   - Click an internal link  -> panels sweep DOWN to cover the
     screen + the destination "chapter" flashes, THEN the browser
     navigates.
   - New page loads          -> panels sweep off, revealing it.
   The handoff between the two page loads uses sessionStorage.
   ============================================================ */
(function () {
  /* ---- CONFIG: edit accents / add pages here ---- */
  var PAGES = {
    'index.html':    { label: 'Home',     num: '01', accent: '#f59e0b' },
    'wedding.html':  { label: 'Weddings', num: '02', accent: '#fb7185' },
    'wedding1.html': { label: 'Weddings', num: '02', accent: '#fb7185' },
    'music.html':    { label: 'Music',    num: '03', accent: '#a78bfa' },
    'concerts.html': { label: 'Concerts', num: '04', accent: '#fb923c' },
    'social.html':   { label: 'Social',   num: '05', accent: '#2dd4bf' },
    'brands.html':   { label: 'Brands',   num: '06', accent: '#d4b25f' }
  };
  var PANELS = 6;     // number of vertical strips
  var DUR    = 600;   // ms per panel sweep
  var STEP   = 55;    // ms stagger between panels
  var TOTAL  = DUR + (PANELS - 1) * STEP;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function base(url) {
    try { return (new URL(url, location.href).pathname.split('/').pop()) || 'index.html'; }
    catch (e) { return ''; }
  }
  var order = Object.keys(PAGES);

  /* ---- build the overlay once ---- */
  var wipe = document.createElement('div');
  wipe.className = 'tbp-wipe';
  var strip = document.createElement('div');
  strip.className = 'tbp-wipe-strip';
  var panels = [];
  for (var i = 0; i < PANELS; i++) {
    var p = document.createElement('div');
    p.className = 'tbp-panel';
    p.style.left  = (i * (100 / PANELS)) + '%';
    p.style.width = (100 / PANELS + 0.3) + '%';
    strip.appendChild(p);
    panels.push(p);
  }
  wipe.appendChild(strip);
  var content = document.createElement('div');
  content.className = 'tbp-wipe-content';
  content.innerHTML =
    '<span class="tbp-num"></span>' +
    '<span class="tbp-pre">THE BROWN PRINT PRESENTS</span>' +
    '<span class="tbp-title"></span>' +
    '<span class="tbp-line"></span>';
  wipe.appendChild(content);

  function setStagger(dir) {
    for (var i = 0; i < PANELS; i++) {
      var seat = dir > 0 ? i : (PANELS - 1 - i);
      panels[i].style.animationDelay = (seat * STEP) + 'ms';
    }
  }
  function setContent(info, dir) {
    wipe.style.setProperty('--tbp-acc', info.accent);
    content.querySelector('.tbp-num').textContent = info.num + ' / ' + String(order.length).padStart(2, '0');
    content.querySelector('.tbp-title').textContent = info.label;
    setStagger(dir);
  }

  function cover(info, dir, done) {
    setContent(info, dir);
    wipe.classList.remove('is-arrive', 'is-reveal');
    void wipe.offsetWidth;                    // reflow
    wipe.classList.add('is-active', 'is-cover');
    setTimeout(done, TOTAL + 30);
  }

  function reveal(info, dir) {
    setContent(info, dir);
    wipe.classList.add('is-active', 'is-arrive');   // sit covered, no animation
    document.documentElement.classList.remove('tbp-arriving'); // unhide the page behind panels
    void wipe.offsetWidth;                    // reflow
    wipe.classList.remove('is-arrive');
    wipe.classList.add('is-reveal');
    setTimeout(function () {
      wipe.classList.remove('is-active', 'is-reveal', 'is-cover');
    }, TOTAL + 40);
  }

  function init() {
    document.body.appendChild(wipe);
    // arriving from a wipe? play the reveal.
    if (sessionStorage.getItem('tbp-wipe')) {
      sessionStorage.removeItem('tbp-wipe');
      var dir  = sessionStorage.getItem('tbp-dir') === 'back' ? -1 : 1;
      var here = PAGES[base(location.href)];
      if (here) reveal(here, dir);
      else document.documentElement.classList.remove('tbp-arriving');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* ---- intercept internal navigation ---- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    var dest;
    try { dest = new URL(a.href, location.href); } catch (_) { return; }
    if (dest.origin !== location.origin) return;

    var bn = base(a.href);
    var info = PAGES[bn];
    if (!info) return;                          // untracked link -> let it navigate normally
    if (bn === base(location.href)) return;     // same page

    e.preventDefault();
    var dir = order.indexOf(bn) > order.indexOf(base(location.href)) ? 1 : -1;
    sessionStorage.setItem('tbp-wipe', '1');
    sessionStorage.setItem('tbp-dir', dir > 0 ? 'fwd' : 'back');
    cover(info, dir, function () { location.href = a.href; });
  });
})();
