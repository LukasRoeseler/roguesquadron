import * as THREE from 'three';
import { Ship } from './Ship.js';

export class XWing extends Ship {
  constructor(scene, textureGen) {
    super(scene, {
      maxSpeed: 80,
      acceleration: 35,
      pitchRate: 1.5,
      yawRate: 1.2,
      rollRate: 2.4,
      laserColor: 0xff2020,
      fireCooldown: 0.18,
      laserOffsets: [
        new THREE.Vector3( 1.6,  0.6, -1.5),
        new THREE.Vector3(-1.6,  0.6, -1.5),
        new THREE.Vector3( 1.6, -0.6, -1.5),
        new THREE.Vector3(-1.6, -0.6, -1.5),
      ],
    });

    const tex = textureGen.generateMetalTexture({
      baseColor: '#c9c4b0', panelDensity: 0.6, weathering: 0.5
    });
    const hullMat = new THREE.MeshStandardMaterial({
      map: tex, metalness: 0.6, roughness: 0.55, color: 0xffffff
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xaa1a1a, metalness: 0.4, roughness: 0.6 });
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x223344, metalness: 0.9, roughness: 0.1, envMapIntensity: 1.0
    });

    // Rumpf (länglich)
    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 4.0), hullMat);
    this.group.add(fuselage);

    // Nase
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.45, 1.8, 8), hullMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = -2.6;
    this.group.add(nose);

    // Cockpit
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cockpitMat);
    cockpit.scale.set(1, 0.7, 1.4);
    cockpit.position.set(0, 0.45, -0.2);
    this.group.add(cockpit);

    // Triebwerke hinten (4 Zylinder)
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8, roughness: 0.4 });
    const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x88ddff });
    const enginePositions = [[0.5, 0.4], [-0.5, 0.4], [0.5, -0.4], [-0.5, -0.4]];
    for (const [x, y] of enginePositions) {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 10), engineMat);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(x, y, 1.9);
      this.group.add(eng);

      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.14, 10), engineGlowMat);
      glow.position.set(x, y, 2.31);
      this.group.add(glow);
    }

    // Vier Flügel (S-Foils). Jeder Flügel ist eine Group, die rotiert.
    this.wings = [];
    const wingGeo = new THREE.BoxGeometry(2.6, 0.08, 1.0);
    const cannonGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8);

    const wingConfigs = [
      // [x-Vorzeichen, y-Vorzeichen, geschlossener Winkel, offener Winkel]
      { sx:  1, sy:  1 },
      { sx: -1, sy:  1 },
      { sx:  1, sy: -1 },
      { sx: -1, sy: -1 },
    ];
    for (const cfg of wingConfigs) {
      const pivot = new THREE.Group();
      pivot.position.set(0, cfg.sy * 0.25, 0.3);
      this.group.add(pivot);

      const wing = new THREE.Mesh(wingGeo, hullMat);
      wing.position.set(cfg.sx * 1.6, 0, 0);
      pivot.add(wing);

      // Roter Streifen
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.082, 0.3), accentMat);
      stripe.position.set(cfg.sx * 1.4, 0, -0.2);
      pivot.add(stripe);

      // Laserkanone an Flügelspitze
      const cannon = new THREE.Mesh(cannonGeo, engineMat);
      cannon.rotation.x = Math.PI / 2;
      cannon.position.set(cfg.sx * 2.7, 0, -0.5);
      pivot.add(cannon);

      // Initialer (geschlossener) Winkel
      const closedAngle = cfg.sy > 0 ? -0.05 : 0.05;
      const openAngle   = cfg.sy > 0 ?  0.32 : -0.32;
      pivot.rotation.z = closedAngle;
      this.wings.push({ pivot, closedAngle, openAngle });
    }

    this.hull = this.group;

    // Animation triggern
    this._wingAnim = { t: 0, duration: 1.2, playing: true };
    this.openWings();
  }

  openWings() {
    this._wingAnim.t = 0;
    this._wingAnim.playing = true;
  }

  update(dt) {
    super.update(dt);
    if (this._wingAnim.playing) {
      this._wingAnim.t += dt;
      const k = THREE.MathUtils.clamp(this._wingAnim.t / this._wingAnim.duration, 0, 1);
      // Ease-out
      const eased = 1 - Math.pow(1 - k, 3);
      for (const w of this.wings) {
        w.pivot.rotation.z = THREE.MathUtils.lerp(w.closedAngle, w.openAngle, eased);
      }
      if (k >= 1) this._wingAnim.playing = false;
    }
  }
}
