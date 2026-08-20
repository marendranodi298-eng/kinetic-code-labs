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
// 🧬 HARVARD BIOVISIONS / PDB HIGH-FIDELITY DNA TRANSCRIPTION & MRNA SYNTHESIS
// Continuous extruded ribbon backbone, Crab-Claw RNA Polymerase II enzyme,
// incoming NTP substrate diffusion, and unzipping transcription bubble!
// ============================================================================
const BIO_TRANSCRIPTION_CODE = `// ============================================================================
// 🧬 MOLECULAR BIOLOGY: RNA POLYMERASE II & DNA TRANSCRIPTION
// Continuous PDB Ribbon Backbone, Catalytic Crab-Claw Cleft & mRNA Synthesis
// ============================================================================

const numBases = 80;
const helixRadius = 3.2;
const pitch = 0.8;
const twist = 0.35; // 36° per base pair (10 bp per helical turn)

// 1. 🧬 Continuous Extruded B-DNA Double Helix Ribbons (No Disconnected Balls!)
const dnaGroup = new THREE.Group();
scene.add(dnaGroup);

// Generate Base Points for Spline Extrusion
const pts1 = [];
const pts2 = [];
const basePairs = [];

for (let i = 0; i < numBases; i++) {
  const z = (i - numBases / 2) * pitch;
  const angle = i * twist;

  const x1 = Math.cos(angle) * helixRadius;
  const y1 = Math.sin(angle) * helixRadius;
  const x2 = Math.cos(angle + Math.PI) * helixRadius;
  const y2 = Math.sin(angle + Math.PI) * helixRadius;

  pts1.push(new THREE.Vector3(x1, y1, z));
  pts2.push(new THREE.Vector3(x2, y2, z));

  // Nucleotide Base Plate Geometry (A-T / G-C Watson-Crick Pair)
  const plateGeom = new THREE.BoxGeometry(helixRadius * 1.8, 0.28, 0.45);
  const plateMat = new THREE.MeshStandardMaterial({
    color: i % 2 === 0 ? 0x10B981 : 0xF59E0B, // Emerald (G-C) & Amber (A-T)
    roughness: 0.3,
    metalness: 0.4
  });
  const plate = new THREE.Mesh(plateGeom, plateMat);
  plate.position.set(0, 0, z);
  plate.rotation.z = angle;
  dnaGroup.add(plate);
  basePairs.push({ mesh: plate, z, origAngle: angle });
}

// Extrude Continuous Smooth Sugar-Phosphate Backbone Tubes
const curve1 = new THREE.CatmullRomCurve3(pts1);
const curve2 = new THREE.CatmullRomCurve3(pts2);

const tubeGeom1 = new THREE.TubeGeometry(curve1, 200, 0.38, 16, false);
const tubeGeom2 = new THREE.TubeGeometry(curve2, 200, 0.38, 16, false);

const tubeMat1 = new THREE.MeshStandardMaterial({
  color: 0x0284C7, // Template Strand (Sapphire Blue)
  metalness: 0.7,
  roughness: 0.2
});

const tubeMat2 = new THREE.MeshStandardMaterial({
  color: 0xE11D48, // Non-Template Strand (Crimson Ruby)
  metalness: 0.7,
  roughness: 0.2
});

const strand1Mesh = new THREE.Mesh(tubeGeom1, tubeMat1);
const strand2Mesh = new THREE.Mesh(tubeGeom2, tubeMat2);
dnaGroup.add(strand1Mesh, strand2Mesh);

// 2. 🦀 Anatomical RNA Polymerase II Enzyme Complex ("Crab-Claw" Catalytic Cleft)
const polII = new THREE.Group();
scene.add(polII);

// Main Core Catalytic Lobe (Golden Amber PBR)
const coreLobe = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xD97706,
    roughness: 0.35,
    metalness: 0.3
  })
);
coreLobe.scale.set(1.4, 1.1, 1.5);
coreLobe.castShadow = true;
polII.add(coreLobe);

// Upper Jaw / Clamp Subunit (Cobalt Blue)
const upperJaw = new THREE.Mesh(
  new THREE.SphereGeometry(2.0, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.3, metalness: 0.4 })
);
upperJaw.position.set(1.8, 1.8, 0.5);
upperJaw.scale.set(1.2, 0.8, 1.2);
polII.add(upperJaw);

// Lower Jaw Subunit (Emerald Teal)
const lowerJaw = new THREE.Mesh(
  new THREE.SphereGeometry(1.9, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x0D9488, roughness: 0.3, metalness: 0.4 })
);
lowerJaw.position.set(-1.8, -1.6, -0.5);
lowerJaw.scale.set(1.2, 0.8, 1.2);
polII.add(lowerJaw);

// Active Site Catalytic Magnesium Ion (Glowing Incandescent Light)
const activeSiteIon = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xFFFBEB })
);
activeSiteIon.position.set(0, 0, 0);
polII.add(activeSiteIon);

const catalyticGlow = new THREE.PointLight(0xF59E0B, 3.0, 16);
polII.add(catalyticGlow);

// 3. 🧵 Newly Synthesized Continuous mRNA Transcript Ribbon
const mrnaPts = [];
for (let j = 0; j < 30; j++) {
  mrnaPts.push(new THREE.Vector3(3.5 + j * 0.4, 2.0 + Math.sin(j * 0.4) * 1.5, -j * 0.6));
}
const mrnaCurve = new THREE.CatmullRomCurve3(mrnaPts);
const mrnaGeom = new THREE.TubeGeometry(mrnaCurve, 60, 0.3, 12, false);
const mrnaMat = new THREE.MeshStandardMaterial({
  color: 0xFBBF24, // Bright Gold mRNA Ribbon
  emissive: 0xB45309,
  emissiveIntensity: 0.7,
  roughness: 0.2
});
const mrnaRibbon = new THREE.Mesh(mrnaGeom, mrnaMat);
scene.add(mrnaRibbon);

// 4. ✨ Incoming Free Nucleotide Triphosphates (NTPs: ATP, UTP, GTP, CTP)
const ntpCount = 18;
const ntpGroup = new THREE.Group();
scene.add(ntpGroup);
const ntps = [];

for (let n = 0; n < ntpCount; n++) {
  const ntp = new THREE.Mesh(
    new THREE.SphereGeometry(0.38, 16, 16),
    new THREE.MeshStandardMaterial({
      color: [0x8B5CF6, 0x10B981, 0x3B82F6, 0xEC4899][n % 4],
      roughness: 0.2,
      metalness: 0.5
    })
  );
  ntpGroup.add(ntp);
  ntps.push({
    mesh: ntp,
    basePos: new THREE.Vector3(
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 16,
      (Math.random() - 0.5) * 20
    ),
    speed: 0.8 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2
  });
}

// 5. 🔄 60 FPS MOLECULAR TRANSLOCATION & TRANSCRIPTION LOOP
engine.onUpdate((time, delta) => {
  // RNA Polymerase II translocates along DNA
  const enzymeZ = ((time * 4.2) % (numBases * pitch * 0.75)) - (numBases * pitch * 0.38);
  polII.position.set(0, 0, enzymeZ);
  polII.rotation.z = time * 0.4;

  // Unwind DNA Base Pairs in the Active Transcription Bubble
  for (let b = 0; b < numBases; b++) {
    const dist = Math.abs(basePairs[b].z - enzymeZ);
    if (dist < 4.8) {
      // Unzipped Transcription Bubble: Base plates separate
      const unbind = (4.8 - dist) * 0.7;
      basePairs[b].mesh.scale.set(Math.max(0.01, 1.0 - unbind), 1.0, 1.0);
      basePairs[b].mesh.position.x = Math.sin(time * 6 + b) * 0.2;
    } else {
      // Re-annealed Double Helix
      basePairs[b].mesh.scale.set(1.0, 1.0, 1.0);
      basePairs[b].mesh.position.x = 0;
    }
  }

  // Undulate mRNA Ribbon emerging from RNA Exit Channel
  mrnaRibbon.position.set(0, 0, enzymeZ);
  mrnaRibbon.rotation.z = Math.sin(time * 2.0) * 0.15;

  // Diffuse Free NTP Nucleotides into the Catalytic Funnel
  ntps.forEach((ntp, idx) => {
    const t = time * ntp.speed + ntp.phase;
    ntp.mesh.position.set(
      ntp.basePos.x + Math.sin(t) * 2.0,
      ntp.basePos.y + Math.cos(t * 1.2) * 2.0,
      enzymeZ + ((idx * 1.5) % 10.0) - 5.0
    );
  });
});`;

export default function ScienceSimEngine({
  initialCategory,
  initialPreset,
  initialCode,
  autoPlay = true,
}: ScienceSimEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [code, setCode] = useState<string>(initialCode?.trim() || BIO_TRANSCRIPTION_CODE);
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

  // 1. Initialize Clean Studio WebGL Viewport
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = Math.min(Math.max(width * 0.58, 380), 550);

    // Scene & Deep Cellular Dark Slate Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080D1A");
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 32);
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

    // Studio Lighting for Biological Shaders
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

    const pbr = {
      polishedChrome: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, metalness: 0.92, roughness: 0.12 }),
      forgedGoldBrass: new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.88, roughness: 0.18 }),
      anodizedBlue: new THREE.MeshStandardMaterial({ color: 0x3B82F6, metalness: 0.85, roughness: 0.2 }),
      anodizedRed: new THREE.MeshStandardMaterial({ color: 0xEF4444, metalness: 0.85, roughness: 0.2 }),
    };

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
    link.download = `dna_transcription_4k_${Date.now()}.png`;
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
          link.download = `dna_transcription_video_${Date.now()}.webm`;
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
          link.download = `dna_transcription_video_${Date.now()}.webm`;
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

        {/* Biological Callout HUD */}
        <div style={styles.bioHUD}>
          <div style={styles.bioTitle}>🧬 MOLECULAR TRANSCRIPTION ENGINE</div>
          <div style={styles.bioRow}><span style={{ color: "#0284C7" }}>●</span> Template Strand (3&apos; → 5&apos;)</div>
          <div style={styles.bioRow}><span style={{ color: "#E11D48" }}>●</span> Coding Strand (5&apos; → 3&apos;)</div>
          <div style={styles.bioRow}><span style={{ color: "#D97706" }}>●</span> RNA Polymerase II (Crab-Claw)</div>
          <div style={styles.bioRow}><span style={{ color: "#FBBF24" }}>●</span> Growing mRNA Transcript</div>
          <div style={styles.bioRow}><span style={{ color: "#8B5CF6" }}>●</span> Incoming Free NTP Substrates</div>
        </div>

        <div style={styles.hintOverlay}>
          🖱️ 3D Orbit: Drag • Zoom: Scroll • Real-time PDB Ribbon
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
  bioHUD: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "rgba(8, 13, 26, 0.85)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    color: "#F8FAFC",
    padding: "0.5rem 0.8rem",
    borderRadius: "8px",
    pointerEvents: "none",
    boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
    fontSize: "0.68rem",
  },
  bioTitle: {
    fontWeight: 800,
    color: "#38BDF8",
    letterSpacing: "0.05em",
    marginBottom: "0.3rem",
    fontSize: "0.65rem",
    borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
    paddingBottom: "0.2rem",
  },
  bioRow: {
    margin: "0.15rem 0",
    color: "#CBD5E1",
    fontWeight: 600,
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
