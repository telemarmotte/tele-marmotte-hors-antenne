// Essais automatiques de Hors Antenne ! (à lancer dans la page du jeu :
//   await fetch('_dev/test.js').then(r => r.text()).then(eval) )
(function () {
  const D = TM.debug, out = [];
  const ok = (name, cond, info) => out.push((cond ? 'OK   ' : 'ÉCHEC ') + name + (info !== undefined ? ' : ' + info : ''));
  const run = (n, inp) => { for (let i = 0; i < n; i++) D.run(1, inp); };
  const fresh = m => { D.start(m || 1, false); const G = D.G; run(80); G.script = []; G.idx = 0; return G; };

  // 1. Entrée du vaisseau, déplacement relatif, bords
  let G = fresh();
  ok("le vaisseau entre par le bas", G.p.enter === 0 && Math.abs(G.p.y - (TM.VH - 44)) < 2, Math.round(G.p.y));
  const x0 = G.p.x;
  D.run(1, { dx: 10, dy: 0 });
  ok('il suit le glissement du doigt', Math.abs(G.p.x - (x0 + 10)) < 0.01, G.p.x);
  D.run(1, { dx: -500, dy: -900 });
  ok("il reste dans l'écran", G.p.x === 7 && G.p.y === 14);
  ok('il tire tout seul', G.shots.length > 0, G.shots.length + ' croches en vol');

  // 2. Choucas endormi, mouche détruite
  G = fresh(); G.p.x = 80; G.p.y = TM.VH - 44;
  TM.spawnFoe(G, { kind: 'choucas', x: 80, y: 40, pat: 'down', sp: 0.3 });
  run(40);
  ok('le choucas touché s’endort', G.slept === 1 && G.foes[0] && G.foes[0].asleep);
  G.foes[0].x = G.p.x; G.foes[0].y = G.p.y;
  run(5);
  ok('un choucas endormi ne fait pas de mal', G.state === 'play');
  TM.spawnFoe(G, { kind: 'mouche', x: 80, y: 30, pat: 'down', sp: 0.3 });
  run(40);
  ok('la mouche explose', G.broke === 1);

  // 3. Touché : Coupez !, clap, prise 2 au dernier point de reprise
  G = fresh();
  G.score = 1234; G.t = 500; G.ck = { t: 300, idx: 0, score: 777, slept: 0, broke: 0, rocks: 0, reels: 0 };
  G.p.inv = 0;
  G.bullets.push({ x: G.p.x, y: G.p.y - 1, vx: 0, vy: 0 });
  D.run(1);
  ok('un parasite sur la marmotte = « Coupez ! »', G.state === 'cut');
  run(60);
  ok('le clap s’affiche', !document.getElementById('clap').hidden && document.getElementById('clap-n').textContent === '2');
  run(70);
  ok('reprise au clap, prise 2', G.state === 'play' && G.prise === 2 && G.t >= 300 && G.t < 320 && G.score === 777,
    'prise ' + G.prise + ', t ' + G.t + ', audimat ' + G.score);
  ok('le clap disparaît', document.getElementById('clap').hidden);

  // 4. Grand sifflet
  G = fresh(); G.p.inv = 0;
  for (let i = 0; i < 8; i++) G.bullets.push({ x: 20 + i * 15, y: 40, vx: 0, vy: 0.1 });
  TM.spawnFoe(G, { kind: 'choucas', x: 30, y: 30, pat: 'down', sp: 0.1 });
  TM.spawnFoe(G, { kind: 'mouche', x: 130, y: 30, pat: 'down', sp: 0.1 });
  D.run(1, { bomb: true });
  ok('le sifflet efface les tirs', G.bullets.length === 0 && G.p.bombs === 2);
  run(70);
  ok("l'onde endort et détruit, jusqu'en haut de l'écran", G.slept === 1 && G.broke === 1);

  // 5. Bobine et groupe
  G = fresh();
  G.items.push({ kind: 'bobine', x: G.p.x, y: G.p.y, t: 0 });
  D.run(1);
  ok('la bobine renforce le tir', G.p.power === 2 && G.reels === 1);
  G.groups.gx = { left: 3, esc: 0, drop: 'sifflet' };
  for (let i = 0; i < 3; i++) TM.spawnFoe(G, { kind: 'choucas', x: G.p.x, y: 20 - i * 14, pat: 'down', sp: 0.2, group: 'gx' });
  run(90);
  ok("tout le groupe endormi = un objet tombe", G.items.some(it => it.kind === 'sifflet') || G.p.bombs > 3);

  // 6. Nouveautés des missions 2 et 3
  G = fresh(3); G.p.x = 80; G.p.y = TM.VH - 44;
  TM.spawnFoe(G, { kind: 'asteroide', x: 80, y: 40, sp: 0.2 });
  run(50);
  ok("l'astéroïde se casse en deux cailloux", G.rocks >= 1 && (G.foes.filter(f => f.kind === 'caillou').length >= 1 || G.rocks >= 2), G.rocks + ' rochers cassés');
  G = fresh(2); G.p.inv = 9999;
  G.bullets.push({ x: 40, y: 60, vx: 0, vy: 0, big: true, burst: 3 });
  run(4);
  ok('la bombe à parasites éclate en couronne', G.bullets.length === 8, G.bullets.length + ' parasites');
  G = fresh(2); G.p.inv = 0; G.p.x = 60;
  G.hazards.push({ x: 60, y0: 0, t: 0, warm: 60, fire: 16, w: 9, kind: 'bolt' });
  run(50);
  ok("l'éclair annoncé ne frappe pas encore", G.state === 'play');
  run(15);
  ok("l'éclair frappe qui reste dessous", G.state === 'cut');
  G = fresh(2); G.p.x = 30;
  G.hazards.push({ x: 120, y0: 0, t: 0, warm: 30, fire: 16, w: 9, kind: 'bolt' });
  G.p.inv = 0; run(50);
  ok("à côté de l'éclair, rien", G.state === 'play');
  G = fresh(2); G.p.inv = 9999;
  TM.spawnFoe(G, { kind: 'oie', x: G.p.x, y: 40, pat: 'down', sp: 0.2 });
  TM.spawnFoe(G, { kind: 'meduse', x: G.p.x, y: 10, pat: 'sine', sp: 0.2, amp: 0 });
  run(80);
  ok("l'oie et la méduse s'endorment", G.slept === 2, G.slept + ' endormies');

  // 6 bis. Mission 3 : météores durs, cailloux visés, méduses électriques, reine
  G = fresh(3); G.p.x = 80; G.p.inv = 9999;
  const met = TM.spawnFoe(G, { kind: 'meteore', x: 80, y: 20, vx: 0, sp: 0.1, warn: true });
  run(30);
  ok('le météore est annoncé avant d’arriver', met.delay > 0 && Math.abs(met.y - 20) < 0.01);
  run(60);
  ok('les croches rebondissent sur le météore', !met.dead && G.foes.indexOf(met) >= 0, 'y ' + Math.round(met.y));
  D.run(1, { bomb: true }); run(40);
  ok('le grand sifflet pulvérise le météore', met.dead);
  G = fresh(3); G.p.x = 30; G.p.inv = 9999;
  const ast = TM.spawnFoe(G, { kind: 'asteroide', x: 120, y: 40, sp: 0 });
  ast.hp = 0.5; G.shots.push({ x: 120, y: 44, vx: 0, vy: -1, d: 1 }); D.run(1);
  const pebs = G.foes.filter(f => f.kind === 'caillou');
  ok('les cailloux foncent vers le vaisseau', pebs.length === 2 && pebs[0].vx + pebs[1].vx < -0.4, pebs.map(f => f.vx.toFixed(2)).join(' / '));
  G = fresh(3); G.p.inv = 0; G.p.x = 80; G.p.y = 120;
  const jel = TM.spawnFoe(G, { kind: 'meduse', x: 80, y: 102, pat: 'sine', sp: 0.0001, amp: 0 });
  jel.hp = 999; jel.zc = 150 - 24 - 36 - 1;
  run(30);
  ok('la méduse brille avant la décharge', jel.charge && G.state === 'play');
  run(24);
  ok('sa décharge frappe qui est trop près', G.state === 'cut', 'rayon ' + jel.zapR.toFixed(1));
  G = fresh(3); G.p.inv = 9999; G.p.x = 120;
  const jel2 = TM.spawnFoe(G, { kind: 'meduse', x: 40, y: 40, pat: 'sine', sp: 0.0001, amp: 0 });
  jel2.zc = 150 - 24 - 2;
  run(4);
  const ball = G.bullets.find(b => b.elec);
  ok('la méduse tire une boule électrique vers la marmotte', !!ball && ball.vx > 0 && ball.vy > 0, ball ? 'vx ' + ball.vx.toFixed(2) + ', vy ' + ball.vy.toFixed(2) : 'aucune');
  ok('les méduses ont 12 points de vie, la reine 260', TM.DEF.meduse.hp === 12 && TM.DEF.reine.hp === 260);
  G = fresh(3); G.p.inv = 9999;
  const rq = TM.spawnFoe(G, { kind: 'reine', x: 80, y: 30, yStop: 60, dur: 9999, drop: 'sifflet' });
  run(260);
  const babies = G.foes.filter(f => f.kind === 'meduse').length;
  const barShown = !document.getElementById('bossbar').hidden && document.getElementById('boss-name').textContent === 'REINE DES MÉDUSES';
  rq.hp = 1; G.shots.push({ x: rq.x, y: rq.y + 4, vx: 0, vy: -1, d: 1 }); run(2);
  ok('la reine lâche des bébés méduses, puis s’endort', babies >= 2 && rq.asleep && G.items.some(i => i.kind === 'sifflet'), babies + ' bébés');
  ok('la reine a sa barre de vie, qui part quand elle dort', barShown && document.getElementById('bossbar').hidden && !G.mid);
  G = fresh(3); G.p.x = 120; G.p.inv = 9999;
  const am = TM.spawnFoe(G, { kind: 'meteore', x: 30, y: -8, vx: 0, sp: 2, warn: true, aimed: true });
  run(37);
  ok('un météore « visé » part vers la marmotte', am.vx > 0.3, 'vx ' + am.vx.toFixed(2));

  // 7. Les cinématiques : elles se terminent seules et se passent d'un toucher
  TM.quiet = true;
  D.start(1, true); run(20); TM.skipScene(D.G); D.run(1);
  ok("un toucher dans la première seconde ne passe pas la scène", D.G.state === 'intro');
  for (const m of [1, 2, 3]) {
    D.start(m, true); run(70);
    const st = D.G.state;
    TM.skipScene(D.G); D.run(1);
    ok('ouverture ' + m + " : toucher la passe", st === 'intro' && D.G.state === 'play' && !document.getElementById('hud').hidden);
    D.start(m, true); let n = 0;
    while (D.G.state === 'intro' && n < 1200) { D.run(1); n++; }
    ok('ouverture ' + m + ' : se termine seule', D.G.state === 'play', (n / 60).toFixed(1) + ' s');
    D.start(m, false); G = D.G; G.state = 'outro'; G.scene = TM.cine.newScene('outro' + m); n = 0;
    while (G.state === 'outro' && n < 1200) { D.run(1); n++; }
    ok('fin de mission ' + m + ' : se termine seule', G.state === (m === 3 ? 'credits' : 'win'), (n / 60).toFixed(1) + ' s');
  }
  // le Blaireau interrompt l'émission juste avant le boss, puis la partie reprend
  D.start(1, false); G = D.G; G.p.inv = 99999;
  G.t = 60 * 147.9; G.idx = G.script.findIndex(e => e.t >= G.t);
  run(30);
  ok('le Blaireau interrompt avant le boss', G.state === 'taunt' && !document.getElementById('cap').hidden);
  const tFrozen = G.t;
  run(300);
  ok('puis la partie reprend, et le boss arrive', G.state === 'play' && G.t > tFrozen && (G.boss || G.t < 60 * 150 + 5), 'reprise à ' + (tFrozen / 60).toFixed(1) + ' s');
  D.start(3, false); G = D.G; G.state = 'outro'; G.scene = TM.cine.newScene('outro3');
  run(70); TM.skipScene(G); D.run(1);
  ok('la finale mène au générique', G.state === 'credits' && !document.getElementById('credits').hidden);
  run(70); TM.skipScene(G); run(40);
  ok("toucher passe le générique : écran de fin", G.state === 'over' && !document.getElementById('scr-over').hidden && document.getElementById('credits').hidden);
  TM.quiet = false;

  // 8. Chaque mission entière, avec un pilote automatique
  function bot(G) { // vise l'ennemi le plus proche en hauteur et esquive ce qui arrive
    const p = G.p, B = G.boss;
    let tx = 80, best = null;
    for (const f of G.foes) if (!f.asleep && !f.dead && f.y > -5 && f.y < p.y - 16 && (!best || f.y > best.y)) best = f;
    if (B && B.ready && !B.dead) {
      const q = B.parts.find(q => q.hp > 0 && !q.armor) || B.parts.find(q => q.hp > 0);
      tx = B.x + q.dx;
    } else if (best) tx = best.x;
    for (const it of G.items) if (it.y > 40) tx = it.x;
    let bx = 0, by = 0;
    for (const b of G.bullets) {
      const dx = p.x - b.x, dy = p.y - b.y, d2 = dx * dx + dy * dy, r = b.big ? 1600 : 900;
      if (d2 < r) { bx += dx / (d2 + 1) * 60; by += dy / (d2 + 1) * 60; }
    }
    for (const f of G.foes) { // et ne pas foncer dans les oiseaux, les cailloux, ni les méduses qui brillent
      if (f.asleep || f.dead || f.delay > 0 || TM.DEF[f.kind].ground) continue;
      const dx = p.x - f.x, dy = p.y - f.y, d2 = dx * dx + dy * dy;
      const zap = f.charge || f.zapR > 0, R2 = zap ? 4900 : 1600;
      if (d2 < R2 && (dy > -6 || zap)) { bx += dx / (d2 + 1) * (zap ? 400 : 160); by += dy / (d2 + 1) * (zap ? 200 : 80); }
    }
    for (const h of G.hazards) if (Math.abs(h.x - p.x) < 18) tx = h.x < 80 ? h.x + 34 : h.x - 34;
    const c = (v, m) => Math.max(-m, Math.min(m, v));
    let ty = TM.VH - 60;
    if (B && B.ready && !B.dead && TM.BOSSES[B.type].body) ty = Math.max(ty, B.y + 60);
    return { dx: c((tx - p.x) * 0.2 + bx, 2.2), dy: c((ty - p.y) * 0.1 + by, 2.2) };
  }
  for (const m of [1, 2, 3]) {
    D.start(m, false); G = D.G;
    let frames = 0;
    while (G.state !== 'over' && frames < 60 * 300) { G.p.inv = 9999; D.run(1, bot(G)); frames++; }
    ok('mission ' + m + ' : se termine (pilote invulnérable)', G.state === 'over',
      Math.round(frames / 60) + ' s, audimat ' + G.score + ', endormis ' + G.slept + ', détruits ' + G.broke + ', rochers ' + G.rocks + ', bobines ' + G.reels + ', cassette ' + G.gold);
    run(40);
    ok('mission ' + m + ' : écran de fin', !document.getElementById('scr-over').hidden && document.getElementById('btn-next').hidden === (m === 3));
    D.start(m, false); G = D.G; frames = 0;
    let maxB = 0, wob = 0;
    while (G.state !== 'over' && frames < 60 * 600) {
      if (frames % 30 === 0) wob = (Math.random() - 0.5) * 24;
      const inp = G.state === 'play' ? bot(G) : {};
      if (inp.dx !== undefined) inp.dx += wob * 0.05;
      D.run(1, inp); frames++;
      maxB = Math.max(maxB, G.bullets.length);
    }
    ok('mission ' + m + ' : partie réelle du pilote', G.state === 'over', G.prise + ' prises, ' + Math.round(frames / 60) + ' s, au plus ' + maxB + ' parasites à l’écran');
  }
  D.toTitle();
  return out.join('\n');
})();
