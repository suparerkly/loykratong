// Effects played while a kratong floats (one picked at random),
// plus petals for the result screen. All plain DOM + CSS animations.

const fx = () => document.getElementById("fx");
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rand = (a, b) => a + Math.random() * (b - a);

function riverTop() {
  return document.querySelector(".river").getBoundingClientRect().top;
}

/** Add an element that removes itself when its animation ends. */
function spawn(className, styles, parent = fx(), html = "") {
  const el = document.createElement("div");
  el.className = className;
  Object.entries(styles).forEach(([k, v]) =>
    k.startsWith("--") ? el.style.setProperty(k, v) : (el.style[k] = v)
  );
  if (html) el.innerHTML = html;
  el.addEventListener("animationend", (e) => {
    if (e.target === el && !el.classList.contains("fx-firefly")) el.remove();
  });
  parent.appendChild(el);
  return el;
}

/** Run `tick` every `every` ms (with jitter) for `duration` ms. */
function repeat(tick, every, duration) {
  const end = Date.now() + duration;
  let timer;
  const loop = () => {
    if (Date.now() > end) return;
    tick();
    timer = setTimeout(loop, every * rand(0.6, 1.4));
  };
  loop();
  return () => clearTimeout(timer);
}

const EFFECTS = {
  lanterns: {
    label: "โคมลอยขึ้นฟ้า",
    run(duration) {
      repeat(() => {
        spawn("fx-lantern", {
          left: `${rand(4, 96)}%`,
          "--dur": `${rand(11, 17)}s`,
          "--sway": `${rand(-40, 40)}px`,
          ...(() => { const k = rand(0.7, 1.25); return { width: `${18 * k}px`, height: `${24 * k}px` }; })(),
        });
      }, 900, duration - 6000);
    },
  },

  fireworks: {
    label: "พลุ",
    run(duration) {
      const colors = ["#ffd34d", "#ff6b8b", "#7ee0ff", "#b6ff7a", "#ffffff", "#ff9f1c"];
      repeat(() => {
        const x = rand(10, 90) / 100 * window.innerWidth;
        const y = rand(0.08, 0.35) * window.innerHeight;
        const rise = riverTop() - y;
        // Rocket goes up, then bursts.
        spawn("fx-rocket", { left: `${x}px`, top: `${riverTop()}px`, "--rise": `${-rise}px` });
        setTimeout(() => {
          const c = colors[Math.floor(Math.random() * colors.length)];
          const n = 28;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const r = rand(60, 110);
            spawn("fx-spark", {
              left: `${x}px`,
              top: `${y}px`,
              "--c": c,
              "--dx": `${Math.cos(a) * r}px`,
              "--dy": `${Math.sin(a) * r}px`,
            });
          }
        }, 700);
      }, 1300, duration - 2000);
    },
  },

  meteors: {
    label: "ดาวตก",
    run(duration) {
      repeat(() => {
        spawn("fx-meteor", {
          left: `${rand(35, 105)}%`,
          top: `${rand(2, 30)}%`,
        });
      }, 1600, duration - 1500);
    },
  },

  fireflies: {
    label: "หิ่งห้อย",
    run(duration) {
      const top = riverTop();
      const flies = [];
      for (let i = 0; i < 46; i++) {
        flies.push(
          spawn("fx-firefly", {
            left: `${rand(0, 100)}%`,
            top: `${top + rand(-120, 140)}px`,
            "--d": `${rand(2, 4.5)}s`,
            "--dx": `${rand(-40, 40)}px`,
            "--dy": `${rand(-30, 30)}px`,
            animationDelay: `${rand(0, 2)}s, 0s`,
          })
        );
      }
      setTimeout(() => {
        flies.forEach((f) => f.classList.add("fx-out"));
        setTimeout(() => flies.forEach((f) => f.remove()), 1600);
      }, duration - 1500);
    },
  },

  fish: {
    label: "ปลากระโดด",
    run(duration) {
      const fishSvg = (c) =>
        `<svg viewBox="0 0 46 20" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="10" rx="16" ry="7" fill="${c}"/><path d="M34 10 L46 2 L44 10 L46 18 Z" fill="${c}"/><circle cx="10" cy="8" r="1.6" fill="#1a1a1a"/><path d="M18 4 Q22 0 26 4" fill="${c}"/></svg>`;
      const colors = ["#ff9f1c", "#ffd34d", "#e8eef5", "#ff7a59"];
      repeat(() => {
        const top = riverTop();
        const h = window.innerHeight - top;
        const x = rand(5, 85) / 100 * window.innerWidth;
        const y = top + rand(0.25, 0.85) * h;
        const jx = rand(35, 60);
        spawn("fx-splash", { left: `${x + 10}px`, top: `${y}px` });
        spawn("fx-fish", { left: `${x}px`, top: `${y - 10}px`, "--jx": `${jx}px` }, fx(), fishSvg(colors[Math.floor(Math.random() * colors.length)]));
        setTimeout(() => spawn("fx-splash", { left: `${x + 10 + jx * 2}px`, top: `${y}px` }), 1400);
      }, 1500, duration - 2000);
    },
  },
};

/** Pick one effect at random, play it for `duration` ms, and return its Thai label. */
export function playRandomEffect(duration) {
  const keys = Object.keys(EFFECTS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  if (!reduceMotion()) EFFECTS[key].run(duration);
  return EFFECTS[key].label;
}

export function dropPetals(count = 40) {
  if (reduceMotion()) return;
  const box = document.getElementById("petals");
  const colors = ["#f7a8c4", "#fbc4d8", "#ffd34d", "#ff9f1c", "#ffffff"];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      spawn("petal", {
        left: `${rand(0, 100)}%`,
        "--c": colors[Math.floor(Math.random() * colors.length)],
        "--dur": `${rand(5, 9)}s`,
        "--dx": `${rand(-80, 120)}px`,
        "--rot": `${rand(300, 900)}deg`,
      }, box);
    }, i * 120);
  }
}
