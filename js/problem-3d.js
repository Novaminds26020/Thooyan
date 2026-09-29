/**
 * NOVAMINDS — PROBLEM WE IDENTIFIED
 * Cinematic Interactive 3D Problem Demonstration Engine
 * 
 * 3-Stage Visual Story:
 * STAGE 1: INFECTION & SHARPS HAZARDS (Manual handling exposure, risk zone, biohazard sharps)
 * STAGE 2: HUMAN ERROR & MIXING (Wrong bag in wrong bin, improper sorting, cross-contamination)
 * STAGE 3: TRACEABILITY & COMPLIANCE GAPS (Disconnected ward records, missing audit trail)
 */

(function () {
  'use strict';

  // DOM Elements
  const wrapper = document.getElementById('problem3dWrapper');
  const canvasContainer = document.getElementById('problemCanvasContainer');
  const canvas = document.getElementById('problem3dCanvas');
  if (!wrapper || !canvasContainer || !canvas) return;

  // UI HUD Elements
  const stageBadgeText = document.getElementById('problemStageBadgeText');
  const stageSubText = document.getElementById('problemStageSub');
  const timelineFill = document.getElementById('problemTimelineFill');
  const calloutEl = document.getElementById('problemFloatingCallout');
  const calloutTitle = document.getElementById('calloutTitle');
  const calloutSub = document.getElementById('calloutSub');
  const calloutIcon = document.getElementById('calloutIcon');

  // Control Buttons & Tabs
  const btnPlayPause = document.getElementById('problemBtnPlayPause');
  const iconPlay = document.getElementById('problemPlayIcon');
  const iconPause = document.getElementById('problemPauseIcon');
  const textPlayPause = document.getElementById('problemPlayPauseText');
  const btnReset = document.getElementById('problemBtnReset');
  const tabBtns = [
    document.getElementById('problemTab1'),
    document.getElementById('problemTab2'),
    document.getElementById('problemTab3')
  ];

  // 3D Scene Core
  let scene, camera, renderer, controls;
  const clock = new THREE.Clock();

  // Scene Stage Groups
  const environmentGroup = new THREE.Group();
  const stage1Group = new THREE.Group();
  const stage2Group = new THREE.Group();
  const stage3Group = new THREE.Group();
  const particlesGroup = new THREE.Group();

  // Animation State
  let isPlaying = true;
  let animTime = 0.0;
  const TOTAL_CYCLE = 17.5;
  let currentStage = 1;

  // Motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    isPlaying = false;
  }

  // Camera Target Interpolations
  const cameraPositions = {
    stage1: new THREE.Vector3(-1.8, 2.4, 5.2),
    stage2: new THREE.Vector3(0.0, 2.8, 5.5),
    stage3: new THREE.Vector3(1.8, 2.5, 5.4),
    default: new THREE.Vector3(0.0, 2.6, 5.5)
  };

  const cameraTargets = {
    stage1: new THREE.Vector3(-1.4, 1.1, 0.0),
    stage2: new THREE.Vector3(0.0, 1.0, 0.0),
    stage3: new THREE.Vector3(1.4, 1.1, 0.0),
    default: new THREE.Vector3(0.0, 1.0, 0.0)
  };

  let targetCamPos = cameraPositions.stage1.clone();
  let targetCamLook = cameraTargets.stage1.clone();

  // Stage Specific Interactive Objects
  let hazardFloorRing, warningBadgeGroup, workerGroup, sharpsBinMesh;
  let mixedBins = [], fallingWasteItems = [], mixingAlertRing;
  let wardStations = [], movingWasteCart, auditSlateGroup;
  let warningParticles = [];

  // ==========================================================================
  // 1. INITIALIZATION & SETUP
  // ==========================================================================
  function init() {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f6fb);
    scene.fog = new THREE.FogExp2(0xf1f6fb, 0.06);

    // 2. Camera
    const aspect = canvasContainer.clientWidth / (canvasContainer.clientHeight || 380);
    camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 50);
    camera.position.copy(cameraPositions.stage1);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight || 380);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // 4. OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.5;
    controls.maxDistance = 8.5;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.target.copy(cameraTargets.stage1);

    // 5. Lighting
    setupLighting();

    // 6. Build 3D Models
    buildEnvironment();
    buildStage1Infection();
    buildStage2HumanError();
    buildStage3Traceability();
    buildWarningParticles();

    // Add groups to scene
    scene.add(environmentGroup);
    scene.add(stage1Group);
    scene.add(stage2Group);
    scene.add(stage3Group);
    scene.add(particlesGroup);

    // 7. Event Listeners
    setupEvents();

    // 8. Update initial UI
    updateUIStage(1);

    // 9. Start Animation Loop
    animate();
  }

  // ==========================================================================
  // 2. LIGHTING RIG
  // ==========================================================================
  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainKeyLight.position.set(4, 8, 6);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.camera.near = 0.5;
    mainKeyLight.shadow.camera.far = 20;
    mainKeyLight.shadow.camera.left = -5;
    mainKeyLight.shadow.camera.right = 5;
    mainKeyLight.shadow.camera.top = 5;
    mainKeyLight.shadow.camera.bottom = -5;
    mainKeyLight.shadow.bias = -0.0005;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-5, 4, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x20c7e8, 0.45);
    rimLight.position.set(0, -2, -6);
    scene.add(rimLight);

    // Warm warning hazard accent light
    const hazardPointLight = new THREE.PointLight(0xe63946, 0.6, 6);
    hazardPointLight.position.set(-1.4, 1.8, 0.5);
    scene.add(hazardPointLight);
  }

  // ==========================================================================
  // 3. 3D HOSPITAL ENVIRONMENT
  // ==========================================================================
  function buildEnvironment() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe8f0f8,
      roughness: 0.25,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    environmentGroup.add(floor);

    // Subtle Hospital Floor Grid Lines
    const gridHelper = new THREE.GridHelper(20, 20, 0xb0cce5, 0xd4e4f2);
    gridHelper.position.y = 0.005;
    environmentGroup.add(gridHelper);

    // Back Hospital Wall
    const wallGeo = new THREE.BoxGeometry(24, 6, 0.3);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xf4f8fc,
      roughness: 0.4
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 3, -3.2);
    wall.receiveShadow = true;
    environmentGroup.add(wall);

    // Wall Architectural Cyan LED Strip
    const ledGeo = new THREE.BoxGeometry(24, 0.08, 0.05);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x20c7e8 });
    const ledStrip = new THREE.Mesh(ledGeo, ledMat);
    ledStrip.position.set(0, 1.8, -3.02);
    environmentGroup.add(ledStrip);

    // Baseboard Kickplate
    const baseboardGeo = new THREE.BoxGeometry(24, 0.25, 0.06);
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x0b3b73, roughness: 0.3 });
    const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboard.position.set(0, 0.125, -3.02);
    environmentGroup.add(baseboard);
  }

  // ==========================================================================
  // 4. STAGE 1: INFECTION & SHARPS HAZARDS
  // ==========================================================================
  function buildStage1Infection() {
    stage1Group.position.set(-1.4, 0, 0);

    // 1. Biomedical Yellow Sharps Waste Trolley & Bin
    const binGroup = new THREE.Group();

    // Trolley base
    const trolleyBaseGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.08, 24);
    const trolleyBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });
    const trolleyBase = new THREE.Mesh(trolleyBaseGeo, trolleyBaseMat);
    trolleyBase.position.y = 0.06;
    trolleyBase.castShadow = true;
    binGroup.add(trolleyBase);

    // 4 Small Casters
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(Math.cos(angle) * 0.42, 0.04, Math.sin(angle) * 0.42);
      binGroup.add(wheel);
    }

    // Yellow Infectious Waste Container Body
    const binBodyGeo = new THREE.CylinderGeometry(0.42, 0.36, 0.95, 24);
    const binBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.1
    });
    sharpsBinMesh = new THREE.Mesh(binBodyGeo, binBodyMat);
    sharpsBinMesh.position.y = 0.55;
    sharpsBinMesh.castShadow = true;
    binGroup.add(sharpsBinMesh);

    // Bin Lid / Pedal Aperture
    const lidGeo = new THREE.CylinderGeometry(0.45, 0.43, 0.1, 24);
    const lidMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 1.05;
    binGroup.add(lid);

    // Biohazard symbol badge on bin (stylized ring with 3 dots)
    const badgeGeo = new THREE.RingGeometry(0.08, 0.14, 16);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const bioBadge = new THREE.Mesh(badgeGeo, badgeMat);
    bioBadge.position.set(0, 0.62, 0.42);
    binGroup.add(bioBadge);

    // Translucent Sharp Container on side holder
    const sharpsBoxGeo = new THREE.BoxGeometry(0.3, 0.38, 0.25);
    const sharpsBoxMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85,
      roughness: 0.2
    });
    const sharpsBox = new THREE.Mesh(sharpsBoxGeo, sharpsBoxMat);
    sharpsBox.position.set(0.45, 0.65, 0.1);
    sharpsBox.castShadow = true;
    binGroup.add(sharpsBox);

    // Abstract sharps (stylized safe plastic syringe body / vial representation)
    const syringeCasingGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12);
    const syringeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 });
    const syringe1 = new THREE.Mesh(syringeCasingGeo, syringeMat);
    syringe1.position.set(0.45, 0.82, 0.1);
    syringe1.rotation.z = 0.2;
    binGroup.add(syringe1);

    stage1Group.add(binGroup);

    // 2. Stylized Healthcare/Sanitation Worker Silhouette Model
    workerGroup = new THREE.Group();
    workerGroup.position.set(-0.9, 0, 0.5);

    // Worker Body (Clean minimalist medical scrub silhouette)
    const workerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Medical Teal / Blue Scrubs
      roughness: 0.5
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.6
    });

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.85, 12);
    const leftLeg = new THREE.Mesh(legGeo, workerMat);
    leftLeg.position.set(-0.12, 0.425, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeo, workerMat);
    rightLeg.position.set(0.12, 0.425, 0);
    rightLeg.castShadow = true;
    workerGroup.add(leftLeg, rightLeg);

    // Torso / Lab coat / Scrubs
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.65, 0.24);
    const torso = new THREE.Mesh(torsoGeo, workerMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    workerGroup.add(torso);

    // Head with surgical mask cap
    const headGeo = new THREE.SphereGeometry(0.13, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.62;
    workerGroup.add(head);

    const capGeo = new THREE.SphereGeometry(0.135, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.63;
    workerGroup.add(cap);

    // Extended Arms reaching towards waste container (representing manual exposure)
    const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.55, 12);
    const leftArm = new THREE.Mesh(armGeo, workerMat);
    leftArm.position.set(0.24, 1.25, 0.15);
    leftArm.rotation.x = -Math.PI / 4;
    leftArm.rotation.z = -Math.PI / 6;
    workerGroup.add(leftArm);

    // Glove (yellow nitrile glove silhouette)
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const handGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const hand = new THREE.Mesh(handGeo, gloveMat);
    hand.position.set(0.38, 1.05, 0.35);
    workerGroup.add(hand);

    stage1Group.add(workerGroup);

    // 3. Pulsing 3D Hazard Risk Ring on Floor
    const hazardRingGeo = new THREE.RingGeometry(0.9, 1.15, 32);
    const hazardRingMat = new THREE.MeshBasicMaterial({
      color: 0xe63946,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    hazardFloorRing = new THREE.Mesh(hazardRingGeo, hazardRingMat);
    hazardFloorRing.rotation.x = -Math.PI / 2;
    hazardFloorRing.position.set(0, 0.015, 0);
    stage1Group.add(hazardFloorRing);

    // Outer dashed boundary ring
    const outerRingGeo = new THREE.RingGeometry(1.3, 1.34, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0xf4a261,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.set(0, 0.012, 0);
    stage1Group.add(outerRing);

    // 4. Floating 3D Warning Beacon / Holographic Badge
    warningBadgeGroup = new THREE.Group();
    warningBadgeGroup.position.set(0, 1.7, 0);

    const triangleShape = new THREE.Shape();
    triangleShape.moveTo(-0.24, -0.2);
    triangleShape.lineTo(0.24, -0.2);
    triangleShape.lineTo(0, 0.24);
    triangleShape.closePath();

    const triangleGeo = new THREE.ShapeGeometry(triangleShape);
    const triangleMat = new THREE.MeshBasicMaterial({
      color: 0xe63946,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const triangleMesh = new THREE.Mesh(triangleGeo, triangleMat);
    warningBadgeGroup.add(triangleMesh);

    // Inner Exclamation Mark
    const exclGeo = new THREE.BoxGeometry(0.04, 0.16, 0.02);
    const exclMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const exclMesh = new THREE.Mesh(exclGeo, exclMat);
    exclMesh.position.set(0, 0.03, 0.02);
    warningBadgeGroup.add(exclMesh);

    const dotGeo = new THREE.SphereGeometry(0.025, 12, 12);
    const dotMesh = new THREE.Mesh(dotGeo, exclMat);
    dotMesh.position.set(0, -0.11, 0.02);
    warningBadgeGroup.add(dotMesh);

    stage1Group.add(warningBadgeGroup);
  }

  // ==========================================================================
  // 5. STAGE 2: HUMAN ERROR & MIXING
  // ==========================================================================
  function buildStage2HumanError() {
    stage2Group.position.set(0, 0, 0);

    // 1. Central Common Waste Sorting Container
    const mainBinGroup = new THREE.Group();
    mainBinGroup.position.set(0, 0, 0);

    const mainBinGeo = new THREE.CylinderGeometry(0.65, 0.55, 1.0, 24);
    const mainBinMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Grey common bin
      roughness: 0.4,
      metalness: 0.2
    });
    const mainBin = new THREE.Mesh(mainBinGeo, mainBinMat);
    mainBin.position.y = 0.5;
    mainBin.castShadow = true;
    mainBinGroup.add(mainBin);

    // Rim of common bin
    const binRimGeo = new THREE.TorusGeometry(0.65, 0.04, 12, 24);
    const binRimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const binRim = new THREE.Mesh(binRimGeo, binRimMat);
    binRim.rotation.x = Math.PI / 2;
    binRim.position.y = 1.0;
    mainBinGroup.add(binRim);

    stage2Group.add(mainBinGroup);

    // 2. 4 Surrounding Categorized Colored Bins / Bags (Yellow, Red, Blue, Black)
    const binCategories = [
      { color: 0xf59e0b, label: 'YELLOW', pos: [-0.95, 0, -0.6] }, // Anatomical / Soiled
      { color: 0xef4444, label: 'RED', pos: [0.95, 0, -0.6] },    // Contaminated Plastic
      { color: 0x3b82f6, label: 'BLUE', pos: [-0.95, 0, 0.6] },   // Glass / Vials
      { color: 0x1e293b, label: 'BLACK', pos: [0.95, 0, 0.6] }    // General Waste
    ];

    binCategories.forEach((cat) => {
      const catBinGroup = new THREE.Group();
      catBinGroup.position.set(cat.pos[0], 0, cat.pos[2]);

      const catBodyGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.65, 16);
      const catBodyMat = new THREE.MeshStandardMaterial({
        color: cat.color,
        roughness: 0.35
      });
      const catBody = new THREE.Mesh(catBodyGeo, catBodyMat);
      catBody.position.y = 0.325;
      catBody.castShadow = true;
      catBinGroup.add(catBody);

      // Color cap
      const capGeo = new THREE.CylinderGeometry(0.28, 0.27, 0.06, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.66;
      catBinGroup.add(cap);

      stage2Group.add(catBinGroup);
      mixedBins.push(catBinGroup);
    });

    // 3. Falling Mixed Items (Illustrating Wrong Item into Wrong Bin Error)
    const itemColors = [0xef4444, 0xf59e0b, 0x3b82f6]; // Red and Yellow bags falling into wrong place
    for (let i = 0; i < 3; i++) {
      const itemGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const itemMat = new THREE.MeshStandardMaterial({
        color: itemColors[i],
        roughness: 0.3
      });
      const itemMesh = new THREE.Mesh(itemGeo, itemMat);
      itemMesh.castShadow = true;
      itemMesh.position.set(
        (i - 1) * 0.22,
        1.3 + i * 0.3,
        (i % 2 === 0 ? 0.1 : -0.1)
      );
      stage2Group.add(itemMesh);
      fallingWasteItems.push({
        mesh: itemMesh,
        baseY: 1.2 + i * 0.35,
        speed: 1.2 + i * 0.4
      });
    }

    // 4. Mixing Alert Warning Ring
    const mixingRingGeo = new THREE.RingGeometry(0.75, 0.88, 32);
    const mixingRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    mixingAlertRing = new THREE.Mesh(mixingRingGeo, mixingRingMat);
    mixingAlertRing.rotation.x = -Math.PI / 2;
    mixingAlertRing.position.set(0, 0.02, 0);
    stage2Group.add(mixingAlertRing);
  }

  // ==========================================================================
  // 6. STAGE 3: TRACEABILITY & COMPLIANCE GAPS
  // ==========================================================================
  function buildStage3Traceability() {
    stage3Group.position.set(1.4, 0, 0);

    // 1. Three Ward Checkpoint Pillars (Ward A, Ward B, Ward C)
    const wardPositions = [
      { x: -0.9, z: -0.6, name: 'WARD A' },
      { x: 0.0, z: 0.5, name: 'WARD B' },
      { x: 0.9, z: -0.6, name: 'WARD C' }
    ];

    wardPositions.forEach((wp) => {
      const stationGroup = new THREE.Group();
      stationGroup.position.set(wp.x, 0, wp.z);

      // Station Base Post
      const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.9, 16);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.3 });
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.45;
      post.castShadow = true;
      stationGroup.add(post);

      // Digital Sign / Terminal
      const terminalGeo = new THREE.BoxGeometry(0.35, 0.24, 0.08);
      const terminalMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
      const term = new THREE.Mesh(terminalGeo, terminalMat);
      term.position.y = 0.95;
      stationGroup.add(term);

      // Red unverified status indicator LED on terminal
      const ledGeo = new THREE.SphereGeometry(0.04, 12, 12);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0.11, 0.98, 0.05);
      stationGroup.add(led);

      // Ward Beacon Base Ring on Floor
      const ringGeo = new THREE.RingGeometry(0.25, 0.32, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.01;
      stationGroup.add(ring);

      stage3Group.add(stationGroup);
      wardStations.push(stationGroup);
    });

    // 2. Broken / Disconnected Dashed Data Tracks on Floor
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xe63946,
      dashSize: 0.15,
      gapSize: 0.1,
      linewidth: 2
    });

    const points = [
      new THREE.Vector3(-0.9, 0.02, -0.6),
      new THREE.Vector3(0.0, 0.02, 0.5),
      new THREE.Vector3(0.9, 0.02, -0.6)
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const brokenLine = new THREE.Line(lineGeo, lineMat);
    brokenLine.computeLineDistances();
    stage3Group.add(brokenLine);

    // 3. Moving Manual Waste Cart (Struggling between wards)
    movingWasteCart = new THREE.Group();
    const cartBodyGeo = new THREE.BoxGeometry(0.48, 0.42, 0.36);
    const cartBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
    const cartBody = new THREE.Mesh(cartBodyGeo, cartBodyMat);
    cartBody.position.y = 0.28;
    cartBody.castShadow = true;
    movingWasteCart.add(cartBody);

    // Cart Handle
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(-0.25, 0.55, 0);
    handle.rotation.z = -Math.PI / 6;
    movingWasteCart.add(handle);

    movingWasteCart.position.set(-0.45, 0, -0.05);
    stage3Group.add(movingWasteCart);

    // 4. Floating Holographic Audit Slate / Missing Record Panel
    auditSlateGroup = new THREE.Group();
    auditSlateGroup.position.set(0, 1.45, 0);

    const slateGeo = new THREE.BoxGeometry(0.65, 0.45, 0.03);
    const slateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      transparent: true,
      opacity: 0.92
    });
    const slate = new THREE.Mesh(slateGeo, slateMat);
    auditSlateGroup.add(slate);

    // Red Disconnected / Missing Bar
    const redBarGeo = new THREE.BoxGeometry(0.5, 0.08, 0.04);
    const redBarMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });
    const redBar = new THREE.Mesh(redBarGeo, redBarMat);
    redBar.position.set(0, 0.08, 0.02);
    auditSlateGroup.add(redBar);

    // Incomplete Sync indicator bars
    const bar2Geo = new THREE.BoxGeometry(0.3, 0.04, 0.04);
    const bar2Mat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const bar2 = new THREE.Mesh(bar2Geo, bar2Mat);
    bar2.position.set(-0.1, -0.08, 0.02);
    auditSlateGroup.add(bar2);

    stage3Group.add(auditSlateGroup);
  }

  // ==========================================================================
  // 7. WARNING PARTICLES SYSTEM
  // ==========================================================================
  function buildWarningParticles() {
    const particleCount = 28;
    const particleGeo = new THREE.SphereGeometry(0.025, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xe63946,
      transparent: true,
      opacity: 0.75
    });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(particleGeo, particleMat.clone());
      p.position.set(
        (Math.random() - 0.5) * 4.5,
        0.2 + Math.random() * 2.2,
        (Math.random() - 0.5) * 3.0
      );
      p.userData = {
        speedY: 0.003 + Math.random() * 0.006,
        amplitudeX: 0.002 + Math.random() * 0.004,
        phase: Math.random() * Math.PI * 2,
        baseY: p.position.y
      };
      particlesGroup.add(p);
      warningParticles.push(p);
    }
  }

  // ==========================================================================
  // 8. EVENT LISTENERS & CONTROLS
  // ==========================================================================
  function setupEvents() {
    // Stage Selector Tabs
    tabBtns.forEach((btn, index) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        const targetStage = index + 1;
        jumpToStage(targetStage);
      });
    });

    // Play / Pause Toggle
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', togglePlayPause);
    }

    // Reset Animation
    if (btnReset) {
      btnReset.addEventListener('click', resetAnimation);
    }

    // Window Resize Handling
    window.addEventListener('resize', onResize);

    // Visibility Observer to pause when scrolled out of view (Performance)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlaying) {
            // Paused off-screen
          }
        });
      }, { threshold: 0.1 });
      observer.observe(wrapper);
    }
  }

  function togglePlayPause() {
    isPlaying = !isPlaying;
    if (iconPlay && iconPause && textPlayPause) {
      if (isPlaying) {
        iconPlay.style.display = 'none';
        iconPause.style.display = 'inline-block';
        textPlayPause.textContent = 'PAUSE';
      } else {
        iconPlay.style.display = 'inline-block';
        iconPause.style.display = 'none';
        textPlayPause.textContent = 'PLAY';
      }
    }
  }

  function resetAnimation() {
    animTime = 0.0;
    jumpToStage(1);
    if (!isPlaying) {
      togglePlayPause();
    }
  }

  function jumpToStage(stageNum) {
    currentStage = stageNum;
    if (stageNum === 1) animTime = 0.0;
    else if (stageNum === 2) animTime = 5.5;
    else if (stageNum === 3) animTime = 11.0;

    updateUIStage(stageNum);
    updateCameraTarget(stageNum);
  }

  function updateCameraTarget(stageNum) {
    if (stageNum === 1) {
      targetCamPos.copy(cameraPositions.stage1);
      targetCamLook.copy(cameraTargets.stage1);
    } else if (stageNum === 2) {
      targetCamPos.copy(cameraPositions.stage2);
      targetCamLook.copy(cameraTargets.stage2);
    } else if (stageNum === 3) {
      targetCamPos.copy(cameraPositions.stage3);
      targetCamLook.copy(cameraTargets.stage3);
    }
  }

  function updateUIStage(stageNum) {
    // 1. Update Tabs
    tabBtns.forEach((btn, idx) => {
      if (!btn) return;
      const isActive = idx + 1 === stageNum;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // 2. Update HUD & Callout Texts
    if (stageNum === 1) {
      if (stageBadgeText) stageBadgeText.textContent = '01 INFECTION RISK';
      if (stageSubText) stageSubText.textContent = 'MANUAL HANDLING HAZARD';
      if (calloutIcon) calloutIcon.textContent = '⚠️';
      if (calloutTitle) calloutTitle.textContent = 'INFECTION RISK';
      if (calloutSub) calloutSub.textContent = 'Direct human exposure to sharps & infectious items';
    } else if (stageNum === 2) {
      if (stageBadgeText) stageBadgeText.textContent = '02 HUMAN ERROR';
      if (stageSubText) stageSubText.textContent = 'CROSS-CONTAMINATION & MIXING';
      if (calloutIcon) calloutIcon.textContent = '🔄';
      if (calloutTitle) calloutTitle.textContent = 'HUMAN ERROR & MIXING';
      if (calloutSub) calloutSub.textContent = 'Different waste categories mixed due to hurry or fatigue';
    } else if (stageNum === 3) {
      if (stageBadgeText) stageBadgeText.textContent = '03 TRACEABILITY';
      if (stageSubText) stageSubText.textContent = 'RECORD & COMPLIANCE GAPS';
      if (calloutIcon) calloutIcon.textContent = '📋';
      if (calloutTitle) calloutTitle.textContent = 'TRACEABILITY GAP';
      if (calloutSub) calloutSub.textContent = 'Missing logs & disjointed audit trails across wards';
    }
  }

  function onResize() {
    if (!canvasContainer || !renderer || !camera) return;
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight || 380;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // ==========================================================================
  // 9. ANIMATION LOOP & STEP LOGIC
  // ==========================================================================
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (isPlaying && !prefersReducedMotion) {
      animTime += delta;
      if (animTime >= TOTAL_CYCLE) {
        animTime = 0.0;
      }
    }

    // Determine current stage from animTime
    let activeStage = 1;
    if (animTime < 5.5) {
      activeStage = 1;
    } else if (animTime < 11.0) {
      activeStage = 2;
    } else {
      activeStage = 3;
    }

    if (activeStage !== currentStage) {
      currentStage = activeStage;
      updateUIStage(currentStage);
      updateCameraTarget(currentStage);
    }

    // Update Progress Timeline
    if (timelineFill) {
      const progressPercent = (animTime / TOTAL_CYCLE) * 100;
      timelineFill.style.width = `${progressPercent}%`;
    }

    // Smooth Camera Interpolation
    camera.position.lerp(targetCamPos, 0.04);
    controls.target.lerp(targetCamLook, 0.04);

    const t = clock.getElapsedTime();

    // ------------------------------------------------------------------------
    // STAGE 1 ANIMATION DYNAMICS
    // ------------------------------------------------------------------------
    if (hazardFloorRing) {
      const pulse = 1.0 + Math.sin(t * 4.0) * 0.12;
      hazardFloorRing.scale.set(pulse, pulse, 1);
      hazardFloorRing.material.opacity = 0.5 + Math.sin(t * 4.0) * 0.35;
    }

    if (warningBadgeGroup) {
      warningBadgeGroup.position.y = 1.7 + Math.sin(t * 3.0) * 0.08;
      warningBadgeGroup.rotation.y = Math.sin(t * 2.0) * 0.3;
    }

    if (workerGroup) {
      // Gentle breathing/reaching motion
      workerGroup.position.x = -0.9 + Math.sin(t * 1.5) * 0.05;
    }

    // ------------------------------------------------------------------------
    // STAGE 2 ANIMATION DYNAMICS
    // ------------------------------------------------------------------------
    fallingWasteItems.forEach((item, idx) => {
      const cycleOffset = (t * item.speed + idx * 1.5) % 3.0;
      item.mesh.position.y = item.baseY - cycleOffset * 0.3;
      item.mesh.rotation.x = t * 1.2 + idx;
      item.mesh.rotation.z = t * 1.5;
    });

    if (mixingAlertRing) {
      const pulse2 = 1.0 + Math.sin(t * 5.0) * 0.08;
      mixingAlertRing.scale.set(pulse2, pulse2, 1);
    }

    // ------------------------------------------------------------------------
    // STAGE 3 ANIMATION DYNAMICS
    // ------------------------------------------------------------------------
    if (movingWasteCart) {
      // Cart slowly travels along broken track
      const cartX = Math.sin(t * 1.2) * 0.7;
      const cartZ = Math.cos(t * 1.2) * 0.35 - 0.1;
      movingWasteCart.position.set(cartX, 0, cartZ);
      movingWasteCart.rotation.y = Math.atan2(Math.cos(t * 1.2), -Math.sin(t * 1.2));
    }

    if (auditSlateGroup) {
      auditSlateGroup.position.y = 1.45 + Math.sin(t * 2.5) * 0.06;
      auditSlateGroup.rotation.y = Math.sin(t * 1.5) * 0.2;
    }

    // ------------------------------------------------------------------------
    // WARNING PARTICLES
    // ------------------------------------------------------------------------
    warningParticles.forEach((p) => {
      p.position.y += p.userData.speedY;
      p.position.x += Math.sin(t * 2.0 + p.userData.phase) * p.userData.amplitudeX;
      if (p.position.y > 2.6) {
        p.position.y = 0.2;
      }
    });

    controls.update();
    renderer.render(scene, camera);
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
