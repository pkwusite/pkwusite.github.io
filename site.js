(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;

  // Ruler: markers start at the baseline and travel to the result once, on load.
  if (!reduce) {
    html.classList.add('ruler-start');
    requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.remove('ruler-start'); html.classList.add('ruler-go'); }); });
  }

  // Gentle reveal as sections enter the viewport (content stays visible without JS or with reduced motion).
  if (!reduce && 'IntersectionObserver' in window) {
    html.classList.add('reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });
  }

  // Nav: active section + reading progress
  var links = [].slice.call(document.querySelectorAll('.navlinks a'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var bar = document.querySelector('.navlinks .progress');
  function nav() {
    var max = html.scrollHeight - html.clientHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    var y = window.scrollY + window.innerHeight * 0.35, cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top + window.scrollY <= y) cur = i; });
    links.forEach(function (a, i) { var on = i === cur; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }

  // Notion-style table of contents
  var toc = document.getElementById('toc'), bars = [], tlinks = [], tsecs = [];
  if (toc) {
    var rail = toc.querySelector('.rail'), menu = toc.querySelector('.menu');
    var items = [['top', 'PK Wu', 1], ['experience', 'Experience', 1], ['work', 'Projects', 1]];
    document.querySelectorAll('.proj .ptitle').forEach(function (h) { items.push([h.id, h.textContent, 2]); });
    items.push(['awards', 'Awards', 1], ['contact', 'Contact', 1]);
    items.forEach(function (it) {
      var b = document.createElement('i'); b.className = 'l' + it[2]; rail.appendChild(b); bars.push(b);
      var a = document.createElement('a'); a.href = '#' + it[0]; a.textContent = it[1]; a.className = 'l' + it[2]; menu.appendChild(a); tlinks.push(a);
      var el = document.getElementById(it[0]); tsecs.push(it[2] === 2 ? el.closest('.proj') : el);
    });
  }
  function tocSpy() {
    var y = window.scrollY + window.innerHeight * 0.35, cur = 0;
    tsecs.forEach(function (el, i) { if (el && el.getBoundingClientRect().top + window.scrollY <= y) cur = i; });
    if (window.innerHeight + window.scrollY >= html.scrollHeight - 2) cur = tsecs.length - 1;
    bars.forEach(function (b, i) { b.classList.toggle('on', i === cur); });
    tlinks.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }
  function onScroll() { nav(); tocSpy(); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Lightbox
  var lb = document.getElementById('lightbox'), li = document.getElementById('lightbox-img'), lc = document.getElementById('lightbox-cap'), last = null;
  document.querySelectorAll('.figs img, .stack img, .bcard.photo img').forEach(function (img) {
    img.classList.add('zoomable'); img.tabIndex = 0; img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Enlarge image: ' + img.alt);
    function open() {
      last = img; li.src = img.currentSrc || img.src; li.alt = img.alt;
      var fc = img.closest('figure'), cap = fc && fc.querySelector('figcaption'); lc.textContent = cap ? cap.textContent : '';
      lb.hidden = false; document.body.classList.add('noscroll'); lb.focus();
    }
    img.addEventListener('click', open);
    img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  lb.tabIndex = -1;
  function close() { lb.hidden = true; document.body.classList.remove('noscroll'); if (last) last.focus(); }
  lb.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
})();
