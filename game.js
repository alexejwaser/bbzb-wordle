/* ==========================================
   CONFIG
========================================== */
const MAX_GUESSES = 6;
const STORAGE_KEY = 'bbzb_wordle_stats';

// TODO: HUB-INTEGRATION — Tageswort von API laden statt lokal
const WORDS = [
  { word: "MAUER", description: "Tragwerk aus Backstein oder Beton — das Grundhandwerk im Hochbau", category: "Bautechnik" },
  { word: "HOBEL", description: "Handwerkzeug zum Glätten und Profilieren von Holzoberflächen", category: "Zimmerei" },
  { word: "NAGEL", description: "Metallstift zum Verbinden von Holzteilen — unverzichtbar im Holzbau", category: "Zimmerei" },
  { word: "BLECH", description: "Dünne Metallplatte — Grundmaterial des Spenglers für Dächer und Rinnen", category: "Gebäudetechnik" },
  { word: "STEIN", description: "Natürliches Baumaterial, behauen und verlegt vom Steinmetz", category: "Steinmetz" },
  { word: "BRETT", description: "Gesägtes Holzstück — Grundelement jeder Holzkonstruktion", category: "Zimmerei" },
  { word: "STAHL", description: "Legierung aus Eisen, unverzichtbar im Hoch- und Tiefbau", category: "Bautechnik" },
  { word: "KABEL", description: "Isolierter Leiter für elektrischen Strom — verlegt vom Elektroinstallateur", category: "Elektrotechnik" },
  { word: "DRAHT", description: "Dünner Metallfaden, genutzt für elektrische Verbindungen und Armierungen", category: "Elektrotechnik" },
  { word: "PUMPE", description: "Fördert Wasser und Heizmedien — eingebaut vom Sanitär- oder Heizungsinstallateur", category: "Gebäudetechnik" },
  { word: "FARBE", description: "Beschichtungsmittel für Wände und Oberflächen — Hauptmaterial des Malers", category: "Ausbau" },
  { word: "GLANZ", description: "Leuchtende, spiegelnde Oberfläche nach dem Lackieren — Ziel des Lackierers", category: "Fahrzeugtechnik" },
  { word: "ZANGE", description: "Greifwerkzeug in fast allen Handwerksberufen", category: "Handwerk" },
  { word: "MOTOR", description: "Antriebsaggregat im Fahrzeug — gewartet und repariert vom Automechaniker", category: "Automobiltechnik" },
  { word: "PIXEL", description: "Kleinste Bildeinheit — Grundelement digitaler Gestaltung", category: "Visuelle Gestaltung" },
  { word: "LOCKE", description: "Gewelltes Haar — Ergebnis der Arbeit einer Coiffeuse oder eines Coiffeurs", category: "Coiffure" },
  { word: "DRUCK", description: "Vervielfältigungsverfahren — Kernkompetenz des Polygrafen und Medientechnologen", category: "Visuelle Gestaltung" },
  { word: "LINIE", description: "Geometrisches Grundelement in technischen Zeichnungen", category: "Zeichner" },
  { word: "ACHSE", description: "Drehendes Bauteil im Fahrzeugbau — geprüft vom Automechaniker", category: "Automobiltechnik" },
  { word: "BETON", description: "Baustoff aus Zement, Kies, Sand und Wasser — Grundlage des Hochbaus", category: "Bautechnik" },
  { word: "EBENE", description: "Plane Fläche in Bau und Technik — wichtig für präzises Arbeiten und Zeichnen", category: "Bautechnik" },
  { word: "FOLIE", description: "Dünne Schicht für Abdichtung, Verpackung und Druckvorstufe", category: "Visuelle Gestaltung" },
  { word: "WELLE", description: "Haarform mit sanften Bögen — erzeugt mit Hitzewerkzeug oder Chemikalien", category: "Coiffure" },
  { word: "STIFT", description: "Schreibwerkzeug für Entwürfe und Zeichnungen — täglich genutzt vom Grafiker", category: "Visuelle Gestaltung" },
  { word: "SUPPE", description: "Flüssiges Gericht, Grundlage der Kochkunst — täglich zubereitet vom Koch", category: "Gastronomie" },
];

/* ==========================================
   GAME STATE
========================================== */
let state = {
  wordData:     null,
  wordLen:      0,
  _wordIndex:   0,
  currentRow:   0,
  guesses:      [],
  currentGuess: [],
  gameOver:     false,
  won:          false,
  hintShown:    false,
  animating:    false,
};

/* ==========================================
   DOM HELPERS
========================================== */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function getTile(row, col) {
  return $(`#grid .grid-row:nth-child(${row + 1}) .tile:nth-child(${col + 1})`);
}
function getRow(row) {
  return $(`#grid .grid-row:nth-child(${row + 1})`);
}
function getKeyEl(letter) {
  return $(`.kb-key[data-key="${letter}"]`);
}

/* ==========================================
   STATS (localStorage)
========================================== */
function loadStats() {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch (e) {}
  return { played: 0, won: 0, streak: 0, best: null };
}
function saveStats(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
}
function renderStats() {
  const s = loadStats();
  $('#stat-played').textContent = s.played;
  $('#stat-won').textContent    = s.won;
  $('#stat-streak').textContent = `${s.streak} 🔥`;
  $('#stat-best').textContent   = s.best !== null ? `${s.best}V` : '-';
}
function updateStats(won, guessCount) {
  const s = loadStats();
  s.played++;
  if (won) {
    s.won++;
    s.streak++;
    if (s.best === null || guessCount < s.best) s.best = guessCount;
  } else {
    s.streak = 0;
  }
  saveStats(s);
  renderStats();
}

/* ==========================================
   GRID BUILDER
========================================== */
function buildGrid() {
  const grid = $('#grid');
  grid.innerHTML = '';

  const len     = state.wordLen;
  const maxW    = Math.min(window.innerWidth, 480) - 32;
  const fitSize = Math.floor((maxW - (len - 1) * 5) / len);
  const size    = Math.min(58, fitSize);
  const fSize   = Math.min(16, Math.floor(size * 0.32));

  for (let r = 0; r < MAX_GUESSES; r++) {
    const row = document.createElement('div');
    row.className = 'grid-row';
    for (let c = 0; c < len; c++) {
      const tile = document.createElement('div');
      tile.className    = 'tile';
      tile.style.width  = `${size}px`;
      tile.style.height = `${size}px`;
      tile.style.fontSize = `${fSize}px`;
      row.appendChild(tile);
    }
    grid.appendChild(row);
  }
  updateActiveTile();
}

/* ==========================================
   KEYBOARD BUILDER
========================================== */
const KB_ROWS = [
  ['Q','W','E','R','T','Z','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Y','X','C','V','B','N','M','BACK'],
];

function buildKeyboard() {
  KB_ROWS.forEach((keys, i) => {
    const rowEl = $(`#kb-row-${i + 1}`);
    rowEl.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'kb-key';
      if      (k === 'ENTER') { btn.classList.add('enter'); btn.textContent = 'OK'; }
      else if (k === 'BACK')  { btn.classList.add('back');  btn.textContent = '←'; }
      else btn.textContent = k;
      btn.dataset.key = k;
      btn.addEventListener('click', () => handleKey(k));
      rowEl.appendChild(btn);
    });
  });
}

/* ==========================================
   ACTIVE TILE HIGHLIGHT
========================================== */
function updateActiveTile() {
  $$('.tile').forEach(t => t.classList.remove('active', 'empty'));
  if (state.gameOver) return;
  for (let c = 0; c < state.wordLen; c++) {
    const tile = getTile(state.currentRow, c);
    if (!tile) continue;
    if      (c === state.currentGuess.length)     tile.classList.add('active', 'empty');
    else if (c === state.currentGuess.length - 1) tile.classList.add('active');
  }
}

/* ==========================================
   GAME LOGIC
========================================== */
function handleKey(key) {
  if (state.gameOver || state.animating) return;
  if (key === 'BACK' || key === 'Backspace') deleteLetter();
  else if (key === 'ENTER' || key === 'Enter') submitGuess();
  else if (/^[A-Za-z]$/.test(key)) addLetter(key.toUpperCase());
}

function addLetter(letter) {
  if (state.currentGuess.length >= state.wordLen) return;
  state.currentGuess.push(letter);
  const tile = getTile(state.currentRow, state.currentGuess.length - 1);
  if (tile) {
    tile.textContent = letter;
    tile.style.transform = 'scale(1.12)';
    setTimeout(() => { tile.style.transform = ''; }, 80);
  }
  updateActiveTile();
}

function deleteLetter() {
  if (state.currentGuess.length === 0) return;
  const col = state.currentGuess.length - 1;
  state.currentGuess.pop();
  const tile = getTile(state.currentRow, col);
  if (tile) tile.textContent = '';
  updateActiveTile();
}

function submitGuess() {
  if (state.currentGuess.length < state.wordLen) {
    showToast('ZU KURZ!', 'error');
    shakeRow(state.currentRow);
    return;
  }

  // TODO: HUB-INTEGRATION — Wort gegen API validieren (z.B. Wiktionary)

  const guess  = state.currentGuess.join('');
  const target = state.wordData.word;
  const result = evaluateGuess(guess, target);

  state.guesses.push(result);
  state.animating = true;

  flipRow(state.currentRow, state.currentGuess, result, () => {
    updateKeyboard(state.currentGuess, result);

    const won = result.every(r => r.status === 'correct');
    state.gameOver = won || (state.currentRow + 1 >= MAX_GUESSES);
    state.won      = won;

    if (won) {
      bounceRow(state.currentRow);
      const guessNum = state.currentRow + 1;
      updateStats(true, guessNum);
      setTimeout(() => showWinOverlay(guessNum), 700);
    } else {
      state.currentRow++;
      state.currentGuess = [];

      // Show hint after 3rd failed attempt
      if (!state.hintShown && state.currentRow >= 3) {
        state.hintShown = true;
        showHint();
      }

      if (state.currentRow >= MAX_GUESSES) {
        updateStats(false, MAX_GUESSES);
        setTimeout(() => showLoseOverlay(), 300);
      } else {
        updateActiveTile();
      }
    }
    state.animating = false;
  });
}

// Evaluate with correct duplicate-letter handling
function evaluateGuess(guess, target) {
  const len    = target.length;
  const result = Array(len).fill(null).map(() => ({ letter: '', status: 'absent' }));
  const tArr   = target.split('');
  const used   = Array(len).fill(false);

  // Pass 1: exact matches
  for (let i = 0; i < len; i++) {
    result[i].letter = guess[i];
    if (guess[i] === tArr[i]) { result[i].status = 'correct'; used[i] = true; }
  }

  // Pass 2: present but wrong position
  for (let i = 0; i < len; i++) {
    if (result[i].status === 'correct') continue;
    for (let j = 0; j < len; j++) {
      if (!used[j] && guess[i] === tArr[j]) {
        result[i].status = 'present'; used[j] = true; break;
      }
    }
  }
  return result;
}

function updateKeyboard(letters, result) {
  const priority = { correct: 3, present: 2, absent: 1 };
  letters.forEach((letter, i) => {
    const key = getKeyEl(letter);
    if (!key) return;
    const newStatus = result[i].status;
    const cur = key.dataset.status || '';
    if (!cur || priority[newStatus] > priority[cur]) {
      key.dataset.status = newStatus;
      key.className = `kb-key ${newStatus}`;
      if (key.dataset.key === 'ENTER') key.classList.add('enter');
      if (key.dataset.key === 'BACK')  key.classList.add('back');
    }
  });
}

/* ==========================================
   ANIMATIONS
========================================== */
function flipRow(row, letters, result, onComplete) {
  const delay = 150, half = 100;
  letters.forEach((letter, i) => {
    const tile = getTile(row, i);
    if (!tile) return;
    setTimeout(() => {
      tile.style.transition = `transform ${half}ms ease-in`;
      tile.style.transform  = 'rotateX(90deg)';
      setTimeout(() => {
        tile.classList.add(result[i].status);
        tile.textContent      = letter;
        tile.style.transition = `transform ${half}ms ease-out`;
        tile.style.transform  = 'rotateX(0deg)';
        if (i === letters.length - 1) setTimeout(onComplete, half + 30);
      }, half);
    }, i * delay);
  });
}

function shakeRow(row) {
  const el = getRow(row);
  if (!el) return;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

function bounceRow(row) {
  for (let c = 0; c < state.wordLen; c++) {
    const tile = getTile(row, c);
    if (!tile) continue;
    setTimeout(() => {
      tile.classList.add('win-bounce');
      tile.addEventListener('animationend', () => tile.classList.remove('win-bounce'), { once: true });
    }, c * 80);
  }
}

/* ==========================================
   HINT (shown after 3rd failed attempt)
========================================== */
function showHint() {
  $('#hint-category-badge').textContent = state.wordData.category;
  $('#hint-description').textContent    = state.wordData.description;
  $('#hint-box').classList.add('visible');
}

/* ==========================================
   TOASTS
========================================== */
function showToast(msg, type = '') {
  const t = document.createElement('div');
  t.className   = `toast${type ? ' ' + type : ''}`;
  t.textContent = msg;
  $('#toast-container').appendChild(t);
  setTimeout(() => t.remove(), 2100);
}

/* ==========================================
   OVERLAY HELPERS
========================================== */
function buildShareText(guessNum) {
  const header = `BBZB Wordle #${state._wordIndex + 1}  ${state.won ? guessNum : 'X'}/${MAX_GUESSES}`;
  const lines  = state.guesses.map(result =>
    result.map(r => r.status === 'correct' ? '✅' : r.status === 'present' ? '🟨' : '⬛').join('')
  );
  return [header, '', ...lines].join('\n');
}

function showWinOverlay(guessNum) {
  const xp = (MAX_GUESSES + 1 - guessNum) * 100;

  $('#overlay-titlebar').className     = 'overlay-titlebar win';
  $('#overlay-title-text').textContent = '✨ LEVEL COMPLETE!';
  $('#overlay-emoji').textContent      = '⭐';
  $('#overlay-main-text').innerHTML    =
    `Du hast es in <span class="highlight">${guessNum}</span> Versuch${guessNum !== 1 ? 'en' : ''} gelöst!`;

  $('#xp-section').style.display      = 'block';
  $('#xp-label-right').textContent    = `${xp} XP`;
  setTimeout(() => { $('#xp-bar').style.width = `${Math.min(100, (xp / 600) * 100)}%`; }, 200);

  $('#share-section').style.display   = 'block';
  $('#share-text').textContent        = buildShareText(guessNum);

  $('#overlay-lose-word').style.display = 'none';
  $('#overlay-lose-desc').style.display = 'none';

  const cta = $('#overlay-cta');
  cta.textContent = 'MORGEN WIEDER SPIELEN';
  cta.onclick = () => $('#overlay').classList.remove('visible');
  $('#overlay').classList.add('visible');
}

function showLoseOverlay() {
  $('#overlay-titlebar').className     = 'overlay-titlebar lose';
  $('#overlay-title-text').textContent = '💀 GAME OVER';
  $('#overlay-emoji').textContent      = '😢';
  $('#overlay-main-text').innerHTML    = 'Das Wort war:';

  $('#overlay-lose-word').textContent       = state.wordData.word;
  $('#overlay-lose-word').style.display     = 'block';
  $('#overlay-lose-desc').textContent       = state.wordData.description;
  $('#overlay-lose-desc').style.display     = 'block';

  $('#xp-section').style.display    = 'none';
  $('#share-section').style.display = 'none';

  const cta = $('#overlay-cta');
  cta.textContent = 'MORGEN WIEDER VERSUCHEN';
  cta.onclick = () => $('#overlay').classList.remove('visible');
  $('#overlay').classList.add('visible');
}

/* ==========================================
   EVENT LISTENERS
========================================== */
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if ($('#overlay').classList.contains('visible')) return;
  if (document.activeElement === $('#class-code-input')) return;
  if      (e.key === 'Backspace')          handleKey('Backspace');
  else if (e.key === 'Enter')              handleKey('Enter');
  else if (/^[a-zA-Z]$/.test(e.key))      handleKey(e.key.toUpperCase());
});

$('#btn-copy').addEventListener('click', () => {
  navigator.clipboard.writeText($('#share-text').textContent)
    .then(() => showToast('KOPIERT! 📋', 'win'))
    .catch(()  => showToast('KOPIEREN FEHLGESCHLAGEN', 'error'));
});

$('#btn-send-class').addEventListener('click', () => {
  const code = $('#class-code-input').value.trim().toUpperCase();
  if (!code) { showToast('BITTE KLASSENCODE EINGEBEN', 'error'); return; }
  // TODO: HUB-INTEGRATION — Klassencode validieren
  // TODO: HUB-INTEGRATION — Score an Klassen-Rangliste senden
  // TODO: HUB-INTEGRATION — Rangliste der Klassen anzeigen
  showToast(`CODE ${code} GESPEICHERT ✓`, 'win');
});

/* ==========================================
   INIT
========================================== */
function init() {
  // Random word on every reload (development mode)
  const idx        = Math.floor(Math.random() * WORDS.length);
  state._wordIndex = idx;
  state.wordData   = WORDS[idx];
  state.wordLen    = state.wordData.word.length;

  $('#header-date').textContent     = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  $('#header-category').textContent = state.wordData.category;

  // Pre-fill hint content (hidden until 3rd failed attempt)
  $('#hint-category-badge').textContent = state.wordData.category;
  $('#hint-description').textContent    = state.wordData.description;

  buildGrid();
  buildKeyboard();
  renderStats();
}

init();
