// =====================================================================================
// #region INTRO: Texto digitado + Scroll suave
// =====================================================================================
const text = "Eu te disse que ia te dar a lua, ainda não consegui trazer a de verdade, mas te dou essa aqui <3";
let i = 0;
function typeWriter() {
  const el = document.getElementById("typed-text");
  if (!el) return;
  if (i < text.length) {
    el.innerHTML += text.charAt(i++);
    setTimeout(typeWriter, 80);
  }
}
window.addEventListener("load", typeWriter);

function scrollToContent() {
  document.querySelectorAll(".gallery, .timeline, .surprise").forEach(sec => {
    sec.classList.add("visible");
  });
  const first = document.querySelector(".gallery");
  if (first) first.scrollIntoView({ behavior: "smooth" });

  // se a seção dos fogos ficou visível agora, garante o tamanho do canvas
  setTimeout(() => { try { resizeFireworks(); } catch(_){} }, 50);
}
// expõe no escopo global porque o HTML chama onclick
window.scrollToContent = scrollToContent;
// #endregion INTRO
// =====================================================================================



// =====================================================================================
// #region Estrelas
// =====================================================================================
const starsCanvas = document.getElementById("stars");
const starsCtx = starsCanvas?.getContext("2d");

function resizeStars() {
  if (!starsCanvas) return;
  starsCanvas.width  = window.innerWidth;
  starsCanvas.height = window.innerHeight;
}
resizeStars();
window.addEventListener("resize", resizeStars);

// Parallax/movimento global
const LAYER_MULT_BASE = { 1: 0.75, 2: 0.36, 3: 0.14 };
const ANGLE_TO_PX_X = () => starsCanvas.width  * 0.025;
const ANGLE_TO_PX_Y = () => starsCanvas.height * 0.020;
let starAngVelX = 0, starAngVelY = 0;
const INPUT_GAIN = 0.42, DAMP = 0.90, MAX_VEL = 0.05;

function rand(min, max) { return Math.random() * (max - min) + min; }

class Star {
  constructor(layer) {
    this.layer = layer;
    this.x = Math.random() * starsCanvas.width;
    this.y = Math.random() * starsCanvas.height;

    this.isBright = Math.random() < 0.2; // 10% das estrelas ganham "spikes"

    const sizeMap = { 1: 2, 2: 1.2, 3: 0.6 };
    this.size = Math.random() * sizeMap[layer] + 0.3;

    const LAYER_SPREAD = { 1: 0.55, 2: 0.30, 3: 0.12 };
    const spread = LAYER_SPREAD[layer];
    this.depthMult = LAYER_MULT_BASE[layer] * rand(1 - spread, 1 + spread);

    this.response = rand(0.08, 0.16);
    this.damping  = rand(0.88, 0.94);

    this.ampX = rand(0.05, 0.25);
    this.ampY = rand(0.05, 0.20);
    this.freqX = rand(0.2, 0.6);
    this.freqY = rand(0.2, 0.6);
    this.phaseX = Math.random() * Math.PI * 2;
    this.phaseY = Math.random() * Math.PI * 2;

    this.vx = 0;
    this.vy = 0;

    // Cintilação suave
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.02 + 0.005;

    // Piscadas ocasionais
    this.blinkTimer = 0;                    // duração restante da piscada (s)
    this.blinkCooldown = Math.random() * 30 + 20; // 20–50s até a próxima chance
  }

  step(globalVX, globalVY, t) {
    const pxX = ANGLE_TO_PX_X();
    const pxY = ANGLE_TO_PX_Y();

    const targetVX = globalVX * pxX * this.depthMult;
    const targetVY = globalVY * pxY * this.depthMult;

    this.vx += (targetVX - this.vx) * this.response; this.vx *= this.damping;
    this.vy += (targetVY - this.vy) * this.response; this.vy *= this.damping;

    const dx = Math.sin(this.freqX * t + this.phaseX) * this.ampX;
    const dy = Math.cos(this.freqY * t + this.phaseY) * this.ampY;

    this.x += this.vx + dx * 0.01;
    this.y += this.vy + dy * 0.01;

    if (this.x > starsCanvas.width)  this.x = 0;
    if (this.x < 0)                  this.x = starsCanvas.width;
    if (this.y > starsCanvas.height) this.y = 0;
    if (this.y < 0)                  this.y = starsCanvas.height;

    // cintilação
    this.twinklePhase += this.twinkleSpeed;

    // piscadas
    const dt = 1/60;
    if (this.blinkTimer > 0) {
      this.blinkTimer -= dt;
    } else {
      this.blinkCooldown -= dt;
      if (this.blinkCooldown <= 0 && Math.random() < 0.02) {
        // piscada rápida e natural
        this.blinkTimer = Math.random() * 0.12 + 0.05;   // 0.05–0.17s
        this.blinkCooldown = Math.random() * 30 + 20;    // 20–50s
      }
    }
  }

  draw() {
    // brilho base variando (0.65–1.0)
    let alpha = 0.65 + 0.35 * Math.sin(this.twinklePhase);

    // se estiver piscando, reduz o brilho rapidamente
    if (this.blinkTimer > 0) {
      const fade = Math.max(0.1, this.blinkTimer * 3); // cai e volta rápido
      alpha *= fade;
    }

    // segurança: clamp 0..1
    alpha = Math.max(0, Math.min(1, alpha));

    // spikes (cruz) sincronizados ao brilho
    if (this.isBright && alpha > 0.05) {
      starsCtx.save();
      starsCtx.globalAlpha = 0.5 * alpha;
      starsCtx.lineWidth = 0.8;
      starsCtx.strokeStyle = "rgba(255,255,255,0.9)";
      starsCtx.beginPath();
      starsCtx.moveTo(this.x - 4, this.y); starsCtx.lineTo(this.x + 4, this.y);
      starsCtx.moveTo(this.x, this.y - 4); starsCtx.lineTo(this.x, this.y + 4);
      starsCtx.stroke();
      starsCtx.restore();
    }

    // estrela com leve glow (blur proporcional ao tamanho/camada)
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
  constructor() { this.reset(); }

  reset() {
    this.x = Math.random() * starsCanvas.width;
    this.y = Math.random() * starsCanvas.height * 0.4; // surge no topo/superior
    this.len = Math.random() * 80 + 50;
    this.speed = Math.random() * 8 + 6;
    this.angle = rand(Math.PI * 0.15, Math.PI * 1.35); // várias direções
    this.life = 1;             // 1 → 0 durante o voo
    this.fadeStart = 0.35;     // começa a sumir só no terço final
    this.active = true;
  }

  update() {
    // avança posição
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // vida decresce de forma estável
    this.life -= 0.007; // ajuste para duração
    if (this.life <= 0) this.active = false;
  }

  draw() {
    if (!starsCtx) return;

    // alpha constante até o fim (depois faz fade linear)
    const a = (this.life > this.fadeStart)
      ? 1
      : Math.max(0, (this.life / this.fadeStart));

    // ponto de cabeça e cauda
    const dx = Math.cos(this.angle) * this.len;
    const dy = Math.sin(this.angle) * this.len;
    const x2 = this.x - dx;
    const y2 = this.y - dy;

    // gradiente da cauda (sem flicker)
    const g = starsCtx.createLinearGradient(this.x, this.y, x2, y2);
    g.addColorStop(0, `rgba(255,255,255,${0.95 * a})`);
    g.addColorStop(1, `rgba(255,255,255,0)`);

    starsCtx.save();
    starsCtx.lineWidth = 2;
    starsCtx.lineCap = "round";
    starsCtx.strokeStyle = g;
    starsCtx.beginPath();
    starsCtx.moveTo(this.x, this.y);
    starsCtx.lineTo(x2, y2);
    starsCtx.stroke();

    // cabeça brilhante
    starsCtx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
    starsCtx.shadowBlur = 10;
    starsCtx.shadowColor = "rgba(255,255,255,0.9)";
    starsCtx.beginPath();
    starsCtx.arc(this.x, this.y, 1.6, 0, Math.PI * 2);
    starsCtx.fill();
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
function animateStars() {
  if (!starsCtx) return;
  starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
  stars.forEach(star => { star.step(starAngVelX, starAngVelY, t2d); star.draw(); });

  // inércia global
  starAngVelX *= DAMP; starAngVelY *= DAMP;
  if (Math.abs(starAngVelX) < 0.0002) starAngVelX = 0;
  if (Math.abs(starAngVelY) < 0.0002) starAngVelY = 0;

  // cadentes
  shootingStars.forEach(s => { s.update(); s.draw(); });
  shootingStars = shootingStars.filter(s => s.active);
  if (Math.random() < 0.005) shootingStars.push(new ShootingStar());

  t2d += 1/60;
  requestAnimationFrame(animateStars);
}
requestAnimationFrame(animateStars);
// #endregion Estrelas
// =====================================================================================



// =====================================================================================
// #region Lua 3D
// =====================================================================================
(function initMoon(){
  if (!window.THREE) {
    console.error("Three.js não carregou — verifica a tag <script src='https://cdn.jsdelivr.net/.../three.min.js'>.");
    return;
  }
  const moonContainer = document.querySelector(".moon-container");
  const moonCanvas = document.getElementById("moonCanvas");
  if (!moonContainer || !moonCanvas) {
    console.error("Elemento da Lua não encontrado no DOM.");
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas: moonCanvas, alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4);

  function resizeMoon() {
    const w = moonContainer.clientWidth, h = moonContainer.clientHeight;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resizeMoon);
  resizeMoon();

  // luzes
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
  dirLight.position.set(3, 2.5, 4);
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.30);
  fillLight.position.set(-2, -1, -3);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0x404040, 0.45));

  // grupo/mesh
  const moonRoot = new THREE.Group();
  scene.add(moonRoot);

  const loader = new THREE.TextureLoader();

  // fallback procedural (se as imagens não existirem)
  function makeGreyTexture(size=1024){
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    // base cinza
    g.fillStyle = "#c7c7c7"; g.fillRect(0,0,size,size);
    // crateras simples
    g.globalAlpha = 0.25;
    for (let k=0;k<120;k++){
      const r = Math.random()*18+6;
      const x = Math.random()*size;
      const y = Math.random()*size;
      const grd = g.createRadialGradient(x,y,0,x,y,r);
      grd.addColorStop(0,"#777");
      grd.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  let moonTexture, moonBump, aniso = renderer.capabilities.getMaxAnisotropy();

  // tenta carregar; se falhar, usa procedural
  moonTexture = loader.load(
    "assets/moon_texture.jpg",
    tex => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso; },
    undefined,
    () => { moonTexture = makeGreyTexture(); }
  );
  moonBump = loader.load(
    "assets/moon_bump.jpg",
    tex => { tex.anisotropy = aniso; },
    undefined,
    () => { moonBump = makeGreyTexture(); }
  );

  const moonGeom = new THREE.SphereGeometry(1.5, 128, 128);
  const moonMat  = new THREE.MeshPhongMaterial({
    map: moonTexture,
    bumpMap: moonBump,
    bumpScale: 0.035,
    emissive: 0x101010,
    emissiveIntensity: 0.6
  });
  const moon = new THREE.Mesh(moonGeom, moonMat);
  moonRoot.add(moon);

  // drag livre (quaternions) + alimenta o parallax das estrelas
  let isDragging = false, lastX = 0, lastY = 0;
  moonContainer.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    isDragging = true;
    lastX = e.clientX; lastY = e.clientY;
    moonContainer.classList.add("dragging");
    moonContainer.setPointerCapture(e.pointerId);
  });
  moonContainer.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    const SENS = 0.01;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward).normalize();
    const up = camera.up.clone().normalize();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    const qYaw   = new THREE.Quaternion().setFromAxisAngle(up,    dx * SENS);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(right, dy * SENS);
    moonRoot.quaternion.premultiply(qYaw).premultiply(qPitch);

    // alimenta o fundo
    starAngVelX = Math.max(-MAX_VEL, Math.min(MAX_VEL, starAngVelX + (dx * SENS) * INPUT_GAIN));
    starAngVelY = Math.max(-MAX_VEL, Math.min(MAX_VEL, starAngVelY + (dy * SENS) * INPUT_GAIN));

    lastX = e.clientX; lastY = e.clientY;
  });
  function stopDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    moonContainer.classList.remove("dragging");
    try { moonContainer.releasePointerCapture(e.pointerId); } catch {}
  }
  moonContainer.addEventListener("pointerup", stopDrag);
  moonContainer.addEventListener("pointercancel", stopDrag);
  window.addEventListener("pointerup", () => { isDragging = false; moonContainer.classList.remove("dragging"); });

  // loop render
  function loop3D(){
    renderer.render(scene, camera);
    requestAnimationFrame(loop3D);
  }
  requestAnimationFrame(loop3D);
})();
// #endregion Lua 3D
// =====================================================================================

// =====================================================================================
// #region FOGOS_DE_ARTIFÍCIO (versão leve e realista)
// =====================================================================================
const fireworksCanvas = document.getElementById("fireworks");
const fctx = fireworksCanvas?.getContext("2d");

function resizeFireworks() {
  if (!fireworksCanvas) return;
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}
resizeFireworks();
window.addEventListener("resize", resizeFireworks);

function random(min, max) { return Math.random() * (max - min) + min; }

class Particle {
  constructor(x, y, color, speed, angle) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.velX = Math.cos(angle) * speed;
    this.velY = Math.sin(angle) * speed;
    this.life = random(60, 100);
    this.alpha = 1;
  }
  update() {
    this.x += this.velX;
    this.y += this.velY;
    this.velY += 0.05;      // gravidade suave
    this.velX *= 0.985;     // fricção leve
    this.velY *= 0.985;
    this.alpha -= 0.012;    // fade-out
  }
  draw() {
    fctx.save();
    fctx.globalAlpha = Math.max(0, this.alpha);
    const grd = fctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 4);
    grd.addColorStop(0, this.color);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    fctx.fillStyle = grd;
    fctx.beginPath();
    fctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    fctx.fill();
    fctx.restore();
  }
}

class Firework {
  constructor() {
    this.x = random(100, fireworksCanvas.width - 100);
    this.y = fireworksCanvas.height;
    this.targetY = random(150, fireworksCanvas.height / 2);
    this.color = `hsl(${Math.floor(random(0, 360))},100%,60%)`;
    this.exploded = false;
    this.particles = [];
  }
  update() {
    if (!this.exploded) {
      this.y -= 6;
      if (this.y <= this.targetY) this.explode();
    }
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.alpha > 0);
  }
  draw() {
    if (!this.exploded) {
      fctx.fillStyle = this.color;
      fctx.fillRect(this.x, this.y, 2, 6);
    }
    this.particles.forEach(p => p.draw());
  }
  explode() {
    this.exploded = true;
    const count = 60 + Math.random() * 20;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = random(2, 5);
      this.particles.push(new Particle(this.x, this.y, this.color, speed, angle));
    }
  }
}

let fireworks = [];
function animateFireworks() {
  if (!fctx) return;
  fctx.globalCompositeOperation = "source-over";
  fctx.fillStyle = "rgba(0,0,0,0.2)"; // trilhas suaves
  fctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  fctx.globalCompositeOperation = "lighter"; // mistura de luzes

  if (Math.random() < 0.04) fireworks.push(new Firework());

  fireworks.forEach(f => { f.update(); f.draw(); });
  fireworks = fireworks.filter(f => !f.exploded || f.particles.length > 0);

  requestAnimationFrame(animateFireworks);
}
requestAnimationFrame(animateFireworks);
// #endregion FOGOS
// =====================================================================================
