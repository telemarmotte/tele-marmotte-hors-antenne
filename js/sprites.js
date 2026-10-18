// Hors Antenne ! : sprites en pixel art (une lettre = une couleur, "." = transparent)
window.TM = window.TM || {};
(function (TM) {
  const PAL = {
    k: '#1b1410', // contour
    d: '#74461f', // brun foncé
    b: '#a8693a', // brun marmotte
    l: '#e8bd86', // ventre
    w: '#fffaf0', // blanc
    n: '#141018', // noir
    r: '#d8332b', // rouge du vaisseau
    R: '#962018', // rouge foncé
    g: '#a3aab4', // gris
    G: '#5c636e', // gris foncé
    s: '#d4dae2', // gris clair
    a: '#8fd3f5', // verre
    A: '#4a8fc0', // verre foncé
    c: '#c8f4ff', // lunettes d'aviatrice
    y: '#f5c842', // or
    Y: '#b8871d', // or foncé
    m: '#e8318f', // magenta de Télé-Parasite
    M: '#8a1a58', // magenta foncé
    q: '#33334a', // choucas
    Q: '#6a6a88', // reflet du choucas
    e: '#4a3222', // aigle foncé
    E: '#7a5435', // aigle
    f: '#d9b26a', // nuque de l'aigle
    u: '#9a8f7c', // oie
    U: '#5e5546', // aile d'oie
    v: '#d4ccbc', // oie claire
    o: '#f08a24', // bec orange
    j: '#3a2e28', // martinet
    J: '#6a5a50', // reflet du martinet
    p: '#f07ab8', // méduse
    P: '#ffc2e2'  // méduse claire
  };
  const RAW = {};

  // --- Le vaisseau vu de dessus (le centre = la tête de la marmotte = le seul point qui compte) ---
  RAW.ship = [
    '........k........',
    '.......kwk.......',
    '.......kwk.......',
    '......kwwwk......',
    '......kwrwk......',
    '.....kwrrrwk.....',
    '.....kAaaaAk.....',
    '....kAdbbbdAk....',
    '....kAbcbcbAk....',
    '....kAbbbbbAk....',
    '...kkrAbbbArkk...',
    '..krrrrkkkrrrrk..',
    '.krrwrrrrrrrwrrk.',
    'krrrwrrrrrrrwrrrk',
    'kwwrrRrrrrrRrrwwk',
    'kkkkkRrrrrrRkkkkk',
    '.....kRRGRRk.....',
    '.....kGk.kGk.....',
    '......k...k......'
  ];

  // --- Le vaisseau de profil, debout sur son aire de lancement (ouverture) ---
  RAW.rocket = [
    '......k......',
    '.....kwk.....',
    '.....kwk.....',
    '....kwwwk....',
    '....kwrwk....',
    '...kwrrrwk...',
    '...krrrrrk...',
    '...krkkkrk...',
    '...kaaaaak...',
    '...kaaaaak...',
    '...kAaaaAk...',
    '...krkkkrk...',
    '...krrrrrk...',
    '...krrwrrk...',
    '...krrwrrk...',
    '..kkrrrrrkk..',
    '.krkrrrrrkrk.',
    'krrkrRrRrkrrk',
    'krrkrRrRrkrrk',
    'kwwkrRrRrkwwk',
    'kkkkkGGGkkkkk',
    '....kGkGk....',
    '....kk.kk....'
  ];
  RAW.rocketFull = RAW.rocket.slice();
  RAW.rocketFull[8] = '...kdbbbdk...';
  RAW.rocketFull[9] = '...kbnbnbk...';
  RAW.rocketFull[10] = '...kbblbbk...';

  // --- La marmotte de profil (celle du premier jeu), pour l'ouverture ---
  const M = [
    '................',
    '.......kk.......',
    '......kdkkkkk...',
    '.....kbbbbbbbbk.',
    '....kbbbbbbbbbbk',
    '....kbbbbbnbbbnk',
    '....kbbbbbbblllk',
    '.....kbbbbbbkwk.',
    '...kbbbbbbbllk..',
    '..kbbbbbbblllk..',
    '..kbbbbbbllllk..',
    '.kdbbbbbbllllk..',
    'kddbbbbbbllllk..',
    'kdkbbbbbblllk...',
    '.k.kbbbkbbbbk...',
    '...kkkk.kkkkk...'
  ];
  function variant(base, rows) {
    const out = base.slice();
    for (const i in rows) out[i] = rows[i];
    return out;
  }
  // lunettes d'aviatrice sur le front
  const MG = variant(M, { 3: '.....kbbbbkkkkk.', 4: '....kbbbbkcckcck' });
  RAW.mStand = MG;
  RAW.mRun1 = variant(MG, { 13: 'kdkbbbbbblllk...', 14: '..kbbk...kbbk...', 15: '.kkk......kkkk..' });
  RAW.mRun2 = variant(MG, { 13: 'kdkbbbbbblllk...', 14: '....kbbbbbbk....', 15: '....kkkkkkkk....' });
  RAW.mJump = variant(MG, { 14: '.k.kbbbbbbbk....', 15: '....kkk.kkk.....' });

  // --- Choucas vus de dessus, tête vers le bas (ils foncent vers le vaisseau) ---
  RAW.chough1 = [
    '....kkk....',
    '...kqqqk...',
    '....kqk....',
    'kkk.kqk.kkk',
    'kQqkkqkkqQk',
    '.kqqqqqqqk.',
    '..kkkqkkk..',
    '....kqk....',
    '....kyk....',
    '.....k.....'
  ];
  RAW.chough2 = [
    '....kkk....',
    '...kqqqk...',
    '....kqk....',
    '....kqk....',
    '..kkqqqkk..',
    '.kQqqqqqQk.',
    'kqkkkqkkkqk',
    'kk..kqk..kk',
    '....kyk....',
    '.....k.....'
  ];
  RAW.chough0 = [ // endormi, ailes repliées
    '...........',
    '....kkk....',
    '...kqqqk...',
    '..kqQqQqk..',
    '..kqqqqqk..',
    '..kqQqQqk..',
    '...kqqqk...',
    '....kqk....',
    '....kyk....',
    '.....k.....'
  ];

  // --- Aigle royal vu de dessus ---
  RAW.eagle1 = [
    '........kkkkk........',
    '.......kEEeEEk.......',
    '........kEEEk........',
    '.kkkk...kEEEk...kkkk.',
    'keEEEkkkkEEEkkkkEEEek',
    'keeEEEEEEEEEEEEEEEeek',
    '.keeEEEEEEEEEEEEEeek.',
    '..kkeeEEEEEEEEEeekk..',
    '....kkkkkEEEkkkkk....',
    '........kfffk........',
    '........kfffk........',
    '.........kyk.........',
    '..........k..........'
  ];
  RAW.eagle2 = variant(RAW.eagle1, {
    3: '...kkk..kEEEk..kkk...',
    4: '..keEEkkkEEEkkkEEek..',
    5: '..keeEEEEEEEEEEEeek..',
    6: '...keeEEEEEEEEEeek...',
    7: '....kkeeEEEEEeekk....'
  });
  RAW.eagle0 = variant(RAW.eagle1, {
    3: '.......kEEEEEk.......',
    4: '......keEEEEEek......',
    5: '......keEEEEEek......',
    6: '......keEEEEEek......',
    7: '.......keEEEek.......',
    8: '........kEEEk........'
  });

  // --- Les machines de Télé-Parasite ---
  RAW.fly1 = [ // petit drone, la « mouche »
    '.kkk...kkk.',
    'kgggk.kgggk',
    'kgGgk.kgGgk',
    '.kkkkkkkkk.',
    '...kMmMk...',
    '..kmmwmmk..',
    '...kMmMk...',
    '.kkkkkkkkk.',
    'kgGgk.kgGgk',
    'kgggk.kgggk',
    '.kkk...kkk.'
  ];
  RAW.fly2 = variant(RAW.fly1, {
    1: 'kGgGk.kGgGk', 2: 'kgggk.kgggk', 8: 'kgggk.kgggk', 9: 'kGgGk.kGgGk'
  });
  RAW.tv1 = [ // le brouilleur : une télé à cache-œil, avec ses oreilles de lapin
    '..k...........k..',
    '...k.........k...',
    '....k.......k....',
    '.....k.....k.....',
    '...kkkkkkkkkkk...',
    '..kMmmmmmmmmmMk..',
    'kkkmkgsgsgnnkmkkk',
    'kgkmksgsgnnnkmkgk',
    'kgkmkgsgsgnskmkgk',
    'kkkmksgsgsgskmkkk',
    '..kmkkkkkkkkkmk..',
    '..kMmmmmmmmmmMk..',
    '...kkkkkkkkkkk...',
    '....kGk...kGk....',
    '....kkk...kkk....'
  ];
  RAW.tv2 = variant(RAW.tv1, {
    6: 'kkkmksgsgsnnkmkkk',
    7: 'kGkmkgsgsnnnkmkGk',
    8: 'kGkmksgsgsnskmkGk',
    9: 'kkkmkgsgsgsgkmkkk'
  });

  // --- Tirs ---
  RAW.note = [ // une croche sifflée
    '..kk..',
    '..kykk',
    '..kyyk',
    '..kykk',
    'kkkyk.',
    'kyyyk.',
    'kyyyk.',
    '.kkk..'
  ];
  RAW.blt1 = [ // un parasite (tir ennemi)
    '.kkk.',
    'kmwmk',
    'kwwwk',
    'kmwmk',
    '.kkk.'
  ];
  RAW.blt2 = [
    '.kkk.',
    'kwmwk',
    'kmwmk',
    'kwmwk',
    '.kkk.'
  ];

  // --- Objets à ramasser ---
  RAW.reel = [
    '....kkkk....',
    '..kkggggkk..',
    '.kgggGGgggk.',
    '.kgggGGgggk.',
    'kgGGggggGGgk',
    'kgGGgkkgGGgk',
    'kggggkkggggk',
    'kggGGggGGggk',
    '.kgGGggGGgk.',
    '.kggggggggk.',
    '..kkggggkk..',
    '....kkkk....'
  ];
  RAW.cassette = [
    'kkkkkkkkkkkkkk',
    'kyyyyyyyyyyyyk',
    'kykkkkkkkkkkyk',
    'kykwnkkkknwkyk',
    'kykkkkkkkkkkyk',
    'kyyyyyyyyyyyyk',
    'kYYYYYYYYYYYYk',
    'kkkkkkkkkkkkkk'
  ];
  RAW.whistle = [
    '....kkkk....',
    '...kyyyyk...',
    'kkkyyYyyyk..',
    'kyyyyyyyyyk.',
    'kyyyykkyyyyk',
    'kkkkykkyyyyk',
    '....kyyyyyk.',
    '.....kkkkk..'
  ];

  // ---------- Mission 2 : au-dessus des nuages ----------
  RAW.goose1 = [ // oie cendrée vue de dessus, tête vers le bas
    '......kkk......',
    '.....kvvvk.....',
    '......kuk......',
    'kkk...kuk...kkk',
    'kUUkkkuuukkkUUk',
    '.kUUuuuuuuuUUk.',
    '..kkUuuvuuUkk..',
    '....kkkvkkk....',
    '......kuk......',
    '......kok......',
    '.......k.......'
  ];
  RAW.goose2 = variant(RAW.goose1, {
    3: '...kk.kuk.kk...',
    4: '..kUUkuuukUUk..',
    5: '..kUuuuuuuuUk..',
    6: '...kkuuvuukk...',
    7: '.....kkvkk.....'
  });
  RAW.goose0 = variant(RAW.goose1, {
    3: '.....kuuuk.....',
    4: '....kuUuUuk....',
    5: '....kuuuuuk....',
    6: '....kuUuUuk....',
    7: '.....kuvuk.....'
  });
  RAW.swift1 = [ // martinet : un croissant rapide
    'kk.........kk',
    '.kjk.....kjk.',
    '..kjjk.kjjk..',
    '...kjjjjjk...',
    '....kjJjk....',
    '.....kjk.....',
    '......k......'
  ];
  RAW.swift2 = [
    '.............',
    'kk.........kk',
    '.kjkk...kkjk.',
    '..kjjjkjjjk..',
    '...kkjJjkk...',
    '.....kjk.....',
    '......k......'
  ];
  RAW.swift0 = [
    '.............',
    '.............',
    '....kkkkk....',
    '...kjjJjjk...',
    '....kjjjk....',
    '.....kjk.....',
    '......k......'
  ];
  RAW.plane = [ // avion pirate, nez vers le bas
    '......k......',
    '....kkGkk....',
    '.....kgk.....',
    '.....kgk.....',
    '.kkkkkgkkkkk.',
    'kmmmmmgmmmmmk',
    'kMMMMkgkMMMMk',
    '.kkkkkgkkkkk.',
    '.....kgk.....',
    '....kgngk....',
    '....kgggk....',
    '.....kgk.....',
    '......k......'
  ];
  RAW.bombe = [ // bombe à parasites : elle éclate en couronne
    '..kkk..',
    '.kMmMk.',
    'kMmwmMk',
    'kmwwwmk',
    'kMmwmMk',
    '.kMmMk.',
    '..kkk..'
  ];

  // ---------- Mission 3 : en orbite ----------
  RAW.jelly1 = [ // méduse de l'espace
    '....kkkkk....',
    '..kkPPPPPkk..',
    '.kPPpppppPPk.',
    '.kPpppwppppk.',
    'kPpppwwwpppPk',
    'kPppppwppppPk',
    'kkpkpkpkpkpkk',
    '.kp.kp.pk.pk.',
    '.p..p...p..p.',
    '..p..p.p..p..',
    '.p...p.p...p.'
  ];
  RAW.jelly2 = variant(RAW.jelly1, {
    7: '.kp.kp.pk.pk.',
    8: '..p..p.p..p..',
    9: '.p..p...p..p.',
    10: '..p.p...p.p..'
  });

  // ---------- Le Blaireau, patron de Télé-Parasite (bicorne, cache-œil) ----------
  RAW.badger = [ // en buste, pour la télé
    '......kkkkkkkk......',
    '....kknnnnnnnnkk....',
    '...knnnnkmmknnnnk...',
    '..knnnnnkmskknnnnk..',
    '.knnnnnnkmmmknnnnnk.',
    'kkkkkkkkkkkkkkkkkkkk',
    '..kgkwwnnwwnnwwkgk..',
    '..kgkwnnnwwnnnwkgk..',
    '...kwnwnnwwnnnnwk...',
    '...kwnnnnwwnnnnwk...',
    '...kwwnnnwwnnnwwk...',
    '...kgwwnnwwnnwwgk...',
    '....kgwwnwwnwwgk....',
    '....kgwwwwwwwwgk....',
    '.....kgwwkkwwgk.....',
    '.....kgwwwwwwgk.....',
    '......kgwkkwgk......',
    '.......kkkkkk.......',
    '....kkMmmmmmmMkk....',
    '..kkMmmmmmmmmmmMkk..'
  ];
  RAW.badgerTalk = variant(RAW.badger, {
    15: '.....kgwkkkkwgk.....',
    16: '......kgkppkgk......'
  });
  RAW.badgerRun1 = [ // de profil, tourné vers la gauche, en pleine fuite
    '....kkkkk.......',
    '...knnmnnk......',
    '..kkkkkkkkk.....',
    '..kwwnnwwgk.....',
    '.kwnwnnwwggk....',
    'kkwwwwwwwgggkkk.',
    'knwwwwwwggggggk.',
    '.kkwwwwgggggggk.',
    '...kgggggggggggk',
    '...kGggggggggGk.',
    '...kGk.kGk.kGk..',
    '...kk..kk..kk...'
  ];
  RAW.badgerRun2 = variant(RAW.badgerRun1, {
    10: '..kGk..kGk..kGk.',
    11: '..kk...kk...kk..'
  });

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function build(name, rows, swap) {
    const w = Math.max.apply(null, rows.map(r => r.length)), h = rows.length;
    rows.forEach((r, i) => { if (r.length !== w) console.warn('sprite', name, 'ligne', i, r.length, '≠', w); });
    const c = canvas(w, h), g = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        g.fillStyle = (swap && swap[ch]) || PAL[ch] || ch;
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }
  function flip(src) {
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1);
    g.drawImage(src, 0, 0);
    return c;
  }
  function tint(src, col) { // silhouette d'une seule couleur (éclair blanc quand on touche, ombre portée)
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function add(key, c) {
    TM.SPR[key] = { r: c, l: flip(c), wh: tint(c, '#ffffff'), sh: tint(c, 'rgba(16,24,20,0.3)'), w: c.width, h: c.height };
  }

  // La montgolfière pirate, dessinée par calcul (rayures en fuseaux)
  function balloon() {
    const W = 23, H = 33, c = canvas(W, H), g = c.getContext('2d'), cx = 11;
    const half = y => y <= 10 ? 11 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 10.5) / 11, 2))) : 11 - (y - 10) * 0.42;
    for (let y = 0; y < 23; y++) {
      const hw = half(y);
      for (let x = 0; x < W; x++) {
        const dx = x - cx;
        if (Math.abs(dx) > hw) continue;
        const edge = Math.abs(dx) > hw - 1 || y === 0 || y === 22;
        let col;
        if (edge) col = PAL.k;
        else {
          const k = Math.floor((dx / hw) * 2.5 + 2.5); // cinq fuseaux
          col = k % 2 ? PAL.n : PAL.m;
          if (y >= 9 && y <= 12) col = '#fffaf0'; // bandeau blanc
          if (dx < -hw * 0.45 && y > 2 && y < 16 && col === PAL.m) col = '#f469ad';
        }
        g.fillStyle = col; g.fillRect(x, y, 1, 1);
      }
    }
    // le logo sur le bandeau : une petite télé au cache-œil
    g.fillStyle = PAL.k; g.fillRect(cx - 3, 9, 7, 4);
    g.fillStyle = PAL.s; g.fillRect(cx - 2, 10, 5, 2);
    g.fillStyle = PAL.n; g.fillRect(cx + 1, 10, 2, 2); g.fillRect(cx - 2, 9, 1, 1);
    // cordes et nacelle
    g.fillStyle = PAL.G;
    for (let y = 23; y < 27; y++) { g.fillRect(cx - 4 + ((y - 23) >> 1), y, 1, 1); g.fillRect(cx + 4 - ((y - 23) >> 1), y, 1, 1); }
    g.fillStyle = PAL.k; g.fillRect(cx - 4, 27, 9, 6);
    g.fillStyle = '#a8693a'; g.fillRect(cx - 3, 28, 7, 4);
    g.fillStyle = '#74461f'; g.fillRect(cx - 3, 30, 7, 1);
    g.fillStyle = PAL.G; g.fillRect(cx - 1, 26, 3, 2); // le pilote : un drone
    g.fillStyle = PAL.m; g.fillRect(cx, 26, 1, 1);
    return c;
  }

  // Le bombardier pirate : quatre moteurs, nez vers le bas
  function bomber() {
    const c = canvas(25, 19), g = c.getContext('2d');
    const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    r(PAL.k, 6, 0, 13, 4); r('#7d858f', 7, 1, 11, 2);            // empennage
    r(PAL.k, 0, 6, 25, 6); r('#8a929c', 1, 7, 23, 4);            // ailes
    r(PAL.m, 2, 8, 21, 1); r(PAL.M, 2, 10, 21, 1);
    for (const ex of [3, 7, 16, 20]) {                             // moteurs et hélices
      r(PAL.k, ex - 1, 11, 4, 4); r(PAL.G, ex, 12, 2, 2);
      r('#c9d0d8', ex - 2, 15, 6, 1);
    }
    r(PAL.k, 10, 0, 5, 19); r('#a3aab4', 11, 1, 3, 17);          // fuselage
    r('#d4dae2', 11, 2, 1, 12);
    r(PAL.a, 11, 14, 3, 2); r(PAL.A, 11, 16, 3, 1);              // vitrage du nez
    r(PAL.k, 3, 7, 4, 3); r(PAL.s, 4, 8, 2, 1); r(PAL.n, 5, 7, 1, 1); // petit logo pirate
    return c;
  }
  // Le satellite pirate : deux panneaux bleus et une parabole magenta
  function satellite(blink) {
    const c = canvas(23, 13), g = c.getContext('2d');
    const r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    for (const px of [0, 15]) {
      r(PAL.k, px, 3, 8, 7); r('#2f5fb0', px + 1, 4, 6, 5);
      r('#5a8ad8', px + 1, 4, 2, 2); r('#5a8ad8', px + 4, 4, 2, 2); r('#5a8ad8', px + 1, 7, 2, 2); r('#5a8ad8', px + 4, 7, 2, 2);
    }
    r(PAL.G, 8, 6, 7, 1);
    r(PAL.k, 8, 2, 7, 9); r(PAL.M, 9, 3, 5, 7); r(PAL.m, 9, 3, 5, 3);
    r(PAL.k, 10, 0, 3, 3); r(PAL.s, 11, 1, 1, 1);
    r(blink ? '#ffffff' : '#ff3fa4', 11, 7, 1, 1);
    return c;
  }
  // Astéroïdes et cailloux : une forme bosselée, éclairée d'en haut à gauche, en quatre rotations
  function rock(R, seed) {
    const S = R * 2 + 3, c = canvas(S, S), g = c.getContext('2d'), m = (S - 1) / 2;
    const bump = a => R + Math.sin(a * 3 + seed) * R * 0.14 + Math.sin(a * 5 + seed * 2) * R * 0.08;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = x - m, dy = y - m, d = Math.hypot(dx, dy), lim = bump(Math.atan2(dy, dx));
        if (d > lim) continue;
        let col = d > lim - 1 ? PAL.k : (dx + dy < -R * 0.5 ? '#b3a796' : dx + dy > R * 0.6 ? '#5f564b' : '#8a7f70');
        g.fillStyle = col; g.fillRect(x, y, 1, 1);
      }
    }
    const crater = (cx, cy, cr) => { g.fillStyle = '#5f564b'; g.fillRect(Math.round(m + cx), Math.round(m + cy), cr, cr); g.fillStyle = '#b3a796'; g.fillRect(Math.round(m + cx) + 1, Math.round(m + cy) + cr, Math.max(1, cr - 1), 1); };
    if (R > 4) { crater(-3, 0, 2); crater(2, -3, 2); crater(1, 2, 3); } else crater(0, -1, 1);
    return c;
  }
  // La reine des méduses : une grande cloche couronnée, de longs filaments
  function queen(frame, sleep) {
    const W = 31, H = 33, c = canvas(W, H), g = c.getContext('2d'), cx = 15;
    const P1 = sleep ? '#8a9ac8' : PAL.p, P2 = sleep ? '#c0cbe8' : PAL.P, core = sleep ? '#e0e6f6' : '#fffaf0';
    for (let y = 4; y <= 18; y++) {
      const hw = Math.round(14 * Math.sqrt(Math.max(0, 1 - Math.pow((18 - y) / 14.5, 2))));
      for (let x = cx - hw; x <= cx + hw; x++) {
        const edge = x === cx - hw || x === cx + hw || y === 4;
        g.fillStyle = edge ? PAL.k : Math.abs(x - cx) > hw - 3 ? P2 : P1;
        g.fillRect(x, y, 1, 1);
      }
    }
    g.fillStyle = PAL.k;
    for (let x = cx - 14; x <= cx + 14; x++) if ((x + frame) % 3 !== 0) g.fillRect(x, 19, 1, 1);
    for (let dy = -3; dy <= 3; dy++) { const w = Math.round(Math.sqrt(9 - dy * dy)); g.fillStyle = core; g.fillRect(cx - w, 14 + dy, w * 2 + 1, 1); }
    g.fillStyle = PAL.k; g.fillRect(cx - 5, 1, 11, 4);              // la couronne
    g.fillStyle = PAL.y; g.fillRect(cx - 4, 2, 9, 2); g.fillRect(cx - 4, 0, 1, 2); g.fillRect(cx, 0, 1, 2); g.fillRect(cx + 4, 0, 1, 2);
    g.fillStyle = PAL.m; g.fillRect(cx, 2, 1, 1);
    g.fillStyle = PAL.k;
    if (sleep) { g.fillRect(cx - 5, 9, 3, 1); g.fillRect(cx + 3, 9, 3, 1); }
    else { g.fillRect(cx - 5, 8, 2, 2); g.fillRect(cx + 4, 8, 2, 2); }
    for (let k = 0; k < 7; k++) {                                     // les filaments
      const tx = cx - 12 + k * 4;
      for (let y = 20; y < H - (k % 2) * 3; y++) {
        g.fillStyle = y % 3 ? P1 : P2;
        g.fillRect(tx + Math.round(Math.sin(y * 0.5 + k + frame * 1.5) * 1.2), y, 1, 1);
      }
    }
    return c;
  }
  function rotated(src, k) {
    const c = canvas(src.width, src.height), g = c.getContext('2d');
    g.translate(src.width / 2, src.height / 2); g.rotate(k * Math.PI / 2); g.drawImage(src, -src.width / 2, -src.height / 2);
    return c;
  }

  TM.PAL = PAL;
  TM.SPR = {};
  for (const k in RAW) add(k, build(k, RAW[k]));
  add('balloon', balloon());
  add('bomber', bomber());
  add('sat1', satellite(false)); add('sat2', satellite(true));
  add('jelly0', build('jelly0', RAW.jelly1, { p: '#8a9ac8', P: '#c0cbe8', w: '#e0e6f6' }));
  add('queen1', queen(0, false)); add('queen2', queen(1, false)); add('queen0', queen(0, true));
  const big = rock(7, 1.3), small = rock(3, 4.1);
  for (let k = 0; k < 4; k++) { add('ast' + k, rotated(big, k)); add('peb' + k, rotated(small, k)); }
})(window.TM);
