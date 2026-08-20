"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three-stdlib";

export type SimCategory = "physics" | "chemistry" | "biotech" | "math" | "custom" | string;

interface ScienceSimEngineProps {
  initialCategory?: SimCategory;
  initialPreset?: string;
  initialCode?: string;
  autoPlay?: boolean;
}

// ============================================================================
// 🌍 CINEMATIC NASA EARTH & ROCKET ORBITAL ESCAPE SIMULATION (GLSL SHADERS)
// Procedural Landmasses, Specular Ocean Sun Reflections, Night-Side City Lights,
// Atmospheric Twilight Glow, Swirling Clouds & High-Detail Rocket Vehicle
// ============================================================================
const NASA_EARTH_ROCKET_CODE = `// ============================================================================
// 🌍 PHOTOREALISTIC NASA EARTH & ROCKET ESCAPE VELOCITY SIMULATION
// Custom Procedural GLSL Shaders: Oceans, Continents, City Lights & Clouds
// ============================================================================

// 1. ☀️ Distant Blinding Sun Direction
const sunDir = new THREE.Vector3(1.0, 0.4, 0.8).normalize();

// 2. 🌍 Procedural NASA Earth Shader (Oceans, Continents, Night City Lights)
const earthVertexShader = \`
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
\`;

const earthFragmentShader = \`
  uniform vec3 uSunDir;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  // 3D Simplex-Style Noise for Continents & Terrain
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
    vec3 n = normalize(vPosition);
    // Multiscale Terrain Noise
    float elevation = snoise(n * 2.2) * 0.6 + snoise(n * 6.0) * 0.25 + snoise(n * 14.0) * 0.15;

    // Day/Night Lighting Terminator
    float NdotL = dot(vNormal, uSunDir);
    float dayLight = smoothstep(-0.15, 0.25, NdotL);

    // Ocean vs Continent Palette
    vec3 deepOcean = vec3(0.02, 0.08, 0.32);
    vec3 shallowOcean = vec3(0.04, 0.25, 0.55);
    vec3 forestGreen = vec3(0.12, 0.42, 0.18);
    vec3 mountainSand = vec3(0.65, 0.52, 0.32);
    vec3 snowWhite = vec3(0.92, 0.95, 1.0);

    vec3 dayColor;
    float isOcean = 0.0;

    if (elevation < 0.05) {
      // Ocean Surface with Specular Sun Glint
      isOcean = 1.0;
      dayColor = mix(deepOcean, shallowOcean, smoothstep(-0.3, 0.05, elevation));
      // Blinding Sun Reflection on Water
      vec3 viewDir = normalize(-vPosition);
      vec3 halfDir = normalize(uSunDir + viewDir);
      float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
      dayColor += vec3(1.0, 0.95, 0.85) * spec * 1.8 * dayLight;
    } else {
      // Landmass Continents
      dayColor = mix(forestGreen, mountainSand, smoothstep(0.05, 0.45, elevation));
      dayColor = mix(dayColor, snowWhite, smoothstep(0.45, 0.75, elevation));
    }

    // 🌃 Glowing City Lights on Night Side
    float cityNoise = snoise(n * 35.0) * 0.5 + snoise(n * 70.0) * 0.5;
    float cityMask = smoothstep(0.25, 0.6, cityNoise) * (1.0 - isOcean);
    vec3 nightCities = vec3(1.0, 0.75, 0.25) * cityMask * 2.5 * (1.0 - dayLight);

    // 🌅 Atmospheric Sunset Terminator Amber Rim
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

// 3. ☁️ Volumetric Swirling Clouds Layer
const cloudMat = new THREE.MeshStandardMaterial({
  color: 0xFFFFFF,
  transparent: true,
  opacity: 0.42,
  roughness: 0.9,
  blending: THREE.AdditiveBlending
});
const clouds = new THREE.Mesh(new THREE.SphereGeometry(earthRadius * 1.02, 64, 64), cloudMat);
scene.add(clouds);

// 4. 🌀 Atmospheric Rayleigh Scattering Cyan Glow Halo
const atmoMat = new THREE.MeshStandardMaterial({
  color: 0x38BDF8,
  transparent: true,
  opacity: 0.22,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending
});
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(earthRadius * 1.12, 64, 64), atmoMat);
scene.add(atmosphere);

// 5. 🌌 Cosmic Starfield Background (2,500 Stars)
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

// 6. 🚀 High-Poly Multi-Stage Heavy Space Rocket (Close-Up Detailed CAD)
const rocket = new THREE.Group();
scene.add(rocket);

// Rocket Core Fuselage (Aerospace Titanium PBR)
const coreStage = new THREE.Mesh(
  new THREE.CylinderGeometry(0.7, 0.7, 4.8, 32),
  pbr.aerospaceTitanium
);
coreStage.castShadow = true;

// Carbon-Fiber Interstage Ring
const interstage = new THREE.Mesh(
  new THREE.CylinderGeometry(0.72, 0.72, 0.6, 32),
  pbr.carbonFiber
);
interstage.position.y = 1.0;

// Aerodynamic Payload Fairing Nose Cone
const noseFairing = new THREE.Mesh(
  new THREE.ConeGeometry(0.72, 2.0, 32),
  pbr.anodizedRed
);
noseFairing.position.y = 3.4;

// 4 Aerodynamic Titanium Grid Fins
for (let f = 0; f < 4; f++) {
  const ang = (f * Math.PI) / 2;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.85), pbr.carbonFiber);
  fin.position.set(Math.cos(ang) * 0.75, -1.8, Math.sin(ang) * 0.75);
  fin.rotation.y = ang;
  rocket.add(fin);
}

// Heavy Rocket Engines Gimbal Cluster (Chrome)
const engineCluster = new THREE.Mesh(
  new THREE.CylinderGeometry(0.45, 0.65, 0.8, 24),
  pbr.polishedChrome
);
engineCluster.position.y = -2.8;

// Supersonic Shock-Diamond Afterburner Fire Plume
const plume = new THREE.Mesh(
  new THREE.ConeGeometry(0.65, 3.8, 24),
  new THREE.MeshBasicMaterial({ color: 0xFF5500, transparent: true, opacity: 0.95 })
);
plume.rotation.x = Math.PI;
plume.position.y = -4.7;

const thrustLight = new THREE.PointLight(0xFF4500, 4.0, 25);
thrustLight.position.y = -4.0;

rocket.add(coreStage, interstage, noseFairing, engineCluster, plume, thrustLight);

// 7. 🛰️ Glowing Trajectory Path Spline
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

// 8. 🔄 60 FPS ORBITAL FLIGHT DYNAMICS LOOP
engine.onUpdate((time, delta) => {
  earthUniforms.uTime.value = time;

  // Earth & Clouds Continuous Spin
  earth.rotation.y = time * 0.05;
  clouds.rotation.y = time * 0.07;

  // Escape Orbital Mechanics Revolution
  const orbAngle = time * 0.65;
  const rad = 15.0 + Math.sin(orbAngle * 2.0) * 3.5;
  const x = Math.cos(orbAngle) * rad;
  const y = Math.sin(orbAngle) * 2.5;
  const z = Math.sin(orbAngle) * rad;

  rocket.position.set(x, y, z);

  // Velocity Vector Prograde Steering
  const vx = -Math.sin(orbAngle) * rad;
  const vy = Math.cos(orbAngle) * 2.5;
  const vz = Math.cos(orbAngle) * rad;
  const velDir = new THREE.Vector3(vx, vy, vz).normalize();
  rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), velDir);

  // Supersonic Rocket Plume Shock Waves
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
  initialCategory = "physics",
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

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const simTimeRef = useRef<number>(0);
  const updateHooksRef = useRef<((time: number, delta: number) => void)[]>([]);

  // Orbit controls
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

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

    // Scene & Deep Cosmic Space
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#02040A");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 14, 34);
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
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    // Safe DOM Attachment
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 💡 Cosmic Sun Lighting
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.5);
    sunLight.position.set(40, 20, 30);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0F172A, 0.6);
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
      const newDist = Math.max(8, Math.min(150, dist + e.deltaY * 0.04));
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
    executeCode(code);

    // 2. Main 60 FPS Render Loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = (now - lastTime) * 0.001;
      lastTime = now;

      if (isPlaying) {
        simTimeRef.current += delta;
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

  // 3. Dynamic Code Execution
  const executeCode = (sourceCode: string) => {
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
      aerodynamics: {
        calculateLift: (rho: number, velocity: number, wingArea: number, Cl: number) => 0.5 * rho * velocity * velocity * wingArea * Cl,
        calculateDrag: (rho: number, velocity: number, wingArea: number, Cd: number) => 0.5 * rho * velocity * velocity * wingArea * Cd,
      },
      molecular: {
        lennardJonesForce: (r: number, epsilon = 1.0, sigma = 1.0) => 24 * epsilon * (2 * Math.pow(sigma / r, 13) - Math.pow(sigma / r, 7)),
      },
      loadGLTF: (url: string, onLoad: (gltf: any) => void) => {
        const loader = new GLTFLoader();
        loader.load(url, onLoad);
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

  // Compile & Run Button
  const handleRunClick = () => {
    executeCode(code);
  };

  // Capture High-Res Snapshot (PNG)
  const captureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `nasa_rocket_simulation_4k_${Date.now()}.png`;
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
          link.download = `nasa_rocket_simulation_${Date.now()}.webm`;
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
          link.download = `nasa_rocket_simulation_${Date.now()}.webm`;
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
      {/* 3D WebGL Canvas Wrapper */}
      <div style={styles.canvasWrapper}>
        <div ref={mountRef} style={styles.canvasMount} />

        {/* Minimal Floating Glass Controls in Corner */}
        <div style={styles.floatingControls}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={styles.glassBtn}
            title={isPlaying ? "Pause Simulation" : "Play Simulation"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={captureSnapshot}
            style={styles.glassBtn}
            title="Capture 4K Snapshot"
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
            title="Toggle Live Code Editor"
          >
            &lt;/&gt;
          </button>
        </div>

        <div style={styles.hintOverlay}>
          🖱️ 3D Orbit: Drag • Zoom: Scroll • Procedural NASA Earth Shaders
        </div>
      </div>

      {/* Error alert if any */}
      {runtimeError && (
        <div style={styles.errorAlert}>⚠️ {runtimeError}</div>
      )}

      {/* Optional Collapsible Code Editor */}
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
