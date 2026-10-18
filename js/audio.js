// Hors Antenne ! : bruitages et musiques synthétisés (aucun fichier son)
window.TM = window.TM || {};
(function (TM) {
  let ac = null, master = null, sfxGain = null, musicGain = null;
  let sfxOn = true, musicOn = true, seq = null, wanted = -1;
  let noiseBuf = null, shotN = 0;
  const loops = {};

  function unlock() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.connect(ac.destination);
      sfxGain = ac.createGain(); sfxGain.gain.value = sfxOn ? 0.32 : 0; sfxGain.connect(master);
      musicGain = ac.createGain(); musicGain.gain.value = musicOn ? 0.12 : 0; musicGain.connect(master);
      if (wanted >= 0) startSong(wanted);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  function noiseBuffer() {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function tone(type, f0, f1, dur, vol, delay) {
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, freq, delay, type, dest, when) {
    const t = when !== undefined ? when : ac.currentTime + (delay || 0);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuffer();
    f.type = type || 'bandpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur);
  }
  function arp(type, notes, step, dur, vol) { notes.forEach((f, i) => { if (f) tone(type, f, 0, dur, vol, i * step); }); }

  // Le sifflet joue une petite gamme, une note sur deux tirs
  const SCALE = [0, 2, 4, 7, 9, 12, 9, 7, 4, 2];
  const SFX = {
    shot: () => { const f = 1046 * Math.pow(2, SCALE[shotN++ % SCALE.length] / 12); tone('sine', f, f * 1.01, 0.05, 0.05); },
    hit: () => noise(0.03, 0.14, 2600),
    tap: () => tone('triangle', 900, 700, 0.04, 0.1),
    tink: () => tone('square', 2200, 0, 0.03, 0.05),
    sleep: () => { tone('sine', 1400, 500, 0.3, 0.14); tone('sine', 700, 350, 0.3, 0.06, 0.05); },
    pop: () => { noise(0.2, 0.35, 5000, 0, 'highpass'); noise(0.15, 0.3, 900); },
    boom: () => { noise(0.45, 0.6, 500, 0, 'lowpass'); noise(0.35, 0.3, 6000, 0, 'highpass'); tone('sawtooth', 180, 50, 0.4, 0.15); },
    fire: () => tone('square', 520, 380, 0.06, 0.04),
    cry: () => tone('sawtooth', 1800, 900, 0.35, 0.07),
    power: () => arp('square', [523, 659, 784, 1047, 1319], 0.05, 0.1, 0.13),
    reel: () => { tone('square', 988, 0, 0.06, 0.16); tone('square', 1319, 0, 0.12, 0.16, 0.06); },
    whistle: () => { tone('sine', 1800, 2400, 0.12, 0.15); tone('sine', 2400, 1800, 0.12, 0.15, 0.12); },
    gold: () => arp('square', [523, 659, 784, 1047, 784, 1047], 0.08, 0.12, 0.15),
    bomb: () => {
      tone('sine', 700, 2600, 0.5, 0.22); tone('sine', 1050, 3900, 0.5, 0.08);
      arp('triangle', [523, 659, 784, 1047, 1319, 1568], 0.05, 0.3, 0.12);
      noise(0.6, 0.2, 7000, 0, 'highpass');
    },
    clap: () => { noise(0.04, 0.9, 3000, 0, 'highpass'); noise(0.08, 0.5, 1200, 0.01); },
    take: () => { noise(0.05, 1, 2500, 0, 'highpass'); tone('square', 1200, 0, 0.04, 0.1); },
    cut: () => { noise(0.5, 0.7, 600, 0, 'lowpass'); noise(0.4, 0.35, 6000, 0, 'highpass'); tone('sawtooth', 330, 80, 0.5, 0.2); },
    warn: () => { for (let i = 0; i < 4; i++) { tone('square', 880, 0, 0.18, 0.12, i * 0.4); tone('square', 660, 0, 0.18, 0.12, i * 0.4 + 0.2); } },
    open: () => { tone('sawtooth', 120, 400, 0.6, 0.15); noise(0.6, 0.2, 2000); },
    charge: () => tone('sawtooth', 200, 1600, 0.9, 0.08),
    beam: () => { noise(0.75, 0.35, 3000); tone('square', 110, 0, 0.75, 0.12); },
    bossdie: () => { noise(1.6, 0.8, 300, 0, 'lowpass'); noise(1.2, 0.4, 6000, 0, 'highpass'); tone('sawtooth', 300, 30, 1.6, 0.25); },
    win: () => arp('square', [523, 659, 784, 1047, 0, 784, 1047, 1319, 0, 1568], 0.11, 0.2, 0.17),
    hop: () => tone('square', 300, 560, 0.1, 0.15),
    board: () => { tone('square', 400, 800, 0.08, 0.15); tone('square', 600, 0, 0.1, 0.12, 0.1); noise(0.06, 0.4, 1500, 0.18); },
    liftoff: () => { noise(1.2, 0.5, 400, 0, 'lowpass'); tone('sawtooth', 80, 300, 1.2, 0.12); },
    go: () => { tone('square', 660, 0, 0.08, 0.18); tone('square', 990, 0, 0.12, 0.18, 0.08); },
    rumble: () => noise(0.9, 0.25, 120, 0, 'lowpass'),
    thunder: () => { noise(0.08, 0.9, 5000, 0, 'highpass'); noise(1.4, 0.8, 180, 0.03, 'lowpass'); },
    drop: () => tone('sine', 1200, 300, 0.5, 0.08),
    tock: () => tone('triangle', 300, 200, 0.04, 0.12),
    crumble: () => { noise(0.25, 0.5, 700, 0, 'lowpass'); noise(0.12, 0.25, 2500, 0.03); },
    // ---------- cinématiques ----------
    glitch: () => { noise(0.25, 0.6, 5000, 0, 'highpass'); tone('square', 80, 60, 0.2, 0.08); },
    blah: () => { const f = 180 + Math.random() * 160; tone('square', f, f * (0.8 + Math.random() * 0.5), 0.07, 0.07); },
    collapse: () => { noise(1.2, 0.5, 300, 0, 'lowpass'); tone('sawtooth', 140, 40, 1.2, 0.1); },
    signal: () => arp('sine', [784, 988, 1175, 1568], 0.09, 0.25, 0.14),
    deflate: () => { tone('sawtooth', 520, 90, 2.4, 0.07); noise(2.2, 0.25, 2500, 0, 'bandpass'); },
    horn: () => { tone('square', 233, 0, 0.3, 0.2); tone('square', 294, 0, 0.3, 0.16); tone('square', 233, 0, 0.45, 0.2, 0.4); tone('square', 294, 0, 0.45, 0.16, 0.4); },
    flag: () => arp('square', [523, 659, 784, 1047, 0, 1047, 1319, 1568], 0.1, 0.16, 0.15),
    pod: () => { tone('sawtooth', 200, 900, 0.8, 0.1); noise(0.8, 0.3, 900, 0, 'lowpass'); },
    sputter: () => { for (let i = 0; i < 6; i++) noise(0.08, 0.5, 300, i * 0.18 + Math.random() * 0.05, 'lowpass'); },
    land: () => { noise(0.3, 0.6, 400, 0, 'lowpass'); tone('square', 300, 200, 0.1, 0.1); },
    zoom: () => tone('sine', 300, 1200, 0.35, 0.1),
    zap: () => { noise(0.3, 0.35, 6000, 0, 'highpass'); tone('square', 90, 70, 0.3, 0.07); tone('sawtooth', 1800, 600, 0.12, 0.05); }
  };

  // Sons continus dont on règle le volume : la neige de la télé et le moteur au décollage
  function loop(name, v, type, freq) {
    if (!ac || ac.state !== 'running') return;
    let L = loops[name];
    if (!L && v > 0) {
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noiseBuffer(); s.loop = true;
      f.type = type; f.frequency.value = freq;
      g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(sfxGain);
      s.start();
      L = loops[name] = { s: s, g: g };
    }
    if (L) {
      L.g.gain.setTargetAtTime(Math.max(0, Math.min(1, v)) * 0.9, ac.currentTime, 0.08);
      if (v <= 0) { loops[name] = null; setTimeout(() => { try { L.s.stop(); } catch (e) { /* déjà arrêté */ } }, 400); }
    }
  }

  // Musiques : croches, 0 = silence
  const SONGS = [
    { tempo: 132, drums: false, // le menu, do majeur
      lead: [72,0,76,79,84,0,79,0, 81,0,77,0,74,0,0,0, 76,0,79,84,88,0,84,0, 86,0,83,79,84,0,0,0,
             79,0,77,76,77,0,74,0, 76,0,74,72,74,0,71,0, 72,76,79,76,74,0,67,0, 72,0,0,0,0,0,0,0],
      bass: [48,0,55,0,52,0,55,0, 53,0,57,0,50,0,55,0, 48,0,55,0,52,0,55,0, 50,0,55,0,48,0,0,0,
             53,0,57,0,48,0,52,0, 50,0,53,0,43,0,47,0, 48,0,52,0,43,0,47,0, 48,0,43,0,48,0,0,0] },
    { tempo: 150, drums: true, // la mission, ré mineur
      lead: [74,0,77,81,0,81,79,77, 74,0,70,74,77,0,74,70, 72,0,76,79,0,79,77,76, 73,0,76,81,0,0,79,0,
             81,0,77,74,81,0,84,81, 82,0,77,74,70,0,74,77, 79,0,74,70,79,77,76,74, 73,0,69,73,76,0,0,0],
      bass: [38,0,50,0,38,0,50,0, 34,0,46,0,34,0,46,0, 36,0,48,0,36,0,48,0, 33,0,45,0,33,0,45,0,
             38,0,50,0,38,0,50,0, 34,0,46,0,34,0,46,0, 31,0,43,0,31,0,43,0, 33,0,45,0,33,45,33,0] },
    { tempo: 170, drums: true, // le relais pirate, mi mineur
      lead: [76,0,79,76,83,0,79,76, 72,0,76,72,79,0,76,72, 74,0,78,74,81,0,78,74, 75,0,78,81,83,0,0,0,
             88,0,86,83,79,0,83,86, 84,0,79,76,72,0,76,79, 81,0,76,72,69,72,76,81, 83,0,78,75,71,0,0,0],
      bass: [40,40,52,40,40,52,40,52, 36,36,48,36,36,48,36,48, 38,38,50,38,38,50,38,50, 35,35,47,35,35,47,35,47,
             40,40,52,40,40,52,40,52, 36,36,48,36,36,48,36,48, 33,33,45,33,33,45,33,45, 35,35,47,35,35,47,35,47] },
    { tempo: 144, drums: true, // au-dessus des nuages, sol majeur
      lead: [79,0,83,86,0,86,84,83, 81,0,78,81,86,0,81,78, 79,0,76,79,83,0,79,76, 76,0,72,76,79,0,81,83,
             86,0,83,79,86,0,88,86, 81,0,86,90,88,0,86,81, 84,0,79,76,72,0,76,79, 81,0,78,74,78,0,0,0],
      bass: [43,0,55,0,43,0,55,0, 38,0,50,0,38,0,50,0, 40,0,52,0,40,0,52,0, 36,0,48,0,36,0,48,0,
             43,0,55,0,43,0,55,0, 38,0,50,0,38,0,50,0, 36,0,48,0,36,0,48,0, 38,0,50,0,38,50,38,0] },
    { tempo: 132, drums: 'soft', // en orbite, la mineur, en arpèges
      lead: [69,72,76,81,76,72,69,72, 65,69,72,77,72,69,65,69, 67,72,76,79,76,72,67,72, 67,71,74,79,74,71,67,71,
             81,0,79,76,81,0,84,83, 81,0,77,72,77,0,81,77, 74,77,81,86,81,77,74,77, 76,80,83,88,83,80,76,0],
      bass: [45,0,0,45,0,0,45,0, 41,0,0,41,0,0,41,0, 36,0,0,36,0,0,36,0, 43,0,0,43,0,0,43,0,
             45,0,0,45,0,0,45,0, 41,0,0,41,0,0,41,0, 38,0,0,38,0,0,38,0, 40,0,0,40,0,40,0,0] }
  ];
  function note(type, midi, dur, vol, t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + 0.16);
  }
  function stopSong() { if (seq) { clearInterval(seq.timer); seq = null; } }
  function startSong(i) {
    stopSong();
    const s = SONGS[i], stepDur = 60 / s.tempo / 2;
    let step = 0, next = ac.currentTime + 0.08;
    seq = { i: i, timer: setInterval(function () {
      if (ac.state !== 'running') { next = ac.currentTime + 0.08; return; }
      while (next < ac.currentTime + 0.15) {
        const l = s.lead[step % s.lead.length], b = s.bass[step % s.bass.length];
        if (l) note('square', l, stepDur * 0.85, 0.2, next);
        if (b) note('triangle', b, stepDur * 1.6, 0.55, next);
        if (s.drums === 'soft') {
          if (step % 8 === 0) kick(next);
          if (step % 2 === 1) noise(0.03, 0.08, 9000, 0, 'highpass', musicGain, next);
        } else if (s.drums) {
          if (step % 4 === 0) kick(next);
          if (step % 4 === 2) noise(0.09, 0.35, 1800, 0, 'bandpass', musicGain, next);
          noise(0.03, 0.12, 8000, 0, 'highpass', musicGain, next);
        }
        next += stepDur; step++;
      }
    }, 30) };
  }

  TM.sfx = function (n) {
    if (!ac || !sfxOn || TM.quiet || ac.state !== 'running') return;
    const f = SFX[n];
    if (f) try { f(); } catch (e) { /* un son raté ne doit pas arrêter le jeu */ }
  };
  TM.audio = {
    unlock: unlock,
    hiss: function (v) { try { loop('hiss', sfxOn ? v * 0.5 : 0, 'highpass', 3000); } catch (e) { /* pas grave */ } },
    engine: function (v) { try { loop('engine', sfxOn ? v * 1.4 : 0, 'lowpass', 160); } catch (e) { /* pas grave */ } },
    music: function (i) {
      wanted = i;
      if (!ac) return;
      if (i < 0) { stopSong(); return; }
      if (!seq || seq.i !== i) startSong(i);
    },
    setSfx: function (on) { sfxOn = on; if (sfxGain) sfxGain.gain.value = on ? 0.32 : 0; },
    setMusic: function (on) { musicOn = on; if (musicGain) musicGain.gain.value = on ? 0.12 : 0; },
    pause: function () { if (ac && ac.state === 'running') ac.suspend(); },
    resume: function () { if (ac && ac.state === 'suspended') ac.resume(); }
  };
})(window.TM);
