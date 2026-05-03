import * as THREE from 'three';
import { TextureGen } from './systems/TextureGen.js';
import { XWing } from './entities/XWing.js';
import { Interceptor } from './entities/Interceptor.js';
import { FollowCamera } from './Camera.js';
import { InputManager } from './Input.js';
import { CombatSystem } from './systems/Combat.js';
import { AudioEngine } from './Audio.js';
import { AsteroidField } from './maps/AsteroidField.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000008);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000010, 0.0008);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);

    this._setupLights();
    this._setupStarfield();

    // Systeme
    this.textureGen = new TextureGen();
    this.input = new InputManager(this.canvas);
    this.audio = new AudioEngine();
    this.combat = new CombatSystem(this.scene);
    this.followCam = new FollowCamera(this.camera);

    // Welt
    this.asteroids = new AsteroidField(this.scene, this.textureGen, { count: 220, radius: 500 });
    this.asteroids.registerWithCombat(this.combat, this.audio);

    // Spieler-Schiff (Toggle-fähig: Tab)
    this.shipType = 'xwing';
    this.player = this._createShip(this.shipType);
    this.followCam.attach(this.player);

    // Audio-Init bei erster Geste
    const initAudio = () => {
      this.audio.init();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    // Schiffwechsel mit Tab
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        this._switchShip();
      }
    });

    window.addEventListener('resize', () => this._onResize());

    // HUD-Refs
    this.hudSpeedVal = document.getElementById('speed-val');
    this.hudSpeedBar = document.getElementById('speed-bar');
    this.hudShipName = document.getElementById('ship-name');
    this.hudZoom     = document.getElementById('zoom-status');

    this._lastTime = performance.now();
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _createShip(type) {
    if (type === 'xwing')      return new XWing(this.scene, this.textureGen);
    if (type === 'interceptor') return new Interceptor(this.scene, this.textureGen);
    throw new Error('Unknown ship type: ' + type);
  }

  _switchShip() {
    // Aktuelles Schiff entfernen
    const oldPos = this.player.position.clone();
    const oldQuat = this.player.quaternion.clone();
    const oldSpeed = this.player.speed;
    this.scene.remove(this.player.group);

    this.shipType = this.shipType === 'xwing' ? 'interceptor' : 'xwing';
    this.player = this._createShip(this.shipType);
    this.player.position.copy(oldPos);
    this.player.quaternion.copy(oldQuat);
    this.player.speed = oldSpeed;
    this.followCam.attach(this.player);

    if (this.hudShipName) this.hudShipName.textContent = this.shipType.toUpperCase();
  }

  _setupLights() {
    const ambient = new THREE.AmbientLight(0x223344, 0.6);
    this.scene.add(ambient);

    // "Sonne"
    const sun = new THREE.DirectionalLight(0xfff2cc, 1.4);
    sun.position.set(100, 60, 80);
    this.scene.add(sun);

    // Rim-Light
    const rim = new THREE.DirectionalLight(0x4488ff, 0.4);
    rim.position.set(-80, -30, -100);
    this.scene.add(rim);
  }

  _setupStarfield() {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1500 + Math.random() * 800;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false });
    this.scene.add(new THREE.Points(geom, mat));
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, windo
