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

// Default simulation script: Interstellar Gargantua Accretion Disk (GLSL)
const DEFAULT_SIM_CODE = `// ============================================================================
// 🌌 INTERSTELLAR: GARGANTUA RAY-WARPED ACCRETION DISK (GLSL SHADER)
// ============================================================================

// 1. 🕳️ Central Event Horizon (Obsidian Void r = 3.4)
const horizonGeom = new THREE.SphereGeometry(3.4, 64, 64);
const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const eventHorizon = new THREE.Mesh(horizonGeom, horizonMat);
scene.add(eventHorizon);

// 2. ✨ Blinding Photon Sphere (r = 1.5 r_s)
const photonGeom = new THREE.TorusGeometry(3.65, 0.12, 32, 128);
const photonMat = new THREE.MeshBasicMaterial({ color: 0xFFFDF0 });
const photonRing = new THREE.Mesh(photonGeom, photonMat);
photonRing.rotation.x = Math.PI / 2;
scene.add(photonRing);

// 3. 🔥 Volumetric Procedural Accretion Disk Shader
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

    // Relativistic Doppler Beaming
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
accretionDisk.rotation.x = -Math.PI / 2.3;
scene.add(accretionDisk);

// 4. 🌀 Gravitational Lensing Light-Bending Arches
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

// 5. 🌊 Miller's Planet
const millerDist = 8.5;
const millerPlanet = new THREE.Mesh(
  new THREE.SphereGeometry(0.65, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.2, metalness: 0.3 })
);
scene.add(millerPlanet);

// 6. 60 FPS Orbit
engine.onUpdate((time, delta) => {
  diskUniforms.time.value = time;
  const angle = time * 1.2;
  const x = Math.cos(angle) * millerDist;
  const z = Math.sin(angle) * millerDist;
  millerPlanet.position.set(x, z * Math.sin(accretionDisk.rotation.x), z * Math.cos(accretionDisk.rotation.x));
});`;

function createPBRMaterials() {
  return {
    polishedChrome: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, metalness: 0.92, roughness: 0.12 }),
    brushedSteel: new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.85, roughness: 0.22 }),
    forgedGoldBrass: new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.88, roughness: 0.18 }),
    anodizedBlue: new THREE.MeshStandardMaterial({ color: 0x3B82F6, metalness: 0.85, roughness: 0.2 }),
    anodizedRed: new THREE.MeshStandardMaterial({ color: 0xEF4444, metalness: 0.85, roughness: 0.2 }),
    castIron: new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.65, roughness: 0.35 }),
    porcelainCeramic: new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.1, metalness: 0.05 }),
    crystalGlass: new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, transmission: 0.85, opacity: 0.9, transparent: true, roughness: 0.08, ior: 1.5, metalness: 0.1 }),
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
  const [code, setCode] = useState<string>(initialCode?.trim() || DEFAULT_SIM_CODE);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false); // Closed by default for clean blog view!
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

  // 1. Initialize Clean Studio WebGL Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = Math.min(Math.max(width * 0.58, 380), 550);

    // Scene & Dark Tech Slate Studio Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0B0F19");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 6, 28);
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
    renderer.toneMappingExposure = 1.6;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    // Safe DOM Attachment
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xF8FAFC, 0x334155, 1.4);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.2);
    keyLight.position.set(25, 40, 25);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93C5FD, 1.4);
    fillLight.position.set(-25, 20, 20);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xFDE68A, 1.6);
    rimLight.position.set(0, -10, -30);
    scene.add(rimLight);

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
    };

    try {
      const scriptKernel = new Function("scene", "camera", "renderer", "THREE", "engine", "pbr", "time", sourceCode);
      scriptKernel(scene, camera, renderer, THREE, engineAPI, pbr, simTimeRef.current);
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
          🖱️ 3D Orbit: Drag • Zoom: Scroll
        </div>
      </div>

      {/* Error alert if any */}
      {runtimeError && (
        <div style={styles.errorAlert}>⚠️ {runtimeError}</div>
      )}

      {/* Optional Collapsible Code Editor (Only opens if user clicks </> button) */}
      {showCodeEditor && (
        <div style={styles.codeDrawer}>
          <div style={styles.codeHeader}>
            <span style={{ color: "#D1A751", fontWeight: 700, fontSize: "0.75rem" }}>
              💻 Live Code Sandbox
            </span>
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
    backgroundColor: "#0B0F19",
    borderRadius: "12px",
    border: "1px solid #1E293B",
    overflow: "hidden",
    margin: "2rem 0",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.5)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  canvasWrapper: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    minHeight: "440px",
    backgroundColor: "#0B0F19",
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
    background: "rgba(15, 23, 42, 0.75)",
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
    height: "220px",
    backgroundColor: "#0B0F19",
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
