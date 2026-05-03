import * as THREE from 'three';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.target = null;

    // Konfiguration
    this.normalOffset = new THREE.Vector3(0, 2.2, 8.5);
    this.zoomOffset   = new THREE.Vector3(0, 1.0, 4.5);
    this.normalFov    = 75;
    this.zoomFov      = 45;
    this.lookAhead    = 6;     // Punkt vor dem Schiff, auf den die Kamera blickt
    this.posLerp      = 6.0;   // Translations-Smoothing
    this.rotLerp      = 5.0;   // Rotations-Smoothing
    this.fovLerp      = 8.0;

    // State
    this.zoom = false;
    this._currentOffset = this.normalOffset.clone();
    this._lookTarget = new THREE.Vector3();
    this._tmpPos = new THREE.Vector3();
    this._tmpQuat = new THREE.Quaternion();
  }

  attach(ship) {
    this.target = ship;
    // Initiale Position setzen, damit kein Sprung beim ersten Frame
    if (ship) {
      const desired = this._desiredPosition();
      this.camera.position.copy(desired);
      this.camera.quaternion.copy(ship.quaternion);
    }
  }

  setZoom(active) {
    this.zoom = !!active;
  }

  _desiredPosition() {
    const offset = this.zoom ? this.zoomOffset : this.normalOffset;
    return offset.clone()
      .applyQuaternion(this.target.quaternion)
      .add(this.target.position);
  }

  update(dt) {
    if (!this.target) return;

    // Smooth offset (verhindert Snap beim Zoom-Toggle)
    const desiredOffset = this.zoom ? this.zoomOffset : this.normalOffset;
    this._currentOffset.lerp(desiredOffset, 1 - Math.exp(-this.posLerp * dt));

    // Position
    this._tmpPos.copy(this._currentOffset)
      .applyQuaternion(this.target.quaternion)
      .add(this.target.position);

    const t = 1 - Math.exp(-this.posLerp * dt);
    this.camera.position.lerp(this._tmpPos, t);

    // Look-Target: Punkt vor dem Schiff
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.target.quaternion);
    this._lookTarget.copy(this.target.position).addScaledVector(forward, this.lookAhead);

    // Smooth Rotation: über quaternion lookAt
    const m = new THREE.Matrix4().lookAt(this.camera.position, this._lookTarget, this._upVector());
    this._tmpQuat.setFromRotationMatrix(m);
    const tr = 1 - Math.exp(-this.rotLerp * dt);
    this.camera.quaternion.slerp(this._tmpQuat, tr);

    // FOV
    const targetFov = this.zoom ? this.zoomFov : this.normalFov;
    const tf = 1 - Math.exp(-this.fovLerp * dt);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, tf);
    this.camera.updateProjectionMatrix();
  }

  _upVector() {
    // Nutze die Up-Achse des Schiffs, damit Roll auf die Kamera durchschlägt
    return new THREE.Vector3(0, 1, 0).applyQuaternion(this.target.quaternion);
  }
}
