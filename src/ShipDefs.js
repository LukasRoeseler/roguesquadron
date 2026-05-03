// src/ships/ShipDefs.js
// All ship definitions: stats, geometry builders, laser configs

import * as THREE from 'three';

export const SHIP_DEFS = [
  {
    id: 'xwing',
    name: 'X-WING',
    secondary: 'SECONDARY WEAPON: SEEKER TORPEDOES',
    desc: 'A reliable starfighter of the Rebel Alliance. Four laser cannons, proton torpedo launchers. S-foils deploy for combat.',
    stats: { speed: 60, agility: 55, firepower: 70, shields: 80 },
    physics: { maxSpeed: 80, acceleration: 35, deceleration: 22, pitchRate: 1.5, yawRate: 1.2, rollRate: 2.2, angularDamping: 3.8 },
    laserColor: 0xff2020,
    fireCooldown: 0.18,
    laserOffsets: [
      [1.6, 0.6, -1.5], [-1.6, 0.6, -1.5],
      [1.6, -0.6, -1.5], [-1.6, -0.6, -1.5],
    ],
    build: buildXWing,
  },
  {
    id: 'awing',
    name: 'A-WING',
    secondary: 'SECONDARY WEAPON: ADVANCED SEEKER MISSILES',
    desc: 'The fastest starfighter in the Rebel fleet. Extremely maneuverable. Dual laser cannons. Lacks shields but makes up for it in raw speed.',
    stats: { speed: 95, agility: 90, firepower: 55, shields: 35 },
    physics: { maxSpeed: 120, acceleration: 65, deceleration: 35, pitchRate: 2.2, yawRate: 2.0, rollRate: 3.2, angularDamping: 5.0 },
    laserColor: 0xff6600,
    fireCooldown: 0.10,
    laserOffsets: [[0.6, 0, -1.8], [-0.6, 0, -1.8]],
    build: buildAWing,
  },
  {
    id: 'ywing',
    name: 'Y-WING',
    secondary: 'SECONDARY WEAPON: ADVANCED BOMBS',
    desc: 'A heavy assault bomber. Slow but devastating firepower. Twin ion cannons and proton bomb bays make it ideal for capital ship attacks.',
    stats: { speed: 35, agility: 30, firepower: 90, shields: 85 },
    physics: { maxSpeed: 55, acceleration: 20, deceleration: 15, pitchRate: 1.0, yawRate: 0.9, rollRate: 1.5, angularDamping: 3.0 },
    laserColor: 0xff9900,
    fireCooldown: 0.28,
    laserOffsets: [[0.5, 0.3, -2.5], [-0.5, 0.3, -2.5]],
    build: buildYWing,
  },
  {
    id: 'interceptor',
    name: 'TIE INTERCEPTOR',
    secondary: 'SECONDARY WEAPON: NONE',
    desc: 'The Empire\'s elite starfighter. Extremely fast and agile but no shields or hyperdrive. Four laser cannons. Feared throughout the galaxy.',
    stats: { speed: 90, agility: 85, firepower: 65, shields: 10 },
    physics: { maxSpeed: 110, acceleration: 55, deceleration: 30, pitchRate: 2.0, yawRate: 1.8, rollRate: 3.0, angularDamping: 4.5 },
    laserColor: 0x33ff55,
    fireCooldown: 0.12,
    laserOffsets: [[0, 1.4, -1.0], [0, -1.4, -1.0]],
    build: buildInterceptor,
  },
  {
    id: 'millennium',
    name: 'MILLENNIUM FALCON',
    secondary: 'SECONDARY WEAPON: SEEKER TORPEDOES',
    desc: 'Made the Kessel Run in 12 parsecs. Heavily modified Corellian freighter. Sluggish but extremely durable with twin quad laser turrets.',
    stats: { speed: 45, agility: 35, firepower: 80, shields: 95 },
    physics: { maxSpeed: 65, acceleration: 22, deceleration: 18, pitchRate: 0.9, yawRate: 0.8, rollRate: 1.2, angularDamping: 3.0 },
    laserColor: 0xff4400,
    fireCooldown: 0.22,
    laserOffsets: [[1.5, 0.5, -0.5], [-1.5, 0.5, -0.5]],
    build: buildFalcon,
  },
  {
    id: 'naboo',
    name: 'NABOO STARFIGHTER',
    secondary: 'SECONDARY WEAPON: SEEKER TORPEDOES',
    desc: 'Elegant Naboo N-1 Starfighter. Twin radial J-type engines, proton torpedo launchers. Faster than it looks, with exceptional handling.',
    stats: { speed: 75, agility: 70, firepower: 60, shields: 60 },
    physics: { maxSpeed: 95, acceleration: 45, deceleration: 28, pitchRate: 1.8, yawRate: 1.6, rollRate: 2.6, angularDamping: 4.2 },
    laserColor: 0xffdd00,
    fireCooldown: 0.15,
    laserOffsets: [[0.5, 0, -2.2], [-0.5, 0, -2.2]],
    build: buildNaboo,
  },
  {
    id: 'speeder',
    name: 'SPEEDER',
    secondary: 'SECONDARY WEAPON: TOW CABLE',
    desc: 'Incom T-47 Airspeeder modified for combat on Hoth. Extremely fast in atmosphere. Twin laser cannons. The tow cable can trip AT-ATs.',
    stats: { speed: 80, agility: 75, firepower: 50, shields: 45 },
    physics: { maxSpeed: 100, acceleration: 50, deceleration: 32, pitchRate: 1.7, yawRate: 1.5, rollRate: 2.5, angularDamping: 4.3 },
    laserColor: 0x88aaff,
    fireCooldown: 0.14,
    laserOffsets: [[0.8, -0.2, -1.5], [-0.8, -0.2, -1.5]],
    build: buildSpeeder,
  },
  {
    id: 'vwing',
    name: 'V-WING',
    secondary: 'SECONDARY WEAPON: SEEKER CLUSTER MISSILES',
    desc: 'Alpha-3 Nimbus V-wing starfighter. Republic attack craft with twin laser cannons and cluster missiles. Highly maneuverable at speed.',
    stats: { speed: 85, agility: 80, firepower: 65, shields: 50 },
    physics: { maxSpeed: 105, acceleration: 52, deceleration: 30, pitchRate: 1.9, yawRate: 1.7, rollRate: 2.8, angularDamping: 4.4 },
    laserColor: 0x00ccff,
    fireCooldown: 0.13,
    laserOffsets: [[0.4, 0.4, -1.6], [-0.4, 0.4, -1.6]],
    build: buildVWing,
  },
];

// ===== GEOMETRY BUILDERS =====
// Each returns { group, wings[], wingAnim }

function buildXWing(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();
  const wings = [];

  const fus = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 4.0), hullMat);
  group.add(fus);

  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.45, 1.8, 8), hullMat);
  nose.rotation.x = Math.PI / 2; nose.position.z = -2.6; group.add(nose);

  const cock = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cockpitMat);
  cock.scale.set(1, 0.7, 1.4); cock.position.set(0, 0.45, -0.2); group.add(cock);

  for (const [x, y] of [[0.5, 0.4], [-0.5, 0.4], [0.5, -0.4], [-0.5, -0.4]]) {
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 10), engineMat);
    eng.rotation.x = Math.PI / 2; eng.position.set(x, y, 1.9); group.add(eng);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.13, 10), new THREE.MeshBasicMaterial({ color: 0x88ddff }));
    gl.position.set(x, y, 2.31); group.add(gl);
  }

  for (const cfg of [{ sx: 1, sy: 1 }, { sx: -1, sy: 1 }, { sx: 1, sy: -1 }, { sx: -1, sy: -1 }]) {
    const piv = new THREE.Group(); piv.position.set(0, cfg.sy * 0.25, 0.3); group.add(piv);
    const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.0), hullMat);
    wing.position.set(cfg.sx * 1.6, 0, 0); piv.add(wing);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.082, 0.3), accentMat);
    stripe.position.set(cfg.sx * 1.4, 0, -0.2); piv.add(stripe);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), engineMat);
    can.rotation.x = Math.PI / 2; can.position.set(cfg.sx * 2.7, 0, -0.5); piv.add(can);
    const ca = cfg.sy > 0 ? -0.05 : 0.05, oa = cfg.sy > 0 ? 0.32 : -0.32;
    piv.rotation.z = ca;
    wings.push({ pivot: piv, ca, oa });
  }

  return { group, wings, hasWingAnim: true };
}

function buildAWing(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();

  // Sleek delta body
  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.55, 3.0, 6);
  const body = new THREE.Mesh(bodyGeo, hullMat);
  body.rotation.x = Math.PI / 2; group.add(body);

  // Cockpit
  const cock = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cockpitMat);
  cock.scale.set(1, 0.6, 1.2); cock.position.set(0, 0.35, -0.8); group.add(cock);

  // Swept delta wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0); wingShape.lineTo(0, -2.2); wingShape.lineTo(-0.5, -2.5); wingShape.lineTo(-0.3, 0.5); wingShape.closePath();
  const wingGeo = new THREE.ShapeGeometry(wingShape);
  for (const sx of [1, -1]) {
    const w = new THREE.Mesh(wingGeo, hullMat);
    w.rotation.y = Math.PI / 2; w.scale.x = sx;
    w.position.set(sx * 0.05, -0.1, 0.2); group.add(w);

    // Red accent stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 1.5), accentMat);
    stripe.position.set(sx * 1.0, -0.08, 0.3); group.add(stripe);
  }

  // Twin engines
  for (const [x, y] of [[0.8, 0], [-0.8, 0]]) {
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.0, 12), engineMat);
    eng.rotation.x = Math.PI / 2; eng.position.set(x, y, 1.3); group.add(eng);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.18, 12), new THREE.MeshBasicMaterial({ color: 0xff8844 }));
    gl.position.set(x, y, 1.82); group.add(gl);
  }

  return { group, wings: [], hasWingAnim: false };
}

function buildYWing(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();

  // Main fuselage (shorter, exposed frame)
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.5, 10), hullMat);
  fus.rotation.x = Math.PI / 2; group.add(fus);

  // Cockpit bubble
  const cock = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), cockpitMat);
  cock.scale.set(0.8, 0.8, 1.2); cock.position.set(0, 0.1, -2.0); group.add(cock);

  // Ion engine pods (nacelles)
  for (const sx of [1, -1]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.4), engineMat);
    strut.position.set(sx * 0.9, 0, 0.8); group.add(strut);

    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 2.5, 12), engineMat);
    pod.rotation.x = Math.PI / 2; pod.position.set(sx * 0.9, 0, 1.0); group.add(pod);

    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshBasicMaterial({ color: 0x4488ff }));
    gl.position.set(sx * 0.9, 0, 2.26); group.add(gl);

    // Yellow stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0xddaa00 }));
    stripe.position.set(sx * 0.9, 0.27, 1.0); group.add(stripe);
  }

  // Top turret
  const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 10), engineMat);
  turretBase.position.set(0, 0.38, -0.5); group.add(turretBase);
  const turretBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), engineMat);
  turretBarrel.rotation.x = Math.PI / 2; turretBarrel.position.set(0, 0.42, -0.9); group.add(turretBarrel);

  return { group, wings: [], hasWingAnim: false };
}

function buildInterceptor(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();

  // Sphere cockpit
  const cock = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), hullMat);
  group.add(cock);

  const win = new THREE.Mesh(new THREE.SphereGeometry(0.86, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), cockpitMat);
  win.rotation.x = Math.PI * 0.25; group.add(win);

  // Struts
  for (const y of [1.0, -1.0]) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.4, 0.18), engineMat);
    st.position.set(0, y, 0); group.add(st);
  }

  // Hex solar wings
  const hs = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 3 * i + Math.PI / 6;
    hs[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * 1.4, Math.sin(a) * 1.4);
  }
  hs.closePath();
  const hg = new THREE.ShapeGeometry(hs);
  for (const s of [1, -1]) {
    const w = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: 0x222a30, metalness: 0.5, roughness: 0.7, side: THREE.DoubleSide }));
    w.rotation.y = Math.PI / 2; w.position.set(0, s * 1.8, 0); group.add(w);
  }

  // Engine
  const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.6, 12), engineMat);
  eng.rotation.x = Math.PI / 2; eng.position.z = 0.9; group.add(eng);
  const gl = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), new THREE.MeshBasicMaterial({ color: 0x33ff88 }));
  gl.position.z = 1.21; gl.rotation.y = Math.PI; group.add(gl);

  return { group, wings: [], hasWingAnim: false };
}

function buildFalcon(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();

  // Main saucer
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.5, 0.5, 16), hullMat);
  saucer.position.set(-0.3, 0, 0); group.add(saucer);

  // Front mandibles
  const mandGeo = new THREE.BoxGeometry(0.4, 0.3, 1.8);
  for (const x of [0.5, -0.5]) {
    const mand = new THREE.Mesh(mandGeo, hullMat);
    mand.position.set(x, 0, -2.8); group.add(mand);
  }

  // Cockpit pod (off-center)
  const cockGeo = new THREE.SphereGeometry(0.55, 12, 10);
  const cock = new THREE.Mesh(cockGeo, cockpitMat);
  cock.scale.set(1.2, 0.6, 0.9); cock.position.set(1.5, 0.25, -0.8); group.add(cock);

  // Quad laser turret (top)
  const turret = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), engineMat);
  turret.position.set(-0.3, 0.55, 0.5); group.add(turret);

  // Engines (3)
  for (const [x, y] of [[0.5, 0], [0, 0.3], [0, -0.3]]) {
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.8, 12), engineMat);
    eng.rotation.x = Math.PI / 2; eng.position.set(x - 0.3, y, 2.5); group.add(eng);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.28, 12), new THREE.MeshBasicMaterial({ color: 0x4488ff }));
    gl.position.set(x - 0.3, y, 2.92); group.add(gl);
  }

  // Dish
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 }));
  dish.position.set(-1.2, 0.35, 0.8); group.add(dish);

  return { group, wings: [], hasWingAnim: false };
}

function buildNaboo(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();

  // Sleek chrome body
  const bodyGeo = new THREE.CylinderGeometry(0.1, 0.5, 4.0, 8);
  const body = new THREE.Mesh(bodyGeo, hullMat);
  body.rotation.x = Math.PI / 2; group.add(body);

  // Cockpit
  const cock = new THREE.Mesh(new THREE.SphereGeometry(0.4, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), cockpitMat);
  cock.scale.set(1, 0.65, 1.3); cock.position.set(0, 0.4, -0.6); group.add(cock);

  // Yellow engine nacelles
  const nacelleMat = new THREE.MeshStandardMaterial({ color: 0xddaa00, metalness: 0.7, roughness: 0.3 });
  for (const sx of [1, -1]) {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.0, 10), nacelleMat);
    nacelle.rotation.x = Math.PI / 2; nacelle.position.set(sx * 0.7, -0.1, 0.5); group.add(nacelle);

    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.15, 12), new THREE.MeshBasicMaterial({ color: 0x4488ff }));
    gl.position.set(sx * 0.7, -0.1, 1.52); group.add(gl);
  }

  // Tail fin
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0); finShape.lineTo(0.05, -0.8); finShape.lineTo(0.05, 0.8); finShape.lineTo(0, 1.4); finShape.closePath();
  const fin = new THREE.Mesh(new THREE.ShapeGeometry(finShape), hullMat);
  fin.rotation.y = Math.PI / 2; fin.position.set(0, 0.5, 1.5); group.add(fin);

  // Torpedo launcher (bottom nose)
  const torps = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), engineMat);
  torps.rotation.x = Math.PI / 2; torps.position.set(0, -0.3, -2.2); group.add(torps);

  return { group, wings: [], hasWingAnim: false };
}

function buildSpeeder(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();

  // Flat, wide body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 3.5), hullMat);
  group.add(body);

  // Slanted nose
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.6, 1.2, 6), hullMat);
  nose.rotation.x = Math.PI / 2; nose.position.z = -2.2; group.add(nose);

  // Cockpit
  const cock = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cockpitMat);
  cock.scale.set(1.2, 0.6, 1.8); cock.position.set(0.4, 0.35, -0.8); group.add(cock);

  // Laser cannons on nose wings
  for (const sx of [1, -1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 1.5), hullMat);
    wing.position.set(sx * 1.3, 0, -0.8); group.add(wing);
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), engineMat);
    cannon.rotation.x = Math.PI / 2; cannon.position.set(sx * 1.5, 0.05, -1.6); group.add(cannon);
  }

  // 4 repulsor engine pods
  for (const [x, z] of [[0.8, 1.2], [-0.8, 1.2], [0.8, -0.2], [-0.8, -0.2]]) {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 10), engineMat);
    pod.position.set(x, -0.35, z); group.add(pod);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.14, 10), new THREE.MeshBasicMaterial({ color: 0x88ccff }));
    gl.rotation.x = Math.PI / 2; gl.position.set(x, -0.67, z); group.add(gl);
  }

  return { group, wings: [], hasWingAnim: false };
}

function buildVWing(hullMat, accentMat, engineMat, cockpitMat) {
  const group = new THREE.Group();

  // Central fuselage
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 3.2, 8), hullMat);
  fus.rotation.x = Math.PI / 2; group.add(fus);

  // V-shaped wing assembly
  for (const sx of [1, -1]) {
    // Inner wing
    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 1.8), hullMat);
    inner.rotation.z = sx * 0.4;
    inner.position.set(sx * 0.5, 0.3, 0.2); group.add(inner);

    // Outer panel
    const outer = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 1.4), hullMat);
    outer.rotation.z = sx * 0.6;
    outer.position.set(sx * 1.1, 0.5, 0.3); group.add(outer);

    // Engine at wing tip
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.9, 10), engineMat);
    eng.rotation.x = Math.PI / 2; eng.position.set(sx * 1.6, 0.75, 0.8); group.add(eng);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), new THREE.MeshBasicMaterial({ color: 0x00ccff }));
    gl.position.set(sx * 1.6, 0.75, 1.27); group.add(gl);

    // Laser tip
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), engineMat);
    laser.rotation.x = Math.PI / 2; laser.position.set(sx * 0.6, 0.3, -1.8); group.add(laser);
  }

  // Cockpit (astromech-style no glass, small)
  const cock = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cockpitMat);
  cock.scale.set(1, 0.6, 1.2); cock.position.set(0, 0.38, -0.8); group.add(cock);

  // Main engine
  const meng = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 12), engineMat);
  meng.rotation.x = Math.PI / 2; meng.position.z = 1.4; group.add(meng);
  const gl = new THREE.Mesh(new THREE.CircleGeometry(0.25, 12), new THREE.MeshBasicMaterial({ color: 0x00ccff }));
  gl.position.z = 1.82; group.add(gl);

  return { group, wings: [], hasWingAnim: false };
}
