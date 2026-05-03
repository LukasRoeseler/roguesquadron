// src/systems/Combat.js
import * as THREE from 'three';

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.lasers = [];
    this.explosions = [];
    this.targets = [];
    this._ray = new THREE.Raycaster();
  }

  registerTarget(mesh, hp = 1, onDestroy = null) {
    const t = { mesh, hp, onDestroy };
    this.targets.push(t);
    return t;
  }

  spawnLaser({ origin, velocity, color = 0xff3030, owner = null, lifetime = 2.2 }) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -2.8], 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
    const line = new THREE.Line(geom, mat);
    line.position.copy(origin);
    const dir = velocity.clone().normalize();
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), dir, new THREE.Vector3(0, 1, 0));
    line.quaternion.setFromRotationMatrix(m);
    this.scene.add(line);
    this.lasers.push({ mesh: line, velocity: velocity.clone(), age: 0, lifetime, owner });
  }

  _spawnExplosion(position, color) {
    const count = 24;
    const pos = new Float32Array(count * 3);
    const vels = [];
    for (let i = 0; i < count; i++) {
      pos[i*3] = pos[i*3+1] = pos[i*3+2] = 0;
      vels.push(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(6 + Math.random() * 14));
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ color, size: 0.55, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(g, m);
    pts.position.copy(position); this.scene.add(pts);
    this.explosions.push({ pts, vels, age: 0, lifetime: 0.9 });
  }

  update(dt) {
    const meshes = this.targets.filter(t => t.hp > 0 && t.mesh.parent).map(t => t.mesh);

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const L = this.lasers[i]; L.age += dt;
      if (L.age >= L.lifetime) { this._removeLaser(i); continue; }

      const step = L.velocity.length() * dt;
      const dir = L.velocity.clone().normalize();
      this._ray.set(L.mesh.position, dir); this._ray.far = step + 2;

      const ownerGroup = L.owner?.group;
      const filteredMeshes = meshes.filter(m => m !== ownerGroup && !m.isDescendantOf?.(ownerGroup));
      const hits = filteredMeshes.length ? this._ray.intersectObjects(filteredMeshes, true) : [];

      if (hits.length) {
        let root = hits[0].object;
        while (root.parent && root.parent !== this.scene) root = root.parent;
        const target = this.targets.find(t => t.mesh === root) ?? this.targets.find(t => t.mesh === hits[0].object);
        if (target && target.hp > 0) {
          target.hp -= 1;
          this._spawnExplosion(hits[0].point, L.mesh.material.color.getHex());
          if (target.hp <= 0) {
            target.onDestroy?.(target);
            this._spawnExplosion(target.mesh.position, 0xffaa44);
            this.scene.remove(target.mesh);
            this.targets = this.targets.filter(t => t !== target);
          }
        }
        this._removeLaser(i); continue;
      }

      L.mesh.position.addScaledVector(L.velocity, dt);
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i]; ex.age += dt;
      if (ex.age >= ex.lifetime) { this.scene.remove(ex.pts); ex.pts.geometry.dispose(); ex.pts.material.dispose(); this.explosions.splice(i, 1); continue; }
      const pa = ex.pts.geometry.getAttribute('position');
      for (let j = 0; j < ex.vels.length; j++) {
        pa.array[j*3]   += ex.vels[j].x * dt;
        pa.array[j*3+1] += ex.vels[j].y * dt;
        pa.array[j*3+2] += ex.vels[j].z * dt;
      }
      pa.needsUpdate = true;
      ex.pts.material.opacity = 1 - ex.age / ex.lifetime;
    }
  }

  _removeLaser(i) {
    const L = this.lasers[i];
    this.scene.remove(L.mesh); L.mesh.geometry.dispose(); L.mesh.material.dispose();
    this.lasers.splice(i, 1);
  }
}
