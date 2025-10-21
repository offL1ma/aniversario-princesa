const fireworksCanvas = document.getElementById("fireworks");
const fctx = fireworksCanvas?.getContext("2d");

function resizeFireworks(){
  if (!fireworksCanvas) return;
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}
resizeFireworks();
window.addEventListener("resize", resizeFireworks);

function random(min, max){ return Math.random() * (max - min) + min; }

function clamp(v,min,max){ return v<min?min:v>max?max:v; }

// Paletas baseadas na matiz principal
function makeAnalogous(h){
  const offs = [-30, -15, 0, 15, 30];
  return offs.map(o => (h + o + 360) % 360);
}
function makeComplementary(h){
  // triádica/levente split para variar bem sem “gritar”
  const offs = [0, 160, 200];
  return offs.map(o => (h + o + 360) % 360);
}
function pickPalette(h){
  return (Math.random() < 0.6) ? makeAnalogous(h) : makeComplementary(h);
}

class Particle {
  constructor(x, y, color, speed, angle){
    this.x=x; this.y=y; this.color=color;
    this.velX=Math.cos(angle)*speed; this.velY=Math.sin(angle)*speed;
    this.life=random(60,100); this.alpha=1;
  }
  update(){ this.x+=this.velX; this.y+=this.velY; this.velY+=0.05; this.velX*=0.985; this.velY*=0.985; this.alpha-=0.012; }
  draw(){
    fctx.save(); fctx.globalAlpha=Math.max(0,this.alpha);
    const grd=fctx.createRadialGradient(this.x,this.y,0,this.x,this.y,4);
    grd.addColorStop(0,this.color); grd.addColorStop(1,"rgba(0,0,0,0)");
    fctx.fillStyle=grd; fctx.beginPath(); fctx.arc(this.x,this.y,2.5,0,Math.PI*2); fctx.fill(); fctx.restore();
  }
}
class Firework {
  constructor(){
    this.x = random(100, fireworksCanvas.width - 100);
    this.y = fireworksCanvas.height;
    this.targetY = random(150, fireworksCanvas.height / 2);
    // cor-base aleatória (matiz principal)
    this.baseHue = Math.floor(random(0, 360));
    this.exploded = false;
    this.particles = [];
  }

  explode() {
    this.exploded = true;
    const count = 60 + Math.random() * 20;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = random(2, 5);

      // adiciona variação de cor leve em cada partícula
      const hue = (this.baseHue + random(-30, 30) + 360) % 360;
      const sat = random(80, 100);
      const light = random(50, 70);
      const color = `hsl(${hue},${sat}%,${light}%)`;

      this.particles.push(new Particle(this.x, this.y, color, speed, angle));
    }
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
      fctx.fillStyle = `hsl(${this.baseHue},100%,60%)`;
      fctx.fillRect(this.x, this.y, 2, 6);
    }
    this.particles.forEach(p => p.draw());
  }
}

let fireworks=[];
function animateFireworks(){
  if (!fctx) return;
  fctx.globalCompositeOperation="source-over";
  fctx.fillStyle="rgba(0,0,0,0.2)"; fctx.fillRect(0,0,fireworksCanvas.width,fireworksCanvas.height);
  fctx.globalCompositeOperation="lighter";
  if (Math.random() < 0.07) fireworks.push(new Firework());
  fireworks.forEach(f=>{ f.update(); f.draw(); });
  fireworks=fireworks.filter(f=>!f.exploded || f.particles.length>0);
  requestAnimationFrame(animateFireworks);
}
requestAnimationFrame(animateFireworks);
