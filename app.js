import { saveKratong, watchRecentKratongs } from "./firebase.js";

const FLOAT_SECONDS = 30;

// ---------- Kratong drawings ----------
// Each type shares the candle + incense on top; only the base differs.
const TOP = `
  <line x1="56" y1="52" x2="50" y2="14" stroke="#c9a46a" stroke-width="1.6"/>
  <line x1="84" y1="52" x2="90" y2="14" stroke="#c9a46a" stroke-width="1.6"/>
  <circle cx="50" cy="14" r="2" fill="#ff5a3c"/>
  <circle cx="90" cy="14" r="2" fill="#ff5a3c"/>
  <rect x="65" y="30" width="10" height="28" rx="2" fill="#fff4d6"/>
  <rect x="65" y="30" width="3" height="28" rx="1.5" fill="#ffffff" opacity="0.6"/>
  <g class="flame">
    <path d="M70 10 C76 18 76 24 70 30 C64 24 64 18 70 10 Z" fill="#ffb02e"/>
    <path d="M70 17 C73 21 73 25 70 29 C67 25 67 21 70 17 Z" fill="#fff3b0"/>
  </g>`;

const BASES = {
  banana: `
    <ellipse cx="70" cy="92" rx="60" ry="13" fill="#1f5a2c"/>
    <path d="M12 90 L22 66 L32 88 L42 64 L52 88 L62 62 L70 86 L78 62 L88 88 L98 64 L108 88 L118 66 L128 90 Z" fill="#2f8a43" stroke="#1f5a2c" stroke-width="1.5"/>
    <path d="M22 88 L30 72 L38 88 M48 86 L56 70 L64 86 M76 86 L84 70 L92 86 M102 88 L110 72 L118 88" fill="none" stroke="#5fbf6d" stroke-width="1.4"/>
    <ellipse cx="70" cy="62" rx="40" ry="9" fill="#3a9c4f"/>
    <circle cx="44" cy="58" r="7" fill="#ff8fb5"/><circle cx="44" cy="58" r="2.5" fill="#ffe27a"/>
    <circle cx="96" cy="58" r="7" fill="#ff8fb5"/><circle cx="96" cy="58" r="2.5" fill="#ffe27a"/>
    <circle cx="58" cy="60" r="5" fill="#ffffff"/><circle cx="82" cy="60" r="5" fill="#ffffff"/>`,
  lotus: `
    <ellipse cx="70" cy="94" rx="56" ry="11" fill="#2b6b3a"/>
    <path d="M70 92 C40 92 14 84 10 70 C30 72 46 78 70 92 Z" fill="#f48fb1"/>
    <path d="M70 92 C100 92 126 84 130 70 C110 72 94 78 70 92 Z" fill="#f48fb1"/>
    <path d="M70 92 C48 86 28 68 30 50 C46 58 60 72 70 92 Z" fill="#f7a8c4"/>
    <path d="M70 92 C92 86 112 68 110 50 C94 58 80 72 70 92 Z" fill="#f7a8c4"/>
    <path d="M70 92 C58 80 52 62 58 46 C66 56 70 72 70 92 Z" fill="#fbc4d8"/>
    <path d="M70 92 C82 80 88 62 82 46 C74 56 70 72 70 92 Z" fill="#fbc4d8"/>
    <path d="M30 50 C46 58 60 72 70 92" fill="none" stroke="#e46f98" stroke-width="1"/>
    <path d="M110 50 C94 58 80 72 70 92" fill="none" stroke="#e46f98" stroke-width="1"/>`,
  bread: `
    <ellipse cx="70" cy="92" rx="58" ry="14" fill="#8a5527"/>
    <ellipse cx="70" cy="84" rx="58" ry="18" fill="#c98a45"/>
    <ellipse cx="70" cy="80" rx="50" ry="13" fill="#e2ac67"/>
    <path d="M30 78 Q50 70 70 78 T110 78" fill="none" stroke="#b77836" stroke-width="2"/>
    <circle cx="40" cy="84" r="1.6" fill="#8a5527"/><circle cx="56" cy="88" r="1.6" fill="#8a5527"/>
    <circle cx="86" cy="88" r="1.6" fill="#8a5527"/><circle cx="100" cy="84" r="1.6" fill="#8a5527"/>
    <circle cx="46" cy="70" r="6" fill="#ffd34d"/><circle cx="94" cy="70" r="6" fill="#ffd34d"/>
    <circle cx="70" cy="64" r="5" fill="#ff8fb5"/>`,
  marigold: `
    <ellipse cx="70" cy="92" rx="58" ry="13" fill="#2b6b3a"/>
    <path d="M14 90 L26 70 L38 90 L50 70 L62 90 L70 72 L78 90 L90 70 L102 90 L114 70 L126 90 Z" fill="#3b8f4c"/>
    <g fill="#ff9f1c" stroke="#e07b00" stroke-width="1">
      <circle cx="30" cy="74" r="9"/><circle cx="50" cy="68" r="10"/><circle cx="90" cy="68" r="10"/>
      <circle cx="110" cy="74" r="9"/><circle cx="70" cy="66" r="9"/>
    </g>
    <g fill="#ffc94a">
      <circle cx="30" cy="74" r="4.5"/><circle cx="50" cy="68" r="5"/><circle cx="90" cy="68" r="5"/>
      <circle cx="110" cy="74" r="4.5"/><circle cx="70" cy="66" r="4.5"/>
    </g>`,
};

const TYPES = [
  { id: "banana", label: "ใบตอง" },
  { id: "lotus", label: "ดอกบัว" },
  { id: "bread", label: "ขนมปัง" },
  { id: "marigold", label: "ดาวเรือง" },
];

const kratongSvg = (type) =>
  `<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${BASES[type] || BASES.banana}${TOP}</svg>`;

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const picker = $("picker");
const form = $("wishForm");
const nameInput = $("nameInput");
const wishInput = $("wishInput");
const wishCount = $("wishCount");
const formError = $("formError");
const floatBtn = $("floatBtn");
const formPanel = $("formPanel");
const floatingPanel = $("floatingPanel");
const resultPanel = $("resultPanel");
const luckyNumber = $("luckyNumber");
const floatingNote = $("floatingNote");
const progressBar = $("progressBar");
const riverStatus = $("riverStatus");
const lanes = [$("laneBack"), $("laneMid"), $("laneFront")];

let selectedType = "banana";
let current = null; // the user's latest kratong

// ---------- Stars ----------
(function makeStars() {
  const box = $("stars");
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 110; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    const size = Math.random() < 0.15 ? 3 : 2;
    s.style.width = s.style.height = `${size}px`;
    s.style.setProperty("--d", `${2 + Math.random() * 4}s`);
    s.style.setProperty("--delay", `${-Math.random() * 5}s`);
    frag.appendChild(s);
  }
  box.appendChild(frag);
})();

// ---------- Picker ----------
TYPES.forEach((t) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pick";
  b.setAttribute("role", "radio");
  b.setAttribute("aria-checked", String(t.id === selectedType));
  b.dataset.type = t.id;
  b.innerHTML = `${kratongSvg(t.id)}<span>${t.label}</span>`;
  b.addEventListener("click", () => {
    selectedType = t.id;
    picker.querySelectorAll(".pick").forEach((p) =>
      p.setAttribute("aria-checked", String(p.dataset.type === selectedType))
    );
  });
  picker.appendChild(b);
});

wishInput.addEventListener("input", () => {
  wishCount.textContent = `${wishInput.value.length}/120`;
});

// ---------- River ----------
/** Put one kratong on the river. Returns its element. */
function launch({ name, wish, type }, { lane = 2, seconds = 40, mine = false } = {}) {
  const el = document.createElement("div");
  el.className = `kratong${mine ? " mine" : ""}`;
  el.style.setProperty("--dur", `${seconds}s`);
  el.style.setProperty("--bob", `${-Math.random() * 3}s`);

  const bob = document.createElement("div");
  bob.className = "bob";
  bob.innerHTML = `${mine ? '<div class="glow"></div>' : ""}<div class="ripple"></div><div class="ripple r2"></div>${kratongSvg(type)}`;

  // User text goes in with textContent only.
  const tag = document.createElement("div");
  tag.className = "tag";
  const b = document.createElement("b");
  b.textContent = name;
  tag.appendChild(b);
  if (wish) tag.appendChild(document.createTextNode(wish));
  bob.prepend(tag);

  el.appendChild(bob);
  el.addEventListener("animationend", (e) => {
    if (e.animationName === "drift") el.remove();
  });
  lanes[lane].appendChild(el);
  return el;
}

// Other people's kratongs, cycled across the back and middle lanes.
let others = [];
let nextOther = 0;
const ownIds = new Set();

let seeded = false;

function spawnOther() {
  if (!others.length) return;
  const k = others[nextOther % others.length];
  nextOther++;
  const lane = Math.random() < 0.5 ? 0 : 1;
  launch(k, { lane, seconds: 45 + Math.random() * 30 });
}

watchRecentKratongs(
  30,
  (list, added) => {
    others = list.filter((k) => !ownIds.has(k.id));
    riverStatus.textContent = others.length
      ? `มีกระทงลอยอยู่ ${others.length} ใบจากทุกคน`
      : "ยังไม่มีใครลอยกระทง — มาเป็นคนแรกกัน";

    if (!seeded) {
      // Seed a few already mid-river so the scene isn't empty on load.
      seeded = true;
      for (let i = 0; i < Math.min(4, others.length); i++) {
        const el = launch(others[nextOther++ % others.length], { lane: i % 2, seconds: 60 });
        el.style.animationDelay = `${-(10 + i * 12)}s`;
      }
    }
    // Someone just floated one: put it on the river right away.
    added.filter((k) => !ownIds.has(k.id)).forEach((k) => launch(k, { lane: 1, seconds: 50 }));
  },
  (err) => {
    console.error("Could not load kratongs from Firestore", err);
    riverStatus.textContent = "โหลดกระทงของคนอื่นไม่ได้ (ตรวจสอบ Firestore rules)";
  }
);
setInterval(spawnOther, 6000);

// ---------- Flow ----------
function show(panel) {
  [formPanel, floatingPanel, resultPanel].forEach((p) => p.classList.toggle("hidden", p !== panel));
}

function randomLucky() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 100;
  return String(n).padStart(2, "0");
}

function spinTo(el, final, ms = 1800) {
  return new Promise((resolve) => {
    el.classList.remove("landed");
    el.classList.add("spinning");
    const start = performance.now();
    const tick = (now) => {
      if (now - start < ms) {
        el.textContent = String(Math.floor(Math.random() * 100)).padStart(2, "0");
        setTimeout(() => requestAnimationFrame(tick), 60);
      } else {
        el.textContent = final;
        el.classList.remove("spinning");
        el.classList.add("landed");
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const wish = wishInput.value.trim();
  if (!name || !wish) {
    formError.textContent = !name ? "กรุณาใส่ชื่อของคุณ" : "กรุณาใส่คำอธิษฐาน";
    (!name ? nameInput : wishInput).focus();
    return;
  }
  formError.textContent = "";

  const lucky = randomLucky();
  current = { name, wish, type: selectedType, lucky };

  // Float right away; saving happens alongside.
  show(floatingPanel);
  floatingNote.textContent = "กระทงของคุณกำลังลอยไป…";
  launch(current, { lane: 2, seconds: FLOAT_SECONDS, mine: true });
  spinTo(luckyNumber, lucky);

  saveKratong(current)
    .then((id) => {
      ownIds.add(id);
      floatingNote.textContent = "กระทงของคุณลอยไปพร้อมกับทุกคนแล้ว…";
    })
    .catch((err) => {
      console.error("Could not save kratong to Firestore", err);
      floatingNote.textContent = "บันทึกขึ้นแม่น้ำรวมไม่สำเร็จ แต่กระทงของคุณยังลอยอยู่ตรงนี้";
    });

  const started = Date.now();
  progressBar.style.width = "0%";
  const timer = setInterval(() => {
    const p = Math.min(1, (Date.now() - started) / (FLOAT_SECONDS * 1000));
    progressBar.style.width = `${p * 100}%`;
    if (p >= 1) {
      clearInterval(timer);
      showResult();
    }
  }, 250);
});

function showResult() {
  $("resultWish").textContent = `“${current.wish}” — ${current.name}`;
  $("resultNumber").textContent = current.lucky;
  $("shareNote").textContent = "";
  show(resultPanel);
}

$("againBtn").addEventListener("click", () => {
  wishInput.value = "";
  wishCount.textContent = "0/120";
  show(formPanel);
  wishInput.focus();
});

$("shareBtn").addEventListener("click", async () => {
  const text = `ฉันลอยกระทงออนไลน์แล้ว ได้เลขมงคล ${current.lucky} มาลอยด้วยกันนะ`;
  const url = location.href.split("#")[0];
  try {
    if (navigator.share) {
      await navigator.share({ title: "ลอยกระทงออนไลน์", text, url });
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      $("shareNote").textContent = "คัดลอกข้อความแล้ว";
    }
  } catch {
    /* user cancelled */
  }
});
