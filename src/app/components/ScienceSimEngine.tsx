"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader, EffectComposer, RenderPass, UnrealBloomPass } from "three-stdlib";

export type SimCategory = "physics" | "chemistry" | "biotech" | "math" | "custom" | (string & {});

interface ScienceSimEngineProps {
  initialCategory?: SimCategory;
  initialPreset?: string;
  initialCode?: string;
  autoPlay?: boolean;
}

// ============================================================================
// 🌀 GARGANTUA: REAL-TIME SCHWARZSCHILD GEODESIC RAYMARCHER (GLSL SHADER)
// Physics: Null Geodesics, Relativistic Doppler Beaming, Gravitational Redshift,
// Adaptive Log-Step Marching, Cinematic Auto-Orbit & High-DPI DPR Rendering
// ============================================================================
const GARGANTUA_RAYMARCH_CODE = `// ================================================================
// 🌀 GARGANTUA — Real-Time Schwarzschild Geodesic Raymarcher
// Physics: Null Geodesics, Doppler Beaming & Gravitational Lensing
// Features: Cinematic Auto-Orbit, DPR Retina Scaling & ACES Tonemap
// ================================================================

const frag = \`
precision highp float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uCamPos;
uniform mat3  uCamBasis;
uniform float uTanFov;

#define RS       1.0      // Schwarzschild radius (geometric units)
#define DISK_IN  2.6      // inner edge (~ISCO = 3rs)
#define DISK_OUT 12.0
#define FAR      90.0
#define STEPS    220
#define DOPPLER  1        // 0 = movie-style symmetric, 1 = physically correct

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float hash13(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i),                 hash13(i + vec3(1,0,0)), f.x),
        mix(hash13(i + vec3(0,1,0)),   hash13(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0,0,1)),   hash13(i + vec3(1,0,1)), f.x),
        mix(hash13(i + vec3(0,1,1)),   hash13(i + vec3(1,1,1)), f.x), f.y),
    f.z);
}

float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

// Blackbody-style accretion disk palette (HDR inner core)
vec3 diskRamp(float x){
  vec3 c = mix(vec3(0.32, 0.07, 0.02), vec3(1.0, 0.42, 0.10), smoothstep(0.0, 0.5, x));
  c = mix(c, vec3(1.0, 0.86, 0.55), smoothstep(0.45, 0.80, x));
  c = mix(c, vec3(1.35, 1.30, 1.20), smoothstep(0.80, 1.15, x));
  return c;
}

vec4 diskShade(vec3 p, vec3 photonVel){
  float r = length(p.xz);

  // Keplerian shear — inner rings orbit faster (omega ~ r^-3/2)
  float omega = 2.0 * pow(r, -1.5);
  vec2 q = rot(omega * uTime) * p.xz;

  // Turbulent emission, two sheared layers
  float n = fbm(vec3(q * 0.55, r * 0.30));
  n += 0.5 * fbm(vec3(q * 1.4, r * 0.9 + 40.0));
  n = pow(n * 0.7, 2.0);

  // Temperature profile T ~ r^-3/4 (Shakura–Sunyaev)
  float temp = pow(DISK_IN / r, 0.75);

  // Relativistic Doppler beaming + gravitational redshift
  float g = 1.0;
  if (DOPPLER == 1){
    vec3 vdir = normalize(vec3(-p.z, 0.0, p.x));
    float beta = sqrt(0.5 * RS / r);
    float gamma = inversesqrt(max(1.0 - beta * beta, 0.01));
    vec3 toObs = -normalize(photonVel);
    float doppler = 1.0 / (gamma * (1.0 - beta * dot(vdir, toObs)));
    g = doppler * sqrt(max(1.0 - RS / r, 0.05));
  }

  vec3 col = diskRamp(clamp(temp * g, 0.0, 1.25)) * (0.30 + n);
  col *= pow(g, 3.0);

  float edge = smoothstep(DISK_IN, DISK_IN + 0.6, r) * (1.0 - smoothstep(DISK_OUT - 3.5, DISK_OUT, r));
  float alpha = edge * clamp(0.2 + n * 1.6, 0.0, 1.0);
  return vec4(col * edge, alpha);
}

vec3 stars(vec3 rd){
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    vec3 p = rd * (160.0 + fi * 210.0);
    vec3 id = floor(p);
    float h = hash13(id + fi * 17.7);
    vec3 f = fract(p) - 0.5;
    float m = pow(smoothstep(0.5, 0.0, length(f)), 9.0);
    if (h > 0.965){
      vec3 tint = mix(vec3(0.65, 0.75, 1.0), vec3(1.0, 0.82, 0.65), fract(h * 93.0));
      col += tint * m * (0.5 + fract(h * 47.0)) * 2.2;
    }
  }
  float band = fbm(rd * 2.5) * smoothstep(0.6, 0.0, abs(dot(rd, normalize(vec3(0.2, 1.0, 0.1)))));
  col += vec3(0.07, 0.08, 0.12) * band * band * 2.0;
  return col;
}

// ⚛️ Tracing null geodesics backwards through curved spacetime
vec3 trace(vec3 ro, vec3 rd){
  vec3 pos = ro;
  vec3 vel = rd;
  vec3 h = cross(pos, vel);
  float h2 = dot(h, h);
  vec3 col = vec3(0.0);
  float trans = 1.0;

  for (int i = 0; i < STEPS; i++){
    float r2 = dot(pos, pos);
    float r = sqrt(r2);

    if (r < RS) return col;
    if (r2 > FAR * FAR && dot(pos, vel) > 0.0) return col + stars(normalize(vel)) * trans;

    float dt = clamp(0.09 * r, 0.025, 1.7);
    vec3 acc = (-1.5 * h2 / (r2 * r2 * r)) * pos;
    vel = normalize(vel + acc * dt);
    vec3 np = pos + vel * dt;

    if (pos.y * np.y <= 0.0 && abs(pos.y - np.y) > 1e-5){
      float tCross = clamp(pos.y / (pos.y - np.y), 0.0, 1.0);
      vec3 hit = mix(pos, np, tCross);
      float hr = length(hit.xz);
      if (hr > DISK_IN && hr < DISK_OUT){
        vec4 d = diskShade(hit, vel);
        col += d.rgb * d.a * trans;
        trans *= 1.0 - d.a * 0.85;
        if (trans < 0.02) return col;
      }
    }
    pos = np;
  }
  return col;
}

vec3 aces(vec3 x){
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;
  vec3 rd = normalize(uCamBasis * vec3(uv * uTanFov, 1.0));
  vec3 col = trace(uCamPos, rd);
  col *= 1.4;
  col = aces(col);
  col *= 1.0 - 0.25 * dot(uv * 0.4, uv * 0.4);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}
\`;

// Direct Fullscreen Quad Setup inside Main Scene
const uniforms = {
  uResolution: { value: new THREE.Vector2(1, 1) },
  uTime:       { value: 0 },
  uCamPos:     { value: new THREE.Vector3() },
  uCamBasis:   { value: new THREE.Matrix3() },
  uTanFov:     { value: 0.5 },
};

const quadMat = new THREE.ShaderMaterial({
  vertexShader: \`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  \`,
  fragmentShader: frag,
  uniforms: uniforms,
  depthWrite: false,
  depthTest: false,
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat);
quad.frustumCulled = false;
scene.add(quad);

camera.position.set(0, 2.6, 14.0);
camera.lookAt(0, 0, 0);

// 🎬 CINEMATIC AUTO-ORBIT CONTROLLER
const CINE = {
  orbitSpeed: 0.05,
  radius: 14.0,
  height: 2.6,
  userInteracting: false,
  lastInteractTime: 0,
  resumeDelay: 2.5,
};

const canvas = renderer.domElement;
const onUserInteract = () => {
  CINE.userInteracting = true;
  CINE.lastInteractTime = performance.now() * 0.001;
};
const onUserRelease = () => {
  CINE.userInteracting = false;
  CINE.lastInteractTime = performance.now() * 0.001;
};
canvas.addEventListener("mousedown", onUserInteract);
window.addEventListener("mouseup", onUserRelease);
canvas.addEventListener("touchstart", onUserInteract, { passive: true });
window.addEventListener("touchend", onUserRelease, { passive: true });

const size = new THREE.Vector2();
const right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3();
const m4 = new THREE.Matrix4();

// 🔄 60 FPS MAIN UPDATE LOOP
engine.onUpdate((time, delta) => {
  const nowSec = performance.now() * 0.001;
  if (!CINE.userInteracting && nowSec - CINE.lastInteractTime > CINE.resumeDelay) {
    const orbitAngle = time * CINE.orbitSpeed;
    camera.position.x = Math.sin(orbitAngle) * CINE.radius;
    camera.position.z = Math.cos(orbitAngle) * CINE.radius;
    camera.position.y = CINE.height + Math.sin(time * 0.1) * 0.8;
    camera.lookAt(0, 0, 0);
  }

  renderer.getSize(size);
  const dpr = renderer.getPixelRatio();
  uniforms.uResolution.value.set(size.x * dpr, size.y * dpr);
  uniforms.uTime.value = time;
  uniforms.uTanFov.value = Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5);

  camera.updateMatrixWorld();
  const e = camera.matrixWorld.elements;
  right.set(e[0], e[1], e[2]);
  up.set(e[4], e[5], e[6]);
  fwd.set(-e[8], -e[9], -e[10]);
  m4.makeBasis(right, up, fwd);
  uniforms.uCamBasis.value.setFromMatrix4(m4);
  uniforms.uCamPos.value.copy(camera.position);
});`;

function createPBRMaterials() {
  return {
    aerospaceTitanium: new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      metalness: 0.88,
      roughness: 0.15,
    }),
    carbonFiber: new THREE.MeshStandardMaterial({
      color: 0x0F172A,
      metalness: 0.7,
      roughness: 0.35,
    }),
    polishedChrome: new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      metalness: 0.95,
      roughness: 0.08,
    }),
    forgedGoldBrass: new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      metalness: 0.88,
      roughness: 0.18,
    }),
    anodizedBlue: new THREE.MeshStandardMaterial({
      color: 0x3B82F6,
      metalness: 0.85,
      roughness: 0.2,
    }),
    anodizedRed: new THREE.MeshStandardMaterial({
      color: 0xDC2626,
      metalness: 0.85,
      roughness: 0.2,
    }),
    crystalGlass: new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transmission: 0.9,
      opacity: 0.95,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
    }),
  };
}

export default function ScienceSimEngine({
  initialCategory,
  initialPreset,
  initialCode,
  autoPlay = true,
}: ScienceSimEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // isPlaying Ref to eliminate stale closure in animation loop
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const isPlayingRef = useRef<boolean>(autoPlay);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // MediaRecorder timer ref for leak-free cleanup
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // States
  const [code, setCode] = useState<string>(initialCode?.trim() || GARGANTUA_RAYMARCH_CODE);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null); // Edit 2: PostFX Composer Ref
  const animFrameIdRef = useRef<number | null>(null);
  const simTimeRef = useRef<number>(0);
  const updateHooksRef = useRef<((time: number, delta: number) => void)[]>([]);

  // Orbit & Touch Controls
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);

  // Update code if initialCode changes
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setCode(initialCode.trim());
      executeCode(initialCode.trim());
    }
  }, [initialCode]);

  // 1. Initialize High-Performance WebGL Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = Math.min(Math.max(width * 0.58, 380), 550);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#02040A");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2.6, 14.0);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer with ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.7;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    // Safe DOM Attachment
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Base Lighting
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.5);
    sunLight.position.set(40, 20, 30);
    sunLight.userData.isBase = true;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0F172A, 0.6);
    ambientLight.userData.isBase = true;
    scene.add(ambientLight);

    // Mouse & Touch 3D Orbit Controls
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      const cam = cameraRef.current;
      const radius = cam.position.length();
      let theta = Math.atan2(cam.position.x, cam.position.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, cam.position.y / radius)));

      theta -= deltaX * 0.007;
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.007));

      cam.position.x = radius * Math.sin(phi) * Math.sin(theta);
      cam.position.y = radius * Math.cos(phi);
      cam.position.z = radius * Math.sin(phi) * Math.cos(theta);
      cam.lookAt(0, 0, 0);

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const cam = cameraRef.current;
      const dir = cam.position.clone().normalize();
      const dist = cam.position.length();
      const newDist = Math.max(6, Math.min(150, dist + e.deltaY * 0.04));
      cam.position.copy(dir.multiplyScalar(newDist));
      cam.lookAt(0, 0, 0);
    };

    // Touch Orbit & Pinch Zoom
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!cameraRef.current) return;
      if (e.touches.length === 1 && isDraggingRef.current) {
        const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
        const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

        const cam = cameraRef.current;
        const radius = cam.position.length();
        let theta = Math.atan2(cam.position.x, cam.position.z);
        let phi = Math.acos(Math.max(-1, Math.min(1, cam.position.y / radius)));

        theta -= deltaX * 0.007;
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.007));

        cam.position.x = radius * Math.sin(phi) * Math.sin(theta);
        cam.position.y = radius * Math.cos(phi);
        cam.position.z = radius * Math.sin(phi) * Math.cos(theta);
        cam.lookAt(0, 0, 0);

        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pinchDelta = touchStartDistRef.current - dist;

        const cam = cameraRef.current;
        const dir = cam.position.clone().normalize();
        const curDist = cam.position.length();
        const newDist = Math.max(6, Math.min(150, curDist + pinchDelta * 0.05));
        cam.position.copy(dir.multiplyScalar(newDist));
        cam.lookAt(0, 0, 0);

        touchStartDistRef.current = dist;
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      touchStartDistRef.current = null;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });
    domEl.addEventListener("touchstart", onTouchStart, { passive: true });
    domEl.addEventListener("touchmove", onTouchMove, { passive: true });
    domEl.addEventListener("touchend", onTouchEnd, { passive: true });

    // Panel ResizeObserver (Edit 5: Update composer size)
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = Math.min(Math.max(w * 0.58, 380), 550);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      composerRef.current?.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Initial Execution
    executeCode(code);

    // 2. Main 60 FPS Render Loop (Edit 3: PostFX Composer Render)
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;

      if (isPlayingRef.current) {
        simTimeRef.current += delta;
        updateHooksRef.current.forEach((hook, idx) => {
          try {
            hook(simTimeRef.current, delta);
          } catch (err) {
            console.error("Simulation Update Hook Error:", err);
            updateHooksRef.current.splice(idx, 1);
          }
        });
      }

      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        if (composerRef.current) {
          composerRef.current.render(delta);
        } else {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (composerRef.current) composerRef.current.dispose?.();
      resizeObserver.disconnect();
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel);
      domEl.removeEventListener("touchstart", onTouchStart);
      domEl.removeEventListener("touchmove", onTouchMove);
      domEl.removeEventListener("touchend", onTouchEnd);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // 3. Dynamic Code Execution with Complete Memory Cleanup (Edit 4: Composer cleanup)
  const executeCode = (sourceCode: string) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    // PostFX cleanup: dispose previous bloom composer
    if (composerRef.current) {
      composerRef.current.dispose?.();
      composerRef.current = null;
    }

    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!obj.userData?.isBase && obj !== scene) {
        objectsToRemove.push(obj);
      }
    });

    objectsToRemove.forEach((obj) => {
      scene.remove(obj);
      obj.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => m?.dispose());
        }
      });
    });

    updateHooksRef.current = [];
    setRuntimeError(null);

    const pbr = createPBRMaterials();

    // Universal Scientific Helper APIs (Edit 6: engine.bloom)
    const engineAPI = {
      onUpdate: (fn: (time: number, delta: number) => void) => {
        if (typeof fn === "function") {
          updateHooksRef.current.push(fn);
        }
      },
      bloom: (opts: { strength?: number; radius?: number; threshold?: number } = {}) => {
        const strength = opts.strength ?? 1.0;
        const radius = opts.radius ?? 0.6;
        const threshold = opts.threshold ?? 0.8;

        if (composerRef.current) {
          composerRef.current.dispose?.();
          composerRef.current = null;
        }

        const size = new THREE.Vector2();
        renderer.getSize(size);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const bloomPass = new UnrealBloomPass(
          new THREE.Vector2(size.x, size.y),
          strength,
          radius,
          threshold
        );
        composer.addPass(bloomPass);
        composer.setSize(size.x, size.y);
        composerRef.current = composer;

        return {
          setStrength: (v: number) => { bloomPass.strength = v; },
          setRadius: (v: number) => { bloomPass.radius = v; },
          setThreshold: (v: number) => { bloomPass.threshold = v; },
        };
      },
      aerodynamics: {
        calculateLift: (rho: number, velocity: number, wingArea: number, Cl: number) => 0.5 * rho * velocity * velocity * wingArea * Cl,
        calculateDrag: (rho: number, velocity: number, wingArea: number, Cd: number) => 0.5 * rho * velocity * velocity * wingArea * Cd,
      },
      molecular: {
        lennardJonesForce: (r: number, epsilon = 1.0, sigma = 1.0) => 24 * epsilon * (2 * Math.pow(sigma / r, 13) - Math.pow(sigma / r, 7)),
      },
      loadGLTF: (url: string, onLoad: (gltf: any) => void, onError?: (err: any) => void) => {
        const loader = new GLTFLoader();
        loader.load(url, onLoad, undefined, onError);
      },
    };

    try {
      const scriptKernel = new Function("scene", "camera", "renderer", "THREE", "CANNON", "engine", "pbr", "time", sourceCode);
      scriptKernel(scene, camera, renderer, THREE, CANNON, engineAPI, pbr, simTimeRef.current);
    } catch (err: any) {
      console.error("Simulation Script Execution Error:", err);
      setRuntimeError(`Runtime Error: ${err.message}`);
    }
  };

  const handleRunClick = () => {
    executeCode(code);
  };

  // Edit 7: captureSnapshot with composer check
  const captureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    if (composerRef.current) composerRef.current.render();
    else rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `simulation_snapshot_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const stream = canvas.captureStream(60);
      recordedChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
        ? "video/webm; codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      try {
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (recordTimerRef.current) clearInterval(recordTimerRef.current);
          const blob = new Blob(recordedChunksRef.current, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          const ext = mimeType.includes("mp4") ? "mp4" : "webm";
          link.download = `simulation_recording_${Date.now()}.${ext}`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordTime(0);

        recordTimerRef.current = setInterval(() => {
          setRecordTime((t) => t + 1);
        }, 1000);
      } catch (err) {
        console.error("Video recorder initialization failed:", err);
      }
    }
  };

  return (
    <div style={styles.engineContainer} className="science-sim-engine card">
      <div style={styles.canvasWrapper}>
        <div ref={mountRef} style={styles.canvasMount} />

        <div style={styles.floatingControls}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={styles.glassBtn}
            aria-label={isPlaying ? "Pause Simulation" : "Play Simulation"}
            title={isPlaying ? "Pause Simulation" : "Play Simulation"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={captureSnapshot}
            style={styles.glassBtn}
            aria-label="Capture Snapshot"
            title="Capture Snapshot"
          >
            📸
          </button>
          <button
            onClick={toggleRecording}
            style={{
              ...styles.glassBtn,
              backgroundColor: isRecording ? "rgba(239, 68, 68, 0.85)" : "rgba(15, 23, 42, 0.75)",
              color: isRecording ? "#FFFFFF" : "#CBD5E1",
            }}
            aria-label={isRecording ? "Stop Recording" : "Record Video"}
            title="Record 60FPS Video"
          >
            {isRecording ? `⏺ ${recordTime}s` : "🎥"}
          </button>
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            style={{
              ...styles.glassBtn,
              backgroundColor: showCodeEditor ? "rgba(209, 167, 81, 0.85)" : "rgba(15, 23, 42, 0.75)",
              color: showCodeEditor ? "#0F172A" : "#CBD5E1",
              fontWeight: 700,
            }}
            aria-label="Toggle Code Editor"
            title="Toggle Live Code Editor"
          >
            &lt;/&gt;
          </button>
        </div>

        <div style={styles.hintOverlay}>
          🖱️ 3D Orbit: Drag • Zoom: Scroll / Pinch • Real-time Geodesic Raymarching
        </div>
      </div>

      {runtimeError && (
        <div style={styles.errorAlert}>⚠️ {runtimeError}</div>
      )}

      {showCodeEditor && (
        <div style={styles.codeDrawer}>
          <div style={styles.codeHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#D1A751", fontWeight: 700, fontSize: "0.75rem" }}>
                💻 Live Simulation Script (Physics, Raymarching, GLSL)
              </span>
              <span style={{ color: "#94A3B8", fontSize: "0.68rem" }}>
                [Injected: scene, camera, renderer, THREE, CANNON, engine, pbr]
              </span>
            </div>
            <button
              onClick={handleRunClick}
              style={styles.runScriptBtn}
              title="Compile and execute code immediately (Ctrl+Enter)"
            >
              ▶ Run Code
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleRunClick();
              }
            }}
            style={styles.scriptTextarea}
            spellCheck={false}
            placeholder="// Write any 3D simulation code here..."
          />
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  engineContainer: {
    backgroundColor: "#02040A",
    borderRadius: "12px",
    border: "1px solid #1E293B",
    overflow: "hidden",
    margin: "2rem 0",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  canvasWrapper: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    minHeight: "440px",
    backgroundColor: "#02040A",
    touchAction: "none",
  },
  canvasMount: {
    width: "100%",
    height: "100%",
    cursor: "grab",
  },
  floatingControls: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    gap: "0.4rem",
    zIndex: 10,
  },
  glassBtn: {
    background: "rgba(15, 23, 42, 0.75)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#E2E8F0",
    fontSize: "0.78rem",
    padding: "0.35rem 0.65rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.15s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  },
  hintOverlay: {
    position: "absolute",
    bottom: "10px",
    left: "12px",
    background: "rgba(2, 4, 10, 0.85)",
    backdropFilter: "blur(4px)",
    color: "#94A3B8",
    fontSize: "0.68rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    pointerEvents: "none",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  errorAlert: {
    color: "#EF4444",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.5rem 1rem",
    backgroundColor: "#04060C",
    borderTop: "1px solid #334155",
  },
  codeDrawer: {
    backgroundColor: "#060910",
    borderTop: "1px solid #1E293B",
    padding: "0.8rem 1rem",
  },
  codeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
    gap: "0.4rem",
  },
  runScriptBtn: {
    background: "#10B981",
    color: "#FFFFFF",
    border: "none",
    padding: "0.3rem 0.8rem",
    fontSize: "0.74rem",
    fontWeight: 700,
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  scriptTextarea: {
    width: "100%",
    height: "240px",
    backgroundColor: "#02040A",
    color: "#F8FAFC",
    fontFamily: "'Fira Code', monospace",
    fontSize: "0.82rem",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "0.8rem",
    outline: "none",
    resize: "vertical",
    lineHeight: "1.5",
    boxSizing: "border-box",
  },
};
