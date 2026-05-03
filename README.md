---

## 🏗️ Architecture Notes

A few design choices worth highlighting if you want to extend the project:

**Quaternion-based rotation.** The `Ship` base class composes pitch/yaw/roll as local quaternion multiplications instead of Euler angles. This avoids gimbal lock, which matters in a space game where there's no "up."

**Frame-rate independent smoothing.** The follow camera uses `1 - exp(-k * dt)` instead of linear lerp, so the feel stays consistent at 30, 60, or 144 FPS.

**Continuous collision detection.** The combat system raycasts along each laser's full per-frame movement, so lasers never tunnel through asteroids even at very high relative speeds.

**Texture caching.** `TextureGen` keys generated textures by their parameters, so spawning multiple ships of the same type doesn't re-render the canvas.

**Modular ship definitions.** All ship-specific physics (max speed, agility, laser color, fire rate, hardpoint positions) live in the constructor of the subclass, so adding a new ship is mostly geometry + a few numbers.

---

## 🛠️ Extending the Game

Some natural directions to take this:

- **AI opponents** — spawn enemy ships that pathfind through the asteroid field
- **Mission system** — escort, dogfight, trench-run scenarios
- **More ships** — Y-Wing, A-Wing, TIE Bomber (all geometry, no asset loading needed)
- **S-Foil toggle** — bind `openWings()` / `closeWings()` to combat state instead of just spawn
- **Shield system** — add `hp` to the player ship and a HUD bar
- **Post-processing** — bloom on engine glows and laser trails via `EffectComposer`
- **Multiplayer** — WebRTC or WebSocket-based dogfighting

---

## 📜 License

MIT — do whatever you want, but a star on the repo is appreciated. ⭐

---

## 🙏 Acknowledgments

- Inspired by **Star Wars: Rogue Squadron** (Factor 5 / LucasArts) and **Star Wars: Battlefront** (DICE)
- Built with [Three.js](https://threejs.org/) by Mr.doob and contributors



rogue-squadron-parody/
├── index.html                    # Entry point + HUD markup + import map
└── src/
├── main.js                   # Game loop, scene setup, ship switching
├── Camera.js                 # Battlefront-style follow camera with ADS zoom
├── Input.js                  # Unified input: keyboard, mouse, gamepad, touch
├── Audio.js                  # Web Audio API: procedural lasers + synth music
├── entities/
│   ├── Ship.js               # Base class — physics, controls, fireLaser()
│   ├── XWing.js              # X-Wing geometry + S-Foil animation
│   └── Interceptor.js        # Interceptor geometry + hex solar wings
├── systems/
│   ├── TextureGen.js         # Canvas-based procedural metal textures
│   └── Combat.js             # Laser projectiles, raycast hits, explosions
└── maps/
└── AsteroidField.js      # Procedural asteroid generation + spin
- This is a non-commercial fan parody. Star Wars and all related properties belong to Lucasfilm Ltd. / Disney.

---

*May the Force be with your framerate.*
