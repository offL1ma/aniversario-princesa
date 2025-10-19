(function initMoon(){
  if (!window.THREE) { console.error("Three.js não carregou."); return; }
  const moonContainer = document.querySelector(".moon-container");
  const moonCanvas = document.getElementById("moonCanvas");
  if (!moonContainer || !moonCanvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas: moonCanvas, alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0,0,4);

  function resizeMoon(){
    const w = moonContainer.clientWidth, h = moonContainer.clientHeight;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resizeMoon); resizeMoon();

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
  dirLight.position.set(3,2.5,4); scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.30);
  fillLight.position.set(-2,-1,-3); scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0x404040, 0.45));

  const moonRoot = new THREE.Group(); scene.add(moonRoot);
  const loader = new THREE.TextureLoader();

  function makeGreyTexture(size=1024){
    const c = document.createElement('canvas'); c.width=c.height=size;
    const g = c.getContext('2d'); g.fillStyle="#c7c7c7"; g.fillRect(0,0,size,size);
    g.globalAlpha = 0.25;
    for (let k=0;k<120;k++){
      const r=Math.random()*18+6, x=Math.random()*size, y=Math.random()*size;
      const grd=g.createRadialGradient(x,y,0,x,y,r);
      grd.addColorStop(0,"#777"); grd.addColorStop(1,"rgba(0,0,0,0)");
      g.fillStyle=grd; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
    }
    return new THREE.CanvasTexture(c);
  }

  let moonTexture, moonBump, aniso = renderer.capabilities.getMaxAnisotropy();
  moonTexture = loader.load("assets/moon_texture.jpg",
    tex => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso; },
    undefined, () => { moonTexture = makeGreyTexture(); }
  );
  moonBump = loader.load("assets/moon_bump.jpg",
    tex => { tex.anisotropy = aniso; },
    undefined, () => { moonBump = makeGreyTexture(); }
  );

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 128, 128),
    new THREE.MeshPhongMaterial({ map:moonTexture, bumpMap:moonBump, bumpScale:0.035, emissive:0x101010, emissiveIntensity:0.6 })
  );
  moonRoot.add(moon);

  let isDragging=false, lastX=0, lastY=0;
  moonContainer.addEventListener("pointerdown", (e)=>{ isDragging=true; lastX=e.clientX; lastY=e.clientY; moonContainer.classList.add("dragging"); moonContainer.setPointerCapture(e.pointerId); });
  moonContainer.addEventListener("pointermove", (e)=>{
    if(!isDragging) return;
    const dx=e.clientX-lastX, dy=e.clientY-lastY, SENS=0.01;
    const forward=new THREE.Vector3(); camera.getWorldDirection(forward).normalize();
    const up=camera.up.clone().normalize();
    const right=new THREE.Vector3().crossVectors(forward, up).normalize();
    const qYaw=new THREE.Quaternion().setFromAxisAngle(up, dx*SENS);
    const qPitch=new THREE.Quaternion().setFromAxisAngle(right, dy*SENS);
    moonRoot.quaternion.premultiply(qYaw).premultiply(qPitch);
    // alimenta o fundo (se stars.js estiver presente)
    if (window.setStarVelocity) {
  const { x, y } = window.getStarVelocity ? window.getStarVelocity() : { x: 0, y: 0 };
  const vx = Math.max(-0.05, Math.min(0.05, x + (dx * SENS) * 0.42));
  const vy = Math.max(-0.05, Math.min(0.05, y + (dy * SENS) * 0.42));
  window.setStarVelocity(vx, vy);
}
    lastX=e.clientX; lastY=e.clientY;
  });
  function stopDrag(e){ if(!isDragging) return; isDragging=false; moonContainer.classList.remove("dragging"); try{ moonContainer.releasePointerCapture(e.pointerId);}catch{} }
  moonContainer.addEventListener("pointerup", stopDrag);
  moonContainer.addEventListener("pointercancel", stopDrag);
  window.addEventListener("pointerup", ()=>{ isDragging=false; moonContainer.classList.remove("dragging"); });

  function loop3D(){ renderer.render(scene, camera); requestAnimationFrame(loop3D); }
  requestAnimationFrame(loop3D);
})();
