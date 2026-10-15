/* =====================================================================
   Theben motion layer — efek bergaya Lusion (tanpa library eksternal)
   - Transisi antarhalaman
   - Smooth scroll (wheel), header auto-hide
   - Reveal judul per kata & fade-up
   - Kursor label, tombol magnetik, kartu produk tilt + cahaya
   - CTA dengan produk melayang
   - Scene 3D iONprime (dimuat terpisah: lusion-scene.js)
   ===================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var REDUCE = root.classList.contains('lx-reduce');
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var MODE = window.__lxMode || 'none';
  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE = SCRIPT_SRC ? new URL('../', SCRIPT_SRC).href : '';

  var store = null;
  try { store = window.sessionStorage; } catch (e) { store = null; }
  function setStore(k, v) { try { store && store.setItem(k, v); } catch (e) { /* abaikan */ } }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------------------------------------------------------------
     Ticker bersama (satu requestAnimationFrame untuk semua efek)
     --------------------------------------------------------------- */
  var tickers = [];
  var last = performance.now();
  function onTick(fn) { tickers.push(fn); }
  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    for (var i = 0; i < tickers.length; i++) tickers[i](dt, now / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__lxTick = onTick;

  /* ---------------------------------------------------------------
     1. Transisi halaman
     --------------------------------------------------------------- */
  var readyCallbacks = [];
  var isReady = false;
  function whenReady(fn) { if (isReady) fn(); else readyCallbacks.push(fn); }
  function markReady() {
    if (isReady) return;
    isReady = true;
    readyCallbacks.forEach(function (fn) { fn(); });
  }

  function brandHTML(cls) {
    return '<span class="' + cls + '">theben<span>.</span></span>';
  }

  var curtain = null;
  function makeCurtain() {
    if (curtain) return curtain;
    curtain = document.createElement('div');
    curtain.className = 'lx-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = brandHTML('lx-curtain__brand');
    document.body.appendChild(curtain);
    return curtain;
  }

  function runEnter() {
    var c = makeCurtain();
    c.classList.add('no-anim', 'is-in');
    root.classList.remove('lx-cover');
    void c.offsetWidth;
    c.classList.remove('no-anim');
    requestAnimationFrame(function () {
      c.classList.remove('is-in');
      c.classList.add('is-out');
      setTimeout(markReady, 250);
      setTimeout(function () {
        c.classList.add('no-anim');
        c.classList.remove('is-out');
      }, 900);
    });
  }

  function isTransitionLink(a, e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if (a.target && a.target !== '_self') return false;
    if (a.hasAttribute('download') || a.dataset.lxNative !== undefined) return false;
    var url;
    try { url = new URL(a.href, location.href); } catch (err) { return false; }
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search) return false;
    if (!/(\.html?|\/)$/i.test(url.pathname)) return false;
    return url.href;
  }

  if (!REDUCE) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = isTransitionLink(a, e);
      if (!href) return;
      e.preventDefault();
      var c = makeCurtain();
      c.classList.remove('no-anim', 'is-out');
      void c.offsetWidth;
      c.classList.add('is-in');
      setStore('lx-transition', '1');
      setTimeout(function () { location.href = href; }, 720);
    });
    window.addEventListener('pageshow', function (e) {
      if (e.persisted && curtain) {
        curtain.classList.add('no-anim');
        curtain.classList.remove('is-in', 'is-out');
        root.classList.remove('lx-cover');
      }
    });
  }

  /* ---------------------------------------------------------------
     2. Smooth scroll (gaya Lenis): wheel → scroll yang di-lerp
     --------------------------------------------------------------- */
  var smooth = { target: window.scrollY, current: window.scrollY, active: false };
  window.__lxSmooth = smooth; // dipakai scene 3D untuk scroll berhenti per langkah
  function maxScroll() { return document.documentElement.scrollHeight - window.innerHeight; }

  function smoothEnabled() {
    return !REDUCE && FINE && !document.body.classList.contains('modal-open');
  }

  if (!REDUCE && FINE) {
    root.style.scrollBehavior = 'auto';
    window.addEventListener('wheel', function (e) {
      if (!smoothEnabled() || e.ctrlKey || e.defaultPrevented) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var t = e.target;
      if (t.closest && t.closest('dialog, textarea, select, [data-lx-native]')) return;
      var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
      e.preventDefault();
      if (!smooth.active) smooth.current = smooth.target = window.scrollY;
      smooth.target = clamp(smooth.target + dy, 0, maxScroll());
      smooth.active = true;
    }, { passive: false });

    window.addEventListener('scroll', function () {
      if (!smooth.active) smooth.current = smooth.target = window.scrollY;
    }, { passive: true });

    onTick(function (dt) {
      if (!smooth.active) return;
      smooth.current = lerp(smooth.current, smooth.target, 1 - Math.exp(-dt * 8.5));
      if (Math.abs(smooth.target - smooth.current) < 0.5) {
        smooth.current = smooth.target;
        smooth.active = false;
      }
      window.scrollTo(0, smooth.current);
    });

    // Link jangkar (#...) ikut smooth
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented) return;
      var id = a.getAttribute('href').slice(1);
      var el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      smooth.current = window.scrollY;
      smooth.target = clamp(el.getBoundingClientRect().top + window.scrollY - 112, 0, maxScroll());
      smooth.active = true;
      if (el.tabIndex < 0 && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) el.setAttribute('tabindex', '-1');
      setTimeout(function () { el.focus({ preventScroll: true }); }, 600);
    });
  }

  /* ---------------------------------------------------------------
     3. Header: sembunyi saat scroll turun, muncul saat naik
     --------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var toggle = document.querySelector('.menu-toggle');
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      var open = toggle && toggle.getAttribute('aria-expanded') === 'true';
      header.classList.toggle('lx-scrolled', y > 8);
      if (REDUCE || open || y < 160) header.classList.remove('lx-hide');
      else if (y > lastY + 4) header.classList.add('lx-hide');
      else if (y < lastY - 4) header.classList.remove('lx-hide');
      lastY = y;
    }, { passive: true });
    header.addEventListener('focusin', function () { header.classList.remove('lx-hide'); });
  }

  /* ---------------------------------------------------------------
     4. Reveal judul per kata + fade-up
     --------------------------------------------------------------- */
  function splitWords(el) {
    if (el.classList.contains('lx-split')) return;
    var i = 0;
    function wrapUnit(node) {
      var w = document.createElement('span');
      w.className = 'lx-w';
      var inner = document.createElement('span');
      inner.className = 'lx-wi';
      inner.style.setProperty('--i', i++);
      w.appendChild(inner);
      node.parentNode.insertBefore(w, node);
      inner.appendChild(node);
    }
    function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var parts = node.textContent.split(/(\s+)/);
          if (parts.length === 1 && !parts[0].trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var t = document.createTextNode(part);
            frag.appendChild(t);
          });
          var nodes = Array.prototype.slice.call(frag.childNodes);
          parent.replaceChild(frag, node);
          nodes.forEach(function (n) { if (n.nodeType === 3 && n.textContent !== ' ') wrapUnit(n); });
        } else if (node.nodeType === 1) {
          if (node.tagName === 'BR') return;
          var simple = !node.querySelector('img, svg, picture, video') && node.children.length === 0;
          if (simple) walk(node);
          else wrapUnit(node);
        }
      });
    }
    walk(el);
    el.classList.add('lx-split');
  }

  var io = null;
  function observe(el) {
    if (REDUCE) { el.classList.add('lx-in'); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var t = en.target;
          var gate = t.closest('.hero, .detail-hero, .page-hero');
          if (gate) whenReady(function () { t.classList.add('lx-in'); });
          else t.classList.add('lx-in');
          io.unobserve(t);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }
    io.observe(el);
  }

  function initReveals() {
    var heads = document.querySelectorAll('main h1, main h2, .lx-scene h2');
    Array.prototype.forEach.call(heads, function (h) {
      if (h.closest('dialog')) return;
      splitWords(h);
      observe(h);
    });
    var fades = document.querySelectorAll([
      'main .lead', '.hero .actions', '.hero-footnote', 'main .eyebrow',
      '.section-heading > p', '.section-heading > .text-link', '.feature-facts > div',
      '.home-product', '.product-card', '.authenticity-grid figure', '.trust-grid > span',
      '.timer-spotlight-photo', '.feature-photo', '.hero-carousel', '.authenticity-action',
      '.detail-hero .photo-slot', '.benefit-grid article'
    ].join(','));
    Array.prototype.forEach.call(fades, function (el) {
      if (el.closest('dialog') || el.closest('.lx-scene')) return;
      var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(sibs, 6) * 90 + 'ms');
      el.classList.add('lx-fade');
      observe(el);
    });
  }

  /* ---------------------------------------------------------------
     5. Kursor label, tombol magnetik, kartu tilt
     --------------------------------------------------------------- */
  var pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2, active: false };
  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true;
  }, { passive: true });
  window.__lxPointer = pointer;

  function initCursor() {
    if (REDUCE || !FINE) return;
    root.classList.add('lx-has-cursor');
    // Lingkaran kursor ("Geser" / "Lihat") dimatikan.
    // Hapus baris return di bawah ini bila ingin memunculkannya lagi.
    return;
    var c = document.createElement('div');
    c.className = 'lx-cursor is-hidden';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="lx-cursor__ring"><span></span></div>';
    document.body.appendChild(c);
    var ring = c.firstChild;
    var label = ring.firstChild;
    var rx = pointer.x, ry = pointer.y;

    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-cursor]') : null;
      c.classList.toggle('on-dark', !!(e.target.closest && e.target.closest('.lx-scene, .lx-cta')));
      if (t) { label.textContent = t.getAttribute('data-cursor'); c.classList.add('is-label'); c.classList.remove('is-hidden'); }
      else { c.classList.remove('is-label'); c.classList.add('is-hidden'); }
    });
    document.addEventListener('pointerleave', function () { c.classList.add('is-hidden'); });

    onTick(function (dt) {
      var k = 1 - Math.exp(-dt * 14);
      rx = lerp(rx, pointer.x, k);
      ry = lerp(ry, pointer.y, k);
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    });
  }

  function initMagnets() {
    if (REDUCE || !FINE) return;
    var els = document.querySelectorAll('.button, .contact-button, .carousel-button, .text-link');
    Array.prototype.forEach.call(els, function (el) {
      el.classList.add('lx-magnet');
      var strength = el.classList.contains('text-link') ? 0.18 : 0.28;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - (r.left + r.width / 2)) * strength).toFixed(1) + 'px');
        el.style.setProperty('--my', ((e.clientY - (r.top + r.height / 2)) * strength).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '0px');
        el.style.setProperty('--my', '0px');
      });
    });
  }

  function initCards() {
    var cards = document.querySelectorAll('.home-product, .product-card');
    Array.prototype.forEach.call(cards, function (card) {
      card.classList.add('lx-card');
      if (!card.hasAttribute('data-cursor')) {
        var external = card.tagName === 'A' && card.target === '_blank';
        card.setAttribute('data-cursor', external ? 'Buka ↗' : 'Lihat');
      }
      var slot = card.querySelector('.photo-slot');
      var shine = null;
      if (slot) {
        shine = document.createElement('span');
        shine.className = 'lx-shine';
        shine.setAttribute('aria-hidden', 'true');
        slot.appendChild(shine);
      }
      if (REDUCE || !FINE) return;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--rx', ((0.5 - y) * 5).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg');
        if (slot) {
          var s = slot.getBoundingClientRect();
          slot.style.setProperty('--sx', (e.clientX - s.left).toFixed(0) + 'px');
          slot.style.setProperty('--sy', (e.clientY - s.top).toFixed(0) + 'px');
        }
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
    var vp = document.querySelector('.carousel-viewport');
    if (vp && !vp.hasAttribute('data-cursor')) vp.setAttribute('data-cursor', 'Geser');
  }

  function initScrollHint() {
    var copy = document.querySelector('.hero--carousel .hero-copy');
    if (!copy) return;
    var s = document.createElement('div');
    s.className = 'lx-scroll-hint';
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<i></i>Gulir untuk menjelajah';
    copy.appendChild(s);
  }

  /* ---------------------------------------------------------------
     7. CTA: produk melayang + parallax mouse
     --------------------------------------------------------------- */
  function initCTA() {
    var cta = document.querySelector('.home-cta');
    if (!cta) return;
    cta.classList.add('lx-cta');
    var items = [
      ['pb.webp', 6, 10, 170, -8, 0.7, true],
      ['cp4.webp', 79, 6, 150, 7, 1, false],
      ['sul.webp', 85, 56, 180, -5, 0.55, false],
      ['simplexa.webp', 9, 62, 140, 9, 1.1, false],
      ['tr610.webp', 28, 80, 112, -11, 0.85, false],
      ['elpa8.jpg', 65, 78, 124, 10, 0.75, false],
      ['tr030.webp', 42, 4, 96, 4, 1.25, false]
    ];
    var wrap = document.createElement('div');
    wrap.className = 'lx-float';
    wrap.setAttribute('aria-hidden', 'true');
    items.forEach(function (it, i) {
      var d = document.createElement('div');
      d.className = 'lx-float__item' + (it[6] ? ' is-dark' : '');
      d.style.left = it[1] + '%';
      d.style.top = it[2] + '%';
      d.style.setProperty('--w', it[3] + 'px');
      d.style.setProperty('--r', it[4] + 'deg');
      d.style.setProperty('--t', (6 + i * 0.9).toFixed(1) + 's');
      d.style.setProperty('--d', i * 80 + 'ms');
      d.style.animationDelay = (-i * 1.3) + 's';
      d.dataset.depth = it[5];
      var img = document.createElement('img');
      img.src = BASE + 'assets/images/' + it[0];
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      d.appendChild(img);
      wrap.appendChild(d);
    });
    cta.insertBefore(wrap, cta.firstChild);
    observe(cta);
    if (REDUCE || !FINE) return;
    var nodes = wrap.children;
    cta.addEventListener('pointermove', function (e) {
      var r = cta.getBoundingClientRect();
      var mx = (e.clientX - r.left) / r.width - 0.5;
      var my = (e.clientY - r.top) / r.height - 0.5;
      for (var i = 0; i < nodes.length; i++) {
        var dpt = parseFloat(nodes[i].dataset.depth);
        nodes[i].style.setProperty('--px', (-mx * dpt * 70).toFixed(1) + 'px');
        nodes[i].style.setProperty('--py', (-my * dpt * 50).toFixed(1) + 'px');
      }
    });
    cta.addEventListener('pointerleave', function () {
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].style.setProperty('--px', '0px');
        nodes[i].style.setProperty('--py', '0px');
      }
    });
  }

  /* ---------------------------------------------------------------
     8. Scene 3D iONprime (hanya di beranda)
     --------------------------------------------------------------- */
  function initScene() {
    var anchor = document.querySelector('.hero--carousel');
    var after = document.querySelector('.trust-strip') || anchor;
    if (!anchor || !after) return;
    var img = BASE + 'assets/images/pb.webp';
    var sec = document.createElement('section');
    sec.className = 'lx-scene';
    sec.setAttribute('aria-label', 'iONprime PB KNX dalam 3D');
    sec.innerHTML =
      '<div class="lx-scene__sticky">' +
        '<canvas aria-hidden="true"></canvas>' +
        '<div class="lx-scene__fallback"><img src="' + img + '" alt="Keypad iONprime PB KNX" loading="lazy"></div>' +
        '<div class="lx-scene__ui">' +
          '<div class="lx-scene__intro"><span class="eyebrow">iONprime PB · KNX</span>' +
            '<h2>Satu sentuhan.<br>Seluruh ruangan.</h2></div>' +
          '<ol class="lx-scene__steps">' +
            '<li class="lx-step" style="--led:#ffe14a"><b>01</b><strong>Lampu</strong><span>Nyalakan, redupkan, dan atur suasana cahaya.</span></li>' +
            '<li class="lx-step" style="--led:#6fd35a"><b>02</b><strong>Tirai</strong><span>Buka dan tutup tirai atau blind secara otomatis.</span></li>' +
            '<li class="lx-step" style="--led:#2fc3f0"><b>03</b><strong>Suhu</strong><span>Kendalikan AC dan iklim ruangan.</span></li>' +
            '<li class="lx-step" style="--led:#ff5a4a"><b>04</b><strong>Scene</strong><span>Satu tombol untuk skenario: pagi, film, tidur.</span></li>' +
          '</ol>' +
          '<div class="lx-scene__foot"><span>8 fungsi · LED RGB · KNX</span>' +
            '<div class="lx-scene__progress"><i></i></div>' +
            '<a class="button lx-scene__cta" href="' + BASE + 'Info/pb.html">Lihat iONprime PB ↗</a></div>' +
        '</div>' +
      '</div>';
    after.parentNode.insertBefore(sec, after.nextSibling);

    if (REDUCE) sec.classList.add('is-static');
    var s = document.createElement('script');
    s.src = BASE + 'motion/lusion-scene.js?v=2';
    s.defer = true;
    document.body.appendChild(s);
  }

  /* ---------------------------------------------------------------
     Start
     --------------------------------------------------------------- */
  function boot() {
    initScene();
    initHeader();
    initScrollHint();
    initCards();
    initCTA();
    initReveals();
    initCursor();
    initMagnets();

    if (MODE === 'enter') runEnter();
    else markReady();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
