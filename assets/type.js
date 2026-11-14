/* The line at the top of the page is one of mine, and you can type it.
 * Nothing is sent anywhere; your best score lives in your own browser. */
(function () {
  'use strict';

  var LINES = [
    { text: 'PPP is not a fact about a country. It is a fact about a basket.',
      src: 'PPP Is Not a Fact About a Country', href: '/essays/gen-z-ppp.html' },
    { text: 'At 1.7:1, that $100k offer isn’t 30 LPA. It’s closer to 55. Nobody is pricing it that way yet.',
      src: 'PPP Is Not a Fact About a Country', href: '/essays/gen-z-ppp.html' },
    { text: 'A specialty coffee in a Bandra cafe costs the same as in the US.',
      src: 'PPP Is Not a Fact About a Country', href: '/essays/gen-z-ppp.html' },
    { text: 'India has clinical excellence. What it lacks is reliability as a product.',
      src: 'India’s Foreigner-First Hospital Brand', href: '/theses/medical-tourism.html' },
    { text: 'Wedges win empires. Empires don’t create wedges.',
      src: 'India’s Foreigner-First Hospital Brand', href: '/theses/medical-tourism.html' },
    { text: 'This is my portfolio of people I am long on without the market knowing much about them.',
      src: 'People I’m Long On', href: '/essays/people.html' },
    { text: 'Smart people change orbits easily.',
      src: 'People I\u2019m Long On', href: '/essays/people.html' }
  ];

  var root = document.querySelector('[data-typer]');
  if (!root) return;

  var elLine = root.querySelector('.line');
  var elIn = root.querySelector('.typer-input');
  var elFoot = root.querySelector('.typer-foot');
  var cur, typed = '', t0 = 0, done = false, keys = 0, errs = 0, timer = null;

  // a reader on a plain keyboard should not need to find a curly apostrophe
  var SAME = { '’': "'", '‘': "'", '“': '"', '”': '"' };
  function hit(want, got) { return want === got || SAME[want] === got; }

  function best(v) {
    try {
      var b = parseInt(localStorage.getItem('wpm') || '0', 10) || 0;
      if (v > b) { localStorage.setItem('wpm', String(v)); b = v; }
      return b;
    } catch (e) { return v || 0; }
  }

  function draw() {
    // words are inline-blocks so they never split; the spaces between stay real so the line can wrap
    var t = cur.text, out = document.createDocumentFragment(), word = null;
    for (var i = 0; i < t.length; i++) {
      var c = t.charAt(i), s = document.createElement('span');
      s.textContent = c;
      s.className = i < typed.length ? (hit(c, typed.charAt(i)) ? 'ok' : 'bad')
                  : (i === typed.length && !done ? 'cur' : 'pend');
      if (c === ' ') { if (word) { out.appendChild(word); word = null; } s.className += ' sp'; out.appendChild(s); }
      else { if (!word) { word = document.createElement('span'); word.className = 'w'; } word.appendChild(s); }
    }
    if (word) out.appendChild(word);
    elLine.textContent = '';
    elLine.appendChild(out);
  }

  function score() {
    var secs = t0 ? (Date.now() - t0) / 1000 : 0, right = 0;
    for (var i = 0; i < typed.length; i++) if (hit(cur.text.charAt(i), typed.charAt(i))) right++;
    return {
      wpm: secs > 0 ? Math.round((right / 5) / (secs / 60)) : 0,
      acc: keys > 0 ? Math.round((keys - errs) / keys * 100) : 100
    };
  }

  function link() { return '<a href="' + cur.href + '">' + cur.src + '</a>'; }
  function another() { return '<button type="button" data-new>another line</button>'; }

  function foot() {
    if (done) {
      var s = score(), b = best(s.wpm);
      elFoot.innerHTML = '<span class="verdict">' + s.wpm + ' words a minute, ' + s.acc + '% clean'
        + (s.wpm >= b && s.wpm > 0 ? ' — your best here.' : '. Your best here is ' + b + '.')
        + ' That line is from ' + link() + '.</span>' + another();
    } else if (t0) {
      var r = score();
      elFoot.innerHTML = '<span class="stat"><b>' + r.wpm + '</b> wpm</span><span class="stat"><b>' + r.acc
        + '%</b> clean</span><span class="src">esc to restart</span>';
    } else {
      elFoot.innerHTML = '<span>start typing</span>' + another() + '<span class="src">from ' + link() + '</span>';
    }
  }

  function reset(fresh) {
    if (timer) { clearInterval(timer); timer = null; }
    if (fresh || !cur) {
      var n; do { n = LINES[Math.floor(Math.random() * LINES.length)]; } while (n === cur && LINES.length > 1);
      cur = n;
    }
    typed = ''; t0 = 0; done = false; keys = 0; errs = 0;
    elIn.value = ''; elIn.disabled = false;
    draw(); foot();
  }

  elIn.addEventListener('input', function () {
    if (done) return;
    var v = elIn.value.slice(0, cur.text.length);
    for (var i = typed.length; i < v.length; i++) { keys++; if (!hit(cur.text.charAt(i), v.charAt(i))) errs++; }
    typed = v;
    if (!t0 && typed.length) { t0 = Date.now(); timer = setInterval(foot, 250); }
    if (typed.length === cur.text.length) { done = true; clearInterval(timer); timer = null; elIn.disabled = true; }
    draw(); foot();
  });
  elIn.addEventListener('paste', function (e) { e.preventDefault(); });
  elIn.addEventListener('focus', function () { root.classList.add('live'); });
  elIn.addEventListener('blur', function () { root.classList.remove('live'); });

  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-new]') : null;
    if (b) { reset(true); elIn.focus({ preventScroll: true }); return; }
    if (e.target.closest && e.target.closest('a')) return;
    if (!done) elIn.focus({ preventScroll: true });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { reset(false); return; }
    if (done && e.key === 'Enter' && !(e.target.closest && e.target.closest('a,button'))) { reset(true); elIn.focus({ preventScroll: true }); return; }
    // just start typing: a letter pressed while nothing is focused goes to the line
    var a = document.activeElement;
    var free = !a || a === document.body;
    if (free && !done && e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) elIn.focus({ preventScroll: true });
  });

  reset(true);
  if (root.hasAttribute('data-autofocus') && window.matchMedia('(pointer: fine)').matches && !location.hash) {
    elIn.focus({ preventScroll: true });
  }
})();
