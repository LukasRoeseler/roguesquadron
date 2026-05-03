export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = {
      pitch: 0,    // -1..1
      yaw: 0,
      roll: 0,
      throttle: 0, // 0..1 (Stick-Y oder W/S)
      fire: false,
      zoom: false,
    };

    this.keys = new Set();
    this.mouseDelta = { x: 0, y: 0 };
    this.mouseSensitivity = 0.0025;
    this.gamepadDeadzone = 0.15;

    this._bindKeyboard();
    this._bindMouse();
    this._bindTouch();
  }

  // ---------- Keyboard ----------
  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  // ---------- Mouse ----------
  _bindMouse() {
    this.canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock?.();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.mouseDelta.x += e.movementX;
        this.mouseDelta.y += e.movementY;
      }
    });
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) this._mouseFire = true;
      if (e.button === 2) this._mouseZoom = true;
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this._mouseFire = false;
      if (e.button === 2) this._mouseZoom = false;
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // ---------- Touch (Virtuelle Joysticks) ----------
  _bindTouch() {
    this._touchLeft  = this._setupJoystick('joy-left');
    this._touchRight = this._setupJoystick('joy-right');

    const fireBtn = document.getElementById('btn-fire');
    const zoomBtn = document.getElementById('btn-zoom');
    if (fireBtn) {
      fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this._touchFire = true; });
      fireBtn.addEventListener('touchend',   (e) => { e.preventDefault(); this._touchFire = false; });
    }
    if (zoomBtn) {
      zoomBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this._touchZoom = true; });
      zoomBtn.addEventListener('touchend',   (e) => { e.preventDefault(); this._touchZoom = false; });
    }
  }

  _setupJoystick(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const knob = el.querySelector('.knob');
    const data = { x: 0, y: 0, active: false, id: null };
    const radius = 60;

    const onStart = (e) => {
      const t = e.changedTouches[0];
      data.active = true; data.id = t.identifier;
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!data.active) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== data.id) continue;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = t.clientX - cx, dy = t.clientY - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) { dx = dx / dist * radius; dy = dy / dist * radius; }
        data.x = dx / radius;
        data.y = dy / radius;
        if (knob) knob.style.transform = `translate(${dx - 25}px, ${dy - 25}px)`;
      }
      e.preventDefault();
    };
    const onEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === data.id) {
          data.active = false; data.id = null; data.x = 0; data.y = 0;
          if (knob) knob.style.transform = '';
        }
      }
      e.preventDefault();
    };
    el.addEventListener('touchstart', onStart, { passive: false });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: false });
    el.addEventListener('touchcancel', onEnd,  { passive: false });
    return data;
  }

  // ---------- Gamepad ----------
  _readGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) if (gp) return gp;
    return null;
  }

  _dz(v) { return Math.abs(v) < this.gamepadDeadzone ? 0 : v; }

  // ---------- Update ----------
  update(dt) {
    let pitch = 0, yaw = 0, roll = 0, throttle = 0, fire = false, zoom = false;

    // Keyboard
    if (this.keys.has('KeyW')) throttle = 1.0;
    else if (this.keys.has('KeyS')) throttle = -0.3;
    if (this.keys.has('KeyA')) yaw -= 1;
    if (this.keys.has('KeyD')) yaw += 1;
    if (this.keys.has('KeyQ')) roll += 1;
    if (this.keys.has('KeyE')) roll -= 1;
    if (this.keys.has('ArrowUp'))    pitch += 1;
    if (this.keys.has('ArrowDown'))  pitch -= 1;
    if (this.keys.has('ArrowLeft'))  yaw   -= 1;
    if (this.keys.has('ArrowRight')) yaw   += 1;
    if (this.keys.has('Space')) fire = true;
    if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) zoom = true;

    // Mouse: bewegt Pitch/Yaw additiv
    if (this.mouseDelta.x !== 0 || this.mouseDelta.y !== 0) {
      yaw   += this.mouseDelta.x * this.mouseSensitivity * 60; // in "rate units"
      pitch -= this.mouseDelta.y * this.mouseSensitivity * 60;
      this.mouseDelta.x = 0;
      this.mouseDelta.y = 0;
    }
    if (this._mouseFire) fire = true;
    if (this._mouseZoom) zoom = true;

    // Gamepad: linker Stick Y = Throttle, rechter Stick = Pitch/Yaw, Trigger
    const gp = this._readGamepad();
    if (gp) {
      const lx = this._dz(gp.axes[0] || 0);
      const ly = this._dz(gp.axes[1] || 0);
      const rx = this._dz(gp.axes[2] || 0);
      const ry = this._dz(gp.axes[3] || 0);

      // Linker Stick: Y für Speed (nach oben drücken = beschleunigen)
      throttle = -ly; // -1 (oben) wird zu +1
      // Linker Stick X kann optional Roll machen
      roll += lx;

      // Rechter Stick: Pitch/Yaw
      yaw   += rx;
      pitch += -ry;

      // Schultertasten zusätzlich für Roll
      if (gp.buttons[4]?.pressed) roll -= 1;
      if (gp.buttons[5]?.pressed) roll += 1;

      // Trigger: rechter (7) feuern, linker (6) zoom
      if (gp.buttons[7]?.value > 0.4 || gp.buttons[7]?.pressed) fire = true;
      if (gp.buttons[6]?.value > 0.4 || gp.buttons[6]?.pressed) zoom = true;
    }

    // Touch
    if (this._touchLeft && this._touchLeft.active) {
      throttle = -this._touchLeft.y;
      roll += this._touchLeft.x;
    }
    if (this._touchRight && this._touchRight.active) {
      yaw   += this._touchRight.x;
      pitch += -this._touchRight.y;
    }
    if (this._touchFire) fire = true;
    if (this._touchZoom) zoom = true;

    // Clamp
    const c = (v) => Math.max(-1, Math.min(1, v));
    this.state.pitch    = c(pitch);
    this.state.yaw      = c(yaw);
    this.state.roll     = c(roll);
    this.state.throttle = Math.max(-1, Math.min(1, throttle));
    this.state.fire     = fire;
    this.state.zoom     = zoom;
  }
}
