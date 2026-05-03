// src/entities/Ship.js
import * as THREE from 'three';

/**
 * Rogue Squadron-style flight physics:
 * - Speed controlled by throttle (W/S or left stick Y), NOT inertia-first
 * - Pitch/yaw/roll feel snappy but with angular inertia
 * - Bank into turns (roll follows yaw automatically, like RS3D)
 * - Gravity compensation (ship stays "level" unless you pitch)
 */
export class Ship {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.group = new THREE.Group();
    scene.add(this.group);

    const p = def.physics;
    this.maxSpeed       = p.maxSpeed       ?? 80;
    this.acceleration   = p.acceleration   ?? 35;
    this.deceleration   = p.deceleration   ?? 22;
    this.pitchRate      = p.pitchRate      ?? 1.5;
    this.yawRate        = p.yawRate        ?? 1.2;
    this.rollRate       = p.rollRate       ?? 2.2;
    this.angularDamping = p.angularDamping ?? 3.8;
    this.laserColor     = def.laserColor   ?? 0xff3030;
    this.laserSpeed     = 260;
    this.fireCooldown   = def.fireCooldown  ?? 0.18;
    this.laserOffsets   = (def.laserOffsets ?? [[0, 0, -2]]).map(o => new THREE.Vector3(...o));

    this.speed          = 0;
    this.targetSpeed    = 0;
    this._fireTimer     = 0;
    this._dt            = 0.016;

    // Angular velocity: x=pitch, y=yaw, z=roll
    this.angularVelocity = new THREE.Vector3();

    // Rogue Squadron auto-bank: roll follows yaw input
    this._autoBankTarget = 0;
    this._autoBankCurrent = 0;

    // Wing animation state (set by subclasses)
    this.wings = [];
    this.wingAnim = { t: 0, dur: 1.2, playing: false };
  }

  /** 
   * setControls — inputs in -1..1
   * throttle: absolute target speed fraction (0=stop, 1=max, -0.3=reverse)
   */
  setControls({ pitch = 0, yaw = 0, roll = 0, throttle = 0 } = {}, dt) {
    this._dt = dt;
    // Rogue Squadron: throttle directly sets target speed
    this.targetSpeed = THREE.MathUtils.clamp(throttle, -0.3, 1.0) * this.maxSpeed;

    // Angular acceleration — RS3D felt snappy, not floaty
    this.angularVelocity.x += pitch * this.pitchRate * dt * 60 * dt;
    this.angularVelocity.y += yaw   * this.yawRate   * dt * 60 * dt;

    // Auto-bank: rolling into yaw (RS3D feel)
    const autoBankAmount = -yaw * 0.55;
    this._autoBankTarget = autoBankAmount;

    // Manual roll overrides auto-bank
    if (Math.abs(roll) > 0.05) {
      this.angularVelocity.z += roll * this.rollRate * dt * 60 * dt;
      this._autoBankTarget = 0;
    }
  }

  fireLaser(combat) {
    if (this._fireTimer > 0) return false;
    this._fireTimer = this.fireCooldown;

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.group.quaternion);
    for (const offset of this.laserOffsets) {
      const worldOff = offset.clone().applyQuaternion(this.group.quaternion);
      const origin = this.group.position.clone().add(worldOff);
      const velocity = forward.clone().multiplyScalar(this.laserSpeed + this.speed);
      combat?.spawnLaser({ origin, velocity, color: this.laserColor, owner: this });
    }
    return true;
  }

  update(dt) {
    this._dt = dt;
    this._fireTimer = Math.max(0, this._fireTimer - dt);

    // Speed: direct approach like RS3D (no float, snap to target)
    const accel = this.targetSpeed > this.speed ? this.acceleration : this.deceleration;
    const maxDelta = accel * dt;
    const delta = THREE.MathUtils.clamp(this.targetSpeed - this.speed, -maxDelta, maxDelta);
    this.speed += delta;

    // Angular damping (exponential, framerate-independent)
    const damp = Math.exp(-this.angularDamping * dt);
    this.angularVelocity.multiplyScalar(damp);

    // Auto-bank lerp
    this._autoBankCurrent = THREE.MathUtils.lerp(this._autoBankCurrent, this._autoBankTarget, 1 - Math.exp(-8 * dt));
    this.angularVelocity.z = THREE.MathUtils.lerp(this.angularVelocity.z, this._autoBankCurrent * this.rollRate * 0.5, 1 - Math.exp(-6 * dt));

    // Apply rotations in local space
    const q = this.group.quaternion;
    const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.angularVelocity.x);
    const yawQ   = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.angularVelocity.y);
    const rollQ  = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), this.angularVelocity.z);
    q.multiply(pitchQ).multiply(yawQ).multiply(rollQ);

    // Translation along local -Z
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    this.group.position.addScaledVector(forward, this.speed * dt);

    // Wing animation
    if (this.wingAnim.playing && this.wings.length) {
      this.wingAnim.t += dt;
      const k = Math.min(this.wingAnim.t / this.wingAnim.dur, 1);
      const e = 1 - Math.pow(1 - k, 3);
      for (const w of this.wings) w.pivot.rotation.z = w.ca + (w.oa - w.ca) * e;
      if (k >= 1) this.wingAnim.playing = false;
    }
  }

  get position()   { return this.group.position; }
  get quaternion() { return this.group.quaternion; }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
