import * as THREE from 'three';

export class AsteroidField {
  constructor(scene, textureGen, options = {}) {
    this.scene = scene;
    this.count   = options.count   ?? 250;
    this.radius  = options.radius  ?? 600;
    this.minSize = options.minSize ?? 2;
    this.maxSize = options.maxSize ?? 14;

    this.asteroids = [];

    const tex = textureGen.generateMetalTexture({
      baseColor: '#5a4a3a', panelDensity: 0.2, weathering: 0.9
    });
    tex.repeat.set(2, 2);
    const mat = new THREE.MeshStandardMaterial({
      map: tex, color: 0x8a7c66, roughness: 0.95, metalness: 0.05
    });

    for (let i = 0; i < this.count; i++) {
      const size = this.minSize + Math.random() * (this.maxSize - this.minSize);
      const geom = new THREE.IcosahedronGeometry(size, 1);
      // Deformieren
      const pos = geom.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
        const noise = 1 + (Math.random() - 0.5) * 0.4;
        pos.setXYZ(j, x * noise, y * noise, z * noise);
      }
      geom.computeVertexNormals();

      const mesh = new THREE.Mesh(geom, mat);
      // Sphärische Verteilung in einer dicken Schale
      const r = this.radius * (0.3 + Math.random() * 0.7);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta) * 0.5, // flacher
        r * Math.cos(phi)
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      const spin = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      );

      scene.add(mesh);
      this.asteroids.push({ mesh, spin, size });
    }
  }

  /** Registriert alle Asteroiden als zerstörbare Ziele beim Combat-System. */
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
