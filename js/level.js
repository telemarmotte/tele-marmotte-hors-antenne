// Hors Antenne ! : le déroulé des trois missions (temps en secondes depuis le départ)
//   choucas, aigle, oie, martinet, meduse : des bêtes, on les endort
//   asteroide, caillou : des rochers, ils se cassent
//   mouche, avion, brouilleur, bombardier, satellite, parabole, montgolfiere : les machines de Télé-Parasite, elles explosent
//   group + drop : l'objet tombe quand tout le groupe est endormi ou détruit
//   cap : sous-titre · bolt : éclair annoncé · clap : point de reprise · warn, boss : le boss
window.TM = window.TM || {};
(function (TM) {
  let L = [];
  let gid = 0;
  const sec = s => Math.round(s * 60);
  function one(s, kind, o) { L.push(Object.assign({ t: sec(s), kind: kind }, o || {})); }
  function line(s, kind, n, gap, o, drop) { // n ennemis l'un après l'autre
    const group = 'g' + (++gid);
    for (let i = 0; i < n; i++) one(s + i * gap, kind, Object.assign({ group: group, gsize: n, gdrop: drop || null }, o));
  }
  function vee(s, n, o, drop) { // un vol en V (choucas, ou oies : plus larges)
    const group = 'g' + (++gid), mid = (n - 1) / 2, kind = o.kind || 'choucas', gap = kind === 'oie' ? 14 : 11;
    for (let i = 0; i < n; i++) {
      one(s, kind, Object.assign({
        x: o.x + (i - mid) * gap, y: -12 - Math.abs(i - mid) * 9, pat: 'down', sp: o.sp,
        group: group, gsize: n, gdrop: drop || null
      }));
    }
  }
  const geese = (s, n, x, drop, sp) => vee(s, n, { kind: 'oie', x: x, sp: sp || 0.75 }, drop);
  const swoopL = (s, kind, n, gap, o, drop) => line(s, kind, n, gap, Object.assign({ x: -10, y: 30, pat: 'swoop', dir: 1 }, o), drop);
  const swoopR = (s, kind, n, gap, o, drop) => line(s, kind, n, gap, Object.assign({ x: 170, y: 30, pat: 'swoop', dir: -1 }, o), drop);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; // le même hasard à chaque partie
  function asteroids(s0, s1, every) { // une ceinture d'astéroïdes
    for (let s = s0; s < s1; s += every) one(s, 'asteroide', { x: 18 + rnd() * 124, sp: 0.7 + rnd() * 0.4, vx: (rnd() - 0.5) * 0.4 });
  }
  function meteors(s0, s1, n, side) { // une pluie de météores en diagonale, chacun annoncé par un repère
    for (let i = 0; i < n; i++) {
      const from = side || (i % 2 ? 1 : -1); // 1 : ils arrivent de la droite
      one(s0 + (s1 - s0) * i / n, 'meteore', {
        x: from > 0 ? 50 + rnd() * 110 : rnd() * 110, y: -8,
        vx: -from * (0.8 + rnd() * 0.6), sp: 1.9 + rnd() * 0.6, warn: true,
        aimed: i % 3 === 1 // un sur trois vise la marmotte
      });
    }
  }
  function finish(m, meta) {
    L.sort((a, b) => a.t - b.t);
    TM.MISSIONS[m] = Object.assign({ script: L }, meta);
    L = [];
  }
  TM.MISSIONS = {};

  // ---------- L'alpage ----------
  one(0.5, 'help', { key: 'move' });
  line(3, 'choucas', 4, 0.45, { x: 52, pat: 'down', sp: 0.95 });
  line(5, 'choucas', 4, 0.45, { x: 108, pat: 'down', sp: 0.95 });
  line(8, 'choucas', 5, 0.4, { x: 80, pat: 'sine', sp: 0.85, amp: 36, freq: 0.035 }, 'bobine');
  line(12, 'mouche', 5, 0.35, { x: -10, y: 30, pat: 'swoop', dir: 1, sp: 1.5 });
  line(14.5, 'mouche', 5, 0.35, { x: 170, y: 30, pat: 'swoop', dir: -1, sp: 1.5 });
  vee(17.5, 7, { x: 80, sp: 0.8 });
  one(19.5, 'help', { key: 'sleep' });
  line(21, 'mouche', 3, 0.5, { x: 36, pat: 'down', sp: 1.1, shoot: 'aim' });
  line(21.5, 'mouche', 3, 0.5, { x: 124, pat: 'down', sp: 1.1, shoot: 'aim' });
  one(24, 'parabole', { x: 34 });
  one(26, 'parabole', { x: 126 });
  one(28, 'clap');

  // ---------- La forêt ----------
  one(29, 'brouilleur', { x: 80, yStop: 48, dur: 260, drop: 'bobine' });
  line(31, 'choucas', 4, 0.4, { x: 30, pat: 'sine', sp: 0.9, amp: 18, freq: 0.05 });
  line(33, 'choucas', 4, 0.4, { x: 130, pat: 'sine', sp: 0.9, amp: 18, freq: 0.05 });
  one(36.5, 'aigle', { x: 40 });
  one(38.5, 'aigle', { x: 120 });
  line(41, 'mouche', 4, 0.4, { x: -10, y: 50, pat: 'swoop', dir: 1, sp: 1.6, shoot: 'aim' });
  line(41.2, 'mouche', 4, 0.4, { x: 170, y: 20, pat: 'swoop', dir: -1, sp: 1.6 });
  one(45, 'parabole', { x: 40 });
  one(45.6, 'parabole', { x: 120 });
  line(46.5, 'choucas', 5, 0.35, { x: 80, pat: 'down', sp: 1.0 }, 'bobine');
  one(49, 'montgolfiere', { x: 80, yStop: 58, dur: 460, drop: 'sifflet' });
  line(52, 'mouche', 4, 0.35, { x: -10, y: 70, pat: 'swoop', dir: 1, sp: 1.5 });
  line(55, 'mouche', 4, 0.35, { x: 170, y: 70, pat: 'swoop', dir: -1, sp: 1.5 });
  one(58, 'clap');

  // ---------- Le lac ----------
  line(59, 'choucas', 6, 0.3, { x: 50, pat: 'sine', sp: 0.9, amp: 26, freq: 0.04 });
  line(59, 'choucas', 6, 0.3, { x: 110, pat: 'sine', sp: 0.9, amp: 26, freq: 0.04, ph: Math.PI });
  one(62, 'brouilleur', { x: 46, yStop: 40, dur: 220 });
  one(63.5, 'brouilleur', { x: 114, yStop: 58, dur: 220, drop: 'bobine' });
  one(68, 'aigle', { x: 30 });
  one(68.8, 'aigle', { x: 80 });
  one(69.6, 'aigle', { x: 130 });
  line(72, 'mouche', 3, 0.4, { x: 26, pat: 'down', sp: 1.2, shoot: 'aim' });
  line(72.3, 'mouche', 3, 0.4, { x: 60, pat: 'down', sp: 1.2 });
  line(72.6, 'mouche', 3, 0.4, { x: 100, pat: 'down', sp: 1.2 });
  line(72.9, 'mouche', 3, 0.4, { x: 134, pat: 'down', sp: 1.2, shoot: 'aim' });

  // ---------- Les rochers ----------
  one(76, 'parabole', { x: 26 });
  one(77, 'parabole', { x: 134 });
  one(78.5, 'parabole', { x: 80 });
  one(81, 'clap');
  one(81.5, 'help', { key: 'bomb' });
  // le moment du grand sifflet
  line(83, 'mouche', 7, 0.25, { x: -10, y: 30, pat: 'swoop', dir: 1, sp: 1.6, shoot: 'aim' });
  line(83, 'mouche', 7, 0.25, { x: 170, y: 30, pat: 'swoop', dir: -1, sp: 1.6, shoot: 'aim' });
  one(84, 'brouilleur', { x: 80, yStop: 44, dur: 240, fan: 7 });
  line(85, 'choucas', 6, 0.3, { x: 40, pat: 'down', sp: 1.1 });
  line(85, 'choucas', 6, 0.3, { x: 120, pat: 'down', sp: 1.1 });
  vee(91, 9, { x: 80, sp: 0.75 }, 'gold'); // le secret : tout le vol endormi
  one(95, 'aigle', { x: 50 });
  one(96, 'aigle', { x: 110 });
  one(98, 'montgolfiere', { x: 48, yStop: 64, dur: 420, drop: 'bobine' });
  one(99, 'parabole', { x: 132 });
  line(103, 'mouche', 6, 0.3, { x: 80, pat: 'sine', sp: 1.0, amp: 50, freq: 0.03, shoot: 'aim' }, 'sifflet');
  one(108, 'clap');

  // ---------- Le glacier ----------
  one(109, 'brouilleur', { x: 40, yStop: 44, dur: 250 });
  one(110, 'brouilleur', { x: 120, yStop: 60, dur: 250, drop: 'bobine' });
  line(114, 'choucas', 5, 0.35, { x: 30, pat: 'down', sp: 1.1 });
  line(114.6, 'choucas', 5, 0.35, { x: 80, pat: 'down', sp: 1.1 });
  line(115.2, 'choucas', 5, 0.35, { x: 130, pat: 'down', sp: 1.1 });
  one(118, 'aigle', { x: 30 });
  one(118.6, 'aigle', { x: 130 });
  one(119.2, 'aigle', { x: 80 });
  line(122, 'mouche', 5, 0.3, { x: -10, y: 40, pat: 'swoop', dir: 1, sp: 1.7, shoot: 'aim' });
  line(123, 'mouche', 5, 0.3, { x: 170, y: 40, pat: 'swoop', dir: -1, sp: 1.7, shoot: 'aim' });
  one(126, 'parabole', { x: 30 });
  one(126, 'parabole', { x: 130 });
  one(127, 'brouilleur', { x: 80, yStop: 50, dur: 260, fan: 7 });
  line(133, 'choucas', 6, 0.3, { x: 80, pat: 'sine', sp: 1.0, amp: 50, freq: 0.03 }, 'bobine');
  one(137, 'montgolfiere', { x: 80, yStop: 56, dur: 400 });
  line(139, 'mouche', 4, 0.35, { x: -10, y: 90, pat: 'swoop', dir: 1, sp: 1.5 });
  line(141, 'mouche', 4, 0.35, { x: 170, y: 90, pat: 'swoop', dir: -1, sp: 1.5 });
  one(147, 'clap');

  // ---------- La crête : le relais pirate ----------
  one(148, 'warn');
  one(150, 'boss');
  finish(1, { name: 'Le Col', music: 1, boss: 'relais', goal: 'Fais taire le relais pirate.', time: '20:30',
    goldHint: 'endors tout un vol de choucas' });

  // =====================================================================
  // Mission 2 : Au-dessus des nuages
  // =====================================================================
  one(0.3, 'cap', { text: 'Le relais est tombé, mais l’image saute encore.' });
  one(3.6, 'cap', { text: 'Télé-Parasite émet depuis un zeppelin, au-dessus des nuages !' });
  one(7, 'cap', { text: null });
  one(7.2, 'help', { key: 'sky' });
  // ---------- La mer de nuages ----------
  geese(6, 5, 60);
  geese(8.5, 5, 110);
  line(11, 'avion', 4, 0.5, { x: 40, sp: 1.4 });
  line(11.25, 'avion', 4, 0.5, { x: 120, sp: 1.4 }, 'bobine');
  swoopL(15, 'martinet', 5, 0.25, { y: 20, sp: 2.2 });
  swoopR(17, 'martinet', 5, 0.25, { y: 20, sp: 2.2 });
  swoopL(20, 'avion', 5, 0.35, { y: 40, sp: 1.6, shoot: 'aim' });
  swoopR(22, 'avion', 5, 0.35, { y: 40, sp: 1.6, shoot: 'aim' });
  one(25, 'bombardier', { x: 80, yStop: 46, dur: 300, drop: 'bobine' });
  geese(27, 7, 40);
  swoopL(30, 'martinet', 6, 0.2, { y: 60, sp: 2.3 });
  one(33, 'clap');
  one(34, 'montgolfiere', { x: 40, yStop: 60, dur: 400 });
  one(35, 'montgolfiere', { x: 120, yStop: 72, dur: 400, drop: 'sifflet' });
  line(37, 'avion', 3, 0.5, { x: 80, sp: 1.5, shoot: 'aim' });
  swoopL(40, 'martinet', 5, 0.25, { sp: 2.2 });
  swoopR(41, 'martinet', 5, 0.25, { sp: 2.2 });
  // ---------- L'orage ----------
  one(44, 'help', { key: 'storm' });
  one(46, 'bolt', { x: 50 });
  one(47.5, 'bolt', { x: 110 });
  one(49, 'bolt', { x: 80 });
  line(48, 'avion', 4, 0.4, { x: 30, sp: 1.5, shoot: 'aim' });
  line(48.5, 'avion', 4, 0.4, { x: 130, sp: 1.5, shoot: 'aim' });
  one(52, 'brouilleur', { x: 80, yStop: 50, dur: 260, drop: 'bobine' });
  one(53, 'bolt', { x: 30 });
  one(53, 'bolt', { x: 130 });
  geese(56, 5, 50);
  geese(57, 5, 110);
  one(58.5, 'bolt', { x: 80 });
  one(60, 'bombardier', { x: 46, yStop: 40, dur: 260 });
  one(61, 'bombardier', { x: 114, yStop: 64, dur: 260, drop: 'bobine' });
  one(63, 'bolt', { x: 20 });
  one(64, 'bolt', { x: 140 });
  one(66, 'clap');
  swoopL(67, 'martinet', 8, 0.18, { sp: 2.4 });
  swoopR(68.5, 'martinet', 8, 0.18, { sp: 2.4 });
  one(70, 'bolt', { x: 40 });
  one(70.6, 'bolt', { x: 80 });
  one(71.2, 'bolt', { x: 120 });
  line(72.5, 'avion', 6, 0.3, { x: 80, pat: 'sine', sp: 1.2, amp: 50, freq: 0.03, shoot: 'aim' }, 'sifflet');
  one(76, 'montgolfiere', { x: 80, yStop: 58, dur: 360 });
  one(78, 'bolt', { x: 30 });
  one(79, 'bolt', { x: 130 });
  geese(81, 9, 80, 'gold', 0.65); // le secret : tout le vol endormi
  one(85, 'brouilleur', { x: 40, yStop: 44, dur: 220 });
  one(86, 'brouilleur', { x: 120, yStop: 60, dur: 220 });
  one(88, 'bolt', { x: 80 });
  one(89, 'bolt', { x: 50 });
  one(90, 'bolt', { x: 110 });
  one(93, 'clap');
  // ---------- Le coucher de soleil ----------
  swoopL(95, 'avion', 5, 0.3, { sp: 1.6, shoot: 'aim' });
  swoopR(96, 'avion', 5, 0.3, { sp: 1.6, shoot: 'aim' });
  one(99, 'bombardier', { x: 80, yStop: 50, dur: 300, drop: 'bobine' });
  geese(101, 7, 40);
  geese(103, 7, 120);
  swoopL(106, 'martinet', 6, 0.2, { sp: 2.3 });
  swoopR(107, 'martinet', 6, 0.2, { sp: 2.3 });
  swoopL(110, 'mouche', 6, 0.3, { sp: 1.6, shoot: 'aim' });
  swoopR(110.5, 'mouche', 6, 0.3, { sp: 1.6, shoot: 'aim' });
  one(114, 'montgolfiere', { x: 50, yStop: 60, dur: 380 });
  one(115, 'bombardier', { x: 120, yStop: 50, dur: 260 });
  line(120, 'avion', 4, 0.4, { x: 30, sp: 1.5, shoot: 'aim' });
  line(120.4, 'avion', 4, 0.4, { x: 130, sp: 1.5, shoot: 'aim' }, 'bobine');
  one(124, 'clap');
  geese(126, 5, 80);
  one(129, 'brouilleur', { x: 80, yStop: 48, dur: 240, fan: 7 });
  swoopL(132, 'martinet', 8, 0.2, { sp: 2.4 });
  swoopR(133, 'martinet', 8, 0.2, { sp: 2.4 });
  line(136, 'avion', 6, 0.3, { x: 80, pat: 'sine', sp: 1.3, amp: 55, freq: 0.035, shoot: 'aim' });
  one(141, 'clap');
  one(142, 'warn');
  one(144, 'boss');
  finish(2, { name: 'Au-dessus des nuages', music: 3, boss: 'zeppelin', goal: 'Abats le zeppelin pirate.', time: '21:15',
    goldHint: 'endors tout un grand vol d’oies' });

  // =====================================================================
  // Mission 3 : En orbite
  // =====================================================================
  one(0.3, 'cap', { text: 'Dernier émetteur pirate : il est sur la Lune !' });
  one(3.6, 'cap', { text: 'Et devine qui conduit, là-haut…' });
  one(7, 'cap', { text: null });
  one(7.2, 'help', { key: 'space' });
  // ---------- En quittant la Terre ----------
  swoopL(6, 'mouche', 5, 0.3, { sp: 1.5, shoot: 'aim' });
  swoopR(8, 'mouche', 5, 0.3, { sp: 1.5, shoot: 'aim' });
  one(11, 'satellite', { x: 40, yStop: 50, dur: 300 });
  one(12, 'satellite', { x: 120, yStop: 72, dur: 300, drop: 'bobine' });
  line(16, 'mouche', 4, 0.4, { x: 80, sp: 1.2, shoot: 'aim' });
  one(19, 'asteroide', { x: 30, sp: 0.7, vx: 0.1 });
  one(20, 'asteroide', { x: 92, sp: 0.6, vx: -0.1 });
  one(21.5, 'asteroide', { x: 130, sp: 0.65, vx: -0.05 });
  one(23.5, 'help', { key: 'jelly' });
  line(24, 'meduse', 4, 0.6, { x: 50, sp: 0.55, amp: 20, freq: 0.03 });
  line(24.3, 'meduse', 4, 0.6, { x: 110, sp: 0.55, amp: 20, freq: 0.03, ph: Math.PI }, 'bobine');
  one(29, 'brouilleur', { x: 80, yStop: 46, dur: 260 });
  one(33, 'clap');
  // ---------- La ceinture d'astéroïdes ----------
  asteroids(35, 55, 1.35);
  one(40, 'satellite', { x: 80, yStop: 56, dur: 300, drop: 'bobine' });
  one(44, 'brouilleur', { x: 80, yStop: 40, dur: 200 });
  one(47, 'satellite', { x: 40, yStop: 44, dur: 260 });
  one(47.5, 'satellite', { x: 120, yStop: 66, dur: 260, fan: 6 });
  swoopL(52, 'mouche', 6, 0.25, { sp: 1.6, shoot: 'aim' });
  swoopR(52.5, 'mouche', 6, 0.25, { sp: 1.6, shoot: 'aim' });
  one(55.5, 'help', { key: 'shower' });
  meteors(57, 64.5, 22, 1); // la première pluie arrive de la droite
  one(66, 'clap');
  // ---------- Le banc de méduses ----------
  line(67, 'meduse', 3, 0.6, { x: 40, sp: 0.6, amp: 24, freq: 0.03 });
  line(68, 'meduse', 3, 0.6, { x: 120, sp: 0.6, amp: 24, freq: 0.03, ph: Math.PI });
  one(70, 'satellite', { x: 80, yStop: 54, dur: 320, drop: 'bobine' });
  line(75, 'meduse', 6, 0.6, { x: 80, sp: 0.5, amp: 50, freq: 0.02 }, 'gold'); // le secret : tout le banc endormi
  asteroids(80, 86, 2.2);
  one(85, 'brouilleur', { x: 80, yStop: 50, dur: 240 });
  line(90, 'mouche', 6, 0.3, { x: 80, pat: 'sine', sp: 1.1, amp: 50, freq: 0.03, shoot: 'aim' }, 'sifflet');
  one(95, 'clap');
  // ---------- Vers la Lune ----------
  one(97, 'satellite', { x: 40, yStop: 46, dur: 280 });
  one(98, 'satellite', { x: 120, yStop: 66, dur: 280, drop: 'bobine' });
  one(101, 'reine', { x: 80, yStop: 70, dur: 840, drop: 'sifflet' }); // la reine des méduses et ses bébés
  one(117, 'clap');
  meteors(118, 126, 26, 0); // la seconde pluie arrive des deux côtés
  one(127, 'satellite', { x: 30, yStop: 50, dur: 220, fan: 6 });
  one(127.6, 'satellite', { x: 80, yStop: 70, dur: 220, fan: 6 });
  one(128.2, 'satellite', { x: 130, yStop: 50, dur: 220, fan: 6, drop: 'bobine' });
  asteroids(130, 136, 0.9);
  swoopL(136.5, 'mouche', 8, 0.2, { sp: 1.7, shoot: 'aim' });
  swoopR(137.2, 'mouche', 8, 0.2, { sp: 1.7, shoot: 'aim' });
  one(141, 'clap');
  one(142, 'warn');
  one(144, 'boss');
  finish(3, { name: 'En orbite', music: 4, boss: 'dameuse', goal: 'Coupe l’émetteur de la Lune.', time: '22:00',
    goldHint: 'endors tout un banc de méduses' });
})(window.TM);
