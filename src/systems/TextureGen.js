import * as THREE from 'three';

export class TextureGen {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Erzeugt eine Metall-Textur mit Panel-Lines, Details und Weathering.
   * @param {object} opts
   * @param {string} opts.baseColor - Basis-Hexfarbe der Hülle
   * @param {number} opts.size      - Texturauflösung (Power-of-Two empfohlen)
   * @param {number} opts.panelDensity - 0..1, wie engmaschig Panel-Lines sind
   * @param {number} opts.weathering   - 0..1, Intensität der Kratzer
   * @returns {THREE.CanvasTexture}
   */
  generateMetalTexture({ baseColor = '#9aa3ad', size = 512, panelDensity = 0.5, weathering = 0.4 } = {}) {
    const key = `metal_${baseColor}_${size}_${panelDensity}_${weathering}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Basis: leichter Gradient, damit es nicht flat wirkt
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, this._shade(baseColor, -0.1));
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, this._shade(baseColor, -0.18));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Noise-Layer für Mikrostruktur
    this._addNoise(ctx, size, 14);

    // Panel-Lines (rekursive Aufteilung)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 1;
    this._drawPanels(ctx, 0, 0, size, size, 4 + Math.floor(panelDensity * 3));

    // Technische Details (Schrauben, Lüftungen, Markierungen)
    const detailCount = Math.floor(20 + panelDensity * 40);
    for (let i = 0; i < detailCount; i++) {
      this._drawDetail(ctx, size);
    }

    // Weathering: Kratzer und Verschmutzungen
    const scratchCount = Math.floor(weathering * 60);
    for (let i = 0; i < scratchCount; i++) {
      this._drawScratch(ctx, size);
    }
    const grimeCount = Math.floor(weathering * 25);
    for (let i = 0; i < grimeCount; i++) {
      this._drawGrime(ctx, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    this.cache.set(key, texture);
    return texture;
  }

  // --- Helpers ---

  _shade(hex, amount) {
    const c = parseInt(hex.slice(1), 16);
    let r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
    r = Math.max(0, Math.min(255, r + Math.round(255 * amount)));
    g = Math.max(0, Math.min(255, g + Math.round(255 * amount)));
    b = Math.max(0, Math.min(255, b + Math.round(255 * amount)));
    return `rgb(${r},${g},${b})`;
  }

  _addNoise(ctx, size, intensity) {
    const img = ctx.getImageData(0, 0, size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * intensity;
      d[i]     = Math.max(0, Math.min(255, d[i]     + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
  }

  _drawPanels(ctx, x, y, w, h, depth) {
    if (depth <= 0 || w < 32 || h < 32) return;
    // Zufällig vertikal oder horizontal teilen
    if (w > h) {
      const split = x + w * (0.3 + Math.random() * 0.4);
      ctx.beginPath(); ctx.moveTo(split, y); ctx.lineTo(split, y + h); ctx.stroke();
      this._drawPanels(ctx, x, y, split - x, h, depth - 1);
      this._drawPanels(ctx, split, y, w - (split - x), h, depth - 1);
    } else {
      const split = y + h * (0.3 + Math.random() * 0.4);
      ctx.beginPath(); ctx.moveTo(x, split); ctx.lineTo(x + w, split); ctx.stroke();
      this._drawPanels(ctx, x, y, w, split - y, depth - 1);
      this._drawPanels(ctx, x, split, w, h - (split - y), depth - 1);
    }
  }

  _drawDetail(ctx, size) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const t = Math.random();
    if (t < 0.4) {
      // Schraube/Niete
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, 0.6, 0, Math.PI * 2); ctx.fill();
    } else if (t < 0.7) {
      // Lüftungsschlitz
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      const w = 8 + Math.random() * 14, h = 2;
      for (let i = 0; i < 3; i++) ctx.fillRect(x, y + i * 4, w, h);
    } else {
      // Warnmarkierung
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(220, 180, 50, 0.5)' : 'rgba(180, 60, 60, 0.5)';
      ctx.fillRect(x, y, 6 + Math.random() * 10, 3);
    }
  }

  _drawScratch(ctx, size) {
    const x = Math.random() * size, y = Math.random() * size;
    const len = 8 + Math.random() * 40;
    const angle = Math.random() * Math.PI * 2;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + Math.random() * 0.15})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }

  _drawGrime(ctx, size) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 5 + Math.random() * 25;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(20, 15, 10, 0.25)');
    grad.addColorStop(1, 'rgba(20, 15, 10, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}
