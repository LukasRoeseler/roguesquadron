// src/Camera.js
import * as THREE from 'three';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.normalOffset = new THREE.Vector3(0, 2.0, 8.0);
    this.zoomOffset   = new THREE.Vector3(0, 0.8, 4.0);
    this.normalFov    = 75;
    this.zoomFov      = 45;
    this.posLerp      = 5.5;
    this.rotLerp      = 4.5;
    this.fovLerp      = 8.0;
    this.lookAheadDist= 6;
    this.zoom = false;
    this._curOffset = this.normalOffset.clone();
    this._lookTarget = new THREE.Vector3();
    this._tmpPos = new THREE.Vector3();
    this._tmpQ = new THREE.Quaternion();
  }

  attach(ship) {
    this.target = ship;
    if (ship) {
      const off = this.normalOffset.clone().applyQuaternion(ship.quaternion).add(ship.position);
      this.camera.position.copy(off);
    }
  }

  setZoom(z) { this.zoom = !!z; }

  update(dt) {
    if (!this.target) return;
    const desOff = this.zoom ? this.zoomOffset : this.normalOffset;
    this._curOffset.lerp(desOff, 1 - Math.exp(-this.posLerp * dt));

    this._tmpPos.copy(this._curOffset)
      .applyQuaternion(this.target.quaternion)
      .add(this.target.position);
    this.camera.position.lerp(this._tmpPos, 1 - Math.exp(-this.posLerp * dt));

    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.target.quaternion);
    this._lookTarget.copy(this.target.position).addScaledVector(fwd, this.lookAheadDist);

    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.target.quaternion);
    const m = new THREE.Matrix4().lookAt(this.camera.position, this._lookTarget, up);
    this._tmpQ.setFromRotationMatrix(m);
    this.camera.quaternion.slerp(this._tmpQ, 1 - Math.exp(-this.rotLerp * dt));

    const tFov = this.zoom ? this.zoomFov : this.normalFov;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, tFov, 1 - Math.exp(-this.fovLerp * dt));
    this.camera.updateProjectionMatrix();
  }
}
