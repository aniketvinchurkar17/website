/* A typing test, where the passages are lines from the writing on this site.
 * No dependencies. Progressive enhancement: with JS off the page says so. */
(function () {
  'use strict';

  var PASSAGES = [
    { text: 'All PPP calculators tell you that what you can buy for 3 dollars in the US needs just a dollar in India. This is exactly how salary converters worked.',
      source: 'PPP Is Not a Fact About a Country', href: 'essays/gen-z-ppp.html' },
    { text: 'A specialty coffee in a Bandra cafe costs the same as in the US. A trip to Japan costs the same for an American as it costs for an Indian Gen Z.',
      source: 'PPP Is Not a Fact About a Country', href: 'essays/gen-z-ppp.html' },
    { text: 'Judging a company is easy by comparison. There is a price, a cap table, a growth rate, and a crowd of people who have already done the work of forming a view.',
      source: 'People I’m Long On', href: 'essays/people.html' },
    { text: 'India has clinical excellence. What it lacks is reliability as a product. Wedges win empires, and empires do not create wedges.',
      source: 'India’s Foreigner-First Hospital Brand', href: 'theses/medical-tourism.html' },
    { text: 'A diligence tool that overstates itself is worse than no tool. A fabricated figure in an IC memo is worse than a blank.',
      source: 'IC Memo Auto-drafter', href: 'building/ic-memo-agent.html' },
    { text: 'The moat is a flywheel: more cases produce faster design, faster design wins more surgeons, and more surgeons produce more cases.',
      source: 'Patient-Specific Implants', href: 'theses/patient-specific-implants.html' }
  ];

  var root = document.getElementById('typing');
  if (!root) return;

  var elPassage = root.querySelector('.tt-passage');
  var elInput   = root.querySelector('.tt-input');
  var elWpm     = root.querySelector('[data-stat="wpm"]');
  var elAcc     = root.querySelector('[data-stat="acc"]');
  var elTime    = root.querySelector('[data-stat="time"]');
  var elBest    = root.querySelector('[data-stat="best"]');
  var elSource  = root.querySelector('.tt-source');
  var elNote    = root.querySelector('.tt-note');
  var btnAgain  = root.querySelector('[data-act="again"]');
  var btnNew    = root.querySelector('[data-act="new"]');

  var current, typed = '', started = 0, done = false, keystrokes = 0, errors = 0, tick = null;

  function pick(force) {
    var i = Math.floor(Math.random() * PASSAGES.length);
    if (force && PASSAGES.length > 1 && PASSAGES[i] === current) i = (i + 1) % PASSAGES.length;
    return PASSAGES[i];
  }

  function best(v) {
    try {
      var b = parseInt(localStorage.getItem('tt-best') || '0', 10) || 0;
      if (v != null && v > b) { localStorage.setItem('tt-best', String(v)); b = v; }
      return b;
    } catch (e) { return v || 0; }
  }

  function render() {
    // Runs of non-space characters are grouped into inline-block words so a word
    // never breaks across lines; the spaces between them stay real, breakable
    // spaces so the passage still wraps. (Using non-breaking spaces here left the
    // line with no legal break point at all.)
    var t = current.text, out = document.createDocumentFragment(), word = null;

    function cell(idx, space) {
      var s = document.createElement('span');
      s.textContent = space ? ' ' : t.charAt(idx);
      if (idx < typed.length) s.className = typed.charAt(idx) === t.charAt(idx) ? 'ok' : 'bad';
      else if (idx === typed.length && !done) s.className = 'cur';
      else s.className = 'pend';
      if (space) s.classList.add('sp');
      return s;
    }

    for (var i = 0; i < t.length; i++) {
      if (t.charAt(i) === ' ') {
        if (word) { out.appendChild(word); word = null; }
        out.appendChild(cell(i, true));
      } else {
        if (!word) { word = document.createElement('span'); word.className = 'w'; }
        word.appendChild(cell(i, false));
      }
    }
    if (word) out.appendChild(word);

    elPassage.textContent = '';
    elPassage.appendChild(out);
  }

  function stats() {
    var secs = started ? (Date.now() - started) / 1000 : 0;
    var right = 0;
    for (var i = 0; i < typed.length; i++) if (typed.charAt(i) === current.text.charAt(i)) right++;
    var wpm = secs > 0 ? Math.round((right / 5) / (secs / 60)) : 0;
    var acc = keystrokes > 0 ? Math.round(((keystrokes - errors) / keystrokes) * 100) : 100;
    elWpm.textContent = started ? wpm : '—';
    elAcc.textContent = started ? acc + '%' : '—';
    elTime.textContent = started ? secs.toFixed(1) + 's' : '—';
    return { wpm: wpm, acc: acc, secs: secs };
  }

  function reset(newPassage) {
    if (tick) { clearInterval(tick); tick = null; }
    current = newPassage ? pick(true) : (current || pick(false));
    typed = ''; started = 0; done = false; keystrokes = 0; errors = 0;
    elInput.value = '';
    elInput.disabled = false;
    root.classList.remove('is-done');
    elSource.innerHTML = 'from <a href="' + current.href + '">' + current.source + '</a>';
    elNote.textContent = 'Start typing. The clock starts on your first keystroke.';
    elBest.textContent = best() ? best() + ' wpm' : '—';
    render(); stats();
    elInput.focus();
  }

  function finish() {
    done = true;
    if (tick) { clearInterval(tick); tick = null; }
    var s = stats();
    elInput.disabled = true;
    root.classList.add('is-done');
    var b = best(s.wpm);
    elBest.textContent = b + ' wpm';
    elNote.textContent = s.wpm >= b && s.wpm > 0
      ? 'That is your best yet. Again?'
      : 'Done. Your best is ' + b + ' wpm.';
    render();
  }

  elInput.addEventListener('input', function () {
    if (done) return;
    var v = elInput.value;
    if (v.length > current.text.length) v = v.slice(0, current.text.length);

    if (v.length > typed.length) {
      keystrokes += v.length - typed.length;
      for (var i = typed.length; i < v.length; i++) {
        if (v.charAt(i) !== current.text.charAt(i)) errors++;
      }
    }
    typed = v;

    if (!started && typed.length) {
      started = Date.now();
      tick = setInterval(stats, 100);
      elNote.textContent = '';
    }
    render();
    if (typed.length === current.text.length) finish(); else stats();
  });

  // typing it is the point
  elInput.addEventListener('paste', function (e) { e.preventDefault(); });

  root.addEventListener('click', function () { if (!done) elInput.focus(); });
  elInput.addEventListener('blur', function () { root.classList.remove('is-live'); });
  elInput.addEventListener('focus', function () { root.classList.add('is-live'); });

  btnAgain.addEventListener('click', function () { reset(false); });
  btnNew.addEventListener('click', function () { reset(true); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); reset(false); }
  });

  root.hidden = false;
  var fallback = document.getElementById('tt-nojs');
  if (fallback) fallback.remove();
  reset(true);
})();
