/* Card deck view for the home page.
 *
 * Progressive enhancement: the list in index.html is the source of truth and
 * works on its own. This script reads it, builds a swipeable deck from it, and
 * injects the toggle. If it never runs, the page is unchanged.
 */
(function () {
  'use strict';

  var main = document.querySelector('.home-main');
  if (!main) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- read the page ---------- */

  function collect() {
    var out = [];
    var section = '';
    var nodes = main.querySelectorAll('h2, .list li, .role');

    Array.prototype.forEach.call(nodes, function (el) {
      if (el.tagName === 'H2') { section = el.textContent.trim(); return; }

      // a role block: chip + date, followed by its paragraph(s)
      if (el.classList.contains('role')) {
        var chip = el.querySelector('.chip');
        var date = el.querySelector('.d');
        var note = '';
        var n = el.nextElementSibling;
        while (n && n.tagName === 'P') {
          note += (note ? ' ' : '') + n.textContent.trim();
          n = n.nextElementSibling;
        }
        out.push({
          kind: section,
          title: chip ? chip.textContent.trim() : '',
          meta: date ? date.textContent.trim() : '',
          note: note,
          href: null
        });
        return;
      }

      // a list entry: link + note
      var a = el.querySelector('a');
      if (!a) return;
      var note = el.querySelector('.note');
      var href = a.getAttribute('href');
      out.push({
        kind: section,
        title: a.textContent.trim(),
        meta: '',
        note: note ? note.textContent.trim() : '',
        href: href,
        external: /^https?:/i.test(href)
      });
    });

    return out;
  }

  var items = collect();
  if (items.length < 2) return;

  /* ---------- build the UI ---------- */

  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  var toggle = el('div', 'viewtoggle');
  toggle.setAttribute('role', 'group');
  toggle.setAttribute('aria-label', 'View');
  var bList = el('button', null, 'List');
  var bCards = el('button', null, 'Cards');
  bList.type = bCards.type = 'button';
  bList.setAttribute('aria-pressed', 'true');
  bCards.setAttribute('aria-pressed', 'false');
  toggle.appendChild(bList);
  toggle.appendChild(bCards);

  var deck = el('div', 'deck');
  deck.hidden = true;
  var stack = el('div', 'deck-stack');
  var controls = el('div', 'deck-controls');
  var bPrev = el('button', 'deck-btn', '‹');
  var bNext = el('button', 'deck-btn', '›');
  bPrev.type = bNext.type = 'button';
  bPrev.setAttribute('aria-label', 'Previous');
  bNext.setAttribute('aria-label', 'Next');
  var count = el('span', 'deck-count');
  controls.appendChild(bPrev);
  controls.appendChild(count);
  controls.appendChild(bNext);
  var hint = el('p', 'deck-hint', 'Drag a card aside, or use ← →. Open one to read it.');
  deck.appendChild(stack);
  deck.appendChild(controls);
  deck.appendChild(hint);

  var firstH2 = main.querySelector('h2');
  main.insertBefore(toggle, firstH2);
  main.insertBefore(deck, firstH2);

  /* ---------- deck state ---------- */

  var at = 0;

  function cardNode(item, depth) {
    var c = el('article', 'card');
    c.style.zIndex = String(50 - depth);
    if (item.kind) c.appendChild(el('p', 'card-kind', item.kind));
    c.appendChild(el('h3', 'card-title', item.title));
    if (item.meta) c.appendChild(el('p', 'card-meta', item.meta));
    if (item.note) c.appendChild(el('p', 'card-note', item.note));
    if (item.href) {
      var cta = el('p', 'card-cta', (item.external ? 'Open' : 'Read') + ' →');
      c.appendChild(cta);
      c.classList.add('is-link');
    }
    place(c, depth, 0);
    return c;
  }

  function place(c, depth, dx) {
    if (depth === 0) {
      var rot = dx * 0.04;
      c.style.transform = 'translate3d(' + dx + 'px,0,0) rotate(' + rot + 'deg)';
      // stay fully opaque through a normal drag; only fade as it leaves
      var over = Math.max(0, Math.abs(dx) - 170);
      c.style.opacity = String(Math.max(0, 1 - over / 200));
    } else {
      c.style.transform = 'translate3d(0,' + depth * 10 + 'px,0) scale(' + (1 - depth * 0.03) + ')';
      c.style.opacity = '1';
    }
  }

  function render() {
    stack.textContent = '';

    if (at >= items.length) {
      var done = el('div', 'deck-done');
      done.appendChild(el('p', null, 'That’s everything.'));
      var again = el('button', 'deck-again', 'Start over');
      again.type = 'button';
      again.addEventListener('click', function () { at = 0; render(); });
      done.appendChild(again);
      stack.appendChild(done);
      count.textContent = items.length + ' / ' + items.length;
      bNext.disabled = true;
      bPrev.disabled = false;
      return;
    }

    // Top card first in the DOM so querySelector('.card') is always the top
    // one; explicit z-index (50 - depth) keeps the visual stacking correct.
    var deep = Math.min(2, items.length - at - 1);
    for (var d = 0; d <= deep; d++) {
      stack.appendChild(cardNode(items[at + d], d));
    }
    count.textContent = (at + 1) + ' / ' + items.length;
    bPrev.disabled = at === 0;
    bNext.disabled = false;
    arm();
  }

  function open(i) {
    var it = items[i];
    if (!it || !it.href) return;
    if (it.external) window.open(it.href, '_blank', 'noopener');
    else window.location.href = it.href;
  }

  // Dismiss the top card, flying it out toward `side` (1 right, -1 left).
  // Either direction moves forward -- the deck is a reading order, not a vote.
  function dismiss(side) {
    var top = stack.querySelector('.card');
    if (!top || at >= items.length) return;
    var after = function () { at++; render(); };
    if (reduced) { after(); return; }
    top.classList.add('is-gone');
    top.style.transform = 'translate3d(' + (side * 520) + 'px,0,0) rotate(' + (side * 18) + 'deg)';
    top.style.opacity = '0';
    setTimeout(after, 220);
  }

  function back() {
    if (at === 0) return;
    at--;
    render();
  }

  /* ---------- dragging ---------- */

  function arm() {
    var top = stack.querySelector('.card');
    if (!top) return;

    var startX = 0, startY = 0, dx = 0, dragging = false, moved = 0, id = null;

    top.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      dragging = true; moved = 0; id = e.pointerId;
      startX = e.clientX; startY = e.clientY;
      top.setPointerCapture(id);
      top.classList.add('is-dragging');
    });

    top.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      var dy = e.clientY - startY;
      moved = Math.max(moved, Math.abs(dx), Math.abs(dy));
      // let a clearly vertical gesture scroll the page instead
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12 && Math.abs(dx) < 12) {
        dragging = false;
        top.classList.remove('is-dragging');
        place(top, 0, 0);
        return;
      }
      place(top, 0, dx);
    });

    function end() {
      if (!dragging) return;
      dragging = false;
      top.classList.remove('is-dragging');
      if (Math.abs(dx) > 90) dismiss(dx > 0 ? 1 : -1);
      else place(top, 0, 0);
      dx = 0;
    }

    top.addEventListener('pointerup', function () {
      var wasTap = moved < 6;
      end();
      if (wasTap) open(at);
    });
    top.addEventListener('pointercancel', end);
    top.addEventListener('lostpointercapture', end);
  }

  bNext.addEventListener('click', function () { dismiss(1); });
  bPrev.addEventListener('click', function () { back(); });

  document.addEventListener('keydown', function (e) {
    if (deck.hidden) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); dismiss(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    else if (e.key === 'Enter') { open(at); }
  });

  /* ---------- view switching ---------- */

  function show(cards) {
    main.classList.toggle('cards-on', cards);
    deck.hidden = !cards;
    bList.setAttribute('aria-pressed', String(!cards));
    bCards.setAttribute('aria-pressed', String(cards));
    if (cards) { at = 0; render(); }
    try { localStorage.setItem('view', cards ? 'cards' : 'list'); } catch (err) {}
  }

  bList.addEventListener('click', function () { show(false); });
  bCards.addEventListener('click', function () { show(true); });

  try {
    if (localStorage.getItem('view') === 'cards') show(true);
  } catch (err) {}
})();
