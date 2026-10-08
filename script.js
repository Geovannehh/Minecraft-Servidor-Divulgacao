(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // Texturas 16x16 geradas por código (pixel art original)
  function make(seed, fn) {
    const r = rng(seed), c = document.createElement('canvas'); c.width = c.height = 16;
    const x = c.getContext('2d');
    const px = (i, j, col, v = 0) => {
      const k = 1 + (r() - .5) * v;
      x.fillStyle = `rgb(${col.map(n => Math.max(0, Math.min(255, n * k | 0)))})`;
      x.fillRect(i, j, 1, 1);
    };
    fn(px, r);
    return c.toDataURL();
  }
  const fill = (px, c, v) => { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) px(i, j, c, v); };
  const G = [93, 180, 67], D = [134, 96, 67], ST = [125, 125, 125], DI = [77, 227, 214], RD = [200, 40, 30], WH = [232, 232, 232], TN = [196, 164, 112];

  const ore = (seed, s) => make(seed, px => {
    fill(px, ST, .3);
    [[3, 3], [10, 2], [6, 9], [12, 11], [2, 12]].forEach(([a, b]) => {
      a = (a + s) % 14; b = (b + s * 2) % 14;
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([d, e]) => px(a + d, b + e, DI, .15));
      px(a, b, [220, 255, 250]);
    });
  });
  const L = { T: ['111', '010', '010', '010', '010'], N: ['101', '111', '111', '101', '101'] };
  const blocks = {
    grass: () => ({
      top: make(1, px => fill(px, G, .35)),
      bot: make(2, px => fill(px, D, .35)),
      side: make(3, (px, r) => { fill(px, D, .35); for (let i = 0; i < 16; i++) { const h = 3 + (r() * 3 | 0); for (let j = 0; j < h; j++) px(i, j, G, .35); } })
    }),
    diamond: () => ({ top: ore(4, 0), bot: ore(5, 3), side: ore(6, 5) }),
    tnt: () => {
      const cap = make(8, px => { fill(px, TN, .2); [[7, 7], [8, 7], [7, 8], [8, 8]].forEach(([i, j]) => px(i, j, [60, 40, 20])); });
      const side = make(7, px => {
        fill(px, RD, .2);
        for (let j = 4; j <= 10; j++) for (let i = 0; i < 16; i++) px(i, j, WH, .08);
        [...'TNT'].forEach((ch, n) => L[ch].forEach((row, j) => [...row].forEach((v, i) => v === '1' && px(2 + n * 4 + i, 5 + j, [40, 40, 40]))));
      });
      return { top: cap, bot: cap, side };
    }
  };

  // Cubo CSS 3D
  const cube = document.getElementById('cube'), h = 100;
  const defs = [['side', `translateZ(${h}px)`, .85], ['side', `rotateY(90deg) translateZ(${h}px)`, .7], ['side', `rotateY(180deg) translateZ(${h}px)`, .6], ['side', `rotateY(-90deg) translateZ(${h}px)`, .75], ['top', `rotateX(90deg) translateZ(${h}px)`, 1.05], ['bot', `rotateX(-90deg) translateZ(${h}px)`, .5]];
  const faces = defs.map(([k, t, b]) => { const f = document.createElement('div'); f.className = 'f'; f.style.transform = t; f.style.filter = `brightness(${b})`; cube.appendChild(f); return [f, k]; });
  const cache = {}; let current = '';
  function setBlock(n) {
    if (n === current) return;
    const first = !current; current = n;
    const t = cache[n] || (cache[n] = blocks[n]());
    faces.forEach(([f, k]) => f.style.backgroundImage = `url(${t[k]})`);
    if (!first && !reduce) { cube.classList.remove('pop'); void cube.offsetWidth; cube.classList.add('pop'); }
  }
  setBlock('grass');

  // Rotação e posição ligadas ao scroll
  const scene = document.querySelector('.scene');
  let mx = 0, my = 0, ticking = false;
  const path = [0, .27, -.27, .27, 0, 0, 0];
  function update() {
    const max = document.body.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
    const f = p * (path.length - 1), k = Math.min(Math.floor(f), path.length - 2);
    const wide = innerWidth > 760;
    const x = (path[k] + (path[k + 1] - path[k]) * (f - k)) * (wide ? innerWidth : 0);
    const s = 1 + (p < .1 ? .5 - p * 4 : .1) * (wide ? 1 : .5);
    const rot = reduce ? 35 : 35 + p * 900;
    scene.style.transform = `translateX(${x}px) scale(${s}) rotateX(${-22 + my * 10}deg) rotateY(${rot + mx * 20}deg)`;
    ticking = false;
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; req(); });
  update();

  // Troca o bloco conforme a seção
  const bo = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setBlock(e.target.dataset.block)), { threshold: .55 });
  document.querySelectorAll('[data-block]').forEach(el => bo.observe(el));

  // Revelar seções e contar números
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-to]').forEach(count);
    io.unobserve(e.target);
  }), { threshold: .35 });
  document.querySelectorAll('.r').forEach(el => io.observe(el));

  function count(el) {
    const to = +el.dataset.to, t0 = performance.now();
    const step = t => {
      const q = Math.min((t - t0) / 1200, 1);
      el.textContent = reduce || q === 1 ? to : Math.round(to * (1 - Math.pow(1 - q, 3)));
      if (q < 1 && !reduce) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
})();
