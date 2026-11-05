import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AutumnScene {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth;
    this.height = canvasContainer.clientHeight;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.defaultCameraPos = new THREE.Vector3(12, 6, 16);
    this.defaultTarget = new THREE.Vector3(0, -4.2, 0);
    this.camera.position.copy(this.defaultCameraPos);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.copy(this.defaultTarget);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go below ground
    this.controls.minDistance = 3;
    this.controls.maxDistance = 45;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.8;

    // State
    this.modelRoot = null;
    this.floatingIslands = [];
    this.lanternLight = null;
    this.fireflies = null;
    this.leavesMesh = null;
    this.leavesData = [];
    this.leafTexture = null;
    this.activePreset = 'golden';
    this.renderMode = 'vibrant';
    this.originalMaterials = new Map();

    // Hotspot positions in model world coordinates
    this.hotspots = [
      { id: 'sacred-tree', title: 'Sacred Autumn Maple', kanji: '神木', pos: new THREE.Vector3(0.34, -2.2, 4.38) },
      { id: 'tea-sanctuary', title: 'Matcha & Wagashi Bench', kanji: '茶席', pos: new THREE.Vector3(4.14, -4.1, 3.7) },
      { id: 'vermilion-bridge', title: 'Vermilion Arch Bridge', kanji: '太鼓橋', pos: new THREE.Vector3(1.83, -4.2, -1.33) },
      { id: 'moss-monument', title: 'Ancient Shinto Monument', kanji: '碑石', pos: new THREE.Vector3(-3.22, -4.2, 4.05) },
      { id: 'floating-isles', title: 'Levitating Sky Isles', kanji: '浮島', pos: new THREE.Vector3(-4.8, -3.2, -4.8) },
      { id: 'shoji-lantern', title: 'Twilight Shoji Lantern', kanji: '石灯篭', pos: new THREE.Vector3(0.27, -2.9, -4.1) }
    ];

    // Camera animation state
    this.camAnim = {
      active: false,
      startPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      startLook: new THREE.Vector3(),
      targetLook: new THREE.Vector3(),
      progress: 0,
      duration: 1.6
    };

    this.initLights();
    this.initEnvironment();
    this.initLeavesParticles();
    this.initFireflies();
    this.loadModel();

    window.addEventListener('resize', this.onResize.bind(this));
    this.animate();
  }

  initLights() {
    // Ambient / Hemisphere light
    this.hemiLight = new THREE.HemisphereLight(0xffeedd, 0x554433, 0.7);
    this.scene.add(this.hemiLight);

    // Main Autumn Sunlight (warm directional)
    this.sunLight = new THREE.DirectionalLight(0xffcaa0, 2.4);
    this.sunLight.position.set(15, 20, 12);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 60;
    this.sunLight.shadow.camera.left = -15;
    this.sunLight.shadow.camera.right = 15;
    this.sunLight.shadow.camera.top = 15;
    this.sunLight.shadow.camera.bottom = -15;
    this.sunLight.shadow.bias = -0.0003;
    this.scene.add(this.sunLight);

    // Soft sky rim light
    this.rimLight = new THREE.DirectionalLight(0xb4d4ff, 0.8);
    this.rimLight.position.set(-15, 10, -15);
    this.scene.add(this.rimLight);

    // Lantern point light (at the shoji lamp)
    this.lanternLight = new THREE.PointLight(0xff9933, 2.5, 9, 1.2);
    this.lanternLight.position.set(0.27, -3.1, -4.1);
    this.lanternLight.castShadow = true;
    this.scene.add(this.lanternLight);
  }

  initEnvironment() {
    // Autumn atmospheric fog
    this.scene.fog = new THREE.FogExp2(0xf5e9db, 0.016);
    this.scene.background = new THREE.Color(0xf5e9db);
  }

  createMapleLeafTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);

    ctx.save();
    ctx.translate(128, 142);

    // 1. Slender curved stem
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.quadraticCurveTo(-6, 75, -12, 106);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#4a220e';
    ctx.lineCap = 'round';
    ctx.stroke();

    // 2. Autumn Japanese Momiji 5-lobed Leaf Silhouette
    const grad = ctx.createRadialGradient(0, -10, 10, 0, -35, 115);
    grad.addColorStop(0, '#f5af38');    // Luminous amber golden center
    grad.addColorStop(0.35, '#e45020'); // Vibrant vermilion
    grad.addColorStop(0.72, '#ba2614'); // Deep Japanese crimson
    grad.addColorStop(1, '#7e1008');    // Deep russet tip

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 34);

    // Serrated bottom-left lobe
    ctx.quadraticCurveTo(-32, 28, -75, 18);
    ctx.lineTo(-68, 6);
    ctx.quadraticCurveTo(-45, 12, -40, -5);

    // Serrated mid-left lobe
    ctx.quadraticCurveTo(-70, -12, -98, -42);
    ctx.lineTo(-84, -48);
    ctx.quadraticCurveTo(-60, -38, -42, -50);

    // Serrated top center lobe
    ctx.quadraticCurveTo(-45, -82, 0, -122);
    ctx.quadraticCurveTo(45, -82, 42, -50);

    // Serrated mid-right lobe
    ctx.quadraticCurveTo(60, -38, 84, -48);
    ctx.lineTo(98, -42);
    ctx.quadraticCurveTo(70, -12, 40, -5);

    // Serrated bottom-right lobe
    ctx.quadraticCurveTo(45, 12, 68, 6);
    ctx.lineTo(75, 18);
    ctx.quadraticCurveTo(32, 28, 0, 34);

    ctx.closePath();
    ctx.fill();

    // 3. Delicate Leaf Veins
    ctx.strokeStyle = 'rgba(255, 235, 190, 0.55)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';

    // Central vein
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, -114);
    ctx.stroke();

    // Radiating branch veins
    ctx.lineWidth = 1.6;
    const sideVeins = [
      [-90, -40],
      [-70, 16],
      [90, -40],
      [70, 16]
    ];
    sideVeins.forEach(([vx, vy]) => {
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.quadraticCurveTo(vx * 0.42, vy * 0.42 - 5, vx, vy);
      ctx.stroke();
    });

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  initLeavesParticles(count = 32) {
    if (this.leavesMesh) {
      this.scene.remove(this.leavesMesh);
    }

    if (!this.leafTexture) {
      this.leafTexture = this.createMapleLeafTexture();
    }

    // Naturally curved geometry so the leaf feels organic, not like a flat block
    const geom = new THREE.PlaneGeometry(0.42, 0.42, 3, 3);
    const posAttr = geom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      // Subtle natural cup curl of a fallen dry autumn maple leaf
      const curl = (x * x * 0.35) - (y * y * 0.22);
      posAttr.setZ(i, curl);
    }
    geom.computeVertexNormals();

    const leafColors = [
      new THREE.Color(0xd64527), // Vermilion Red
      new THREE.Color(0xef8924), // Vibrant Amber
      new THREE.Color(0xb23118), // Deep Crimson
      new THREE.Color(0xf5b03b), // Ginkgo Golden
      new THREE.Color(0x9a3818)  // Russet Ochre
    ];

    const mat = new THREE.MeshStandardMaterial({
      map: this.leafTexture,
      transparent: true,
      alphaTest: 0.12,
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.leavesMesh = new THREE.InstancedMesh(geom, mat, count);
    this.leavesMesh.castShadow = true;

    this.leavesData = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Gentle sparse distribution clustered around the sacred maple tree & sanctuary
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        Math.random() * 8 + 0.5,
        (Math.random() - 0.5) * 14
      );

      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const scale = 0.85 + Math.random() * 0.35;
      dummy.position.copy(pos);
      dummy.rotation.copy(rot);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();

      this.leavesMesh.setMatrixAt(i, dummy.matrix);
      const color = leafColors[Math.floor(Math.random() * leafColors.length)];
      this.leavesMesh.setColorAt(i, color);

      this.leavesData.push({
        pos,
        rot,
        scale,
        speedY: 0.006 + Math.random() * 0.009, // Serene, slow graceful drift
        swaySpeed: 0.8 + Math.random() * 1.2,
        tumbleSpeed: 1.0 + Math.random() * 1.4,
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.02,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.leavesMesh.instanceMatrix.needsUpdate = true;
    if (this.leavesMesh.instanceColor) this.leavesMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.leavesMesh);
  }

  initFireflies() {
    const fireflyCount = 70;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(fireflyCount * 3);
    this.fireflyOrigins = [];

    for (let i = 0; i < fireflyCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = -5 + Math.random() * 4;
      const z = (Math.random() - 0.5) * 16;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      this.fireflyOrigins.push({ x, y, z, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffd970,
      size: 0.14,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    this.fireflies = new THREE.Points(geom, mat);
    this.scene.add(this.fireflies);
  }

  loadModel() {
    const loader = new GLTFLoader();
    const loadingElem = document.getElementById('scene-loader');

    loader.load(
      '/autumnal_islands.glb',
      (gltf) => {
        this.modelRoot = gltf.scene;
        this.applyCustomMaterials(this.modelRoot);
        this.scene.add(this.modelRoot);

        // Find floating islands for harmonic levitation
        this.modelRoot.traverse((node) => {
          if (node.name && node.name.startsWith('Floating')) {
            this.floatingIslands.push({
              node,
              baseY: node.position.y,
              phase: Math.random() * Math.PI * 2,
              speed: 0.8 + Math.random() * 0.5,
              amplitude: 0.08 + Math.random() * 0.08
            });
          }
        });

        if (loadingElem) {
          loadingElem.classList.add('fade-out');
          setTimeout(() => loadingElem.style.display = 'none', 600);
        }
      },
      (xhr) => {
        if (loadingElem && xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          const bar = document.getElementById('loader-progress');
          const txt = document.getElementById('loader-percent');
          if (bar) bar.style.width = `${percent}%`;
          if (txt) txt.textContent = `${percent}%`;
        }
      },
      (error) => {
        console.error('Error loading glTF model:', error);
      }
    );
  }

  applyCustomMaterials(root) {
    // PBR Autumn Material Definitions
    const materials = {
      mapleRed: new THREE.MeshStandardMaterial({
        color: 0xc23b22,
        roughness: 0.55,
        metalness: 0.05
      }),
      mapleAmber: new THREE.MeshStandardMaterial({
        color: 0xe58b24,
        roughness: 0.58,
        metalness: 0.05
      }),
      mapleGold: new THREE.MeshStandardMaterial({
        color: 0xf3a738,
        roughness: 0.5,
        metalness: 0.05
      }),
      cedarBark: new THREE.MeshStandardMaterial({
        color: 0x4a3224,
        roughness: 0.88,
        metalness: 0.02
      }),
      ancientStone: new THREE.MeshStandardMaterial({
        color: 0x616a65,
        roughness: 0.85,
        metalness: 0.05
      }),
      mossStone: new THREE.MeshStandardMaterial({
        color: 0x535b49,
        roughness: 0.9,
        metalness: 0.02
      }),
      autumnGrass: new THREE.MeshStandardMaterial({
        color: 0x7a843b,
        roughness: 0.75,
        metalness: 0.02
      }),
      islandEarth: new THREE.MeshStandardMaterial({
        color: 0x4e443b,
        roughness: 0.92,
        metalness: 0.02
      }),
      vermilionBridge: new THREE.MeshStandardMaterial({
        color: 0xb53523,
        roughness: 0.45,
        metalness: 0.1
      }),
      bridgeWoodPlanks: new THREE.MeshStandardMaterial({
        color: 0x4b3121,
        roughness: 0.82,
        metalness: 0.05
      }),
      benchWood: new THREE.MeshStandardMaterial({
        color: 0x9b6b43,
        roughness: 0.65,
        metalness: 0.08
      }),
      darkMetal: new THREE.MeshStandardMaterial({
        color: 0x24272a,
        roughness: 0.4,
        metalness: 0.7
      }),
      matchaTea: new THREE.MeshStandardMaterial({
        color: 0x4e7021,
        roughness: 0.25,
        metalness: 0.1
      }),
      teaBowlStoneware: new THREE.MeshStandardMaterial({
        color: 0x2b2725,
        roughness: 0.5,
        metalness: 0.15
      }),
      wagashiCake: new THREE.MeshStandardMaterial({
        color: 0xf5ebd7,
        roughness: 0.7,
        metalness: 0.02
      }),
      wagashiFilling: new THREE.MeshStandardMaterial({
        color: 0x773d2a,
        roughness: 0.6,
        metalness: 0.02
      }),
      lanternLattice: new THREE.MeshStandardMaterial({
        color: 0x2c1f19,
        roughness: 0.7,
        metalness: 0.1
      }),
      lanternGlow: new THREE.MeshStandardMaterial({
        color: 0xffe6a3,
        emissive: 0xff9433,
        emissiveIntensity: 1.8,
        roughness: 0.3
      }),
      mushroomCap: new THREE.MeshStandardMaterial({
        color: 0xc83626,
        roughness: 0.5
      }),
      mushroomStem: new THREE.MeshStandardMaterial({
        color: 0xf0e9db,
        roughness: 0.7
      }),
      woodLogs: new THREE.MeshStandardMaterial({
        color: 0x6e5241,
        roughness: 0.85
      })
    };

    root.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        // Determine matching material based on node or parent names
        const name = (node.name || '').toLowerCase();
        let parentName = '';
        let grandParentName = '';
        if (node.parent) {
          parentName = (node.parent.name || '').toLowerCase();
          if (node.parent.parent) grandParentName = (node.parent.parent.name || '').toLowerCase();
        }

        const lineage = `${name} ${parentName} ${grandParentName}`;
        let assignedMat = materials.autumnGrass;

        if (lineage.includes('matcha') || lineage.includes('tea')) {
          if (name.includes('ellipse')) {
            assignedMat = materials.matchaTea;
          } else {
            assignedMat = materials.teaBowlStoneware;
          }
        } else if (lineage.includes('cake')) {
          if (name.includes('cylinder 36') || name.includes('cylinder 35')) {
            assignedMat = materials.wagashiFilling;
          } else {
            assignedMat = materials.wagashiCake;
          }
        } else if (lineage.includes('bench')) {
          if (name.includes('matel')) {
            assignedMat = materials.darkMetal;
          } else {
            assignedMat = materials.benchWood;
          }
        } else if (lineage.includes('lamp') || lineage.includes('light')) {
          if (name.includes('light') || name.includes('cube 21')) {
            assignedMat = materials.lanternGlow;
          } else {
            assignedMat = materials.lanternLattice;
          }
        } else if (lineage.includes('main tree') || lineage.includes('leaf') || lineage.includes('dodecahedron')) {
          if (lineage.includes('trunk')) {
            assignedMat = materials.cedarBark;
          } else if (name.includes('dodecahedron 4') || name.includes('dodecahedron 2')) {
            assignedMat = materials.mapleRed;
          } else if (name.includes('dodecahedron 3')) {
            assignedMat = materials.mapleAmber;
          } else if (name.includes('dodecahedron')) {
            assignedMat = materials.mapleGold;
          } else {
            assignedMat = materials.mapleRed;
          }
        } else if (lineage.includes('trunk') || lineage.includes('tree no leaf') || lineage.includes('broken tree')) {
          assignedMat = materials.cedarBark;
        } else if (lineage.includes('bridge')) {
          if (name.includes('arch')) {
            assignedMat = materials.vermilionBridge;
          } else {
            assignedMat = materials.bridgeWoodPlanks;
          }
        } else if (lineage.includes('monument') || lineage.includes('steps') || lineage.includes('stone')) {
          assignedMat = materials.ancientStone;
        } else if (lineage.includes('rocks')) {
          assignedMat = materials.ancientStone;
        } else if (lineage.includes('log') || lineage.includes('wood pile')) {
          assignedMat = materials.woodLogs;
        } else if (lineage.includes('mushroom')) {
          if (name.includes('cylinder') || name.includes('cube 2') || name.includes('cube 16')) {
            assignedMat = materials.mushroomCap;
          } else {
            assignedMat = materials.mushroomStem;
          }
        } else if (lineage.includes('grass') || lineage.includes('gress')) {
          assignedMat = materials.autumnGrass;
        } else if (lineage.includes('floor') || lineage.includes('floating')) {
          assignedMat = materials.islandEarth;
        } else if (lineage.includes('vine')) {
          assignedMat = materials.autumnGrass;
        }

        this.originalMaterials.set(node, assignedMat);
        node.material = assignedMat;
      }
    });
  }

  setTimePreset(preset) {
    this.activePreset = preset;
    const presets = {
      golden: {
        bg: 0xf6ecd9,
        fog: 0xf6ecd9,
        fogDensity: 0.015,
        sunColor: 0xffcb97,
        sunIntensity: 2.5,
        sunPos: [15, 20, 12],
        hemiSky: 0xffeedd,
        hemiGround: 0x5a4430,
        hemiIntensity: 0.75,
        lanternIntensity: 1.6,
        exposure: 1.15,
        firefliesOpacity: 0
      },
      sunset: {
        bg: 0xdd7d64,
        fog: 0xdd7d64,
        fogDensity: 0.018,
        sunColor: 0xff6b35,
        sunIntensity: 2.2,
        sunPos: [20, 8, -10],
        hemiSky: 0xfa9d75,
        hemiGround: 0x3d2018,
        hemiIntensity: 0.6,
        lanternIntensity: 3.5,
        exposure: 1.05,
        firefliesOpacity: 0.3
      },
      night: {
        bg: 0x0f1524,
        fog: 0x0f1524,
        fogDensity: 0.024,
        sunColor: 0x768fbf, // moonlight
        sunIntensity: 0.7,
        sunPos: [-12, 18, -12],
        hemiSky: 0x22314e,
        hemiGround: 0x090c12,
        hemiIntensity: 0.35,
        lanternIntensity: 4.8,
        exposure: 0.95,
        firefliesOpacity: 0.85
      },
      dawn: {
        bg: 0xe8e4ec,
        fog: 0xe8e4ec,
        fogDensity: 0.02,
        sunColor: 0xffe2c7,
        sunIntensity: 1.8,
        sunPos: [16, 12, 16],
        hemiSky: 0xe6e0f2,
        hemiGround: 0x484252,
        hemiIntensity: 0.6,
        lanternIntensity: 2.0,
        exposure: 1.1,
        firefliesOpacity: 0.1
      }
    };

    const cfg = presets[preset] || presets.golden;

    this.scene.background.setHex(cfg.bg);
    this.scene.fog.color.setHex(cfg.fog);
    this.scene.fog.density = cfg.fogDensity;

    this.sunLight.color.setHex(cfg.sunColor);
    this.sunLight.intensity = cfg.sunIntensity;
    this.sunLight.position.set(...cfg.sunPos);

    this.hemiLight.color.setHex(cfg.hemiSky);
    this.hemiLight.groundColor.setHex(cfg.hemiGround);
    this.hemiLight.intensity = cfg.hemiIntensity;

    if (this.lanternLight) {
      this.lanternLight.intensity = cfg.lanternIntensity;
    }

    if (this.fireflies) {
      this.fireflies.material.opacity = cfg.firefliesOpacity;
    }

    this.renderer.toneMappingExposure = cfg.exposure;
  }

  setRenderMode(mode) {
    this.renderMode = mode;
    if (!this.modelRoot) return;

    const clayMat = new THREE.MeshStandardMaterial({
      color: 0xdfd3c3,
      roughness: 0.9,
      metalness: 0.05
    });

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xca6834,
      wireframe: true
    });

    const cyberMat = new THREE.MeshStandardMaterial({
      color: 0x181c2e,
      roughness: 0.4,
      metalness: 0.8,
      wireframe: false
    });

    this.modelRoot.traverse((node) => {
      if (node.isMesh) {
        if (mode === 'clay') {
          node.material = clayMat;
        } else if (mode === 'wireframe') {
          node.material = wireMat;
        } else if (mode === 'cyber') {
          node.material = cyberMat;
        } else {
          // restore vibrant
          const original = this.originalMaterials.get(node);
          if (original) node.material = original;
        }
      }
    });
  }

  setLeafDensity(density) {
    // 6 to 60 leaves max (keeps it calm and few)
    const count = Math.max(6, Math.floor(density * 60));
    this.initLeavesParticles(count);
  }

  flyTo(pos, lookTarget, duration = 1.6) {
    this.camAnim.active = true;
    this.camAnim.startPos.copy(this.camera.position);
    this.camAnim.targetPos.copy(pos);
    this.camAnim.startLook.copy(this.controls.target);
    this.camAnim.targetLook.copy(lookTarget);
    this.camAnim.progress = 0;
    this.camAnim.duration = duration;
  }

  flyToHotspot(id) {
    const spot = this.hotspots.find(h => h.id === id);
    if (!spot) return;

    // Determine nice offset camera angle per hotspot
    let camOffset = new THREE.Vector3(4, 2.5, 4);
    if (id === 'sacred-tree') {
      camOffset = new THREE.Vector3(3.8, 2.2, 5.2);
    } else if (id === 'tea-sanctuary') {
      camOffset = new THREE.Vector3(1.8, 1.4, 2.4);
    } else if (id === 'vermilion-bridge') {
      camOffset = new THREE.Vector3(3.2, 2.0, 2.8);
    } else if (id === 'moss-monument') {
      camOffset = new THREE.Vector3(-2.5, 1.8, 3.2);
    } else if (id === 'floating-isles') {
      camOffset = new THREE.Vector3(-4.5, 2.5, 4.0);
    } else if (id === 'shoji-lantern') {
      camOffset = new THREE.Vector3(2.2, 1.2, 2.2);
    }

    const camTargetPos = spot.pos.clone().add(camOffset);
    this.flyTo(camTargetPos, spot.pos);
  }

  resetCamera() {
    this.flyTo(this.defaultCameraPos, this.defaultTarget);
  }

  getHotspotScreenCoords() {
    return this.hotspots.map(h => {
      const v = h.pos.clone();
      v.project(this.camera);

      // Check if behind camera
      const isVisible = v.z < 1;
      const x = (v.x * 0.5 + 0.5) * this.width;
      const y = (-(v.y * 0.5) + 0.5) * this.height;

      return {
        ...h,
        screenX: x,
        screenY: y,
        isVisible
      };
    });
  }

  captureSnapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  onResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Floating islands harmonic levitation
    for (let i = 0; i < this.floatingIslands.length; i++) {
      const item = this.floatingIslands[i];
      const offset = Math.sin(elapsedTime * item.speed + item.phase) * item.amplitude;
      item.node.position.y = item.baseY + offset;
    }

    // 2. Shoji Lantern subtle flame flicker
    if (this.lanternLight) {
      const flicker = Math.sin(elapsedTime * 8) * 0.15 + Math.cos(elapsedTime * 13) * 0.1;
      const baseIntensity = this.activePreset === 'night' ? 4.8 : (this.activePreset === 'sunset' ? 3.5 : 1.6);
      this.lanternLight.intensity = Math.max(0.2, baseIntensity + flicker);
    }

    // 3. Falling Leaves Particle Physics (Realistic Aerodynamic Flutter)
    if (this.leavesMesh && this.leavesData.length > 0) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.leavesData.length; i++) {
        const d = this.leavesData[i];

        // Graceful downward drift
        d.pos.y -= d.speedY;

        // Realistic horizontal air resistance sway
        d.pos.x += Math.sin(elapsedTime * d.swaySpeed + d.phase) * 0.008;
        d.pos.z += Math.cos(elapsedTime * d.swaySpeed * 0.75 + d.phase) * 0.006;

        // Subtle aerodynamic tumbling & rocking
        d.rot.x += d.rotSpeedX;
        d.rot.y += d.rotSpeedY;
        const rock = Math.sin(elapsedTime * d.tumbleSpeed + d.phase) * 0.45;

        // Respawn smoothly if drifted below the island base
        if (d.pos.y < -7.5) {
          d.pos.y = 5.5 + Math.random() * 3.5;
          d.pos.x = (Math.random() - 0.5) * 12;
          d.pos.z = (Math.random() - 0.5) * 12;
        }

        dummy.position.copy(d.pos);
        dummy.rotation.set(d.rot.x, d.rot.y, rock);
        dummy.scale.set(d.scale, d.scale, d.scale);
        dummy.updateMatrix();

        this.leavesMesh.setMatrixAt(i, dummy.matrix);
      }
      this.leavesMesh.instanceMatrix.needsUpdate = true;
    }

    // 4. Night Fireflies animation
    if (this.fireflies && this.fireflyOrigins && this.fireflies.material.opacity > 0.05) {
      const posAttr = this.fireflies.geometry.attributes.position;
      for (let i = 0; i < this.fireflyOrigins.length; i++) {
        const orig = this.fireflyOrigins[i];
        const nx = orig.x + Math.sin(elapsedTime * orig.speed + orig.phase) * 0.8;
        const ny = orig.y + Math.cos(elapsedTime * orig.speed * 1.3 + orig.phase) * 0.5;
        const nz = orig.z + Math.sin(elapsedTime * orig.speed * 0.7 + orig.phase) * 0.8;
        posAttr.setXYZ(i, nx, ny, nz);
      }
      posAttr.needsUpdate = true;
    }

    // 5. Camera Flight Interpolation
    if (this.camAnim.active) {
      this.camAnim.progress += delta / this.camAnim.duration;
      if (this.camAnim.progress >= 1) {
        this.camAnim.progress = 1;
        this.camAnim.active = false;
        this.camera.position.copy(this.camAnim.targetPos);
        this.controls.target.copy(this.camAnim.targetLook);
      } else {
        // Smooth cubic ease-in-out
        const t = this.camAnim.progress;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        this.camera.position.lerpVectors(this.camAnim.startPos, this.camAnim.targetPos, ease);
        this.controls.target.lerpVectors(this.camAnim.startLook, this.camAnim.targetLook, ease);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    // Notify hotspot listeners
    if (this.onFrame) {
      this.onFrame();
    }
  }
}
