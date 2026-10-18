// Hors Antenne ! : les cinématiques, vues de côté
//   ouvertures et fins de mission, et le Blaireau de Télé-Parasite qui interrompt l'émission
window.TM = window.TM || {};
(function (TM) {
  const INK = '#1b1410';
  const GROUND_OFF = 54; // la neige du bas laisse la place aux sous-titres
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function sfx(n) { if (TM.sfx) TM.sfx(n); }
  function audio(fn, v) { if (TM.audio && TM.audio[fn]) TM.audio[fn](v); }
  const disc = (g, x, y, r, c) => TM.disc(g, Math.round(x), Math.round(y), Math.max(0, Math.round(r)), c);
  const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k);
  const H = (a, b) => TM.hash(a, b, 41);

  // ---------- Les décors ----------
  const bgCache = {};
  function gradient(g, ground, bands) {
    for (let y = 0; y < ground; y++) {
      const f = y / ground * bands.length, k = Math.floor(f);
      const dither = (f - k) > 0.75 && ((y & 1) === 0);
      g.fillStyle = bands[Math.min(bands.length - 1, k + (dither ? 1 : 0))];
      g.fillRect(0, y, 160, 1);
    }
  }
  function stars(g, ground, n) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = H(i, 2) < 0.2 ? '#f5d9a0' : '#ffffff';
      g.fillRect(Math.floor(H(i, 0) * 160), Math.floor(H(i, 1) * ground * 0.9), 1, 1);
    }
  }
  function mountains(g, ground, far, near, cap, capNear) {
    for (let x = 0; x < 160; x++) {
      const top = Math.round(ground - (28 + 16 * Math.sin(x * 0.04 + 0.5) + 9 * Math.sin(x * 0.11 + 2)));
      g.fillStyle = far; g.fillRect(x, top, 1, ground - top);
      g.fillStyle = cap; g.fillRect(x, top, 1, top < ground - 40 ? 4 : 2);
    }
    for (let x = 0; x < 160; x++) {
      const top = Math.round(ground - (12 + 8 * Math.sin(x * 0.07 + 3) + 5 * Math.sin(x * 0.19)));
      g.fillStyle = near; g.fillRect(x, top, 1, ground - top);
      g.fillStyle = capNear; g.fillRect(x, top, 1, 1);
    }
  }
  function snow(g, ground, VH, col, shade) {
    g.fillStyle = col; g.fillRect(0, ground, 160, VH - ground);
    g.fillStyle = shade; g.fillRect(0, ground, 160, 1);
    for (let i = 0; i < 40; i++) g.fillRect(Math.floor(H(i, 3) * 160), ground + 3 + Math.floor(H(i, 4) * (VH - ground - 4)), 3, 1);
  }
  function puffClouds(g, y0, VH, light, mid, dark) { // une mer de nuages vue de côté
    g.fillStyle = mid; g.fillRect(0, y0 + 6, 160, VH - y0 - 6);
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(H(i, 7) * 176) - 8, r = 7 + Math.floor(H(i, 8) * 9), y = y0 + 4 + Math.floor(H(i, 9) * 10);
      disc(g, x, y + 2, r, dark); disc(g, x, y, r, mid); disc(g, x - 2, y - 2, r - 3, light);
    }
  }
  function earthDisc(g, cx, cy, r) {
    disc(g, cx, cy, r + 1, '#8fd3f5');
    disc(g, cx, cy, r, '#2f6db0');
    for (let i = 0; i < 6; i++) disc(g, cx + (H(i, 10) - 0.5) * r * 1.2, cy + (H(i, 11) - 0.5) * r * 1.2, r * (0.18 + H(i, 12) * 0.2), '#5a8f45');
    for (let i = 0; i < 5; i++) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(cx + (H(i, 13) - 0.5) * r * 1.4), Math.round(cy + (H(i, 14) - 0.5) * r * 1.4), 2 + Math.floor(H(i, 15) * 4), 1); }
  }
  function moonDisc(g, cx, cy, r) {
    disc(g, cx, cy, r, '#d8d8de');
    for (let i = 0; i < 6; i++) disc(g, cx + (H(i, 20) - 0.5) * r * 1.2, cy + (H(i, 21) - 0.5) * r * 1.2, 1 + r * 0.12 * H(i, 22), '#aeaeb6');
  }
  function background(kind, VH) {
    const key = kind + VH;
    if (bgCache[key]) return bgCache[key];
    const c = canvas(160, VH), g = c.getContext('2d'), ground = VH - GROUND_OFF;
    if (kind === 'day') {
      gradient(g, ground, ['#3d6fc4', '#4a7ccc', '#5889d3', '#6697da', '#75a5e0', '#86b3e6', '#98c1eb', '#abcfef', '#bfdcf3']);
      for (const [cx, cy, s] of [[30, 0.18, 1], [118, 0.32, 0.8], [70, 0.5, 0.6]]) {
        const y = Math.round(ground * cy);
        for (const [dx, dy, r] of [[-9, 2, 5], [0, 0, 7], [9, 2, 5], [3, 3, 5]]) {
          disc(g, cx + dx * s, y + dy + 1, Math.max(2, r * s), '#d5e5f5');
          disc(g, cx + dx * s, y + dy, Math.max(2, r * s), '#ffffff');
        }
      }
      mountains(g, ground, '#9db7d6', '#7491b8', '#e8f0f8', '#d5e2f0');
      snow(g, ground, VH, '#eef3f8', '#d3deea');
    } else if (kind === 'clouds' || kind === 'sunset') {
      const day = kind === 'clouds';
      gradient(g, ground, day ? ['#2c5bb8', '#3a6cc4', '#4a7ccc', '#5c8fd6', '#73a4e0', '#8cb8ea', '#a8cdf2']
        : ['#3a2a66', '#5a3378', '#83417f', '#b25a7a', '#d8756f', '#ee9a72', '#f7c08a']);
      disc(g, 128, Math.round(ground * (day ? 0.22 : 0.78)), day ? 9 : 13, day ? '#fff6c8' : '#ffd27a');
      puffClouds(g, ground - 8, VH, day ? '#ffffff' : '#ffdab4', day ? '#e3eaf4' : '#f0b291', day ? '#9fb3cc' : '#c66f7c');
    } else if (kind === 'night') {
      gradient(g, ground, ['#070b1e', '#0b1230', '#101a3e', '#16224c', '#1d2c5a', '#26386a']);
      stars(g, ground, 70);
      disc(g, 122, 38, 17, '#2a3560'); moonDisc(g, 122, 36, 16);
      mountains(g, ground, '#22305a', '#18223f', '#5a6a96', '#3a4870');
      snow(g, ground, VH, '#8d9cc0', '#6f7fa6');
    } else if (kind === 'moon') {
      g.fillStyle = '#05070f'; g.fillRect(0, 0, 160, ground);
      stars(g, ground, 90);
      earthDisc(g, 40, 44, 16);
      g.fillStyle = '#8e8e96'; g.fillRect(0, ground, 160, VH - ground);
      g.fillStyle = '#d8d8de'; g.fillRect(0, ground, 160, 1);
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(H(i, 30) * 160), y = ground + 4 + Math.floor(H(i, 31) * (VH - ground - 8)), w = 4 + Math.floor(H(i, 32) * 10);
        g.fillStyle = '#6e6e76'; g.fillRect(x, y, w, 2); g.fillStyle = '#b4b4bc'; g.fillRect(x, y + 2, w, 1);
      }
    }
    bgCache[key] = c;
    return c;
  }

  // ---------- Les acteurs ----------
  function drawAntenna(g, x, y, lit) { // l'antenne de télé du sommet (celle du premier jeu)
    for (let k = 0; k < 64; k++) {
      const half = Math.max(1, Math.floor((64 - k) / 10));
      g.fillStyle = Math.floor(k / 8) % 2 ? '#f4f4f4' : '#d43c3c';
      g.fillRect(x + 8 - half, y - 64 + k, 1, 1);
      g.fillRect(x + 8 + half, y - 64 + k, 1, 1);
      if (k % 8 === 4) g.fillRect(x + 8 - half, y - 64 + k, half * 2 + 1, 1);
    }
    g.fillStyle = '#e8eef4'; g.fillRect(x + 10, y - 44, 5, 7);
    g.fillStyle = '#9aa6b4'; g.fillRect(x + 14, y - 43, 1, 5);
    g.fillStyle = lit ? '#ff3030' : '#5a2020'; g.fillRect(x + 7, y - 67, 3, 3);
  }
  function waves(g, x, y, t, col) { // des ondes qui partent de l'antenne : le signal est revenu
    for (let k = 0; k < 3; k++) {
      const r = ((t + k * 14) % 42) + 4;
      for (let a = -1.2; a <= 1.2; a += 0.12) {
        g.fillStyle = col;
        g.fillRect(Math.round(x + Math.sin(a) * r), Math.round(y - Math.cos(a) * r), 1, 1);
      }
    }
  }
  function drawRocket(g, x, top, full, flame, t) {
    if (flame > 0) {
      const len = Math.round(flame + ((t >> 1) % 3));
      g.fillStyle = '#f08a24'; g.fillRect(x - 3, top + 22, 2, len); g.fillRect(x + 1, top + 22, 2, len);
      g.fillStyle = '#ffd34a'; g.fillRect(x - 3, top + 22, 2, Math.max(1, len - 3)); g.fillRect(x + 1, top + 22, 2, Math.max(1, len - 3));
    }
    g.drawImage(TM.SPR[full ? 'rocketFull' : 'rocket'].r, Math.round(x - 6), Math.round(top));
  }
  function drawMarmot(g, key, x, y, left) { const s = TM.SPR[key]; g.drawImage(left ? s.l : s.r, Math.round(x - 8), Math.round(y)); }
  function wave(g, x, y, t, left) { // le bras qui fait coucou
    const up = (t >> 3) & 1, d = left ? -1 : 1;
    g.fillStyle = INK; g.fillRect(Math.round(x + d * 5), Math.round(y + 3 - up), 2, 6);
    g.fillStyle = '#a8693a'; g.fillRect(Math.round(x + d * 5), Math.round(y + 4 - up), 1, 4);
    g.fillStyle = '#e8bd86'; g.fillRect(Math.round(x + d * 5), Math.round(y + 2 - up), 2, 2);
  }
  function scarf(g, mx, my, t) {
    g.fillStyle = '#d8332b';
    g.fillRect(mx - 9, my + 8, 3, 1); g.fillRect(mx - 12 + ((t >> 2) & 1), my + 7, 3, 1);
  }
  function zigzag(g, x0, y0, x1, y1) { // un éclair de brouillage
    const n = 6;
    let px = x0, py = y0;
    for (let i = 1; i <= n; i++) {
      const x = i === n ? x1 : x0 + (x1 - x0) * i / n + (Math.random() - 0.5) * 6;
      const y = i === n ? y1 : y0 + (y1 - y0) * i / n + (Math.random() - 0.5) * 6;
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x - px), Math.abs(y - py))));
      for (let s = 0; s <= steps; s++) {
        const qx = Math.round(px + (x - px) * s / steps), qy = Math.round(py + (y - py) * s / steps);
        g.fillStyle = '#e8318f'; g.fillRect(qx - 1, qy, 3, 1);
        g.fillStyle = '#ffffff'; g.fillRect(qx, qy, 1, 1);
      }
      px = x; py = y;
    }
  }
  function drawDrone(g, x, y, t) { const s = TM.SPR[(t >> 3) & 1 ? 'tv1' : 'tv2']; g.drawImage(s.r, Math.round(x - 8), Math.round(y - 7)); }
  function badgerHead(g, x, y) { // la petite tête du Blaireau, vue dans une vitre
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = INK; g.fillRect(x - 3, y - 4, 7, 2);
    g.fillStyle = '#fffaf0'; g.fillRect(x - 2, y - 2, 5, 4);
    g.fillStyle = INK; g.fillRect(x - 1, y - 2, 1, 3); g.fillRect(x + 1, y - 2, 2, 2);
    g.fillStyle = '#e8318f'; g.fillRect(x, y - 4, 1, 1);
  }
  function stepPuffs(list) {
    for (const q of list) { q.x += q.vx; q.y += q.vy; q.vx *= 0.97; q.r = Math.min(q.max || 7, q.r + 0.12); q.life--; }
    return list.filter(q => q.life > 0);
  }
  function drawPuffs(g, list, young, old) { for (const q of list) disc(g, q.x, q.y, q.r, q.life > 20 ? young : old); }
  function puff(list, x, y, vx, vy, life, max) { list.push({ x: x, y: y, vx: vx, vy: vy, r: 2, life: life || 40, max: max || 7 }); }

  // Le relais pirate de profil (pour le faire tomber)
  const RELAY = (function () {
    const c = canvas(22, 74), g = c.getContext('2d');
    for (let k = 0; k < 60; k++) {
      const half = Math.max(2, Math.round(9 - k / 9)), y = 73 - k;
      g.fillStyle = '#5c636e'; g.fillRect(11 - half, y, 1, 1); g.fillRect(11 + half, y, 1, 1);
      if (k % 7 === 3) { g.fillStyle = '#7d858f'; g.fillRect(11 - half, y, half * 2 + 1, 1); }
      if (k % 7 === 0) { g.fillStyle = '#7d858f'; g.fillRect(11 - half + ((k / 7) % 2 ? 0 : half), y, half, 1); }
    }
    TM.disc(g, 11, 8, 7, INK); TM.disc(g, 11, 8, 6, '#e8eef4'); TM.disc(g, 11, 8, 3, '#e8318f');
    g.fillStyle = '#e8318f'; g.fillRect(4, 26, 14, 6); g.fillStyle = '#5c636e'; g.fillRect(6, 27, 10, 4);
    g.fillStyle = INK; g.fillRect(12, 27, 3, 2);
    return c;
  })();
  function drawRelay(g, x, base, ang) {
    g.save(); g.translate(Math.round(x), Math.round(base)); g.rotate(ang);
    g.drawImage(RELAY, -11, -74); g.restore();
  }

  // Le zeppelin pirate de profil : s = taille, sq = dégonflé (0 à 1)
  function drawZeppelin(g, x, y, s, sq, t, badger) {
    const W = 50 * s, Hh = Math.max(2, 14 * s * (1 - sq * 0.6));
    g.fillStyle = INK; g.fillRect(Math.round(x + W - 6 * s), Math.round(y - Hh - 6 * s), Math.round(10 * s), Math.round(Hh * 2 + 12 * s));
    g.fillStyle = '#e8318f'; g.fillRect(Math.round(x + W - 5 * s), Math.round(y - Hh - 5 * s), Math.round(8 * s), Math.round(Hh * 2 + 10 * s));
    for (let dy = -Hh; dy <= Hh; dy++) {
      const w = Math.round(W * Math.sqrt(Math.max(0, 1 - (dy / (Hh + 0.5)) * (dy / (Hh + 0.5)))));
      g.fillStyle = INK; g.fillRect(Math.round(x - w - 1), Math.round(y + dy), w * 2 + 2, 1);
      g.fillStyle = dy < -Hh * 0.4 ? '#e3e8ee' : dy < Hh * 0.35 ? '#b4bbc4' : '#8a929c';
      if (w > 0) g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2, 1);
    }
    g.fillStyle = '#e8318f'; g.fillRect(Math.round(x - W * 0.9), Math.round(y), Math.round(W * 1.8), Math.max(1, Math.round(2 * s)));
    if (s > 0.6) { // gondole, hélice, antenne pirate
      g.fillStyle = INK; g.fillRect(Math.round(x - 10 * s), Math.round(y + Hh - 1), Math.round(20 * s), Math.round(7 * s));
      g.fillStyle = '#5c636e'; g.fillRect(Math.round(x - 9 * s), Math.round(y + Hh), Math.round(18 * s), Math.round(5 * s));
      g.fillStyle = '#7fc3ea';
      for (let i = 0; i < 3; i++) g.fillRect(Math.round(x - 7 * s + i * 6 * s), Math.round(y + Hh + 1), Math.round(3 * s), Math.round(2 * s));
      if (badger) badgerHead(g, x + 2 * s, y + Hh + 3 * s);
      g.fillStyle = '#c9d0d8'; g.fillRect(Math.round(x + W + 2), Math.round(y - ((t >> 1) & 1 ? 5 : 1) * s), 1, Math.round(((t >> 1) & 1 ? 10 : 2) * s));
      g.fillStyle = INK; g.fillRect(Math.round(x - 1), Math.round(y - Hh - 8 * s), 2, Math.round(8 * s));
      disc(g, x, y - Hh - 9 * s, 4 * s, '#e8eef4'); disc(g, x, y - Hh - 9 * s, 1.5 * s, '#e8318f');
    }
  }

  // La dameuse de profil, tournée vers la gauche (avec le Blaireau au volant)
  function drawDameuse(g, x, ground, t, o) {
    x = Math.round(x);
    const y = ground - 26;
    g.fillStyle = INK; g.fillRect(x - 22, ground - 9, 46, 9);
    g.fillStyle = '#2c2c32'; g.fillRect(x - 21, ground - 8, 44, 7);
    g.fillStyle = '#55555e';
    for (let k = 0; k < 6; k++) disc(g, x - 16 + k * 7, ground - 5, 2, '#55555e');
    for (let k = 0; k < 11; k++) g.fillRect(x - 21 + ((k * 4 + (o.moving ? t >> 1 : 0)) % 44), ground - 9, 2, 1);
    g.fillStyle = INK; g.fillRect(x - 31, ground - 17, 6, 17); // lame devant
    g.fillStyle = '#9aa3ad'; g.fillRect(x - 30, ground - 16, 4, 15);
    g.fillStyle = INK; g.fillRect(x + 22, ground - 12, 8, 8);  // fraise derrière
    g.fillStyle = '#7d858f'; g.fillRect(x + 23, ground - 11, 6, 6);
    g.fillStyle = INK; g.fillRect(x - 20, y + 4, 40, 14);
    g.fillStyle = o.dead ? '#6a3a36' : '#b02a20'; g.fillRect(x - 19, y + 5, 38, 12);
    g.fillStyle = o.dead ? '#7a4a46' : '#d8392c'; g.fillRect(x - 19, y + 5, 38, 3);
    g.fillStyle = INK; g.fillRect(x - 16, y - 6, 18, 11);
    g.fillStyle = '#e9edf2'; g.fillRect(x - 15, y - 5, 16, 10);
    g.fillStyle = '#7fc3ea'; g.fillRect(x - 14, y - 4, 7, 6); g.fillRect(x - 5, y - 4, 5, 6);
    if (o.badger) badgerHead(g, x - 10, y);
    g.fillStyle = o.dead && (t >> 2) & 1 ? '#5a3a10' : ((t >> 3) & 1 ? '#ffb020' : '#a05a00'); g.fillRect(x - 3, y - 8, 4, 2);
    if (o.antenna === 'up') {
      g.fillStyle = INK; g.fillRect(x + 8, y - 8, 2, 12);
      disc(g, x + 9, y - 10, 5, INK); disc(g, x + 9, y - 10, 4, '#e8eef4'); disc(g, x + 9, y - 10, 1, '#e8318f');
    }
  }
  function drawTelescope(g, x, ground) {
    g.fillStyle = INK;
    g.fillRect(x - 5, ground - 10, 1, 10); g.fillRect(x + 4, ground - 10, 1, 10); g.fillRect(x, ground - 11, 1, 11);
    for (let i = 0; i < 16; i++) { g.fillStyle = i < 2 ? INK : '#c9a24a'; g.fillRect(x - 6 + i, ground - 12 - Math.round(i * 0.6), 3, 3); }
    g.fillStyle = INK; g.fillRect(x + 9, ground - 23, 4, 4);
  }
  function drawFlag(g, x, ground, h, t) { // le drapeau de Télé-Marmotte
    g.fillStyle = INK; g.fillRect(x, ground - h, 1, h);
    if (h < 20) return;
    const top = ground - h, wv = (t >> 3) & 1;
    g.fillStyle = INK; g.fillRect(x + 1, top, 16, 11 + wv);
    g.fillStyle = '#fffaf0'; g.fillRect(x + 1, top + 1, 15, 9 + wv);
    g.fillStyle = '#d8332b'; g.fillRect(x + 4, top + 3, 9, 5); // une petite télé rouge
    g.fillStyle = '#8fd3f5'; g.fillRect(x + 5, top + 4, 5, 3);
    g.fillStyle = '#a8693a'; g.fillRect(x + 7, top + 5, 2, 2);
  }
  function drawPod(g, x, y, t, flame) { // la capsule de secours du Blaireau
    x = Math.round(x); y = Math.round(y);
    if (flame) { g.fillStyle = '#f08a24'; g.fillRect(x - 2, y + 8, 4, 3 + ((t >> 1) % 3)); g.fillStyle = '#ffd34a'; g.fillRect(x - 1, y + 8, 2, 2); }
    g.fillStyle = INK; g.fillRect(x - 5, y - 8, 10, 16);
    g.fillStyle = '#7d858f'; g.fillRect(x - 4, y - 7, 8, 14);
    g.fillStyle = '#e8318f'; g.fillRect(x - 4, y + 2, 8, 2);
    disc(g, x, y - 2, 2, '#7fc3ea');
  }
  function drawChute(g, x, y, t) { // un drone pirate en parachute
    const sw = Math.sin(t * 0.08) * 2;
    for (let i = -6; i <= 6; i++) { g.fillStyle = (i + 6) % 4 < 2 ? '#e8318f' : '#ffffff'; g.fillRect(Math.round(x + sw + i), Math.round(y - 12 + Math.abs(i) * 0.4), 1, 3); }
    g.fillStyle = '#5c636e';
    g.fillRect(Math.round(x + sw - 6), Math.round(y - 9), 1, 1); g.fillRect(Math.round(x + sw + 6), Math.round(y - 9), 1, 1);
    const s = TM.SPR.fly1; g.drawImage(s.r, Math.round(x - 5), Math.round(y - 5));
  }

  // La télé du Blaireau : un écran, son buste, « en direct »
  function drawTV(g, cx, cy, sc, t, talking) {
    const bw = 20 * sc + 8 * sc / 2, bh = 20 * sc + 4 * sc;
    const x0 = Math.round(cx - bw / 2), y0 = Math.round(cy - bh / 2);
    g.fillStyle = INK; g.fillRect(x0 - 4, y0 - 4, bw + 8, bh + 8);
    g.fillStyle = '#5a3a22'; g.fillRect(x0 - 3, y0 - 3, bw + 6, bh + 6);
    g.fillStyle = '#1b2440'; g.fillRect(x0, y0, bw, bh);
    for (let y = y0; y < y0 + bh; y += 2) { g.fillStyle = 'rgba(232,49,143,0.10)'; g.fillRect(x0, y, bw, 1); }
    const s = TM.SPR[talking && (t >> 2) & 1 ? 'badgerTalk' : 'badger'];
    g.drawImage(s.r, Math.round(cx - 10 * sc), y0 + bh - 20 * sc, 20 * sc, 20 * sc);
    if ((t >> 4) & 1) { g.fillStyle = '#ff3030'; g.fillRect(x0 + 3, y0 + 3, 3, 3); } // « en direct »
    g.fillStyle = '#e8318f'; g.fillRect(x0 + bw - 12, y0 + 3, 9, 6);
    g.fillStyle = '#c8c8d0'; g.fillRect(x0 + bw - 11, y0 + 4, 7, 4);
    g.fillStyle = INK; g.fillRect(x0 + bw - 7, y0 + 4, 3, 2);
  }
  let noise = null;
  function drawStatic(g, VH, t, y0, y1) {
    if (!noise || noise.height !== VH) noise = g.createImageData(160, VH);
    const d = noise.data, roll = (t * 3) % VH;
    for (let y = 0; y < VH; y++) {
      const dark = Math.abs(y - roll) < 10 ? 0.55 : 1;
      for (let x = 0; x < 160; x++) {
        const v = (Math.random() * 255 * dark) | 0, i = (y * 160 + x) * 4;
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
      }
    }
    g.putImageData(noise, 0, 0);
  }
  function glitch(g, VH, n) { // des bandes de neige qui zèbrent l'image
    for (let i = 0; i < n; i++) {
      const y = Math.floor(Math.random() * VH), h = 1 + Math.floor(Math.random() * 4);
      for (let x = 0; x < 160; x += 2) { const v = (Math.random() * 255) | 0; g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; g.fillRect(x, y, 2, h); }
    }
  }
  function fade(g, VH, a) { if (a > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(1, a) + ')'; g.fillRect(0, 0, 160, VH); } }

  // Le Blaireau parle : un petit son par syllabe
  function blabla(I, t) { if (t % 7 === 0) sfx('blah'); }

  // ---------- Les scènes ----------
  //   chaque scène : init(I), step(I, t, emit, ground), draw(g, I, t, ground) ; elle met I.done quand elle a fini
  const SCENES = {};

  // Mission 1 : la télé grésille, le Blaireau parle, la marmotte décolle
  //   chaque sous-titre reste au moins 3 s à l'écran, le temps de le lire
  const STATIC_END = 120, TV_END = 370;
  SCENES.intro1 = {
    init: I => Object.assign(I, { mx: -18, mz: 0, mvz: 0, mvx: 0, run: false, jump: false, boarded: false, boardT: 0,
      sy: 0, sv: 0, lift: false, gone: 0, puffs: [], dx: 54, dy: 0, flee: 0 }),
    step: function (I, t, emit, ground) {
      const RX = 120, u = t - TV_END;
      if (t === 1) { emit('card', 'Hors antenne'); emit('cap', 'Télé-Marmotte ne passe plus…'); audio('hiss', 1); }
      if (t === STATIC_END) { emit('card', null); audio('hiss', 0.12); emit('cap', 'Ici Télé-Parasite ! Fini les marmottes : place aux parasites !'); }
      if (t > STATIC_END + 8 && t < TV_END - 30) blabla(I, t);
      if (u === 0) emit('cap', 'Son drone pirate brouille l’antenne du sommet.');
      if (u === 200) { I.run = true; emit('cap', 'La marmotte file à son vaisseau.'); }
      if (I.run && !I.jump && !I.boarded) {
        I.mx += 1.15;
        if (I.mx >= 97) { I.jump = true; I.mvz = 3; I.mvx = 1; sfx('hop'); }
      } else if (I.jump) {
        I.mx += I.mvx; I.mz += I.mvz; I.mvz -= 0.15;
        if (I.mx >= RX - 3) I.mvx = 0;
        if (I.mvz < 0 && I.mz <= 14 && I.mx >= RX - 4) {
          I.jump = false; I.boarded = true; I.boardT = t;
          sfx('board'); emit('cap', 'Mission 1 : le Col. Fais taire le relais pirate !');
        }
      }
      if (I.boarded) {
        const k = t - I.boardT;
        if (k >= 40 && k < 130) {
          audio('engine', 0.2 + (k - 40) / 90 * 0.8);
          if (k % 3 === 0) puff(I.puffs, RX + (Math.random() - 0.5) * 6, ground, (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9), -0.1, 50);
        }
        if (k === 130) { I.lift = true; sfx('liftoff'); }
        if (I.lift) {
          I.sv += 0.05; I.sy -= I.sv;
          if (k % 2 === 0) puff(I.puffs, RX + (Math.random() - 0.5) * 4, ground + I.sy + 2, (Math.random() - 0.5) * 0.4, 0.3, 40);
          if (ground + I.sy < -6) { if (I.gone === 0) audio('engine', 0); if (++I.gone >= 26) I.done = true; }
        }
      }
      if (I.lift) { I.flee += 0.08; I.dx += 0.6 + I.flee; I.dy -= 0.5; }
      else { I.dx = 54 + Math.sin(t * 0.03) * 12; I.dy = Math.sin(t * 0.07) * 3; }
      I.puffs = stepPuffs(I.puffs);
    },
    draw: function (g, I, t, ground) {
      const VH = TM.VH, RX = 120;
      if (t < STATIC_END) { drawStatic(g, VH, t); return; }
      if (t < TV_END) { // le Blaireau à la télé
        g.drawImage(background('day', VH), 0, 0);
        g.fillStyle = 'rgba(10,14,30,0.75)'; g.fillRect(0, 0, 160, VH);
        drawTV(g, 80, Math.round(VH * 0.4), 3, t, t > STATIC_END + 8 && t < TV_END - 30);
        if (t < STATIC_END + 8 || t > TV_END - 14) glitch(g, VH, 12);
        return;
      }
      const shake = I.boarded && t - I.boardT > 40 && !I.gone ? ((t & 2) ? 1 : -1) : 0;
      g.save(); g.translate(shake, 0);
      g.drawImage(background('day', VH), 0, 0);
      g.fillStyle = '#5c636e'; g.fillRect(RX - 13, ground - 1, 27, 3);
      g.fillStyle = '#f5c842'; for (let x = RX - 12; x < RX + 13; x += 4) g.fillRect(x, ground + 1, 2, 1);
      const jam = !I.lift || I.flee < 1;
      drawAntenna(g, 14, ground, !jam || (t * 7) % 13 < 3);
      const dx = Math.round(I.dx), dy = Math.round(ground - 82 + I.dy);
      if (jam && t % 36 < 22) zigzag(g, dx - 8, dy + 2, 22, ground - 66);
      if (dx < 180) drawDrone(g, dx, dy, t);
      drawPuffs(g, I.puffs, '#ffffff', '#d9e2ec');
      const top = Math.round(ground - 23 + I.sy);
      drawRocket(g, RX, top, I.boarded, I.boarded && t - I.boardT >= 40 ? (I.lift ? 6 + Math.min(8, I.sv * 2) : 2) : 0, t);
      if (!I.boarded) {
        const key = I.jump ? 'mJump' : I.run ? ((t >> 3) & 1 ? 'mRun1' : 'mRun2') : 'mStand';
        const mx = Math.round(I.mx), my = Math.round(ground - 16 - I.mz);
        if (I.run || I.jump) scarf(g, mx, my, t);
        drawMarmot(g, key, mx, my);
      }
      g.restore();
      fade(g, VH, I.gone / 26);
    }
  };

  // Fin de la mission 1 : le relais tombe, l'antenne se rallume, un zeppelin passe au loin
  SCENES.outro1 = {
    init: I => Object.assign(I, { ang: 0, crashed: false, shake: 0, puffs: [], rocket: -40 }),
    step: function (I, t, emit, ground) {
      if (t === 2) { emit('cap', 'Le relais pirate s’écroule !'); sfx('collapse'); }
      if (t >= 30 && !I.crashed) {
        const k = (t - 30) / 70;
        I.ang = Math.min(1.45, k * k * 1.45);
        if (k >= 1) {
          I.crashed = true; I.shake = 14; sfx('boom');
          for (let i = 0; i < 26; i++) puff(I.puffs, 120 + Math.random() * 70, ground - 2, (Math.random() - 0.5) * 1.6, -Math.random() * 0.6, 50, 8);
        }
      }
      if (!I.crashed && t % 6 === 0) puff(I.puffs, 118 + Math.sin(I.ang) * 50, ground - Math.cos(I.ang) * 50, 0.2, -0.4, 40, 5);
      if (I.shake > 0) I.shake--;
      if (t === 140) { emit('cap', 'L’antenne de Télé-Marmotte se rallume.'); sfx('signal'); }
      if (t >= 120 && t < 170) I.rocket = -40 + ease((t - 120) / 50) * (ground - 23 + 40);
      if (t === 170) { sfx('land'); for (let i = 0; i < 8; i++) puff(I.puffs, 70 + (Math.random() - 0.5) * 6, ground, (Math.random() < 0.5 ? -1 : 1) * 0.8, -0.1, 40); }
      if (t === 240) emit('cap', 'Mais là-haut, un drôle de ballon brouille encore l’image…');
      I.puffs = stepPuffs(I.puffs);
      if (t >= 480) I.done = true;
    },
    draw: function (g, I, t, ground) {
      const VH = TM.VH, sh = I.shake ? ((t & 2) ? 2 : -2) : 0;
      g.save(); g.translate(0, sh);
      g.drawImage(background('day', VH), 0, 0);
      if (t > 220) drawZeppelin(g, 200 - (t - 220) * 0.75, 34, 0.35, 0, t, false);
      drawAntenna(g, 14, ground, t >= 140 && (t >> 4) & 1);
      if (t >= 140) waves(g, 22, ground - 68, t, '#f5c842');
      drawRelay(g, 118, ground, I.ang);
      if (t < 90) { drawDrone(g, 130 + t * 0.8, ground - 70 - t * 0.6, t); drawDrone(g, 100 + t * 1.1, ground - 50 - t * 0.9, t + 4); }
      drawPuffs(g, I.puffs, '#e3e3ea', '#b8b8c4');
      if (t >= 120) {
        drawRocket(g, 70, I.rocket, t < 180, t < 170 ? 5 : 0, t);
        if (t >= 180) { drawMarmot(g, 'mStand', 84, ground - 16, true); if (t >= 190) wave(g, 84, ground - 16, t, true); }
      }
      g.restore();
      if (t < 18) fade(g, VH, 1 - t / 18);
    }
  };

  // Mission 2 : la fusée crève la mer de nuages, le zeppelin arrose le pays de parasites
  SCENES.intro2 = {
    init: I => Object.assign(I, { rx: 50, top: 400, zx: 240, puffs: [], sv: 0, gone: 0 }),
    step: function (I, t, emit, ground) {
      if (t === 2) { emit('cap', 'Le relais est tombé, mais l’image saute encore.'); audio('engine', 0.5); }
      if (t < 90) {
        I.top = ground + 30 - ease(t / 90) * 110;
        if (t > 20 && t < 60 && t % 3 === 0) puff(I.puffs, I.rx + (Math.random() - 0.5) * 20, ground - 4, (Math.random() - 0.5) * 1.4, -0.4, 40, 9);
      } else if (!I.lift) I.top = ground - 80 + Math.sin(t * 0.08) * 2;
      if (t === 90) audio('engine', 0.2);
      if (t >= 100) I.zx = 100 + Math.max(0, 140 * (1 - ease((t - 100) / 160)));
      if (t === 220) { emit('cap', 'Un zeppelin pirate arrose tout le pays de parasites !'); sfx('rumble'); }
      if (t === 450) emit('cap', 'Mission 2 : au-dessus des nuages. Abats le zeppelin !');
      if (t === 560) { I.lift = true; sfx('liftoff'); audio('engine', 1); }
      if (I.lift) {
        I.sv += 0.06; I.top -= I.sv;
        if (I.top < -30) { if (I.gone === 0) audio('engine', 0); if (++I.gone >= 26) I.done = true; }
      }
      I.puffs = stepPuffs(I.puffs);
    },
    draw: function (g, I, t, ground) {
      const VH = TM.VH;
      g.drawImage(background('clouds', VH), 0, 0);
      const zy = 52 + Math.sin(t * 0.03) * 2;
      if (t >= 200 && t % 30 < 18) { zigzag(g, I.zx - 20, zy + 14, I.zx - 30, ground); zigzag(g, I.zx + 14, zy + 14, I.zx + 24, ground); }
      drawZeppelin(g, I.zx, zy, 1, 0, t, true);
      drawRocket(g, I.rx, I.top, true, I.lift ? 8 + Math.min(6, I.sv * 2) : 4, t);
      drawPuffs(g, I.puffs, '#ffffff', '#e3eaf4');
      fade(g, VH, I.gone / 26);
    }
  };

  // Fin de la mission 2 : le zeppelin se dégonfle, ses pilotes sautent en parachute
  SCENES.outro2 = {
    init: I => Object.assign(I, { zx: 96, zy: 72, s: 1, sq: 0, chutes: [] }),
    step: function (I, t, emit) {
      if (t === 2) { emit('cap', 'Le zeppelin pirate se dégonfle !'); sfx('deflate'); }
      I.sq = Math.min(0.75, Math.max(0, (t - 10) / 200));
      if (t < 200) { I.zx += Math.sin(t * 0.25) * 1.6; I.zy += Math.cos(t * 0.31) * 1.1; }
      else { const k = (t - 200) / 160; I.zx -= 0.45 + k * 1.2; I.zy -= 0.2 + k * 0.5; I.s = Math.max(0.15, 1 - k * 0.85); }
      if (t === 110 || t === 126 || t === 142) { I.chutes.push({ x: I.zx + (t - 126) * 0.5, y: I.zy + 18, t: 0 }); sfx('pop'); }
      for (const c of I.chutes) { c.t++; c.y += 0.35; c.x += Math.sin(c.t * 0.05) * 0.2; }
      if (t === 170) emit('cap', 'Ses pilotes sautent en parachute.');
      if (t === 320) emit('cap', 'Il reste un dernier signal pirate. Mais d’où vient-il ?');
      if (t >= 560) I.done = true;
    },
    draw: function (g, I, t, ground) {
      const VH = TM.VH;
      g.drawImage(background('sunset', VH), 0, 0);
      if (I.s > 0.2) drawZeppelin(g, I.zx, I.zy, I.s, I.sq, t, I.s > 0.7);
      if (t < 200 && t % 4 === 0) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(I.zx + 40 * I.s + Math.random() * 6), Math.round(I.zy + (Math.random() - 0.5) * 6), 2, 1); }
      for (const c of I.chutes) drawChute(g, c.x, c.y, c.t);
      drawRocket(g, 30, ground - 70 + Math.sin(t * 0.08) * 2, true, 3, t);
      if (t < 18) fade(g, VH, 1 - t / 18);
    }
  };

  // Mission 3 : la nuit, au télescope, la marmotte découvre la dameuse sur la Lune
  SCENES.intro3 = {
    init: I => Object.assign(I, { mx: 88, mz: 0, mvz: 0, jump: false, boarded: false, top: 0, sv: 0, lift: false, gone: 0, puffs: [], dam: 110 }),
    step: function (I, t, emit, ground) {
      const RX = 136;
      if (t === 2) emit('cap', 'La nuit tombe. La chaîne grésille encore.');
      if (t === 185) { emit('cap', 'Le dernier émetteur pirate est… sur la Lune !'); sfx('zoom'); }
      if (t >= 180 && t < 580) I.dam -= 0.15;
      if (t === 380) { emit('cap', 'Et devine qui conduit la dameuse…'); sfx('horn'); }
      if (t === 590) emit('cap', 'Mission 3 : en orbite. Direction la Lune !');
      if (t === 600) { I.jump = true; I.mvz = 3.2; sfx('hop'); }
      if (I.jump) {
        I.mx += 1.2; I.mz += I.mvz; I.mvz -= 0.15;
        if (I.mvz < 0 && I.mz <= 14 && I.mx >= RX - 6) { I.jump = false; I.boarded = true; sfx('board'); }
      }
      if (I.boarded && !I.lift && t % 3 === 0) puff(I.puffs, RX + (Math.random() - 0.5) * 6, ground, (Math.random() < 0.5 ? -1 : 1) * 0.9, -0.1, 50);
      if (I.boarded && !I.lift) audio('engine', 0.6);
      if (I.boarded && !I.lift && I.mx > 0 && t > 650) { I.lift = true; sfx('liftoff'); }
      if (I.lift) {
        I.sv += 0.06; I.top -= I.sv;
        if (t % 2 === 0) puff(I.puffs, RX + (Math.random() - 0.5) * 4, ground + I.top + 2, (Math.random() - 0.5) * 0.4, 0.3, 40);
        if (ground + I.top < -6) { if (I.gone === 0) audio('engine', 0); if (++I.gone >= 26) I.done = true; }
      }
      I.puffs = stepPuffs(I.puffs);
    },
    draw: function (g, I, t, ground) {
      const VH = TM.VH, RX = 136;
      g.drawImage(background('night', VH), 0, 0);
      drawAntenna(g, 14, ground, (t >> 4) & 1);
      drawTelescope(g, 100, ground);
      drawPuffs(g, I.puffs, '#c9d2e6', '#8d9cc0');
      drawRocket(g, RX, ground - 23 + I.top, I.boarded, I.lift ? 8 + Math.min(8, I.sv * 2) : I.boarded ? 2 : 0, t);
      if (!I.boarded) {
        const key = I.jump ? 'mJump' : 'mStand';
        drawMarmot(g, key, I.mx, ground - 16 - I.mz);
      }
      if (t >= 180 && t < 580) { // la vue dans le télescope
        const cx = 80, cy = Math.round(VH * 0.38), R = 54, k = Math.min(1, (t - 180) / 12, (580 - t) / 12);
        const r = Math.round(R * k);
        g.save();
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
        g.drawImage(background('moon', VH), 0, cy - (VH - GROUND_OFF) + 20, 160, VH);
        const gy = cy + 20;
        if (t % 30 < 18) zigzag(g, I.dam + 9, gy - 36, I.dam + 30, cy - r);
        drawDameuse(g, I.dam, gy, t, { antenna: 'up', badger: true, moving: true });
        g.restore();
        g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r + 1, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r + 1, 0, Math.PI * 2); g.stroke();
      }
      fade(g, VH, I.gone / 26);
    }
  };

  // Finale : la dameuse tombe en panne, le Blaireau s'enfuit, la marmotte plante son drapeau
  SCENES.outro3 = {
    init: I => Object.assign(I, { puffs: [], antX: 0, antY: 0, antV: 0, bx: 0, inPod: false, podY: 0, podV: 0, rocket: -40, mx: 114, flag: 0 }),
    step: function (I, t, emit, ground) {
      if (t === 2) { emit('cap', 'La dameuse lunaire tombe en panne sèche.'); sfx('sputter'); }
      if (t < 260 && t % 7 === 0) puff(I.puffs, 48 + Math.random() * 8, ground - 30, 0.3, -0.35, 50, 6);
      if (t >= 40 && t < 80) { I.antV += 0.08; I.antY += I.antV; I.antX += 0.5; }
      if (t === 80) sfx('tock');
      if (t === 150) { emit('cap', '« À la saison prochaine, la marmotte ! »'); sfx('blah'); }
      if (t > 150 && t < 200) blabla(I, t);
      if (t >= 150 && !I.inPod) { I.bx = Math.min(I.bx + 0.7, 28); if (I.bx >= 28) { I.inPod = true; sfx('board'); } }
      if (I.inPod && t > 220) { if (I.podV === 0) sfx('pod'); I.podV += 0.08; I.podY -= I.podV; }
      if (t >= 290 && t < 340) I.rocket = -40 + ease((t - 290) / 50) * (ground - 23 + 40);
      if (t === 340) { sfx('land'); for (let i = 0; i < 8; i++) puff(I.puffs, 132 + (Math.random() - 0.5) * 6, ground, (Math.random() < 0.5 ? -1 : 1) * 0.8, -0.1, 40); }
      if (t === 330) emit('cap', 'La marmotte plante le drapeau de Télé-Marmotte…');
      if (t >= 350 && t < 375) I.mx -= 0.8; // elle va se placer à gauche du drapeau
      if (t >= 385) I.flag = Math.min(30, I.flag + 1.2);
      if (t === 387) sfx('flag');
      if (t === 480) { emit('cap', '…et la chaîne repart, partout sur Terre !'); sfx('signal'); }
      I.puffs = stepPuffs(I.puffs);
      if (t >= 690) I.done = true;
    },
    draw: function (g, I, t, ground) {
      const VH = TM.VH;
      g.drawImage(background('moon', VH), 0, 0);
      if (t >= 480) { // la mire s'allume sur la Terre
        waves(g, 104, ground - 34, t, '#f5c842');
        const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
        cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(33 + i * 2, 40, 2, 7); });
      }
      drawDameuse(g, 52, ground, t, { antenna: t < 40 ? 'up' : 'none', badger: t < 150, dead: true });
      if (t >= 40) { // l'antenne pirate tombe du toit
        const ax = 61 + I.antX, ay = Math.min(ground - 4, ground - 36 + I.antY);
        disc(g, ax, ay, 5, INK); disc(g, ax, ay, 4, '#9aa3ad'); disc(g, ax, ay, 1, '#5a2040');
      }
      drawPuffs(g, I.puffs, '#c4c4cc', '#8e8e96');
      if (t >= 150 && !I.inPod) drawMarmot(g, (t >> 2) & 1 ? 'badgerRun1' : 'badgerRun2', 42 - I.bx, ground - 12);
      drawPod(g, 12, ground - 8 + I.podY, t, I.inPod && t > 220);
      if (t >= 290) {
        drawRocket(g, 132, I.rocket, t < 350, t < 340 ? 5 : 0, t);
        if (I.flag > 0) drawFlag(g, 104, ground, Math.round(I.flag), t);
        if (t >= 350) {
          const walking = t < 375;
          drawMarmot(g, walking ? ((t >> 3) & 1 ? 'mRun1' : 'mRun2') : 'mStand', I.mx, ground - 16, walking);
          if (t >= 490) wave(g, I.mx, ground - 16, t, false);
        }
      }
      if (t < 18) fade(g, VH, 1 - t / 18);
    }
  };

  // Les répliques du Blaireau avant chaque boss
  const TAUNTS = {
    1: 'Ici Télé-Parasite ! Mon relais est imprenable, la marmotte !',
    2: 'Mon zeppelin va te dégonfler, petite marmotte !',
    3: 'Sur la Lune, personne ne t’entend siffler !'
  };

  TM.cine = {
    has: name => !!SCENES[name],
    newScene: function (name) { const I = { name: name, t: 0, done: false }; SCENES[name].init(I); return I; },
    stop: function () { audio('hiss', 0); audio('engine', 0); },
    step: function (I, emit) {
      I.t++;
      if (I.t === 60) emit('skip', true); // « toucher pour passer » n'apparaît qu'une fois le passage possible
      SCENES[I.name].step(I, I.t, emit, TM.VH - GROUND_OFF);
      if (I.done) { emit('cap', null); emit('skip', false); emit('card', null); TM.cine.stop(); }
    },
    draw: function (g, I) { SCENES[I.name].draw(g, I, I.t, TM.VH - GROUND_OFF); },
    // Le Blaireau interrompt l'émission, par-dessus le jeu figé
    newTaunt: m => ({ t: 0, dur: 290, line: TAUNTS[m], done: false }),
    stepTaunt: function (T, emit) {
      T.t++;
      if (T.t === 1) { sfx('glitch'); audio('hiss', 0.25); }
      if (T.t === 60) emit('skip', true);
      if (T.t === 16) { emit('cap', T.line); audio('hiss', 0.06); }
      if (T.t > 20 && T.t < 200) blabla(T, T.t);
      if (T.t === T.dur - 14) sfx('glitch');
      if (T.t >= T.dur) { T.done = true; emit('cap', null); emit('skip', false); audio('hiss', 0); }
    },
    drawTaunt: function (g, T) {
      const VH = TM.VH, t = T.t, edge = t < 14 || t > T.dur - 14;
      if (edge) { glitch(g, VH, 18); return; }
      g.fillStyle = 'rgba(10,14,30,0.45)'; g.fillRect(0, 0, 160, VH);
      drawTV(g, 80, Math.round(VH * 0.45), 2, t, t > 20 && t < 200);
      if (Math.random() < 0.15) glitch(g, VH, 2);
    }
  };
})(window.TM);
