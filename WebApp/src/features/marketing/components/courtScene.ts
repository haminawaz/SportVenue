/**
 * The 3D venues shown on the signed-out screens (log in, get started,
 * password help): a padel court and an indoor cricket net, taking turns. Each
 * holds for five seconds, then sinks and shrinks away while the other rises
 * into its place. The camera drifts slowly around whichever is showing.
 *
 * Plain three.js, shared verbatim by WebApp (canvas) and MobileApp (expo-gl).
 * No textures, fonts or loaders, so it renders the same everywhere and needs
 * nothing from the network.
 */

import * as THREE from 'three';

export type CourtPalette = 'onInk' | 'light' | 'dark';

type Colors = {
  surround: number;
  // Padel
  court: number;
  line: number;
  glass: number;
  frame: number;
  net: number;
  // Cricket net
  turf: number;
  pitch: number;
  crease: number;
  stumps: number;
  kick: number;
  pole: number;
  mesh: number;
  meshOpacity: number;
  lamp: number;
};

const COLORS: Record<CourtPalette, Colors> = {
  // On the ink brand panel (web) and in dark mode.
  onInk: {
    surround: 0x22211f, court: 0x0b7a4b, line: 0xf3f1ee, glass: 0x9fd8c1, frame: 0x3a3936, net: 0x141413,
    turf: 0x1f8a43, pitch: 0x4cbf6c, crease: 0xf3f1ee, stumps: 0xf1e4b3, kick: 0x166b34, pole: 0xd9d6d0, mesh: 0x8d8a84, meshOpacity: 0.34, lamp: 0xfffbea,
  },
  dark: {
    surround: 0x2a2927, court: 0x0b7a4b, line: 0xf3f1ee, glass: 0x9fd8c1, frame: 0x46433f, net: 0x141413,
    turf: 0x1f8a43, pitch: 0x4cbf6c, crease: 0xf3f1ee, stumps: 0xf1e4b3, kick: 0x166b34, pole: 0xd9d6d0, mesh: 0x8d8a84, meshOpacity: 0.34, lamp: 0xfffbea,
  },
  // On the light stone background.
  light: {
    surround: 0xdcd8d2, court: 0x0b7a4b, line: 0xfdfcfb, glass: 0x7fb9a3, frame: 0x625f5a, net: 0x2a2927,
    turf: 0x2a9a4c, pitch: 0x5fcb7c, crease: 0xfdfcfb, stumps: 0xe9d9a0, kick: 0x1b7a3c, pole: 0xf6f5f2, mesh: 0x2a2927, meshOpacity: 0.32, lamp: 0xfffbea,
  },
};

/** Both venues share one footprint so the camera framing never jumps: 10 x 5 scene units. */
const LEN = 10;
const WID = 5;

/** Seconds each venue holds, and how long it takes to leave and to arrive. */
const HOLD = 5;
const OUT = 0.7;
const IN = 0.9;
const TURN = HOLD + OUT + IN;

export type CourtScene = {
  /** Draw the frame for `t` seconds since start. `still` swaps the venues without animating and holds the camera still. */
  frame: (renderer: THREE.WebGLRenderer, t: number, still: boolean) => void;
  resize: (width: number, height: number) => void;
  /** Nudge the camera toward a pointer position (-1..1 on each axis). */
  lean: (x: number, y: number) => void;
  dispose: () => void;
};

type Kit = {
  box: (parent: THREE.Object3D, w: number, h: number, d: number, material: THREE.Material, x?: number, y?: number, z?: number) => THREE.Mesh;
  std: (params: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  track: <T extends { dispose: () => void }>(thing: T) => T;
  shadows: boolean;
};

export function createCourtScene(palette: CourtPalette, opts: { shadows?: boolean } = {}): CourtScene {
  const c = COLORS[palette];
  const scene = new THREE.Scene();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(thing: T) => (disposables.push(thing), thing);
  const kit: Kit = {
    track,
    shadows: !!opts.shadows,
    std: (params) => track(new THREE.MeshStandardMaterial(params)),
    box: (parent, w, h, d, material, x = 0, y = 0, z = 0) => {
      const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), material);
      m.position.set(x, y, z);
      m.castShadow = m.receiveShadow = !!opts.shadows;
      parent.add(m);
      return m;
    },
  };

  // Light: a soft sky fill plus a warm key light from the upper left.
  scene.add(new THREE.HemisphereLight(0xffffff, palette === 'light' ? 0xb9b2a8 : 0x1a1a18, palette === 'light' ? 1.5 : 1.15));
  const sun = new THREE.DirectionalLight(0xfff4e0, palette === 'light' ? 2.2 : 2.6);
  sun.position.set(-6, 10, 5);
  if (opts.shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    sun.shadow.bias = -0.0008;
  }
  scene.add(sun);

  const venues = [buildPadel(c, kit, palette), buildCricketNet(c, kit)];
  venues.forEach((v) => scene.add(v));

  const FOV = 32;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  let leanX = 0;
  let leanY = 0;
  /** Camera distance that fits a whole venue in the current canvas (set in resize). */
  let dist = 13.2;

  const easeIn = (p: number) => p * p * p;
  const easeOut = (p: number) => 1 - (1 - p) ** 3;
  const easeOutBack = (p: number) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2;

  /** Scale, drop and turn for a venue: 1 = in place, 0 = gone. */
  const pose = (g: THREE.Object3D, scale: number, drop: number, turn: number) => {
    g.visible = scale > 0.001;
    g.scale.setScalar(Math.max(0.001, scale));
    g.position.y = drop;
    g.rotation.y = turn;
  };

  const place = (t: number, still: boolean) => {
    const k = Math.floor(t / TURN);
    const local = t - k * TURN;
    const current = venues[k % 2];
    const next = venues[(k + 1) % 2];

    if (still) {
      // Reduced motion: the venues still take turns, but swap in place without moving.
      pose(current, 1, 0, 0);
      pose(next, 0, 0, 0);
    } else if (local < HOLD) {
      pose(current, 1, 0, 0);
      pose(next, 0, 0, 0);
    } else if (local < HOLD + OUT) {
      const p = (local - HOLD) / OUT;
      pose(current, 1 - easeIn(p), -0.9 * easeIn(p), 0.55 * easeIn(p));
      pose(next, 0, 0, 0);
    } else {
      const q = (local - HOLD - OUT) / IN;
      pose(current, 0, 0, 0);
      pose(next, easeOutBack(q), 0.9 * (1 - easeOut(q)), -0.55 * (1 - easeOut(q)));
    }

    const angle = (still ? 0.62 : 0.62 + Math.sin(t * 0.12) * 0.28) + leanX * 0.18;
    // Same viewing angle at any distance: about 26 degrees above the venue.
    const rise = dist * 0.485 + (still ? 0 : Math.sin(t * 0.2) * 0.25) - leanY * 0.8;
    camera.position.set(Math.sin(angle) * dist, rise, Math.cos(angle) * dist);
    camera.lookAt(0, 0.45, 0);
  };

  return {
    frame(renderer, t, still) {
      place(t, still);
      renderer.render(scene, camera);
    },
    resize(width, height) {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      // Back the camera off until a venue (about 14.5 wide and 8.6 tall on
      // screen at this angle, with a little margin) fits both ways, whatever the canvas shape.
      const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const tanH = tanV * camera.aspect;
      dist = Math.max(14.5 / (2 * tanH), 8.6 / (2 * tanV));
    },
    lean(x, yy) {
      leanX = Math.max(-1, Math.min(1, x));
      leanY = Math.max(-1, Math.min(1, yy));
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}

/** The ground slab both venues stand on. */
function slab(group: THREE.Group, c: Colors, kit: Kit) {
  kit.box(group, LEN + 1.6, 0.18, WID + 1.6, kit.std({ color: c.surround, roughness: 0.95 }), 0, -0.09, 0).castShadow = false;
}

/** Padel: court and lines, glass back walls with short side returns, and the net. */
function buildPadel(c: Colors, kit: Kit, palette: CourtPalette) {
  const g = new THREE.Group();
  slab(g, c, kit);
  kit.box(g, LEN, 0.06, WID, kit.std({ color: c.court, roughness: 0.85 }), 0, 0.03, 0).castShadow = false;

  // Lines: outline, service lines 3.475 from the net, and the centre service line.
  const line = kit.std({ color: c.line, roughness: 0.6 });
  const L = 0.05;
  const y = 0.065;
  kit.box(g, LEN, 0.01, L, line, 0, y, WID / 2 - L / 2);
  kit.box(g, LEN, 0.01, L, line, 0, y, -WID / 2 + L / 2);
  kit.box(g, L, 0.01, WID, line, LEN / 2 - L / 2, y, 0);
  kit.box(g, L, 0.01, WID, line, -LEN / 2 + L / 2, y, 0);
  for (const sx of [-1, 1]) kit.box(g, L, 0.01, WID, line, sx * 3.475, y, 0);
  kit.box(g, 3.475 * 2, 0.01, L, line, 0, y, 0);

  const WALL = 1.5;
  const glass = kit.std({ color: c.glass, transparent: true, opacity: palette === 'light' ? 0.22 : 0.16, roughness: 0.1, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
  const frame = kit.std({ color: c.frame, roughness: 0.5, metalness: 0.4 });
  for (const sx of [-1, 1]) {
    kit.box(g, 0.04, WALL, WID, glass, sx * (LEN / 2), WALL / 2 + 0.06, 0).castShadow = false;
    for (const sz of [-1, 1]) {
      kit.box(g, 2, WALL, 0.04, glass, sx * (LEN / 2 - 1), WALL / 2 + 0.06, sz * (WID / 2)).castShadow = false;
      kit.box(g, 0.06, WALL + 0.05, 0.06, frame, sx * (LEN / 2), WALL / 2 + 0.06, sz * (WID / 2));
      kit.box(g, 0.06, WALL + 0.05, 0.06, frame, sx * (LEN / 2 - 2), WALL / 2 + 0.06, sz * (WID / 2));
    }
    kit.box(g, 0.06, 0.06, WID, frame, sx * (LEN / 2), WALL + 0.08, 0);
  }

  // Net: two posts, a dark mesh and a white top band.
  const netH = 0.46;
  for (const sz of [-1, 1]) kit.box(g, 0.07, netH + 0.06, 0.07, frame, 0, (netH + 0.06) / 2 + 0.06, sz * (WID / 2 + 0.02));
  kit.box(g, 0.02, netH - 0.05, WID, kit.std({ color: c.net, transparent: true, opacity: 0.55, roughness: 1, side: THREE.DoubleSide }), 0, (netH - 0.05) / 2 + 0.07, 0);
  kit.box(g, 0.03, 0.05, WID, line, 0, netH + 0.04, 0);
  return g;
}

/** A square grid of thin lines over a rectangle: the netting of the cricket cage. */
function netting(kit: Kit, color: number, opacity: number, w: number, h: number, step: number) {
  const pts: number[] = [];
  for (let x = 0; x <= w + 1e-6; x += step) pts.push(x - w / 2, 0, 0, x - w / 2, h, 0);
  for (let y = 0; y <= h + 1e-6; y += step) pts.push(-w / 2, y, 0, w / 2, y, 0);
  const geometry = kit.track(new THREE.BufferGeometry());
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.LineSegments(geometry, kit.track(new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })));
}

/**
 * Indoor cricket net: turf, a lighter pitch strip with its creases, stumps at
 * both ends, low green kickboards, white poles and rails, black netting on the
 * walls and roof, and two floodlights at the far end.
 */
function buildCricketNet(c: Colors, kit: Kit) {
  const g = new THREE.Group();
  slab(g, c, kit);
  kit.box(g, LEN, 0.06, WID, kit.std({ color: c.turf, roughness: 0.95 }), 0, 0.03, 0).castShadow = false;

  // Pitch strip down the middle, with popping, bowling and return creases at each end.
  const PITCH = 8.4;
  const PW = 1.25;
  kit.box(g, PITCH, 0.02, PW, kit.std({ color: c.pitch, roughness: 0.8 }), 0, 0.07, 0).castShadow = false;
  const crease = kit.std({ color: c.crease, roughness: 0.6 });
  const L = 0.035;
  const y = 0.085;
  for (const sx of [-1, 1]) {
    kit.box(g, L, 0.01, PW + 0.5, crease, sx * 3.25, y, 0).castShadow = false;
    kit.box(g, L, 0.01, PW - 0.2, crease, sx * 3.85, y, 0).castShadow = false;
    for (const sz of [-1, 1]) kit.box(g, 0.75, 0.01, L, crease, sx * 3.6, y, sz * 0.55).castShadow = false;

    // Three stumps and two bails.
    const stumps = kit.std({ color: c.stumps, roughness: 0.45 });
    for (const sz of [-0.09, 0, 0.09]) {
      const s = new THREE.Mesh(kit.track(new THREE.CylinderGeometry(0.022, 0.022, 0.4, 10)), stumps);
      s.position.set(sx * 3.85, 0.28, sz);
      s.castShadow = kit.shadows;
      g.add(s);
    }
    for (const sz of [-0.045, 0.045]) kit.box(g, 0.02, 0.02, 0.085, stumps, sx * 3.85, 0.49, sz);
  }

  // Kickboards along the sides and the back ends.
  const kick = kit.std({ color: c.kick, roughness: 0.7 });
  const KH = 0.32;
  for (const sz of [-1, 1]) kit.box(g, LEN, KH, 0.06, kick, 0, KH / 2 + 0.06, sz * (WID / 2));
  for (const sx of [-1, 1]) kit.box(g, 0.06, KH, WID, kick, sx * (LEN / 2), KH / 2 + 0.06, 0);

  // White frame: poles every 2.5 along the sides and at the corners, rails at the top.
  const H = 1.9;
  const pole = kit.std({ color: c.pole, roughness: 0.5, metalness: 0.2 });
  for (const sz of [-1, 1]) {
    for (let x = -LEN / 2; x <= LEN / 2 + 1e-6; x += 2.5) kit.box(g, 0.05, H, 0.05, pole, x, H / 2 + 0.06, sz * (WID / 2));
    kit.box(g, LEN, 0.04, 0.04, pole, 0, H + 0.06, sz * (WID / 2));
  }
  for (const sx of [-1, 1]) kit.box(g, 0.04, 0.04, WID, pole, sx * (LEN / 2), H + 0.06, 0);
  for (let x = -LEN / 2 + 2.5; x < LEN / 2; x += 2.5) kit.box(g, 0.035, 0.035, WID, pole, x, H + 0.06, 0);

  // Netting above the kickboards on every wall, and across the roof.
  const STEP = 0.22;
  const top = KH + 0.06;
  for (const sz of [-1, 1]) {
    const side = netting(kit, c.mesh, c.meshOpacity, LEN, H - KH, STEP);
    side.position.set(0, top, sz * (WID / 2));
    g.add(side);
  }
  for (const sx of [-1, 1]) {
    const end = netting(kit, c.mesh, c.meshOpacity, WID, H - KH, STEP);
    end.rotation.y = Math.PI / 2;
    end.position.set(sx * (LEN / 2), top, 0);
    g.add(end);
  }
  const roof = netting(kit, c.mesh, c.meshOpacity * 0.55, LEN, WID, STEP * 1.6);
  roof.rotation.x = Math.PI / 2;
  roof.position.set(0, H + 0.06, -WID / 2);
  g.add(roof);

  // Floodlights at the far end, glowing.
  const lamp = kit.std({ color: c.lamp, emissive: c.lamp, emissiveIntensity: 1.6, roughness: 0.3 });
  for (const sz of [-1.1, 1.1]) {
    kit.box(g, 0.08, 0.16, 0.34, lamp, -LEN / 2 + 0.12, H - 0.05, sz).castShadow = false;
    const glow = new THREE.Mesh(kit.track(new THREE.CircleGeometry(0.42, 24)), kit.track(new THREE.MeshBasicMaterial({ color: c.lamp, transparent: true, opacity: 0.16, depthWrite: false })));
    glow.rotation.y = Math.PI / 2;
    glow.position.set(-LEN / 2 + 0.17, H - 0.05, sz);
    g.add(glow);
  }
  return g;
}
