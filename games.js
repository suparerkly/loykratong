// Three mini games in one overlay: flower catch, candle in the wind, memory match.
// Scores stay in this browser (localStorage). The flower game's catch decorates
// the player's next kratong through the onFlowers callback.

const $ = (id) => document.getElementById(id);
const W = 360;
const H = 480;
const rand = (a, b) => a + Math.random() * (b - a);

const overlay = $("gameOverlay");
const title = $("gameTitle");
const menu = $("gameMenu");
const stage = $("gameStage");
const result = $("gameResult");
const canvas = $("gameCanvas");
const grid = $("memoryGrid");
const hudLeft = $("hudLeft");
const hudRight = $("hudRight");
const help = $("gameHelp");
const backBtn = $("gameBack");

const ctx = canvas.getContext("2d");
const dpr = Math.min(2, window.devicePixelRatio || 1);
canvas.width = W * dpr;
canvas.height = H * dpr;
ctx.scale(dpr, dpr);

const NAMES = { catch: "เก็บดอกไม้แต่งกระทง", candle: "ประคองเทียนฝ่าลม", memory: "จับคู่ไพ่ลอยกระทง" };

let current = null; // { name, stop() }
let lastGame = null;
let onFlowers = () => {};

// ---------- Best scores ----------
function best(name) {
  try { return JSON.parse(localStorage.getItem(`loykratong-best-${name}`)); } catch { return null; }
}
function saveBest(name, value, better) {
  const old = best(name);
  if (old == null || better(value, old)) {
    try { localStorage.setItem(`loykratong-best-${name}`, JSON.stringify(value)); } catch { /* private mode */ }
    return true;
  }
  return false;
}
function showBests() {
  const c = best("catch"), k = best("candle"), m = best("memory");
  $("best-catch").textContent = c != null ? `สถิติของคุณ: ${c} คะแนน` : "";
  $("best-candle").textContent = k != null ? `สถิติของคุณ: บังลมได้ ${k} ครั้ง` : "";
  $("best-memory").textContent = m != null ? `สถิติของคุณ: ${"★".repeat(m.stars)} (${m.moves} ครั้ง)` : "";
}

// ---------- Screens ----------
function view(which) {
  menu.classList.toggle("hidden", which !== "menu");
  stage.classList.toggle("hidden", which !== "stage");
  result.classList.toggle("hidden", which !== "result");
  backBtn.classList.toggle("hidden", which === "menu");
}

function openMenu() {
  stopGame();
  title.textContent = "เลือกมินิเกม";
  showBests();
  view("menu");
}

function stopGame() {
  if (current) current.stop();
  current = null;
}

function finish(score, reward) {
  stopGame();
  $("gameScore").textContent = score;
  $("gameReward").textContent = reward;
  view("result");
}

function start(name) {
  stopGame();
  lastGame = name;
  title.textContent = NAMES[name];
  canvas.classList.toggle("hidden", name === "memory");
  grid.classList.toggle("hidden", name !== "memory");
  view("stage");
  current = { catch: startCatch, candle: startCandle, memory: startMemory }[name]();
}

/** Game loop helper: calls step(dt) each frame until stopped. */
function loop(step) {
  let last = performance.now();
  let raf = 0;
  let running = true;
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    if (running) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => { running = false; cancelAnimationFrame(raf); };
}

function pointerX(e) {
  const r = canvas.getBoundingClientRect();
  return ((e.clientX - r.left) / r.width) * W;
}

// ---------- Shared drawing ----------
function drawNight(waterY = 400) {
  ctx.fillStyle = "#0b1236";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  for (let i = 0; i < 30; i++) ctx.fillRect((i * 97) % W, (i * 53) % (waterY - 40), 1.5, 1.5);
  ctx.fillStyle = "#0e1d4a";
  ctx.fillRect(0, waterY, W, H - waterY);
}

function drawFlame(x, y, scale = 1, lean = 0) {
  const f = 1 + Math.sin(performance.now() / 60) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale * f);
  ctx.transform(1, 0, lean, 1, 0, 0);
  const glow = ctx.createRadialGradient(0, -10, 2, 0, -10, 34);
  glow.addColorStop(0, "rgba(255,190,90,0.45)");
  glow.addColorStop(1, "rgba(255,190,90,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, -10, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffb02e";
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.bezierCurveTo(9, -14, 9, -6, 0, 0);
  ctx.bezierCurveTo(-9, -6, -9, -14, 0, -26);
  ctx.fill();
  ctx.fillStyle = "#fff3b0";
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.bezierCurveTo(4, -10, 4, -5, 0, -1);
  ctx.bezierCurveTo(-4, -5, -4, -10, 0, -16);
  ctx.fill();
  ctx.restore();
}

function drawKratong(x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "#1f5a2c";
  ctx.beginPath(); ctx.ellipse(0, 10, 40, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2f8a43";
  ctx.beginPath();
  ctx.moveTo(-38, 8);
  for (let i = 0; i < 8; i++) {
    ctx.lineTo(-33 + i * 9.5, -10);
    ctx.lineTo(-28 + i * 9.5, 8);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff4d6";
  ctx.fillRect(-4, -30, 8, 22);
  ctx.restore();
  drawFlame(x, y - 30 * s, 0.6 * s);
}

function drawFlower(x, y, kind) {
  if (kind === "bottle") {
    ctx.fillStyle = "#9fb4c8";
    ctx.beginPath(); ctx.roundRect(x - 7, y - 10, 14, 22, 4); ctx.fill();
    ctx.fillStyle = "#5f7a90";
    ctx.fillRect(x - 3, y - 16, 6, 6);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(x - 4, y - 6, 3, 12);
    return;
  }
  const petal = { marigold: "#ff9f1c", lotus: "#f48fb1", jasmine: "#ffffff" }[kind];
  const center = { marigold: "#ffd34d", lotus: "#ffe27a", jasmine: "#ffd34d" }[kind];
  const n = kind === "lotus" ? 6 : 8;
  ctx.fillStyle = petal;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 7, y + Math.sin(a) * 7, kind === "lotus" ? 7 : 5, 4, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
}

function drawText(text, y, size = 22, color = "#ffc65c") {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px Mitr, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, y);
}

// ---------- 1. Flower catch ----------
function startCatch() {
  const DURATION = 30;
  const POINTS = { marigold: 1, jasmine: 1, lotus: 2, bottle: -2 };
  let t = 0;
  let score = 0;
  let flowers = 0;
  let px = W / 2;
  let target = W / 2;
  let spawnIn = 0;
  const keys = { left: false, right: false };
  const items = [];
  const pops = [];
  help.textContent = "ลากนิ้วหรือเมาส์ หรือกดลูกศรซ้าย/ขวา · ดอกบัว +2 · ขวด −2";

  const move = (e) => { target = pointerX(e); };
  const key = (e) => {
    const down = e.type === "keydown";
    if (e.key === "ArrowLeft") { keys.left = down; e.preventDefault(); }
    if (e.key === "ArrowRight") { keys.right = down; e.preventDefault(); }
  };
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerdown", move);
  window.addEventListener("keydown", key);
  window.addEventListener("keyup", key);

  const stopLoop = loop((dt) => {
    t += dt;
    const level = t / DURATION;
    if (keys.left) target = px - 400 * dt;
    if (keys.right) target = px + 400 * dt;
    target = Math.max(36, Math.min(W - 36, target));
    px += (target - px) * Math.min(1, dt * 14);

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnIn = 0.6 - level * 0.28;
      const r = Math.random();
      const kind = r < 0.38 ? "marigold" : r < 0.58 ? "jasmine" : r < 0.76 ? "lotus" : "bottle";
      items.push({ x: rand(20, W - 20), y: -20, vy: rand(120, 170) + level * 120, kind, spin: rand(-2, 2) });
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy * dt;
      if (it.y > 400 && it.y < 432 && Math.abs(it.x - px) < 42) {
        const p = POINTS[it.kind];
        score = Math.max(0, score + p);
        if (p > 0) flowers += 1;
        pops.push({ x: it.x, y: it.y, text: p > 0 ? `+${p}` : `${p}`, good: p > 0, life: 0.8 });
        items.splice(i, 1);
      } else if (it.y > H + 20) {
        items.splice(i, 1);
      }
    }

    drawNight(420);
    items.forEach((it) => drawFlower(it.x, it.y, it.kind));
    drawKratong(px, 432);
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.life -= dt;
      p.y -= 40 * dt;
      ctx.globalAlpha = Math.max(0, p.life / 0.8);
      ctx.fillStyle = p.good ? "#b6ff7a" : "#ff8a7a";
      ctx.font = "600 18px Mitr, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
      if (p.life <= 0) pops.splice(i, 1);
    }
    hudLeft.textContent = `คะแนน ${score}`;
    hudRight.textContent = `เวลา ${Math.ceil(DURATION - t)} วิ`;

    if (t >= DURATION) {
      const record = saveBest("catch", score, (a, b) => a > b);
      const deco = Math.min(12, flowers);
      onFlowers(deco);
      finish(
        `${score} คะแนน`,
        `${record ? "สถิติใหม่! " : ""}เก็บดอกไม้ได้ ${flowers} ดอก` +
          (deco ? ` · จะนำ ${deco} ดอกไปแต่งกระทงใบถัดไปของคุณ` : "")
      );
    }
  });

  return {
    stop() {
      stopLoop();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", move);
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
    },
  };
}

// ---------- 2. Candle in the wind ----------
function startCandle() {
  const DURATION = 30;
  let t = 0;
  let meter = 100;
  let blocked = 0;
  let shield = null; // "left" | "right"
  let nextGust = 1.2;
  let lean = 0;
  let flash = 0;
  let flashGood = true;
  const gusts = []; // { side, left: seconds until it hits, lead }
  help.textContent = "แตะครึ่งซ้ายหรือขวาของจอ (หรือกดลูกศร) ให้มือบังฝั่งที่ลมกำลังมา";

  const setShield = (side) => { shield = side; };
  const down = (e) => setShield(pointerX(e) < W / 2 ? "left" : "right");
  const key = (e) => {
    if (e.key === "ArrowLeft") { setShield("left"); e.preventDefault(); }
    if (e.key === "ArrowRight") { setShield("right"); e.preventDefault(); }
  };
  canvas.addEventListener("pointerdown", down);
  window.addEventListener("keydown", key);

  const cx = W / 2;
  const candleTop = 300;

  const stopLoop = loop((dt) => {
    t += dt;
    const level = t / DURATION;
    nextGust -= dt;
    if (nextGust <= 0) {
      const lead = 1.0 - level * 0.45;
      gusts.push({ side: Math.random() < 0.5 ? "left" : "right", left: lead, lead });
      nextGust = 1.7 - level * 0.85 + rand(-0.2, 0.2);
    }
    for (let i = gusts.length - 1; i >= 0; i--) {
      const g = gusts[i];
      g.left -= dt;
      if (g.left <= 0) {
        if (shield === g.side) {
          blocked += 1;
          flashGood = true;
        } else {
          meter -= 20;
          lean = g.side === "left" ? 0.6 : -0.6;
          flashGood = false;
        }
        flash = 0.25;
        gusts.splice(i, 1);
      }
    }
    lean *= Math.pow(0.02, dt);
    flash = Math.max(0, flash - dt);

    // Scene
    drawNight(380);
    if (flash > 0) {
      ctx.fillStyle = flashGood ? "rgba(182,255,122,0.12)" : "rgba(255,120,100,0.18)";
      ctx.fillRect(0, 0, W, H);
    }
    // Incoming wind: streaks travelling toward the candle.
    ctx.strokeStyle = "rgba(181,212,244,0.85)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    gusts.forEach((g) => {
      const p = 1 - g.left / g.lead; // 0 → 1 as it arrives
      const dir = g.side === "left" ? 1 : -1;
      const startX = g.side === "left" ? -40 : W + 40;
      const x = startX + dir * p * (W / 2 - 10);
      for (let k = 0; k < 3; k++) {
        const y = candleTop - 40 + k * 22;
        ctx.beginPath();
        ctx.moveTo(x - dir * 50, y);
        ctx.quadraticCurveTo(x - dir * 25, y - 6, x, y);
        ctx.stroke();
      }
    });
    // Kratong base and candle
    ctx.fillStyle = "#1f5a2c";
    ctx.beginPath(); ctx.ellipse(cx, 392, 90, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2f8a43";
    ctx.beginPath();
    ctx.moveTo(cx - 86, 388);
    for (let i = 0; i < 9; i++) { ctx.lineTo(cx - 76 + i * 19, 352); ctx.lineTo(cx - 66 + i * 19, 388); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff4d6";
    ctx.fillRect(cx - 10, candleTop, 20, 70);
    if (meter > 0) drawFlame(cx, candleTop, 0.6 + (meter / 100) * 0.9, lean);
    // Shielding hand
    if (shield) {
      const hx = shield === "left" ? cx - 52 : cx + 52;
      ctx.fillStyle = "#f5c4b3";
      ctx.strokeStyle = "#d9957f";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(hx - 13, candleTop - 70, 26, 80, 13); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(hx + (shield === "left" ? 6 : -26), candleTop - 18, 20, 12, 6); ctx.fill(); ctx.stroke();
    }
    // Light meter
    ctx.fillStyle = "#0c1a38";
    ctx.beginPath(); ctx.roundRect(20, 20, W - 40, 12, 6); ctx.fill();
    ctx.fillStyle = meter > 40 ? "#ef9f27" : "#ff6b5b";
    ctx.beginPath(); ctx.roundRect(20, 20, Math.max(0, (W - 40) * meter / 100), 12, 6); ctx.fill();

    hudLeft.textContent = `บังลมได้ ${blocked} ครั้ง`;
    hudRight.textContent = `เวลา ${Math.ceil(Math.max(0, DURATION - t))} วิ`;

    if (meter <= 0 || t >= DURATION) {
      const record = saveBest("candle", blocked, (a, b) => a > b);
      const lit = Math.max(0, meter);
      const blessing =
        lit >= 80 ? "เปลวเทียนสว่างไสว ขอให้ชีวิตรุ่งเรืองตลอดปี" :
        lit >= 40 ? "เปลวเทียนยังส่องทาง ขอให้ผ่านอุปสรรคไปได้ทุกเรื่อง" :
        lit > 0 ? "แม้ลมแรงแต่ไฟยังไม่ดับ ขอให้ใจเข้มแข็งเสมอ" :
        "เทียนดับแล้ว ลองจุดใหม่อีกครั้งนะ";
      finish(lit > 0 ? `ไฟเหลือ ${lit}%` : "เทียนดับ", `${record ? "สถิติใหม่! " : ""}บังลมได้ ${blocked} ครั้ง · ${blessing}`);
    }
  });

  return {
    stop() {
      stopLoop();
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key);
    },
  };
}

// ---------- 3. Memory match ----------
const CARD_ART = {
  kratong: `<svg viewBox="0 0 60 50"><ellipse cx="30" cy="42" rx="26" ry="6" fill="#1f5a2c"/><path d="M5 40 L11 28 L17 40 L23 26 L30 38 L37 26 L43 40 L49 28 L55 40Z" fill="#2f8a43"/><rect x="27" y="12" width="6" height="16" fill="#fff4d6"/><path d="M30 2 C34 7 34 10 30 13 C26 10 26 7 30 2Z" fill="#ffb02e"/></svg>`,
  lantern: `<svg viewBox="0 0 60 50"><rect x="20" y="6" width="20" height="30" rx="6" fill="#f28c28"/><rect x="20" y="6" width="20" height="10" rx="5" fill="#ffd27a"/><rect x="25" y="36" width="10" height="4" fill="#8a5527"/><path d="M30 40 L30 47" stroke="#ffb02e" stroke-width="2"/></svg>`,
  lotus: `<svg viewBox="0 0 60 50"><path d="M30 44 C14 44 4 36 4 28 C14 30 22 34 30 44Z" fill="#f48fb1"/><path d="M30 44 C46 44 56 36 56 28 C46 30 38 34 30 44Z" fill="#f48fb1"/><path d="M30 44 C20 36 16 22 22 10 C28 18 30 30 30 44Z" fill="#f7a8c4"/><path d="M30 44 C40 36 44 22 38 10 C32 18 30 30 30 44Z" fill="#f7a8c4"/></svg>`,
  moon: `<svg viewBox="0 0 60 50"><circle cx="30" cy="25" r="18" fill="#fbeec3"/><circle cx="24" cy="20" r="3" fill="#e9d79c"/><circle cx="35" cy="30" r="4" fill="#e9d79c"/></svg>`,
  candle: `<svg viewBox="0 0 60 50"><rect x="24" y="20" width="12" height="26" rx="2" fill="#fff4d6" stroke="#e0c58f"/><path d="M30 4 C37 12 37 16 30 20 C23 16 23 12 30 4Z" fill="#ffb02e"/><path d="M30 10 C33 13 33 16 30 19 C27 16 27 13 30 10Z" fill="#fff3b0"/></svg>`,
  marigold: `<svg viewBox="0 0 60 50"><g fill="#ff9f1c"><circle cx="30" cy="14" r="8"/><circle cx="41" cy="22" r="8"/><circle cx="37" cy="35" r="8"/><circle cx="23" cy="35" r="8"/><circle cx="19" cy="22" r="8"/></g><circle cx="30" cy="25" r="8" fill="#ffd34d"/></svg>`,
};

function startMemory() {
  const LIMIT = 45;
  const keys = Object.keys(CARD_ART);
  const deck = [...keys, ...keys]
    .map((k) => ({ k, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map((c) => c.k);
  let open = [];
  let moves = 0;
  let matched = 0;
  let busy = false;
  let ended = false;
  const startedAt = performance.now();
  help.textContent = "แตะไพ่ทีละ 2 ใบเพื่อหาคู่ที่เหมือนกัน";

  grid.innerHTML = "";
  deck.forEach((k, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "memory-card";
    b.dataset.k = k;
    b.setAttribute("aria-label", `ไพ่ใบที่ ${i + 1}`);
    b.innerHTML = `<span class="inner"><span class="back"></span><span class="face">${CARD_ART[k]}</span></span>`;
    b.addEventListener("click", () => flip(b));
    grid.appendChild(b);
  });

  function flip(card) {
    if (busy || ended || card.classList.contains("open") || card.classList.contains("done")) return;
    card.classList.add("open");
    open.push(card);
    if (open.length < 2) return;
    moves += 1;
    const [a, b] = open;
    open = [];
    if (a.dataset.k === b.dataset.k) {
      a.classList.replace("open", "done");
      b.classList.replace("open", "done");
      matched += 2;
      if (matched === deck.length) win();
    } else {
      busy = true;
      setTimeout(() => {
        a.classList.remove("open");
        b.classList.remove("open");
        busy = false;
      }, 700);
    }
    update();
  }

  function update() {
    const left = Math.max(0, LIMIT - (performance.now() - startedAt) / 1000);
    hudLeft.textContent = `พลิก ${moves} ครั้ง`;
    hudRight.textContent = `เวลา ${Math.ceil(left)} วิ`;
    return left;
  }

  function win() {
    ended = true;
    const stars = moves <= 9 ? 3 : moves <= 13 ? 2 : 1;
    const record = saveBest("memory", { stars, moves }, (a, b) => a.stars > b.stars || (a.stars === b.stars && a.moves < b.moves));
    setTimeout(() => finish("★".repeat(stars) + "☆".repeat(3 - stars), `${record ? "สถิติใหม่! " : ""}จับคู่ครบใน ${moves} ครั้ง`), 600);
  }

  const timer = setInterval(() => {
    if (ended) return;
    if (update() <= 0) {
      ended = true;
      finish("หมดเวลา", `จับคู่ได้ ${matched / 2} จาก ${deck.length / 2} คู่ ลองใหม่อีกครั้งนะ`);
    }
  }, 250);
  update();

  return { stop() { clearInterval(timer); ended = true; } };
}

// ---------- Public ----------
export function initGames(options = {}) {
  onFlowers = options.onFlowers || onFlowers;
  document.querySelectorAll("[data-open-games]").forEach((b) =>
    b.addEventListener("click", () => {
      overlay.classList.remove("hidden");
      openMenu();
    })
  );
  menu.querySelectorAll("[data-game]").forEach((b) => b.addEventListener("click", () => start(b.dataset.game)));
  $("gameReplay").addEventListener("click", () => start(lastGame));
  $("gameMenuBtn").addEventListener("click", openMenu);
  backBtn.addEventListener("click", openMenu);
  const close = () => { stopGame(); overlay.classList.add("hidden"); };
  $("gameClose").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && !overlay.classList.contains("hidden")) close(); });
}
