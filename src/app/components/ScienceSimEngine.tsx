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

// Photorealistic Material Generator Helper
function createPBRMaterials() {
  return {
    polishedChrome: new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      metalness: 0.95,
      roughness: 0.08,
    }),
    brushedSteel: new THREE.MeshStandardMaterial({
      color: 0x94A3B8,
      metalness: 0.85,
      roughness: 0.25,
    }),
    forgedGoldBrass: new THREE.MeshStandardMaterial({
      color: 0xD1A751,
      metalness: 0.9,
      roughness: 0.18,
    }),
    anodizedBlue: new THREE.MeshStandardMaterial({
      color: 0x2563EB,
      metalness: 0.85,
      roughness: 0.2,
    }),
    anodizedRed: new THREE.MeshStandardMaterial({
      color: 0xDC2626,
      metalness: 0.85,
      roughness: 0.2,
    }),
    castIron: new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      metalness: 0.7,
      roughness: 0.45,
    }),
    porcelainCeramic: new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.15,
      metalness: 0.05,
    }),
    crystalGlass: new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      ior: 1.52,
      metalness: 0.1,
    }),
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

  // States
  const [category, setCategory] = useState<SimCategory>(initialCategory);
  const [preset, setPreset] = useState<string>(initialPreset || "blackhole");
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [explodedRatio, setExplodedRatio] = useState<number>(0.0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [strokePhase, setStrokePhase] = useState<string>("");
  const [customCode, setCustomCode] = useState<string>(
    initialCode || `// [Kerr / Schwarzschild Black Hole Relativistic Physics]
// Sagittarius A* Supermassive Black Hole Simulation
const blackHoleMass = 4.3e6; // Solar masses (M_sun)
const schwarzschildRadius = 2.8; // r_s = 2GM/c^2 (Event Horizon)
const iscoRadius = 4.2; // Innermost Stable Circular Orbit
const accretionDiskRadius = 14.0;
const plasmaSpinVelocity = 0.65; // Fraction of speed of light (0.65c)
const jetEnergyGev = 1.5e12; // High-energy polar gamma jets`
  );

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const simTimeRef = useRef<number>(0);
  const updateHookRef = useRef<((time: number, delta: number) => void) | null>(null);

  // Orbit controls
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Initialize Photorealistic PBR Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = Math.min(Math.max(width * 0.58, 400), 580);

    // 1. Scene & Deep Space Void
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020306");
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 10, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Ultra-HD WebGL Renderer with ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Cinematic Space & Black Hole Lighting
    const ambientLight = new THREE.AmbientLight(0x0F172A, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFDE68A, 1.8);
    dirLight.position.set(20, 30, 20);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38BDF8, 1.2);
    rimLight.position.set(-20, -10, -25);
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
      const h = Math.min(Math.max(w * 0.58, 400), 580);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Initial Scene Build
    buildPhotorealisticScene(preset, explodedRatio);

    // 5. Main 60 FPS Render Loop
    let lastTime = performance.now();
    const animate = (now: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = (now - lastTime) * 0.001 * simSpeed;
      lastTime = now;

      if (isPlaying) {
        simTimeRef.current += delta;
        if (updateHookRef.current) {
          updateHookRef.current(simTimeRef.current, delta);
        }
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

  // Rebuild scene when preset or explodedRatio changes
  useEffect(() => {
    buildPhotorealisticScene(preset, explodedRatio);
  }, [preset, explodedRatio]);

  // Master Photorealistic Scene Builder
  const buildPhotorealisticScene = (pre: string, explode: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old objects except lights
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

    updateHookRef.current = null;
    const pbr = createPBRMaterials();

    // =================================================================
    // 🌌 1. HYPER-REALISTIC GARGANTUA BLACK HOLE (INTERSTELLAR STYLE)
    // =================================================================
    if (pre === "blackhole") {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 8, 28);
        cameraRef.current.lookAt(0, 0, 0);
      }

      const bhGroup = new THREE.Group();
      scene.add(bhGroup);

      // A. Distant Deep Space Starfield
      const starCount = 2000;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        const r = 80 + Math.random() * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);
      }
      const starGeom = new THREE.BufferGeometry();
      starGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.45, transparent: true, opacity: 0.85 });
      scene.add(new THREE.Points(starGeom, starMat));

      // B. THE EVENT HORIZON (Absolute Zero-Light Obsidian Sphere)
      const horizonRadius = 3.2;
      const horizonGeom = new THREE.SphereGeometry(horizonRadius, 64, 64);
      const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const eventHorizon = new THREE.Mesh(horizonGeom, horizonMat);
      bhGroup.add(eventHorizon);

      // C. THE PHOTON SPHERE (Relativistic Gold Plasma Glare Ring at r = 1.5 * r_s)
      const photonRingGeom = new THREE.TorusGeometry(horizonRadius * 1.05, 0.08, 32, 100);
      const photonRingMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
      const photonRing = new THREE.Mesh(photonRingGeom, photonRingMat);
      photonRing.rotation.x = Math.PI / 2;
      bhGroup.add(photonRing);

      // D. THE EQUATORIAL ACCRETION DISK (Superheated Plasma Swirl)
      const diskParticleCount = 8000;
      const diskPositions = new Float32Array(diskParticleCount * 3);
      const diskColors = new Float32Array(diskParticleCount * 3);

      for (let i = 0; i < diskParticleCount; i++) {
        const rNorm = Math.pow(Math.random(), 0.7); // High density near ISCO
        const rad = 4.0 + rNorm * 12.0;
        const angle = Math.random() * Math.PI * 2;

        diskPositions[i * 3] = Math.cos(angle) * rad;
        diskPositions[i * 3 + 1] = (Math.random() - 0.5) * (0.2 + (rad / 16.0) * 0.6); // Disk thickness
        diskPositions[i * 3 + 2] = Math.sin(angle) * rad;

        // Color Gradient: White-Hot Center -> Electric Gold -> Fiery Crimson Orange
        if (rad < 6.0) {
          // White-Hot / Light Cyan
          diskColors[i * 3] = 1.0;
          diskColors[i * 3 + 1] = 0.95;
          diskColors[i * 3 + 2] = 0.85;
        } else if (rad < 10.0) {
          // Gold / Amber
          diskColors[i * 3] = 0.95;
          diskColors[i * 3 + 1] = 0.65;
          diskColors[i * 3 + 2] = 0.15;
        } else {
          // Deep Crimson / Orange
          diskColors[i * 3] = 0.85;
          diskColors[i * 3 + 1] = 0.25;
          diskColors[i * 3 + 2] = 0.05;
        }
      }

      const diskGeom = new THREE.BufferGeometry();
      diskGeom.setAttribute("position", new THREE.BufferAttribute(diskPositions, 3));
      diskGeom.setAttribute("color", new THREE.BufferAttribute(diskColors, 3));
      const diskMat = new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const accretionDisk = new THREE.Points(diskGeom, diskMat);
      bhGroup.add(accretionDisk);

      // E. GRAVITATIONAL LENSING HALO ARCS (Bent Light Above & Below the Sphere)
      const topHaloGeom = new THREE.TorusGeometry(5.8, 0.45, 32, 100, Math.PI * 1.2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xF59E0B,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const topHalo = new THREE.Mesh(topHaloGeom, haloMat);
      topHalo.position.set(0, 0.2, 0);
      topHalo.rotation.z = Math.PI * 0.9;
      bhGroup.add(topHalo);

      const bottomHaloGeom = new THREE.TorusGeometry(5.8, 0.45, 32, 100, Math.PI * 1.2);
      const bottomHalo = new THREE.Mesh(bottomHaloGeom, haloMat);
      bottomHalo.position.set(0, -0.2, 0);
      bottomHalo.rotation.z = -Math.PI * 0.1;
      bhGroup.add(bottomHalo);

      // F. RELATIVISTIC ASTROPHYSICAL POLAR PLASMA JETS (Gamma-Ray Jets)
      const jetCount = 2000;
      const jetPositions = new Float32Array(jetCount * 3);
      for (let i = 0; i < jetCount; i++) {
        const sign = i % 2 === 0 ? 1 : -1;
        const height = (3.2 + Math.random() * 20.0) * sign;
        const spread = (Math.abs(height) / 20.0) * 1.5;
        const angle = Math.random() * Math.PI * 2;
        jetPositions[i * 3] = Math.cos(angle) * Math.random() * spread;
        jetPositions[i * 3 + 1] = height;
        jetPositions[i * 3 + 2] = Math.sin(angle) * Math.random() * spread;
      }
      const jetGeom = new THREE.BufferGeometry();
      jetGeom.setAttribute("position", new THREE.BufferAttribute(jetPositions, 3));
      const jetMat = new THREE.PointsMaterial({
        color: 0x38BDF8,
        size: 0.16,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const polarJets = new THREE.Points(jetGeom, jetMat);
      bhGroup.add(polarJets);

      // Central Accretion Glow Light
      const coreLight = new THREE.PointLight(0xF59E0B, 3.5, 40);
      coreLight.position.set(0, 0, 0);
      bhGroup.add(coreLight);

      // Black Hole Animation Loop (Relativistic Differential Rotation)
      updateHookRef.current = (time) => {
        accretionDisk.rotation.y = time * 0.8;
        topHalo.rotation.y = time * 0.1;
        bottomHalo.rotation.y = time * 0.1;
        polarJets.rotation.y = -time * 1.2;

        // Pulse core gravitational energy
        coreLight.intensity = 3.0 + Math.sin(time * 4) * 0.6;
      };
    }

    // =================================================================
    // ⚙️ 2. 4-STROKE ENGINE (EXPLODED CAD VIEW)
    // =================================================================
    else if (pre === "engine") {
      if (cameraRef.current) {
        cameraRef.current.position.set(16, 12, 24);
        cameraRef.current.lookAt(0, 0, 0);
      }

      const engineGroup = new THREE.Group();
      scene.add(engineGroup);

      const r = 2.4;
      const l = 6.2;
      const explodeOffset = explode * 7.5;

      const sparkGroup = new THREE.Group();
      const sparkPorcelain = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 32), pbr.porcelainCeramic);
      const sparkHexNut = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.5, 6), pbr.polishedChrome);
      const sparkElectrode = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16), pbr.forgedGoldBrass);
      sparkElectrode.position.y = -1.2;
      sparkGroup.add(sparkPorcelain, sparkHexNut, sparkElectrode);
      sparkGroup.position.set(0, 8.8 + explodeOffset * 1.5, 0);
      engineGroup.add(sparkGroup);

      const sparkLight = new THREE.PointLight(0xFF4500, 0, 18);
      sparkLight.position.set(0, 6.2, 0);
      engineGroup.add(sparkLight);

      const headBlock = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.4, 6.8), pbr.castIron);
      headBlock.position.set(0, 6.8 + explodeOffset * 1.2, 0);
      engineGroup.add(headBlock);

      const intakeValve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.85, 3.5, 16), pbr.anodizedBlue);
      intakeValve.position.set(-1.9 - explodeOffset * 0.8, 5.2 + explodeOffset, 0);
      engineGroup.add(intakeValve);

      const exhaustValve = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.85, 3.5, 16), pbr.anodizedRed);
      exhaustValve.position.set(1.9 + explodeOffset * 0.8, 5.2 + explodeOffset, 0);
      engineGroup.add(exhaustValve);

      const cylinderSleeve = new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 7.2, 48, 1, true), pbr.crystalGlass);
      cylinderSleeve.position.y = 1.6;
      engineGroup.add(cylinderSleeve);

      const flameMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.0, 32), new THREE.MeshBasicMaterial({ color: 0xFF3300, transparent: true, opacity: 0.0 }));
      flameMesh.position.y = 4.4;
      engineGroup.add(flameMesh);

      const pistonCrown = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.38, 2.2, 48), pbr.brushedSteel);
      engineGroup.add(pistonCrown);

      const conRod = new THREE.Mesh(new THREE.BoxGeometry(0.55, l, 0.38), pbr.forgedGoldBrass);
      engineGroup.add(conRod);

      const crankGroup = new THREE.Group();
      const journal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 32), pbr.polishedChrome);
      journal.rotation.x = Math.PI / 2;
      const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.7, 48), pbr.castIron);
      flywheel.rotation.x = Math.PI / 2;
      flywheel.position.z = -2.8;
      crankGroup.add(journal, flywheel);
      crankGroup.position.set(0, -5.2 - explodeOffset, 0);
      engineGroup.add(crankGroup);

      const oilPan = new THREE.Mesh(new THREE.BoxGeometry(7.0, 2.2, 8.0), pbr.castIron);
      oilPan.position.set(0, -7.8 - explodeOffset * 1.5, 0);
      engineGroup.add(oilPan);

      updateHookRef.current = (time) => {
        const theta = time * 3.6;
        const cycleAngle = ((theta % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
        const crankY = -5.2 - explodeOffset;
        const crankPinX = r * Math.sin(theta);
        const crankPinY = crankY + r * Math.cos(theta);
        const pistonY = crankY + r * Math.cos(theta) + Math.sqrt(l * l - r * r * Math.sin(theta) * Math.sin(theta));

        pistonCrown.position.set(0, pistonY, 0);
        conRod.position.set(crankPinX / 2, (crankPinY + pistonY) / 2, 0);
        conRod.rotation.z = Math.asin((-r * Math.sin(theta)) / l);
        crankGroup.rotation.z = theta;

        if (cycleAngle < Math.PI) {
          setStrokePhase("1. INTAKE (Air-Fuel Suction)");
          intakeValve.position.y = 5.2 + explodeOffset - 0.45 * Math.sin(cycleAngle);
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0x3B82F6);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.25 * Math.sin(cycleAngle);
          sparkLight.intensity = 0;
        } else if (cycleAngle < 2 * Math.PI) {
          setStrokePhase("2. COMPRESSION (High Pressure)");
          intakeValve.position.y = 5.2 + explodeOffset;
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0xF59E0B);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.35 * Math.sin(cycleAngle - Math.PI);
          sparkLight.intensity = 0;
        } else if (cycleAngle < 3 * Math.PI) {
          const power = cycleAngle - 2 * Math.PI;
          setStrokePhase("3. POWER STROKE (Combustion 💥)");
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0xFF3300);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - power * 0.45);
          sparkLight.intensity = power < 0.6 ? 7.0 : 0;
        } else {
          const exh = cycleAngle - 3 * Math.PI;
          setStrokePhase("4. EXHAUST (Gas Scavenging)");
          exhaustValve.position.y = 5.2 + explodeOffset - 0.45 * Math.sin(exh);
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0x64748B);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.3 * Math.sin(exh);
          sparkLight.intensity = 0;
        }
      };
    }
  };

  // Run Custom Code
  const handleRunCustomCode = () => {
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

    const engineAPI = {
      onUpdate: (fn: (time: number, delta: number) => void) => {
        updateHookRef.current = fn;
      },
    };

    try {
      const runner = new Function("scene", "camera", "renderer", "THREE", "engine", "time", customCode);
      runner(scene, camera, renderer, THREE, engineAPI, simTimeRef.current);
    } catch (err: any) {
      alert("Simulation Script Error: " + err.message);
    }
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
          link.download = `blackhole_simulation_${Date.now()}.webm`;
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
          link.download = `blackhole_simulation_${Date.now()}.webm`;
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
      {/* Top Engine Header */}
      <div style={styles.topBar}>
        <div style={styles.leftControls}>
          <div style={styles.badgeGroup}>
            <span style={styles.engineBadge}>⚡ CINEMATIC PBR 3D SIMULATION ENGINE</span>
            <span style={styles.hardwareBadge}>ACES FILMIC TONE-MAPPING • 60 FPS</span>
          </div>

          {/* Category Tabs */}
          <div style={styles.categoryPills}>
            <button
              onClick={() => { setCategory("physics"); setPreset("blackhole"); }}
              style={{ ...styles.pill, ...(category === "physics" ? styles.pillActive : {}) }}
            >
              🌌 Physics &amp; Astronomy
            </button>
            <button
              onClick={() => { setCategory("engineering"); setPreset("engine"); }}
              style={{ ...styles.pill, ...(category === "engineering" ? styles.pillActive : {}) }}
            >
              ⚙️ 4-Stroke Engine
            </button>
          </div>
        </div>

        {/* Top Actions */}
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
            title="Toggle Live Code Sandbox"
          >
            💻 Code Sandbox
          </button>
        </div>
      </div>

      {/* Preset Sub-bar & Exploded Slider */}
      <div style={styles.presetBar}>
        <span style={styles.presetLabel}>SIMULATION:</span>
        {category === "physics" && (
          <>
            <button onClick={() => setPreset("blackhole")} style={preset === "blackhole" ? styles.subPillActive : styles.subPill}>🌌 Gargantua Black Hole (Kerr Metric)</button>
            <button onClick={() => setPreset("engine")} style={preset === "engine" ? styles.subPillActive : styles.subPill}>⚙️ 4-Stroke IC Engine</button>
          </>
        )}
        {category === "engineering" && (
          <button onClick={() => setPreset("engine")} style={preset === "engine" ? styles.subPillActive : styles.subPill}>⚙️ 4-Stroke IC Engine (Exploded View)</button>
        )}

        {/* 💥 Exploded View Slider */}
        {preset === "engine" && (
          <div style={styles.sliderGroup}>
            <span style={{ ...styles.sliderLabel, color: "#D1A751", fontWeight: 700 }}>
              💥 EXPLODED CAD: {Math.round(explodedRatio * 100)}%
            </span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={explodedRatio}
              onChange={(e) => setExplodedRatio(parseFloat(e.target.value))}
              style={{ ...styles.slider, accentColor: "#D1A751" }}
              title="Drag to explode / assemble engine parts in 3D"
            />
          </div>
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
        {preset === "engine" && strokePhase && (
          <div style={styles.strokeBadgeOverlay}>
            <span style={{ fontWeight: 800, color: "#D1A751" }}>4-STROKE CYCLE:</span> {strokePhase}
          </div>
        )}

        {preset === "blackhole" && (
          <div style={styles.strokeBadgeOverlay}>
            <span style={{ fontWeight: 800, color: "#D1A751" }}>KERR BLACK HOLE:</span> Accretion Disk (0.65c) • Relativistic Lensing • Polar Gamma Jets
          </div>
        )}

        <div style={styles.hintOverlay}>
          🖱️ Click and drag to orbit in 3D • Scroll to zoom • 60 FPS Hardware Rendered
        </div>
      </div>

      {/* In-Blog Interactive Code Sandbox */}
      {showCodeEditor && (
        <div style={styles.codeDrawer}>
          <div style={styles.codeHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: "#D1A751", fontWeight: 700 }}>💻 Live 3D PBR Code Playground</span>
            </div>
            <button
              onClick={handleRunCustomCode}
              style={styles.runScriptBtn}
              title="Execute custom script on the 3D scene"
            >
              ▶ Run &amp; Update Simulation
            </button>
          </div>
          <textarea
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            style={styles.scriptTextarea}
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  engineContainer: {
    backgroundColor: "#020306",
    borderRadius: "10px",
    border: "1px solid #1E293B",
    overflow: "hidden",
    margin: "2rem 0",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7)",
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
  categoryPills: {
    display: "flex",
    gap: "0.3rem",
    background: "#020306",
    padding: "0.2rem",
    borderRadius: "6px",
  },
  pill: {
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  pillActive: {
    background: "#D1A751",
    color: "#020306",
    fontWeight: 700,
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
  presetBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.4rem 1rem",
    backgroundColor: "#04060C",
    borderBottom: "1px solid #1E293B",
    gap: "0.4rem",
  },
  presetLabel: {
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#64748B",
    letterSpacing: "0.05em",
  },
  subPill: {
    background: "transparent",
    border: "1px solid #1E293B",
    color: "#94A3B8",
    fontSize: "0.7rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  subPillActive: {
    background: "#1E293B",
    border: "1px solid #D1A751",
    color: "#F8FAFC",
    fontWeight: 600,
    fontSize: "0.7rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "4px",
    cursor: "pointer",
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
    width: "80px",
    cursor: "pointer",
  },
  canvasWrapper: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    cursor: "grab",
    minHeight: "420px",
  },
  strokeBadgeOverlay: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "rgba(4, 6, 12, 0.88)",
    backdropFilter: "blur(6px)",
    border: "1px solid #D1A751",
    color: "#F8FAFC",
    fontSize: "0.75rem",
    padding: "0.35rem 0.8rem",
    borderRadius: "6px",
    pointerEvents: "none",
    boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
  },
  hintOverlay: {
    position: "absolute",
    bottom: "10px",
    left: "12px",
    background: "rgba(4, 6, 12, 0.85)",
    backdropFilter: "blur(4px)",
    color: "#94A3B8",
    fontSize: "0.68rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    pointerEvents: "none",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  codeDrawer: {
    backgroundColor: "#020306",
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
    padding: "0.3rem 0.8rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  scriptTextarea: {
    width: "100%",
    height: "130px",
    backgroundColor: "#060910",
    color: "#F8FAFC",
    fontFamily: "'Fira Code', monospace",
    fontSize: "0.82rem",
    border: "1px solid #1E293B",
    borderRadius: "4px",
    padding: "0.6rem",
    outline: "none",
    resize: "vertical",
    lineHeight: "1.5",
  },
};
