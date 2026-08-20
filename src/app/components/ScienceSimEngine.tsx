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
    darkStudioFloor: new THREE.MeshStandardMaterial({
      color: 0x070A10,
      roughness: 0.4,
      metalness: 0.6,
    }),
  };
}

export default function ScienceSimEngine({
  initialCategory = "physics",
  initialPreset = "engine",
  initialCode,
  autoPlay = true,
}: ScienceSimEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [category, setCategory] = useState<SimCategory>(initialCategory);
  const [preset, setPreset] = useState<string>(initialPreset);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [explodedRatio, setExplodedRatio] = useState<number>(0.0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);
  const [strokePhase, setStrokePhase] = useState<string>("1. INTAKE (Air-Fuel Mixture)");
  const [customCode, setCustomCode] = useState<string>(
    initialCode || `// Write any 3D physics, chemistry, biology, or mechanical script
// scene, camera, renderer, THREE, engine are provided
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 64, 64),
  new THREE.MeshStandardMaterial({ color: 0xD1A751, metalness: 0.9, roughness: 0.1 })
);
scene.add(sphere);

engine.onUpdate((time) => {
  sphere.rotation.y = time * 0.6;
});`
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

    // 1. Scene & Atmospheric Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05070B");
    scene.fog = new THREE.FogExp2("#05070B", 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(18, 14, 26);
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
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Cinematic 3-Point Studio Lighting Setup
    // A. Soft Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xFFF7ED, 2.2);
    keyLight.position.set(25, 45, 25);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 150;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    // B. Cool Fill Light
    const fillLight = new THREE.DirectionalLight(0x93C5FD, 1.2);
    fillLight.position.set(-25, 20, -20);
    scene.add(fillLight);

    // C. Cyan/Gold Rim Accent Light
    const rimLight = new THREE.DirectionalLight(0xD1A751, 1.6);
    rimLight.position.set(0, -10, -35);
    scene.add(rimLight);

    // D. Soft Ambient Glow
    const ambientLight = new THREE.AmbientLight(0x1E293B, 0.9);
    scene.add(ambientLight);

    // 5. Studio Shadow Catcher Pedestal Floor
    const floorGeom = new THREE.PlaneGeometry(100, 100);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080D18,
      roughness: 0.5,
      metalness: 0.5,
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.y = -8.5;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Grid Floor Concentric Rings
    for (let r = 5; r <= 35; r += 5) {
      const ringCurve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0);
      const points = ringCurve.getPoints(64).map((pt) => new THREE.Vector3(pt.x, -8.45, pt.y));
      const ringGeom = new THREE.BufferGeometry().setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({ color: 0x1E293B, transparent: true, opacity: 0.4 });
      scene.add(new THREE.Line(ringGeom, ringMat));
    }

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

    // 6. Main 60 FPS Render Loop
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

    // Clear old objects except lights and floor
    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Light) && obj !== scene && obj.position.y > -8.4) {
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
    // 1. ⚙️ PHOTOREALISTIC 4-STROKE ENGINE (EXPLODED CAD ASSEMBLY)
    // =================================================================
    if (pre === "engine") {
      if (cameraRef.current) {
        cameraRef.current.position.set(16, 12, 24);
        cameraRef.current.lookAt(0, 0, 0);
      }

      const engineGroup = new THREE.Group();
      scene.add(engineGroup);

      const r = 2.4; // Crank Radius
      const l = 6.2; // Con-rod Length
      const explodeOffset = explode * 7.5; // Separation along CAD explosion axes

      // A. SPARK PLUG (High-Definition Porcelain & Electrode)
      const sparkGroup = new THREE.Group();
      const sparkPorcelain = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.4, 32), pbr.porcelainCeramic);
      sparkPorcelain.castShadow = true;
      const sparkHexNut = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.5, 6), pbr.polishedChrome);
      sparkHexNut.castShadow = true;
      const sparkThread = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.8, 24), pbr.castIron);
      sparkThread.position.y = -0.6;
      const sparkElectrode = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16), pbr.forgedGoldBrass);
      sparkElectrode.position.y = -1.2;
      sparkGroup.add(sparkPorcelain, sparkHexNut, sparkThread, sparkElectrode);
      sparkGroup.position.set(0, 8.8 + explodeOffset * 1.5, 0);
      engineGroup.add(sparkGroup);

      // Real-time Spark Flash Light & Mesh
      const sparkLight = new THREE.PointLight(0xFF4500, 0, 18);
      sparkLight.position.set(0, 6.2, 0);
      engineGroup.add(sparkLight);

      // B. CYLINDER HEAD & DUAL OVERHEAD CAMSHAFT (DOHC)
      const headGroup = new THREE.Group();
      const headBlock = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.4, 6.8), pbr.castIron);
      headBlock.castShadow = true;
      headBlock.receiveShadow = true;
      headGroup.add(headBlock);

      const cam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 6.0, 32), pbr.polishedChrome);
      cam1.rotation.z = Math.PI / 2;
      cam1.position.set(0, 1.8, -1.5);
      const cam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 6.0, 32), pbr.polishedChrome);
      cam2.rotation.z = Math.PI / 2;
      cam2.position.set(0, 1.8, 1.5);
      headGroup.add(cam1, cam2);

      headGroup.position.set(0, 6.8 + explodeOffset * 1.2, 0);
      engineGroup.add(headGroup);

      // C. INTAKE (Blue) & EXHAUST (Red) VALVES + HELICAL SPRINGS
      const intakeValve = new THREE.Group();
      const inShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.5, 16), pbr.polishedChrome);
      const inHead = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.12, 0.35, 32), pbr.anodizedBlue);
      inHead.position.y = -1.75;
      const inSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.0, 16, 1, true), pbr.forgedGoldBrass);
      inSpring.position.y = 0.5;
      intakeValve.add(inShaft, inHead, inSpring);
      intakeValve.position.set(-1.9 - explodeOffset * 0.8, 5.2 + explodeOffset, 0);
      intakeValve.castShadow = true;
      engineGroup.add(intakeValve);

      const exhaustValve = new THREE.Group();
      const exShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.5, 16), pbr.polishedChrome);
      const exHead = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.12, 0.35, 32), pbr.anodizedRed);
      exHead.position.y = -1.75;
      const exSpring = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.0, 16, 1, true), pbr.forgedGoldBrass);
      exSpring.position.y = 0.5;
      exhaustValve.add(exShaft, exHead, exSpring);
      exhaustValve.position.set(1.9 + explodeOffset * 0.8, 5.2 + explodeOffset, 0);
      exhaustValve.castShadow = true;
      engineGroup.add(exhaustValve);

      // D. CUTAWAY CYLINDER BLOCK & COMBUSTION CHAMBER
      const blockGroup = new THREE.Group();
      const cylinderSleeve = new THREE.Mesh(
        new THREE.CylinderGeometry(2.45, 2.45, 7.2, 48, 1, true),
        pbr.crystalGlass
      );
      cylinderSleeve.position.y = 1.6;
      blockGroup.add(cylinderSleeve);
      engineGroup.add(blockGroup);

      // Volumetric Combustion Flame Glow
      const flameMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(2.4, 2.4, 2.0, 32),
        new THREE.MeshBasicMaterial({ color: 0xFF3300, transparent: true, opacity: 0.0 })
      );
      flameMesh.position.y = 4.4;
      engineGroup.add(flameMesh);

      // E. HIGH-PERFORMANCE CNC PISTON (with 3 Piston Rings & Wrist Pin)
      const pistonGroup = new THREE.Group();
      const pistonCrown = new THREE.Mesh(new THREE.CylinderGeometry(2.38, 2.38, 2.2, 48), pbr.brushedSteel);
      pistonCrown.castShadow = true;

      // 3 Compression & Oil Scraper Rings
      for (let ringY = 0.4; ringY >= -0.2; ringY -= 0.3) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.39, 0.04, 12, 48), pbr.castIron);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = ringY;
        pistonCrown.add(ring);
      }

      const wristPin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.1, 24), pbr.polishedChrome);
      wristPin.rotation.z = Math.PI / 2;
      wristPin.position.y = -0.3;
      pistonGroup.add(pistonCrown, wristPin);
      engineGroup.add(pistonGroup);

      // F. FORGED I-BEAM CONNECTING ROD
      const conRodGroup = new THREE.Group();
      const rodBeam = new THREE.Mesh(new THREE.BoxGeometry(0.55, l, 0.38), pbr.forgedGoldBrass);
      rodBeam.castShadow = true;
      const smallEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.7, 24), pbr.forgedGoldBrass);
      smallEnd.rotation.x = Math.PI / 2;
      smallEnd.position.y = l / 2;
      const bigEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.7, 24), pbr.forgedGoldBrass);
      bigEnd.rotation.x = Math.PI / 2;
      bigEnd.position.y = -l / 2;
      conRodGroup.add(rodBeam, smallEnd, bigEnd);
      engineGroup.add(conRodGroup);

      // G. CRANKSHAFT WITH COUNTERWEIGHTS & FLYWHEEL
      const crankGroup = new THREE.Group();
      const journal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 32), pbr.polishedChrome);
      journal.rotation.x = Math.PI / 2;

      const cw1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.8, 0.6), pbr.castIron);
      cw1.position.set(0, -1.3, -0.8);
      cw1.castShadow = true;
      const cw2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.8, 0.6), pbr.castIron);
      cw2.position.set(0, -1.3, 0.8);
      cw2.castShadow = true;

      const flywheel = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.7, 48), pbr.castIron);
      flywheel.rotation.x = Math.PI / 2;
      flywheel.position.z = -2.8;
      flywheel.castShadow = true;

      crankGroup.add(journal, cw1, cw2, flywheel);
      crankGroup.position.set(0, -5.2 - explodeOffset, 0);
      engineGroup.add(crankGroup);

      // H. CAST ALUMINUM CRANKCASE OIL PAN
      const oilPan = new THREE.Mesh(new THREE.BoxGeometry(7.0, 2.2, 8.0), pbr.castIron);
      oilPan.position.set(0, -7.8 - explodeOffset * 1.5, 0);
      oilPan.castShadow = true;
      oilPan.receiveShadow = true;
      engineGroup.add(oilPan);

      // Kinematic Reciprocating Cycle Engine
      updateHookRef.current = (time) => {
        const theta = time * 3.6;
        const cycleAngle = ((theta % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);

        const crankY = -5.2 - explodeOffset;
        const crankPinX = r * Math.sin(theta);
        const crankPinY = crankY + r * Math.cos(theta);

        // Exact slider-crank displacement
        const pistonY = crankY + r * Math.cos(theta) + Math.sqrt(l * l - r * r * Math.sin(theta) * Math.sin(theta));
        pistonGroup.position.set(0, pistonY, 0);

        const midX = crankPinX / 2;
        const midY = (crankPinY + pistonY) / 2;
        conRodGroup.position.set(midX, midY, 0);
        conRodGroup.rotation.z = Math.asin((-r * Math.sin(theta)) / l);

        crankGroup.rotation.z = theta;

        // 4-Stroke Lighting & Valve Timing
        if (cycleAngle < Math.PI) {
          setStrokePhase("1. INTAKE (Air-Fuel Mixture Suction)");
          intakeValve.position.y = 5.2 + explodeOffset - 0.45 * Math.sin(cycleAngle);
          exhaustValve.position.y = 5.2 + explodeOffset;
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0x3B82F6);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.25 * Math.sin(cycleAngle);
          sparkLight.intensity = 0;
        } else if (cycleAngle < 2 * Math.PI) {
          setStrokePhase("2. COMPRESSION (High Pressure & Temperature)");
          intakeValve.position.y = 5.2 + explodeOffset;
          exhaustValve.position.y = 5.2 + explodeOffset;
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0xF59E0B);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.35 * Math.sin(cycleAngle - Math.PI);
          sparkLight.intensity = 0;
        } else if (cycleAngle < 3 * Math.PI) {
          const powerProgress = cycleAngle - 2 * Math.PI;
          setStrokePhase("3. POWER STROKE (Spark Ignition & Explosion 💥)");
          intakeValve.position.y = 5.2 + explodeOffset;
          exhaustValve.position.y = 5.2 + explodeOffset;
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0xFF3300);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - powerProgress * 0.45);
          sparkLight.intensity = powerProgress < 0.6 ? 7.0 : 0;
        } else {
          const exhaustProgress = cycleAngle - 3 * Math.PI;
          setStrokePhase("4. EXHAUST (Scavenging Burned Gases)");
          intakeValve.position.y = 5.2 + explodeOffset;
          exhaustValve.position.y = 5.2 + explodeOffset - 0.45 * Math.sin(exhaustProgress);
          (flameMesh.material as THREE.MeshBasicMaterial).color.setHex(0x64748B);
          (flameMesh.material as THREE.MeshBasicMaterial).opacity = 0.3 * Math.sin(exhaustProgress);
          sparkLight.intensity = 0;
        }
      };
    }

    // =================================================================
    // 2. 🌌 PHOTOREALISTIC SPACETIME CURVATURE & PLANETARY ORBITS
    // =================================================================
    else if (pre === "spacetime") {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 22, 28);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Relativistic Warped Spacetime Grid
      const gridW = 50, gridH = 50, gridSegments = 70;
      const gridGeom = new THREE.PlaneGeometry(gridW, gridH, gridSegments, gridSegments);
      gridGeom.rotateX(-Math.PI / 2);
      const gridMat = new THREE.MeshStandardMaterial({
        color: 0x38BDF8,
        wireframe: true,
        roughness: 0.2,
        metalness: 0.8,
      });
      const spacetimeMesh = new THREE.Mesh(gridGeom, gridMat);
      scene.add(spacetimeMesh);

      // Central Star (Glowing Sun)
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 64, 64),
        new THREE.MeshStandardMaterial({
          color: 0xFDB813,
          emissive: 0xF59E0B,
          emissiveIntensity: 1.2,
          roughness: 0.2,
        })
      );
      scene.add(sun);

      // Planets
      const planets = [
        { name: "Mercury", dist: 5.5, radius: 0.45, color: 0x9CA3AF, speed: 2.4, mesh: null as any },
        { name: "Earth", dist: 9.5, radius: 0.75, color: 0x3B82F6, speed: 1.4, mesh: null as any },
        { name: "Mars", dist: 14.0, radius: 0.58, color: 0xEF4444, speed: 1.0, mesh: null as any },
        { name: "Jupiter", dist: 19.5, radius: 1.35, color: 0xD97706, speed: 0.6, mesh: null as any },
      ];

      planets.forEach((p) => {
        const pMesh = new THREE.Mesh(
          new THREE.SphereGeometry(p.radius, 48, 48),
          new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.3, metalness: 0.4 })
        );
        pMesh.castShadow = true;
        p.mesh = pMesh;
        scene.add(pMesh);

        const orbitCurve = new THREE.EllipseCurve(0, 0, p.dist, p.dist, 0, 2 * Math.PI, false, 0);
        const points = orbitCurve.getPoints(80).map((pt) => new THREE.Vector3(pt.x, 0, pt.y));
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.2 })));
      });

      updateHookRef.current = (time) => {
        sun.rotation.y = time * 0.2;
        const pos = gridGeom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), z = pos.getZ(i);
          const distSun = Math.sqrt(x * x + z * z);
          let depth = -6.5 / (1 + distSun * 0.35);

          planets.forEach((p) => {
            if (p.mesh) {
              const dx = x - p.mesh.position.x, dz = z - p.mesh.position.z;
              depth += -p.radius * 2.2 / (1 + Math.sqrt(dx * dx + dz * dz) * 0.7);
            }
          });
          pos.setY(i, depth);
        }
        pos.needsUpdate = true;

        planets.forEach((p) => {
          p.mesh.position.x = Math.cos(time * p.speed) * p.dist;
          p.mesh.position.z = Math.sin(time * p.speed) * p.dist;
          p.mesh.position.y = -p.radius * 0.5;
          p.mesh.rotation.y = time * 2.0;
        });
      };
    }

    // =================================================================
    // 3. 🧪 PHOTOREALISTIC MOLECULAR DYNAMICS (WATER H2O 104.5°)
    // =================================================================
    else if (pre === "water") {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 2, 14);
        cameraRef.current.lookAt(0, 0, 0);
      }

      const molGroup = new THREE.Group();
      scene.add(molGroup);

      const bondAngleRad = (104.5 * Math.PI) / 180;
      const bondLen = 2.4;

      const oxygen = new THREE.Mesh(new THREE.SphereGeometry(1.1, 64, 64), pbr.anodizedRed);
      oxygen.position.set(0, 1.0, 0);
      oxygen.castShadow = true;
      molGroup.add(oxygen);

      const h1Pos = new THREE.Vector3(-bondLen * Math.sin(bondAngleRad / 2), 1.0 - bondLen * Math.cos(bondAngleRad / 2), 0);
      const h2Pos = new THREE.Vector3(bondLen * Math.sin(bondAngleRad / 2), 1.0 - bondLen * Math.cos(bondAngleRad / 2), 0);

      const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 48, 48), pbr.porcelainCeramic);
      h1.position.copy(h1Pos);
      h1.castShadow = true;
      const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 48, 48), pbr.porcelainCeramic);
      h2.position.copy(h2Pos);
      h2.castShadow = true;
      molGroup.add(h1, h2);

      // Polished Chemical Bond Cylinders
      [h1Pos, h2Pos].forEach((hPos) => {
        const oPos = oxygen.position;
        const dist = oPos.distanceTo(hPos);
        const bondMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, dist, 32), pbr.polishedChrome);
        bondMesh.position.copy(oPos.clone().add(hPos).multiplyScalar(0.5));
        bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hPos.clone().sub(oPos).normalize());
        bondMesh.castShadow = true;
        molGroup.add(bondMesh);
      });

      updateHookRef.current = (time) => {
        molGroup.rotation.y = time * 0.5;
        molGroup.rotation.x = Math.sin(time * 0.3) * 0.2;
      };
    }

    // =================================================================
    // 4. 🧬 PHOTOREALISTIC B-DNA DOUBLE HELIX
    // =================================================================
    else if (pre === "dna") {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 32);
        cameraRef.current.lookAt(0, 0, 0);
      }

      const dnaGroup = new THREE.Group();
      scene.add(dnaGroup);

      const numBasePairs = 35, radius = 4.5, pitch = 0.85, twist = 0.35;
      for (let i = 0; i < numBasePairs; i++) {
        const y = (i - numBasePairs / 2) * pitch;
        const angle = i * twist;

        const x1 = Math.cos(angle) * radius, z1 = Math.sin(angle) * radius;
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), pbr.anodizedBlue);
        s1.position.set(x1, y, z1);
        s1.castShadow = true;
        dnaGroup.add(s1);

        const x2 = Math.cos(angle + Math.PI) * radius, z2 = Math.sin(angle + Math.PI) * radius;
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 32), pbr.anodizedRed);
        s2.position.set(x2, y, z2);
        s2.castShadow = true;
        dnaGroup.add(s2);

        const v1 = new THREE.Vector3(x1, y, z1), v2 = new THREE.Vector3(x2, y, z2);
        const dist = v1.distanceTo(v2);
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, dist, 24), pbr.forgedGoldBrass);
        rung.position.copy(v1.clone().add(v2).multiplyScalar(0.5));
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
        rung.castShadow = true;
        dnaGroup.add(rung);
      }

      updateHookRef.current = (time) => {
        dnaGroup.rotation.y = time * 0.6;
        dnaGroup.position.y = Math.sin(time * 0.5) * 0.5;
      };
    }
  };

  // Compile and run custom code
  const handleRunCustomCode = () => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (!scene || !camera || !renderer) return;

    const objectsToRemove: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Light) && obj !== scene && obj.position.y > -8.4) {
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
          link.download = `photorealistic_simulation_${Date.now()}.webm`;
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
          link.download = `photorealistic_simulation_${Date.now()}.webm`;
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
              onClick={() => { setCategory("physics"); setPreset("engine"); }}
              style={{ ...styles.pill, ...(category === "physics" ? styles.pillActive : {}) }}
            >
              ⚙️ Engineering &amp; Physics
            </button>
            <button
              onClick={() => { setCategory("chemistry"); setPreset("water"); }}
              style={{ ...styles.pill, ...(category === "chemistry" ? styles.pillActive : {}) }}
            >
              🧪 Chemistry
            </button>
            <button
              onClick={() => { setCategory("biotech"); setPreset("dna"); }}
              style={{ ...styles.pill, ...(category === "biotech" ? styles.pillActive : {}) }}
            >
              🧬 Biotech
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
            <button onClick={() => setPreset("engine")} style={preset === "engine" ? styles.subPillActive : styles.subPill}>⚙️ 4-Stroke IC Engine</button>
            <button onClick={() => setPreset("spacetime")} style={preset === "spacetime" ? styles.subPillActive : styles.subPill}>🌌 Spacetime Curvature &amp; Orbits</button>
          </>
        )}
        {category === "chemistry" && (
          <button onClick={() => setPreset("water")} style={preset === "water" ? styles.subPillActive : styles.subPill}>🧪 Water (H₂O) 104.5°</button>
        )}
        {category === "biotech" && (
          <button onClick={() => setPreset("dna")} style={preset === "dna" ? styles.subPillActive : styles.subPill}>🧬 B-DNA Double Helix</button>
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
        {preset === "engine" && (
          <div style={styles.strokeBadgeOverlay}>
            <span style={{ fontWeight: 800, color: "#D1A751" }}>4-STROKE CYCLE:</span> {strokePhase}
          </div>
        )}

        <div style={styles.hintOverlay}>
          🖱️ Click and drag to orbit in 3D • Scroll to zoom • Use Exploded Slider to assemble/disassemble
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
    backgroundColor: "#05070B",
    borderRadius: "10px",
    border: "1px solid #1E293B",
    overflow: "hidden",
    margin: "2rem 0",
    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.6)",
  },
  topBar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.6rem 1rem",
    backgroundColor: "#090D15",
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
    background: "#05070B",
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
    color: "#05070B",
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
    color: "#090D15",
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
    backgroundColor: "#070A10",
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
    background: "rgba(7, 10, 16, 0.85)",
    backdropFilter: "blur(6px)",
    border: "1px solid #D1A751",
    color: "#F8FAFC",
    fontSize: "0.75rem",
    padding: "0.35rem 0.8rem",
    borderRadius: "6px",
    pointerEvents: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  hintOverlay: {
    position: "absolute",
    bottom: "10px",
    left: "12px",
    background: "rgba(7, 10, 16, 0.8)",
    backdropFilter: "blur(4px)",
    color: "#94A3B8",
    fontSize: "0.68rem",
    padding: "0.25rem 0.6rem",
    borderRadius: "4px",
    pointerEvents: "none",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  codeDrawer: {
    backgroundColor: "#030408",
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
    backgroundColor: "#080C14",
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
