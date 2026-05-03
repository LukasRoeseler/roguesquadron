import * as THREE from 'three';
import { Ship } from './Ship.js';

export class Interceptor extends Ship {
  constructor(scene, textureGen) {
    super(scene, {
      maxSpeed: 110,
      acceleration: 55,
      pitchRate: 2.0,
      yawRate: 1.7,
      rollRate: 3.0,
      angularDamping: 4.5,
      laserColor: 0x33ff55,
      fireCooldown: 0.12,
      laserOffsets: [
        new THREE.Vector3( 0.0,  1.4, -1.0),
        new THREE.Vector3( 0.0, -1.4, -1.0),
      ],
    });

    const tex = textureGen.generateMetalTexture({
      baseColor: '#5a6068', panelDensity: 0.7, weathering: 0.3
    });
    const hullMat = new THREE.MeshStandardMaterial({
      map: tex, metalness: 0.75, roughness: 0.4
    });
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x1a3322, metalness: 0.95, roughness: 0.08
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x222a30, metalness: 0.5, roughness: 0.7, side: THREE.DoubleSide
    });

    // Kugelförmiges Cockpit (Hauptkörper)
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), hullMat);
    this.group.add(cockpit);

    // Sichtfenster (dunkleres Segment)
    const window = new THREE.Mesh(
      new THREE.SphereGeometry(0.86, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45),
      cockpitMat
    );
    window.rotation.x = Math.PI * 0.25;
    this.group.add(window);

    // Verbindungsstreben zu den Flügeln
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x33383d, metalness: 0.7, roughness: 0.5 });
    const strutGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);

    const strutTop = new THREE.Mesh(strutGeo, strutMat);
    strutTop.position.set(0, 1.0, 0);
    this.group.add(strutTop);

    const strutBot = new THREE.Mesh(strutGeo, strutMat);
    strutBot.position.set(0, -1.0, 0);
    this.group.add(strutBot);

    // Sechseckige Solarflügel (oben + unten)
    const hexShape = new THREE.Shape();
    const r = 1.4;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) hexShape.moveTo(x, y); else hexShape.lineTo(x, y);
    }
    hexShape.closePath();
    const hexGeo = new THREE.ShapeGeometry(hexShape);

    for (const sign of [1, -1]) {
      const wing = new THREE.Mesh(hexGeo, wingMat);
      wing.rotation.y = Math.PI / 2;
      wing.position.set(0, sign * 1.8, 0);
      this.group.add(wing);

      // Gitter-Detail auf dem Flügel (Solarzellen-Andeutung)
      const gridMat = new THREE.MeshStandardMaterial({
        color: 0x4a5560, metalness: 0.3, roughness: 0.8, wireframe: true
      });
      const grid = new THREE.Mesh(hexGeo, gridMat);
      grid.rotation.y = Math.PI / 2;
      grid.position.set(0, sign * 1.81, 0);
      this.group.add(grid);
    }

    // Heck-Triebwerk
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.3 });
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 12), engineMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.z = 0.9;
    this.group.add(engine);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.35, 16),
      new THREE.MeshBasicMaterial({ color: 0x33ff88 })
    );
    glow.position.z = 1.21;
    glow.rotation.y = Math.PI;
    this.group.add(glow);

    this.hull = this.group;
  }
}
