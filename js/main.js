// Hors Antenne ! : boucle, commandes au doigt, écrans et records
window.TM = window.TM || {};
(function (TM) {
  const $ = id => document.getElementById(id);
  const cv = $('cv'), g = cv.getContext('2d');

  // ---------- Records (facultatifs : le jeu marche sans) ----------
  const SAVE_KEY = 'tele-marmotte-hors-antenne-v1';
  const save = { best: {}, prises: {}, gold: {}, sfx: true, music: true };
  try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY)) || {}); } catch (e) { /* stockage indisponible */ }
  if (save.best1) { save.best[1] = save.best1; save.prises[1] = save.prises1; save.gold[1] = save.gold1; delete save.best1; delete save.prises1; delete save.gold1; }
  function store() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* tant pis */ } }
  TM.audio.setSfx(save.sfx);
  TM.audio.setMusic(save.music);

  const coarse = matchMedia('(any-pointer: coarse)').matches;
  const SENS = coarse ? 1.3 : 1; // le vaisseau suit le glissement du doigt, un peu plus vite que lui

  // ---------- Commandes ----------
  const keys = { left: false, right: false, up: false, down: false };
  const acc = { x: 0, y: 0 };
  let bombEdge = false, fingerId = null, last = null;
  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowDown: 'down', KeyS: 'down', ArrowUp: 'up', KeyW: 'up', KeyZ: 'up'
  };
  addEventListener('keydown', e => {
    TM.audio.unlock();
    if (screen === 'play' && G && TM.inScene(G) && !e.repeat) { skip(); e.preventDefault(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { togglePause(); e.preventDefault(); return; }
    if (e.code === 'Enter' && screen === 'title') { start(1, true); return; }
    if (e.code === 'Space' || e.code === 'KeyX' || e.code === 'KeyB') { e.preventDefault(); if (!e.repeat) bombEdge = true; return; }
    const k = KEYMAP[e.code];
    if (k) { keys[k] = true; e.preventDefault(); }
  });
  addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; fingerId = null; });

  const stage = $('screen');
  function toGame(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * TM.VW, y: (e.clientY - r.top) / r.height * TM.VH };
  }
  stage.addEventListener('pointerdown', e => {
    TM.audio.unlock();
    if (e.target.closest && e.target.closest('button')) return;
    if (screen !== 'play' || paused) return;
    e.preventDefault();
    if (G && TM.inScene(G)) { skip(); return; }
    if (fingerId !== null) { bombEdge = true; return; } // un deuxième doigt = grand sifflet
    fingerId = e.pointerId;
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* pas grave */ }
    last = toGame(e);
  });
  stage.addEventListener('pointermove', e => {
    if (e.pointerId !== fingerId) return;
    const c = toGame(e);
    acc.x += (c.x - last.x) * SENS; acc.y += (c.y - last.y) * SENS;
    last = c;
  });
  function release(e) { if (e.pointerId === fingerId) fingerId = null; }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
  $('btn-bomb').addEventListener('pointerdown', e => { e.preventDefault(); TM.audio.unlock(); bombEdge = true; });

  // ---------- Écrans ----------
  let screen = 'title', G = null, demo = null, paused = false;
  let popTimer = 0, flashTimer = 0, helpTimer = 0, overDelay = 0;
  function show(name) { ['title', 'pause', 'over'].forEach(s => { $('scr-' + s).hidden = s !== name; }); }
  function hideOverlays() { ['hud', 'pop', 'flash', 'help', 'cap', 'card', 'skip', 'btn-bomb', 'clap', 'bossbar', 'credits'].forEach(id => { $(id).hidden = true; }); }

  function fmtClock(frames) {
    const s = Math.floor(frames / 60);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }
  const nf = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const title = m => 'Mission ' + m + ' · ' + TM.MISSIONS[m].name;
  function syncMenu() {
    for (let m = 1; m <= 3; m++) {
      $('best-' + m).textContent = save.best[m]
        ? 'Record : ' + nf(save.best[m]) + ' téléspectateurs' + (save.gold[m] ? ' · cassette dorée' : '')
        : 'Pas encore diffusée';
    }
    document.querySelectorAll('[data-toggle]').forEach(b => {
      const k = b.dataset.toggle;
      b.textContent = (k === 'sfx' ? 'Bruitages : ' : 'Musique : ') + (save[k] ? 'oui' : 'non');
      b.setAttribute('aria-pressed', save[k] ? 'true' : 'false');
    });
  }
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    TM.audio.unlock();
    const k = b.dataset.toggle;
    save[k] = !save[k];
    if (k === 'sfx') TM.audio.setSfx(save.sfx); else TM.audio.setMusic(save.music);
    store(); syncMenu();
  }));

  let demoM = 0; // la démo du menu montre les trois missions à tour de rôle
  function newDemo() { demoM = demoM % 3 + 1; demo = TM.newGame(demoM, { demo: true }); demo.events.length = 0; }
  function toTitle() {
    screen = 'title'; paused = false; G = null;
    newDemo();
    hideOverlays();
    syncMenu(); show('title');
    TM.cine.stop();
    TM.audio.music(0);
  }
  function start(m, withIntro) {
    TM.audio.unlock();
    TM.cine.stop();
    G = TM.newGame(m, { intro: withIntro });
    screen = 'play'; paused = false; overDelay = 0;
    fingerId = null; bombEdge = false; acc.x = acc.y = 0;
    show(null); hideOverlays();
    $('clap-scene').textContent = title(m);
    TM.audio.music(G.state !== 'intro' ? TM.MISSIONS[m].music : m === 1 ? -1 : 0); // l'ouverture 1 grésille sans musique
    lastHud = {};
  }
  function skip() { if (G) { TM.skipScene(G); flashTimer = 1; } }
  document.querySelectorAll('[data-mission]').forEach(b => b.addEventListener('click', () => start(+b.dataset.mission, true)));

  function togglePause() {
    if (screen !== 'play' || !G || TM.inScene(G) || G.state === 'over') return;
    paused = !paused;
    if (paused) { show('pause'); syncMenu(); TM.audio.engine(0); } else show(null);
  }
  $('btn-pause').addEventListener('click', () => { TM.audio.unlock(); togglePause(); });
  $('btn-resume').addEventListener('click', togglePause);
  $('btn-restart').addEventListener('click', () => start(G.mission, false));
  $('btn-menu').addEventListener('click', toTitle);
  $('btn-again').addEventListener('click', () => start(G.mission, false));
  $('btn-next').addEventListener('click', () => start(G.mission + 1, true)); // avec son ouverture : l'histoire continue
  $('btn-menu2').addEventListener('click', toTitle);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { TM.audio.pause(); if (screen === 'play' && !paused) togglePause(); }
    else TM.audio.resume();
  });

  function pop(text) {
    const el = $('pop');
    el.textContent = text; el.hidden = false;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    popTimer = 80;
  }
  function flash(text) {
    const el = $('flash');
    el.textContent = text; el.hidden = false;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    flashTimer = 120;
  }
  const HELP = {
    move: coarse ? 'Glisse le doigt n’importe où : le vaisseau suit. Il tire tout seul.' : 'Flèches pour piloter. Le vaisseau tire tout seul.',
    sleep: 'Les oiseaux s’endorment. Les machines pirates explosent.',
    bomb: coarse ? 'Bouton ♪ : le grand sifflet endort tout l’écran !' : 'Espace : le grand sifflet endort tout l’écran !'
  };
  Object.assign(HELP, {
    sky: 'Les oies et les martinets s’endorment aussi. Les avions pirates explosent.',
    storm: 'L’orage : quand une ligne jaune clignote, l’éclair va tomber. Écarte-toi !',
    space: 'Les astéroïdes se cassent en deux, et les morceaux foncent sur toi !',
    shower: 'Pluie de météores : trop durs pour tes croches ! Esquive-les, ou grand sifflet.',
    jelly: 'Les méduses de l’espace sont électriques : quand elles brillent, éloigne-toi !'
  });
  function help(key) {
    if (!key) { $('help').hidden = true; helpTimer = 0; return; }
    $('help').textContent = HELP[key] || key; $('help').hidden = false; helpTimer = 300;
  }
  function caption(text) {
    $('cap').hidden = !text;
    $('cap').classList.toggle('top', !!G && (G.state === 'play' || G.state === 'taunt')); // pendant le jeu, en haut : le vaisseau est en bas
    if (text) $('cap-t').textContent = text;
  }
  function clapper(n) {
    const el = $('clap');
    if (!n) { el.hidden = true; return; }
    $('clap-n').textContent = n;
    el.hidden = false;
    const top = el.querySelector('.clap-top');
    top.style.animation = 'none'; void top.offsetWidth; top.style.animation = '';
  }

  function onOver() {
    const m = G.mission, M = TM.MISSIONS[m];
    let record = false;
    if (G.score > (save.best[m] || 0)) { save.best[m] = G.score; record = true; }
    if (!save.prises[m] || G.prise < save.prises[m]) save.prises[m] = G.prise;
    if (G.gold) save.gold[m] = true;
    store();
    $('over-sub').textContent = G.prise === 1 ? 'En une seule prise : du grand direct !' : 'Bouclé en ' + G.prise + ' prises.';
    $('over-record').hidden = !record;
    $('btn-next').hidden = m >= 3;
    $('btn-again').className = m >= 3 ? 'btn' : 'btn ghost';
    $('over-next').textContent = m >= 3
      ? 'Fin de la saison : Télé-Marmotte émet partout, même sur la Lune. Merci d’avoir regardé !'
      : 'À suivre : ' + title(m + 1) + '.';
    if (!G.gold) $('over-next').textContent += ' Indice pour la cassette dorée : ' + M.goldHint + '.';
    const rows = [['Audimat', nf(G.score)], ['Prises', String(G.prise)], ['Bêtes endormies', String(G.slept)],
      ['Machines détruites', String(G.broke)]];
    if (G.rocks) rows.push(['Astéroïdes cassés', String(G.rocks)]);
    rows.push(['Bobines', String(G.reels)],
      ['Cassette dorée', G.gold ? 'trouvée !' : 'pas trouvée'], ['Record', nf(save.best[m])]);
    const dl = $('over-stats');
    dl.textContent = '';
    rows.forEach(r => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = r[0]; dd.textContent = r[1];
      dl.appendChild(dt); dl.appendChild(dd);
    });
    hideOverlays();
    show('over');
    TM.audio.music(0);
  }

  let lastHud = {};
  function hud() {
    const p = G.p;
    const v = {
      clock: fmtClock(G.time), big: nf(G.score), small: 'téléspectateurs · prise ' + G.prise,
      bomb: String(p.bombs), boss: (G.boss && G.boss.ready) || G.mid ? Math.round(TM.bossLife(G) * 100) : -1
    };
    if (v.clock !== lastHud.clock) $('h-clock').textContent = v.clock;
    if (v.big !== lastHud.big) $('h-big').textContent = v.big;
    if (v.small !== lastHud.small) $('h-small').textContent = v.small;
    if (v.bomb !== lastHud.bomb) { $('bomb-n').textContent = v.bomb; $('btn-bomb').classList.toggle('empty', p.bombs === 0); }
    if (v.boss !== lastHud.boss && v.boss >= 0) $('boss-fill').style.width = v.boss + '%';
    lastHud = v;
  }

  // Pilote automatique de la démo du menu
  function demoInput(D) {
    const p = D.p, VH = TM.VH;
    let tx = 80 + Math.sin(D.frame * 0.02) * 50, best = null;
    for (const f of D.foes) if (!f.asleep && !f.dead && f.y > 0 && f.y < p.y - 20 && (!best || f.y > best.y)) best = f;
    if (best) tx = best.x;
    for (const b of D.bullets) {
      const dx = p.x - b.x, dy = p.y - b.y;
      if (Math.abs(dx) < 14 && dy > -30 && dy < 10) tx = p.x + (dx >= 0 ? 20 : -20);
    }
    const c = (v, m) => Math.max(-m, Math.min(m, v));
    return { dx: c(tx - p.x, 1.6), dy: c(VH - 50 - p.y, 1) };
  }

  function tick(forced) {
    if (screen === 'title') {
      TM.quiet = true;
      TM.step(demo, demoInput(demo));
      TM.quiet = false;
      demo.events.length = 0;
      if (demo.t > 60 * 45) newDemo();
      return;
    }
    if (paused || !G) return;
    const inp = forced || { dx: acc.x, dy: acc.y, left: keys.left, right: keys.right, up: keys.up, down: keys.down, bomb: bombEdge };
    acc.x = acc.y = 0; bombEdge = false;
    TM.step(G, inp);
    for (const ev of G.events) {
      switch (ev.type) {
        case 'pop': pop(ev.data); break;
        case 'flash': flash(ev.data); break;
        case 'help': help(ev.data); break;
        case 'cap': caption(ev.data); break;
        case 'skip': $('skip').hidden = !ev.data; break;
        case 'card': $('card').hidden = !ev.data; $('card').className = ''; if (ev.data) $('card').textContent = ev.data; break;
        case 'clapper': clapper(ev.data); break;
        case 'bossbar': $('bossbar').hidden = !ev.data; if (ev.data) $('boss-name').textContent = ev.data; break;
        case 'music': TM.audio.music(ev.data); break;
        case 'start':
          caption(null); $('skip').hidden = true; $('card').hidden = true; TM.cine.stop();
          $('hud').hidden = false; $('btn-bomb').hidden = false;
          flash(title(G.mission));
          TM.audio.music(G.M.music); TM.sfx('go');
          break;
        case 'scene': // la scène de fin de mission : on range l'affichage du caméscope
          ['hud', 'btn-bomb', 'bossbar', 'help', 'pop', 'flash'].forEach(id => { $(id).hidden = true; });
          break;
        case 'credits': {
          const el = $('credits');
          el.hidden = !ev.data;
          if (ev.data) { const roll = el.querySelector('.roll'); roll.style.animation = 'none'; void roll.offsetWidth; roll.style.animation = ''; }
          break;
        }
        case 'mire':
          $('hud').hidden = true; $('btn-bomb').hidden = true; $('help').hidden = true; $('flash').hidden = true;
          $('card').textContent = 'Télé-Marmotte'; $('card').className = 'low'; $('card').hidden = false;
          break;
        case 'over': overDelay = 30; break;
      }
    }
    G.events.length = 0;
    if (popTimer > 0 && --popTimer === 0) $('pop').hidden = true;
    if (flashTimer > 0 && --flashTimer === 0) $('flash').hidden = true;
    if (helpTimer > 0 && --helpTimer === 0) $('help').hidden = true;
    if (overDelay > 0 && --overDelay === 0) onOver();
    if (G.state === 'play' || G.state === 'cut' || G.state === 'taunt') hud();
  }

  // ---------- Mise en page : l'écran du jeu suit la forme du téléphone ----------
  function layout() {
    const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const app = $('app'), sc = $('screen');
    let VH, cssW, cssH;
    if (coarse) {
      app.className = 'mode-phone';
      VH = Math.max(200, Math.min(360, Math.round(TM.VW * vh / vw)));
      cssH = vh; cssW = Math.min(vw, Math.round(vh * TM.VW / VH));
      if (vw / vh < TM.VW / VH) { cssW = vw; cssH = Math.round(vw * VH / TM.VW); }
    } else {
      app.className = 'mode-desk';
      VH = 260;
      const room = vh - 96;
      let s = room / VH;
      if (s >= 2) s = Math.floor(s);
      cssH = Math.round(VH * s); cssW = Math.round(TM.VW * s);
    }
    TM.VH = VH;
    if (cv.height !== VH) cv.height = VH;
    cv.width = TM.VW;
    g.imageSmoothingEnabled = false;
    sc.style.width = cssW + 'px'; sc.style.height = cssH + 'px';
  }
  addEventListener('resize', layout);
  addEventListener('orientationchange', () => setTimeout(layout, 120));

  // ---------- Boucle ----------
  let accT = 0, lastT = performance.now();
  const STEP = 1000 / 60;
  function frame(now) {
    requestAnimationFrame(frame);
    accT += Math.min(100, now - lastT);
    lastT = now;
    let n = 0;
    while (accT >= STEP && n < 4) { tick(); accT -= STEP; n++; }
    if (n === 4) accT = 0;
    const world = G || demo;
    if (world) TM.render(g, world);
  }

  TM.debug = {
    get G() { return G; }, get demo() { return demo; }, start: start, keys: keys, save: save, toTitle: toTitle,
    run: function (n, inp) {
      for (let i = 0; i < n; i++) tick(inp);
      TM.render(g, G || demo);
    }
  };
  layout();
  toTitle();
  requestAnimationFrame(frame);
})(window.TM);
