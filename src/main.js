// src/main.js
import * as THREE from 'three';
import { TextureGen } from './systems/TextureGen.js';
import { ShipFactory } from './entities/ShipFactory.js';
import { FollowCamera } from './Camera.js';
import { InputManager } from './Input.js';
import { CombatSystem } from './systems/Combat.js';
import { AudioEngine } from './Audio.js';
import { AsteroidField } from './maps/AsteroidField.js';
import { ShipSelectMenu } from './ShipSelect.js';
import { SHIP_DEFS } from './ShipDefs.js';

// ===== SCREEN MANAGER =====
let currentScreen = 'menu';
let shipSelect = null;
let game = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id)?.classList.add('active');
  currentScreen = id;
}

// === Menu ===
window.showRoster = function() {
  showScreen('menu');
};

window.goShipSelect = function() {
  showScreen('shipselect');
  if (!shipSelect) {
    shipSelect = new ShipSelectMenu();
  }
  // Defer build until layout is ready
  requestAnimationFrame(() => shipSelect.build());
};

window.showMenu = function() {
  if (game) { game.destroy(); game = null; }
  showScreen('menu');
};

window.startGame = function() {
  const shipId = shipSelect ? shipSelect.getSelectedId() : 'xwing';
  if (shipSelect) { shipSelect.stop(); }
  showScreen('game');
  requestAnimationFrame(() => {
    if (game) game.destroy();
    game = new Game(shipId);
  });
};

window.exitGame = function() {
  if (game) { game.destroy(); game = null; }
  showScreen('menu');
};

// Start button in menu goes to ship select
document.querySelector('.menu-btn.selected')?.addEventListener('click', goShipSelect);

// Keyboard navigation in ship select
window.addEventListener('keydown', e => {
  if (currentScreen === 'shipselect') {
    if (e.code === 'Enter') { window.startGame(); }
    if (e.code === 'Escape') { window.showMenu(); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      const next = Math.min((shipSelect?.selectedIdx ?? 0) + 1, SHIP_DEFS.length - 1);
      shipSelect?._selectShip(next);
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      const prev = Math.max((shipSelect?.selectedIdx ?? 0) - 1, 0);
      shipSelect?._selectShip(prev);
    }
  }
  if (currentScreen === 'menu' && (e.code === 'Enter' || e.code === 'Space')) {
    window.goShipSelect();
  }
});

// Audio on first interaction
const initAudio = () => {
  game?.audio.init();
  window.removeEventListener('click', initAudio);
  window.removeEventListener('keydown', initAudio);
};
window.addEventListener('click', initAudio);
window.addEventListener('keydown', initAudio);

// ===== GAME =====
class Game {
  constructor(shipId = 'xwing') {
    this.shipId = shipId;
    this.canvas = document.getElementById('game-canvas');
    if (!this.canvas) return;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(this.canvas.clientWidth || window.innerWidth, this.canvas.clientHeight || window.innerHeight);
    this.renderer.setClearColor(0x000008);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000010, 0.0009);

    this.camera = new THREE.PerspectiveCamera(75, (this.canvas.clientWidth || window.innerWidth) / (this.canvas.clientHeight || window.innerHeight), 0.1, 4000);

    this._setupLights();
    this._setupStars();

    this.textureGen = new TextureGen();
    this.factory = new ShipFactory(this.textureGen);
    this.input = new InputManager(this.canvas);
    this.audio = new AudioEngine();
    this.combat = new CombatSystem(this.scene);
    this.followCam = new FollowCamera(this.camera);

    this.asteroids = new AsteroidField(this.scene, this.textureGen, { count: 180, radius: 450 });
    this.asteroids.registerWithCombat(this.combat, this.audio);

    this.player = this.factory.create(this.scene, shipId);
    this.player.targetSpeed = this.player.maxSpeed * 0.5; // RS3D starts with some speed
    this.player.speed = this.player.maxSpeed * 0.5;
    this.input.state.throttle = 0.5;
    this.followCam.attach(this.player);

    this._updateHUD();

    this._resizeBound = this._onResize.bind(this);
    window.addEventListener('resize', this._resizeBound);

    // Tab: switch ship (cycle through SHIP_DEFS)
    this._tabBound = (e) => {
      if (e.code === 'Tab' && currentScreen === 'game') {
        e.preventDefault();
        this._cycleShip();
      }
    };
    window.addEventListener('keydown', this._tabBound);

    this.audio.init();

    this._destroyed = false;
    this._lastTime = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _setupLights() {
    this.scene.add(new THREE.AmbientLight(0x223344, 0.7));
    const sun = new THREE.DirectionalLight(0xfff2cc, 1.5); sun.position.set(100, 60, 80); this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4488ff, 0.4); rim.position.set(-80, -30, -100); this.scene.add(rim);
  }

  _setupStars() {
    const count = 3000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1200 + Math.random() * 800;
      const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      pos[i*3] = r*Math.sin(p)*Math.cos(t); pos[i*3+1] = r*Math.sin(p)*Math.sin(t); pos[i*3+2] = r*Math.cos(p);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false })));
  }

  _cycleShip() {
    const defs = SHIP_DEFS;
    const currIdx = defs.findIndex(d => d.id === this.shipId);
    const nextIdx = (currIdx + 1) % defs.length;
    const oldPos = this.player.position.clone();
    const oldQ = this.player.quaternion.clone();
    const oldSpeed = this.player.speed;

    this.player.dispose();
    this.shipId = defs[nextIdx].id;
    this.player = this.factory.create(this.scene, this.shipId);
    this.player.position.copy(oldPos);
    this.player.quaternion.copy(oldQ);
    this.player.speed = oldSpeed;
    this.player.targetSpeed = oldSpeed;
    this.followCam.attach(this.player);
    this._updateHUD();
  }

  _updateHUD() {
    const el = document.getElementById('hud-ship');
    if (el) el.textContent = SHIP_DEFS.find(d => d.id === this.shipId)?.name ?? this.shipId.toUpperCase();
  }

  _onResize() {
    if (!this.canvas || this._destroyed) return;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _loop(now) {
    if (this._destroyed) return;
    requestAnimationFrame(this._loop);
    const dt = Math.min(0.05, (now - this._lastTime) / 1000);
    this._lastTime = now;

    this.input.update(dt);
    const s = this.input.state;

    this.player.setControls({ pitch: s.pitch, yaw: s.yaw, roll: s.roll, throttle: s.throttle }, dt);

    if (s.fire) {
      if (this.player.fireLaser(this.combat)) {
        const def = SHIP_DEFS.find(d => d.id === this.shipId);
        const laserCol = def?.laserColor ?? 0xff3030;
        const colorStr = laserCol === 0x33ff55 ? 'green' : laserCol === 0xffdd00 ? 'yellow' : 'red';
        this.audio.playLaser(colorStr);
      }
    }

    this.followCam.setZoom(s.zoom);
    this.player.update(dt);
    this.combat.update(dt);
    this.asteroids.update(dt);
    this.followCam.update(dt);

    // HUD
    const speedEl = document.getElementById('speed-val');
    const barEl = document.getElementById('speed-bar');
    const zoomEl = document.getElementById('hud-zoom');
    if (speedEl) speedEl.textContent = Math.round(Math.abs(this.player.speed));
    if (barEl) barEl.style.width = Math.max(0, this.player.speed / this.player.maxSpeed * 100) + '%';
    if (zoomEl) zoomEl.textContent = 'ZOOM: ' + (s.zoom ? 'ON' : 'OFF');

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this._destroyed = true;
    window.removeEventListener('resize', this._resizeBound);
    window.removeEventListener('keydown', this._tabBound);
    if (this.player) this.player.dispose();
    // Cleanup scene
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) { if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose()); else obj.material.dispose(); }
    });
    this.renderer.dispose();
  }
}
