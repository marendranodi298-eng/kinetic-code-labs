"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type SimCategory = "physics" | "chemistry" | "biotech" | "math" | "custom";

interface ScienceSimEngineProps {
  initialCategory?: SimCategory;
  initialPreset?: string;
  autoPlay?: boolean;
}

export default function ScienceSimEngine({
  initialCategory = "physics",
  initialPreset = "spacetime",
  autoPlay = true,
}: ScienceSimEngineProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // UI Control states
  const [category, setCategory] = useState<SimCategory>(initialCategory);
  const [preset, setPreset] = useState<string>(initialPreset);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);
  const [customCode, setCustomCode] = useState<string>(`// Write custom simulation script
// (scene, camera, renderer, time, THREE) are provided
scene.rotation.y = time * 0.5;
`);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);

  // Engine Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const simTimeRef = useRef<number>(0);
  const updateHookRef = useRef<((time: number, delta: number) => void) | null>(null);

  // Mouse drag orbit controls ref
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Initialize Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = Math.min(Math.max(width * 0.6, 420), 600);

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090D16"); // Deep Space Obsidian
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xD1A751, 2, 50);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // Mouse Interaction for Orbit
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
      const newDist = Math.max(5, Math.min(100, dist + e.deltaY * 0.05));
      cam.position.copy(dir.multiplyScalar(newDist));
      cam.lookAt(0, 0, 0);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });

    // Window resize
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = Math.min(Math.max(w * 0.6, 420), 600);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Build Current Preset Scene
    loadSimulationScene(category, preset);

    // 5. Main Animation Loop
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

  // Reload scene whenever Category or Preset changes
  useEffect(() => {
    loadSimulationScene(category, preset);
  }, [category, preset]);

  // Master Scene Loader
  const loadSimulationScene = (cat: SimCategory, pre: string) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous objects (keeping lights)
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

    updateHookRef.current = null;

    // ==========================================
    // 1. PHYSICS MODULE
    // ==========================================
    if (cat === "physics") {
      if (pre === "spacetime" || pre === "orbital") {
        // Gravitational Spacetime Curvature & N-Body Planetary Orbit
        if (cameraRef.current) {
          cameraRef.current.position.set(0, 22, 28);
          cameraRef.current.lookAt(0, 0, 0);
        }

        // Curved Spacetime Grid
        const gridW = 50;
        const gridH = 50;
        const gridSegments = 60;
        const gridGeom = new THREE.PlaneGeometry(gridW, gridH, gridSegments, gridSegments);
        gridGeom.rotateX(-Math.PI / 2);

        const gridMat = new THREE.MeshBasicMaterial({
          color: 0x304468,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        });
        const spacetimeMesh = new THREE.Mesh(gridGeom, gridMat);
        scene.add(spacetimeMesh);

        // Massive Central Sun
        const sunGeom = new THREE.SphereGeometry(2.5, 32, 32);
        const sunMat = new THREE.MeshStandardMaterial({
          color: 0xFDB813,
          emissive: 0xF59E0B,
          emissiveIntensity: 0.8,
          roughness: 0.3,
        });
        const sun = new THREE.Mesh(sunGeom, sunMat);
        scene.add(sun);

        // Orbiting Planets
        const planets = [
          { name: "Mercury", dist: 5.5, radius: 0.4, color: 0x9CA3AF, speed: 2.2, mesh: null as any },
          { name: "Earth", dist: 9.5, radius: 0.7, color: 0x3B82F6, speed: 1.4, mesh: null as any },
          { name: "Mars", dist: 14.0, radius: 0.55, color: 0xEF4444, speed: 1.0, mesh: null as any },
          { name: "Jupiter", dist: 19.5, radius: 1.3, color: 0xD97706, speed: 0.6, mesh: null as any },
        ];

        planets.forEach((p) => {
          const pGeom = new THREE.SphereGeometry(p.radius, 24, 24);
          const pMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.4 });
          const pMesh = new THREE.Mesh(pGeom, pMat);
          p.mesh = pMesh;
          scene.add(pMesh);

          // Orbit trajectory line
          const orbitCurve = new THREE.EllipseCurve(0, 0, p.dist, p.dist, 0, 2 * Math.PI, false, 0);
          const points = orbitCurve.getPoints(64).map((pt) => new THREE.Vector3(pt.x, 0, pt.y));
          const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
          const orbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
          scene.add(new THREE.Line(orbitGeom, orbitMat));
        });

        // Animation hook for Gravitational distortion & Orbits
        updateHookRef.current = (time) => {
          sun.rotation.y = time * 0.2;

          // Distort spacetime grid based on sun & planet masses
          const pos = gridGeom.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const distSun = Math.sqrt(x * x + z * z);
            let depth = -6 / (1 + distSun * 0.4);

            planets.forEach((p) => {
              if (p.mesh) {
                const dx = x - p.mesh.position.x;
                const dz = z - p.mesh.position.z;
                const distPlanet = Math.sqrt(dx * dx + dz * dz);
                depth += -p.radius * 2 / (1 + distPlanet * 0.8);
              }
            });

            pos.setY(i, depth);
          }
          pos.needsUpdate = true;

          // Move planets
          planets.forEach((p) => {
            const angle = time * p.speed;
            p.mesh.position.x = Math.cos(angle) * p.dist;
            p.mesh.position.z = Math.sin(angle) * p.dist;
            p.mesh.position.y = -p.radius * 0.5;
            p.mesh.rotation.y = time * 2;
          });
        };
      } else if (pre === "pendulum") {
        // Chaotic Double Pendulum simulation
        if (cameraRef.current) {
          cameraRef.current.position.set(0, 0, 30);
          cameraRef.current.lookAt(0, -5, 0);
        }

        const l1 = 6;
        const l2 = 5;
        const m1 = 2;
        const m2 = 1.5;
        let theta1 = Math.PI / 2;
        let theta2 = Math.PI / 2;
        let omega1 = 0;
        let omega2 = 0;
        const g = 9.81;

        // Visual Meshes
        const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, l1), new THREE.MeshStandardMaterial({ color: 0xD1A751 }));
        const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, l2), new THREE.MeshStandardMaterial({ color: 0xD1A751 }));
        const bob1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 24), new THREE.MeshStandardMaterial({ color: 0x3B82F6, metalness: 0.6 }));
        const bob2 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 24, 24), new THREE.MeshStandardMaterial({ color: 0xEF4444, emissive: 0x7F1D1D }));
        scene.add(rod1, rod2, bob1, bob2);

        // Trail
        const maxTrail = 200;
        const trailPositions = new Float32Array(maxTrail * 3);
        const trailGeom = new THREE.BufferGeometry();
        trailGeom.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
        const trailMat = new THREE.LineBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0.7 });
        const trailLine = new THREE.Line(trailGeom, trailMat);
        scene.add(trailLine);
        let trailCount = 0;

        updateHookRef.current = (_time, dt) => {
          const clampedDt = Math.min(dt, 0.05);
          // Runge-Kutta numerical integration for chaotic double pendulum
          const num1 = -g * (2 * m1 + m2) * Math.sin(theta1) - m2 * g * Math.sin(theta1 - 2 * theta2) - 2 * Math.sin(theta1 - theta2) * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * Math.cos(theta1 - theta2));
          const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2));
          const alpha1 = num1 / den1;

          const num2 = 2 * Math.sin(theta1 - theta2) * (omega1 * omega1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(theta1) + omega2 * omega2 * l2 * m2 * Math.cos(theta1 - theta2));
          const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2));
          const alpha2 = num2 / den2;

          omega1 += alpha1 * clampedDt;
          omega2 += alpha2 * clampedDt;
          theta1 += omega1 * clampedDt;
          theta2 += omega2 * clampedDt;

          const x1 = l1 * Math.sin(theta1);
          const y1 = -l1 * Math.cos(theta1);
          const x2 = x1 + l2 * Math.sin(theta2);
          const y2 = y1 - l2 * Math.cos(theta2);

          bob1.position.set(x1, y1, 0);
          bob2.position.set(x2, y2, 0);

          rod1.position.set(x1 / 2, y1 / 2, 0);
          rod1.rotation.z = -theta1;

          rod2.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
          rod2.rotation.z = -theta2;

          // Update trail
          if (trailCount < maxTrail) {
            trailPositions[trailCount * 3] = x2;
            trailPositions[trailCount * 3 + 1] = y2;
            trailPositions[trailCount * 3 + 2] = 0;
            trailCount++;
          } else {
            for (let i = 0; i < (maxTrail - 1) * 3; i++) {
              trailPositions[i] = trailPositions[i + 3];
            }
            trailPositions[(maxTrail - 1) * 3] = x2;
            trailPositions[(maxTrail - 1) * 3 + 1] = y2;
            trailPositions[(maxTrail - 1) * 3 + 2] = 0;
          }
          trailGeom.attributes.position.needsUpdate = true;
        };
      }
    }

    // ==========================================
    // 2. CHEMISTRY & MOLECULES MODULE
    // ==========================================
    else if (cat === "chemistry") {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 4, 18);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Molecular Data (Ball and Stick model)
      interface Atom { elem: string; x: number; y: number; z: number; color: number; r: number }
      let atoms: Atom[] = [];
      let bonds: [number, number][] = [];

      if (pre === "benzene" || pre === "molecule") {
        // Benzene (C6H6 Ring)
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          // Carbon
          atoms.push({ elem: "C", x: 3 * Math.cos(angle), y: 3 * Math.sin(angle), z: 0, color: 0x374151, r: 0.7 });
          // Hydrogen
          atoms.push({ elem: "H", x: 4.8 * Math.cos(angle), y: 4.8 * Math.sin(angle), z: 0, color: 0xF3F4F6, r: 0.45 });
          // Bonds
          bonds.push([i * 2, ((i + 1) % 6) * 2]); // C-C
          bonds.push([i * 2, i * 2 + 1]); // C-H
        }
      } else if (pre === "water") {
        // Water (H2O)
        atoms = [
          { elem: "O", x: 0, y: 0.8, z: 0, color: 0xEF4444, r: 0.9 }, // Oxygen Red
          { elem: "H", x: -1.6, y: -0.6, z: 0, color: 0xF3F4F6, r: 0.5 }, // Hydrogen White
          { elem: "H", x: 1.6, y: -0.6, z: 0, color: 0xF3F4F6, r: 0.5 },
        ];
        bonds = [[0, 1], [0, 2]];
      } else if (pre === "caffeine") {
        // Caffeine (C8H10N4O2)
        atoms = [
          { elem: "N", x: 0, y: 2, z: 0, color: 0x3B82F6, r: 0.75 },
          { elem: "C", x: 1.8, y: 1.4, z: 0, color: 0x374151, r: 0.7 },
          { elem: "N", x: 2.2, y: -0.2, z: 0, color: 0x3B82F6, r: 0.75 },
          { elem: "C", x: 1.0, y: -1.2, z: 0, color: 0x374151, r: 0.7 },
          { elem: "C", x: -0.6, y: -0.8, z: 0, color: 0x374151, r: 0.7 },
          { elem: "C", x: -1.0, y: 0.8, z: 0, color: 0x374151, r: 0.7 },
          { elem: "O", x: 2.8, y: 2.3, z: 0, color: 0xEF4444, r: 0.8 },
          { elem: "O", x: -2.2, y: 1.2, z: 0, color: 0xEF4444, r: 0.8 },
          { elem: "N", x: -1.4, y: -2.0, z: 0, color: 0x3B82F6, r: 0.75 },
          { elem: "C", x: -0.3, y: -2.9, z: 0, color: 0x374151, r: 0.7 },
          { elem: "N", x: 1.0, y: -2.4, z: 0, color: 0x3B82F6, r: 0.75 },
        ];
        bonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [5, 7], [4, 8], [8, 9], [9, 10], [10, 3]];
      }

      const molGroup = new THREE.Group();
      scene.add(molGroup);

      // Create Atom Spheres
      const atomMeshes: THREE.Mesh[] = [];
      atoms.forEach((a) => {
        const geom = new THREE.SphereGeometry(a.r, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: a.color,
          roughness: 0.2,
          metalness: 0.3,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(a.x, a.y, a.z);
        molGroup.add(mesh);
        atomMeshes.push(mesh);
      });

      // Create Bonds (Cylinders connecting atoms)
      bonds.forEach(([i, j]) => {
        const a1 = atoms[i];
        const a2 = atoms[j];
        if (!a1 || !a2) return;

        const v1 = new THREE.Vector3(a1.x, a1.y, a1.z);
        const v2 = new THREE.Vector3(a2.x, a2.y, a2.z);
        const dist = v1.distanceTo(v2);

        const cylinderGeom = new THREE.CylinderGeometry(0.18, 0.18, dist, 16);
        const cylinderMat = new THREE.MeshStandardMaterial({ color: 0x9CA3AF, roughness: 0.4 });
        const bondMesh = new THREE.Mesh(cylinderGeom, cylinderMat);

        bondMesh.position.copy(v1.clone().add(v2).multiplyScalar(0.5));
        bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
        molGroup.add(bondMesh);
      });

      updateHookRef.current = (time) => {
        molGroup.rotation.y = time * 0.4;
        molGroup.rotation.x = Math.sin(time * 0.3) * 0.2;

        // Thermal bond vibrational quantum oscillation
        atomMeshes.forEach((mesh, idx) => {
          const a = atoms[idx];
          const vib = Math.sin(time * 8 + idx) * 0.05;
          mesh.position.set(a.x + vib, a.y + vib, a.z);
        });
      };
    }

    // ==========================================
    // 3. BIOLOGY & BIOTECHNOLOGY MODULE
    // ==========================================
    else if (cat === "biotech") {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, 32);
        cameraRef.current.lookAt(0, 0, 0);
      }

      if (pre === "dna" || pre === "helix") {
        // 3D DNA Double Helix with Hydrogen Base Pairs (A-T, G-C)
        const dnaGroup = new THREE.Group();
        scene.add(dnaGroup);

        const numBasePairs = 35;
        const radius = 4.5;
        const pitch = 0.8;
        const twist = 0.35;

        const basePairColors = [
          { a: 0xEF4444, b: 0x10B981, name: "A-T" }, // Adenine (Red) - Thymine (Green)
          { a: 0x3B82F6, b: 0xD1A751, name: "G-C" }, // Guanine (Blue) - Cytosine (Gold)
        ];

        for (let i = 0; i < numBasePairs; i++) {
          const y = (i - numBasePairs / 2) * pitch;
          const angle = i * twist;

          // Strand 1 Backbone Sugar-Phosphate Sphere
          const x1 = Math.cos(angle) * radius;
          const z1 = Math.sin(angle) * radius;
          const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshStandardMaterial({ color: 0x8B5CF6, roughness: 0.3 }));
          sphere1.position.set(x1, y, z1);
          dnaGroup.add(sphere1);

          // Strand 2 Backbone Sphere
          const x2 = Math.cos(angle + Math.PI) * radius;
          const z2 = Math.sin(angle + Math.PI) * radius;
          const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), new THREE.MeshStandardMaterial({ color: 0xEC4899, roughness: 0.3 }));
          sphere2.position.set(x2, y, z2);
          dnaGroup.add(sphere2);

          // Base Pair Horizontal Rung (Hydrogen Bond)
          const pairType = basePairColors[i % 2];
          const v1 = new THREE.Vector3(x1, y, z1);
          const v2 = new THREE.Vector3(x2, y, z2);
          const mid = v1.clone().add(v2).multiplyScalar(0.5);
          const dist = v1.distanceTo(v2);

          // Half 1
          const rung1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, dist / 2, 12), new THREE.MeshStandardMaterial({ color: pairType.a }));
          rung1.position.copy(v1.clone().add(mid).multiplyScalar(0.5));
          rung1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mid.clone().sub(v1).normalize());
          dnaGroup.add(rung1);

          // Half 2
          const rung2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, dist / 2, 12), new THREE.MeshStandardMaterial({ color: pairType.b }));
          rung2.position.copy(v2.clone().add(mid).multiplyScalar(0.5));
          rung2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), mid.clone().sub(v2).normalize());
          dnaGroup.add(rung2);
        }

        updateHookRef.current = (time) => {
          dnaGroup.rotation.y = time * 0.6;
          dnaGroup.position.y = Math.sin(time * 0.5) * 0.5;
        };
      } else if (pre === "virus" || pre === "capsid") {
        // 3D Bacteriophage / Virus Model
        const virusGroup = new THREE.Group();
        scene.add(virusGroup);

        // Icosahedral Head
        const headGeom = new THREE.IcosahedronGeometry(4, 1);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x10B981, wireframe: false, roughness: 0.3, metalness: 0.2 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 5;
        virusGroup.add(head);

        // Tail Sheath
        const sheathGeom = new THREE.CylinderGeometry(0.6, 0.6, 6, 16);
        const sheathMat = new THREE.MeshStandardMaterial({ color: 0x3B82F6 });
        const sheath = new THREE.Mesh(sheathGeom, sheathMat);
        sheath.position.y = 0;
        virusGroup.add(sheath);

        // Baseplate
        const baseGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xD1A751 });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = -3;
        virusGroup.add(base);

        // Tail Fibers
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const legGeom = new THREE.CylinderGeometry(0.1, 0.1, 4, 8);
          const legMat = new THREE.MeshStandardMaterial({ color: 0xEF4444 });
          const leg = new THREE.Mesh(legGeom, legMat);
          leg.position.set(1.5 * Math.cos(angle), -4.5, 1.5 * Math.sin(angle));
          leg.rotation.z = Math.cos(angle) * 0.8;
          leg.rotation.x = Math.sin(angle) * 0.8;
          virusGroup.add(leg);
        }

        updateHookRef.current = (time) => {
          virusGroup.rotation.y = time * 0.4;
          head.rotation.x = Math.sin(time) * 0.1;
        };
      }
    }

    // ==========================================
    // 4. MATHEMATICAL 3D PLOTTER MODULE
    // ==========================================
    else if (cat === "math") {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 18, 26);
        cameraRef.current.lookAt(0, 0, 0);
      }

      if (pre === "surface" || pre === "wave") {
        // 3D Ripple Surface z = sin(sqrt(x^2 + y^2))
        const size = 30;
        const segs = 70;
        const surfaceGeom = new THREE.PlaneGeometry(size, size, segs, segs);
        surfaceGeom.rotateX(-Math.PI / 2);

        const surfaceMat = new THREE.MeshStandardMaterial({
          color: 0x3B82F6,
          wireframe: true,
          roughness: 0.2,
        });
        const surfaceMesh = new THREE.Mesh(surfaceGeom, surfaceMat);
        scene.add(surfaceMesh);

        updateHookRef.current = (time) => {
          const pos = surfaceGeom.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const r = Math.sqrt(x * x + z * z);
            const y = Math.sin(r * 0.6 - time * 3) * (2.5 / (1 + r * 0.1));
            pos.setY(i, y);
          }
          pos.needsUpdate = true;
          surfaceMesh.rotation.y = time * 0.1;
        };
      } else if (pre === "lorenz") {
        // Lorenz Attractor 3D Chaos Curve
        const maxPoints = 2000;
        const lorenzPoints = new Float32Array(maxPoints * 3);
        let lx = 0.1;
        let ly = 0;
        let lz = 0;
        const sigma = 10;
        const rho = 28;
        const beta = 8 / 3;
        const dt = 0.01;

        for (let i = 0; i < maxPoints; i++) {
          const dx = sigma * (ly - lx) * dt;
          const dy = (lx * (rho - lz) - ly) * dt;
          const dz = (lx * ly - beta * lz) * dt;
          lx += dx;
          ly += dy;
          lz += dz;
          lorenzPoints[i * 3] = lx * 0.6;
          lorenzPoints[i * 3 + 1] = (lz - 25) * 0.6;
          lorenzPoints[i * 3 + 2] = ly * 0.6;
        }

        const lorenzGeom = new THREE.BufferGeometry();
        lorenzGeom.setAttribute("position", new THREE.BufferAttribute(lorenzPoints, 3));
        const lorenzMat = new THREE.LineBasicMaterial({ color: 0xF59E0B });
        const lorenzCurve = new THREE.Line(lorenzGeom, lorenzMat);
        scene.add(lorenzCurve);

        updateHookRef.current = (time) => {
          lorenzCurve.rotation.y = time * 0.5;
        };
      }
    }
  };

  // Capture High-Res Snapshot (PNG)
  const captureSnapshot = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataURL = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `simulation_${category}_${preset}_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  // Video Recording with MediaRecorder API
  const toggleRecording = () => {
    if (isRecording) {
      // Stop Recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start Recording
      const canvas = canvasRef.current;
      if (!canvas) return;

      const stream = canvas.captureStream(60); // 60 FPS video capture
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
          link.download = `simulation_recording_${category}_${preset}.webm`;
          link.click();
          URL.revokeObjectURL(url);
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordTime(0);

        // Recording timer
        const timer = setInterval(() => {
          setRecordTime((t) => t + 1);
        }, 1000);

        recorder.onstop = () => {
          clearInterval(timer);
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `simulation_recording_${category}_${preset}.webm`;
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
      {/* Top Simulation Toolbar */}
      <div style={styles.topBar}>
        <div style={styles.leftControls}>
          <span style={styles.engineBadge}>⚡ 3D SIMULATION ENGINE</span>
          
          {/* Category Tabs */}
          <div style={styles.categoryPills}>
            <button
              onClick={() => { setCategory("physics"); setPreset("spacetime"); }}
              style={{ ...styles.pill, ...(category === "physics" ? styles.pillActive : {}) }}
            >
              🌌 Physics
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
            <button
              onClick={() => { setCategory("math"); setPreset("surface"); }}
              style={{ ...styles.pill, ...(category === "math" ? styles.pillActive : {}) }}
            >
              📊 Math 3D
            </button>
          </div>
        </div>

        {/* Action Controls */}
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
            title="Toggle Live Script Playground"
          >
            💻 Script
          </button>
        </div>
      </div>

      {/* Preset Sub-bar */}
      <div style={styles.presetBar}>
        <span style={styles.presetLabel}>PRESETS:</span>
        {category === "physics" && (
          <>
            <button onClick={() => setPreset("spacetime")} style={preset === "spacetime" ? styles.subPillActive : styles.subPill}>Spacetime Curvature &amp; Orbits</button>
            <button onClick={() => setPreset("pendulum")} style={preset === "pendulum" ? styles.subPillActive : styles.subPill}>Double Pendulum Chaos</button>
          </>
        )}
        {category === "chemistry" && (
          <>
            <button onClick={() => setPreset("water")} style={preset === "water" ? styles.subPillActive : styles.subPill}>Water (H₂O)</button>
            <button onClick={() => setPreset("benzene")} style={preset === "benzene" ? styles.subPillActive : styles.subPill}>Benzene Ring (C₆H₆)</button>
            <button onClick={() => setPreset("caffeine")} style={preset === "caffeine" ? styles.subPillActive : styles.subPill}>Caffeine Molecule</button>
          </>
        )}
        {category === "biotech" && (
          <>
            <button onClick={() => setPreset("dna")} style={preset === "dna" ? styles.subPillActive : styles.subPill}>DNA Double Helix</button>
            <button onClick={() => setPreset("virus")} style={preset === "virus" ? styles.subPillActive : styles.subPill}>Bacteriophage Virus</button>
          </>
        )}
        {category === "math" && (
          <>
            <button onClick={() => setPreset("surface")} style={preset === "surface" ? styles.subPillActive : styles.subPill}>3D Wave Surface</button>
            <button onClick={() => setPreset("lorenz")} style={preset === "lorenz" ? styles.subPillActive : styles.subPill}>Lorenz Chaos Attractor</button>
          </>
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

      {/* WebGL Canvas Viewport */}
      <div style={styles.canvasWrapper} ref={mountRef}>
        <div style={styles.hintOverlay}>
          🖱️ Click and drag to orbit in 3D • Scroll to zoom
        </div>
      </div>

      {/* Live Custom Script Playground Drawer */}
      {showCodeEditor && (
        <div style={styles.codeDrawer}>
          <div style={styles.codeHeader}>
            <span>LIVE SCIENTIFIC CODE PLAYGROUND (Three.js / WebGL / Canvas)</span>
            <button
              onClick={() => {
                try {
                  const runCode = new Function("scene", "camera", "renderer", "time", "THREE", customCode);
                  if (sceneRef.current && cameraRef.current && rendererRef.current) {
                    runCode(sceneRef.current, cameraRef.current, rendererRef.current, simTimeRef.current, THREE);
                  }
                } catch (err: any) {
                  alert("Simulation Script Error: " + err.message);
                }
              }}
              style={styles.runScriptBtn}
            >
              ▶ Execute Script
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
    backgroundColor: "#0B0F19",
    borderRadius: "10px",
    border: "1px solid #1E293B",
    overflow: "hidden",
    margin: "2rem 0",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
  },
  topBar: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.6rem 1rem",
    backgroundColor: "#0F172A",
    borderBottom: "1px solid #1E293B",
    gap: "0.6rem",
  },
  leftControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
    flexWrap: "wrap",
  },
  engineBadge: {
    fontSize: "0.75rem",
    fontWeight: 800,
    color: "#D1A751",
    letterSpacing: "0.06em",
    fontFamily: "var(--font-sans)",
  },
  categoryPills: {
    display: "flex",
    gap: "0.3rem",
    background: "#090D16",
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
    color: "#090D16",
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
    color: "#0F172A",
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
    backgroundColor: "#0B1120",
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
    width: "70px",
    cursor: "pointer",
  },
  canvasWrapper: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    cursor: "grab",
    minHeight: "420px",
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
  codeDrawer: {
    backgroundColor: "#030712",
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
  },
  runScriptBtn: {
    background: "#10B981",
    color: "#FFFFFF",
    border: "none",
    padding: "0.25rem 0.7rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    borderRadius: "4px",
    cursor: "pointer",
  },
  scriptTextarea: {
    width: "100%",
    height: "90px",
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    fontFamily: "'Fira Code', monospace",
    fontSize: "0.82rem",
    border: "1px solid #1E293B",
    borderRadius: "4px",
    padding: "0.5rem",
    outline: "none",
    resize: "vertical",
  },
};
