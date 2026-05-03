import * as THREE from 'three';

export class Ship {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    // Konfiguration
    this.maxSpeed       = options.maxSpeed       ?? 80;
    this.acceleration   = options.acceleration   ?? 40;
    this.deceleration   = options.deceleration   ?? 20;
    this.pitchRate      = options.pitchRate      ?? 1.6;
    this.yawRate        = options.yawRate        ?? 1.4;
    this.rollRate       = options.rollRate       ?? 2.4;
    this.angularDamping = options.angularDamping ?? 4.0;
    this.laserColor     = options.laserColor     ?? 0xff3030;
    this.laserSpeed     = options.laserSpeed     ?? 250;
    this.fireCooldown   = options.fireCooldown   ?? 0.15;
    this.laserOffsets   = options.laserOffsets   ?? [new THREE.Vector3(0, 0, -2)];

    // State
    this.speed          = 0;          // skalar entlang -Z (lokal)
    this.targetSpeed    = 0;
    this.angularVelocity = new THREE.Vector3(); // x=pitch, y=yaw, z=roll
    this._fireTimer     = 0;
    this._activeLasers  = [];

    // Subklassen füllen
    this.hull = null;
  }

  /** Steuer-Inputs (-1..1) */
  setControls({ pitch = 0, yaw = 0, roll = 0, throttle = 0 } = {}) {
    // Throttle ist absolut (Stick-Y), nicht inkrementell
    this.targetSpeed = THREE.MathUtils.clamp(throttle, -0.3, 1.0) * this.maxSpeed;

    // Angular acceleration
    this.angularVelocity.x += pitch * this.pitchRate * this._dt;
    this.angularVelocity.y += yaw   * this.yawRate   * this._dt;
    this.angularVelocity.z += roll  * this.rollRate  * this._dt;
  }

  fireLaser(combat) {
    if (this._fireTimer > 0) return false;
    this._fireTimer = this.fireCooldown;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion);
    for (const offset of this.laserOffsets) {
      const worldOffset = offset.clone().applyQuaternion(this.group.quaternion);
      const origin = this.group.position.clone().add(worldOffset);
      const velocity = forward.clone().multiplyScalar(this.laserSpeed);
      // Bestehende Schiff-Geschwindigkeit zum Laser addieren (realistischer)
      const shipVel = forward.clone().multiplyScalar(this.speed);
      velocity.add(shipVel);
      combat?.spawnLaser({
        origin, velocity, color: this.laserColor, owner: this
      });
    }
    return true;
  }

  /** Hauptupdate. dt in Sekunden. */
  update(dt) {
    this._dt = dt;
    this._fireTimer = Math.max(0, this._fireTimer - dt);

    // Trägheit: Lerp zur Zielgeschwindigkeit
    const accel = this.targetSpeed > this.speed ? this.acceleration : this.deceleration;
    const delta = THREE.MathUtils.clamp(this.targetSpeed - this.speed, -accel * dt, accel * dt);
    this.speed += delta;

    // Angular damping
    const damp = Math.exp(-this.angularDamping * dt);
    this.angularVelocity.multiplyScalar(damp);

    // Rotationen anwenden (lokal)
    const q = this.group.quaternion;
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.angularVelocity.x * dt);
    const yawQ   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.angularVelocity.y * dt);
    const rollQ  = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.angularVelocity.z * dt);
    q.multiply(pitchQ).multiply(yawQ).multiply(rollQ);

    // Translation entlang lokaler -Z
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    this.group.position.addScaledVector(forward, this.speed * dt);
  }

  get position()    { return this.group.position; }
  get quaternion()  { return this.group.quaternion; }
}
