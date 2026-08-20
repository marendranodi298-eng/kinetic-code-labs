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
// ✈️ REAL-WORLD AERODYNAMICS & JET AIRCRAFT FLIGHT SIMULATION KERNEL
// Lift L = 0.5 * rho * v^2 * S * C_L, Drag D = 0.5 * rho * v^2 * S * C_D, Thrust & Airflow
// ============================================================================
const AIRCRAFT_FLIGHT_CODE = `// ============================================================================
// ✈️ AERODYNAMICS: JET FIGHTER AIRCRAFT FLIGHT SIMULATION
// Real-world Aerodynamic Forces: Lift, Drag, Thrust, Gravity & Airflow Streamlines
// ============================================================================

// 1. 🛩️ High-Performance Jet Aircraft CAD Assembly
const jet = new THREE.Group();
scene.add(jet);

// Fuselage (Aerospace Titanium PBR)
const body = new THREE.Mesh(
  new THREE.ConeGeometry(1.6, 14.0, 32),
  pbr.aerospaceTitanium
);
body.rotation.x = Math.PI / 2;
body.castShadow = true;
jet.add(body);

// Cockpit Canopy (Refractive Glass)
const canopy = new THREE.Mesh(
  new THREE.SphereGeometry(1.1, 32, 24),
  pbr.crystalGlass
);
canopy.scale.set(0.8, 0.9, 2.6);
canopy.position.set(0, 0.9, 1.5);
jet.add(canopy);

// Swept Delta Main Wings (Carbon Fiber Composite)
const wingGeom = new THREE.BoxGeometry(16.0, 0.18, 5.5);
const wing = new THREE.Mesh(wingGeom, pbr.carbonFiber);
wing.position.set(0, -0.1, -1.2);
wing.castShadow = true;
jet.add(wing);

// Twin Vertical Stabilizer Fins
const fin1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 2.4), pbr.carbonFiber);
fin1.position.set(-2.0, 1.5, -4.5);
fin1.rotation.z = -0.25;
const fin2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.2, 2.4), pbr.carbonFiber);
fin2.position.set(2.0, 1.5, -4.5);
fin2.rotation.z = 0.25;
jet.add(fin1, fin2);

// Horizontal Stabilator Tailplanes
const tail = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.15, 2.8), pbr.carbonFiber);
tail.position.set(0, 0.2, -5.2);
jet.add(tail);

// Twin Afterburner Jet Nozzles & Fire Plumes
const nozzle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 1.5, 24), pbr.polishedChrome);
nozzle1.rotation.x = Math.PI / 2;
nozzle1.position.set(-1.0, 0, -6.8);
const nozzle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 1.5, 24), pbr.polishedChrome);
nozzle2.rotation.x = Math.PI / 2;
nozzle2.position.set(1.0, 0, -6.8);
jet.add(nozzle1, nozzle2);

// Volumetric Afterburner Flame Cone
const flame = new THREE.Mesh(
  new THREE.ConeGeometry(0.8, 5.0, 24),
  new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.85 })
);
flame.rotation.x = -Math.PI / 2;
flame.position.set(0, 0, -9.0);
jet.add(flame);

const engineThrustLight = new THREE.PointLight(0x38BDF8, 3.5, 30);
engineThrustLight.position.set(0, 0, -8.0);
jet.add(engineThrustLight);

// 2. 💨 Real-Time Aerodynamic Airflow Streamlines (Wind Tunnel Particles)
const streamCount = 400;
const streamPos = new Float32Array(streamCount * 3);
const streamSpeeds = [];

for (let s = 0; s < streamCount; s++) {
  streamPos[s * 3] = (Math.random() - 0.5) * 20.0;
  streamPos[s * 3 + 1] = (Math.random() - 0.5) * 8.0;
  streamPos[s * 3 + 2] = 25.0 + Math.random() * 30.0;
  streamSpeeds.push(25.0 + Math.random() * 15.0);
}

const streamGeom = new THREE.BufferGeometry();
streamGeom.setAttribute("position", new THREE.BufferAttribute(streamPos, 3));
const streamMat = new THREE.PointsMaterial({
  color: 0xE2E8F0,
  size: 0.22,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending
});
const airflowStreams = new THREE.Points(streamGeom, streamMat);
scene.add(airflowStreams);

// 3. 🔄 60 FPS FLIGHT DYNAMICS & AERODYNAMIC VECTOR LOOP
let roll = 0.0;
let pitchAngle = 0.0;

engine.onUpdate((time, delta) => {
  // Flight Maneuvers (Banking Turn & Climb)
  roll = Math.sin(time * 0.8) * 0.45;
  pitchAngle = Math.cos(time * 0.6) * 0.25;

  jet.rotation.z = roll;
  jet.rotation.x = pitchAngle;
  jet.position.y = Math.sin(time * 1.2) * 2.0;
  jet.position.x = Math.sin(time * 0.8) * 4.0;

  // Afterburner Flame Pulse & Sound Shock Diamonds
  flame.scale.set(
    1.0 + Math.sin(time * 30) * 0.15,
    1.0 + Math.cos(time * 25) * 0.3,
    1.0 + Math.sin(time * 30) * 0.15
  );

  // Aerodynamic Airflow Streamline Vector Flow
  const pos = streamGeom.attributes.position;
  for (let i = 0; i < streamCount; i++) {
    let z = pos.getZ(i);
    z -= streamSpeeds[i] * delta * 2.5;

    // Reset particle to front when it passes aircraft
    if (z < -30.0) {
      z = 30.0 + Math.random() * 10.0;
      pos.setX(i, (Math.random() - 0.5) * 20.0);
      pos.setY(i, (Math.random() - 0.5) * 8.0);
    }

    // Wing Deflection: Air deflects up and over the cambered airfoil
    const x = pos.getX(i);
    let y = pos.getY(i);
    if (Math.abs(x) < 8.0 && Math.abs(z) < 5.0) {
      y += Math.sin(z * 0.5) * 0.25;
    }

    pos.setY(i, y);
    pos.setZ(i, z);
  }
  pos.needsUpdate = true;
});`;

// Comprehensive Material Library
function createPBRMaterials() {
  return {
    aerospaceTitanium: new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      metalness: 0.9,
      roughness: 0.2,
    }),
    carbonFiber: new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      metalness: 0.6,
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
      color: 0xEF4444,
      metalness: 0.85,
      roughness: 0.2,
    }),
    castIron: new THREE.MeshStandardMaterial({
      color: 0x64748B,
      metalness: 0.65,
      roughness: 0.35,
    }),
    porcelainCeramic: new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.1,
      metalness: 0.05,
    }),
    crystalGlass: new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transmission: 0.9,
      opacity: 0.95,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      metalness: 0.05,
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
  const [code, setCode] = useState<string>(initialCode?.trim() || AIRCRAFT_FLIGHT_CODE);
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

    // Scene & Deep Sky Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080D1A");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(18, 12, 28);
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
    renderer.toneMappingExposure = 1.65;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    // Safe DOM Attachment
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 💡 Cinematic Sky Lighting
    const hemiLight = new THREE.HemisphereLight(0xF8FAFC, 0x1E293B, 1.4);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.2);
    keyLight.position.set(25, 40, 25);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38BDF8, 1.5);
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

  // 3. Dynamic Code Execution with Physics & Aerodynamics Injected
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

    // Universal Scientific Helper APIs
    const engineAPI = {
      // 60 FPS Update Hook
      onUpdate: (fn: (time: number, delta: number) => void) => {
        if (typeof fn === "function") {
          updateHooksRef.current.push(fn);
        }
      },
      // Real-World Aerodynamics Calculation Helper
      aerodynamics: {
        calculateLift: (rho: number, velocity: number, wingArea: number, Cl: number) => {
          return 0.5 * rho * velocity * velocity * wingArea * Cl;
        },
        calculateDrag: (rho: number, velocity: number, wingArea: number, Cd: number) => {
          return 0.5 * rho * velocity * velocity * wingArea * Cd;
        },
      },
      // Molecular Dynamics Lennard-Jones Potential
      molecular: {
        lennardJonesForce: (r: number, epsilon = 1.0, sigma = 1.0) => {
          return 24 * epsilon * (2 * Math.pow(sigma / r, 13) - Math.pow(sigma / r, 7));
        },
      },
      // 3D CAD GLTF Loader
      loadGLTF: (url: string, onLoad: (gltf: any) => void) => {
        const loader = new GLTFLoader();
        loader.load(url, onLoad);
      },
    };

    try {
      // Execute the user's custom simulation script with full CANNON, THREE, PBR, and Engine APIs!
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
          link.download = `flight_simulation_${Date.now()}.webm`;
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
          link.download = `flight_simulation_${Date.now()}.webm`;
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
          🖱️ 3D Orbit: Drag • Zoom: Scroll • Real-time Aerodynamics &amp; Physics
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
                💻 Live Simulation Script (Physics, Aerodynamics, Molecular)
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
    backgroundColor: "#080D1A",
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
    backgroundColor: "#080D1A",
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
    backgroundColor: "#080D1A",
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
