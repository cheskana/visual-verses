/* Visual Verses chapters: the pixel system continued past the hero. */
(function () {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const DPR = Math.min(devicePixelRatio || 1, 2);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const STEPS = [48, 36, 28, 22, 16, 12, 9, 7, 5, 4, 3, 2, 1];
  const q = (b) => { for (const s of STEPS) if (b >= s) return s; return 1; };
  const actP = (el) => parseFloat(el.style.getPropertyValue("--sc-p")) || 0;
  const RED = "#E63B2E", BLUE = "#8FC8E6", INK = "#151412", PAPER = "#FFFDF8";

  /* ---------- shared: draw an image through a pixel grid (object-fit: cover) ---------- */
  function Pixel(canvas, src, fx = .5, fy = .5) {
    const ctx = canvas.getContext("2d");
    const img = new Image(); img.decoding = "async"; img.src = src;
    const small = document.createElement("canvas"), sctx = small.getContext("2d");
    let last = -1, W = 0, H = 0;
    const o = {
      img, ready: false,
      size() { const r = canvas.getBoundingClientRect(); W = canvas.width = Math.max(1, Math.round(r.width * DPR)); H = canvas.height = Math.max(1, Math.round(r.height * DPR)); last = -1; },
      draw(block) {
        if (!o.ready || !W) return;
        const b = q(block); if (b === last) return; last = b;
        const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(W / iw, H / ih);
        const sw = W / s, sh = H / s, sx = (iw - sw) * fx, sy = (ih - sh) * fy;
        if (b <= 1) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high"; ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H); return; }
        const gw = Math.max(1, Math.round(W / (b * DPR))), gh = Math.max(1, Math.round(H / (b * DPR)));
        small.width = gw; small.height = gh;
        sctx.imageSmoothingEnabled = true; sctx.drawImage(img, sx, sy, sw, sh, 0, 0, gw, gh);
        ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, gw, gh, 0, 0, W, H);
      },
    };
    img.onload = () => { o.ready = true; o.size(); };
    return o;
  }

  /* ---------- 2 · Problem: twelve directions collapse to one ---------- */
  const problem = document.querySelector(".problem");
  const concepts = document.querySelector("[data-concepts]");
  const tiles = [];
  const CHOSEN = 6;
  if (concepts) {
    const pal = [[INK, RED], [INK, BLUE], [RED, INK], [BLUE, INK], [INK, INK], [RED, BLUE]];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let t = 0; t < 12; t++) {
      const d = document.createElement("div"); d.className = "concept";
      const c = document.createElement("canvas"); c.width = c.height = 11;
      const x = c.getContext("2d"); const [a, b] = pal[t % pal.length];
      /* a symmetric 11x11 mark, different every tile, like a sprite */
      for (let yy = 0; yy < 11; yy++) for (let xx = 0; xx < 6; xx++) {
        const r = rnd(); if (r < 0.46) continue;
        x.fillStyle = r > 0.88 ? b : a;
        x.fillRect(xx, yy, 1, 1); x.fillRect(10 - xx, yy, 1, 1);
      }
      const xmark = document.createElement("span"); xmark.className = "concept__x";
      d.append(c, xmark); concepts.appendChild(d); tiles.push(d);
    }
  }
  function drawProblem() {
    if (!problem || !tiles.length) return;
    const p = reduced ? 1 : actP(problem);
    const cr = concepts.getBoundingClientRect();
    const keep = [2, CHOSEN, 9];
    tiles.forEach((t, i) => {
      const inP = ease(clamp((p * 3.2) - i * 0.06, 0, 1));             // arrive
      const isKeep = keep.includes(i);
      const cross = isKeep ? 0 : clamp((p - 0.3 - i * 0.012) / 0.14, 0, 1); // blue X
      const gone = isKeep ? (i === CHOSEN ? 0 : clamp((p - 0.62) / 0.12, 0, 1)) : clamp((p - 0.44 - i * 0.01) / 0.12, 0, 1);
      let tx = 0, ty = 0, sc = 0.9 + 0.1 * inP;
      if (i === CHOSEN) {
        const m = ease(clamp((p - 0.66) / 0.24, 0, 1));
        const r = t.getBoundingClientRect();
        const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
        tx = (cx - (r.left + r.width / 2) + (parseFloat(t.dataset.tx) || 0)) * m;
        ty = (cy - (r.top + r.height / 2) + (parseFloat(t.dataset.ty) || 0)) * m;
        sc = sc * (1 + 1.6 * m);
        t.classList.toggle("is-one", m > 0.05);
      }
      t.dataset.tx = tx; t.dataset.ty = ty;
      t.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      t.style.opacity = (inP * (1 - gone)).toFixed(3);
      t.style.setProperty("--x", cross.toFixed(3));
    });
  }

  /* ---------- 3 · The Verse Method: a real board, explored, curated, crafted ---------- */
  const method = document.querySelector(".method");
  const pix = null;
  const mTiles = [...document.querySelectorAll(".board .tile")];
  const marks = [...document.querySelectorAll(".board .mark3")];
  const final = document.querySelector("[data-final]");
  const mSteps = [...document.querySelectorAll(".mstep")];
  const mBar = document.querySelector("[data-method-bar]");
  const lerp = (a, b, t) => a + (b - a) * t;
  function drawProcess() {
    if (!method || !mTiles.length) return;
    const p = reduced ? 1 : actP(method);
    /* Explore 0-.36: tiles fly in from a scattered pile into a 4x3 grid */
    mTiles.forEach((t, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const gx = col * 25.5, gy = row * 34.5;
      const sx = 38 + Math.sin(i * 2.4) * 30, sy = 34 + Math.cos(i * 1.7) * 26, rot = Math.sin(i * 3.1) * 18;
      const a = ease(clamp(p / 0.26 * 1.25 - i * 0.045, 0, 1));
      const x = lerp(sx, gx, a), y = lerp(sy, gy, a), r = lerp(rot, 0, a);
      /* Curate .36-.6: crossed out, shrink away */
      const cross = clamp((p - 0.34 - i * 0.008) / 0.08, 0, 1);
      const away = clamp((p - 0.44 - i * 0.006) / 0.1, 0, 1);
      t.style.left = x + "%"; t.style.top = y + "%";
      t.style.transform = `rotate(${r.toFixed(2)}deg) scale(${(1 - away * 0.35).toFixed(3)})`;
      t.style.opacity = (Math.min(1, a * 1.6) * (1 - away)).toFixed(3);
      t.style.setProperty("--x", cross.toFixed(3));
    });
    /* marks enter .46-.6, pick at .62, chosen grows .66-.78 */
    const pickP = clamp((p - 0.62) / 0.06, 0, 1);
    marks.forEach((m, i) => {
      const inA = ease(clamp((p - 0.53 - i * 0.025) / 0.08, 0, 1));
      const chosen = i === 2;
      const grow = ease(clamp((p - 0.66) / 0.12, 0, 1));
      const gone = chosen ? clamp((p - 0.8) / 0.06, 0, 1) : clamp((p - 0.66) / 0.08, 0, 1);
      let x = 3 + i * 33.5, y = 18, w = 30;
      if (chosen) { x = lerp(x, 30, grow); y = lerp(y, 10, grow); w = lerp(30, 40, grow); }
      m.style.left = x + "%"; m.style.top = y + "%"; m.style.width = w + "%";
      m.style.transform = `translateY(${((1 - inA) * 40).toFixed(1)}px)`;
      m.style.opacity = (inA * (1 - gone)).toFixed(3);
      m.classList.toggle("is-pick", chosen && pickP > 0.5);
    });
    /* Craft .78-1: the finished brand opens from the centre */
    if (final) {
      const open = ease(clamp((p - 0.78) / 0.12, 0, 1));
      final.style.setProperty("--ci", ((1 - open) * 50).toFixed(2) + "%");
      final.style.setProperty("--fy", ((1 - ease(clamp((p - 0.86) / 0.1, 0, 1))) * 60).toFixed(1) + "px");
      final.style.opacity = open > 0 ? 1 : 0;
    }
    const stage = p < 0.36 ? 0 : p < 0.74 ? 1 : 2;
    mSteps.forEach((s, i) => s.classList.toggle("is-on", i === stage));
    if (mBar) mBar.style.setProperty("--m", clamp(p / 0.95, 0, 1).toFixed(3));
  }

  /* ---------- videos: load and play only while on screen ---------- */
  const vids = [...document.querySelectorAll("video[data-lazy-video]")];
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.preload === "none") { v.preload = "auto"; v.load(); }
          if (!reduced) v.play().catch(() => {});
        } else v.pause();
      }
    }, { rootMargin: "200px 0px" });
    vids.forEach((v) => vio.observe(v));
  }
  document.querySelectorAll(".phone__sound").forEach((b) => {
    const v = b.parentElement.querySelector("video");
    const toggle = () => {
      const on = v.muted;
      document.querySelectorAll(".phone video").forEach((o) => { o.muted = true; });
      document.querySelectorAll(".phone__sound").forEach((o) => { o.setAttribute("aria-pressed", "false"); o.textContent = "Sound off"; });
      v.muted = !on; if (on) { v.play().catch(() => {}); b.setAttribute("aria-pressed", "true"); b.textContent = "Sound on"; }
    };
    b.addEventListener("click", toggle);
    v.addEventListener("click", toggle);
  });

  /* ---------- 4 · Services: sharpen toward the centre ---------- */
  const cards = [...document.querySelectorAll("[data-px-card]")].map((c) => ({ c, pix: Pixel(c, c.dataset.pxCard, .5, .45) }));
  function drawCards() {
    const vw = innerWidth;
    for (const k of cards) {
      const r = k.c.getBoundingClientRect();
      if (r.right < -50 || r.left > vw + 50 || r.bottom < 0 || r.top > innerHeight) continue;
      const d = Math.abs(r.left + r.width / 2 - vw / 2) / (vw / 2);
      k.pix.draw(reduced ? 1 : 1 + 34 * Math.pow(clamp(d - 0.12, 0, 1), 1.2));
    }
  }

  /* ---------- 5 · Work: each piece resolves on arrival; hover re-pixelates ---------- */
  const shots = [...document.querySelectorAll("[data-px-in]")].map((c, i) => {
    const o = { c, pix: Pixel(c, c.dataset.pxIn, .5, .4), t0: 0, block: 36, hover: 0, delay: (i % 4) * 90 };
    if (fine) {
      const fig = c.parentElement;
      fig.addEventListener("pointerenter", () => { o.hover = 1; });
      fig.addEventListener("pointerleave", () => { o.hover = 0; });
    }
    return o;
  });
  function drawShots(now) {
    for (const s of shots) {
      const r = s.c.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      if (!s.t0 && r.top < innerHeight * 0.88) s.t0 = now + s.delay;
      let target = 36;
      if (reduced) target = 1;
      else if (s.t0 && now > s.t0) target = 1 + 35 * Math.pow(1 - clamp((now - s.t0) / 1000, 0, 1), 2);
      if (s.hover && target < 2) target = 14;
      s.block += (target - s.block) * 0.25;
      s.pix.draw(s.block);
    }
  }

  /* ---------- 7 · Start: the grid remembers the pointer ---------- */
  const start = document.querySelector(".start");
  const sField = document.querySelector("[data-start-field]");
  const sctx = sField && sField.getContext("2d");
  let sCell = 0, sCols = 0, sRows = 0, sHeat = null, sw = 0, sh = 0;
  function sizeStart() {
    const r = start.getBoundingClientRect();
    sw = sField.width = Math.round(r.width * DPR); sh = sField.height = Math.round(r.height * DPR);
    sCell = Math.round(clamp(r.width / 16, 64, 120) * DPR);
    sCols = Math.ceil(sw / sCell) + 1; sRows = Math.ceil(sh / sCell) + 1; sHeat = new Float32Array(sCols * sRows);
  }
  if (fine && sctx) start.addEventListener("pointermove", (e) => {
    const r = start.getBoundingClientRect();
    const i = Math.floor((e.clientY - r.top) * DPR / sCell) * sCols + Math.floor((e.clientX - r.left) * DPR / sCell);
    if (i >= 0 && i < sHeat.length) sHeat[i] = 1;
  });
  function drawStart() {
    if (!sctx || !sw) return;
    const r = start.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    sctx.clearRect(0, 0, sw, sh);
    sctx.strokeStyle = "rgba(21,20,18,0.08)"; sctx.lineWidth = DPR; sctx.beginPath();
    for (let x = 0; x <= sCols; x++) { sctx.moveTo(x * sCell + .5, 0); sctx.lineTo(x * sCell + .5, sh); }
    for (let y = 0; y <= sRows; y++) { sctx.moveTo(0, y * sCell + .5); sctx.lineTo(sw, y * sCell + .5); }
    sctx.stroke();
    for (let i = 0; i < sHeat.length; i++) if (sHeat[i] > .01) {
      sctx.globalAlpha = sHeat[i] * .5; sctx.fillStyle = i % 3 ? RED : BLUE;
      sctx.fillRect((i % sCols) * sCell + DPR, Math.floor(i / sCols) * sCell + DPR, sCell - DPR, sCell - DPR);
      sHeat[i] *= .96;
    }
    sctx.globalAlpha = 1;
  }

  /* ---------- loop ---------- */
  function loop(now) {
    drawProblem(); drawProcess(); drawCards(); drawShots(now); drawStart();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  const resize = () => { pix && pix.size(); cards.forEach((k) => k.pix.size()); shots.forEach((s) => s.pix.size()); sctx && sizeStart(); };
  if (sctx) sizeStart();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  /* ---------- form: posts to FormSubmit; the page shows the real outcome ---------- */
  const form = document.querySelector("[data-form]");
  if (form) form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = form.querySelector("[data-form-err]");
    const btn = form.querySelector(".form__go");
    const d = Object.fromEntries(new FormData(form));
    if (!d.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) || !d.brief.trim()) {
      err.textContent = "Add your name, a valid email and a short brief."; err.dataset.ok = ""; return;
    }
    btn.disabled = true; btn.textContent = "Sending..."; err.textContent = "";
    try {
      const res = await fetch("https://formsubmit.co/ajax/visualverses.vs@gmail.com", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...d, _subject: "New project: " + d.type, _replyto: d.email }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || String(j.success) === "false") throw new Error(j.message || "Send failed");
      form.reset(); err.dataset.ok = "1";
      err.textContent = "Brief sent. You will hear back soon at the email you gave.";
    } catch (x) {
      err.dataset.ok = "";
      err.innerHTML = "That did not send. Email <a href=\"mailto:visualverses.vs@gmail.com\">visualverses.vs@gmail.com</a> directly and I will get back to you.";
    } finally { btn.disabled = false; btn.textContent = "Send the brief"; }
  });
})();
