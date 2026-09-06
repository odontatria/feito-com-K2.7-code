(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- MENU MOBILE ---------- */
  var nav = $('#mainNav'), toggle = $('#navToggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  /* ---------- SCROLL: HEADER + BOTÃO TOPO + PARALLAX ---------- */
  var header = $('#siteHeader'), toTop = $('#toTop'), heroBg = $('#heroBg'), ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 60);
    if (toTop) toTop.classList.toggle('show', y > 600);
    if (heroBg && y < window.innerHeight) {
      heroBg.style.transform = 'scale(1.08) translateY(' + (y * 0.25) + 'px)';
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- HERO SLIDER ---------- */
  (function heroSlider() {
    var bg = $('#heroBg');
    if (!bg) return;

    var raw = bg.getAttribute('data-hero-images') || '';
    var imgs = raw.split('|').map(function (s) { return s.trim(); }).filter(Boolean);
    var dotsBox = $('#heroDots');

    if (imgs.length < 2) {
      if (dotsBox) dotsBox.remove();
      bg.classList.add('is-visible');
      return;
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var idx = 0, timer = null;

    function paint(i) {
      idx = (i + imgs.length) % imgs.length;
      bg.classList.remove('is-visible');
      var img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = function () {
        bg.style.backgroundImage = 'url("' + imgs[idx] + '")';
        requestAnimationFrame(function () { bg.classList.add('is-visible'); });
      };
      img.src = imgs[idx];
      if (dotsBox) {
        $$('button', dotsBox).forEach(function (b, n) {
          b.setAttribute('aria-selected', String(n === idx));
        });
      }
    }

    function restart() {
      clearInterval(timer);
      if (!reduced) timer = setInterval(function () { paint(idx + 1); }, 6500);
    }

    if (dotsBox) {
      dotsBox.innerHTML = '';
      imgs.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Slide ' + (i + 1));
        b.setAttribute('aria-selected', String(i === 0));
        b.addEventListener('click', function () { paint(i); restart(); });
        dotsBox.appendChild(b);
      });
    }

    paint(0);
    restart();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer); else restart();
    });
  })();

  /* ---------- TILT NOS CARDS ---------- */
  function addTilt(selector) {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    $$(selector).forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(1000px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 6) + 'deg) translateY(-8px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }
  addTilt('.feature-card');
  addTilt('.plan');
  addTilt('.testimonial');

  /* ---------- STAGGER NOS GRIDS ---------- */
  $$('.features-grid,.plans-grid,.testimonials-grid,.stats-grid,.veja-tambem-grid').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) {
      c.style.transitionDelay = Math.min(i * 90, 540) + 'ms';
    });
  });

  /* ---------- FALLBACK SEM INTERSECTIONOBSERVER ---------- */
  if (!('IntersectionObserver' in window)) {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
    $$('img[data-src]').forEach(function (el) { el.src = el.dataset.src; });
    $$('[data-lazy-map]').forEach(function (el) {
      el.innerHTML = el.getAttribute('data-lazy-map');
      el.removeAttribute('data-lazy-map');
    });
    $$('[data-count]').forEach(function (el) {
      el.textContent = (+el.dataset.count).toLocaleString('pt-BR');
    });
    return;
  }

  /* ---------- LAZY: REVEAL, IMAGENS E MAPA ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;

      if (el.dataset.src) {
        el.src = el.dataset.src;
        delete el.dataset.src;
      }
      if (el.hasAttribute('data-lazy-map')) {
        el.innerHTML = el.getAttribute('data-lazy-map');
        el.removeAttribute('data-lazy-map');
      }
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '120px 0px', threshold: 0.08 });

  $$('.reveal,[data-lazy-map],img[data-src]').forEach(function (el) { io.observe(el); });

  /* ---------- CONTADOR ---------- */
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, end = parseFloat(el.dataset.count) || 0;
      cio.unobserve(el);

      if (reducedMotion) { el.textContent = end.toLocaleString('pt-BR'); return; }

      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1600, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.floor(end * eased).toLocaleString('pt-BR');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });

  $$('[data-count]').forEach(function (el) { cio.observe(el); });
})();
