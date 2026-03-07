// ===== Konfigurace fotek =====
const PHOTO_EXT = ".jpg";        // máš-li .png nebo .webp, změň zde
const PHOTO_DIR = "img";
const MAX_AVAILABLE = 24;        // kolik max. fotek máš připravených (img1..imgN)

// ===== DOM =====
const boardEl    = document.getElementById("board");
const movesEl    = document.getElementById("moves");
const timeEl     = document.getElementById("time");
const sizeSel    = document.getElementById("size");
const restartBtn = document.getElementById("restart");

// ===== Stav =====
let size = parseInt(sizeSel.value, 10); // 4 nebo 6
let deck = [];
let first = null, second = null;
let lock = false;
let matchedPairs = 0;
let moves = 0;
let timerId = null;
let startTime = null;

// ===== Pomocné funkce =====
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const formatTime = (ms) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

function buildPhotoPool(count) {
  const limit = Math.min(count, MAX_AVAILABLE);
  return Array.from({ length: limit }, (_, i) => `${PHOTO_DIR}/img${i + 1}${PHOTO_EXT}`);
}

// ===== Adaptivní výpočet velikosti karet =====
function updateCellSize() {
  const rows = size;
  const cols = size;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const topbar = document.querySelector(".topbar");
  const footer = document.querySelector(".footer");
  const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 140;
  const footerHeight = footer ? footer.getBoundingClientRect().height : 20;

  const verticalFree = vh - (topbarHeight + footerHeight + 32);  // buffer
  const containerMax = 980;                                      // šířka .container
  const horizontalFree = Math.min(vw, containerMax) - 32;        // levý+pravý padding

  const rootStyles = getComputedStyle(document.documentElement);
  const gapPx = parseInt(rootStyles.getPropertyValue("--gap")) || 8;

  const cellByHeight = Math.floor((verticalFree - gapPx * (rows - 1)) / rows);
  const cellByWidth  = Math.floor((horizontalFree - gapPx * (cols - 1)) / cols);

  const cell = Math.max(60, Math.min(cellByHeight, cellByWidth, 200));

  document.documentElement.style.setProperty("--cell-size", cell + "px");
}

window.addEventListener("resize", updateCellSize);

// ===== Generování balíčku =====
function buildDeck(n) {
  const pairs = (n * n) / 2;
  const pool = buildPhotoPool(pairs);
  return shuffle([...pool, ...pool]).map((src, idx) => ({
    id: idx + "_" + src,
    src,
    matched: false
  }));
}

// ===== Renderování hrací plochy =====
function renderBoard() {
  boardEl.innerHTML = "";
  boardEl.classList.toggle("cols-4", size === 4);
  boardEl.classList.toggle("cols-6", size === 6);

  deck.forEach((card) => {
    const cardEl = document.createElement("button");
    cardEl.className = "card";
    cardEl.setAttribute("aria-label", "karta");
    cardEl.dataset.id = card.id;

    // 🔧 OPRAVA: vložíme skutečný IMG, ne jen text cesty
    cardEl.innerHTML = `
      <div class="card-inner">
        <div class="face front"></div>
        <div class="face back">
          <img src="${card.src}" alt="" loading="lazy" />
        </div>
      </div>
    `;

    cardEl.addEventListener("click", onFlip);
    boardEl.appendChild(cardEl);
  });

  updateCellSize();
}

// ===== Časovač =====
function startTimer() {
  startTime = Date.now();
  timerId = setInterval(() => {
    timeEl.textContent = formatTime(Date.now() - startTime);
  }, 250);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

// ===== Herní logika =====
function resetGame() {
  stopTimer();
  moves = 0; movesEl.textContent = "0";
  timeEl.textContent = "0:00";
  first = second = null;
  lock = false;
  matchedPairs = 0;

  deck = buildDeck(size);
  renderBoard();

  setTimeout(startTimer, 150);
}

function onFlip(e) {
  if (lock) return;
  const cardButton = e.currentTarget;
  if (cardButton.classList.contains("flipped")) return;

  cardButton.classList.add("flipped");

  if (!first) { first = cardButton; return; }
  if (first === cardButton) return;

  second = cardButton;
  moves++; movesEl.textContent = String(moves);
  evaluatePair();
}

// 🔧 OPRAVA: čteme src z IMG
function getSymbol(btn) {
  const img = btn.querySelector(".back img");
  return img ? img.getAttribute("src") : "";
}

function evaluatePair() {
  lock = true;
  const a = getSymbol(first);
  const b = getSymbol(second);

  if (a === b) {
    first.classList.add("matched");
    second.classList.add("matched");
    matchedPairs++;
    [first, second] = [null, null];
    lock = false;

    if (matchedPairs === deck.length / 2) {
      stopTimer();
      setTimeout(() => {
        alert(`Hotovo! Tahy: ${moves}, čas: ${timeEl.textContent}`);
      }, 300);
    }
    return;
  }

  first.classList.add("mismatch");
  second.classList.add("mismatch");
  setTimeout(() => {
    first.classList.remove("flipped", "mismatch");
    second.classList.remove("flipped", "mismatch");
    [first, second] = [null, null];
    lock = false;
  }, 1500);
}

// ===== UI =====
sizeSel.addEventListener("change", () => {
  size = parseInt(sizeSel.value, 10);
  resetGame();
});
restartBtn.addEventListener("click", resetGame);

// ===== Start =====
resetGame();