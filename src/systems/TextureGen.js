// src/systems/TextureGen.js
import * as THREE from 'three';

export class TextureGen {
  constructor() { this.cache = new Map(); }

  generateMetalTexture({ baseColor = '#9aa3ad', size = 256, panelDensity = 0.5, weathering = 0.4 } = {}) {
    const key = `${baseColor}_${size}_${panelDensity}_${weathering}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, this._shade(baseColor, -0.08));
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, this._shade(baseColor, -0.18));
    ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);

    this._addNoise(ctx, size, 12);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    this._drawPanels(ctx, 0, 0, size, size, 4 + Math.floor(panelDensity * 3));

    for (let i = 0; i < Math.floor(20 + panelDensity * 30); i++) this._drawDetail(ctx, size);
    for (let i = 0; i < Math.floor(weathering * 50); i++) this._drawScratch(ctx, size);
    for (let i = 0; i < Math.floor(weathering * 20); i++) this._drawGrime(ctx, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    this.cache.set(key, texture);
    return texture;
  }

  _shade(hex, amount) {
    let c; try { c = parseInt(hex.slice(1), 16); } catch { return hex; }
    let r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
    r = Math.max(0, Math.min(255, r + Math.round(255 * amount)));
    g = Math.max(0, Math.min(255, g + Math.round(255 * amount)));
    b = Math.max(0, Math.min(255, b + Math.round(255 * amount)));
    return `rgb(${r},${g},${b})`;
  }

  _addNoise(ctx, size, intensity) {
    const img = ctx.getImageData(0, 0, size, size); const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * intensity;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i+1] = Math.max(0, Math.min(255, d[i+1] + n));
      d[i+2] = Math.max(0, Math.min(255, d[i+2] + n));
    }
    ctx.putImageData(img, 0, 0);
  }

  _drawPanels(ctx, x, y, w, h, depth) {
    if (depth <= 0 || w < 24 || h < 24) return;
    if (w > h) {
      const s = x + w * (0.3 + Math.random() * 0.4);
      ctx.beginPath(); ctx.moveTo(s, y); ctx.lineTo(s, y + h); ctx.stroke();
      this._drawPanels(ctx, x, y, s - x, h, depth - 1);
      this._drawPanels(ctx, s, y, w - (s - x), h, depth - 1);
    } else {
      const s = y + h * (0.3 + Math.random() * 0.4);
      ctx.beginPath(); ctx.moveTo(x, s); ctx.lineTo(x + w, s); ctx.stroke();
      this._drawPanels(ctx, x, y, w, s - y, depth - 1);
      this._drawPanels(ctx, x, s, w, h - (s - y), depth - 1);
    }
  }

  _drawDetail(ctx, size) {
    const x = Math.random() * size, y = Math.random() * size, t = Math.random();
    if (t < 0.4) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
    } else if (t < 0.7) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      for (let i = 0; i < 3; i++) ctx.fillRect(x, y + i * 4, 8 + Math.random() * 12, 2);
    } else {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(200,160,40,0.4)' : 'rgba(160,50,50,0.4)';
      ctx.fillRect(x, y, 6 + Math.random() * 10, 3);
    }
  }

  _drawScratch(ctx, size) {
    const x = Math.random() * size, y = Math.random() * size;
    const len = 8 + Math.random() * 35, angle = Math.random() * Math.PI * 2;
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + Math.random() * 0.12})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len); ctx.stroke();
  }

  _drawGrime(ctx, size) {
    const x = Math.random() * size, y = Math.random() * size, r = 6 + Math.random() * 22;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(15,10,8,0.22)'); g.addColorStop(1, 'rgba(15,10,8,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}
