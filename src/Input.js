// src/Input.js
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = { pitch: 0, yaw: 0, roll: 0, throttle: 0, fire: false, zoom: false };
    this.keys = new Set();
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseSensitivity = 0.002;
    this.gamepadDeadzone = 0.14;
    this._mouseFire = false;
    this._mouseZoom = false;
    this._pointerLocked = false;
    this._throttleAxis = 0; // gamepad persistent throttle
    this._bindAll();
  }

  _bindAll() {
    window.addEventListener('keydown', e => { this.keys.add(e.code); if (['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); });
    window.addEventListener('keyup', e => this.keys.delete(e.code));

    this.canvas.addEventListener('click', () => this.canvas.requestPointerLock?.());
    document.addEventListener('pointerlockchange', () => { this._pointerLocked = document.pointerLockElement === this.canvas; });
    document.addEventListener('mousemove', e => { if (this._pointerLocked) { this.mouseDelta.x += e.movementX; this.mouseDelta.y += e.movementY; } });
    document.addEventListener('mousedown', e => { if (e.button === 0) this._mouseFire = true; if (e.button === 2) this._mouseZoom = true; });
    document.addEventListener('mouseup',   e => { if (e.button === 0) this._mouseFire = false; if (e.button === 2) this._mouseZoom = false; });
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  _dz(v) { return Math.abs(v) < this.gamepadDeadzone ? 0 : (v - Math.sign(v) * this.gamepadDeadzone) / (1 - this.gamepadDeadzone); }

  _readGamepad() {
    const pads = navigator.getGamepads?.() ?? [];
    for (const gp of pads) if (gp) return gp;
    return null;
  }

  update(dt) {
    let pitch = 0, yaw = 0, roll = 0, throttle = 0, fire = false, zoom = false;

    // Keyboard: W=full throttle, S=slight reverse like RS3D
    if (this.keys.has('KeyW')) throttle = 1.0;
    else if (this.keys.has('KeyS')) throttle = 0.0;

    if (this.keys.has('KeyA'))      yaw -= 1;
    if (this.keys.has('KeyD'))      yaw += 1;
    if (this.keys.has('KeyQ'))      roll += 1;
    if (this.keys.has('KeyE'))      roll -= 1;
    if (this.keys.has('ArrowUp'))   pitch += 1;
    if (this.keys.has('ArrowDown')) pitch -= 1;
    if (this.keys.has('ArrowLeft')) yaw -= 1;
    if (this.keys.has('ArrowRight'))yaw += 1;
    if (this.keys.has('Space'))     fire = true;
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) zoom = true;

    // Default throttle when no key: maintain current speed (RS3D feel)
    if (!this.keys.has('KeyW') && !this.keys.has('KeyS')) {
      throttle = this.state.throttle; // hold last
    }

    // Mouse aim
    if (this.mouseDelta.x || this.mouseDelta.y) {
      yaw   += this.mouseDelta.x * this.mouseSensitivity * 60;
      pitch -= this.mouseDelta.y * this.mouseSensitivity * 60;
      this.mouseDelta.x = this.mouseDelta.y = 0;
    }
    if (this._mouseFire) fire = true;
    if (this._mouseZoom) zoom = true;

    // Gamepad
    const gp = this._readGamepad();
    if (gp) {
      const ly = this._dz(gp.axes[1] ?? 0);
      const rx = this._dz(gp.axes[2] ?? 0);
      const ry = this._dz(gp.axes[3] ?? 0);
      const lx = this._dz(gp.axes[0] ?? 0);

      // Left stick Y: throttle (RS3D style)
      if (Math.abs(ly) > 0.05) this._throttleAxis = Math.max(0, 1 - ly);
      throttle = this._throttleAxis;

      yaw   += rx;
      pitch += -ry;
      roll  += lx;

      if (gp.buttons[7]?.value > 0.3 || gp.buttons[7]?.pressed) fire = true;
      if (gp.buttons[6]?.value > 0.3 || gp.buttons[6]?.pressed) zoom = true;
    }

    const c = v => Math.max(-1, Math.min(1, v));
    this.state.pitch    = c(pitch);
    this.state.yaw      = c(yaw);
    this.state.roll     = c(roll);
    this.state.throttle = Math.max(0, Math.min(1, throttle));
    this.state.fire     = fire;
    this.state.zoom     = zoom;
  }
}
