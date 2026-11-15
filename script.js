(() => {
  document.documentElement.classList.add('js');
  const cv = document.getElementById('space'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, S, F, DT = 0, on = !reduce, t = 0, last = 0, mx = 0, my = 0, tx = 0, ty = 0, sy = scrollY;
  let explore = false, zoom = 1, tz = 1, pan = { x: 0, y: 0 }, wp = { x: 0, y: 0 }, fx = 0, fy = 0, spin = 0, pp = 0, ea = 0;
  let fly = null, hover = -1, focus = 0, comet = null;
  const rnd = Math.random, lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = (v, f) => ((v + f / 2) % f + f) % f - f / 2;

  // The six planets. Planet 01 is the wireframe home planet; 02 to 06 are the other sections.
  // Positions and sizes are multiples of the screen size S so the map fits any device.
  const PL = [
    { id: 'about', n: '01', name: 'Intro', ux: 0, uy: 0, r: .3 },
    { id: 'education', n: '02', name: 'Academics', ux: -1.35, uy: -.3, r: .17, c: ['#9fe8ff', '#2f7cf0', '#0b1450'], bands: ['#ffffff', '#bff3ff'] },
    { id: 'achievements', n: '03', name: 'Achievements', ux: 1.3, uy: -.45, r: .15, c: ['#fff0b0', '#e6a93a', '#4a2a05'], bands: ['#7a4a10'], ring: 1 },
    { id: 'skills', n: '04', name: 'Skills', ux: -1, uy: .6, r: .19, c: ['#e4d4ff', '#8a6bff', '#1d1050'], bands: ['#4b2fb0', '#c9b8ff', '#4b2fb0'], ring: 1 },
    { id: 'projects', n: '05', name: 'Projects', ux: 1.05, uy: .55, r: .16, c: ['#ffc9a8', '#e0603a', '#3a0f08'], craters: 1 },
    { id: 'values', n: '06', name: 'Values', ux: .1, uy: -.85, r: .14, c: ['#d6fff8', '#3fd1c0', '#06303a'], bands: ['#ffffff'], moon: 1 }
  ];
  const TEASE = { about: 'Who I am', education: 'School and coursework', achievements: 'Honors and certificates', skills: 'HTML5, CSS3, C++, Luau, Git', projects: 'Portfolio, Space Explorer, Roblox game', values: 'How I work' };
  PL.forEach(p => { p.t = TEASE[p.id]; });
  // ---------- Procedural textures: real-looking surfaces, clouds, nebulae (built once at load) ----------
  const hash = (x, y, s) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const smooth = k => k * k * (3 - 2 * k);
  function vnoise(x, y, per, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = smooth(x - xi), yf = smooth(y - yi);
    const h = (a, b) => hash(((a % per) + per) % per, b, s);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), xf), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), xf), yf);
  }
  function fbm(u, v, base, oct, s) { let a = 1, sum = 0, nr = 0, f = base; for (let o = 0; o < oct; o++) { sum += a * vnoise(u * f, v * f, f, s + o); nr += a; a *= .5; f *= 2; } return sum / nr; }
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function paint(w, h, fn) {
    const c = canvas(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = fn(x / w, y / h), i = (y * w + x) * 4; d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = p[3] === undefined ? 255 : p[3]; }
    g.putImageData(img, 0, 0); return c;
  }
  function makeTex(type, seed) {
    const c = paint(256, 128, (u, v) => {
      const lat = Math.abs(v - .5) * 2, n = fbm(u, v, 4, 5, seed);
      let col;
      if (type === 'earth') {
        col = n < .54 ? mixc([6, 26, 80], [34, 120, 180], clamp((n - .3) / .24, 0, 1))
          : n < .64 ? mixc([52, 112, 56], [128, 104, 66], (n - .54) / .1) : mixc([128, 104, 66], [235, 235, 240], clamp((n - .64) / .12, 0, 1));
        if (lat > .86) col = mixc(col, [240, 245, 255], clamp((lat - .86) / .08, 0, 1));
      } else if (type === 'gold') {
        const m = fbm(u + n * .35, v * 2, 3, 5, seed + 1);
        col = m < .5 ? mixc([150, 92, 34], [214, 160, 70], m * 2) : mixc([214, 160, 70], [250, 220, 140], (m - .5) * 2);
      } else if (type === 'gas') {
        const bnd = Math.sin((v + (n - .5) * .18) * 44) * .5 + .5;
        col = mixc(mixc([86, 56, 150], [228, 212, 255], bnd), [60, 36, 110], fbm(u, v * 6, 6, 3, seed + 2) * .6);
        const dx = (u - .3) / .06, dy = (v - .62) / .035, q = dx * dx + dy * dy;
        if (q < 1) col = mixc(col, [255, 150, 110], 1 - q);
      } else if (type === 'rust') {
        col = n < .5 ? mixc([70, 28, 20], [150, 60, 35], n * 2) : mixc([150, 60, 35], [222, 130, 78], (n - .5) * 2);
        if (lat > .92) col = mixc(col, [245, 240, 235], .85);
      } else {
        col = mixc([60, 170, 176], [205, 250, 245], n);
        if (Math.abs(fbm(u, v, 5, 4, seed + 3) - .5) < .035) col = mixc(col, [20, 90, 100], .7);
      }
      return col;
    });
    if (type === 'rust') {
      const g = c.getContext('2d');
      for (let k = 0; k < 30; k++) { const cx = rnd() * 256, cy = 128 * (.15 + rnd() * .7), cr = 2 + rnd() * 7; g.fillStyle = 'rgba(40,14,10,.4)'; g.beginPath(); g.arc(cx, cy, cr, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,200,160,.3)'; g.beginPath(); g.arc(cx - 1, cy - 1, cr, 3.6, 5.4); g.stroke(); }
    }
    return c;
  }
  const makeClouds = seed => paint(256, 128, (u, v) => [255, 255, 255, clamp((fbm(u, v, 6, 5, seed) - .5) / .22, 0, 1) * 210]);
  function makeShade(atm) {
    const s = 256, c = canvas(s, s), g = c.getContext('2d');
    const gr = g.createRadialGradient(s * .35, s * .32, s * .05, s / 2, s / 2, s * .56);
    gr.addColorStop(0, 'rgba(0,0,10,0)'); gr.addColorStop(.55, 'rgba(0,0,10,.2)'); gr.addColorStop(.85, 'rgba(0,0,12,.78)'); gr.addColorStop(1, 'rgba(0,0,14,.95)');
    g.fillStyle = gr; g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, 7); g.fill();
    const rim = g.createRadialGradient(s / 2, s / 2, s * .42, s / 2, s / 2, s * .5);
    rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, atm);
    g.fillStyle = rim; g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, 7); g.fill();
    return c;
  }
  function makeNeb(c1, c2, seed) {
    return paint(192, 192, (u, v) => {
      const f = clamp(1 - Math.hypot(u - .5, v - .5) * 2, 0, 1), k = clamp((fbm(u, v, 3, 5, seed) - .42) / .3, 0, 1), m = fbm(u, v, 2, 3, seed + 5);
      const col = mixc(c1, c2, m); return [col[0], col[1], col[2], k * f * f * 190];
    });
  }
  const NC = [[[120, 70, 255], [255, 90, 170]], [[0, 150, 255], [90, 255, 220]], [[255, 80, 160], [255, 170, 90]]];
  const KIND = { about: ['earth', 7, 'rgba(120,200,255,.6)', 1], education: ['earth', 11, 'rgba(120,200,255,.55)', 1], achievements: ['gold', 22, 'rgba(255,210,140,.5)'],
    skills: ['gas', 33, 'rgba(190,170,255,.5)'], projects: ['rust', 44, 'rgba(255,170,130,.45)'], values: ['ice', 55, 'rgba(160,255,240,.5)'] };
  PL.forEach(p => { const [ty, sd, atm, cl] = KIND[p.id]; p.w = { tex: makeTex(ty, sd), shade: makeShade(atm), cloud: cl ? makeClouds(sd + 9) : null }; });
  // Draw a spinning textured sphere: slide the surface texture across a circle, then add lighting
  function drawWorld(w, x, y, r, rot) {
    const a0 = ctx.globalAlpha, tw = r * 4, off = (((rot % 1) + 1) % 1) * tw;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip();
    for (let k = 0; k < 2; k++) ctx.drawImage(w.tex, x - r - off + k * tw, y - r, tw, r * 2);
    if (w.cloud) { const o2 = (((rot * 1.4) % 1) + 1) % 1 * tw; ctx.globalAlpha = a0 * .85; for (let k = 0; k < 2; k++) ctx.drawImage(w.cloud, x - r - o2 + k * tw, y - r, tw, r * 2); ctx.globalAlpha = a0; }
    ctx.drawImage(w.shade, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  const wx = p => p.ux * S, wy = p => p.id === 'about' ? -.04 * H : p.uy * S, wr = p => p.r * S;
  const X = x => W / 2 + (x - pan.x) * zoom, Y = y => H / 2 + (y - pan.y) * zoom;
  const ready = p => wr(p) * zoom >= .28 * S;

  const SPEC = ['#9bb0ff', '#cad8ff', '#ffffff', '#fff4e0', '#ffd9a0', '#ffb98a'];
  const mk = (x, y, z, big) => ({ x, y, z, s: .002 + rnd() * .006, p: rnd() * 6.28, c: SPEC[(Math.pow(rnd(), 1.4) * SPEC.length) | 0], big });
  const stars = Array.from({ length: 700 }, () => mk(rnd(), rnd(), .1 + rnd() * .9, rnd() < .025));
  for (let i = 0; i < 700; i++) { const gx = rnd() - .5, gy = (rnd() + rnd() + rnd() - 1.5) * .12, a = -.45; stars.push(mk(((.5 + gx * Math.cos(a) - gy * Math.sin(a)) % 1 + 1) % 1, ((.5 + gx * Math.sin(a) + gy * Math.cos(a)) % 1 + 1) % 1, .06 + rnd() * .2, false)); }
  const rocks = Array.from({ length: 70 }, () => {
    const n = 7 + (rnd() * 3 | 0);
    const poly = Array.from({ length: n }, (_, i) => { const a = i / n * 6.2832, r = .7 + rnd() * .5; return [Math.cos(a) * r, Math.sin(a) * r]; });
    return { x: rnd(), y: rnd(), z: .3 + rnd() * .65, r: 5 + rnd() * 16, a: rnd() * 6.28, w: (rnd() - .5) * .8, vx: (rnd() - .5) * .004, poly };
  });
  const nebs = [[-700, -400, 900, '122,60,255'], [900, 300, 1000, '0,170,255'], [-300, 900, 900, '255,80,160']].map(([x, y, r, c], i) => ({ x, y, r, c, tex: makeNeb(NC[i][0], NC[i][1], 100 + i * 7) }));
  // UFOs and aliens fly around the planets (click one to say hi)
  const ents = [
    { k: 'ufo', cx: 0, cy: -.04, rx: .62, ry: .22, sp: .25, ph: 0, s: .035 },
    { k: 'ufo', cx: -1, cy: .6, rx: .42, ry: .15, sp: -.35, ph: 2, s: .03 },
    { k: 'ufo', cx: 1.05, cy: .55, rx: .35, ry: .13, sp: .4, ph: 4, s: .028 },
    { k: 'alien', cx: 1.3, cy: -.45, rx: .27, ry: .1, sp: .3, ph: 1, s: .03 },
    { k: 'alien', cx: -1.35, cy: -.3, rx: .27, ry: .12, sp: -.25, ph: 3, s: .03 },
    { k: 'alien', cx: .1, cy: -.85, rx: .23, ry: .09, sp: .35, ph: 5, s: .026 }
  ].map(e => ({ ...e, say: 0, msg: '' }));
  const lines = ['Greetings, human!', 'Take me to your leader.', 'Nice portfolio!', 'Beep boop.', 'Is this Earth?', 'Hire this student!'];

  function size() {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight; S = Math.min(W, H);
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  size();
  addEventListener('resize', size);
  addEventListener('pointermove', e => { tx = e.clientX / W - .5; ty = e.clientY / H - .5; });
  addEventListener('scroll', () => { sy = scrollY; }, { passive: true });

  // ---------- Drawing helpers ----------
  function proj(x, y, z, a, b, R, ox, oy) {
    const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a);
    const y1 = y * Math.cos(b) - z1 * Math.sin(b), z2 = y * Math.sin(b) + z1 * Math.cos(b);
    const k = 1 / (1 + z2 * .22);
    return [ox + x1 * R * k, oy + y1 * R * k, z2];
  }

  // Home planet: glowing wireframe sphere with two rings and a moon
  function planet(ox, oy, R, a, b, alpha) {
    const g = ctx.createRadialGradient(ox, oy, R * .2, ox, oy, R * 1.9);
    g.addColorStop(0, `rgba(94,231,255,${.16 * alpha})`); g.addColorStop(1, 'rgba(94,231,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, R * 1.9, 0, 7); ctx.fill();
    const B = [new Path2D(), new Path2D(), new Path2D()];
    const seg = pts => {
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i - 1], q = pts[i], z = (p[2] + q[2]) / 2, k = z > .35 ? 0 : z > -.35 ? 1 : 2;
        B[k].moveTo(p[0], p[1]); B[k].lineTo(q[0], q[1]);
      }
    };
    for (let i = 1; i < 8; i++) {
      const lat = -Math.PI / 2 + i * Math.PI / 8, r = Math.cos(lat), y = Math.sin(lat), pts = [];
      for (let j = 0; j <= 48; j++) { const th = j / 48 * 6.2832; pts.push(proj(r * Math.cos(th), y, r * Math.sin(th), a, b, R, ox, oy)); }
      seg(pts);
    }
    for (let i = 0; i < 16; i++) {
      const lon = i / 16 * 6.2832, pts = [];
      for (let j = 0; j <= 48; j++) { const la = -Math.PI / 2 + j / 48 * Math.PI; pts.push(proj(Math.cos(la) * Math.cos(lon), Math.sin(la), Math.cos(la) * Math.sin(lon), a, b, R, ox, oy)); }
      seg(pts);
    }
    const tilt = .35, ring = rad => {
      const pts = [];
      for (let j = 0; j <= 90; j++) { const th = j / 90 * 6.2832, x = rad * Math.cos(th); pts.push(proj(x * Math.cos(tilt), x * Math.sin(tilt), rad * Math.sin(th), a * .4, b, R, ox, oy)); }
      seg(pts);
    };
    ring(1.7); ring(2.3);
    ctx.lineWidth = 1.2;
    [.14, .4, .9].forEach((o, i) => { ctx.strokeStyle = `rgba(94,231,255,${o * alpha})`; ctx.stroke(B[i]); });
    const th = t * .6, x = 2.3 * Math.cos(th);
    const m = proj(x * Math.cos(tilt), x * Math.sin(tilt), 2.3 * Math.sin(th), a * .4, b, R, ox, oy);
    ctx.fillStyle = `rgba(255,191,122,${alpha})`; ctx.shadowColor = '#ffbf7a'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(m[0], m[1], Math.max(3, R * .035), 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  }

  function label(x, y, p, hot) {
    const txt = `${p.n} ${p.name}` + (p.seen ? ' ✓' : '') + (hot ? (ready(p) ? ' - click to open' : ' - click to zoom in') : '');
    const sub = hot && p.t ? p.t : '';
    ctx.font = '12px "Space Mono", monospace'; ctx.textAlign = 'center';
    const w = Math.max(ctx.measureText(txt).width, sub ? ctx.measureText(sub).width : 0) + 16;
    ctx.fillStyle = 'rgba(4,5,14,.82)'; ctx.fillRect(x - w / 2, y - 13, w, sub ? 40 : 21);
    ctx.fillStyle = hot ? '#5ee7ff' : p.seen ? '#ffbf7a' : '#eaf1ff'; ctx.fillText(txt, x, y + 2);
    if (sub) { ctx.fillStyle = '#aab6dd'; ctx.fillText(sub, x, y + 20); }
  }

  // Shaded section planets with bands, craters, rings, or a moon
  function sphere(p, i) {
    const x = X(wx(p)), y = Y(wy(p)), r = wr(p) * zoom;
    if (x < -r * 3 || x > W + r * 3 || y < -r * 3 || y > H + r * 3) return;
    const hot = hover === i;
    ctx.save(); ctx.globalAlpha = ea;
    const gl = ctx.createRadialGradient(x, y, r * .8, x, y, r * 1.7);
    gl.addColorStop(0, p.c[1] + '66'); gl.addColorStop(1, p.c[1] + '00');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 1.7, 0, 7); ctx.fill();
    const ring = (a0, a1) => {
      ctx.strokeStyle = p.c[0];
      [[1.55, .07, .55], [1.75, .12, .85], [2, .05, .5]].forEach(([k, w, o]) => { ctx.globalAlpha = ea * o; ctx.lineWidth = Math.max(1, r * w); ctx.beginPath(); ctx.ellipse(x, y, r * k, r * k * .27, -.35, a0, a1); ctx.stroke(); });
      ctx.globalAlpha = ea;
    };
    if (p.ring) ring(Math.PI, 6.2832);
    drawWorld(p.w, x, y, r, t * .012 * (1 + i * .25)); ctx.globalAlpha = ea;
    if (p.ring) ring(0, Math.PI);
    if (p.moon) { const a = t * .8; ctx.fillStyle = '#e9eefc'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 1.8, y + Math.sin(a) * r * .5, r * .16, 0, 7); ctx.fill(); }
    if (hot) { ctx.strokeStyle = '#5ee7ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 1.12, 0, 7); ctx.stroke(); }
    label(x, y + r * (p.ring ? 1.45 : 1.25) + 14, p, hot);
    ctx.restore();
  }

  function rock(q) {
    const d = q.z, zf = 1 + (zoom - 1) * d;
    const x = W / 2 + wrap(q.x * F - pan.x * d - mx * 70 * d, F) * zf, y = H / 2 + wrap(q.y * F - pan.y * d - sy * .2 * d, F) * zf;
    const r = q.r * zf * (.5 + d * .6), a = q.a + t * q.w;
    if (x < -r * 2 || x > W + r * 2 || y < -r * 2 || y > H + r * 2) return;
    ctx.beginPath();
    q.poly.forEach((p, i) => {
      const px = x + (p[0] * Math.cos(a) - p[1] * Math.sin(a)) * r, py = y + (p[0] * Math.sin(a) + p[1] * Math.cos(a)) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath();
    ctx.globalAlpha = (.55 + .45 * ea) * (.5 + d * .5);
    const rg = ctx.createLinearGradient(x - r, y - r, x + r, y + r); rg.addColorStop(0, '#9a9fc4'); rg.addColorStop(1, '#12152a'); ctx.fillStyle = rg; ctx.fill(); ctx.strokeStyle = '#5a638f'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(x + r * .15, y - r * .1, r * .25, 0, 7); ctx.fill();
  }

  function alienHead(x, y, r) {
    ctx.fillStyle = '#7dff9a'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.15, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#04121a';
    [-1, 1].forEach(k => { ctx.beginPath(); ctx.ellipse(x + k * r * .42, y - r * .05, r * .26, r * .4, k * .5, 0, 6.2832); ctx.fill(); });
  }

  function ent(e, i) {
    const a = t * e.sp + e.ph;
    const x = X(e.cx * S + Math.cos(a) * e.rx * S), y = Y(e.cy * S + Math.sin(a) * e.ry * S), s = e.s * S * zoom;
    e.sx = x; e.sy = y; e.sr = s * 1.4;
    const al = i === 0 ? Math.max(ea, .6 * (1 - pp)) : ea;
    if (al < .02 || x < -s * 3 || x > W + s * 3 || y < -s * 3 || y > H + s * 3) return;
    ctx.save(); ctx.globalAlpha = al;
    if (e.k === 'ufo') {
      if (Math.sin(t * .9 + e.ph) > .5) {
        const g = ctx.createLinearGradient(x, y, x, y + s * 3);
        g.addColorStop(0, 'rgba(160,255,200,.5)'); g.addColorStop(1, 'rgba(160,255,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - s * .5, y + s * .3); ctx.lineTo(x + s * .5, y + s * .3); ctx.lineTo(x + s * 1.3, y + s * 3); ctx.lineTo(x - s * 1.3, y + s * 3); ctx.fill();
      }
      ctx.fillStyle = 'rgba(150,230,255,.35)'; ctx.beginPath(); ctx.ellipse(x, y - s * .1, s * .65, s * .6, 0, Math.PI, 6.2832); ctx.fill();
      alienHead(x, y - s * .22, s * .36);
      const g2 = ctx.createLinearGradient(x, y - s * .3, x, y + s * .4);
      g2.addColorStop(0, '#e4e9ff'); g2.addColorStop(1, '#6a739f');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(x, y, s * 1.3, s * .38, 0, 0, 6.2832); ctx.fill();
      for (let k = -1; k <= 1; k++) { ctx.fillStyle = (Math.floor(t * 3) + k) % 2 ? '#ffbf7a' : '#5ee7ff'; ctx.beginPath(); ctx.arc(x + k * s * .7, y + s * .05, s * .09, 0, 7); ctx.fill(); }
    } else {
      const bob = Math.sin(t * 2 + e.ph) * s * .15, wave = Math.sin(t * 4 + e.ph) * s * .25;
      ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = Math.max(1, s * .08);
      ctx.beginPath();
      ctx.moveTo(x - s * .3, y - s * 1 + bob); ctx.lineTo(x - s * .55, y - s * 1.5 + bob);
      ctx.moveTo(x + s * .3, y - s * 1 + bob); ctx.lineTo(x + s * .55, y - s * 1.5 + bob);
      ctx.moveTo(x + s * .3, y + s * .3 + bob); ctx.lineTo(x + s * .8, y + s * .1 + bob + wave);
      ctx.moveTo(x - s * .3, y + s * .3 + bob); ctx.lineTo(x - s * .8, y + s * .6 + bob);
      ctx.stroke();
      ctx.fillStyle = '#ffbf7a';
      [-1, 1].forEach(k => { ctx.beginPath(); ctx.arc(x + k * s * .55, y - s * 1.5 + bob, s * .1, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#5ed97a'; ctx.beginPath(); ctx.ellipse(x, y + s * .55 + bob, s * .38, s * .6, 0, 0, 6.2832); ctx.fill();
      alienHead(x, y - s * .35 + bob, s * .6);
    }
    if (e.say > 0) {
      e.say -= DT;
      ctx.font = '12px "Space Mono", monospace'; ctx.textAlign = 'center';
      const w = ctx.measureText(e.msg).width + 16;
      ctx.fillStyle = '#eaf1ff'; ctx.fillRect(x - w / 2, y - s * 2.6 - 12, w, 22);
      ctx.fillStyle = '#04050e'; ctx.fillText(e.msg, x, y - s * 2.6 + 3);
    }
    ctx.restore();
  }

  function floor(off, alpha) {
    if (alpha < .02) return;
    const hy = H * .64, vx = W / 2 - tx * 50;
    ctx.lineWidth = 1; ctx.strokeStyle = `rgba(94,231,255,${.2 * alpha})`;
    ctx.beginPath();
    for (let i = -16; i <= 16; i++) { ctx.moveTo(vx + i * W * .012, hy); ctx.lineTo(vx + i * W * .14, H); }
    ctx.stroke();
    for (let k = 0; k < 14; k++) {
      const p = ((k + off) % 14) / 14, y = hy + (H - hy) * p * p;
      ctx.strokeStyle = `rgba(94,231,255,${.28 * p * alpha})`;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // ---------- Main loop ----------
  function frame(ms) {
    DT = Math.min((ms - last) / 1000, .05); last = ms;
    if (on) t += DT;
    mx = lerp(mx, tx, .06); my = lerp(my, ty, .06);
    document.documentElement.style.setProperty('--mx', mx.toFixed(3)); document.documentElement.style.setProperty('--my', my.toFixed(3));
    F = 3 * Math.max(W, H);
    const LIM = 1.8 * S, cx = W / 2, cy = H / 2;
    ea = lerp(ea, explore ? 1 : 0, .08);

    if (explore) {
      if (fly) {
        pan.x = lerp(pan.x, fly.x, .07); pan.y = lerp(pan.y, fly.y, .07); zoom = lerp(zoom, tz, .07);
        if (Math.abs(pan.x - fly.x) + Math.abs(pan.y - fly.y) < 1 && Math.abs(zoom - tz) < .01) { fly = null; wp = { x: pan.x, y: pan.y }; fx = cx; fy = cy; }
      } else if (Math.abs(tz - zoom) > .0005) {
        zoom += (tz - zoom) * .14;
        pan.x = clamp(wp.x - (fx - cx) / zoom, -LIM, LIM); pan.y = clamp(wp.y - (fy - cy) / zoom, -LIM, LIM);
      }
    } else { zoom += (tz - zoom) * .14; pan.x *= .9; pan.y *= .9; }
    pp = lerp(pp, explore ? 0 : clamp(sy / (H * .9), 0, 1), .1);

    ctx.clearRect(0, 0, W, H);
    ctx.save(); ctx.translate(cx - pan.x * .05, cy - pan.y * .05); ctx.rotate(-.45);
    const mg = ctx.createLinearGradient(0, -.35 * S, 0, .35 * S);
    mg.addColorStop(0, 'rgba(120,140,255,0)'); mg.addColorStop(.5, 'rgba(215,195,255,.11)'); mg.addColorStop(1, 'rgba(120,140,255,0)');
    ctx.fillStyle = mg; ctx.fillRect(-W * 1.5, -.35 * S, W * 3, .7 * S); ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    for (const n of nebs) {
      const d = .15, zf = 1 + (zoom - 1) * d, x = cx + wrap(n.x - pan.x * d, F) * zf, y = cy + wrap(n.y - pan.y * d, F) * zf, r = n.r * zf * 1.5;
      ctx.globalAlpha = explore ? .55 : .35; ctx.drawImage(n.tex, x - r, y - r, r * 2, r * 2);
    }
    // A distant sun in the top-left: every planet is lit from that direction
    const sx0 = W * .05 - pan.x * .3, sy0 = H * .05 - pan.y * .3, sg = ctx.createRadialGradient(sx0, sy0, 0, sx0, sy0, S * .6);
    sg.addColorStop(0, 'rgba(255,244,214,.9)'); sg.addColorStop(.08, 'rgba(255,214,150,.45)'); sg.addColorStop(.3, 'rgba(255,170,90,.12)'); sg.addColorStop(1, 'rgba(255,140,60,0)');
    ctx.globalAlpha = explore ? 1 : .7; ctx.fillStyle = sg; ctx.fillRect(sx0 - S, sy0 - S, S * 2, S * 2);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    floor(t * .5 + sy * .004, (1 - pp * .6) * clamp(2 - zoom, 0, 1) * (1 - ea));

    for (const q of stars) {
      if (on) { q.y -= q.s * q.z * DT; if (q.y < 0) q.y += 1; }
      const d = q.z, zf = 1 + (zoom - 1) * d;
      const x = cx + wrap(q.x * F - pan.x * d - mx * 70 * d, F) * zf, y = cy + wrap(q.y * F - pan.y * d - sy * .2 * d, F) * zf;
      if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
      ctx.globalAlpha = .25 + .75 * q.z * (.6 + .4 * Math.sin(t * 2 + q.p));
      ctx.fillStyle = q.c;
      ctx.beginPath(); ctx.arc(x, y, Math.max(.55, q.z * 1.7 * Math.sqrt(zf)), 0, 7); ctx.fill();
      if (q.big) { const L = 7 + q.z * 8; ctx.strokeStyle = q.c; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - L, y); ctx.lineTo(x + L, y); ctx.moveTo(x, y - L); ctx.lineTo(x, y + L); ctx.stroke(); }
    }
    for (const q of rocks) { if (on) q.x = (q.x + q.vx * DT + 1) % 1; rock(q); }
    ctx.globalAlpha = 1;

    if (ea > .02) {
      ctx.save(); ctx.globalAlpha = ea * .55; ctx.strokeStyle = '#5ee7ff'; ctx.lineWidth = 1; ctx.setLineDash([6, 10]); ctx.lineDashOffset = -t * 18;
      PL.forEach((p, i) => { if (!i) return; ctx.beginPath(); ctx.moveTo(X(0), Y(wy(PL[0]))); ctx.lineTo(X(wx(p)), Y(wy(p))); ctx.stroke(); });
      ctx.restore();
      PL.forEach((p, i) => { if (i) sphere(p, i); });
    }

    // Home planet: large in the middle, drifts aside as you scroll the page
    const R = lerp(.3 * S, .15 * S, pp) * zoom, bx = lerp(0, W * .3, pp), by = lerp(H * .46, H * .34, pp) - cy;
    const px = cx + (bx - pan.x) * zoom - mx * 30, py = cy + (by - pan.y) * zoom - my * 20;
    ctx.globalAlpha = lerp(.6, 1, ea) * (1 - pp * .45); drawWorld(PL[0].w, px, py, R, t * .01 + sy * .0003 + spin * .05); ctx.globalAlpha = 1;
    planet(px, py, R, t * .22 + sy * .0015 + mx * 1.1 + spin, .4 + my * .5, lerp(1, .4, pp) * .5);
    if (ea > .02) {
      ctx.save(); ctx.globalAlpha = ea;
      if (hover === 0) { ctx.strokeStyle = '#5ee7ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, R * 1.08, 0, 7); ctx.stroke(); }
      label(px, py + R * 1.5 + 14, PL[0], hover === 0); ctx.restore();
    }

    ents.forEach(ent);

    if (!comet && rnd() < .004) comet = { x: rnd() * W * .6, y: rnd() * H * .4, vx: 500 + rnd() * 400, vy: 150 + rnd() * 200, l: 1 };
    if (comet) {
      comet.x += comet.vx * DT; comet.y += comet.vy * DT; comet.l -= DT * .8;
      const g = ctx.createLinearGradient(comet.x, comet.y, comet.x - comet.vx * .15, comet.y - comet.vy * .15);
      g.addColorStop(0, `rgba(255,255,255,${Math.max(comet.l, 0)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(comet.x, comet.y); ctx.lineTo(comet.x - comet.vx * .15, comet.y - comet.vy * .15); ctx.stroke();
      if (comet.l <= 0) comet = null;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Explore mode ----------
  const xb = document.getElementById('explore'), hud = document.getElementById('xhud');
  const sheet = document.getElementById('sheet'), sbody = document.getElementById('sbody'), sclose = document.getElementById('sclose');
  const shell = document.querySelectorAll('main, footer, nav'), header = document.querySelector('header');
  let prevFocus = null;
  const overview = () => clamp(Math.min(W / (2 * 1.55 * S), H / (2 * 1.2 * S)), .2, .7);

  function zoomAt(f, px, py) {
    fly = null;
    wp = { x: pan.x + (px - W / 2) / zoom, y: pan.y + (py - H / 2) / zoom };
    fx = px; fy = py; tz = clamp(tz * f, .2, 8);
  }
  function flyTo(i) { focus = i; fly = { x: wx(PL[i]), y: wy(PL[i]) }; tz = i ? 3.2 : 1.4; }
  function home() { focus = 0; fly = { x: 0, y: 0 }; tz = overview(); }

  function openSheet(id) {
    const src = document.getElementById(id), p = PL.find(q => q.id === id);
    p.seen = true; btns[PL.indexOf(p)].classList.add('seen');
    const n = PL.filter(q => q.seen).length; prog.textContent = n === PL.length ? 'All 6 visited, nice!' : n + '/6 visited';
    const nodes = [];
    if (id === 'about') { nodes.push(src.querySelector('.portrait').cloneNode(true), src.querySelector('.intro').cloneNode(true)); }
    else nodes.push(src.cloneNode(true));
    nodes.forEach(c => {
      c.removeAttribute('id'); c.removeAttribute('aria-labelledby');
      c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      c.querySelectorAll('.hello').forEach(n => n.remove());
    });
    sbody.replaceChildren(...nodes);
    sheet.setAttribute('aria-label', p.name);
    prevFocus = document.activeElement;
    sheet.hidden = false; header.inert = true; hud.inert = true;
    sclose.focus();
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true; header.inert = false; hud.inert = false;
    if (prevFocus && prevFocus.focus) prevFocus.focus();
  }
  sclose.onclick = closeSheet;
  sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

  function setExplore(v) {
    explore = v;
    document.body.classList.toggle('explore', v);
    shell.forEach(e => { e.inert = v; });
    hud.hidden = !v;
    xb.textContent = v ? 'Exit' : 'Explore';
    xb.setAttribute('aria-pressed', String(v));
    hover = -1; cv.style.cursor = '';
    if (v) { pan.x = pan.y = 0; zoom = 1; home(); }
    else { closeSheet(); tz = 1; fly = null; }
  }
  xb.onclick = () => setExplore(!explore);

  // On-screen controls: zoom buttons and one button per planet
  const btns = [], prog = document.createElement('span'); prog.className = 'xprog'; prog.textContent = '0/6 visited';
  const xn = document.createElement('div'); xn.className = 'xnav';
  PL.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = p.n; b.title = p.name; b.setAttribute('aria-label', 'Fly to ' + p.name);
    b.onclick = () => { if (focus === i && !fly && ready(p)) openSheet(p.id); else flyTo(i); };
    btns.push(b); xn.append(b);
  });
  hud.append(xn, prog);
  document.getElementById('zin').onclick = () => zoomAt(1.5, W / 2, H / 2);
  document.getElementById('zout').onclick = () => zoomAt(1 / 1.5, W / 2, H / 2);
  document.getElementById('zreset').onclick = home;

  addEventListener('keydown', e => {
    if (!explore) return;
    if (e.key === 'Escape') { if (!sheet.hidden) closeSheet(); else setExplore(false); return; }
    if (!sheet.hidden) return;
    if (e.key === '+' || e.key === '=') zoomAt(1.4, W / 2, H / 2);
    if (e.key === '-') zoomAt(1 / 1.4, W / 2, H / 2);
  });

  // Picking: UFOs and aliens first, then planets
  function pick(px, py) {
    if (!explore || ea < .5) return null;
    for (const e of ents) if (e.sx !== undefined && Math.hypot(px - e.sx, py - e.sy) < Math.max(e.sr, 14)) return { e };
    for (let i = PL.length - 1; i >= 0; i--) {
      const p = PL[i], r = wr(p) * zoom * 1.12;
      if (Math.hypot(px - X(wx(p)), py - Y(wy(p))) < Math.max(r, 12)) return { i };
    }
    return null;
  }
  function click(px, py) {
    const h = pick(px, py);
    if (!h) return;
    if (h.e) { h.e.say = 2.5; h.e.msg = lines[rnd() * lines.length | 0]; }
    else if (ready(PL[h.i])) openSheet(PL[h.i].id);
    else flyTo(h.i);
  }

  cv.addEventListener('wheel', e => { if (!explore) return; e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, { passive: false });
  const ptrs = new Map(); let pd = 0, down = null;
  const dist = () => { const v = [...ptrs.values()]; return Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); };
  cv.addEventListener('pointerdown', e => {
    if (!explore) return;
    cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    down = ptrs.size === 1 ? { x: e.clientX, y: e.clientY } : null;
    if (ptrs.size === 2) pd = dist();
  });
  cv.addEventListener('pointermove', e => {
    if (!explore) return;
    if (!ptrs.has(e.pointerId)) {
      const h = pick(e.clientX, e.clientY);
      hover = h && h.i !== undefined ? h.i : -1; cv.style.cursor = h ? 'pointer' : '';
      return;
    }
    const o = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down = null;
    if (ptrs.size === 1 && !down) {
      fly = null;
      const LIM = 1.8 * S;
      pan.x = clamp(pan.x - (e.clientX - o[0]) / zoom, -LIM, LIM); pan.y = clamp(pan.y - (e.clientY - o[1]) / zoom, -LIM, LIM);
      spin += (e.clientX - o[0]) * .004;
      wp = { x: pan.x + (fx - W / 2) / zoom, y: pan.y + (fy - H / 2) / zoom };
    } else if (ptrs.size === 2) {
      const v = [...ptrs.values()], nd = dist();
      zoomAt(nd / pd, (v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2); pd = nd;
    }
  });
  cv.addEventListener('pointerup', e => {
    if (explore && down && ptrs.size === 1) { const h = pick(e.clientX, e.clientY); if (h) { hover = h.i !== undefined ? h.i : -1; } click(e.clientX, e.clientY); }
    down = null; ptrs.delete(e.pointerId);
  });
  cv.addEventListener('pointercancel', e => { down = null; ptrs.delete(e.pointerId); });

  // ---------- Motion button, typewriter, zone label ----------
  const btn = document.getElementById('motion');
  const sync = () => { btn.textContent = 'Motion: ' + (on ? 'on' : 'off'); btn.setAttribute('aria-pressed', String(on)); };
  btn.onclick = () => { on = !on; sync(); };
  sync();

  const el = document.getElementById('typed'), msg = 'Hello, world.';
  if (el && on) {
    el.textContent = ''; let i = 0;
    (function tick() { el.textContent = msg.slice(0, ++i); if (i < msg.length) setTimeout(tick, 110); })();
  }

  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll('main > section.panel').forEach(s => rv.observe(s));

  const zones = { about: 'Home orbit', education: 'Flight school', achievements: 'Medal bay', skills: 'Toolkit', projects: 'Mission control', values: 'Flight code' };
  const ids = Object.keys(zones), zEl = document.getElementById('zone'), links = document.querySelectorAll('nav a');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    zEl.textContent = `Zone 0${ids.indexOf(e.target.id) + 1} — ${zones[e.target.id]}`;
    links.forEach(a => a.getAttribute('href') === '#' + e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  }), { rootMargin: '-40% 0px -55% 0px' });
  ids.forEach(id => io.observe(document.getElementById(id)));
})();