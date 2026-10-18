// Un pilote « humain » pour comparer la difficulté des missions (à lancer dans la page du jeu :
//   await fetch('_dev/human.js').then(r => r.text()).then(eval) )
// Il décide toutes les 8 à 14 images (temps de réaction), bouge moins vite qu'un robot
// et ne voit le danger qu'assez près de lui. Il traverse chaque mission une fois en entier :
// quand il est touché, on compte la touche et il continue (sans revenir au clap).
(function () {
  const runs = 5, out = [];
  function decide(G) {
    const p = G.p, B = G.boss;
    let tx = 80, best = null;
    for (const f of G.foes) if (!f.asleep && !f.dead && !f.delay && f.y > -5 && f.y < p.y - 16 && (!best || f.y > best.y)) best = f;
    if (B && B.ready && !B.dead) { const q = B.parts.find(q => q.hp > 0 && !q.armor) || B.parts.find(q => q.hp > 0); tx = B.x + q.dx; }
    else if (best) tx = best.x;
    let bx = 0, by = 0;
    for (const b of G.bullets) {
      const dx = p.x - b.x, dy = p.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 500) { bx += dx / (d2 + 1) * 50; by += dy / (d2 + 1) * 50; }
    }
    for (const f of G.foes) {
      if (f.asleep || f.dead || f.delay > 0 || TM.DEF[f.kind].ground) continue;
      const dx = p.x - f.x, dy = p.y - f.y, d2 = dx * dx + dy * dy, zap = f.charge || f.zapR > 0;
      if (d2 < (zap ? 2500 : 900) && (dy > -6 || zap)) { bx += dx / (d2 + 1) * 120; by += dy / (d2 + 1) * 60; }
    }
    for (const h of G.hazards) if (h.t > h.warm - 30 && Math.abs(h.x - p.x) < 16) tx = h.x < 80 ? h.x + 30 : h.x - 30;
    const c = (v, m) => Math.max(-m, Math.min(m, v));
    let ty = TM.VH - 60;
    if (B && B.ready && !B.dead && TM.BOSSES[B.type].body) ty = Math.max(ty, B.y + 60);
    tx += (Math.random() - 0.5) * 16;
    return { dx: c((tx - p.x) * 0.15 + bx, 1.4), dy: c((ty - p.y) * 0.08 + by, 1.4) };
  }
  TM.quiet = true;
  for (const m of [1, 2, 3]) {
    const hits = [], boss = [], where = {};
    for (let r = 0; r < runs; r++) {
      const G = TM.newGame(m, {});
      let inp = {}, n = 0, next = 0, h = 0, hb = 0;
      while (G.state !== 'over' && n < 60 * 400) {
        if (G.state === 'play' && n >= next) { inp = decide(G); next = n + 8 + Math.floor(Math.random() * 7); }
        if (TM.inScene(G)) TM.skipScene(G);
        TM.step(G, G.state === 'play' ? inp : {}); G.events.length = 0; n++;
        if (G.state === 'cut') { // touché : on note, et on repart sur place
          if (G.boss) hb++; else { h++; const k = Math.floor(G.t / 600) * 10; where[k] = (where[k] || 0) + 1; }
          G.state = 'play'; G.p.inv = 90;
          G.bullets = G.bullets.filter(b => Math.hypot(b.x - G.p.x, b.y - G.p.y) > 30); G.hazards = [];
        }
      }
      hits.push(h); boss.push(hb + (G.state === 'over' ? '' : ' (boss pas battu)'));
    }
    const avg = hits.reduce((a, b) => a + b, 0) / runs;
    out.push('mission ' + m + ' : parcours touché ' + hits.join(', ') + ' (moyenne ' + avg.toFixed(1) + ') · boss ' + boss.join(', ') +
      '\n   par tranche de 10 s : ' + Object.keys(where).sort((a, b) => a - b).map(k => k + 's:' + where[k]).join(' '));
  }
  TM.quiet = false;
  TM.debug.toTitle();
  return out.join('\n');
})();
