(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var html = document.documentElement;

  // Hero entrance: photo unveils from the bottom, text rises in sequence.
  if (!reduce) {
    html.classList.add('hero-start');
    requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.remove('hero-start'); html.classList.add('hero-go'); }); });
  }

  // Scroll-linked motion: zones settle into place, headings fill in word by word,
  // the hero photo drifts slower than the page. Everything is computed from scroll position.
  if (!reduce) {
    html.classList.add('motion');
    var zones = [].slice.call(document.querySelectorAll('.zone, .contact'));
    var heads = [].slice.call(document.querySelectorAll('.zone-head h2, .contact-head h2')).map(function (h) { return { el: h, w: [].slice.call(h.querySelectorAll('.w')) }; });
    var photo = document.querySelector('.photo-card img');
    var wide = window.matchMedia('(min-width: 900px)');
    var ticking = false;
    function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      zones.forEach(function (z) {
        var t = z.getBoundingClientRect().top;
        var p = clamp((vh - t) / (vh * 0.5));
        var k = wide.matches ? 1 : 0.5;
        z.style.transform = 'translateY(' + ((1 - p) * 80 * k).toFixed(1) + 'px) scale(' + (0.965 + 0.035 * p).toFixed(4) + ')';
      });
      heads.forEach(function (h) {
        var t = h.el.getBoundingClientRect().top;
        var p = clamp((vh * 0.9 - t) / (vh * 0.4));
        var n = h.w.length, lit = Math.round(p * n);
        h.w.forEach(function (w, i) { w.classList.toggle('lit', i < lit); });
      });
      if (photo && wide.matches) {
        var y = Math.min(window.scrollY, vh);
        photo.style.transform = 'translateY(' + (y * 0.12).toFixed(1) + 'px) scale(1.08)';
      } else if (photo) { photo.style.transform = ''; }
    }
    function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    frame();
  }

  // Award photos fan out from a stack when they come into view.
  var stack = document.querySelector('.stack');
  if (stack) {
    if (reduce || !('IntersectionObserver' in window)) stack.classList.add('fanned');
    else {
      stack.classList.add('stacked');
      var so = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { stack.classList.remove('stacked'); stack.classList.add('fanned'); so.disconnect(); } }); }, { threshold: 0.45 });
      so.observe(stack);
    }
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
