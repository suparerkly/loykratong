// Background themes: sky/water colours live in style.css (body[data-theme]),
// the far-bank silhouette for each theme is drawn here.

const W = 1200;
const H = 160;

function hills(fill) {
  return `<path d="M0 160 V128 C80 108 160 104 240 120 C330 138 400 112 480 110 C560 108 620 130 700 128 C800 124 860 100 960 106 C1060 112 1120 126 1200 120 V160 Z" fill="${fill}"/>`;
}

function mountains() {
  return `
    <path d="M0 160 V96 L90 60 L170 92 L260 40 L360 100 L450 70 L540 104 L640 50 L740 98 L830 72 L930 106 L1030 56 L1120 94 L1200 76 V160 Z" fill="#2a1446" opacity="0.8"/>
    <path d="M0 160 V124 L120 100 L230 126 L340 108 L470 130 L600 104 L720 128 L860 106 L980 130 L1100 110 L1200 124 V160 Z" fill="#120a24"/>`;
}

function temples() {
  const prang = (x, s) => `
    <g transform="translate(${x} 160) scale(${s})" fill="#2c1208">
      <rect x="-22" y="-40" width="44" height="40"/>
      <path d="M-18 -40 C-18 -70 -10 -96 0 -120 C10 -96 18 -70 18 -40 Z"/>
      <rect x="-2" y="-138" width="4" height="20"/>
      <rect x="-30" y="-6" width="60" height="6"/>
    </g>`;
  const chedi = (x, s) => `
    <g transform="translate(${x} 160) scale(${s})" fill="#2c1208">
      <rect x="-26" y="-14" width="52" height="14"/>
      <path d="M-22 -14 C-22 -40 -12 -52 0 -54 C12 -52 22 -40 22 -14 Z"/>
      <path d="M-6 -52 L0 -100 L6 -52 Z"/>
    </g>`;
  const pillar = (x, h) => `<rect x="${x}" y="${160 - h}" width="10" height="${h}" fill="#2c1208"/>`;
  return `
    <path d="M0 160 V140 H1200 V160 Z" fill="#2c1208"/>
    ${chedi(140, 1)}${pillar(230, 46)}${pillar(252, 52)}${pillar(274, 40)}
    ${prang(420, 1.1)}${chedi(520, 0.8)}${prang(610, 1.25)}${chedi(700, 0.8)}${prang(800, 1.1)}
    ${pillar(900, 44)}${pillar(922, 52)}${chedi(1040, 1.1)}${chedi(1140, 0.7)}`;
}

function city() {
  let blocks = "";
  let x = 0;
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  while (x < W) {
    const w = 40 + rand() * 50;
    const h = 50 + rand() * 90;
    // Leave the middle open for the bridge.
    if (x > 380 && x < 820) { x += w; continue; }
    blocks += `<rect x="${x.toFixed(0)}" y="${(H - h).toFixed(0)}" width="${(w - 4).toFixed(0)}" height="${h.toFixed(0)}" fill="#14223f"/>`;
    for (let wy = H - h + 8; wy < H - 8; wy += 14) {
      for (let wx = x + 6; wx < x + w - 12; wx += 12) {
        if (rand() < 0.35) blocks += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="4" height="5" fill="#fac775" opacity="0.75"/>`;
      }
    }
    x += w;
  }
  const cables = [];
  for (let i = 1; i <= 6; i++) {
    cables.push(`<line x1="600" y1="40" x2="${600 - i * 34}" y2="140" />`, `<line x1="600" y1="40" x2="${600 + i * 34}" y2="140" />`);
  }
  return `
    ${blocks}
    <g stroke="#ed93b1" stroke-width="1.6" opacity="0.9">${cables.join("")}</g>
    <rect x="594" y="30" width="12" height="112" fill="#ed93b1"/>
    <rect x="380" y="138" width="440" height="6" fill="#ed93b1"/>`;
}

const SKYLINES = {
  river: () => hills("#050818"),
  lanterns: mountains,
  temple: temples,
  city,
};

function fillSkyLanterns(on) {
  const box = document.getElementById("skyLanterns");
  box.innerHTML = "";
  if (!on) return;
  for (let i = 0; i < 26; i++) {
    const l = document.createElement("span");
    l.className = "sky-lantern";
    const depth = 0.5 + Math.random() * 0.8;
    l.style.left = `${Math.random() * 96}%`;
    l.style.top = `${10 + Math.random() * 75}%`;
    l.style.width = `${12 * depth}px`;
    l.style.height = `${16 * depth}px`;
    l.style.opacity = String(0.5 + depth / 3);
    l.style.setProperty("--d", `${6 + Math.random() * 6}s`);
    l.style.setProperty("--dx", `${-15 + Math.random() * 30}px`);
    l.style.animationDelay = `${-Math.random() * 8}s`;
    box.appendChild(l);
  }
}

export function setTheme(name) {
  if (!SKYLINES[name]) name = "river";
  document.body.dataset.theme = name;
  document.getElementById("skyline").innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">${SKYLINES[name]()}</svg>`;
  fillSkyLanterns(name === "lanterns");
  document.querySelectorAll(".theme-picker button").forEach((b) =>
    b.setAttribute("aria-checked", String(b.dataset.theme === name))
  );
  try { localStorage.setItem("loykratong-theme", name); } catch { /* private mode */ }
}

export function initThemes() {
  document.querySelectorAll(".theme-picker button").forEach((b) =>
    b.addEventListener("click", () => setTheme(b.dataset.theme))
  );
  let saved = "river";
  try { saved = localStorage.getItem("loykratong-theme") || "river"; } catch { /* private mode */ }
  setTheme(saved);
}
