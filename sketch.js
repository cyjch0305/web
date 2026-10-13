// ====== HOME页面 p5实例（莫兰迪球体涟漪｜滑块控制速度）======
const homeSketch = (p) => {
  const MORANDI = [
    [210, 22, 72],
    [95, 28, 68],
    [350, 22, 84],
    [45, 26, 82],
    [265, 18, 74],
    [20, 24, 78],
    [155, 18, 72]
  ];
  let orbs = [];
  let ripples = [];
  let seedVal = 0;
  let time = 0;
  let bg;
  let bgCol;
  let speedScale = 0.4;

  p.setup = () => {
    const cnv = p.createCanvas(600, 600);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.frameRate(60);
    bgCol = [48, 10, 96];
    makeBg(bgCol);
    reseed();
  };

  p.draw = () => {
    p.image(bg, 0, 0);
    time += 0.006;
    // 滑块：0~100 → 0 ~ 1.0 速度倍率
    speedScale = Number(document.getElementById("randomness").value) / 100;

    // Collision
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        let a = orbs[i], b = orbs[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let dist = p.sqrt(dx * dx + dy * dy);
        let minDist = a.r + b.r;
        if (dist < minDist) {
          let nx, ny;
          if (dist > 0.001) { nx = dx / dist; ny = dy / dist; }
          else { nx = 1; ny = 0; }

          let overlap = (minDist - dist) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;

          let va = a.vx * nx + a.vy * ny;
          let vb = b.vx * nx + b.vy * ny;
          a.vx += (vb - va) * nx; a.vy += (vb - va) * ny;
          b.vx += (va - vb) * nx; b.vy += (va - vb) * ny;

          if (a.hitCool <= 0 && b.hitCool <= 0) {
            a.col = p.random(MORANDI);
            b.col = p.random(MORANDI);
            a.hitCool = 20;
            b.hitCool = 20;

            let mx = (a.x + b.x) / 2;
            let my = (a.y + b.y) / 2;
            let baseCol = [(a.col[0] + b.col[0]) / 2, 58, 72];
            for (let k = 0; k < 3; k++) {
              ripples.push({
                x: mx,
                y: my,
                r: 10 + k * 22,
                alpha: 100 - k * 20,
                speed: 3.2 + k * 1.0,
                col: baseCol
              });
            }
          }
        }
      }
    }

    for (let i = 0; i < orbs.length; i++) {
      let o = orbs[i];
      if (o.hitCool > 0) o.hitCool--;

      // 噪声漂移（固定强度，不再受滑块控制）
      o.vx += (p.noise(i * 3.7, time) - 0.5) * 0.1;
      o.vy += (p.noise(i * 3.7 + 100, time) - 0.5) * 0.1;

      let sp = p.sqrt(o.vx * o.vx + o.vy * o.vy);
      let maxSp = 3.5 * speedScale; // 最大速度随滑块缩放
      if (sp > maxSp) {
        o.vx = o.vx / sp * maxSp;
        o.vy = o.vy / sp * maxSp;
      }

      // 移动距离乘以速度倍率
      o.x += o.vx * speedScale;
      o.y += o.vy * speedScale;

      if (o.x < o.r) { o.x = o.r; o.vx = -o.vx; }
      if (o.x > p.width - o.r) { o.x = p.width - o.r; o.vx = -o.vx; }
      if (o.y < o.r) { o.y = o.r; o.vy = -o.vy; }
      if (o.y > p.height - o.r) { o.y = p.height - o.r; o.vy = -o.vy; }

      p.fill(o.col[0], o.col[1], o.col[2], 92);
      p.noStroke();
      p.circle(o.x, o.y, o.r * 2);
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      let rp = ripples[i];
      rp.r += rp.speed;
      rp.alpha -= 3;
      if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }
      p.noFill();
      p.stroke(rp.col[0], rp.col[1], rp.col[2], rp.alpha);
      p.strokeWeight(2);
      p.circle(rp.x, rp.y, rp.r * 2);
    }
  };

  p.mousePressed = () => {
    if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
    bgCol = pickBgColor();
    makeBg(bgCol);
  };

  p.keyPressed = () => {
    if (p.key === 'r' || p.key === 'R') {
      reseed();
    }
  };

  function pickBgColor() {
    let count = {};
    for (let i = 0; i < MORANDI.length; i++) count[i] = 0;
    for (let i = 0; i < orbs.length; i++) {
      let idx = MORANDI.findIndex(c => c[0] === orbs[i].col[0] && c[1] === orbs[i].col[1] && c[2] === orbs[i].col[2]);
      if (idx >= 0) count[idx]++;
    }
    let unused = MORANDI.filter((c, i) => count[i] === 0);
    let pool = unused.length > 0
      ? unused
      : MORANDI.filter((c, i) => count[i] === Math.min(...Object.values(count)));

    pool = pool.filter(c => !(c[0] === bgCol[0] && c[1] === bgCol[1] && c[2] === bgCol[2]));
    if (pool.length === 0) pool = MORANDI.filter(c => !(c[0] === bgCol[0] && c[1] === bgCol[1] && c[2] === bgCol[2]));
    return p.random(pool);
  }

  function makeBg(c) {
    bg = p.createGraphics(p.width, p.height);
    let s = c[1] * 0.5;
    let top = p.color(c[0], s, p.min(100, c[2] + 14));
    let bottom = p.color(c[0], s, p.min(100, c[2] + 4));
    for (let y = 0; y < p.height; y++) {
      let col = p.lerpColor(top, bottom, y / p.height);
      bg.stroke(col);
      bg.line(0, y, p.width, y);
    }
  }

  function reseed() {
    seedVal = p.random(10000);
    p.randomSeed(seedVal);
    p.noiseSeed(seedVal);
    ripples = [];
    orbs = [];
    for (let i = 0; i < 14; i++) {
      orbs.push({
        x: p.random(p.width),
        y: p.random(p.height),
        vx: p.random(-1.5, 1.5),
        vy: p.random(-1.5, 1.5),
        r: p.random(12, 26),
        col: p.random(MORANDI),
        hitCool: 0
      });
    }
    let used = new Set();
    for (let i = 0; i < orbs.length; i++) used.add(orbs[i].col);
    let matchBg = false;
    for(let o of orbs) {
      if(o.col[0] === bgCol[0] && o.col[1] === bgCol[1] && o.col[2] === bgCol[2]) matchBg=true;
    }
    if (matchBg) {
      bgCol = pickBgColor();
      makeBg(bgCol);
    }
    document.getElementById("seedInfo").innerText = `Seed: ${seedVal.toFixed(1)}`;
  }

  // bind button
  document.getElementById("regenerateSeed").onclick = reseed;
};

// ====== Art Demo 页面 旧粒子p5实例 ======
const demoSketch = (p) => {
  let demoParticles = [];
  let aiPalette = [];
  let mode = 'memoryParticles';

  function generateAIPalette() {
    let palette = [];
    let baseHue = p.random(360);
    palette.push(p.color(baseHue, 70, 80));
    palette.push(p.color((baseHue + 40) % 360, 65, 75));
    palette.push(p.color((baseHue + 180) % 360, 60, 70));
    palette.push(p.color((baseHue + 220) % 360, 50, 65));
    return palette;
  }

  p.setup = () => {
    aiPalette = generateAIPalette();
    let demoCanvas = p.createCanvas(p.windowWidth * 0.75, 400);

    for (let i = 0; i < 120; i++) {
      demoParticles.push(new Particle(p));
    }
  };

  p.draw = () => {
    if (document.getElementById('artworkdemo').classList.contains('active')) {
      if (mode === 'memoryParticles') {
        p.background(0, 12);
        for (let pcl of demoParticles) {
          pcl.update(false);
          pcl.display();
        }
      }
      if (mode === 'echoTrails') {
        p.background(0, 8);
        for (let pcl of demoParticles) {
          pcl.update(false);
          pcl.displayEcho();
        }
      }
      if (mode === 'aiColorFields') {
        p.background(0, 10);
        for (let pcl of demoParticles) {
          pcl.update(false);
          pcl.displayField();
        }
      }
      if (mode === 'noiseDrift') {
        p.background(0, 15);
        for (let pcl of demoParticles) {
          pcl.updateDrift();
          pcl.displayDrift();
        }
      }
    }
  };

  class Particle {
    constructor(_p) {
      this.p = _p;
      this.x = _p.random(_p.width);
      this.y = _p.random(_p.height);
      this.vx = _p.random(-1, 1);
      this.vy = _p.random(-1, 1);
      this.size = _p.random(3, 10);
      this.c = _p.random(aiPalette);
      this.prevX = this.x;
      this.prevY = this.y;
    }

    update(isHero) {
      this.prevX = this.x;
      this.prevY = this.y;
      let dx = this.p.mouseX - this.x;
      let dy = this.p.mouseY - this.y;

      if (mode === 'memoryParticles' || isHero) {
        this.vx += dx * 0.0004;
        this.vy += dy * 0.0004;
      }
      if (mode === 'echoTrails') {
        this.vx += dx * 0.0002;
        this.vy += dy * 0.0002;
      }
      if (mode === 'aiColorFields') {
        this.vx += dx * 0.00015;
        this.vy += dy * 0.00015;
      }
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.96;
      this.vy *= 0.96;

      if (this.x < 0) this.x = this.p.width;
      if (this.x > this.p.width) this.x = 0;
      if (this.y < 0) this.y = this.p.height;
      if (this.y > this.p.height) this.y = 0;
    }

    updateDrift() {
      this.prevX = this.x;
      this.prevY = this.y;
      let dx = this.p.mouseX - this.x;
      let dy = this.p.mouseY - this.y;
      this.vx += this.p.noise(this.x * 0.01, this.y * 0.01) * 0.3;
      this.vy += this.p.noise(this.x * 0.01 + 100, this.y * 0.01) * 0.3;
      this.vx += dx * 0.0001;
      this.vy += dy * 0.0001;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.98;
      this.vy *= 0.98;
      if (this.x < 0) this.x = this.p.width;
      if (this.x > this.p.width) this.x = 0;
      if (this.y < 0) this.y = this.p.height;
      if (this.y > this.p.height) this.y = 0;
    }

    display() {
      this.p.noStroke();
      this.p.fill(this.c, 100);
      this.p.ellipse(this.x, this.y, this.size);
    }
    displayEcho() {
      this.p.stroke(this.c, 60);
      this.p.strokeWeight(2);
      this.p.line(this.prevX, this.prevY, this.x, this.y);
    }
    displayField() {
      this.p.noStroke();
      this.p.fill(this.c, 70);
      this.p.ellipse(this.x, this.y, this.size * 2.5);
    }
    displayDrift() {
      this.p.stroke(this.c, 40);
      this.p.strokeWeight(1);
      this.p.line(this.prevX, this.prevY, this.x, this.y);
    }
  }

  p.mousePressed = () => {
    if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      aiPalette = generateAIPalette();
      for (let pcl of demoParticles) {
        pcl.c = p.random(aiPalette);
      }
    }
  };

  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.demo;
    });
  });
};

// 初始化两个独立p5实例
new p5(homeSketch, 'hero-canvas-container');
new p5(demoSketch, 'demo-canvas-container');
