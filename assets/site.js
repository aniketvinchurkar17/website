/* Small things: the clock and arc in the corner, the sky switch, the reading
 * line on long pieces, and the door marked "wander". */
(function () {
  'use strict';
  var root = document.documentElement;
  var orb = document.querySelector('.arc .orb');
  var bite = document.querySelector('.arc .bite');
  var clock = document.getElementById('clock');
  var btn = document.querySelector('.skybtn');
  var NAMES = { live: 'sky: live', day: 'sky: day', night: 'sky: night' };

  function paint() {
    if (!window.SKY) return;
    var s = window.SKY.read();
    var moon = s.mode === 'night' || (s.mode === 'live' && !s.up);
    // a forced sky shows its own body at a sensible height; a live one shows the real position
    var t = s.mode === 'live' ? s.t : (moon === !s.up ? s.t : 0.5);
    var x = 60 - 50 * Math.cos(Math.PI * t), y = 38 - 32 * Math.sin(Math.PI * t);
    if (orb) { orb.setAttribute('cx', x.toFixed(1)); orb.setAttribute('cy', y.toFixed(1)); }
    if (bite) { bite.setAttribute('cx', (x + 3.2).toFixed(1)); bite.setAttribute('cy', (y - 1.6).toFixed(1)); }
    if (moon) root.setAttribute('data-moon', ''); else root.removeAttribute('data-moon');
    if (clock) clock.textContent = s.clock;
    if (btn) {
      btn.textContent = NAMES[s.mode];
      btn.title = s.mode === 'live'
        ? 'This page is lit by the real sky over Mumbai. Click to override.'
        : 'Click to change. "Live" follows the real sky over Mumbai.';
    }
  }

  if (btn) btn.addEventListener('click', function () {
    var order = ['live', 'day', 'night'];
    var cur = root.getAttribute('data-sky') || 'live';
    var next = order[(order.indexOf(cur) + 1) % order.length];
    try { if (next === 'live') localStorage.removeItem('sky'); else localStorage.setItem('sky', next); } catch (e) {}
    paint();
  });

  paint();
  setInterval(paint, 30000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) paint(); });

  /* reading line */
  var bar = document.querySelector('.progress');
  if (bar) {
    var tick = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, window.scrollY / h * 100) : 0) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }

  /* wander: somewhere else on this site, never where you already are */
  var doors = ['/essays/gen-z-ppp.html', '/essays/people.html', '/theses/patient-specific-implants.html',
    '/theses/medical-tourism.html', '/building/ic-memo-agent.html', '/building/undo.html', '/typing.html', '/colophon.html'];
  Array.prototype.forEach.call(document.querySelectorAll('[data-wander]'), function (a) {
    a.addEventListener('click', function (e) {
      var here = location.pathname, pool = doors.filter(function (d) { return d !== here; });
      e.preventDefault();
      location.href = pool[Math.floor(Math.random() * pool.length)];
    });
  });

  try { console.log('%cHello. You opened the hood.', 'font: italic 18px Georgia, serif',
    '\nNo framework, no build step, no trackers. Read the source; it was written to be read.\naniketvinchurkar17@gmail.com'); } catch (e) {}
})();
