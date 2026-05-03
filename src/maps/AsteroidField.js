// src/maps/AsteroidField.js
import * as THREE from 'three';

export class AsteroidField {
  constructor(scene, textureGen, options = {}) {
    this.scene = scene;
    this.asteroids = [];
    const count   = options.count   ?? 200;
    const radius  = options.radius  ?? 500;
    const minSize = options.minSize ?? 2;
    const maxSize = options.maxSize ?? 14;

    const tex = textureGen.generateMetalTexture({ baseColor: '#5a4a3a', panelDensity: 0.15, weathering: 0.95 });
    tex.repeat.set(2, 2);
    const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x8a7c66, roughness: 0.95, metalness: 0.04 });

    for (let i = 0; i < count; i++) {
      const size = minSize + Math.random() * (maxSize - minSize);
      const geo = new THREE.IcosahedronGeometry(size, 1);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const n = 1 + (Math.random() - 0.5) * 0.42;
        pos.setXYZ(j, pos.getX(j) * n, pos.getY(j) * n, pos.getZ(j) * n);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, mat);
      const r = radius * (0.2 + Math.random() * 0.8);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.45,
        r * Math.cos(phi)
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      const spin = new THREE.Vector3((Math.random()-0.5)*0.22,(Math.random()-0.5)*0.22,(Math.random()-0.5)*0.22);
      scene.add(mesh);
      this.asteroids.push({ mesh, spin, size });
    }
  }

  registerWithCombat(combat, audio) {
    for (const a of this.asteroids) {
      const hp = Math.max(1, Math.floor(a.size / 3));
      combat.registerTarget(a.mesh, hp, () => audio?.playExplosion());
    }
  }

  update(dt) {
    for (const a of this.asteroids) {
      if (!a.mesh.parent) continue;
      a.mesh.rotation.x += a.spin.x * dt;
      a.mesh.rotation.y += a.spin.y * dt;
      a.mesh.rotation.z += a.spin.z * dt;
    }
  }
}
