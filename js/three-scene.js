import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.152.2/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'https://unpkg.com/three@0.152.2/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'https://unpkg.com/three@0.152.2/examples/jsm/renderers/CSS3DRenderer.js';
import { ShaderPass } from 'https://unpkg.com/three@0.152.2/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://unpkg.com/three@0.152.2/examples/jsm/shaders/FXAAShader.js';
import { RGBShiftShader } from 'https://unpkg.com/three@0.152.2/examples/jsm/shaders/RGBShiftShader.js';
import { FilmPass } from 'https://unpkg.com/three@0.152.2/examples/jsm/postprocessing/FilmPass.js';
import { BokehPass } from 'https://unpkg.com/three@0.152.2/examples/jsm/postprocessing/BokehPass.js';
import { EffectComposer } from 'https://unpkg.com/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.152.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.152.2/examples/jsm/postprocessing/UnrealBloomPass.js';

const root = document.getElementById('webgl-root');
if (!root) {
  console.warn('No webgl root found');
} else {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 1.6, 3.8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  root.appendChild(renderer.domElement);

  // Lights
  const key = new THREE.PointLight(0x66f6ff, 1.6, 10, 2);
  key.position.set(2, 2.5, 2);
  scene.add(key);
  const rim = new THREE.PointLight(0xff66f6, 0.9, 12, 2);
  rim.position.set(-2, 1.2, -3);
  scene.add(rim);
  const amb = new THREE.AmbientLight(0x446688, 0.6);
  scene.add(amb);

  // Controls (subtle, disabled rotate by user)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = false;

  // Particles field
  const particles = new THREE.BufferGeometry();
  const count = 1200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i*3 + 0] = (Math.random() - 0.5) * 20;
    positions[i*3 + 1] = (Math.random() - 0.5) * 6;
    positions[i*3 + 2] = (Math.random() - 0.5) * 20;
  }
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x66f6ff, size: 0.035, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const pSystem = new THREE.Points(particles, pMat);
  scene.add(pSystem);

  // Holographic panels (as 3D planes)
  function makePanel(text, w = 1.2, h = 0.6) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(8,10,20,0.3)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = 'rgba(180,255,255,0.95)'; ctx.font = '48px Outfit, sans-serif'; ctx.fillText(text, 48, 120);
    // add subtle grid
    ctx.strokeStyle = 'rgba(120,100,255,0.06)'; ctx.lineWidth = 1;
    for (let i=0;i<20;i++){ ctx.beginPath(); ctx.moveTo(0, i*24); ctx.lineTo(canvas.width, i*24); ctx.stroke(); }

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    const geo = new THREE.PlaneGeometry(w, h);
    // Use a physical material so panels pick up HDR reflections and look holographic
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, opacity: 0.98, side: THREE.DoubleSide, roughness: 0.18, metalness: 0.05, emissive: new THREE.Color(0x00eaff).multiplyScalar(0.02), emissiveIntensity: 0.6, ior: 1.3, transmission: 0.05 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    return mesh;
  }
  const panelProjects = makePanel('PROJECTS'); panelProjects.position.set(-1.8, 0.9, -1.8); panelProjects.rotation.y = 0.45; scene.add(panelProjects);
  const panelAbout = makePanel('ABOUT ME'); panelAbout.position.set(1.6, 0.8, -1.6); panelAbout.rotation.y = -0.55; scene.add(panelAbout);
  const panelSkills = makePanel('SKILLS'); panelSkills.position.set(-0.8, -0.2, -2.4); panelSkills.rotation.y = 0.25; scene.add(panelSkills);

  // Placeholder avatar or GLTF loader
  const loader = new GLTFLoader();
  const avatarGroup = new THREE.Group();
  avatarGroup.position.set(0, -0.3, 0);
  scene.add(avatarGroup);
  // PMREM generator for HDR environment maps
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // Load an HDRI to give realistic reflections/lighting (falls back if unavailable)
  const rgbeLoader = new RGBELoader();
  const hdrUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r152/examples/textures/equirectangular/royal_esplanade_1k.hdr';
  rgbeLoader.load(hdrUrl, (hdrTex) => {
    const envMap = pmremGenerator.fromEquirectangular(hdrTex).texture;
    scene.environment = envMap;
    hdrTex.dispose();
    pmremGenerator.dispose();
  }, undefined, (err) => { console.warn('HDR load failed', err); pmremGenerator.dispose(); });

  loader.load('assets/avatar.glb', (g) => {
    g.scene.traverse(n => {
      if (n.isMesh) {
        n.castShadow = true; n.receiveShadow = true;
        if (scene.environment && n.material) {
          n.material.envMap = scene.environment;
          n.material.envMapIntensity = 1.2;
          n.material.needsUpdate = true;
        }
      }
    });
    g.scene.scale.set(1.2,1.2,1.2);
    avatarGroup.add(g.scene);
  }, undefined, (e) => {
    // fallback: create stylized hoodie placeholder
    const geo = new THREE.CapsuleGeometry(0.35, 0.9, 8, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0b1020, metalness: 0.2, roughness: 0.35, emissive: 0x001122, emissiveIntensity: 0.06 });
    const body = new THREE.Mesh(geo, mat);
    body.position.y = 0.6;
    avatarGroup.add(body);
    const hood = new THREE.TorusGeometry(0.6, 0.18, 16, 48);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x0f1530, emissive: 0x441144, emissiveIntensity: 0.02 });
    const hoodMesh = new THREE.Mesh(hood, hoodMat); hoodMesh.rotation.x = Math.PI/2; hoodMesh.position.y = 1.05; avatarGroup.add(hoodMesh);
  });

  // Postprocessing composer + bloom
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.8, 0.1);
  bloom.threshold = 0.12; bloom.strength = 0.9; bloom.radius = 0.8;
  composer.addPass(bloom);

  // Advanced effects: Film, RGB shift, FXAA, Bokeh (Depth of Field)
  const film = new FilmPass(0.12, 0.35, 648, false);
  const rgb = new ShaderPass(RGBShiftShader);
  rgb.uniforms['amount'].value = 0.0018;
  const fxaa = new ShaderPass(FXAAShader);
  fxaa.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);

  composer.addPass(film);
  composer.addPass(rgb);
  composer.addPass(fxaa);

  // Bokeh DOF setup (reads depth from camera)
  const bokehParams = {
    focus: 2.2,
    aperture: 0.0009,
    maxblur: 0.006,
    width: window.innerWidth,
    height: window.innerHeight
  };
  const bokehPass = new BokehPass(scene, camera, bokehParams);
  composer.addPass(bokehPass);

  // Responsive
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    fxaa.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  }
  window.addEventListener('resize', onResize, { passive: true });

  // Mouse-based subtle camera movement
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // animation loop
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // float panels
    [panelProjects, panelAbout, panelSkills].forEach((p, idx) => {
      p.position.y += Math.sin(t * 0.9 + p.userData.floatOffset) * 0.002;
      p.rotation.z = Math.sin(t*0.6 + idx) * 0.02;
    });

    // particles drift
    pSystem.rotation.y += 0.0006;

    // subtle camera follow
    camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.06;
    camera.position.y += (-mouseY * 0.3 + 0.9 - camera.position.y) * 0.06;
    camera.lookAt(0, 0.6, 0);

    controls.update();
    composer.render();
    // Render CSS3D on top
    if (cssRenderer) cssRenderer.render(cssScene, camera);
  }
  animate();
}

// --- CSS3D interactive panels and performance toggle ---
// create CSS3D renderer and DOM panels
const cssRoot = document.getElementById('css3d-root');
let cssRenderer, cssScene;
if (cssRoot) {
  cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.top = '0';
  cssRenderer.domElement.style.pointerEvents = 'none';
  cssRoot.appendChild(cssRenderer.domElement);

  cssScene = new THREE.Scene();

  function makeDOMPanel(title, contentHTML = '') {
    const el = document.createElement('div');
    el.className = 'holo-dom';
    el.style.width = '420px';
    el.style.height = '220px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.pointerEvents = 'auto';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3 style="margin:0 0 8px 0">${title}</h3><div>${contentHTML}</div>`;
    el.appendChild(card);

    const obj = new CSS3DObject(el);
    obj.position.set(0,0,0);
    return obj;
  }

  const domProjects = makeDOMPanel('Projects', '<a href="#work">Open Projects</a>');
  domProjects.position.set(-1.8, 0.9, -1.8);
  domProjects.rotation.y = 0.45;
  cssScene.add(domProjects);

  const domAbout = makeDOMPanel('About', '<a href="#about">About Me</a>');
  domAbout.position.set(1.6, 0.8, -1.6);
  domAbout.rotation.y = -0.55;
  cssScene.add(domAbout);

  const domSkills = makeDOMPanel('Skills', '<a href="#skills">View Skills</a>');
  domSkills.position.set(-0.8, -0.2, -2.4);
  domSkills.rotation.y = 0.25;
  cssScene.add(domSkills);

  // Allow pointer events on CSS3D panels
  cssRenderer.domElement.style.pointerEvents = 'auto';
}

// performance toggle (press 'p') to disable heavy postprocessing
let heavyEffects = true;
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'p') {
    heavyEffects = !heavyEffects;
    bloom.strength = heavyEffects ? 0.9 : 0.0;
    film.enabled = heavyEffects;
    rgb.enabled = heavyEffects;
    fxaa.enabled = heavyEffects;
    bokehPass.enabled = heavyEffects;
    console.log('Performance mode:', heavyEffects ? 'High quality' : 'Performance');
  }
});
