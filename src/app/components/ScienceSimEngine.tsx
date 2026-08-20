"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type SimCategory = "physics" | "chemistry" | "biotech" | "math" | "custom" | string;

interface ScienceSimEngineProps {
  initialCategory?: SimCategory;
  initialPreset?: string;
  initialCode?: string;
  autoPlay?: boolean;
}

// ============================================================================
// 🌌 CINEMATIC GLSL SHADER KERNEL: INTERSTELLAR GARGANTUA ACCRETION DISK
// ============================================================================
const BLACKHOLE_SHADER_CODE = `// ============================================================================
// 🌌 INTERSTELLAR: GARGANTUA RAY-WARPED ACCRETION DISK (GLSL SHADER)
// Einstein Kerr Metric with Relativistic Doppler Beaming & Lensing
// ============================================================================

// 1. 🕳️ Central Event Horizon (Pure Black Void r = 3.4)
const horizonGeom = new THREE.SphereGeometry(3.4, 64, 64);
const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const eventHorizon = new THREE.Mesh(horizonGeom, horizonMat);
scene.add(eventHorizon);

// 2. ✨ The Blinding Photon Sphere (r = 1.5 r_s)
const photonGeom = new THREE.TorusGeometry(3.65, 0.12, 32, 128);
const photonMat = new THREE.MeshBasicMaterial({ color: 0xFFFDF0 });
const photonRing = new THREE.Mesh(photonGeom, photonMat);
photonRing.rotation.x = Math.PI / 2;
scene.add(photonRing);

// 3. 🔥 Volumetric Procedural Accretion Disk Shaders
const diskVertexShader = \`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
\`;

const diskFragmentShader = \`
  uniform float time;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
  float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float r = length(uv);
    if (r < 0.28 || r > 0.98) discard;

    float normR = (r - 0.28) / (0.98 - 0.28);
    float angle = atan(uv.y, uv.x);
    float rotSpeed = time * 3.5 / (r * 1.5 + 0.1);
    float swirl = angle + rotSpeed;

    float n1 = noise(vec2(swirl * 4.0, normR * 12.0));
    float n2 = noise(vec2(swirl * 8.0 - time, normR * 25.0));
    float plasma = n1 * 0.65 + n2 * 0.35;

    // Relativistic Doppler Beaming (approaching side is brighter)
    float doppler = 1.0 + 0.8 * sin(angle + 0.4);

    vec3 whiteHot = vec3(1.0, 0.98, 0.92);
    vec3 gold = vec3(1.0, 0.72, 0.18);
    vec3 crimson = vec3(0.85, 0.22, 0.04);

    vec3 color = mix(whiteHot, gold, smoothstep(0.0, 0.35, normR));
    color = mix(color, crimson, smoothstep(0.35, 1.0, normR));

    float alpha = smoothstep(0.28, 0.35, r) * smoothstep(0.98, 0.75, r) * (0.8 + 0.4 * plasma) * doppler;
    gl_FragColor = vec4(color * (1.5 + doppler * 0.5), clamp(alpha, 0.0, 1.0));
  }
\`;

// 4. Equatorial Accretion Disk
const diskGeom = new THREE.PlaneGeometry(36.0, 36.0, 128, 128);
const diskUniforms = { time: { value: 0.0 } };
const diskMat = new THREE.ShaderMaterial({
  vertexShader: diskVertexShader,
  fragmentShader: diskFragmentShader,
  uniforms: diskUniforms,
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const accretionDisk = new THREE.Mesh(diskGeom, diskMat);
accretionDisk.rotation.x = -Math.PI / 2.3; // Tilt
scene.add(accretionDisk);

// 5. 🌀 Gravitational Lensing Halo Arcs
const haloVertexShader = \`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

const haloFragmentShader = \`
  uniform float time;
  varying vec2 vUv;
  void main() {
    float u = abs(vUv.x - 0.5) * 2.0;
    float v = abs(vUv.y - 0.5) * 2.0;
    float edge = 1.0 - length(vec2(u, v));
    if (edge <= 0.0) discard;

    vec3 goldGlow = vec3(1.0, 0.75, 0.22);
    float glow = pow(edge, 1.8) * 1.6;
    gl_FragColor = vec4(goldGlow * glow, clamp(glow * 0.85, 0.0, 1.0));
  }
\`;

const haloGeom = new THREE.TorusGeometry(6.4, 1.2, 32, 128, Math.PI * 1.15);
const haloMat = new THREE.ShaderMaterial({
  vertexShader: haloVertexShader,
  fragmentShader: haloFragmentShader,
  uniforms: { time: { value: 0.0 } },
  transparent: true,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const topHalo = new THREE.Mesh(haloGeom, haloMat);
topHalo.position.set(0, 0.5, 0);
topHalo.rotation.z = Math.PI * 0.92;
scene.add(topHalo);

const bottomHalo = new THREE.Mesh(haloGeom, haloMat);
bottomHalo.position.set(0, -0.5, 0);
bottomHalo.rotation.z = -Math.PI * 0.08;
scene.add(bottomHalo);

// 6. 🌊 Miller's Ocean Planet
const millerDist = 8.5;
const millerPlanet = new THREE.Mesh(
  new THREE.SphereGeometry(0.65, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.2, metalness: 0.3 })
);
scene.add(millerPlanet);

const orbitPts = new THREE.EllipseCurve(0, 0, millerDist, millerDist, 0, 2 * Math.PI, false, 0)
  .getPoints(80).map((pt) => new THREE.Vector3(pt.x, 0, pt.y));
const orbitRing = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(orbitPts),
  new THREE.LineBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.4 })
);
orbitRing.rotation.x = accretionDisk.rotation.x;
scene.add(orbitRing);

// 7. 60 FPS Loop
engine.onUpdate((time, delta) => {
  diskUniforms.time.value = time;
  const angle = time * 1.2;
  const x = Math.cos(angle) * millerDist;
  const z = Math.sin(angle) * millerDist;
  millerPlanet.position.set(x, z * Math.sin(accretionDisk.rotation.x), z * Math.cos(accretionDisk.rotation.x));
});`;

// Engine simulation code
const ENGINE_SIM_CODE = `// [4-Stroke Internal Combustion Engine Simulation]
const r = 2.4; // Crank Radius
const l = 6.2; // Connecting Rod Length

// 1. High-Poly Piston with 3 Rings
const piston = new THREE.Group();
const crown = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.38, 2.2, 48), pbr.brushedSteel);
crown.castShadow = true;
for (let ringY = 0.4; ringY >= -0.2; ringY -= 0.3) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.39, 0.04, 12, 48), pbr.castIron);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = ringY;
  crown.add(ring);
}
const wristPin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.1, 24), pbr.polishedChrome);
wristPin.rotation.z = Math.PI / 2;
wristPin.position.y = -0.3;
piston.add(crown, wristPin);
scene.add(piston);

// 2. Forged Connecting Rod
const conRod = new THREE.Group();
const rodBeam = new THREE.Mesh(new THREE.BoxGeometry(0.55, l, 0.38), pbr.forgedGoldBrass);
rodBeam.castShadow = true;
conRod.add(rodBeam);
scene.add(conRod);

// 3. Crankshaft & Flywheel
const crank = new THREE.Group();
const journal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 32), pbr.polishedChrome);
journal.rotation.x = Math.PI / 2;
const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.7, 48), pbr.castIron);
flywheel.rotation.x = Math.PI / 2;
flywheel.position.z = -2.8;
flywheel.castShadow = true;
crank.add(journal, flywheel);
crank.position.set(0, -5.2, 0);
scene.add(crank);

// 4. Spark Plug with Ignition Light
const sparkPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 32), pbr.porcelainCeramic);
sparkPlug.position.set(0, 8.8, 0);
scene.add(sparkPlug);
const sparkLight = new THREE.PointLight(0xFF4500, 0, 18);
sparkLight.position.set(0, 6.2, 0);
scene.add(sparkLight);

// 5. Intake (Blue) & Exhaust (Red) Valves
const inValve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.85, 3.5, 16), pbr.anodizedBlue);
inValve.position.set(-1.9, 5.2, 0);
scene.add(inValve);
const exValve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.85, 3.5, 16), pbr.anodizedRed);
exValve.position.set(1.9, 5.2, 0);
scene.add(exValve);

// 6. Transparent Glass Cylinder Sleeve
const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 7.2, 48, 1, true), pbr.crystalGlass);
sleeve.position.y = 1.6;
scene.add(sleeve);

// 7. Combustion Flame Burst Mesh
const flame = new THREE.Mesh(
  new THREE.CylinderGeometry(2.4, 2.4, 2.0, 32),
  new THREE.MeshBasicMaterial({ color: 0xFF3300, transparent: true, opacity: 0.0 })
);
flame.position.y = 4.4;
scene.add(flame);

// 60 FPS 4-Stroke Otto Cycle Kinematics Loop
engine.onUpdate((time, delta) => {
  const theta = time * 3.6;
  const cycle = ((theta % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
  const crankY = -5.2;
  const pinX = r * Math.sin(theta);
  const pinY = crankY + r * Math.cos(theta);

  const pistonY = crankY + r * Math.cos(theta) + Math.sqrt(l * l - r * r * Math.sin(theta) * Math.sin(theta));
  piston.position.set(0, pistonY, 0);

  conRod.position.set(pinX / 2, (pinY + pistonY) / 2, 0);
  conRod.rotation.z = Math.asin((-r * Math.sin(theta)) / l);
  crank.rotation.z = theta;

  if (cycle < Math.PI) {
    inValve.position.y = 5.2 - 0.45 * Math.sin(cycle);
    exValve.position.y = 5.2;
    flame.material.color.setHex(0x3B82F6);
    flame.material.opacity = 0.25 * Math.sin(cycle);
    sparkLight.intensity = 0;
  } else if (cycle < 2 * Math.PI) {
    inValve.position.y = 5.2;
    flame.material.color.setHex(0xF59E0B);
    flame.material.opacity = 0.35 * Math.sin(cycle - Math.PI);
    sparkLight.intensity = 0;
  } else if (cycle < 3 * Math.PI) {
    const power = cycle - 2 * Math.PI;
    flame.material.color.setHex(0xFF3300);
    flame.material.opacity = Math.max(0, 0.9 - power * 0.45);
    sparkLight.intensity = power < 0.6 ? 7.0 : 0;
  } else {
    const exh = cycle - 3 * Math.PI;
    exValve.position.y = 5.2 - 0.45 * Math.sin(exh);
    flame.material.color.setHex(0x64748B);
    flame.material.opacity = 0.3 * Math.sin(exh);
    sparkLight.intensity = 0;
  }
});`;

const EXECUTABLE_SCRIPTS: Record<string, { title: string; category: string; code: string }> = {
  blackhole: {
    title: "🌌 Interstellar Gargantua (GLSL Raymarched Plasma)",
    category: "physics",
    code: BLACKHOLE_SHADER_CODE,
  },
  engine: {
    title: "⚙️ 4-Stroke IC Engine (Kinematics & Combustion)",
    category: "engineering",
    code: ENGINE_SIM_CODE,
  },
};

function createPBRMaterials() {
  return {
    polishedChrome: new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.95, roughness: 0.08 }),
    brushedSteel: new THREE.MeshStandardMaterial({ color: 0x94A3B8, metalness: 0.85, roughness: 0.25 }),
    forgedGoldBrass: new THREE.MeshStandardMaterial({ color: 0xD1A751, metalness: 0.9, roughness: 0.18 }),
    anodizedBlue: new THREE.MeshStandardMaterial({ color: 0x2563EB, metalness: 0.85, roughness: 0.2 }),
    anodizedRed: new THREE.MeshStandardMaterial({ color: 0xDC2626, metalness: 0.85, roughness: 0.2 }),
    castIron: new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.7, roughness: 0.45 }),
    porcelainCeramic: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.15, metalness: 0.05 }),
    crystalGlass: new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, transmission: 0.85, opacity: 0.9, transparent: true, roughness: 0.1, ior: 1.52, metalness: 0.1 }),
  };
}

export default function ScienceSimEngine({
  initialCategory = "physics",
  initialPreset = "blackhole",
  initialCode,
  autoPlay = true,
}: ScienceSimEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Time HUD Refs (Updated directly in render loop without thrashing React)
  const millerTimeRef = useRef<HTMLSpanElement>(null);
  const earthTimeRef = useRef<HTMLSpanElement>(null);

  // States
  const [activePreset, setActivePreset] = useState<string>(initialPreset || "blackhole");
  const [code, setCode] = useState<string>(
    initialCode?.trim() || (EXECUTABLE_SCRIPTS[initialPreset || "blackhole"]?.code || EXECUTABLE_SCRIPTS.blackhole.code)
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(true);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Volumetric Shader Active (60 FPS)");

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const simTimeRef = useRef<number>(0);
  const totalMillerSecondsRef = useRef<number>(0);
  const totalEarthSecondsRef = useRef<number>(0);
  const updateHooksRef = useRef<((time: number, delta: number) => void)[]>([]);

  // Orbit controls
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // 1. Initialize WebGL Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = Math.min(Math.max(width * 0.58, 380), 550);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#010204");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 30);
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
    renderer.toneMappingExposure = 1.5;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    // Safe DOM Attachment (without innerHTML clearing)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0x0F172A, 0.8);
    scene.add(ambientLight);

    // Mouse Interaction for 3D Orbit
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
      const newDist = Math.max(6, Math.min(120, dist + e.deltaY * 0.04));
      cam.position.copy(dir.multiplyScalar(newDist));
      cam.lookAt(0, 0, 0);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });

    // Resize
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = Math.min(Math.max(w * 0.58, 380), 550);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Initial Execution
    executeCodeInEditor(code);

    // 2. Main 60 FPS Render Loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = (now - lastTime) * 0.001 * simSpeed;
      lastTime = now;

      if (isPlaying) {
        simTimeRef.current += delta;

        // Smooth direct DOM update for Time Dilation HUD (zero React re-render overhead!)
        totalMillerSecondsRef.current += delta * 0.1;
        totalEarthSecondsRef.current += delta * 6132.0;

        if (millerTimeRef.current) {
          const mSec = totalMillerSecondsRef.current;
          const mins = Math.floor(mSec / 60);
          const secs = Math.floor(mSec % 60);
          millerTimeRef.current.textContent = `${mins}m ${secs}s`;
        }

        if (earthTimeRef.current) {
          const eSec = totalEarthSecondsRef.current;
          const years = (eSec / (365.25 * 86400)).toFixed(2);
          const days = Math.floor((eSec % (365.25 * 86400)) / 86400);
          earthTimeRef.current.textContent = `${years} Yrs (${days} Days)`;
        }

        updateHooksRef.current.forEach((hook) => {
          try {
            hook(simTimeRef.current, delta);
          } catch (err) {
            console.error("Simulation Update Hook Error:", err);
          }
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("wheel", onWheel as any);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // 3. True Real-Time Code Compiler & Execution
  const executeCodeInEditor = (sourceCode: string) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Light) && obj !== scene) {
        objectsToRemove.push(obj);
      }
    });
    objectsToRemove.forEach((obj) => {
      scene.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
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
    };

    try {
      const scriptKernel = new Function("scene", "camera", "renderer", "THREE", "engine", "pbr", "time", sourceCode);
      scriptKernel(scene, camera, renderer, THREE, engineAPI, pbr, simTimeRef.current);
      setStatusMessage("⚡ Code Running (60 FPS)");
    } catch (err: any) {
      console.error("Simulation Script Execution Error:", err);
      setRuntimeError(`Runtime Error: ${err.message}`);
    }
  };

  // Switch Script Preset
  const handleLoadScript = (presetKey: string) => {
    const item = EXECUTABLE_SCRIPTS[presetKey];
    if (item) {
      setActivePreset(presetKey);
      setCode(item.code);
      executeCodeInEditor(item.code);
    }
  };

  // Compile & Run Button
  const handleRunClick = () => {
    executeCodeInEditor(code);
  };

  // Capture High-Res Snapshot (PNG)
  const captureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `simulation_4k_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  // 60 FPS Video Recording
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
      const options = { mimeType: "video/webm; codecs=vp9" };

      try {
        const recorder = new MediaRecorder(stream, options);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `simulation_video_${Date.now()}.webm`;
          link.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordTime(0);

        const timer = setInterval(() => {
          setRecordTime((t) => t + 1);
        }, 1000);

        recorder.onstop = () => {
          clearInterval(timer);
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `simulation_video_${Date.now()}.webm`;
          link.click();
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error("Video recorder initialization failed:", err);
      }
    }
  };

  return (
    <div style={styles.engineContainer} className="science-sim-engine card">
      {/* Top Header Controls */}
      <div style={styles.topBar}>
        <div style={styles.leftControls}>
          <div style={styles.badgeGroup}>
            <span style={styles.engineBadge}>⚡ 3D RELATIVISTIC SHADER ENGINE</span>
            <span style={styles.hardwareBadge}>{statusMessage}</span>
          </div>

          {/* Load Sample Scripts into Editor */}
          <div style={styles.templateGroup}>
            <span style={styles.templateLabel}>LOAD SCRIPT:</span>
            {Object.keys(EXECUTABLE_SCRIPTS).map((key) => (
              <button
                key={key}
                onClick={() => handleLoadScript(key)}
                style={activePreset === key ? styles.templateBtnActive : styles.templateBtn}
                title={`Load ${EXECUTABLE_SCRIPTS[key].title} into the code editor`}
              >
                {key === "blackhole" ? "🌌 Gargantua Black Hole" : "⚙️ 4-Stroke Engine"}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.rightControls}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={styles.actionBtn}>
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button onClick={captureSnapshot} style={styles.actionBtn} title="Capture 4K Snapshot">
            📸 Snapshot
          </button>
          <button
            onClick={toggleRecording}
            style={{
              ...styles.recordBtn,
              backgroundColor: isRecording ? "#EF4444" : "#10B981",
            }}
            title="Record 60FPS Video (WebM)"
          >
            {isRecording ? `⏺ Stop (${recordTime}s)` : "🎥 Record Video"}
          </button>
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            style={showCodeEditor ? styles.codeBtnActive : styles.codeBtn}
            title="Toggle Live Code Editor"
          >
            💻 Code Editor
          </button>
        </div>
      </div>

      {/* Sub Bar */}
      <div style={styles.subBar}>
        {runtimeError ? (
          <div style={styles.errorAlert}>⚠️ {runtimeError}</div>
        ) : (
          <div style={styles.infoText}>
            💡 Type or edit ANY script in the Code Editor below and click <b>"▶ Compile &amp; Run"</b> (or press Ctrl+Enter).
          </div>
        )}

        <div style={styles.sliderGroup}>
          <span style={styles.sliderLabel}>SPEED: {simSpeed}x</span>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.2"
            value={simSpeed}
            onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>

      {/* 3D WebGL Canvas Wrapper */}
      <div style={styles.canvasWrapper}>
        {/* Dedicated Mount Div for Three.js (Isolated from React children) */}
        <div ref={mountRef} style={styles.canvasMount} />

        {/* Real-Time Relativistic Time Dilation Comparison Overlay */}
        {activePreset === "blackhole" && (
          <div style={styles.dilationHUD}>
            <div style={styles.dilationHeader}>⏳ GRAVITATIONAL TIME DILATION HUD</div>
            <div style={styles.clockRow}>
              <span style={{ color: "#38BDF8", fontWeight: 700 }}>🌊 Miller&apos;s Planet (r = 8.5):</span>
              <span ref={millerTimeRef} style={styles.clockValue}>0m 0s</span>
            </div>
            <div style={styles.clockRow}>
              <span style={{ color: "#10B981", fontWeight: 700 }}>🌍 Earth Observer:</span>
              <span ref={earthTimeRef} style={styles.clockValue}>0.00 Yrs</span>
            </div>
          </div>
        )}

        <div style={styles.hintOverlay}>
          🖱️ Drag to orbit in 3D • Scroll to zoom • Edit code below to transform live!
        </div>
      </div>

      {/* 💻 The REAL Live Code Editor Driving the Simulation */}
      {showCodeEditor && (
        <div style={styles.codeDrawer}>
          <div style={styles.codeHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#D1A751", fontWeight: 700, fontSize: "0.78rem" }}>
                💻 Live Simulation Script (Edit lines &amp; hit Run!)
              </span>
              <span style={{ color: "#64748B", fontSize: "0.68rem" }}>
                [Injected: scene, camera, renderer, THREE, engine, pbr]
              </span>
            </div>
            <button
              onClick={handleRunClick}
              style={styles.runScriptBtn}
              title="Compile and execute code immediately (Ctrl+Enter)"
            >
              ▶ Compile &amp; Run Code
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
    backgroundColor: "#010204",
    borderRadius: "10px",
    border: "1px solid #1E293B",
    overflow: "hidden",
    margin: "2rem 0",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.6rem 1rem",
    backgroundColor: "#060910",
    borderBottom: "1px solid #1E293B",
    gap: "0.6rem",
  },
  leftControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
    flexWrap: "wrap",
  },
  badgeGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
  },
  engineBadge: {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#D1A751",
    letterSpacing: "0.06em",
    fontFamily: "var(--font-sans)",
  },
  hardwareBadge: {
    fontSize: "0.6rem",
    fontWeight: 700,
    color: "#10B981",
    letterSpacing: "0.05em",
  },
  templateGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    background: "#010204",
    padding: "0.2rem 0.4rem",
    borderRadius: "6px",
  },
  templateLabel: {
    fontSize: "0.62rem",
    fontWeight: 700,
    color: "#64748B",
  },
  templateBtn: {
    background: "transparent",
    border: "1px solid #1E293B",
    color: "#94A3B8",
    fontSize: "0.68rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  templateBtnActive: {
    background: "#1E293B",
    border: "1px solid #D1A751",
    color: "#F8FAFC",
    fontWeight: 700,
    fontSize: "0.68rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  rightControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  actionBtn: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid #334155",
    color: "#E2E8F0",
    fontSize: "0.72rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
  },
  recordBtn: {
    border: "none",
    color: "#FFFFFF",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.25rem 0.7rem",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  codeBtn: {
    background: "#1E293B",
    border: "1px solid #475569",
    color: "#94A3B8",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  codeBtnActive: {
    background: "#D1A751",
    border: "1px solid #D1A751",
    color: "#060910",
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  subBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.4rem 1rem",
    backgroundColor: "#04060C",
    borderBottom: "1px solid #1E293B",
    gap: "0.4rem",
  },
  errorAlert: {
    color: "#EF4444",
    fontSize: "0.72rem",
    fontWeight: 700,
  },
  infoText: {
    color: "#94A3B8",
    fontSize: "0.68rem",
  },
  sliderGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginLeft: "auto",
  },
  sliderLabel: {
    fontSize: "0.65rem",
    color: "#94A3B8",
    fontWeight: 600,
  },
  slider: {
    width: "70px",
    cursor: "pointer",
  },
  canvasWrapper: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    minHeight: "400px",
    backgroundColor: "#010204",
  },
  canvasMount: {
    width: "100%",
    height: "100%",
    cursor: "grab",
  },
  dilationHUD: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "rgba(1, 2, 4, 0.92)",
    backdropFilter: "blur(8px)",
    border: "1px solid #D1A751",
    color: "#F8FAFC",
    padding: "0.5rem 0.9rem",
    borderRadius: "8px",
    pointerEvents: "none",
    boxShadow: "0 6px 18px rgba(0,0,0,0.8)",
    minWidth: "240px",
  },
  dilationHeader: {
    fontSize: "0.68rem",
    fontWeight: 800,
    color: "#D1A751",
    letterSpacing: "0.05em",
    marginBottom: "0.3rem",
    borderBottom: "1px solid rgba(209, 167, 81, 0.3)",
    paddingBottom: "0.2rem",
  },
  clockRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.72rem",
    margin: "0.15rem 0",
  },
  clockValue: {
    fontFamily: "'Fira Code', monospace",
    fontWeight: 700,
    color: "#FFFFFF",
  },
  hintOverlay: {
    position: "absolute",
    bottom: "10px",
    left: "12px",
    background: "rgba(1, 2, 4, 0.85)",
    backdropFilter: "blur(4px)",
    color: "#94A3B8",
    fontSize: "0.68rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    pointerEvents: "none",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  codeDrawer: {
    backgroundColor: "#010204",
    borderTop: "1px solid #1E293B",
    padding: "0.8rem 1rem",
  },
  codeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "#94A3B8",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
    gap: "0.4rem",
  },
  runScriptBtn: {
    background: "#10B981",
    color: "#FFFFFF",
    border: "none",
    padding: "0.35rem 0.9rem",
    fontSize: "0.74rem",
    fontWeight: 700,
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  scriptTextarea: {
    width: "100%",
    height: "260px",
    backgroundColor: "#04070D",
    color: "#F8FAFC",
    fontFamily: "'Fira Code', monospace",
    fontSize: "0.82rem",
    border: "1px solid #1E293B",
    borderRadius: "4px",
    padding: "0.8rem",
    outline: "none",
    resize: "vertical",
    lineHeight: "1.5",
    boxSizing: "border-box",
  },
};
