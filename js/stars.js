// ========== stars.js (atualizado) ==========
const starsCanvas = document.getElementById("stars");
const starsCtx = starsCanvas?.getContext("2d");

// raf-debounce para resize “macio”
function rafDebounce(fn){
  let af = null;
  return (...args) => {
    if (af) cancelAnimationFrame(af);
    af = requestAnimationFrame(() => fn(...args));
  };
}

function resizeStars() {
  if (!starsCanvas) return;
  starsCanvas.width  = window.innerWidth;
  starsCanvas.height = window.innerHeight;
}
resizeStars();
window.addEventListener("resize", rafDebounce(resizeStars));

const LAYER_MULT_BASE = { 1: 0.75, 2: 0.36, 3: 0.14 };
const ANGLE_TO_PX_X = () => starsCanvas.width  * 0.025;
const ANGLE_TO_PX_Y = () => starsCanvas.height * 0.020;
let starAngVelX = 0, starAngVelY = 0;
const INPUT_GAIN = 0.42, DAMP = 0.90, MAX_VEL = 0.05;

// reduz intensidade se usuário prefere menos movimento
const prefersReduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
const TWINKLE_MULT = prefersReduce ? 0.4 : 1;
const SHOOTING_PROB = prefersReduce ? 0.002 : 0.005;

function rand(min, max) { return Math.random() * (max - min) + min; }

class Star {
  constructor(layer) {
    this.layer = layer;
    this.x = Math.random() * starsCanvas.width;
    this.y = Math.random() * starsCanvas.height;
    this.isBright = Math.random() < 0.3;
    const sizeMap = { 1: 2, 2: 1.2, 3: 0.6 };
    this.size = Math.random() * sizeMap[layer] + 0.3;
    const spread = {1:0.55,2:0.30,3:0.12}[layer];
    this.depthMult = LAYER_MULT_BASE[layer] * rand(1 - spread, 1 + spread);
    this.response = rand(0.08, 0.16); this.damping  = rand(0.88, 0.94);
    this.ampX = rand(0.05, 0.25); this.ampY = rand(0.05, 0.20);
    this.freqX = rand(0.2, 0.6); this.freqY = rand(0.2, 0.6);
    this.phaseX = Math.random() * Math.PI * 2; this.phaseY = Math.random() * Math.PI * 2;
    this.vx = 0; this.vy = 0;
    this.twinklePhase = Math.random() * Math.PI * 2; this.twinkleSpeed = (Math.random() * 0.02 + 0.005) * TWINKLE_MULT;
    this.blinkTimer = 0; this.blinkCooldown = Math.random() * 30 + 20;
  }
  step(gx, gy, t) {
    const targetVX = gx * ANGLE_TO_PX_X() * this.depthMult;
    const targetVY = gy * ANGLE_TO_PX_Y() * this.depthMult;
    this.vx += (targetVX - this.vx) * this.response; this.vx *= this.damping;
    this.vy += (targetVY - this.vy) * this.response; this.vy *= this.damping;
    const dx = Math.sin(this.freqX * t + this.phaseX) * this.ampX;
    const dy = Math.cos(this.freqY * t + this.phaseY) * this.ampY;
    this.x += this.vx + dx * 0.01; this.y += this.vy + dy * 0.01;
    if (this.x > starsCanvas.width)  this.x = 0;
    if (this.x < 0)                  this.x = starsCanvas.width;
    if (this.y > starsCanvas.height) this.y = 0;
    if (this.y < 0)                  this.y = starsCanvas.height;
    this.twinklePhase += this.twinkleSpeed;

    const dt = 1/60;
    if (this.blinkTimer > 0) this.blinkTimer -= dt;
    else {
      this.blinkCooldown -= dt;
      if (this.blinkCooldown <= 0 && Math.random() < 0.02) {
        this.blinkTimer = Math.random() * 0.12 + 0.05;
        this.blinkCooldown = Math.random() * 30 + 20;
      }
    }
  }
  draw() {
    let alpha = 0.65 + 0.35 * Math.sin(this.twinklePhase);
    if (this.blinkTimer > 0) alpha *= Math.max(0.1, this.blinkTimer * 3);
    alpha = Math.max(0, Math.min(1, alpha));

    if (this.isBright && alpha > 0.05) {
      starsCtx.save(); starsCtx.globalAlpha = 0.5 * alpha; starsCtx.lineWidth = 0.8;
      starsCtx.strokeStyle = "rgba(255,255,255,0.9)";
      starsCtx.beginPath();
      starsCtx.moveTo(this.x - 4, this.y); starsCtx.lineTo(this.x + 4, this.y);
      starsCtx.moveTo(this.x, this.y - 4); starsCtx.lineTo(this.x, this.y + 4);
      starsCtx.stroke(); starsCtx.restore();
    }

    starsCtx.save();
    starsCtx.beginPath();
    starsCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    starsCtx.fillStyle = `rgba(255,255,255,${alpha})`;
    starsCtx.shadowBlur = 4 + this.size * (this.layer === 1 ? 3 : 2);
    starsCtx.shadowColor = "rgba(255,255,255,0.85)";
    starsCtx.fill();
    starsCtx.restore();
  }
}

class ShootingStar {
  constructor(){ this.reset(); }
  reset(){
    this.x = Math.random() * starsCanvas.width;
    this.y = Math.random() * starsCanvas.height * 0.4;
    this.len = Math.random() * 80 + 50;
    this.speed = Math.random() * 8 + 6;
    this.angle = rand(Math.PI * 0.15, Math.PI * 1.35);
    this.life = 1; this.fadeStart = 0.35; this.active = true;
  }
  update(){ this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; this.life -= 0.007; if (this.life <= 0) this.active = false; }
  draw(){
    if (!starsCtx) return;
    const a = (this.life > this.fadeStart) ? 1 : Math.max(0, (this.life / this.fadeStart));
    const dx = Math.cos(this.angle) * this.len, dy = Math.sin(this.angle) * this.len;
    const g = starsCtx.createLinearGradient(this.x, this.y, this.x - dx, this.y - dy);
    g.addColorStop(0.0, `rgba(255,255,255,${0.95 * a})`);
    g.addColorStop(0.2, `rgba(255,230,150,${0.75 * a})`);
    g.addColorStop(0.5, `rgba(255,180,80,${0.45 * a})`);
    g.addColorStop(1.0, `rgba(255,80,0,0)`);
    starsCtx.save();
    starsCtx.lineWidth = 2; starsCtx.lineCap = "round"; starsCtx.strokeStyle = g;
    starsCtx.beginPath(); starsCtx.moveTo(this.x, this.y); starsCtx.lineTo(this.x - dx, this.y - dy); starsCtx.stroke();
    starsCtx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
    starsCtx.shadowBlur = 10; starsCtx.shadowColor = "rgba(255,255,255,0.9)";
    starsCtx.beginPath(); starsCtx.arc(this.x, this.y, 1.6, 0, Math.PI * 2); starsCtx.fill();
    starsCtx.restore();
  }
}

const stars = [
  ...Array.from({ length: 70 }, () => new Star(1)),
  ...Array.from({ length: 80 }, () => new Star(2)),
  ...Array.from({ length: 100 }, () => new Star(3))
];
let shootingStars = [];
let t2d = 0;
function animateStars(){
  if (!starsCtx) return;
  starsCtx.clearRect(0,0,starsCanvas.width,starsCanvas.height);
  stars.forEach(s => { s.step(starAngVelX, starAngVelY, t2d); s.draw(); });
  starAngVelX *= DAMP; starAngVelY *= DAMP;
  if (Math.abs(starAngVelX) < 0.0002) starAngVelX = 0;
  if (Math.abs(starAngVelY) < 0.0002) starAngVelY = 0;
  shootingStars.forEach(s => { s.update(); s.draw(); });
  shootingStars = shootingStars.filter(s => s.active);
  if (Math.random() < SHOOTING_PROB) shootingStars.push(new ShootingStar());
  t2d += 1/60; requestAnimationFrame(animateStars);
}
requestAnimationFrame(animateStars);

window.setStarVelocity = function(vx, vy) {
  starAngVelX = Math.max(-MAX_VEL, Math.min(MAX_VEL, vx));
  starAngVelY = Math.max(-MAX_VEL, Math.min(MAX_VEL, vy));
};
window.getStarVelocity = function() { return { x: starAngVelX, y: starAngVelY }; };
