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
// 🌍 PHOTOREALISTIC NASA EARTH & ROCKET ESCAPE VELOCITY SIMULATION
// ============================================================================
const NASA_EARTH_ROCKET_CODE = `// ============================================================================
// 🌍 PHOTOREALISTIC NASA EARTH & ROCKET ESCAPE VELOCITY SIMULATION
// ============================================================================

// ✅ Fixed: sunDir DirectionalLight (40,20,30) se EXACT align
const sunDir = new THREE.Vector3(40, 20, 30).normalize();

// ✅ Fixed: world-space vertex shader
const earthVertexShader = \`
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vObjPos;
  varying vec2 vUv;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vObjPos = position;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
\`;

const earthFragmentShader = \`
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  varying vec3 vObjPos;
  varying vec2 vUv;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Noise in Object Space: continents rotate with Earth
    vec3 n = normalize(vObjPos);
    float elevation = snoise(n * 2.2) * 0.6 + snoise(n * 6.0) * 0.25 + snoise(n * 14.0) * 0.15;

    // World-Space N·L: terminator locked to Sun
    float NdotL = dot(vWorldNormal, uSunDir);
    float dayLight = smoothstep(-0.15, 0.25, NdotL);

    vec3 deepOcean = vec3(0.02, 0.08, 0.32);
    vec3 shallowOcean = vec3(0.04, 0.25, 0.55);
    vec3 forestGreen = vec3(0.12, 0.42, 0.18);
    vec3 mountainSand = vec3(0.65, 0.52, 0.32);
    vec3 snowWhite = vec3(0.92, 0.95, 1.0);

    vec3 dayColor;
    float isOcean = 0.0;

    if (elevation < 0.05) {
      isOcean = 1.0;
      dayColor = mix(deepOcean, shallowOcean, smoothstep(-0.3, 0.05, elevation));
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      vec3 halfDir = normalize(uSunDir + viewDir);
      float spec = pow(max(dot(vWorldNormal, halfDir), 0.0), 32.0);
      dayColor += vec3(1.0, 0.95, 0.85) * spec * 1.8 * dayLight;
    } else {
      dayColor = mix(forestGreen, mountainSand, smoothstep(0.05, 0.45, elevation));
      dayColor = mix(dayColor, snowWhite, smoothstep(0.45, 0.75, elevation));
    }

    // City lights in Object Space
    float cityNoise = snoise(n * 35.0) * 0.5 + snoise(n * 70.0) * 0.5;
    float cityMask = smoothstep(0.25, 0.6, cityNoise) * (1.0 - isOcean);
    vec3 nightCities = vec3(1.0, 0.75, 0.25) * cityMask * 2.5 * (1.0 - dayLight);

    // Sunset Terminator
    float sunsetFactor = smoothstep(-0.2, 0.05, NdotL) * smoothstep(0.25, 0.0, NdotL);
    vec3 sunsetGlow = vec3(1.0, 0.35, 0.08) * sunsetFactor * 0.85;

    vec3 finalColor = dayColor * max(dayLight, 0.04) + nightCities + sunsetGlow;
    gl_FragColor = vec4(finalColor, 1.0);
  }
\`;

const earthRadius = 9.0;
const earthUniforms = {
  uSunDir: { value: sunDir },
  uTime: { value: 0.0 }
};

const earthMat = new THREE.ShaderMaterial({
  vertexShader: earthVertexShader,
  fragmentShader: earthFragmentShader,
  uniforms: earthUniforms,
});

const earth = new THREE.Mesh(new THREE.SphereGeometry(earthRadius, 96, 96), earthMat);
scene.add(earth);

const cloudMat = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF,
  transparent: true,
  opacity: 0.42,
  roughness: 0.9,
  blending: THREE.AdditiveBlending
});
const clouds = new THREE.Mesh(new THREE.SphereGeometry(earthRadius * 1.02, 64, 64), cloudMat);
scene.add(clouds);

const atmoMat = new THREE.MeshStandardMaterial({
  color: 0x38BDF8,
  transparent: true,
  opacity: 0.22,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending
});
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(earthRadius * 1.12, 64, 64), atmoMat);
scene.add(atmosphere);

const starCount = 2500;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  const r = 90 + Math.random() * 60;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(Math.random() * 2 - 1);
  starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  starPos[i * 3 + 2] = r * Math.cos(phi);
}
const starGeom = new THREE.BufferGeometry();
starGeom.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
scene.add(new THREE.Points(starGeom, new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.35 })));

const rocket = new THREE.Group();
scene.add(rocket);

const coreStage = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 0.7, 4.8, 32),
  pbr.aerospaceTitanium
);
coreStage.castShadow = true;

const interstage = new THREE.Mesh(
  new THREE.CylinderGeometry(0.72, 0.72, 0.6, 32),
  pbr.carbonFiber
);
interstage.position.y = 1.0;

const noseFairing = new THREE.Mesh(
  new THREE.ConeGeometry(0.72, 2.0, 32),
  pbr.anodizedRed
);
noseFairing.position.y = 3.4;

for (let f = 0; f < 4; f++) {
  const ang = (f * Math.PI) / 2;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.85), pbr.carbonFiber);
  fin.position.set(Math.cos(ang) * 0.75, -1.8, Math.sin(ang) * 0.75);
  fin.rotation.y = ang;
  rocket.add(fin);
}

const engineCluster = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.65, 0.8, 24),
  pbr.polishedChrome
);
engineCluster.position.y = -2.8;

const plume = new THREE.Mesh(
  new THREE.ConeGeometry(0.65, 3.8, 24),
  new THREE.MeshBasicMaterial({ color: 0xFF5500, transparent: true, opacity: 0.95 })
);
plume.rotation.x = Math.PI;
plume.position.y = -4.7;

const thrustLight = new THREE.PointLight(0xFF4500, 4.0, 25);
thrustLight.position.y = -4.0;

rocket.add(coreStage, interstage, noseFairing, engineCluster, plume, thrustLight);

const orbitPts = [];
for (let j = 0; j <= 120; j++) {
  const a = (j / 120) * Math.PI * 2;
  const rad = 15.0 + Math.sin(a * 2.0) * 3.5;
  orbitPts.push(new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * 2.5, Math.sin(a) * rad));
}
const orbitPath = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPts),
  new THREE.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.55 })
);
scene.add(orbitPath);

engine.onUpdate((time, delta) => {
  earthUniforms.uTime.value = time;
  earth.rotation.y = time * 0.05;
  clouds.rotation.y = time * 0.07;

  const orbAngle = time * 0.65;
  const rad = 15.0 + Math.sin(orbAngle * 2.0) * 3.5;
  const x = Math.cos(orbAngle) * rad;
  const y = Math.sin(orbAngle) * 2.5;
  const z = Math.sin(orbAngle) * rad;

  rocket.position.set(x, y, z);

  const vx = -Math.sin(orbAngle) * rad;
  const vy = Math.cos(orbAngle) * 2.5;
  const vz = Math.cos(orbAngle) * rad;
  const velDir = new THREE.Vector3(vx, vy, vz).normalize();
  rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), velDir);

  plume.scale.set(
    1.0 + Math.sin(time * 35) * 0.18,
    1.0 + Math.cos(time * 30) * 0.28,
    1.0 + Math.sin(time * 35) * 0.18
  );
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

  // States
  const [code, setCode] = useState<string>(initialCode?.trim() || NASA_EARTH_ROCKET_CODE);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // isPlaying Ref mirror (eliminates stale closure)
  const isPlayingRef = useRef<boolean>(autoPlay);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const simTimeRef = useRef<number>(0);
  const updateHooksRef = useRef<((time: number, delta: number) => void)[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Mouse & Touch 3D Orbit Controls
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#02040A");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 14, 34);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

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
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Base lights (survive re-compilation)
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.5);
    sunLight.position.set(40, 20, 30);
    sunLight.userData.isBase = true;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0F172A, 0.6);
    ambientLight.userData.isBase = true;
    scene.add(ambientLight);

    // Mouse Controls
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
      // Min distance 10.0 ensures camera cannot clip inside Earth (radius 9.0)
      const newDist = Math.max(10, Math.min(150, dist + e.deltaY * 0.04));
      cam.position.copy(dir.multiplyScalar(newDist));
      cam.lookAt(0, 0, 0);
    };

    // Mobile Touch Orbit & 2-Finger Pinch Zoom
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
        const newDist = Math.max(10, Math.min(150, curDist + pinchDelta * 0.05));
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

    // Responsive Container ResizeObserver
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

    // 2. Main 60 FPS Render Loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) * 0.001, 0.05);
      lastTime = now;

      if (isPlayingRef.current) {
        simTimeRef.current += delta;
        updateHooksRef.current.forEach((hook) => {
          try {
            hook(simTimeRef.current, delta);
          } catch (err) {
            console.error("Simulation Update Hook Error:", err);
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
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      resizeObserver.disconnect();
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel as any);
      domEl.removeEventListener("touchstart", onTouchStart);
      domEl.removeEventListener("touchmove", onTouchMove);
      domEl.removeEventListener("touchend", onTouchEnd);
      if (composerRef.current) {
        composerRef.current.dispose?.();
        composerRef.current = null;
      }
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // 3. Dynamic Code Execution with Memory Cleanup
  const executeCode = (sourceCode: string) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    if (composerRef.current) {
      composerRef.current.dispose?.();
      composerRef.current = null;
    }

    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj === scene) return;
      const isBaseLight = obj instanceof THREE.Light && obj.userData.isBase === true;
      if (!isBaseLight) {
        objectsToRemove.push(obj);
      }
    });

    objectsToRemove.forEach((obj) => {
      scene.remove(obj);
      obj.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m: any) => {
          if (m && typeof m.dispose === "function") m.dispose();
        });
      });
    });

    updateHooksRef.current = [];
    setRuntimeError(null);

    const pbr = createPBRMaterials();

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

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      try {
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (recordTimerRef.current) {
            clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
          }
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `simulation_${Date.now()}.webm`;
          link.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordTime(0);

        recordTimerRef.current = window.setInterval(() => {
          setRecordTime((t) => t + 1);
        }, 1000);
      } catch (err) {
        console.error("Video recorder initialization failed:", err);
      }
    }
  };

  return (
    <div style={styles.engineContainer} className="science-sim-engine card">
      {/* 3D WebGL Canvas Wrapper */}
      <div style={styles.canvasWrapper}>
        <div ref={mountRef} style={styles.canvasMount} />

        {/* Minimal Floating Glass Controls */}
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
            title="Capture Snapshot (PNG)"
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

        {/* Rendered by Kinetic Code Labs Watermark Badge */}
        <div style={styles.hintOverlay}>
          ✦ Rendered by Kinetic Code Labs
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
                💻 Live Simulation Script (Physics, Aerodynamics, Shaders)
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
    bottom: "12px",
    left: "12px",
    background: "rgba(2, 4, 10, 0.85)",
    backdropFilter: "blur(6px)",
    color: "#D1A751",
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    padding: "0.3rem 0.65rem",
    borderRadius: "4px",
    pointerEvents: "none",
    border: "1px solid rgba(209, 167, 81, 0.25)",
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
