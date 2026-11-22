/*
 * Sumit portfolio: all behaviour lives in this one file so the Content Security Policy can
 * forbid inline scripts (script-src 'self'). Nothing here uses innerHTML, eval or inline styles
 * set as attributes; styles are changed through the CSSOM, which the CSP allows.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine = !!(window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches);

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* animation delays come from data attributes */
  $$('[data-d]').forEach(function (el) { el.style.setProperty('--d', el.getAttribute('data-d')); });
  $$('[data-base]').forEach(function (el) { el.style.setProperty('--base', el.getAttribute('data-base') + 'ms'); });
  $$('#m-menu a').forEach(function (a, i) { a.style.setProperty('--i', i); });

  /* split headings into words that slide up from a mask */
  function split(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part; wi.style.setProperty('--i', i++);
            w.appendChild(wi); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    })(el);
  }
  $$('[data-split]').forEach(split);
  $$('[data-stagger]').forEach(function (p) {
    Array.prototype.slice.call(p.children).forEach(function (c, i) {
      c.setAttribute('data-reveal', ''); c.style.setProperty('--d', i * 70);
    });
  });

  /* reveal on scroll */
  var revealEls = $$('[data-reveal],[data-split]:not([data-hero])');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add('in'); }); }

  /* page intro once the fonts have settled */
  function start() {
    root.classList.add('ready');
    $$('[data-hero]').forEach(function (h) { h.classList.add('in'); });
    placeInd(true);
  }
  var fontsReady = (document.fonts && document.fonts.ready)
    ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })])
    : Promise.resolve();
  fontsReady.then(function () { requestAnimationFrame(start); });

  /* smooth anchor scrolling */
  var anim = 0;
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function scrollToY(y) {
    cancelAnimationFrame(anim);
    var s = window.scrollY, d = y - s;
    if (reduce || Math.abs(d) < 2) { window.scrollTo(0, y); return; }
    var dur = clamp(Math.abs(d) * 0.5, 800, 1600), t0 = performance.now();
    (function step(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      window.scrollTo(0, s + d * ease(p));
      if (p < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    addEventListener(ev, function () { cancelAnimationFrame(anim); }, { passive: true });
  });

  var burger = $('#burger');
  function closeMenu() { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var o = document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(o));
  });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), t = id && document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      var wasOpen = document.body.classList.contains('menu-open'); closeMenu();
      var y = id === 'home' ? 0 : Math.max(0, t.getBoundingClientRect().top + window.scrollY - (t.classList.contains('panel') ? 12 : 28));
      setTimeout(function () { scrollToY(y); }, wasOpen ? 350 : 0);
    });
  });

  /* nav: sliding indicator, scrollspy, colour tone */
  var pill = $('#pill'), ind = $('#ind'), links = $$('#pill a'), nav = $('#nav');
  var secs = ['home', 'about', 'experience', 'skills', 'certificates', 'contact'].map(function (id) { return document.getElementById(id); });
  var activeId = null, tone = 'dark';
  function placeInd(snap) {
    var a = links.filter(function (l) { return l.dataset.link === activeId; })[0];
    if (!a) { ind.style.opacity = 0; return; }
    var r = a.getBoundingClientRect(), p = pill.getBoundingClientRect();
    if (!p.width) return;
    if (snap || ind.style.opacity === '0' || ind.style.opacity === '') ind.classList.add('snap');
    ind.style.width = r.width + 'px';
    ind.style.transform = 'translateX(' + (r.left - p.left - 1) + 'px)';
    ind.style.opacity = 1;
    if (ind.classList.contains('snap')) { void ind.offsetWidth; requestAnimationFrame(function () { ind.classList.remove('snap'); }); }
  }
  addEventListener('resize', function () { placeInd(true); });

  function spy(vh) {
    var cur = null;
    secs.forEach(function (s) { if (s.getBoundingClientRect().top <= vh * 0.45) cur = s.id; });
    if (cur !== activeId) {
      activeId = cur;
      links.forEach(function (l) { l.setAttribute('aria-current', String(l.dataset.link === cur)); });
      placeInd(false);
    }
    var t = 'light';
    for (var i = 0; i < secs.length; i++) {
      var r = secs[i].getBoundingClientRect();
      if (r.top <= 40 && r.bottom > 40) {
        if (secs[i].id === 'home') { if (r.bottom - 40 > r.height * 0.3) t = 'dark'; }
        else if (secs[i].dataset.tone === 'dark') { t = 'dark'; }
        break;
      }
    }
    if (t !== tone) { tone = t; nav.dataset.tone = t; }
  }

  /* hover effects (mouse only) */
  var heroEl = $('#home'), dotsHi = $('#dotsHi'), heroInner = $('#heroInner'), heroBg = $('#heroBg'), cue = $('#cue');
  var mx = innerWidth * 0.5, my = innerHeight * 0.3, tx = mx, ty = my, lastMove = -1e9, heroVis = true;
  if (fine) {
    heroEl.addEventListener('pointermove', function (e) {
      var r = heroEl.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; lastMove = performance.now();
    });
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    $$('.card,.cert').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--x', (e.clientX - r.left) + 'px'); el.style.setProperty('--y', (e.clientY - r.top) + 'px');
      });
    });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; }, { threshold: 0 }).observe(heroEl);
  }

  /* one animation loop: nav state, hero light, portrait parallax */
  var frame = $('#frame'), frameImg = $('#frameImg'), portrait = $('#portrait');
  var pCur = { ty: 0, rot: -5, iy: 0 }, lastY = -1, lastW = 0;
  function tick(now) {
    var y = window.scrollY, vh = innerHeight;
    if (y !== lastY || vh !== lastW) { spy(vh); lastY = y; lastW = vh; nav.classList.toggle('scrolled', y > 60); }
    if (!reduce) {
      if (heroVis) {
        if (now - lastMove > 2600) { var k = now / 1000; tx = innerWidth * (0.5 + 0.28 * Math.sin(k * 0.5)); ty = vh * (0.26 + 0.14 * Math.cos(k * 0.7)); }
        mx += (tx - mx) * 0.07; my += (ty - my) * 0.07;
        dotsHi.style.setProperty('--mx', mx.toFixed(1) + 'px'); dotsHi.style.setProperty('--my', my.toFixed(1) + 'px');
        var hh = heroEl.offsetHeight || vh, p = clamp(y / (hh * 0.8), 0, 1);
        heroInner.style.transform = 'translate3d(0,' + (y * 0.2).toFixed(1) + 'px,0)';
        heroInner.style.opacity = (1 - p * 1.15).toFixed(3);
        heroBg.style.transform = 'translate3d(0,' + (y * 0.08).toFixed(1) + 'px,0)';
        cue.style.opacity = y > 60 ? 0 : '';
      }
      var r = portrait.getBoundingClientRect();
      if (r.bottom > -100 && r.top < vh + 100) {
        var off = (r.top + r.height / 2 - vh / 2) / vh;
        var tTy = clamp(off, -1.2, 1.2) * -38, tRot = -5 * clamp(Math.abs(off) * 1.6, 0, 1), tIy = clamp(off, -1.2, 1.2) * -26;
        pCur.ty += (tTy - pCur.ty) * 0.1; pCur.rot += (tRot - pCur.rot) * 0.1; pCur.iy += (tIy - pCur.iy) * 0.1;
        frame.style.transform = 'translate3d(0,' + pCur.ty.toFixed(2) + 'px,0) rotate(' + pCur.rot.toFixed(2) + 'deg)';
        frameImg.style.transform = 'translate3d(0,' + pCur.iy.toFixed(2) + 'px,0) scale(1.12)';
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* certificate filter (cards glide to their new place) */
  var chips = $$('#filters button'), cards = $$('#certs .cert');
  chips.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.f;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
      var first = new Map();
      cards.forEach(function (c) { if (!c.hidden) first.set(c, c.getBoundingClientRect()); });
      cards.forEach(function (c) { c.hidden = !(f === 'all' || c.dataset.cat === f); if (!c.hidden) c.classList.add('in'); });
      if (reduce || !cards[0].animate) return;
      cards.forEach(function (c, i) {
        if (c.hidden) return;
        var r = c.getBoundingClientRect(), p = first.get(c);
        if (p) { c.animate([{ transform: 'translate(' + (p.left - r.left) + 'px,' + (p.top - r.top) + 'px)' }, { transform: 'none' }], { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)' }); }
        else { c.animate([{ opacity: 0, transform: 'translateY(22px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: i * 40, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }); }
      });
    });
  });

  /* certificate viewer (native <dialog>, so focus is trapped and Esc closes it) */
  var dlg = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  var lbList = [], lbIdx = 0, lastTrigger = null;
  function showLb(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    var a = lbList[lbIdx], li = a.closest('.cert'), im = $('img', a);
    lbImg.src = a.getAttribute('href');
    lbImg.alt = im ? im.alt : '';
    lbCap.textContent = li.dataset.title + ' | ' + li.dataset.sub;
    lbCount.textContent = (lbIdx + 1) + ' / ' + lbList.length;
    var nxt = new Image(); nxt.src = lbList[(lbIdx + 1) % lbList.length].getAttribute('href');
  }
  function openLb(a) {
    if (!dlg || typeof dlg.showModal !== 'function') return false;
    lbList = $$('#certs .cert:not([hidden]) a[data-full]');
    lastTrigger = a; showLb(lbList.indexOf(a));
    dlg.showModal(); document.body.classList.add('lb-open');
    if (!reduce && dlg.animate) {
      dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'cubic-bezier(.16,1,.3,1)' });
      $('.lb-fig', dlg).animate([{ opacity: 0, transform: 'translateY(24px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    return true;
  }
  if (dlg) {
    $$('#certs a[data-full]').forEach(function (a) {
      a.addEventListener('click', function (e) { if (openLb(a)) e.preventDefault(); });
    });
    $$('#certs .cert').forEach(function (li) {
      li.addEventListener('click', function (e) {
        if (e.target.closest('a,button')) return;
        var a = $('a[data-full]', li); if (a) a.click();
      });
    });
    dlg.addEventListener('click', function (e) { if (!e.target.closest('.lb-fig,.lb-bar,.lb-close')) dlg.close(); });
    dlg.addEventListener('close', function () {
      document.body.classList.remove('lb-open');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
    $('#lbClose').addEventListener('click', function () { dlg.close(); });
    $('#lbPrev').addEventListener('click', function () { showLb(lbIdx - 1); });
    $('#lbNext').addEventListener('click', function () { showLb(lbIdx + 1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') showLb(lbIdx + 1);
      else if (e.key === 'ArrowLeft') showLb(lbIdx - 1);
    });
  }

  /* email: assembled here so bots reading the HTML do not collect it */
  var mail = $('#mail'), copy = $('#copy'), mailBtn = $('#mailBtn'), copyTimer = 0;
  if (mail && copy && mailBtn) {
    var addr = mail.getAttribute('data-u') + '@' + mail.getAttribute('data-d');
    mail.textContent = addr;
    mailBtn.setAttribute('href', 'mailto:' + addr);
    mailBtn.hidden = false; copy.hidden = false;
    copy.addEventListener('click', function () {
      function done(msg) { copy.textContent = msg; clearTimeout(copyTimer); copyTimer = setTimeout(function () { copy.textContent = 'Copy email'; }, 2200); }
      function select() {
        var rg = document.createRange(); rg.selectNodeContents(mail);
        var s = getSelection(); s.removeAllRanges(); s.addRange(rg); done('Selected, press copy');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(addr).then(function () { done('Copied'); }, select); }
      else { select(); }
    });
  }
})();
