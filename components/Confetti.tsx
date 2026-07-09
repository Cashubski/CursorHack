"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  color: string;
  life: number;
}

// On-brand palette: iris accent + emerald success + neutral ink tints.
const COLORS = ["#6c5ef5", "#8781fb", "#10b981", "#34d399", "#a9adff", "#181b28"];

/**
 * A short, tasteful confetti burst that fires once on mount. Dependency-free
 * (a single canvas) and skipped entirely when the user prefers reduced motion.
 */
export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const originX = w / 2;
    const originY = h * 0.32;

    const particles: Particle[] = [];
    const count = 140;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 3 + Math.random() * 7;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1
      });
    }

    let raf = 0;
    let frame = 0;
    const gravity = 0.16;
    const drag = 0.985;

    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      let alive = false;
      for (const p of particles) {
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        if (frame > 60) p.life -= 0.012;
        if (p.life > 0 && p.y < h + 20) {
          alive = true;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.rotate(-p.rot);
          ctx.translate(-p.x, -p.y);
        }
      }
      ctx.restore();
      if (alive && frame < 240) {
        raf = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
