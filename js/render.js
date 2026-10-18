// Hors Antenne ! : le dessin du jeu vu d'avion (écran interne de 160 pixels de large)
window.TM = window.TM || {};
(function (TM) {
  const INK = '#1b1410';
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  const disc = (g, x, y, r, col) => TM.disc(g, Math.round(x), Math.round(y), r, col);
  function spr(g, key, x, y, white) {
    const s = TM.SPR[key];
    g.drawImage(white ? s.wh : s.r, Math.round(x - s.w / 2), Math.round(y - s.h / 2));
  }
  function shade(g, key, x, y) { const s = TM.SPR[key]; g.drawImage(s.sh, Math.round(x - s.w / 2), Math.round(y - s.h / 2)); }
  function line(g, x0, y0, x1, y1, col) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    g.fillStyle = col;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
  }

  // Outils de dessin prêtés aux boss
  const R = {
    disc: disc, line: line,
    logo: function (g, lx, ly, bg) { // le logo de Télé-Parasite : une télé au cache-œil
      g.fillStyle = '#e8318f'; g.fillRect(lx, ly, 18, 11);
      g.fillStyle = bg; g.fillRect(lx + 2, ly + 2, 14, 7);
      g.fillStyle = INK; g.fillRect(lx + 10, ly + 2, 5, 4); g.fillRect(lx + 4, ly + 1, 12, 1);
      g.fillStyle = '#e8318f'; g.fillRect(lx + 4, ly - 3, 1, 3); g.fillRect(lx + 13, ly - 3, 1, 3);
    },
    wreck: function (g, G, px, py, w, h) { // une pièce détruite qui fume
      g.fillStyle = '#3a3a44'; g.fillRect(px - (w >> 1), py - (h >> 1), w, h);
      g.fillStyle = '#2a2a34'; g.fillRect(px - (w >> 2), py - (h >> 2), w >> 1, h >> 1);
      if (G.frame % 12 === 0) G.parts.push({ x: px + (Math.random() - 0.5) * w * 0.5, y: py, vx: 0.1, vy: -0.35, life: 30, c: '#7a7a88', sz: 2 });
    },
    dish: function (g, B, q, x, y, r, G) { // le cœur d'un boss : une parabole, blindée puis ouverte
      const wh = q.hitT > 0, f = G.frame;
      if (B.dead) { disc(g, x, y, r, INK); disc(g, x, y, r - 1, '#3a3a44'); disc(g, x + 2, y + 1, r >> 1, '#2a2a34'); return; }
      disc(g, x, y, r + 1, INK);
      if (q.armor) {
        disc(g, x, y, r, wh ? '#ffffff' : '#9aa3ad');
        disc(g, x - (r >> 2), y - (r >> 2), r >> 1, '#b8c0c9');
        for (let k = 0; k < 4; k++) { const a = B.a + k * Math.PI / 2; line(g, x, y, x + Math.cos(a) * (r - 1), y + Math.sin(a) * (r - 1), '#5c636e'); }
        disc(g, x, y, Math.max(2, r >> 2), '#e8318f');
        return;
      }
      disc(g, x, y, r, wh ? '#ffffff' : '#e8eef4');
      disc(g, x, y, Math.round(r * 0.75), wh ? '#ffffff' : '#c9d2dc');
      disc(g, x, y, Math.round(r * 0.45), wh ? '#ffffff' : '#aab4c0');
      const ax = Math.cos(B.a), ay = Math.sin(B.a), L = r - 2;
      line(g, x, y, x + ax * L, y + ay * L, INK); line(g, x + 1, y, x + 1 + ax * L, y + ay * L, INK);
      disc(g, x + ax * L, y + ay * L, 2, '#e8318f');
      disc(g, x, y, 2 + ((f >> 2) & 1) + (r > 10 ? 1 : 0), '#e8318f');
      g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 2, 2);
    }
  };

  // Nuages : quelques boules blanches, avec leur ombre sur le sol
  const CLOUDS = [0, 1, 2].map(k => {
    const c = canvas(48, 26), g = c.getContext('2d');
    const blobs = [[14, 15, 9], [24, 11, 10], [34, 15, 8], [22, 17, 9]].map(b => [b[0] + k * 2 - 2, b[1], b[2] - (k === 2 ? 2 : 0)]);
    for (const b of blobs) TM.disc(g, b[0], b[1] + 1, b[2], '#c9d6e6');
    for (const b of blobs) TM.disc(g, b[0], b[1], b[2], '#ffffff');
    return c;
  });
  const CLOUD_SH = CLOUDS.map(c => {
    const s = canvas(c.width, c.height), g = s.getContext('2d');
    g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in';
    g.fillStyle = 'rgba(16,30,40,0.16)'; g.fillRect(0, 0, s.width, s.height);
    return s;
  });
  function drawClouds(g, G, shadowPass) {
    const VH = TM.VH, near = G.mission === 2; // au-dessus des nuages, les nuages proches filent plus vite
    const Sc = G.S * (near ? 2.4 : 1.7) + G.frame * 0.04, gap = near ? 170 : 230;
    const j0 = Math.floor((Sc - 40) / gap), j1 = Math.floor((Sc + VH + 40) / gap);
    for (let j = j0; j <= j1; j++) {
      if (j < 1) continue;
      const Y = j * gap + Math.floor(TM.hash(j, 1, 9) * 120), x = Math.floor(TM.hash(j, 2, 9) * 190) - 40;
      const k = j % 3, y = Math.round(Sc + VH - Y);
      if (shadowPass) { if (!near) g.drawImage(CLOUD_SH[k], x + 16, y + 30); }
      else { g.globalAlpha = near ? 0.45 : 0.55; g.drawImage(CLOUDS[k], x, y); g.globalAlpha = 1; }
    }
  }
  // Les étoiles proches de la mission 3, qui défilent plus vite que le fond :
  // peu nombreuses, sombres, et étirées en traits (un tir ennemi est rond et vif)
  function drawStars(g, G) {
    const VH = TM.VH;
    for (let i = 0; i < 20; i++) {
      const fast = i < 8, sp = fast ? 1.6 : 0.95;
      const x = Math.floor(TM.hash(i, 5, 3) * 160), y = Math.floor((TM.hash(i, 6, 3) * (VH + 20) + G.S * sp * 2) % (VH + 20)) - 10;
      g.fillStyle = fast ? '#5a6690' : '#414a72';
      g.fillRect(x, y, 1, fast && G.scrollV > 0 ? 3 : 1);
    }
  }

  // L'antenne du sommet vue de dessus, d'où part le vaisseau (mission 1)
  function drawAntennaTop(g, G) {
    const y = Math.round(G.S + TM.VH - 70), x = 34;
    if (y < -40 || y > TM.VH + 20) return;
    g.fillStyle = 'rgba(20,30,50,0.25)';
    for (let k = 0; k < 26; k++) g.fillRect(x + 2 + k, y + 2 + (k >> 1), 4, 3);
    g.fillStyle = '#9aa3ad'; g.fillRect(x - 9, y - 9, 19, 19);
    g.fillStyle = '#7d858f'; g.fillRect(x - 8, y - 8, 17, 17);
    for (let i = -6; i <= 6; i++) {
      const c = (i + 6) % 4 < 2 ? '#d43c3c' : '#f4f4f4';
      g.fillStyle = c; g.fillRect(x + i, y + i, 1, 1); g.fillRect(x + i, y - i, 1, 1);
      g.fillRect(x - 6, y + i, 1, 1); g.fillRect(x + 6, y + i, 1, 1); g.fillRect(x + i, y - 6, 1, 1); g.fillRect(x + i, y + 6, 1, 1);
    }
    g.fillStyle = (G.frame >> 4) & 1 ? '#ff3030' : '#7a2020'; g.fillRect(x - 1, y - 1, 3, 3);
  }

  // La parabole pirate posée au sol, qui suit le vaisseau
  function drawDish(g, f, white) {
    const x = Math.round(f.x), y = Math.round(f.y);
    if (f.wreck) {
      disc(g, x, y, 6, 'rgba(20,20,20,0.45)');
      g.fillStyle = '#3a3a44'; g.fillRect(x - 5, y - 4, 10, 8);
      g.fillStyle = '#5c636e'; g.fillRect(x - 3, y - 2, 3, 2); g.fillRect(x + 1, y + 1, 3, 2);
      return;
    }
    g.fillStyle = 'rgba(20,30,20,0.35)'; g.fillRect(x - 5, y - 4, 14, 13);
    g.fillStyle = INK; g.fillRect(x - 7, y - 7, 14, 14);
    g.fillStyle = white ? '#ffffff' : '#7d858f'; g.fillRect(x - 6, y - 6, 12, 12);
    g.fillStyle = white ? '#ffffff' : '#e8318f'; g.fillRect(x - 6, y + 4, 12, 2);
    disc(g, x, y, 5, INK);
    disc(g, x, y, 4, white ? '#ffffff' : '#d4dae2');
    disc(g, x - 1, y - 1, 2, '#ffffff');
    const ax = Math.cos(f.aim), ay = Math.sin(f.aim);
    line(g, x, y, x + ax * 7, y + ay * 7, INK);
    g.fillStyle = '#e8318f'; g.fillRect(Math.round(x + ax * 7) - 1, Math.round(y + ay * 7) - 1, 2, 2);
  }

  // Le sprite d'un ennemi selon son état (et celui de son ombre)
  function foeKey(f, G) {
    const fr = ((G.frame + f.t) >> 3) & 1;
    switch (f.kind) {
      case 'choucas': return f.asleep ? 'chough0' : fr ? 'chough1' : 'chough2';
      case 'aigle': return f.asleep ? 'eagle0' : fr ? 'eagle1' : 'eagle2';
      case 'oie': return f.asleep ? 'goose0' : fr ? 'goose1' : 'goose2';
      case 'martinet': return f.asleep ? 'swift0' : ((G.frame + f.t) >> 2) & 1 ? 'swift1' : 'swift2';
      case 'meduse': return f.asleep ? 'jelly0' : ((G.frame + f.t) >> 4) & 1 ? 'jelly1' : 'jelly2';
      case 'mouche': return (G.frame >> 1) & 1 ? 'fly1' : 'fly2';
      case 'avion': return 'plane';
      case 'brouilleur': return fr ? 'tv1' : 'tv2';
      case 'bombardier': return 'bomber';
      case 'satellite': return (f.t >> 4) & 1 ? 'sat1' : 'sat2';
      case 'montgolfiere': return 'balloon';
      case 'asteroide': return 'ast' + ((f.rot + (f.t >> 4)) & 3);
      case 'caillou': return 'peb' + ((f.rot + (f.t >> 3)) & 3);
      case 'meteore': return 'peb' + ((f.rot + (f.t >> 2)) & 3);
      case 'reine': return f.asleep ? 'queen0' : ((G.frame + f.t) >> 4) & 1 ? 'queen1' : 'queen2';
    }
  }
  // Le météore : une boule de feu, avec sa traînée derrière lui
  function drawMeteor(g, f, G) {
    const n = Math.hypot(f.vx, f.sp) || 1;
    for (let i = 8; i >= 1; i--) {
      const x = Math.round(f.x - f.vx / n * i * 1.7), y = Math.round(f.y - f.sp / n * i * 1.7), s = i < 4 ? 3 : 2;
      g.fillStyle = i < 3 ? '#fff2a0' : i < 6 ? '#f5a623' : '#d8332b';
      g.fillRect(x - (s >> 1), y - (s >> 1), s, s);
    }
    TM.disc(g, Math.round(f.x), Math.round(f.y), 6, 'rgba(245,120,35,0.35)'); // le halo de feu
    spr(g, foeKey(f, G), f.x, f.y, false);
    g.fillStyle = '#fff2a0'; g.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, 2, 2);
  }
  // Le repère qui annonce un météore : un triangle rouge qui clignote au bord de l'écran
  function drawWarning(g, f) {
    if ((f.delay >> 2) % 2) return;
    const x = Math.max(5, Math.min(155, Math.round(f.x))), y = 5;
    g.fillStyle = INK; g.fillRect(x - 4, y - 1, 9, 6);
    g.fillStyle = '#ff3030';
    for (let r = 0; r < 4; r++) g.fillRect(x - 3 + r, y + r, 7 - r * 2, 1);
    g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 2);
  }
  // Les décharges des méduses : elles brillent, puis un cercle électrique s'étend autour d'elles
  function drawZap(g, f, G) {
    const x = Math.round(f.x), y = Math.round(f.y);
    if (f.charge) {
      for (let i = 0; i < 3; i++) { g.fillStyle = '#8ff7ff'; g.fillRect(x + ((Math.random() - 0.5) * 22 | 0), y + ((Math.random() - 0.5) * 22 | 0), 1, 1); }
      return;
    }
    if (f.zapR <= 0) return;
    TM.disc(g, x, y, Math.round(f.zapR), 'rgba(143,247,255,0.13)');
    const n = Math.max(16, Math.round(f.zapR * 1.4));
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283, r = f.zapR + (Math.random() - 0.5) * 2.5;
      g.fillStyle = i % 2 ? '#ffffff' : '#8ff7ff';
      g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 2, 1);
    }
  }
  const ALT = { choucas: [5, 7], aigle: [8, 11], oie: [6, 8], martinet: [6, 8], mouche: [5, 7], avion: [7, 9],
    brouilleur: [9, 13], bombardier: [12, 16], montgolfiere: [12, 18] };

  function drawZ(g, x, y) {
    x = Math.round(x); y = Math.round(y);
    g.fillStyle = INK; g.fillRect(x - 1, y - 1, 5, 5);
    g.fillStyle = '#ffffff';
    g.fillRect(x, y, 3, 1); g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x, y + 2, 3, 1);
  }

  function drawItem(g, it, f) {
    const x = Math.round(it.x), y = Math.round(it.y);
    if (it.kind === 'bobine') {
      const s = TM.SPR.reel, w = Math.max(2, Math.round(12 * Math.abs(Math.cos(f * 0.08 + it.t * 0.02))));
      g.drawImage(s.r, x - (w >> 1), y - 6, w, 12);
    } else if (it.kind === 'sifflet') {
      const r = 8 + ((f >> 3) & 1);
      for (let a = 0; a < 6.28; a += 0.35) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1); }
      spr(g, 'whistle', x, y);
    } else {
      if ((f >> 2) & 1) { g.fillStyle = '#fff6c8'; g.fillRect(x - 9, y, 18, 1); g.fillRect(x, y - 7, 1, 14); }
      spr(g, 'cassette', x, y);
    }
  }

  function drawPlayer(g, G) {
    const p = G.p, f = G.frame;
    if (G.state === 'cut' || G.state === 'over') return;
    if (p.inv > 0 && (p.inv >> 2) % 2 && G.state === 'play') return;
    const S = TM.SPR.ship, w = Math.abs(p.tilt) > 0.5 ? 15 : 17;
    const x = Math.round(p.x - w / 2), y = Math.round(p.y - 9);
    if (G.mission !== 3) g.drawImage(S.sh, x + 10, y + 14, w, 19);
    // la flamme des deux réacteurs
    const len = 2 + ((f >> 1) % 3) + (G.state === 'win' ? 4 : 0);
    const nx = Math.round(p.x);
    g.fillStyle = '#f08a24'; g.fillRect(nx - 3, y + 18, 2, len); g.fillRect(nx + 2, y + 18, 2, len);
    g.fillStyle = '#ffd34a'; g.fillRect(nx - 3, y + 18, 2, Math.max(1, len - 2)); g.fillRect(nx + 2, y + 18, 2, Math.max(1, len - 2));
    g.drawImage(S.r, x, y, w, 19);
  }

  // Rayon de brouillage et éclairs : un trait qui clignote, puis le coup
  function drawHazard(g, h, f) {
    const x = Math.round(h.x), y0 = Math.round(h.y0), VH = TM.VH;
    if (h.t < h.warm) {
      if ((f >> 2) & 1) for (let y = y0; y < VH; y += 4) { g.fillStyle = h.kind === 'bolt' ? '#fff6a0' : '#e8318f'; g.fillRect(x, y, 1, 2); }
      if (h.kind === 'bolt') { g.fillStyle = 'rgba(20,20,40,0.35)'; g.fillRect(x - 10, 0, 21, 8); }
      else { g.fillStyle = '#ffffff'; g.fillRect(x - 2, y0, 5, 1); }
      return;
    }
    if (h.kind === 'bolt') { // un éclair en zigzag, blanc et jaune
      let px = x;
      for (let y = 0; y < VH; y += 6) {
        const nx = x + Math.round((Math.random() - 0.5) * 8);
        g.fillStyle = 'rgba(255,246,160,0.5)'; g.fillRect(Math.min(px, nx) - 2, y, Math.abs(nx - px) + 5, 6);
        line(g, px, y, nx, y + 6, '#ffffff');
        line(g, px + 1, y, nx + 1, y + 6, '#fff6a0');
        px = nx;
      }
      return;
    }
    g.fillStyle = 'rgba(232,49,143,0.55)'; g.fillRect(x - 6, y0, 13, VH - y0);
    g.fillStyle = '#e8318f'; g.fillRect(x - 4, y0, 9, VH - y0);
    g.fillStyle = '#ffffff'; g.fillRect(x - 2, y0, 5, VH - y0);
    for (let i = 0; i < 30; i++) { g.fillStyle = Math.random() < 0.5 ? INK : '#ffffff'; g.fillRect(x - 5 + (Math.random() * 11 | 0), y0 + (Math.random() * (VH - y0) | 0), 1, 2); }
  }

  // La mire : la chaîne est revenue
  function drawMire(g) {
    const VW = TM.VW, VH = TM.VH;
    const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const bw = VW / 7, top = Math.round(VH * 0.67), mid = Math.round(VH * 0.75);
    cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(Math.round(i * bw), 0, Math.ceil(bw), top); });
    ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'].forEach((c, i) => { g.fillStyle = c; g.fillRect(Math.round(i * bw), top, Math.ceil(bw), mid - top); });
    g.fillStyle = '#00214c'; g.fillRect(0, mid, 28, VH - mid);
    g.fillStyle = '#ffffff'; g.fillRect(28, mid, 28, VH - mid);
    g.fillStyle = '#32006a'; g.fillRect(56, mid, 28, VH - mid);
    g.fillStyle = '#131313'; g.fillRect(84, mid, VW - 84, VH - mid);
    const cx = VW / 2, cy = Math.round(top * 0.5);
    TM.disc(g, cx, cy, 30, '#ffffff'); TM.disc(g, cx, cy, 28, '#141018');
    const m = TM.SPR.mStand;
    g.drawImage(m.r, cx - 24, cy - 26, 48, 48);
  }

  TM.render = function (g, G) {
    const VW = TM.VW, VH = TM.VH, f = G.frame, M = G.mission;
    if (G.state === 'intro' || G.state === 'outro') { TM.cine.draw(g, G.scene); return; }
    if (G.state === 'credits') { // le générique défile par-dessus la dernière image
      TM.cine.draw(g, G.scene);
      g.fillStyle = 'rgba(8,10,24,0.6)'; g.fillRect(0, 0, VW, VH);
      return;
    }
    if (G.mire) { drawMire(g); return; }
    let sx = 0, sy = 0;
    if (G.shake > 0) { const a = G.shake > 10 ? 2 : 1; sx = ((f * 7) % 3 - 1) * a; sy = ((f * 5) % 3 - 1) * a; }
    g.save(); g.translate(sx, sy);
    TM.terrain.setMission(M);
    TM.terrain.draw(g, G.S, VH);
    if (M === 1) drawAntennaTop(g, G);
    if (M === 3) drawStars(g, G);
    if (M === 1) drawClouds(g, G, true);
    // au sol : paraboles, épaves, boss au sol
    for (const q of G.foes) if (TM.DEF[q.kind].ground) drawDish(g, q, q.hitT > 0);
    const B = G.boss, T = B && TM.BOSSES[B.type];
    if (B && T.ground) T.draw(g, B, G, R);
    // les bêtes qui font la sieste
    for (const q of G.foes) if (q.asleep) {
      const k = Math.max(0, 1 - q.sleepT / 60), a = ALT[q.kind];
      if (k > 0 && a && M !== 3) shade(g, foeKey(q, G), q.x + a[0] * k, q.y + a[1] * k);
      spr(g, foeKey(q, G), q.x, q.y, false);
    }
    for (const z of G.zs) drawZ(g, z.x, z.y);
    if (M !== 3) drawClouds(g, G, false);
    for (const it of G.items) drawItem(g, it, f);
    // en l'air : ombres, puis ennemis, puis le boss volant
    if (M !== 3) for (const q of G.foes) if (!q.asleep && !q.dead && ALT[q.kind]) { const a = ALT[q.kind]; shade(g, foeKey(q, G), q.x + a[0], q.y + a[1]); }
    for (const q of G.foes) {
      if (q.asleep || q.dead || TM.DEF[q.kind].ground) continue;
      if (q.delay > 0) { drawWarning(g, q); continue; }
      if (q.kind === 'meteore') { drawMeteor(g, q, G); continue; }
      drawZap(g, q, G);
      spr(g, foeKey(q, G), q.x, q.y, q.hitT > 0 || (q.charge && (G.frame >> 2) & 1));
    }
    if (B && !T.ground) T.draw(g, B, G, R);
    const note = TM.SPR.note;
    for (const s of G.shots) g.drawImage(note.r, Math.round(s.x - 2), Math.round(s.y - 3));
    drawPlayer(g, G);
    for (const b of G.blocks) { // carré de neige de télé à la place de la machine
      for (let i = 0; i < b.w * b.h / 2; i++) {
        const v = (Math.random() * 255) | 0;
        g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
        g.fillRect(Math.round(b.x - b.w / 2 + Math.random() * b.w), Math.round(b.y - b.h / 2 + Math.random() * b.h), 1, 1);
      }
    }
    for (const q of G.parts) { g.fillStyle = q.c; g.fillRect(Math.round(q.x), Math.round(q.y), q.sz, q.sz); }
    const bl = TM.SPR[(f >> 2) & 1 ? 'blt1' : 'blt2'], bb = TM.SPR.bombe;
    for (const b of G.bullets) {
      if (b.big) g.drawImage(bb.r, Math.round(b.x - 3), Math.round(b.y - 3));
      else if (b.elec) { // une boule électrique qui crépite
        const x = Math.round(b.x), y = Math.round(b.y);
        TM.disc(g, x, y, 3, INK); TM.disc(g, x, y, 2, '#8ff7ff');
        g.fillStyle = '#ffffff'; g.fillRect(x - 1, y - 1, 2, 2);
        for (let i = 0; i < 2; i++) g.fillRect(x + ((Math.random() - 0.5) * 10 | 0), y + ((Math.random() - 0.5) * 10 | 0), 1, 1);
      } else g.drawImage(bl.r, Math.round(b.x - 2), Math.round(b.y - 2));
    }
    for (const R2 of G.rings) { // l'onde du grand sifflet
      const n = Math.max(12, Math.round(R2.r * 0.7));
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.283 + R2.r * 0.01, x = Math.round(R2.x + Math.cos(a) * R2.r), y = Math.round(R2.y + Math.sin(a) * R2.r);
        g.fillStyle = i % 3 ? '#f5c842' : '#ffffff'; g.fillRect(x, y, 2, 2);
      }
    }
    for (const h of G.hazards) drawHazard(g, h, f);
    g.restore();
    // l'orage gronde : de temps en temps, le ciel s'éclaire
    if (M === 2 && G.state === 'play' && TM.terrain.stormAt(G.S + VH / 2) && f % 211 < 3) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 0, VW, VH); }
    if (G.flashT > 0) { g.fillStyle = 'rgba(255,250,220,' + Math.min(0.8, G.flashT / 10) + ')'; g.fillRect(0, 0, VW, VH); }
    if (G.state === 'taunt') TM.cine.drawTaunt(g, G.taunt);
  };
})(window.TM);
