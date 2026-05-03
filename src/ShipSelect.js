// src/ShipSelect.js
import * as THREE from 'three';
import { SHIP_DEFS } from './ShipDefs.js';
import { TextureGen } from './systems/TextureGen.js';
import { ShipFactory } from './entities/ShipFactory.js';

export class ShipSelectMenu {
  constructor() {
    this.textureGen = new TextureGen();
    this.factory = new ShipFactory(this.textureGen);
    this.selectedIdx = 0;
    this.previewRenderers = new Map();
    this.bigRenderer = null;
    this.bigScene = null;
    this.bigCamera = null;
    this.bigShipGroup = null;
    this.bigAngle = 0;
    this._rafId = null;
    this._built = false;
  }

  build() {
    if (this._built) return;
    this._built = true;
    this._buildGrid();
    this._buildBigPreview();
    this._selectShip(0);
    this._startLoop();
  }

  _buildGrid() {
    const grid = document.getElementById('ship-grid');
    grid.innerHTML = '';

    SHIP_DEFS.forEach((def, idx) => {
      const card = document.createElement('div');
      card.className = 'ship-card' + (idx === 0 ? ' selected' : '');
      card.dataset.idx = idx;

      const previewDiv = document.createElement('div');
      previewDiv.className = 'ship-card-preview';

      const canvas = document.createElement('canvas');
      canvas.width = 160; canvas.height = 90;
      previewDiv.appendChild(canvas);
      card.appendChild(previewDiv);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'ship-card-name';
      nameDiv.textContent = def.name;
      card.appendChild(nameDiv);

      const secDiv = document.createElement('div');
      secDiv.className = 'ship-card-secondary';
      secDiv.textContent = def.secondary.replace('SECONDARY WEAPON: ', '');
      card.appendChild(secDiv);

      card.addEventListener('click', () => this._selectShip(idx));
      grid.appendChild(card);

      // Mini 3D preview renderer
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(160, 90);
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0x334455, 1.2));
      const dl = new THREE.DirectionalLight(0xfff2cc, 1.6); dl.position.set(3, 4, 5); scene.add(dl);
      const rl = new THREE.DirectionalLight(0x4488ff, 0.5); rl.position.set(-4, -2, -3); scene.add(rl);

      const cam = new THREE.PerspectiveCamera(50, 160 / 90, 0.1, 500);
      cam.position.set(6, 3, 8);
      cam.lookAt(0, 0, 0);

      const shipGroup = this.factory.createPreview(def.id);
      scene.add(shipGroup);

      this.previewRenderers.set(idx, { renderer, scene, cam, shipGroup, angle: Math.random() * Math.PI * 2 });
    });
  }

  _buildBigPreview() {
    const canvas = document.getElementById('ship-big-canvas');
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 300;

    this.bigRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.bigRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.bigRenderer.setSize(w, h);
    this.bigRenderer.setClearColor(0x000000, 0);

    this.bigScene = new THREE.Scene();
    this.bigScene.fog = new THREE.FogExp2(0x000810, 0.025);
    this.bigScene.add(new THREE.AmbientLight(0x223344, 1.0));
    const sun = new THREE.DirectionalLight(0xfff2cc, 2.0); sun.position.set(5, 8, 6); this.bigScene.add(sun);
    const rim = new THREE.DirectionalLight(0x4488ff, 0.6); rim.position.set(-6, -3, -5); this.bigScene.add(rim);
    const fill = new THREE.DirectionalLight(0xffd080, 0.3); fill.position.set(0, -5, 8); this.bigScene.add(fill);

    this.bigCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.bigCamera.position.set(10, 5, 14);
    this.bigCamera.lookAt(0, 0, 0);

    // Stars bg
    const sPos = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      sPos[i*3] = (Math.random()-0.5)*200; sPos[i*3+1] = (Math.random()-0.5)*200; sPos[i*3+2] = (Math.random()-0.5)*200;
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sPos, 3));
    this.bigScene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, sizeAttenuation: false })));

    window.addEventListener('resize', () => {
      const nw = canvas.clientWidth, nh = canvas.clientHeight;
      if (nw && nh) {
        this.bigRenderer.setSize(nw, nh);
        this.bigCamera.aspect = nw / nh;
        this.bigCamera.updateProjectionMatrix();
      }
    });
  }

  _selectShip(idx) {
    this.selectedIdx = idx;
    const def = SHIP_DEFS[idx];

    // Update cards
    document.querySelectorAll('.ship-card').forEach((c, i) => {
      c.classList.toggle('selected', i === idx);
    });

    // Update info panel
    document.getElementById('ship-info-name').textContent = def.name;
    document.getElementById('ship-info-secondary').textContent = def.secondary;
    document.getElementById('ship-desc').textContent = def.desc;
    document.getElementById('stat-speed').style.width = def.stats.speed + '%';
    document.getElementById('stat-agility').style.width = def.stats.agility + '%';
    document.getElementById('stat-firepower').style.width = def.stats.firepower + '%';
    document.getElementById('stat-shields').style.width = def.stats.shields + '%';

    // Swap big preview ship
    if (this.bigShipGroup) this.bigScene.remove(this.bigShipGroup);
    this.bigShipGroup = this.factory.createPreview(def.id);
    this.bigScene.add(this.bigShipGroup);
    this.bigAngle = 0;
  }

  getSelectedId() {
    return SHIP_DEFS[this.selectedIdx].id;
  }

  _startLoop() {
    const loop = () => {
      this._rafId = requestAnimationFrame(loop);

      // Mini previews
      this.previewRenderers.forEach(({ renderer, scene, cam, shipGroup, angle }, idx) => {
        shipGroup.rotation.y += 0.012;
        shipGroup.rotation.x = Math.sin(Date.now() * 0.0003 + idx) * 0.12;
        renderer.render(scene, cam);
      });

      // Big preview – slow orbit
      this.bigAngle += 0.008;
      if (this.bigShipGroup) {
        this.bigShipGroup.rotation.y = this.bigAngle;
        this.bigShipGroup.rotation.x = Math.sin(this.bigAngle * 0.4) * 0.15;
      }
      const bigCanvas = document.getElementById('ship-big-canvas');
      if (bigCanvas && this.bigRenderer) {
        const nw = bigCanvas.clientWidth, nh = bigCanvas.clientHeight;
        if (nw > 0 && nh > 0 && (this.bigRenderer.domElement.width !== nw || this.bigRenderer.domElement.height !== nh)) {
          this.bigRenderer.setSize(nw, nh);
          this.bigCamera.aspect = nw / nh;
          this.bigCamera.updateProjectionMatrix();
        }
        this.bigRenderer.render(this.bigScene, this.bigCamera);
      }
    };
    loop();
  }

  stop() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this.previewRenderers.forEach(({ renderer }) => renderer.dispose());
    this.previewRenderers.clear();
    if (this.bigRenderer) { this.bigRenderer.dispose(); this.bigRenderer = null; }
  }
}
