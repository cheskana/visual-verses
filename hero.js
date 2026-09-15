/* Visual Verses hero: the pixel system.
   1. Field   the grid paper is a live pixel surface: cells light behind the pointer, and a
              wave sweeps the grid whenever the reel changes piece.
   2. Stack   the headline slabs assemble from pixels on load.
   3. Reel    featured work breaks into pixels and reassembles as the next piece; the pointer
              is a lens that re-pixelates what it touches; leaving the hero dissolves it. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const RED = "#E63B2E", BLUE = "#8FC8E6", INK = "#151412";
  const probe = document.createElement("canvas");
  if (!probe.getContext || !probe.getContext("2d")) { document.documentElement.classList.add("no-canvas"); }

  const SLIDES = [
    { src: "assets/rs-neon.webp", kind: "Brand identity · Rooted Sanctum", title: "A fantasy gaming lounge, fully branded", time: "3 to 4 weeks", price: "$1,600", fx: .5, fy: .35 },
    { src: "assets/tribemain1.webp", kind: "Brand identity · Tribe Tea Lounge", title: "A kava lounge, cup to campaign", time: "2 to 4 weeks", price: "$900", fx: .5, fy: .5 },
    { video: "assets/v/draw3.mp4", kind: "Illustration · Portrait study", title: "Drawn by hand, start to finish", time: "2 to 3 weeks", price: "$250", fx: .5, fy: .5 },
    { src: "assets/tribe-drinks.webp", kind: "Social content · Tribe Tea Lounge", title: "Product shoots built for the feed", time: "1 to 2 weeks", price: "$250", fx: .5, fy: .5 },
    { src: "assets/rs-hoodie.webp", kind: "Merchandise · Rooted Sanctum", title: "The mark, carried onto everything", time: "With your identity", price: "$900", fx: .4, fy: .5 },
  ];

  /* ---------------- 1 · Field ---------------- */
  const hero = document.querySelector(".hero");
  const field = document.querySelector("[data-field]");
  const fctx = field && field.getContext("2d");
  let cell = 0, cols = 0, rows = 0, heat = null, fw = 0, fh = 0;
  let wave = null; // {t0, dir}
  function sizeField() {
    const r = hero.getBoundingClientRect();
    fw = field.width = Math.round(r.width * DPR); fh = field.height = Math.round(r.height * DPR);
    cell = Math.round(clamp(r.width / 16, 64, 120) * DPR);
    cols = Math.ceil(fw / cell) + 1; rows = Math.ceil(fh / cell) + 1;
    heat = new Float32Array(cols * rows);
  }
  let pmx = -1, pmy = -1;
  if (fine && fctx) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) * DPR, y = (e.clientY - r.top) * DPR;
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      if (cx !== pmx || cy !== pmy) {
        pmx = cx; pmy = cy;
        const i = cy * cols + cx;
        if (i >= 0 && i < heat.length) heat[i] = 1;
      }
    });
  }
  function drawField(now) {
    if (!fctx) return;
    fctx.clearRect(0, 0, fw, fh);
    /* lines */
    fctx.strokeStyle = "rgba(21,20,18,0.085)"; fctx.lineWidth = Math.max(1, DPR);
    fctx.beginPath();
    for (let x = 0; x <= cols; x++) { fctx.moveTo(x * cell + .5, 0); fctx.lineTo(x * cell + .5, fh); }
    for (let y = 0; y <= rows; y++) { fctx.moveTo(0, y * cell + .5); fctx.lineTo(fw, y * cell + .5); }
    fctx.stroke();
    /* sweep wave: a diagonal band of cells flickers across when the reel changes */
    let wp = -1; const wseed = wave ? wave.seed : 0;
    if (wave) { wp = (now - wave.t0) / 1300; if (wp > 1.2) { wave = null; wp = -1; } }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      let a = heat[i];
      let col = RED;
      if (wp >= 0) {
        const d = (x / cols + (1 - y / rows)) / 2;
        const band = 1 - Math.abs(d - wp) / 0.06;
        const n = ((x * 73856093) ^ (y * 19349663) ^ wseed) >>> 0;
        if (band > 0 && n % 5 === 0) { a = Math.max(a, band * 0.55); col = n % 3 === 0 ? RED : BLUE; }
      }
      if (a > 0.01) {
        fctx.globalAlpha = a * (col === RED ? 0.55 : 0.8);
        fctx.fillStyle = col;
        fctx.fillRect(x * cell + DPR, y * cell + DPR, cell - DPR, cell - DPR);
        heat[i] *= 0.955;
      }
    }
    fctx.globalAlpha = 1;
  }

  /* ---------------- 2 · Stack ---------------- */
  function buildStack() {
    const rowsEl = [...document.querySelectorAll(".stack__row")];
    rowsEl.forEach((row, ri) => {
      if (reduced) { row.classList.add("is-built"); return; }
      const w = row.offsetWidth, h = row.offsetHeight;
      const size = Math.max(14, Math.round(h / 6));
      const c = Math.ceil(w / size), r = Math.ceil(h / size);
      const grid = document.createElement("span");
      grid.className = "stack__cells"; grid.setAttribute("aria-hidden", "true");
      grid.style.gridTemplateColumns = `repeat(${c}, 1fr)`; grid.style.gridTemplateRows = `repeat(${r}, 1fr)`;
      const cells = [];
      for (let k = 0; k < c * r; k++) { const s = document.createElement("span"); grid.appendChild(s); cells.push(s); }
      row.prepend(grid);
      const order = cells.map((s, k) => ({ s, k, t: (k % c) / c * 0.7 + Math.random() * 0.3 })).sort((a, b) => a.t - b.t);
      const start = 180 + ri * 260;
      order.forEach((o, n) => {
        const delay = start + o.t * 520;
        setTimeout(() => {
          o.s.classList.add("on");
          if (Math.random() < 0.08) { o.s.classList.add(Math.random() < 0.5 ? "hot" : "cool"); setTimeout(() => o.s.classList.remove("hot", "cool"), 180); }
        }, delay);
      });
      setTimeout(() => row.classList.add("is-built"), start + 640);
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildStack); else buildStack();

  /* ---------------- 3 · Reel ---------------- */
  const reel = document.querySelector("[data-reel]");
  const canvas = document.querySelector("[data-reel-canvas]");
  const ctx = canvas && canvas.getContext("2d");
  const tabs = [...document.querySelectorAll("[data-slide]")];
  const infoEls = { kind: "[data-reel-kind]", title: "[data-reel-title]", time: "[data-reel-time]", price: "[data-reel-price]" };
  for (const k in infoEls) infoEls[k] = document.querySelector(infoEls[k]);
  const resEl = document.querySelector("[data-reel-res]");
  const HOLD = 4200, TRANS = 1500;

  const imgs = SLIDES.map((s) => {
    if (s.video) {
      const v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto"; v.src = s.video;
      return v;
    }
    const i = new Image(); i.decoding = "async"; i.src = s.src; return i;
  });
  let frameNo = 0;
  const cache = new Map(); // per slide: {crisp, mid, block, avg}
  let W = 0, H = 0, CELL = 0, C = 0, R = 0;
  let cur = 0, next = null, tStart = 0, holdStart = performance.now(), dir = 1;
  let lens = { x: -9999, y: -9999, a: 0, ta: 0 };
  let seeds = null;

  function sizeReel() {
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.round(r.width * DPR); H = canvas.height = Math.round(r.height * DPR);
    CELL = Math.round(clamp(r.width / 22, 22, 40) * DPR);
    C = Math.ceil(W / CELL); R = Math.ceil(H / CELL);
    seeds = new Float32Array(C * R).map(() => Math.random());
    cache.clear();
  }

  function prep(i) {
    const img = imgs[i], isVid = img.tagName === "VIDEO";
    if (cache.has(i)) {
      const o = cache.get(i);
      if (isVid && o.frame !== frameNo && img.readyState >= 2) { o.frame = frameNo; o.fill(); }
      return o;
    }
    if (isVid ? img.readyState < 2 : (!img.complete || !img.naturalWidth)) return isVid && cache.has("poster" + i) ? cache.get("poster" + i) : null;
    const s = SLIDES[i];
    const iw = isVid ? img.videoWidth : img.naturalWidth, ih = isVid ? img.videoHeight : img.naturalHeight, sc = Math.max(W / iw, H / ih);
    const sw = W / sc, sh = H / sc, sx = (iw - sw) * s.fx, sy = (ih - sh) * s.fy;
    const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; return c; };
    const o = { crisp: mk(W, H), mid: mk(C * 4, R * 4), block: mk(C, R), avg: null, frame: -1 };
    o.fill = () => {
      for (const c of [o.crisp, o.mid, o.block]) c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      o.avg = o.block.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, C, R).data;
    };
    o.fill();
    cache.set(i, o);
    return o;
  }

  /* level per cell: 0 crisp, 1 mid (4x4 inside the cell), 2 block, 3 accent flash */
  function drawCell(o, cx, cy, level, flash) {
    const x = cx * CELL, y = cy * CELL;
    if (level === 0) { ctx.drawImage(o.crisp, x, y, CELL, CELL, x, y, CELL, CELL); return; }
    if (level === 1) { ctx.drawImage(o.mid, cx * 4, cy * 4, 4, 4, x, y, CELL, CELL); return; }
    if (level === 2) { const k = (cy * C + cx) * 4; ctx.fillStyle = `rgb(${o.avg[k]},${o.avg[k + 1]},${o.avg[k + 2]})`; ctx.fillRect(x, y, CELL, CELL); return; }
    ctx.fillStyle = flash; ctx.fillRect(x, y, CELL, CELL);
  }

  let exitP = 0, zoom = 1;
  function drawReel(now) {
    if (!ctx || !W) return;
    frameNo++;
    imgs.forEach((m, k) => {
      if (m.tagName !== "VIDEO") return;
      const live = k === cur || k === next;
      if (live && m.paused && !reduced) m.play().catch(() => {});
      else if (!live && !m.paused) m.pause();
    });
    const A = prep(cur); if (!A) return;
    const B = next !== null ? prep(next) : null;
    let tp = -1;
    if (B) { tp = (now - tStart) / TRANS; if (tp >= 1) { cur = next; next = null; holdStart = now; tp = -1; } }
    const base = next === null ? prep(cur) : A;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base.crisp, 0, 0);

    /* slow push-in while a piece holds; eases back to 1 under the pixel wave */
    const holdP = next === null ? clamp((now - holdStart) / HOLD, 0, 1) : 0;
    const zTarget = next === null ? 1 + 0.07 * ease(holdP) : 1;
    zoom += (zTarget - zoom) * (next === null ? 0.08 : 0.2);
    canvas.style.transform = `scale(${zoom.toFixed(4)})`;

    lens.a += (lens.ta - lens.a) * 0.14;
    const lensR = Math.max(W, H) * 0.24;
    let worst = 0;
    for (let cy = 0; cy < R; cy++) for (let cx = 0; cx < C; cx++) {
      const i = cy * C + cx;
      let level = 0, src = base, flash = null;
      if (tp >= 0) {
        /* wave travels from the lower-left, where the brush would start, to the upper-right */
        const d = ((dir > 0 ? cx / C : 1 - cx / C) + (1 - cy / R)) / 2 * 0.72 + seeds[i] * 0.28;
        const t = clamp((tp - d * 0.62) / 0.38, 0, 1);
        if (t <= 0) { level = 0; src = A; }
        else if (t < .18) { level = 1; src = A; }
        else if (t < .4) { level = 2; src = A; }
        else if (t < .5) { level = seeds[i] < .14 ? 3 : 2; src = seeds[i] < .14 ? A : B; flash = seeds[i] < .07 ? RED : BLUE; }
        else if (t < .72) { level = 2; src = B; }
        else if (t < 1) { level = 1; src = B; }
        else { level = 0; src = B; }
      }
      /* pointer lens */
      if (lens.a > .02) {
        const px = (cx + .5) * CELL, py = (cy + .5) * CELL;
        const q = 1 - Math.hypot(px - lens.x, py - lens.y) / lensR;
        if (q > 0) {
          const k = q * lens.a;
          const lv = k > .3 ? 2 : k > .01 ? 1 : 0;
          if (lv > level) level = lv;
          if (k > .02 && k < .14 && seeds[i] < .18) { level = 3; flash = seeds[i] < .09 ? RED : BLUE; }
        }
      }
      /* scroll exit: dissolve from the bottom edge up */
      if (exitP > 0) {
        const e = clamp((exitP * 1.4 - (1 - cy / R) * 0.9 - seeds[i] * 0.3), 0, 1);
        if (e > .66) level = 2; else if (e > .2) level = Math.max(level, 1);
      }
      if (level) { drawCell(src, cx, cy, level, flash); if (level > worst) worst = level; }
      else if (src !== base) drawCell(src, cx, cy, 0);
    }
    if (resEl) {
      const v = worst >= 2 ? Math.round(CELL / DPR) : worst === 1 ? Math.round(CELL / DPR / 4) : 1;
      if (resEl.textContent !== String(v)) resEl.textContent = v;
    }

    /* tab progress */
    const active = next !== null ? next : cur;
    tabs.forEach((t, k) => {
      const on = k === active;
      t.setAttribute("aria-selected", String(on));
      const fill = k < active ? 1 : on ? (next !== null ? 0 : clamp((now - holdStart) / HOLD, 0, 1)) : 0;
      t.querySelector("b").style.setProperty("--fill", fill.toFixed(3));
    });
    if (!reduced && next === null && !paused && now - holdStart > HOLD) go((cur + 1) % SLIDES.length);
  }

  function go(i) {
    if (i === cur && next === null) return;
    if (next !== null) { cur = next; }
    dir = i > cur || (cur === SLIDES.length - 1 && i === 0) ? 1 : -1;
    next = i; tStart = performance.now();
    wave = { t0: performance.now(), seed: (Math.random() * 1e9) | 0 };
    const s = SLIDES[i];
    for (const k of ["kind", "title", "time", "price"]) {
      const el = infoEls[k]; if (!el) continue;
      el.textContent = s[k]; el.classList.remove("reel__swap"); void el.offsetWidth; el.classList.add("reel__swap");
    }
  }
  tabs.forEach((t) => t.addEventListener("click", () => { go(+t.dataset.slide); }));

  let paused = false;
  if (canvas) {
    if (fine) {
      canvas.parentElement.addEventListener("pointermove", (e) => {
        const r = canvas.getBoundingClientRect();
        lens.x = (e.clientX - r.left) * DPR; lens.y = (e.clientY - r.top) * DPR; lens.ta = 1;
      });
      canvas.parentElement.addEventListener("pointerleave", () => { lens.ta = 0; });
    }
    document.addEventListener("visibilitychange", () => { paused = document.hidden; if (!paused) holdStart = performance.now(); });
  }

  /* ---------------- loop ---------------- */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  function loop(now) {
    if (visible) {
      const r = hero.getBoundingClientRect();
      exitP = reduced ? 0 : clamp(-r.top / (r.height * 0.8), 0, 1);
      drawField(now);
      drawReel(now);
    }
    requestAnimationFrame(loop);
  }
  function start() { if (fctx) sizeField(); if (ctx) sizeReel(); requestAnimationFrame(loop); }
  imgs[0].complete ? start() : (imgs[0].onload = start);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (fctx) sizeField(); if (ctx) sizeReel(); }, 150); });
})();
