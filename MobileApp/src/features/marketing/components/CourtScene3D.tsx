import { useEffect, useRef, useState } from 'react';
import { AppState, View, type StyleProp, type ViewStyle } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';

import { useReducedMotion } from '@/ui/useReducedMotion';

import { createCourtScene, type CourtPalette } from './courtScene';

type CourtScene3DProps = {
  palette: CourtPalette;
  style?: StyleProp<ViewStyle>;
};

/**
 * The 3D venues for the signed-out screens (a padel court and an indoor
 * cricket net taking turns), drawn with three.js on an expo-gl surface from
 * the same scene file the web app uses. Under reduced motion the camera holds
 * still and the venues swap without animating; drawing pauses while the app
 * is in the background. If the GL context cannot be set up, the space simply
 * stays empty rather than breaking the screen.
 */
export function CourtScene3D(props: CourtScene3DProps) {
  const reduced = useReducedMotion();
  // A new GL surface when reduced motion changes, so the loop starts or stops cleanly.
  return <Surface key={reduced ? 'still' : 'moving'} {...props} still={reduced} />;
}

function Surface({ palette, style, still }: CourtScene3DProps & { still: boolean }) {
  const [failed, setFailed] = useState(false);
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanup.current?.(), []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    try {
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      // three.js expects a canvas; on native there is none, so it gets a stand-in with the GL context.
      const canvas =
        (gl as unknown as { canvas?: HTMLCanvasElement }).canvas ??
        ({ width, height, clientWidth: width, clientHeight: height, style: {}, addEventListener: () => {}, removeEventListener: () => {}, getContext: () => gl } as unknown as HTMLCanvasElement);
      const renderer = new THREE.WebGLRenderer({ canvas, context: gl as unknown as WebGL2RenderingContext, antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      const court = createCourtScene(palette, { shadows: false });
      court.resize(width, height);

      const start = Date.now();
      let raf = 0;
      let running = !still;
      const draw = () => {
        court.frame(renderer, (Date.now() - start) / 1000, still);
        gl.endFrameEXP?.();
      };
      const loop = () => {
        raf = 0;
        if (!running) return;
        draw();
        raf = requestAnimationFrame(loop);
      };
      draw();
      if (running) raf = requestAnimationFrame(loop);
      // Reduced motion has no animation loop; redraw once a second so the venues still take turns.
      let foreground = AppState.currentState === 'active';
      const tick = still ? setInterval(() => foreground && draw(), 1000) : null;

      const sub = AppState.addEventListener('change', (state) => {
        foreground = state === 'active';
        const wasRunning = running;
        running = state === 'active' && !still;
        if (running && !wasRunning && !raf) raf = requestAnimationFrame(loop);
      });

      cleanup.current = () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        if (tick) clearInterval(tick);
        sub.remove();
        court.dispose();
        renderer.dispose();
      };
    } catch {
      setFailed(true);
    }
  };

  if (failed) return <View style={style} />;
  return <GLView style={style} onContextCreate={onContextCreate} accessible={false} importantForAccessibility="no-hide-descendants" />;
}
