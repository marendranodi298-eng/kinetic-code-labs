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

// Universal Default Template when starting from scratch
const DEFAULT_UNIVERSAL_CODE = `// ==========================================================
// 🚀 UNIVERSAL 3D SCIENTIFIC SIMULATION ENGINE
// You can write ANY 3D Physics, Chemistry, Biology, Math, or
// Mechanical Engineering simulation code below.
//
// Provided Objects:
// - scene     : THREE.Scene (Add meshes, lights, particles)
// - camera    : THREE.PerspectiveCamera
// - renderer  : THREE.WebGLRenderer (GPU Hardware Accelerated)
// - THREE     : Full Three.js 3D & Math Library
// - engine    : { onUpdate(fn), plotSurface(fn), createParticles(n) }
// ==========================================================

// Example: Quantum Electromagnetic Particle Orbit & Glow Ring
const core = new THREE.Mesh(
  new THREE.SphereGeometry(2.0, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xD1A751, emissive: 0xB45309, emissiveIntensity: 0.8, metalness: 0.4 })
);
scene.add(core);

// Surrounding Particle Vortex
const particleCount = 1000;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const rad = 4.0 + Math.random() * 8.0;
  positions[i * 3] = Math.cos(angle) * rad;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 3.0;
  positions[i * 3 + 2] = Math.sin(angle) * rad;
}
const pGeom = new THREE.BufferGeometry();
pGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const pMat = new THREE.PointsMaterial({ color: 0x38BDF8, size: 0.15, transparent: true, opacity: 0.85 });
const particles = new THREE.Points(pGeom, pMat);
scene.add(particles);

// 60 FPS Physics & Kinematics Animation Loop
engine.onUpdate((time, delta) => {
  core.rotation.y = time * 0.5;
  particles.rotation.y = time * 0.8;
  particles.rotation.x = Math.sin(time * 0.4) * 0.2;
});`;

export default function ScienceSimEngine({
  initialCategory = "custom",
  initialPreset,
  initialCode,
  autoPlay = true,
}: ScienceSimEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [code, setCode] = useState<string>(initialCode?.trim() || DEFAULT_UNIVERSAL_CODE);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Universal Engine Active (60 FPS)");

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const simTimeRef = useRef<number>(0);
  const updateHooksRef = useRef<((time: number, delta: number) => void)[]>([]);

  // Mouse Orbit controls
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Update code if initialCode changes
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      setCode(initialCode.trim());
    }
  }, [initialCode]);

  // 1. Initialize WebGL Viewport
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = Math.min(Math.max(width * 0.55, 380), 550);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080B12");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 14, 24);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer with Hardware Acceleration
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Default Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xD1A751, 2.0, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

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

      theta -= deltaX * 0.008;
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi - deltaY * 0.008));

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
      const newDist = Math.max(4, Math.min(120, dist + e.deltaY * 0.05));
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
      const h = Math.min(Math.max(w * 0.55, 380), 550);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Initial Dynamic Compilation of user's code
    compileAndExecuteSimulation(code);

    // 2. Main 60 FPS Compute Loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = (now - lastTime) * 0.001 * simSpeed;
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
      domEl.removeEventListener("wheel", onWheel);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  // 3. Dynamic Universal Code Compiler & Execution Engine
  const compileAndExecuteSimulation = (sourceCode: string) => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    // Reset Scene Objects (preserve baseline lighting)
    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Light) && obj !== scene) {
        objectsToRemove.push(obj);
      }
    });
    objectsToRemove.forEach((obj) => {
      scene.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose());
        } else {
          (obj as any).material.dispose();
        }
      }
    });

    updateHooksRef.current = [];
    setErrorMessage(null);

    // Universal Helper API exposed to user's code
    const engineAPI = {
      // Register an animation update callback (runs at 60 FPS)
      onUpdate: (fn: (time: number, delta: number) => void) => {
        if (typeof fn === "function") {
          updateHooksRef.current.push(fn);
        }
      },
      // Quick 3D Math Function Surface Plotter
      plotSurface: (fn: (x: number, y: number, time: number) => number, options: { size?: number; segs?: number; color?: number } = {}) => {
        const size = options.size || 25;
        const segs = options.segs || 50;
        const geom = new THREE.PlaneGeometry(size, size, segs, segs);
        geom.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshStandardMaterial({
          color: options.color || 0x38BDF8,
          wireframe: true,
          roughness: 0.3,
        });
        const mesh = new THREE.Mesh(geom, mat);
        scene.add(mesh);

        engineAPI.onUpdate((time) => {
          const pos = geom.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = fn(x, z, time);
            pos.setY(i, y);
          }
          pos.needsUpdate = true;
        });
        return mesh;
      },
      // Quick Particle Cloud Generator
      createParticles: (count: number, color: number = 0x38BDF8, size: number = 0.15) => {
        const positions = new Float32Array(count * 3);
        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.85 });
        const pSystem = new THREE.Points(geom, mat);
        scene.add(pSystem);
        return { mesh: pSystem, positions, geom };
      },
    };

    try {
      // Execute the user's custom simulation script
      const executionKernel = new Function("scene", "camera", "renderer", "THREE", "engine", "time", sourceCode);
      executionKernel(scene, camera, renderer, THREE, engineAPI, simTimeRef.current);
      setStatusMessage("⚡ Custom Simulation Compiled & Running (60 FPS)");
    } catch (err: any) {
      console.error("Simulation Compilation Error:", err);
      setErrorMessage(`Compilation Error: ${err.message}`);
    }
  };

  // Run button handler
  const handleRunCode = () => {
    compileAndExecuteSimulation(code);
  };

  // High-Res Snapshot (PNG)
  const captureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `simulation_snapshot_${Date.now()}.png`;
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

  // Quick Preset Inserters for User Convenience
  const insertQuickTemplate = (type: string) => {
    let template = "";
    if (type === "orbital") {
      template = `// 🌌 Custom Planetary Orbit System
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xFDB813, emissive: 0xF59E0B, emissiveIntensity: 0.9 })
);
scene.add(sun);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.8, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x3B82F6, metalness: 0.4 })
);
scene.add(earth);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xE2E8F0 })
);
scene.add(moon);

engine.onUpdate((time) => {
  sun.rotation.y = time * 0.2;
  const earthX = Math.cos(time * 1.2) * 10;
  const earthZ = Math.sin(time * 1.2) * 10;
  earth.position.set(earthX, 0, earthZ);
  earth.rotation.y = time * 3.0;

  moon.position.set(earthX + Math.cos(time * 4) * 2, 0, earthZ + Math.sin(time * 4) * 2);
});`;
    } else if (type === "wave") {
      template = `// 📊 3D Differential Wave Surface
engine.plotSurface((x, y, time) => {
  const r = Math.sqrt(x * x + y * y);
  return Math.sin(r * 0.6 - time * 3.0) * (3.0 / (1.0 + r * 0.1));
}, { size: 30, segs: 60, color: 0x38BDF8 });`;
    } else if (type === "molecule") {
      template = `// 🧪 3D Methane (CH4) Molecule
const carbon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2 }));
scene.add(carbon);

const hCoords = [[1.5, 1.5, 1.5], [-1.5, -1.5, 1.5], [-1.5, 1.5, -1.5], [1.5, -1.5, -1.5]];
hCoords.forEach(([hx, hy, hz]) => {
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), new THREE.MeshStandardMaterial({ color: 0xF8FAFC }));
  h.position.set(hx, hy, hz);
  scene.add(h);
});

engine.onUpdate((time) => {
  scene.rotation.y = time * 0.5;
  scene.rotation.x = Math.sin(time * 0.3) * 0.2;
});`;
    } else if (type === "dna") {
      template = `// 🧬 3D DNA Double Helix Generator
const numPairs = 30;
for (let i = 0; i < numPairs; i++) {
  const y = (i - numPairs / 2) * 0.8;
  const angle = i * 0.35;
  
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0x8B5CF6 }));
  s1.position.set(Math.cos(angle) * 4, y, Math.sin(angle) * 4);
  scene.add(s1);
  
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0xEC4899 }));
  s2.position.set(Math.cos(angle + Math.PI) * 4, y, Math.sin(angle + Math.PI) * 4);
  scene.add(s2);
}

engine.onUpdate((time) => {
  scene.rotation.y = time * 0.6;
});`;
    }
    setCode(template);
    compileAndExecuteSimulation(template);
  };

  return (
    <div style={styles.engineContainer} className="science-sim-engine card">
      {/* Top Engine Header */}
      <div style={styles.topBar}>
        <div style={styles.leftControls}>
          <div style={styles.badgeGroup}>
            <span style={styles.engineBadge}>⚡ UNIVERSAL 3D SIMULATION ENGINE</span>
            <span style={styles.hardwareBadge}>{statusMessage}</span>
          </div>

          {/* Quick Starter Templates */}
          <div style={styles.templateGroup}>
            <span style={styles.templateLabel}>LOAD TEMPLATE:</span>
            <button onClick={() => insertQuickTemplate("orbital")} style={styles.templateBtn}>🌌 Orbits</button>
            <button onClick={() => insertQuickTemplate("wave")} style={styles.templateBtn}>📊 3D Wave</button>
            <button onClick={() => insertQuickTemplate("molecule")} style={styles.templateBtn}>🧪 Molecule</button>
            <button onClick={() => insertQuickTemplate("dna")} style={styles.templateBtn}>🧬 DNA</button>
          </div>
        </div>

        {/* Top Actions */}
        <div style={styles.rightControls}>
          <button onClick={() => setIsPlaying(!isPlaying)} style={styles.actionBtn}>
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button onClick={captureSnapshot} style={styles.actionBtn} title="Capture High-Res Snapshot">
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
            title="Toggle In-Blog Code Sandbox"
          >
            💻 Code Sandbox
          </button>
        </div>
      </div>

      {/* Speed & Error Bar */}
      <div style={styles.subBar}>
        {errorMessage ? (
          <div style={styles.errorAlert}>⚠️ {errorMessage}</div>
        ) : (
          <div style={styles.infoText}>💡 Tip: Write any Three.js/Physics/Shader code in the sandbox below and click "Run Simulation".</div>
        )}

        {/* Speed Slider */}
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

      {/* WebGL 3D Simulation Canvas */}
      <div style={styles.canvasWrapper} ref={mountRef}>
        <div style={styles.hintOverlay}>
          🖱️ Click and drag to orbit in 3D • Scroll to zoom
        </div>
      </div>

      {/* In-Blog Interactive Code Sandbox */}
      {showCodeEditor && (
        <div style={styles.codeDrawer}>
          <div style={styles.codeHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#D1A751", fontWeight: 700 }}>💻 Live Simulation Code Sandbox (Any Physics / Chemistry / Bio / Math Script)</span>
            </div>
            <button
              onClick={handleRunCode}
              style={styles.runScriptBtn}
              title="Compile and execute your custom code immediately"
            >
              ▶ Run &amp; Update Simulation
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
    backgroundColor: "#080B12",
    borderRadius: "10px",
    border: "1px solid #1E293B",
    overflow: "hidden",
    margin: "2rem 0",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
  },
  topBar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.6rem 1rem",
    backgroundColor: "#0E1422",
    borderBottom: "1px solid #1E293B",
    gap: "0.6rem",
  },
  leftControls: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
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
    background: "#080B12",
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
    padding: "0.15rem 0.4rem",
    borderRadius: "3px",
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
    color: "#0E1422",
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
    backgroundColor: "#0A0E18",
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
    cursor: "grab",
    minHeight: "400px",
  },
  hintOverlay: {
    position: "absolute",
    bottom: "10px",
    left: "12px",
    background: "rgba(14, 20, 34, 0.8)",
    backdropFilter: "blur(4px)",
    color: "#94A3B8",
    fontSize: "0.68rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    pointerEvents: "none",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  codeDrawer: {
    backgroundColor: "#04070D",
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
    marginBottom: "0.4rem",
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
    height: "170px",
    backgroundColor: "#0B0F19",
    color: "#F8FAFC",
    fontFamily: "'Fira Code', monospace",
    fontSize: "0.84rem",
    border: "1px solid #1E293B",
    borderRadius: "4px",
    padding: "0.6rem",
    outline: "none",
    resize: "vertical",
    lineHeight: "1.5",
  },
};
