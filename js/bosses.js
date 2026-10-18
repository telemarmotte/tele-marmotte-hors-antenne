// Hors Antenne ! : les trois boss de Télé-Parasite (règles et dessin)
//   Chaque boss a des pièces : on détruit d'abord les pièces gardes, puis le cœur se découvre.
//   A = outils du jeu (tirs, ennemis, sons), R = outils de dessin.
window.TM = window.TM || {};
(function (TM) {
  const INK = '#1b1410';

  function spiral(A, B, x, y, step, arms, sp) { // une spirale de parasites, un tir toutes les « step » images
    if (B.cyc % step) return;
    for (let k = 0; k < arms; k++) {
      const a = B.spiral + k * Math.PI * 2 / arms;
      A.bullet(x + Math.cos(a) * 10, y + Math.sin(a) * 10, Math.cos(a) * sp, Math.sin(a) * sp);
    }
    B.spiral += 0.37;
    if (B.cyc % (step * 3) === 0) A.sfx('fire');
  }
  function guards(B) { return B.parts.filter(q => !q.core && q.hp > 0); }
  function core(B) { return B.parts.find(q => q.core); }
  function open(A, B, text) { // les gardes sont tombées : le cœur se découvre
    const c = core(B);
    if (!c.armor) return false;
    c.armor = false; B.cyc = 0;
    A.sfx('open'); A.emit('pop', text);
    return true;
  }

  TM.BOSSES = {
    // ---------- Mission 1 : le relais pirate, posé sur la crête ----------
    relais: {
      name: 'le relais pirate', bar: 'RELAIS PIRATE', down: 'Relais pirate : hors service !', hint: 'Détruis les deux émetteurs !',
      ground: true, w: 100, h: 44,
      spawn: function (B) {
        B.parts = [
          { dx: -40, dy: 6, hw: 10, hh: 10, hp: 70, fireT: 60, downText: 'Émetteur détruit !' },
          { dx: 40, dy: 6, hw: 10, hh: 10, hp: 70, fireT: 115, downText: 'Émetteur détruit !' },
          { dx: 0, dy: 0, hw: 14, hh: 13, hp: 340, core: true, armor: true }
        ];
        B.a = 0;
      },
      update: function (G, B, A) {
        const g = guards(B), dish = core(B), p = G.p;
        if (g.length) {
          B.a += 0.02;
          for (const q of g) if (--q.fireT <= 0) { q.fireT = 110; A.aim(B.x + q.dx, B.y + q.dy + 4, 1.25, 3, 0.22); }
          if (B.t % 170 === 0) A.ring(B.x, B.y, 0.8, 10, B.t * 0.01);
          return;
        }
        open(A, B, 'La parabole s’ouvre : vise le centre !');
        B.a += 0.06;
        const hard = dish.hp < dish.max * 0.45, c = B.cyc % 310;
        if (c < 150) spiral(A, B, B.x, B.y, hard ? 6 : 7, hard ? 2 : 1, 1.05);
        if (c === 180) A.beam(p.x, B.y + 14);
        if (hard && c === 250) {
          A.spawn({ kind: 'mouche', x: -10, y: 110, pat: 'swoop', dir: 1, sp: 1.5 });
          A.spawn({ kind: 'mouche', x: 170, y: 110, pat: 'swoop', dir: -1, sp: 1.5 });
        }
        B.cyc++;
      },
      draw: function (g, B, G, R) {
        const x = Math.round(B.x), y = Math.round(B.y), f = G.frame;
        g.fillStyle = 'rgba(20,30,50,0.3)'; g.fillRect(x - 54, y - 20, 116, 56);
        g.fillStyle = INK; g.fillRect(x - 59, y - 25, 118, 58);
        g.fillStyle = '#5c636e'; g.fillRect(x - 58, y - 24, 116, 56);
        g.fillStyle = '#7d858f'; g.fillRect(x - 56, y - 22, 112, 52);
        for (let i = 0; i < 112; i += 6) { g.fillStyle = '#e8318f'; g.fillRect(x - 56 + i, y + 27, 3, 3); g.fillStyle = INK; g.fillRect(x - 53 + i, y + 27, 3, 3); }
        g.fillStyle = '#a3aab4';
        for (let i = -52; i <= 52; i += 13) { g.fillRect(x + i, y - 20, 1, 1); g.fillRect(x + i, y + 24, 1, 1); }
        g.fillStyle = '#5c636e'; g.fillRect(x - 40, y + 6, 80, 2); g.fillRect(x - 1, y - 20, 2, 46);
        R.logo(g, x - 9, y + 14, '#5c636e');
        for (const q of B.parts) {
          if (q.core) continue;
          const px = x + q.dx, py = y + q.dy;
          if (q.hp <= 0) { R.wreck(g, G, px, py, 16, 14); continue; }
          const wh = q.hitT > 0;
          g.fillStyle = INK; g.fillRect(px - 9, py - 9, 18, 18);
          g.fillStyle = wh ? '#ffffff' : '#3a3a44'; g.fillRect(px - 8, py - 8, 16, 16);
          for (const [ax, ay] of [[-7, -7], [6, -7], [-7, 6], [6, 6]]) { g.fillStyle = '#a3aab4'; g.fillRect(px + ax, py + ay, 2, 2); }
          R.disc(g, px, py, 5, INK);
          R.disc(g, px, py, 4, wh ? '#ffffff' : '#8a1a58');
          R.disc(g, px, py, 2 + ((f >> 3) & 1), wh ? '#ffffff' : '#e8318f');
          g.fillStyle = '#ffffff'; g.fillRect(px - 1, py - 1, 1, 1);
        }
        R.dish(g, B, core(B), x, y, 13, G);
      }
    },

    // ---------- Mission 2 : le zeppelin pirate, au-dessus des nuages ----------
    zeppelin: {
      name: 'le zeppelin pirate', bar: 'ZEPPELIN PIRATE', down: 'Zeppelin pirate : dégonflé !', hint: 'Vise les deux tourelles !',
      ground: false, y: 74, w: 120, h: 40, body: { hw: 56, hh: 14 },
      spawn: function (B) {
        B.y = -40;
        B.parts = [
          { dx: -30, dy: 11, hw: 8, hh: 7, hp: 60, fireT: 50, downText: 'Tourelle détruite !' },
          { dx: 30, dy: 11, hw: 8, hh: 7, hp: 60, fireT: 100, downText: 'Tourelle détruite !' },
          { dx: 0, dy: -3, hw: 11, hh: 10, hp: 380, core: true, armor: true }
        ];
        B.a = 0; B.x0 = 80;
      },
      update: function (G, B, A) {
        B.x = 80 + Math.sin(B.t * 0.008) * 22;
        const g = guards(B), mast = core(B);
        if (g.length) {
          for (const q of g) if (--q.fireT <= 0) { q.fireT = 100; A.aim(B.x + q.dx, B.y + q.dy + 5, 1.25, 3, 0.25); }
          if (B.t % 160 === 80) A.bombe(B.x, B.y + 16, 0, 0.75, 70);
          return;
        }
        open(A, B, 'L’antenne se déploie : vise-la !');
        B.a += 0.06;
        const hard = mast.hp < mast.max * 0.45, c = B.cyc % 360;
        if (c === 20 || c === 60 || (hard && c === 100)) A.aim(B.x, B.y + 6, 1.2, 7, 0.17);
        if (c >= 130 && c < 250) spiral(A, B, B.x, B.y - 3, hard ? 5 : 7, hard ? 2 : 1, 1.05);
        if (c === 280) { A.bombe(B.x - 30, B.y + 16, -0.2, 0.7, 60); A.bombe(B.x + 30, B.y + 16, 0.2, 0.7, 60); }
        if (c === 320) {
          A.spawn({ kind: 'avion', x: -10, y: 120, pat: 'swoop', dir: 1, sp: 1.6 });
          A.spawn({ kind: 'avion', x: 170, y: 120, pat: 'swoop', dir: -1, sp: 1.6 });
        }
        B.cyc++;
      },
      draw: function (g, B, G, R) {
        const x = Math.round(B.x), f = G.frame;
        const sink = B.dead ? Math.min(30, B.deadT * 0.2) : 0, y = Math.round(B.y + sink);
        const ry = B.dead ? Math.max(7, 16 - B.deadT * 0.06) : 16;
        // ombre portée sur les nuages, très loin dessous
        g.fillStyle = 'rgba(30,20,50,0.22)';
        for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(58 * Math.sqrt(1 - (dy / (ry + 1)) * (dy / (ry + 1)))); g.fillRect(x + 14 - w, y + 30 + dy, w * 2, 1); }
        // empennage à l'arrière (à droite)
        for (const fy of [y - ry - 9, y + ry - 1]) {
          g.fillStyle = INK; g.fillRect(x + 42, fy, 18, 10);
          g.fillStyle = B.dead ? '#5a2040' : '#e8318f'; g.fillRect(x + 43, fy + 1, 16, 8);
          g.fillStyle = '#8a1a58'; g.fillRect(x + 43, fy + 6, 16, 2);
        }
        // moteurs et hélices
        for (const s of [-1, 1]) {
          const ex = x + 26, ey = y + s * 18;
          g.fillStyle = INK; g.fillRect(ex - 6, ey - 3, 12, 6);
          g.fillStyle = '#5c636e'; g.fillRect(ex - 5, ey - 2, 10, 4);
          g.fillStyle = '#c9d0d8';
          if ((f >> 1) & 1) g.fillRect(ex + 6, ey - 5, 1, 10); else g.fillRect(ex + 6, ey - 1, 1, 2);
        }
        // l'enveloppe
        for (let dy = -ry; dy <= ry; dy++) {
          const w = Math.round(60 * Math.sqrt(1 - (dy / (ry + 1)) * (dy / (ry + 1))));
          g.fillStyle = INK; g.fillRect(x - w - 1, y + dy, w * 2 + 2, 1);
          const col = B.dead ? '#6a6f78' : dy < -ry * 0.45 ? '#e3e8ee' : dy < ry * 0.3 ? '#b4bbc4' : '#8a929c';
          if (w > 1) { g.fillStyle = col; g.fillRect(x - w, y + dy, w * 2, 1); }
        }
        g.fillStyle = INK; g.fillRect(x - 61, y - ry - 1, 1, 1);
        g.fillStyle = B.dead ? '#5a2040' : '#e8318f'; g.fillRect(x - 56, y - 1, 112, 3);
        g.fillStyle = '#8a1a58'; g.fillRect(x - 56, y + 2, 112, 1);
        g.fillStyle = 'rgba(0,0,0,0.18)';
        for (let i = -48; i <= 48; i += 12) g.fillRect(x + i, y - ry + 2, 1, ry * 2 - 3);
        R.logo(g, x - 44, y - 9, '#b4bbc4');
        // tourelles
        for (const q of B.parts) {
          if (q.core) continue;
          const px = x + q.dx, py = y + q.dy;
          if (q.hp <= 0) { R.wreck(g, G, px, py, 10, 8); continue; }
          R.disc(g, px, py, 5, INK);
          R.disc(g, px, py, 4, q.hitT > 0 ? '#ffffff' : '#3a3a44');
          const a = Math.atan2(G.p.y - py, G.p.x - px);
          R.line(g, px, py, px + Math.cos(a) * 6, py + Math.sin(a) * 6, INK);
          g.fillStyle = '#e8318f'; g.fillRect(px - 1, py - 1, 2, 2);
        }
        R.dish(g, B, core(B), x, y - 3, 9, G);
      }
    },

    // ---------- Mission 3 : la dameuse lunaire (oui, elle) ----------
    dameuse: {
      name: 'la dameuse lunaire', bar: 'DAMEUSE LUNAIRE', down: 'Dameuse lunaire : en panne sèche !', hint: 'Éteins ses deux phares !',
      ground: true, w: 56, h: 50,
      spawn: function (B) {
        B.parts = [
          { dx: -16, dy: 21, hw: 8, hh: 7, hp: 55, fireT: 60, downText: 'Phare éteint !' },
          { dx: 16, dy: 21, hw: 8, hh: 7, hp: 55, fireT: 115, downText: 'Phare éteint !' },
          { dx: 0, dy: -4, hw: 12, hh: 11, hp: 320, core: true, armor: true }
        ];
        B.a = 0; B.dir = 1; B.minX = 80; B.maxX = 80; B.track = 0;
      },
      update: function (G, B, A) {
        const g = guards(B), ant = core(B), p = G.p;
        // elle dame la Lune : un aller-retour sans fin
        const sp = g.length ? 0.3 : 0.45;
        B.x += B.dir * sp; B.track += sp;
        if (B.x > 114) B.dir = -1;
        if (B.x < 46) B.dir = 1;
        B.minX = Math.min(B.minX, B.x); B.maxX = Math.max(B.maxX, B.x);
        if (g.length) {
          for (const q of g) if (--q.fireT <= 0) { q.fireT = 110; A.aim(B.x + q.dx, B.y + q.dy + 3, 1.25, 3, 0.22); }
          if (B.t % 150 === 75) A.rock(B.x + (G.rnd() - 0.5) * 24, B.y + 28, (G.rnd() - 0.5) * 0.6, 0.9);
          return;
        }
        open(A, B, 'L’antenne pirate se lève : vise-la !');
        B.a += 0.06;
        const hard = ant.hp < ant.max * 0.45, c = B.cyc % 330;
        if (c < 150) spiral(A, B, B.x, B.y - 4, hard ? 6 : 8, hard ? 2 : 1, 1.0);
        if (c === 175) A.beam(p.x, B.y + 14);
        if (c % 110 === 50) A.rock(B.x, B.y + 28, (G.rnd() - 0.5) * 0.8, 0.95);
        if (hard && c === 260) for (const vx of [-0.7, 0, 0.7]) A.rock(B.x + vx * 10, B.y + 28, vx, 0.9);
        B.cyc++;
      },
      draw: function (g, B, G, R) {
        const x = Math.round(B.x), y = Math.round(B.y), f = G.frame;
        // la piste damée : du velours côtelé sur la poussière lunaire
        const x0 = Math.round(B.minX) - 22, x1 = Math.round(B.maxX) + 22;
        for (let yy = y - 22; yy < y + 26; yy++) { g.fillStyle = (yy & 1) ? '#c2c2ca' : '#a6a6ae'; g.fillRect(x0, yy, x1 - x0, 1); }
        g.fillStyle = 'rgba(20,20,40,0.35)'; g.fillRect(x - 20, y - 14, 50, 44);
        // chenilles
        for (const tx of [x - 24, x + 15]) {
          g.fillStyle = INK; g.fillRect(tx, y - 19, 9, 38);
          g.fillStyle = '#2c2c32'; g.fillRect(tx + 1, y - 18, 7, 36);
          g.fillStyle = '#55555e';
          for (let k = 0; k < 9; k++) g.fillRect(tx + 1, y - 18 + ((k * 4 + Math.floor(B.track * 2)) % 36), 7, 1);
        }
        // fraise à l'arrière (en haut) et lame devant (en bas)
        g.fillStyle = INK; g.fillRect(x - 20, y - 25, 40, 6);
        g.fillStyle = '#9aa3ad'; g.fillRect(x - 19, y - 24, 38, 4);
        g.fillStyle = '#5c636e'; for (let i = -18; i < 19; i += 3) g.fillRect(x + i, y - 20, 1, 2);
        g.fillStyle = INK; g.fillRect(x - 28, y + 22, 56, 6);
        g.fillStyle = '#9aa3ad'; g.fillRect(x - 27, y + 23, 54, 4);
        g.fillStyle = '#c9d0d8'; g.fillRect(x - 27, y + 23, 54, 1);
        // caisse et cabine
        g.fillStyle = INK; g.fillRect(x - 16, y - 18, 32, 36);
        g.fillStyle = B.dead ? '#5a2a26' : '#b02a20'; g.fillRect(x - 15, y - 17, 30, 34);
        g.fillStyle = B.dead ? '#6a3a36' : '#d8392c'; g.fillRect(x - 15, y - 17, 30, 5);
        g.fillStyle = INK; g.fillRect(x - 11, y - 10, 22, 20);
        g.fillStyle = '#e9edf2'; g.fillRect(x - 10, y - 9, 20, 18);
        g.fillStyle = '#7fc3ea'; g.fillRect(x - 10, y + 6, 20, 3);
        // gyrophare
        g.fillStyle = B.dead ? '#5a3a10' : ((f >> 3) & 1 ? '#ffb020' : '#a05a00'); g.fillRect(x + 6, y - 15, 4, 3);
        // le petit drapeau de Télé-Parasite
        g.fillStyle = INK; g.fillRect(x - 13, y - 22, 1, 9);
        g.fillStyle = '#e8318f'; g.fillRect(x - 12, y - 22, 6, 4);
        g.fillStyle = INK; g.fillRect(x - 9, y - 21, 2, 2);
        // phares
        for (const q of B.parts) {
          if (q.core) continue;
          const px = x + q.dx, py = y + q.dy;
          g.fillStyle = INK; g.fillRect(px - 4, py - 3, 8, 6);
          if (q.hp <= 0) { g.fillStyle = '#3a3a44'; g.fillRect(px - 3, py - 2, 6, 4); continue; }
          g.fillStyle = q.hitT > 0 ? '#ffffff' : (q.fireT < 18 && (f & 2) ? '#ffffff' : '#fff2a0'); g.fillRect(px - 3, py - 2, 6, 4);
          g.fillStyle = 'rgba(255,242,160,0.25)'; g.fillRect(px - 4, py + 3, 8, 6);
        }
        R.dish(g, B, core(B), x, y - 4, 8, G);
        if (!B.dead && f % 6 === 0) G.parts.push({ x: x + (B.dir > 0 ? -20 : 20), y: y + 10 + (Math.random() * 10 | 0), vx: -B.dir * 0.3, vy: 0.1, life: 20, c: '#b4b4bc', sz: 1 });
      }
    }
  };
})(window.TM);
