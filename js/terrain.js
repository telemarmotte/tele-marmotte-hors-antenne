// Hors Antenne ! : le sol vu d'avion, fabriqué par bandes de 160 x 32 pixels
window.TM = window.TM || {};
(function (TM) {
  const SW = 160, SH = 32;
  const cache = new Map();

  function hash(a, b, s) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) { return vnoise(x, y, s) * 0.6 + vnoise(x * 2.1, y * 2.1, s + 7) * 0.3 + vnoise(x * 4.3, y * 4.3, s + 13) * 0.1; }
  TM.hash = hash;

  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  const C = {};
  const HEX = {
    snow: '#e4ecf4', snowSh: '#c9d6e6', rock: '#8f8b84', rock2: '#9b968d', rockDk: '#6b6862', rockLt: '#b3aea4',
    grass: '#6da447', grass2: '#64993f', grassDk: '#4f8233', grassLt: '#86b85a', path: '#cdb27c', pathDk: '#a88c58',
    fl1: '#ffffff', fl2: '#f5d442', fl3: '#b08ae0',
    forest: '#3f7a37', forest2: '#3a7233', forestDk: '#2e5f2b',
    water: '#3f7ec0', waterDp: '#336db0', waterLt: '#7fb2e2', shore: '#b9ad86',
    ice: '#a9d2ec', crev: '#4f7fb5'
  };
  for (const k in HEX) C[k] = rgb(HEX[k]);

  // Les paysages de la mission 1, de bas en haut (Y = distance parcourue, en pixels)
  const BANDS = [[0, 'summit'], [260, 'meadow'], [1150, 'forest'], [2150, 'rock'], [3350, 'glacier'], [4450, 'ridge']];
  function bandAt(x, Y) {
    const j = Y + (fbm(x * 0.025, Y * 0.025, 5) - 0.5) * 80;
    let b = BANDS[0][1];
    for (let i = 0; i < BANDS.length; i++) if (j >= BANDS[i][0]) b = BANDS[i][1];
    return b;
  }
  function pathX(Y) { return 80 + Math.sin(Y * 0.0045) * 42 + Math.sin(Y * 0.013 + 1.3) * 14; }
  // Le lac de la forêt : marge positive = dans l'eau
  function lakeMargin(x, Y) {
    if (Y < 1420 || Y > 1960) return -99;
    const cx = 78 + Math.sin(Y * 0.007) * 26;
    const k = Math.sin(Math.PI * (Y - 1420) / 540);
    const hw = 60 * Math.pow(k, 0.6) + (fbm(x * 0.04, Y * 0.04, 9) - 0.5) * 22;
    return hw - Math.abs(x - cx);
  }

  function px1(x, Y) {
    const b = bandAt(x, Y);
    const n = fbm(x * 0.05, Y * 0.05, 21), h = hash(x, Y, 77);
    switch (b) {
      case 'summit': case 'ridge': {
        const r = fbm(x * 0.06, Y * 0.06, 31);
        if (r > (b === 'ridge' ? 0.67 : 0.64)) return h < 0.15 ? C.rockDk : r > 0.7 ? C.rockLt : C.rock;
        return n > 0.55 || h < 0.03 ? C.snowSh : C.snow;
      }
      case 'meadow': {
        const d = Math.abs(x - pathX(Y));
        if (d < 2.5) return h < 0.2 ? C.pathDk : C.path;
        if (d < 3.5) return C.pathDk;
        if (h < 0.012) return [C.fl1, C.fl2, C.fl3][Math.floor(h * 250) % 3];
        if (h > 0.93) return C.grassDk;
        if (h > 0.88) return C.grassLt;
        return n > 0.52 ? C.grass : C.grass2;
      }
      case 'forest': {
        const m = lakeMargin(x, Y);
        if (m > 2) {
          if (m > 14) return h > 0.97 ? C.waterLt : C.waterDp;
          return hash(x >> 2, Y, 3) > 0.95 ? C.waterLt : C.water;
        }
        if (m > 0) return C.shore;
        if (h > 0.92) return C.forestDk;
        return n > 0.5 ? C.forest : C.forest2;
      }
      case 'rock': {
        const s = fbm(x * 0.045, Y * 0.045, 41);
        if (s > 0.66) return n > 0.6 ? C.snowSh : C.snow;
        if (h < 0.06) return C.rockDk;
        if (h > 0.95) return C.rockLt;
        return n > 0.5 ? C.rock : C.rock2;
      }
      default: { // glacier
        const c = Math.abs(Math.sin(Y * 0.07 + fbm(x * 0.03, Y * 0.03, 51) * 7 + x * 0.015));
        const zone = fbm(x * 0.05, Y * 0.02, 61) > 0.5;
        if (zone && c < 0.05) return C.crev;
        if (zone && c < 0.12) return C.ice;
        return n > 0.56 ? C.snowSh : (h < 0.02 ? C.ice : C.snow);
      }
    }
  }

  function disc(g, x, y, r, col) {
    g.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy) + 0.3);
      g.fillRect(x - w, y + dy, w * 2 + 1, 1);
    }
  }
  TM.disc = disc;

  // Les objets du décor, posés sur une grille de 10 pixels (toujours les mêmes à la même place)
  function drawObj(g, b, x, y, h, wx, Y) {
    switch (b) {
      case 'meadow': {
        if (Math.abs(wx - pathX(Y)) < 8) return;
        if (h < 0.007) { // chalet
          g.fillStyle = 'rgba(20,40,10,0.35)'; g.fillRect(x - 4, y - 2, 12, 9);
          g.fillStyle = '#1b1410'; g.fillRect(x - 6, y - 5, 12, 10);
          g.fillStyle = '#b5643a'; g.fillRect(x - 5, y - 4, 10, 4);
          g.fillStyle = '#7e3f22'; g.fillRect(x - 5, y + 1, 10, 3);
          g.fillStyle = '#5a2a16'; g.fillRect(x - 5, y, 10, 1);
          g.fillStyle = '#9aa3ad'; g.fillRect(x + 2, y - 3, 2, 2);
        } else if (h < 0.012) { // vache
          g.fillStyle = 'rgba(20,40,10,0.3)'; g.fillRect(x - 1, y + 1, 5, 2);
          g.fillStyle = '#fffaf0'; g.fillRect(x - 2, y - 1, 5, 3);
          g.fillStyle = '#74461f'; g.fillRect(x - 1, y - 1, 2, 1); g.fillRect(x + 1, y + 1, 1, 1);
          g.fillStyle = '#1b1410'; g.fillRect(x + 3, y, 1, 1);
        } else if (h < 0.05) { // buisson
          disc(g, x + 1, y + 1, 2, 'rgba(20,40,10,0.35)');
          disc(g, x, y, 2, '#4f8233'); g.fillStyle = '#86b85a'; g.fillRect(x - 1, y - 1, 1, 1);
        } else if (h < 0.06) { // caillou
          disc(g, x, y, 1, '#9b968d'); g.fillStyle = '#cfcac0'; g.fillRect(x - 1, y - 1, 1, 1);
        }
        return;
      }
      case 'forest': {
        if (lakeMargin(wx, Y) > -4) return;
        const dense = fbm(wx * 0.02, Y * 0.02, 71) > 0.42;
        if (h < (dense ? 0.85 : 0.14)) { // sapin vu de dessus
          const r = 3 + Math.floor(h * 100) % 3;
          disc(g, x + 2, y + 2, r, 'rgba(12,30,14,0.45)');
          disc(g, x, y, r, '#24603a');
          disc(g, x - 1, y - 1, r - 1, '#2f7a48');
          g.fillStyle = '#58a368'; g.fillRect(x - 2, y - 2, 1, 1); g.fillRect(x - 1, y - 3, 1, 1);
        }
        return;
      }
      case 'rock': case 'summit': case 'ridge': {
        if (h < (b === 'rock' ? 0.07 : 0.025)) { // rocher
          const r = 2 + Math.floor(h * 1000) % 3;
          disc(g, x + 1, y + 1, r, 'rgba(30,30,40,0.35)');
          disc(g, x, y, r, '#77736c');
          disc(g, x - 1, y - 1, r - 1, '#a29d93');
          g.fillStyle = '#d6d1c6'; g.fillRect(x - r + 1, y - r + 1, 1, 1);
        }
        return;
      }
      default: { // glacier : séracs
        if (h < 0.012) {
          g.fillStyle = '#7fa7cf'; g.fillRect(x - 2, y, 6, 3);
          g.fillStyle = '#e8f4fc'; g.fillRect(x - 3, y - 2, 5, 3);
          g.fillStyle = '#a9d2ec'; g.fillRect(x - 3, y + 1, 5, 1);
        }
      }
    }
  }

  function obj1(g, x, y, h, wx, Y) { drawObj(g, bandAt(wx, Y), x, y, h, wx, Y); }
  function extra1(g, top) { // le bateau du lac
    if (top < 1690 || top - SH > 1720) return;
    const bx = Math.round(78 + Math.sin(1700 * 0.007) * 26) - 6, by = top - 1700;
    g.fillStyle = '#7fb2e2'; g.fillRect(bx - 1, by + 4, 1, 3); g.fillRect(bx + 3, by + 4, 1, 4); g.fillRect(bx + 1, by + 6, 1, 3);
    g.fillStyle = '#1b1410'; g.fillRect(bx - 1, by - 3, 5, 7);
    g.fillStyle = '#fffaf0'; g.fillRect(bx, by - 2, 3, 5);
    g.fillStyle = '#d8332b'; g.fillRect(bx + 1, by - 1, 1, 2);
  }

  // ---------- Mission 2 : la mer de nuages, l'orage, puis le coucher de soleil ----------
  const SKY = {
    sea: ['#9fb3cc', '#c3d1e3', '#e3eaf4', '#ffffff'],
    storm: ['#34364a', '#4b4e64', '#65687f', '#8286a0'],
    dusk: ['#c66f7c', '#de8f82', '#f0b291', '#ffdab4']
  };
  function band2(x, Y) {
    const j = Y + (fbm(x * 0.02, Y * 0.02, 15) - 0.5) * 120;
    return j < 1500 ? 'sea' : j < 2900 ? 'storm' : 'dusk';
  }
  function cloud(x, Y) { return fbm(x * 0.018, Y * 0.018, 33) * 0.8 + fbm(x * 0.07, Y * 0.07, 34) * 0.2; }
  function px2(x, Y) {
    const b = band2(x, Y), n = cloud(x, Y);
    const gapT = b === 'sea' ? 0.32 : b === 'storm' ? 0.29 : 0.34;
    if (n < gapT) { // un trou dans les nuages : on voit très loin en dessous
      if (b === 'storm') return '#1c1d2e';
      if (b === 'dusk') return n < gapT - 0.04 ? '#5a3358' : '#6d3f63';
      const gnd = fbm(x * 0.04, Y * 0.04, 44);
      return gnd < 0.38 ? '#3d6b8a' : gnd < 0.55 ? '#4d6b4a' : '#5d7d55';
    }
    const s = (n - cloud(x - 2, Y + 2)) * 40 + (n - gapT) * 2.5;
    const pal = SKY[b];
    if (n < gapT + 0.025) return pal[0];
    const i = s < -0.35 ? 0 : s < 0.25 ? 1 : s < 0.9 ? 2 : 3;
    return (hash(x, Y, 39) < 0.04 && i < 3) ? pal[i + 1] : pal[i];
  }

  // ---------- Mission 3 : la Terre, l'espace, puis la Lune ----------
  function earthTop(x) { return 300 - (x - 80) * (x - 80) / 700; }
  function moonTop(x) { return 4420 + (x - 80) * (x - 80) / 400; }
  function px3(x, Y) {
    const et = earthTop(x);
    if (Y < et) {
      const cl = fbm(x * 0.05 + 3, Y * 0.08, 82);
      if (cl > 0.63) return cl > 0.7 ? '#ffffff' : '#dfe8f2';
      const c = fbm(x * 0.03, Y * 0.03, 81);
      if (c > 0.56) return c > 0.66 ? '#c9b27a' : c > 0.6 ? '#7a9a50' : '#5a8f45';
      return et - Y > 30 ? '#2f6db0' : '#3f7ec0';
    }
    if (Y < et + 2) return '#8fd3f5';
    if (Y < et + 4) return '#4a7fc0';
    if (Y < et + 8 && (x + Math.floor(Y)) % 2 === 0) return '#1c2f5a';
    const mt = moonTop(x);
    if (Y > mt) {
      if (Y < mt + 2) return '#d8d8de';
      const n = fbm(x * 0.04, Y * 0.04, 91), h = hash(x, Y, 92);
      if (h < 0.05) return '#7a7a82';
      if (h > 0.97) return '#b8b8c0';
      return n > 0.58 ? '#6a6a72' : n > 0.45 ? '#8e8e96' : '#9e9ea6';
    }
    const h = hash(x, Y, 93);
    // des étoiles discrètes, bleutées et jamais blanches : rien ne doit ressembler à un tir ennemi
    if (h < 0.0012) return '#7d89ad';
    if (h < 0.0045) return '#4d5880';
    if (h < 0.006) return '#3a3f66';
    const n = fbm(x * 0.012, Y * 0.012, 94);
    return n > 0.62 ? '#1e1846' : n > 0.55 ? '#161a3c' : '#0b0f24';
  }
  function obj3(g, x, y, h, wx, Y) { // cratères de la Lune
    if (Y < moonTop(wx) + 8 || h > 0.07) return;
    const r = 2 + Math.floor(h * 100) % 5;
    disc(g, x, y, r, '#b4b4bc');
    disc(g, x, y, r - 1, '#6e6e76');
    disc(g, x + 1, y + 1, r - 2 < 1 ? 1 : r - 2, '#86868e');
  }
  function extra3(g, top) { // une planète à anneau, au loin
    const py = 1900;
    if (top < py - 14 || top - SH > py + 14) return;
    const x = 120, y = top - py;
    disc(g, x, y, 8, '#1b1410');
    disc(g, x, y, 7, '#d98a4a');
    disc(g, x - 2, y - 2, 4, '#f0b070');
    g.fillStyle = '#e8d6a8';
    for (let i = -13; i <= 13; i++) { const yy = Math.round(i * 0.25); if (Math.abs(i) > 6 || i < 0) g.fillRect(x + i, y + yy + 1, 1, 1); }
  }

  const CFG = { 1: { px: px1, obj: obj1, extra: extra1 }, 2: { px: px2, obj: null, extra: null }, 3: { px: px3, obj: obj3, extra: extra3 } };
  let cfg = CFG[1];
  const memo = {};
  const colOf = c => typeof c === 'string' ? (memo[c] || (memo[c] = rgb(c))) : c;

  function makeStrip(k) {
    const c = document.createElement('canvas');
    c.width = SW; c.height = SH;
    const g = c.getContext('2d'), img = g.createImageData(SW, SH), d = img.data;
    const top = (k + 1) * SH - 1;
    for (let r = 0; r < SH; r++) {
      const Y = top - r;
      for (let x = 0; x < SW; x++) {
        const col = colOf(cfg.px(x, Y)), i = (r * SW + x) * 4;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    // objets dont le centre tombe dans cette bande ou juste à côté
    if (cfg.obj) {
      const CELL = 10;
      for (let cy = Math.floor((top - SH - 8) / CELL); cy <= Math.floor((top + 8) / CELL); cy++) {
        for (let cx = 0; cx < SW / CELL; cx++) {
          const h = hash(cx, cy, 991);
          const wx = cx * CELL + Math.floor(hash(cx, cy, 17) * CELL), Y = cy * CELL + Math.floor(hash(cx, cy, 23) * CELL);
          cfg.obj(g, wx, top - Y, h, wx, Y);
        }
      }
    }
    if (cfg.extra) cfg.extra(g, top);
    return c;
  }

  TM.terrain = {
    // Choisit le paysage de la mission (et oublie les bandes déjà dessinées)
    setMission: function (m) {
      if (cfg === CFG[m]) return;
      cfg = CFG[m]; cache.clear();
    },
    // Dessine le sol : S = distance parcourue, le bas de l'écran est à Y = S
    draw: function (g, S, VH) {
      const s = Math.floor(S);
      const k0 = Math.floor(s / SH), k1 = Math.floor((s + VH) / SH);
      for (let k = k0; k <= k1; k++) {
        let c = cache.get(k);
        if (!c) { c = makeStrip(k); cache.set(k, c); }
        g.drawImage(c, 0, s + VH - (k + 1) * SH);
      }
      if (cache.size > 40) for (const key of cache.keys()) if (key < k0 - 2 || key > k1 + 2) cache.delete(key);
    },
    band: bandAt,
    px: (m, x, Y) => CFG[m].px(x, Y), // pour les essais
    stormAt: Y => band2(80, Y) === 'storm'
  };
})(window.TM);
