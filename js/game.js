// Hors Antenne ! : règles du jeu (une image = 1/60 s)
window.TM = window.TM || {};
(function (TM) {
  TM.VW = 160; TM.VH = 260;
  const SPEED = 0.5; // défilement du sol, pixels par image
  const HIT_R = 1.6; // rayon du point sensible : la tête de la marmotte, au centre du vaisseau
  const BOSS_Y = 82; // centre d'un boss au sol une fois en place, sous l'affichage du caméscope
  TM.SPEED = SPEED;

  // Boîte de choc (demi-largeur, demi-hauteur), points d'énergie et audimat gagné
  //   animal : on l'endort · rock : il se casse · le reste : une machine de Télé-Parasite
  const DEF = {
    choucas: { hw: 5, hh: 4, hp: 1, animal: true, score: 100, pat: 'down' },
    aigle: { hw: 9, hh: 6, hp: 8, animal: true, score: 500, pat: 'dive' },
    oie: { hw: 6, hh: 5, hp: 2, animal: true, score: 150, pat: 'down' },
    martinet: { hw: 5, hh: 3, hp: 1, animal: true, score: 120, pat: 'swoop' },
    meduse: { hw: 6, hh: 6, hp: 12, animal: true, score: 300, pat: 'sine', zap: [150, 36, 24, 6, 0.7] },
    reine: { hw: 13, hh: 12, hp: 260, animal: true, score: 6000, pat: 'stop', big: true, zap: [170, 40, 24, 12, 1.9] },
    asteroide: { hw: 7, hh: 7, hp: 7, rock: true, score: 150, pat: 'drift' },
    caillou: { hw: 3, hh: 3, hp: 2, rock: true, score: 60, pat: 'drift' },
    meteore: { hw: 4, hh: 4, hp: 1, rock: true, hard: true, score: 100, pat: 'drift' }, // trop dur pour les croches
    mouche: { hw: 5, hh: 5, hp: 2, score: 150, pat: 'down' },
    avion: { hw: 6, hh: 6, hp: 4, score: 250, pat: 'down' },
    brouilleur: { hw: 8, hh: 7, hp: 24, score: 1000, pat: 'stop', big: true },
    bombardier: { hw: 11, hh: 8, hp: 34, score: 1500, pat: 'stop', big: true },
    satellite: { hw: 10, hh: 6, hp: 12, score: 700, pat: 'stop' },
    parabole: { hw: 7, hh: 7, hp: 6, score: 300, pat: 'ground', ground: true },
    montgolfiere: { hw: 10, hh: 13, hp: 60, score: 2000, pat: 'stop', big: true }
  };
  TM.DEF = DEF;

  function sfx(n) { if (TM.sfx) TM.sfx(n); }
  function emit(G, type, data) { G.events.push({ type: type, data: data }); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rng(seed) { // mulberry32 : la même mission à chaque partie
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function snapshot(G, idx) {
    return { t: G.t, idx: idx, score: G.score, slept: G.slept, broke: G.broke, rocks: G.rocks, reels: G.reels };
  }

  TM.newGame = function (mission, opts) {
    opts = opts || {};
    TM.terrain.setMission(mission);
    const G = {
      mission: mission, M: TM.MISSIONS[mission], script: TM.MISSIONS[mission].script, demo: !!opts.demo,
      state: 'intro', frame: 0, t: 0, idx: 0, S: 0, scrollV: SPEED, stopT: Infinity, rnd: rng(mission),
      p: { x: 80, y: TM.VH + 24, power: 1, bombs: 3, inv: 0, fire: 0, tilt: 0, enter: 70 },
      shots: [], foes: [], bullets: [], items: [], parts: [], blocks: [], zs: [], rings: [], hazards: [], groups: {},
      boss: null, mire: false,
      score: 0, slept: 0, broke: 0, rocks: 0, reels: 0, gold: false, prise: 1, time: 0,
      ck: null, cutT: 0, winT: 0, creditT: 0, bombT: 0, shake: 0, flashT: 0, hitSfx: 0, fireN: 0, events: [],
      hadIntro: !!opts.intro, taunt: null,
      scene: opts.intro && TM.cine.has('intro' + mission) ? TM.cine.newScene('intro' + mission) : null
    };
    G.ck = snapshot(G, 0);
    if (!G.scene) startPlay(G);
    return G;
  };

  function startPlay(G) {
    G.state = 'play'; G.scene = null;
    G.p.y = TM.VH + 24; G.p.enter = 70;
    emit(G, 'start');
  }

  // ---------- Le déroulé de la mission ----------
  function runScript(G) {
    const L = G.script;
    while (G.idx < L.length && L[G.idx].t <= G.t) {
      const e = L[G.idx++];
      switch (e.kind) {
        case 'clap':
          if (G.demo) break;
          G.ck = snapshot(G, G.idx);
          sfx('clap'); emit(G, 'pop', 'Clap ! Point de reprise');
          break;
        case 'help': emit(G, 'help', e.key); break;
        case 'cap': if (!G.hadIntro) emit(G, 'cap', e.text); break; // l'ouverture a déjà tout raconté
        case 'bolt': hazard(G, e.x, 0, 60, 16, 9, 'bolt'); sfx('rumble'); break;
        case 'warn': // le Blaireau interrompt l'émission, puis l'alerte
          if (G.demo) warn(G);
          else { G.state = 'taunt'; G.taunt = TM.cine.newTaunt(G.mission); emit(G, 'help', null); }
          return;
        case 'boss': spawnBoss(G); break;
        default: spawn(G, e);
      }
    }
  }

  function warn(G) {
    emit(G, 'flash', 'Attention : ' + TM.BOSSES[G.M.boss].name + ' !');
    sfx('warn'); emit(G, 'music', 2);
  }
  function endTaunt(G) {
    G.taunt = null; G.state = 'play';
    TM.cine.stop();
    emit(G, 'cap', null); emit(G, 'skip', false);
    warn(G);
  }

  function spawn(G, e) {
    const d = DEF[e.kind];
    const f = {
      kind: e.kind, x: e.x, y: e.y !== undefined ? e.y : -14, x0: e.x, t: 0, hp: d.hp, hitT: 0,
      pat: e.pat || d.pat, sp: e.sp || 1, amp: e.amp || 0, freq: e.freq || 0, ph: e.ph || 0, dir: e.dir || 1, a: 0.15,
      yStop: e.yStop || 50, dur: e.dur || 240, fan: e.fan || 5, phase: 0, st: 0, aim: Math.PI / 2, rot: Math.floor(G.rnd() * 4),
      shoot: e.shoot || null, shotT: 50 + Math.floor(G.rnd() * 40),
      drop: e.drop || null, group: e.group || null, asleep: false, dead: false, wreck: false, sleepT: 0, vx: e.vx || 0, vy: 0,
      delay: e.warn ? 36 : 0, aimed: !!e.aimed,                // un repère prévient avant l'arrivée (météores)
      zc: d.zap ? Math.floor(G.rnd() * d.zap[0]) : 0, zapR: 0, charge: false // décharges des méduses
    };
    if (e.hp) f.hp = e.hp;
    if (e.kind === 'reine') { // un « petit boss », avec sa barre de vie
      f.zc = 0; f.max = f.hp; G.mid = f;
      emit(G, 'pop', 'La reine des méduses !'); emit(G, 'bossbar', 'REINE DES MÉDUSES'); sfx('warn');
    }
    if (f.group && !G.groups[f.group]) G.groups[f.group] = { left: e.gsize, esc: 0, drop: e.gdrop };
    G.foes.push(f);
    return f;
  }

  // ---------- Le vaisseau ----------
  function fire(G) {
    const p = G.p, P = p.power, x = p.x, y = p.y - 9;
    const add = (dx, ang) => G.shots.push({ x: x + dx, y: y, vx: Math.sin(ang) * 5, vy: -Math.cos(ang) * 5, d: 1 });
    G.fireN++;
    if (P === 1) add(0, 0);
    else if (P === 2) { add(-3, 0); add(3, 0); }
    else if (P === 3) { add(0, 0); add(-3, -0.2); add(3, 0.2); }
    else {
      add(-3, 0); add(3, 0); add(-5, -0.22); add(5, 0.22);
      if (G.fireN % 2) { add(-7, -0.45); add(7, 0.45); }
    }
    if (G.fireN % 2 === 0) sfx('shot');
  }

  function updatePlayer(G, inp) {
    const p = G.p, VH = TM.VH;
    if (p.inv > 0) p.inv--;
    let dx = 0;
    if (p.enter > 0) { // le vaisseau arrive par le bas
      p.enter--;
      p.y += ((VH - 44) - p.y) * 0.09;
    } else {
      dx = inp.dx || 0;
      let dy = inp.dy || 0;
      const K = 1.9;
      if (inp.left) dx -= K;
      if (inp.right) dx += K;
      if (inp.up) dy -= K;
      if (inp.down) dy += K;
      p.x = clamp(p.x + dx, 7, TM.VW - 7);
      p.y = clamp(p.y + dy, 14, VH - 10);
    }
    p.tilt += ((dx < -0.3 ? -1 : dx > 0.3 ? 1 : 0) - p.tilt) * 0.35;
    if (--p.fire <= 0) { p.fire = 6; fire(G); }
    if (inp.bomb) bomb(G);
  }

  // Le grand sifflet : une onde qui endort les bêtes, abîme le reste et efface les tirs
  function bomb(G) {
    const p = G.p;
    if (p.bombs <= 0 || G.bombT > 0 || p.enter > 0) return;
    p.bombs--; G.bombT = 50; p.inv = Math.max(p.inv, 100); G.flashT = 8;
    G.rings.push({ x: p.x, y: p.y, r: 4, hit: [], bossHit: false });
    clearBullets(G);
    G.hazards = [];
    sfx('bomb');
  }
  function clearBullets(G) {
    for (const b of G.bullets) sparkle(G, b.x, b.y);
    G.score += G.bullets.length * 10;
    G.bullets = [];
  }
  function updateRings(G) {
    for (const R of G.rings) {
      R.r += 4.5;
      for (const f of G.foes) {
        if (f.asleep || f.dead || f.delay > 0 || R.hit.indexOf(f) >= 0) continue;
        if (Math.hypot(f.x - R.x, f.y - R.y) < R.r) {
          R.hit.push(f);
          const d = DEF[f.kind];
          if (d.animal || d.hard) defeat(G, f); else damage(G, f, 30); // le sifflet pulvérise même les météores
        }
      }
      const B = G.boss;
      if (B && B.ready && !B.dead && !R.bossHit && Math.hypot(B.x - R.x, B.y - R.y) < R.r) { R.bossHit = true; bossDamage(G, 25); }
      G.bullets = G.bullets.filter(b => {
        if (Math.hypot(b.x - R.x, b.y - R.y) < R.r) { sparkle(G, b.x, b.y); return false; }
        return true;
      });
    }
    const reach = Math.hypot(TM.VW, TM.VH) + 30; // l'onde couvre tout l'écran, même un grand téléphone
    G.rings = G.rings.filter(R => R.r < reach);
  }

  // ---------- Les tirs du vaisseau ----------
  function updateShots(G) {
    const out = [];
    for (const s of G.shots) {
      s.x += s.vx; s.y += s.vy;
      if (s.y < -8 || s.x < -6 || s.x > TM.VW + 6) continue;
      if (shotHits(G, s)) continue;
      out.push(s);
    }
    G.shots = out;
  }
  function shotHits(G, s) {
    for (const f of G.foes) {
      if (f.asleep || f.dead || f.delay > 0 || f.y < -6) continue;
      const d = DEF[f.kind];
      if (Math.abs(s.x - f.x) < d.hw + 1 && Math.abs(s.y - f.y) < d.hh + 2) {
        if (d.hard) { // la croche rebondit sur le météore
          sparkle(G, s.x, s.y);
          if (G.hitSfx <= 0) { sfx('tink'); G.hitSfx = 6; }
        } else damage(G, f, s.d);
        return true;
      }
    }
    return !!G.boss && hitBoss(G, s);
  }
  function damage(G, f, n) {
    f.hp -= n; f.hitT = 3;
    if (f.hp <= 0) defeat(G, f);
    else if (G.hitSfx <= 0) { sfx(DEF[f.kind].animal ? 'tap' : DEF[f.kind].rock ? 'tock' : 'hit'); G.hitSfx = 5; }
  }
  function defeat(G, f) {
    const d = DEF[f.kind];
    if (d.animal) {
      f.asleep = true; f.sleepT = 0; f.vx = (f.vx || 0) * 0.3; f.zapR = 0; f.charge = false;
      if (f === G.mid) { G.mid = null; emit(G, 'bossbar', false); emit(G, 'flash', 'La reine des méduses s’endort !'); }
      G.slept++;
      sfx('sleep');
    } else if (d.rock) { // l'astéroïde se casse en deux cailloux, qui foncent vers le vaisseau
      f.dead = true; G.rocks++;
      crumble(G, f.x, f.y, f.kind === 'asteroide' ? 14 : 6);
      sfx('crumble');
      if (f.kind === 'asteroide') {
        const a = Math.atan2(G.p.y - f.y, G.p.x - f.x);
        for (const s of [-1, 1]) {
          const b = a + s * 0.5;
          spawn(G, { kind: 'caillou', x: f.x + s * 4, y: f.y, vx: Math.cos(b) * 1.0, sp: Math.max(0.3, Math.sin(b) * 1.0) });
        }
      }
    } else {
      f.dead = true; G.broke++;
      if (d.ground) f.wreck = true;
      explode(G, f.x, f.y, d.big ? 2 : 1);
      sfx(d.big ? 'boom' : 'pop');
      if (d.big) G.shake = Math.max(G.shake, 6);
    }
    G.score += d.score;
    if (f.drop) drop(G, f.drop, f.x, f.y);
    if (f.group) {
      const gr = G.groups[f.group];
      if (gr && --gr.left <= 0 && gr.esc === 0 && gr.drop) drop(G, gr.drop, f.x, f.y);
    }
  }

  // ---------- Les ennemis ----------
  function move(G, f) {
    const p = G.p;
    switch (f.pat) {
      case 'down': f.y += f.sp; break;
      case 'drift': f.x += f.vx; f.y += f.sp; break;
      case 'sine': f.y += f.sp; f.x = f.x0 + Math.sin(f.t * f.freq + f.ph) * f.amp; break;
      case 'swoop': // arrive d'un côté et s'incurve vers le bas
        if (f.a < 2.3) f.a += 0.013;
        f.vx = f.dir * Math.cos(f.a) * f.sp; f.vy = Math.sin(f.a) * f.sp;
        f.x += f.vx; f.y += f.vy;
        break;
      case 'dive': // l'aigle : descend, plane, puis pique sur le vaisseau
        if (f.phase === 0) {
          f.y += Math.max(0.4, (44 - f.y) * 0.05);
          if (f.y >= 43) { f.phase = 1; f.st = 0; }
        } else if (f.phase === 1) {
          if (++f.st >= 40) {
            const a = Math.atan2(p.y - f.y, p.x - f.x);
            f.vx = Math.cos(a); f.vy = Math.sin(a); f.sp = 0.5; f.phase = 2;
            sfx('cry');
          }
        } else {
          f.sp = Math.min(2.6, f.sp + 0.06);
          f.x += f.vx * f.sp; f.y += f.vy * f.sp;
        }
        break;
      case 'stop': // descend, reste un moment en tirant, puis s'en va
        if (f.phase === 0) {
          f.y += Math.max(0.35, (f.yStop - f.y) * 0.05);
          if (f.y >= f.yStop - 0.5) { f.phase = 1; f.st = 0; }
        } else if (f.phase === 1) {
          f.st++;
          if (f.kind === 'reine') f.x0 += (p.x - f.x0) * 0.008; // la reine suit lentement le vaisseau
          f.x = f.x0 + Math.sin(f.st * 0.02) * (f.kind === 'montgolfiere' || f.kind === 'reine' ? 12 : 7);
          if (f.st >= f.dur) f.phase = 2;
        } else f.y += 0.9;
        break;
      case 'ground': f.y += G.scrollV; break;
    }
  }

  function bullet(G, x, y, vx, vy) { G.bullets.push({ x: x, y: y, vx: vx, vy: vy }); }
  function aim(G, x, y, sp, n, spread) {
    const a = Math.atan2(G.p.y - y, G.p.x - x);
    for (let i = 0; i < n; i++) {
      const b = a + (i - (n - 1) / 2) * spread;
      bullet(G, x, y, Math.cos(b) * sp, Math.sin(b) * sp);
    }
    sfx('fire');
  }
  function ring(G, x, y, sp, n, off) {
    for (let i = 0; i < n; i++) {
      const b = off + i * Math.PI * 2 / n;
      bullet(G, x + Math.cos(b) * 4, y + Math.sin(b) * 4, Math.cos(b) * sp, Math.sin(b) * sp);
    }
    sfx('fire');
  }
  function elec(G, x, y, sp, n, spread) { // des boules électriques, visées sur la marmotte
    const a = Math.atan2(G.p.y - y, G.p.x - x);
    for (let i = 0; i < n; i++) {
      const b = a + (i - (n - 1) / 2) * spread;
      G.bullets.push({ x: x, y: y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp, elec: true });
    }
  }
  function bombe(G, x, y, vx, vy, t) { // une grosse bombe à parasites qui éclate en couronne
    G.bullets.push({ x: x, y: y, vx: vx, vy: vy, big: true, burst: t });
    sfx('drop');
  }

  function shoot(G, f) {
    if (G.p.enter > 0) return; // personne ne tire pendant que le vaisseau entre
    const VH = TM.VH;
    switch (f.kind) {
      case 'mouche': case 'avion':
        if (f.shoot && f.t === f.shotT && f.y > 6 && f.y < VH * 0.62) aim(G, f.x, f.y + 4, f.kind === 'avion' ? 1.4 : 1.3, 1, 0);
        break;
      case 'brouilleur':
        if (f.phase === 1 && f.st % 72 === 30) aim(G, f.x, f.y + 6, 1.15, f.fan, 0.2);
        break;
      case 'bombardier':
        if (f.phase === 1 && f.st % 96 === 40) bombe(G, f.x, f.y + 8, 0, 0.7, 64);
        if (f.phase === 1 && f.st % 96 === 88) aim(G, f.x, f.y + 6, 1.2, 3, 0.25);
        break;
      case 'satellite':
        if (f.phase === 1 && f.st > 20 && f.st % 30 === 0) {
          const n = f.fan === 6 ? 6 : 4; // satellite ordinaire : 4 branches, renforcé : 6
          f.aim += 0.35;
          for (let k = 0; k < n; k++) { const a = f.aim + k * Math.PI * 2 / n; bullet(G, f.x, f.y, Math.cos(a) * 1.0, Math.sin(a) * 1.0); }
          sfx('fire');
        }
        break;
      case 'parabole':
        f.aim = Math.atan2(G.p.y - f.y, G.p.x - f.x);
        if (f.y > 8 && f.y < VH * 0.68 && f.t % 100 === 60 && Math.hypot(G.p.x - f.x, G.p.y - f.y) > 36) aim(G, f.x, f.y, 1.25, 1, 0);
        break;
      case 'montgolfiere':
        if (f.phase === 1 && f.st % 84 === 40) ring(G, f.x, f.y + 6, 0.85, 10, f.st * 0.013);
        break;
      case 'meduse': case 'reine': { // elle brille, puis lâche une décharge en cercle autour d'elle
        const Z = DEF[f.kind].zap, cyc = Z[0], ch = Z[1], zf = Z[2];
        if ((f.kind === 'reine' && f.phase !== 1) || f.y < 4) { f.zapR = 0; f.charge = false; break; }
        f.zc = (f.zc + 1) % cyc;
        f.charge = f.zc >= cyc - zf - ch && f.zc < cyc - zf;
        f.zapR = f.zc >= cyc - zf ? Z[3] + (f.zc - (cyc - zf)) * Z[4] : 0;
        if (f.zc === cyc - zf) {
          sfx('zap');
          if (f.y < G.p.y - 16) { // et une boule électrique vers la marmotte (trois pour la reine)
            if (f.kind === 'reine') elec(G, f.x, f.y + 10, 1.15, 3, 0.32);
            else elec(G, f.x, f.y + 4, 1.05, 1, 0);
          }
        }
        if (f.kind === 'reine' && f.zc === 70) for (const s of [-1, 1]) // la reine lâche deux bébés méduses
          spawn(G, { kind: 'meduse', x: f.x + s * 18, y: f.y + 8, pat: 'sine', sp: 0.65, amp: 14, freq: 0.045, hp: 4 });
        break;
      }
    }
  }

  function updateFoes(G) {
    const VH = TM.VH, out = [];
    for (const f of G.foes) {
      f.t++;
      if (f.hitT > 0) f.hitT--;
      if (f.asleep) { // la bête endormie plane jusqu'au sol (ou aux nuages) et fait la sieste
        f.sleepT++;
        f.y += G.scrollV + Math.max(0, 0.55 - f.sleepT * 0.008);
        f.x += f.vx; f.vx *= 0.95;
        if (f.sleepT % 44 === 1 && f.sleepT < 180) G.zs.push({ x: f.x + 3, y: f.y - 6, t: 0 });
        if (f.y < VH + 20) out.push(f);
        continue;
      }
      if (f.dead) {
        if (f.wreck) { f.y += G.scrollV; if (f.y < VH + 20) out.push(f); }
        continue;
      }
      if (f.delay > 0) { // encore hors champ : seul le repère est visible
        if (--f.delay === 0 && f.aimed) { // ce météore-là vise l'endroit où se trouve la marmotte
          const T = Math.max(20, (G.p.y - f.y) / f.sp);
          f.vx = clamp((G.p.x - f.x) / T, -1.7, 1.7);
        }
        out.push(f); continue;
      }
      move(G, f);
      shoot(G, f);
      if (f.y > VH + 24 || f.y < -70 || f.x < -40 || f.x > TM.VW + 40) {
        if (f.group && G.groups[f.group]) G.groups[f.group].esc++;
        if (f === G.mid) { G.mid = null; emit(G, 'bossbar', false); }
        continue;
      }
      out.push(f);
    }
    G.foes = out;
  }

  function updateBullets(G) {
    const VH = TM.VH, out = [], list = G.bullets;
    G.bullets = []; // les couronnes des bombes qui éclatent arrivent ici
    for (const b of list) {
      b.x += b.vx; b.y += b.vy;
      if (b.burst && --b.burst <= 0) { ring(G, b.x, b.y, 0.9, 8, G.frame * 0.1); continue; }
      if (b.x < -6 || b.x > TM.VW + 6 || b.y < -6 || b.y > VH + 6) continue;
      out.push(b);
    }
    G.bullets = out.concat(G.bullets);
  }

  // ---------- Dangers annoncés : rayon de brouillage, éclairs ----------
  function hazard(G, x, y0, warm, fire, w, kind) {
    G.hazards.push({ x: clamp(x, 10, TM.VW - 10), y0: y0, t: 0, warm: warm, fire: fire, w: w, kind: kind });
  }
  function updateHazards(G) {
    for (const h of G.hazards) {
      h.t++;
      if (h.t === h.warm) {
        sfx(h.kind === 'bolt' ? 'thunder' : 'beam');
        G.shake = Math.max(G.shake, h.kind === 'bolt' ? 6 : 4);
        if (h.kind === 'bolt') G.flashT = Math.max(G.flashT, 4);
      }
    }
    G.hazards = G.hazards.filter(h => h.t < h.warm + h.fire);
  }

  // ---------- Objets à ramasser ----------
  function drop(G, kind, x, y) {
    G.items.push({ kind: kind, x: clamp(x, 10, TM.VW - 10), y: Math.max(y, 8), t: 0 });
    if (kind === 'gold') emit(G, 'pop', 'Une cassette dorée !');
  }
  function updateItems(G) {
    const p = G.p, out = [];
    for (const it of G.items) {
      it.t++;
      it.y += 0.45; it.x += Math.sin(it.t * 0.06) * 0.3;
      if (it.y > TM.VH + 12) continue;
      if (Math.abs(it.x - p.x) < 12 && Math.abs(it.y - p.y) < 13) { pick(G, it); continue; }
      out.push(it);
    }
    G.items = out;
  }
  function pick(G, it) {
    const p = G.p;
    if (it.kind === 'bobine') {
      G.reels++;
      if (p.power < 4) {
        p.power++;
        sfx('power');
        emit(G, 'pop', ['', '', 'Double croche !', 'Triple croche !', 'Grand orchestre !'][p.power]);
      } else { G.score += 500; sfx('reel'); emit(G, 'pop', 'Bobine +500'); }
    } else if (it.kind === 'sifflet') {
      p.bombs = Math.min(5, p.bombs + 1);
      sfx('whistle'); emit(G, 'pop', 'Grand sifflet +1');
    } else {
      G.gold = true; G.score += 5000;
      sfx('gold'); emit(G, 'flash', 'Cassette dorée +5000');
    }
  }

  // ---------- Effets ----------
  const STATIC = ['#ffffff', '#c8c8d0', '#7a7a88', '#2a2a34', '#e8318f'];
  function explode(G, x, y, size) { // une gerbe de « neige » de télé
    const n = size > 1 ? 26 : 12;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = (0.4 + Math.random()) * (size > 1 ? 1.6 : 1.1);
      G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 16 + (Math.random() * 18 | 0),
        c: STATIC[(Math.random() * 5) | 0], sz: Math.random() < 0.4 ? 2 : 1 });
    }
    G.blocks.push({ x: x, y: y, w: size > 1 ? 18 : 10, h: size > 1 ? 13 : 7, life: size > 1 ? 10 : 7 });
  }
  function crumble(G, x, y, n) { // éclats de roche
    const C = ['#b3a796', '#8a7f70', '#5f564b'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = 0.3 + Math.random() * 1.2;
      G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 18 + (Math.random() * 14 | 0), c: C[i % 3], sz: i % 3 ? 1 : 2 });
    }
  }
  function sparkle(G, x, y) { G.parts.push({ x: x, y: y, vx: 0, vy: -0.4, life: 14, c: '#f5c842', sz: 1 }); }
  function updateParts(G) {
    const drift = G.state === 'play' ? G.scrollV * 0.5 : 0;
    for (const q of G.parts) { q.x += q.vx; q.y += q.vy + drift; q.vx *= 0.96; q.vy *= 0.96; q.life--; }
    G.parts = G.parts.filter(q => q.life > 0);
    for (const b of G.blocks) b.life--;
    G.blocks = G.blocks.filter(b => b.life > 0);
    for (const z of G.zs) { z.t++; z.y -= 0.25; z.x += Math.sin(z.t * 0.1) * 0.2; }
    G.zs = G.zs.filter(z => z.t < 50);
    if (G.hitSfx > 0) G.hitSfx--;
  }

  // ---------- Les boss (règles détaillées dans bosses.js) ----------
  function api(G) {
    return {
      bullet: (x, y, vx, vy) => bullet(G, x, y, vx, vy),
      aim: (x, y, sp, n, spread) => aim(G, x, y, sp, n, spread),
      ring: (x, y, sp, n, off) => ring(G, x, y, sp, n, off),
      bombe: (x, y, vx, vy, t) => bombe(G, x, y, vx, vy, t),
      beam: (x, y0) => { hazard(G, x, y0, 55, 45, 10, 'beam'); sfx('charge'); },
      rock: (x, y, vx, vy) => spawn(G, { kind: 'caillou', x: x, y: y, vx: vx, sp: vy }),
      spawn: e => spawn(G, e),
      emit: (type, data) => emit(G, type, data),
      sfx: sfx
    };
  }
  function spawnBoss(G) {
    const T = TM.BOSSES[G.M.boss];
    const B = { type: G.M.boss, x: 80, y: -50, t: 0, ready: false, dead: false, deadT: 0, cyc: 0, spiral: 0, parts: [] };
    T.spawn(B);
    B.max = 0;
    for (const q of B.parts) { q.max = q.hp; q.hitT = 0; B.max += q.hp; }
    G.boss = B; G.bossApi = api(G);
    if (T.ground) G.stopT = G.t + Math.ceil((BOSS_Y + 50) / SPEED); // le sol s'arrête quand le boss est en place
  }
  TM.bossLife = function (G) {
    const B = G.boss;
    if (!B) return G.mid ? Math.max(0, G.mid.hp) / G.mid.max : 0;
    let hp = 0;
    for (const q of B.parts) hp += Math.max(0, q.hp);
    return hp / B.max;
  };
  function updateBoss(G) {
    const B = G.boss, T = TM.BOSSES[B.type];
    B.t++;
    for (const q of B.parts) if (q.hitT > 0) q.hitT--;
    if (!B.ready) {
      if (T.ground) {
        B.y += G.scrollV;
        if (G.t >= G.stopT) B.y = BOSS_Y;
      } else B.y += 0.6;
      if ((T.ground && G.t >= G.stopT) || (!T.ground && B.y >= T.y)) {
        B.ready = true; B.t = 0;
        emit(G, 'bossbar', T.bar); emit(G, 'pop', T.hint);
      }
      return;
    }
    if (B.dead) {
      B.deadT++;
      if (B.deadT % 9 === 0 && B.deadT < 120) {
        explode(G, B.x + (Math.random() - 0.5) * T.w, B.y + (Math.random() - 0.5) * T.h, Math.random() < 0.4 ? 2 : 1);
        sfx('pop'); G.shake = Math.max(G.shake, 5);
      }
      if (B.deadT === 150) {
        if (!G.demo && TM.cine.has('outro' + G.mission)) { // la petite scène de fin de mission
          G.state = 'outro'; G.scene = TM.cine.newScene('outro' + G.mission);
          emit(G, 'scene'); emit(G, 'music', 0);
        } else win(G);
      }
      return;
    }
    T.update(G, B, G.bossApi);
  }
  function hitBoss(G, s) {
    const B = G.boss;
    if (!B.ready || B.dead) return false;
    for (const q of B.parts) {
      if (q.hp <= 0) continue;
      if (Math.abs(s.x - (B.x + q.dx)) < q.hw && Math.abs(s.y - (B.y + q.dy)) < q.hh) {
        if (q.armor) { // encore blindé
          if (G.hitSfx <= 0) { sfx('tink'); G.hitSfx = 6; }
          sparkle(G, s.x, s.y);
        } else partDamage(G, q, s.d);
        return true;
      }
    }
    return false;
  }
  function partDamage(G, q, n) {
    const B = G.boss;
    q.hp -= n; q.hitT = 3;
    if (q.hp > 0) { if (G.hitSfx <= 0) { sfx('hit'); G.hitSfx = 5; } return; }
    q.hp = 0;
    if (q.core) { bossDown(G); return; }
    explode(G, B.x + q.dx, B.y + q.dy, 2);
    sfx('boom'); G.shake = 8; G.score += 2000; G.broke++;
    emit(G, 'pop', q.downText);
  }
  function bossDamage(G, n) { // touché par le grand sifflet
    for (const q of G.boss.parts) if (q.hp > 0 && !q.armor && !G.boss.dead) partDamage(G, q, n);
  }
  function bossDown(G) {
    const B = G.boss;
    B.dead = true; B.deadT = 0;
    clearBullets(G); G.hazards = [];
    for (const f of G.foes) if (!f.asleep && !f.dead) defeat(G, f);
    G.score += 10000; G.broke++;
    sfx('bossdie'); G.shake = 30; G.flashT = 10;
    emit(G, 'bossbar', false); emit(G, 'flash', TM.BOSSES[B.type].down); emit(G, 'music', -1);
  }

  // ---------- Touché : « Coupez ! », puis on reprend au dernier clap ----------
  function collidePlayer(G) {
    const p = G.p;
    if (p.inv > 0 || G.demo || p.enter > 0) return;
    for (const b of G.bullets) {
      const dx = b.x - p.x, dy = b.y - p.y, R = HIT_R + (b.big ? 3 : 1.5);
      if (dx * dx + dy * dy < R * R) { die(G); return; }
    }
    for (const f of G.foes) {
      if (f.asleep || f.dead || f.delay > 0) continue;
      const d = DEF[f.kind];
      if (d.ground) continue;
      if (Math.abs(f.x - p.x) < d.hw - 1 + HIT_R && Math.abs(f.y - p.y) < d.hh - 1 + HIT_R) { die(G); return; }
      if (f.zapR > 0 && Math.hypot(f.x - p.x, f.y - p.y) < f.zapR + HIT_R) { die(G); return; }
    }
    for (const h of G.hazards) {
      if (h.t >= h.warm && Math.abs(p.x - h.x) < h.w / 2 + HIT_R && p.y > h.y0) { die(G); return; }
    }
    const B = G.boss, T = B && TM.BOSSES[B.type];
    if (B && B.ready && !B.dead && T.body && Math.abs(p.x - B.x) < T.body.hw && Math.abs(p.y - B.y) < T.body.hh) die(G);
  }
  function die(G) {
    const p = G.p;
    G.state = 'cut'; G.cutT = 0;
    explode(G, p.x, p.y, 2); G.shake = 14; G.flashT = 6;
    sfx('cut');
    emit(G, 'flash', 'Coupez !');
  }
  function updateCut(G) {
    G.cutT++;
    if (G.cutT === 50) emit(G, 'clapper', G.prise + 1);
    if (G.cutT === 84) sfx('take');
    if (G.cutT === 120) { rewind(G); emit(G, 'clapper', 0); }
  }
  function rewind(G) {
    const c = G.ck, p = G.p;
    G.prise++;
    G.t = c.t; G.idx = c.idx; G.score = c.score; G.slept = c.slept; G.broke = c.broke; G.rocks = c.rocks; G.reels = c.reels;
    G.foes = []; G.bullets = []; G.shots = []; G.items = []; G.rings = []; G.zs = []; G.hazards = []; G.groups = {};
    G.boss = null; G.mid = null; G.stopT = Infinity; G.rnd = rng(1000 * G.mission + c.t);
    G.S = SPEED * G.t; G.scrollV = SPEED;
    p.x = 80; p.y = TM.VH + 24; p.enter = 70; p.inv = 150; p.fire = 0;
    p.power = Math.max(1, p.power - 1); p.bombs = Math.max(p.bombs, 3);
    G.state = 'play';
    emit(G, 'bossbar', false); emit(G, 'music', G.M.music); emit(G, 'cap', null);
    emit(G, 'pop', 'Prise ' + G.prise + ' : moteur !');
  }

  // ---------- Victoire : la scène de fin, puis la mire (ou le générique, à la fin de la saison) ----------
  function finishOutro(G) {
    if (G.mission === 3) { G.state = 'credits'; G.creditT = 0; emit(G, 'credits', true); emit(G, 'music', 0); }
    else win(G);
  }
  function win(G) {
    G.state = 'win'; G.winT = 0; G.mire = true;
    sfx('win');
    emit(G, 'mire');
    emit(G, 'flash', 'Signal rétabli !');
  }
  function updateWin(G) {
    if (++G.winT === 220) over(G); // la mire reste un peu, le temps d'en profiter
  }
  function over(G) {
    G.state = 'over';
    emit(G, 'credits', false);
    emit(G, 'over');
  }

  TM.step = function (G, inp) {
    G.frame++;
    inp = inp || {};
    if (G.shake > 0) G.shake--;
    if (G.flashT > 0) G.flashT--;
    if (G.state === 'intro' || G.state === 'outro') {
      TM.cine.step(G.scene, (type, data) => emit(G, type, data));
      if (G.scene.done) { if (G.state === 'intro') startPlay(G); else finishOutro(G); }
      return;
    }
    if (G.state === 'taunt') {
      TM.cine.stepTaunt(G.taunt, (type, data) => emit(G, type, data));
      if (G.taunt.done) endTaunt(G);
      return;
    }
    if (G.state === 'credits') {
      if (++G.creditT >= 60 * 24) over(G);
      return;
    }
    if (G.state === 'play') {
      G.t++; G.time++;
      G.scrollV = G.t < G.stopT ? SPEED : 0;
      G.S = SPEED * Math.min(G.t, G.stopT);
      runScript(G);
      updatePlayer(G, inp);
      updateShots(G);
      updateFoes(G);
      if (G.boss) updateBoss(G);
      updateHazards(G);
      updateBullets(G);
      updateItems(G);
      updateRings(G);
      if (G.bombT > 0) G.bombT--;
      if (G.state === 'play') collidePlayer(G);
    } else if (G.state === 'cut') updateCut(G);
    else if (G.state === 'win') updateWin(G);
    updateParts(G);
  };

  TM.spawnFoe = spawn; // pour les essais automatiques
  // Toucher l'écran passe la scène en cours (sauf dans sa première seconde : un doigt encore posé au changement ne la saute pas)
  const SKIP_GUARD = 60;
  TM.skipScene = function (G) {
    const t = G.state === 'taunt' ? G.taunt.t : G.state === 'credits' ? G.creditT : G.scene ? G.scene.t : 0;
    if (t < SKIP_GUARD) return;
    const done = () => { TM.cine.stop(); emit(G, 'cap', null); emit(G, 'skip', false); emit(G, 'card', null); };
    if (G.state === 'intro') { G.scene.done = true; done(); startPlay(G); }
    else if (G.state === 'outro') { G.scene.done = true; done(); finishOutro(G); }
    else if (G.state === 'taunt') endTaunt(G);
    else if (G.state === 'credits') over(G);
  };
  TM.skipIntro = TM.skipScene;
  TM.inScene = G => G.state === 'intro' || G.state === 'outro' || G.state === 'taunt' || G.state === 'credits';
})(window.TM);
