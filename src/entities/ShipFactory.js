// src/entities/ShipFactory.js
import * as THREE from 'three';
import { Ship } from './Ship.js';
import { SHIP_DEFS } from '../ShipDefs.js';

export class ShipFactory {
  constructor(textureGen) {
    this.textureGen = textureGen;
  }

  _makeMaterials(baseColor, accentColor = 0xaa1a1a) {
    const tex = this.textureGen.generateMetalTexture({
      baseColor, panelDensity: 0.55, weathering: 0.45, size: 256
    });
    const hullMat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.55, roughness: 0.58 });
    const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.4, roughness: 0.6 });
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x333840, metalness: 0.8, roughness: 0.4 });
    const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x1a2c3d, metalness: 0.92, roughness: 0.08 });
    return { hullMat, accentMat, engineMat, cockpitMat };
  }

  create(scene, defId) {
    const def = SHIP_DEFS.find(d => d.id === defId) ?? SHIP_DEFS[0];
    const ship = new Ship(scene, def);

    const matConfigs = {
      xwing:       { base: '#c9c4b0', accent: 0xaa1a1a },
      awing:       { base: '#c8382a', accent: 0x661111 },
      ywing:       { base: '#b8a060', accent: 0xddaa00 },
      interceptor: { base: '#5a6068', accent: 0x333333 },
      millennium:  { base: '#a09880', accent: 0x777755 },
      naboo:       { base: '#e8e0c0', accent: 0xddaa00 },
      speeder:     { base: '#7a9ab0', accent: 0x4466aa },
      vwing:       { base: '#9aa8b8', accent: 0x445566 },
    };

    const cfg = matConfigs[def.id] ?? { base: '#aaaaaa', accent: 0x555555 };
    const mats = this._makeMaterials(cfg.base, cfg.accent);
    const built = def.build(mats.hullMat, mats.accentMat, mats.engineMat, mats.cockpitMat);

    ship.group.add(built.group);
    ship.wings = built.wings ?? [];

    if (built.hasWingAnim && ship.wings.length) {
      ship.wingAnim = { t: 0, dur: 1.2, playing: true };
    }

    return ship;
  }

  /** Build a preview ship for the menu (no scene needed, just geometry) */
  createPreview(defId) {
    const def = SHIP_DEFS.find(d => d.id === defId) ?? SHIP_DEFS[0];
    const matConfigs = {
      xwing:       { base: '#c9c4b0', accent: 0xaa1a1a },
      awing:       { base: '#c8382a', accent: 0x661111 },
      ywing:       { base: '#b8a060', accent: 0xddaa00 },
      interceptor: { base: '#5a6068', accent: 0x333333 },
      millennium:  { base: '#a09880', accent: 0x777755 },
      naboo:       { base: '#e8e0c0', accent: 0xddaa00 },
      speeder:     { base: '#7a9ab0', accent: 0x4466aa },
      vwing:       { base: '#9aa8b8', accent: 0x445566 },
    };
    const cfg = matConfigs[def.id] ?? { base: '#aaaaaa', accent: 0x555555 };
    const mats = this._makeMaterials(cfg.base, cfg.accent);
    const built = def.build(mats.hullMat, mats.accentMat, mats.engineMat, mats.cockpitMat);
    return built.group;
  }
}
