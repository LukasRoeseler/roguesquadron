import * as THREE from 'three';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.lasers = [];
    this.explosions = [];
    this.targets = []; // { mesh, hp, onHit, onDestroy }
    this._raycaster = new THREE.Raycaster();
    this._tmpDir = new THREE.Vector3();
  }

  registerTarget(mesh, hp = 1, onDestroy = null) {
    const t = { mesh, hp, maxHp: hp, onDestroy };
    this.targets.push(t);
    return t;
  }

  spawnLaser({ origin, velocity, color = 0xff3030, owner = null, lifetime = 2.0 }) {
    const length = 2.5;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0,
      0, 0, -length
    ], 3));
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geom, mat);

    line.position.copy(origin);
    // Ausrichtung auf Bewegungsrichtung
    const dir = velocity.clone().normalize();
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, new THREE.Vector3(0, 1, 0));
    line.quaternion.setFromRotationMatrix(m);
    // lookAt zeigt -Z entlang dir – passt zu unserer Geometrie

    this.scene.add(line);

    // Glow als sprite-ähnlicher Punkt
    const glowMat = new THREE.PointsMaterial({ color, size: 0.5, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
    const glowGeom = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0,0,0], 3));
    const glow = new THREE.Points(glowGeom, glowMat);
    line.add(glow);

    this.lasers.push({ mesh: line, velocity: velocity.clone(), age: 0, lifetime, owner });
  }

  _spawnExplosion(position, color = 0xffaa44) {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i*3] = positions[i*3+1] = positions[i*3+2] = 0;
      const v = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize().multiplyScalar(8 + Math.random() * 12);
      velocities.push(v);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color, size: 0.6, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const points = new THREE.Points(geom, mat);
    points.position.copy(position);
    this.scene.add(points);

    this.explosions.push({ points, velocities, age: 0, lifetime: 1.0 });
  }

  update(dt) {
    // Laser-Bewegung + Raycast
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const L = this.lasers[i];
      L.age += dt;
      if (L.age >= L.lifetime) {
        this.scene.remove(L.mesh);
        L.mesh.geometry.dispose(); L.mesh.material.dispose();
        this.lasers.splice(i, 1);
        continue;
      }

      const stepLen = L.velocity.length() * dt;
      this._tmpDir.copy(L.velocity).normalize();

      // Raycast über das ganze Step-Segment
      this._raycaster.set(L.mesh.position, this._tmpDir);
      this._raycaster.far = stepLen + 2.0;

      const meshes = this.targets
        .filter(t => t.hp > 0 && t.mesh !== L.owner?.hull)
        .map(t => t.mesh);

      let hit = null;
      if (meshes.length > 0) {
        const intersections = this._raycaster.intersectObjects(meshes, true);
        if (intersections.length > 0) hit = intersections[0];
      }

      if (hit) {
        // Schaden zuweisen: finde Top-Level-Target
        let root = hit.object;
        while (root.parent && !this.targets.find(t => t.mesh === root)) {
          if (root.parent === this.scene) break;
          root = root.parent;
        }
        const target = this.targets.find(t => t.mesh === root) ||
                       this.targets.find(t => t.mesh === hit.object);
        if (target) {
          target.hp -= 1;
          this._spawnExplosion(hit.point, L.mesh.material.color.getHex());
          if (target.hp <= 0) {
            target.onDestroy?.(target);
            this.scene.remove(target.mesh);
            this._spawnExplosion(target.mesh.position, 0xffaa44);
            this.targets = this.targets.filter(t => t !== target);
          }
        }
        this.scene.remove(L.mesh);
        L.mesh.geometry.dispose(); L.mesh.material.dispose();
        this.lasers.splice(i, 1);
        continue;
      }

      // Bewegung anwenden
      L.mesh.position.addScaledVector(L.velocity, dt);
    }

    // Partikel-Explosionen updaten
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.age += dt;
      const k = ex.age / ex.lifetime;
      if (k >= 1) {
        this.scene.remove(ex.points);
        ex.points.geometry.dispose(); ex.points.material.dispose();
        this.explosions.splice(i, 1);
        continue;
      }
      const posAttr = ex.points.geometry.getAttribute('position');
      for (let j = 0; j < ex.velocities.length; j++) {
        posAttr.array[j*3]   += ex.velocities[j].x * dt;
        posAttr.array[j*3+1] += ex.velocities[j].y * dt;
        posAttr.array[j*3+2] += ex.velocities[j].z * dt;
      }
      posAttr.needsUpdate = true;
      ex.points.material.opacity = 1 - k;
    }
  }
}
