'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/ui/cn';
import { useReducedMotion } from '@/ui/useReducedMotion';

import type { CourtPalette } from './courtScene';

type CourtScene3DProps = {
  palette: CourtPalette;
  className?: string;
  /** Follow the pointer with a small camera lean (desktop panel only). */
  interactive?: boolean;
};

/**
 * WebGL venues for the signed-out screens: a padel court and an indoor cricket
 * net taking turns (see courtScene.ts). three.js loads only here, after the
 * page is up, so it never delays the form. Under reduced motion the camera
 * holds still and the venues swap without animating; drawing pauses while the
 * scene is off screen or the tab is hidden. Without WebGL the area stays empty.
 */
export function CourtScene3D({ palette, className, interactive }: CourtScene3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let teardown = () => {};

    void (async () => {
      try {
        const [THREE, { createCourtScene }] = await Promise.all([import('three'), import('./courtScene')]);
        if (disposed) return;

        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'display:block;width:100%;height:100%';
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        // three r186 removed PCFSoftShadowMap (it fell back to this with a console warning).
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        el.appendChild(canvas);

        const court = createCourtScene(palette, { shadows: true });
        const start = performance.now();
        let raf = 0;
        let visible = true;
        let target = { x: 0, y: 0 };
        const lean = { x: 0, y: 0 };

        const draw = () => {
          lean.x += (target.x - lean.x) * 0.06;
          lean.y += (target.y - lean.y) * 0.06;
          court.lean(lean.x, lean.y);
          court.frame(renderer, (performance.now() - start) / 1000, reduced);
        };
        const loop = () => {
          raf = 0;
          if (!visible || document.hidden) return;
          draw();
          if (!reduced) raf = requestAnimationFrame(loop);
        };
        const kick = () => {
          if (!raf) raf = requestAnimationFrame(loop);
        };

        const size = () => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          court.resize(w, h);
          draw();
        };
        size();
        setReady(true);
        kick();
        // Reduced motion has no animation loop; redraw once a second so the venues still take turns.
        const tick = reduced ? window.setInterval(() => visible && !document.hidden && draw(), 1000) : 0;

        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(size) : null;
        ro?.observe(el);
        const io =
          typeof IntersectionObserver !== 'undefined'
            ? new IntersectionObserver(([entry]) => {
                visible = entry.isIntersecting;
                if (visible) kick();
              })
            : null;
        io?.observe(el);
        const onVisibility = () => !document.hidden && kick();
        document.addEventListener('visibilitychange', onVisibility);

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          target = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
          if (reduced) draw();
        };
        const onLeave = () => {
          target = { x: 0, y: 0 };
          if (reduced) draw();
        };
        const pointerHost = interactive ? (el.parentElement ?? el) : null;
        pointerHost?.addEventListener('pointermove', onMove);
        pointerHost?.addEventListener('pointerleave', onLeave);

        teardown = () => {
          cancelAnimationFrame(raf);
          window.clearInterval(tick);
          ro?.disconnect();
          io?.disconnect();
          document.removeEventListener('visibilitychange', onVisibility);
          pointerHost?.removeEventListener('pointermove', onMove);
          pointerHost?.removeEventListener('pointerleave', onLeave);
          court.dispose();
          renderer.dispose();
          canvas.remove();
        };
      } catch {
        // No WebGL (old device, blocked GPU, test runner): the decoration is skipped.
      }
    })();

    return () => {
      disposed = true;
      teardown();
    };
  }, [palette, reduced, interactive]);

  return <div ref={host} aria-hidden className={cn('pointer-events-none transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0', className)} />;
}
