/**
 * NOVAMINDS — WHAT MAKES OUR IDEA UNIQUE (Interactive 3D Engineering Demonstration)
 * 
 * 5 Core Practical Differentiators:
 * 01. ACKNOWLEDGEMENT BEFORE ENTRY (RFID/Keycard authorization, OT gatekeeper)
 * 02. RE-SCAN SPOT (Zero-guessing AI inspection, dedicated secondary verification)
 * 03. EMERGENCY CALL CODES (Dynamic priority dispatch, e.g., 'B4' priority override)
 * 04. DIGITAL RECORD (Real-time telemetry, tamper-evident audit logging, CPCB compliance)
 * 05. SIMPLE DESIGN (2 robotic hands, gravity chutes, single-level high reliability)
 */

(function () {
  'use strict';

  // DOM Elements
  const container = document.getElementById('uniqueViewport');
  const canvas = document.getElementById('uniqueRobotCanvas');
  if (!container || !canvas) return;

  // HUD & Telemetry Elements
  const stagePillText = document.getElementById('uniqueStagePillText');
  const headlineEl = document.getElementById('uniqueHeadline');
  const descEl = document.getElementById('uniqueDesc');
  const innovationTag = document.getElementById('uniqueInnovationTag');
  const timelineFill = document.getElementById('uniqueTimelineFill');
  const timelineHandle = document.getElementById('uniqueTimelineHandle');

  // Dynamic Overlay Badges & Panels
  const overlayAuth = document.getElementById('uniqueOverlayAuth');
  const overlayRescan = document.getElementById('uniqueOverlayRescan');
  const overlayEmergency = document.getElementById('uniqueOverlayEmergency');
  const overlayRecord = document.getElementById('uniqueOverlayRecord');
  const overlaySimple = document.getElementById('uniqueOverlaySimple');

  // Control Buttons
  const btnPlayPause = document.getElementById('uniqueBtnPlayPause');
  const iconPlay = document.getElementById('uniqueIconPlay');
  const iconPause = document.getElementById('uniqueIconPause');
  const textPlayPause = document.getElementById('uniqueTextPlayPause');
  const btnRestart = document.getElementById('uniqueBtnRestart');
  const btnPrev = document.getElementById('uniqueBtnPrev');
  const btnNext = document.getElementById('uniqueBtnNext');
  const btnResetView = document.getElementById('uniqueBtnResetView');
  const btnCutaway = document.getElementById('uniqueBtnCutaway');
  const btnLabels = document.getElementById('uniqueBtnLabels');
  const btnSpeed = document.getElementById('uniqueBtnSpeed');
  const speedText = document.getElementById('uniqueSpeedText');
  const scenePills = document.querySelectorAll('.unique-scene-tab');
  const companionCards = document.querySelectorAll('.unique-interactive-card');

  // 3D Scene Variables
  let scene, camera, renderer, controls;
  const clock = new THREE.Clock();

  // Model Groups
  const robotGroup = new THREE.Group();
  const outerShellGroup = new THREE.Group();
  const internalGroup = new THREE.Group();
  const environmentGroup = new THREE.Group();
  const labelsGroup = new THREE.Group();
  const dataParticlesGroup = new THREE.Group();

  // Robot Sub-components
  let mainBodyMesh, topHoodMesh, frontDoorMesh, frontDisplayCanvas, frontDisplayTexture, frontDisplayMesh;
  let lidarHead, lidarLaserRays, leftArmMesh, rightArmMesh, conveyorBeltMesh, rescanPlateMesh;
  let wasteSampleMesh, laserScanCone, statusLightMesh;
  const wheels = [];
  const colorBins = {};

  // Environment Sub-components
  let otDoorLeft, otDoorRight, doorSecurityLight, accessTerminalMesh, cardBadgeMesh;
  let dispatchBeaconMesh, floorRouteLine, priorityTargetBeacon;
  let labelSprites = [];

  // State Management
  const STAGES = [
    {
      id: 'intro',
      num: '00',
      tag: 'SYSTEM OVERVIEW',
      title: 'WHAT MAKES OUR IDEA UNIQUE?',
      desc: 'Five practical engineering innovations designed specifically for hospital realities.',
      duration: 7.0,
      camPos: { x: 3.8, y: 2.6, z: 4.8 },
      target: { x: 0, y: 0.8, z: 0 },
      cutaway: false
    },
    {
      id: 'acknowledgement',
      num: '01',
      tag: 'CONTROLLED ACCESS',
      title: 'ACKNOWLEDGEMENT BEFORE ENTRY',
      desc: 'The robot halts outside sensitive wards/OTs until authorized by staff badge acknowledgement.',
      duration: 8.5,
      camPos: { x: 2.6, y: 1.8, z: 3.2 },
      target: { x: 0.4, y: 0.9, z: 0 },
      cutaway: false
    },
    {
      id: 'rescan',
      num: '02',
      tag: 'ZERO-GUESSING AI',
      title: 'DEDICATED RE-SCAN SPOT',
      desc: 'Uncertain items are placed on a secondary inspection plate for multi-angle re-verification instead of random misclassification.',
      duration: 9.0,
      camPos: { x: 1.2, y: 2.2, z: 1.8 },
      target: { x: 0, y: 0.9, z: 0 },
      cutaway: true
    },
    {
      id: 'emergency',
      num: '03',
      tag: 'DYNAMIC DISPATCH',
      title: 'EMERGENCY CALL CODES (B4)',
      desc: 'Instant priority rerouting via floor code dispatch (e.g. Ward B4) overrides scheduled rounds safely.',
      duration: 8.5,
      camPos: { x: 4.5, y: 4.2, z: 4.5 },
      target: { x: 0, y: 0.5, z: 0 },
      cutaway: false
    },
    {
      id: 'record',
      num: '04',
      tag: 'AUDIT & TRACEABILITY',
      title: 'REAL-TIME DIGITAL RECORD',
      desc: 'Every gram and category is cryptographically logged with ward ID, staff signature & CPCB compliance payload.',
      duration: 8.0,
      camPos: { x: 2.8, y: 2.0, z: 3.0 },
      target: { x: 0.2, y: 0.8, z: 0 },
      cutaway: false
    },
    {
      id: 'simple',
      num: '05',
      tag: 'PRACTICAL ENGINEERING',
      title: 'RELIABLE & SIMPLE DESIGN',
      desc: 'Dual articulated grippers, passive gravity chutes and flat-floor optimization ensure high uptime and low cost.',
      duration: 8.5,
      camPos: { x: -2.4, y: 2.2, z: 3.0 },
      target: { x: 0, y: 0.8, z: 0 },
      cutaway: true
    }
  ];

  let currentStageIndex = 0;
  let stageTimer = 0.0;
  let isPlaying = true;
  let isCutaway = false;
  let showLabels = true;
  let playbackSpeed = 1.0;
  let isDraggingScrubber = false;

  /* ==========================================================================
     1. INITIALIZATION & THREE.JS SETUP
     ========================================================================== */
  function init() {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.04);

    // 2. Camera
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 520;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 2.6, 4.8);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 4. Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 12;
    controls.target.set(0, 0.8, 0);

    // 5. Lighting Setup
    setupLighting();

    // 6. Build 3D Entities
    buildHospitalEnvironment();
    buildNovaMindsRobot();
    buildDataParticles();
    buildFloatingLabels();

    scene.add(environmentGroup);
    scene.add(robotGroup);
    scene.add(labelsGroup);
    scene.add(dataParticlesGroup);

    // 7. Event Listeners
    setupEventListeners();

    // 8. Start Animation Loop
    setStage(0, true);
    window.addEventListener('resize', onResize);
    animate();
  }

  /* ==========================================================================
     2. LIGHTING
     ========================================================================== */
  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainKeyLight.position.set(5, 8, 5);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    mainKeyLight.shadow.camera.near = 0.5;
    mainKeyLight.shadow.camera.far = 25;
    mainKeyLight.shadow.bias = -0.001;
    scene.add(mainKeyLight);

    const blueFillLight = new THREE.PointLight(0x00d2ff, 1.2, 15);
    blueFillLight.position.set(-4, 3, -2);
    scene.add(blueFillLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00f5a0, 0.6);
    cyanRimLight.position.set(-5, 5, -5);
    scene.add(cyanRimLight);

    // Soft warm hospital overhead glow
    const ceilingWarmLight = new THREE.PointLight(0xfffaed, 0.9, 10);
    ceilingWarmLight.position.set(0, 4.5, 0);
    scene.add(ceilingWarmLight);
  }

  /* ==========================================================================
     3. HOSPITAL ENVIRONMENT & STATIONS
     ========================================================================== */
  function buildHospitalEnvironment() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    environmentGroup.add(floor);

    // Floor Grid Lines
    const grid = new THREE.GridHelper(24, 24, 0x00d2ff, 0x1e293b);
    grid.position.y = 0.002;
    environmentGroup.add(grid);

    // Navigation Floor Path (Dotted Path)
    const pathCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6, 0.02, 3),
      new THREE.Vector3(-3, 0.02, 1),
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(3, 0.02, -1),
      new THREE.Vector3(6, 0.02, -2)
    ]);
    const pathGeo = new THREE.TubeGeometry(pathCurve, 64, 0.04, 8, false);
    const pathMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.6 });
    floorRouteLine = new THREE.Mesh(pathGeo, pathMat);
    environmentGroup.add(floorRouteLine);

    // Back Hospital Wall with Corridor Arch
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x141e33, roughness: 0.5 });
    const wallGeo = new THREE.BoxGeometry(24, 5, 0.3);
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2.5, -4);
    backWall.receiveShadow = true;
    environmentGroup.add(backWall);

    // Ward Doorway (OT-04 Sensitive Area Gate)
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5, roughness: 0.3 });
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.4), doorFrameMat);
    doorFrame.position.set(1.5, 1.6, -3.8);
    environmentGroup.add(doorFrame);

    // Sliding Door Leaves
    const doorLeafMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.95
    });

    otDoorLeft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.9, 0.08), doorLeafMat);
    otDoorLeft.position.set(1.0, 1.5, -3.8);
    environmentGroup.add(otDoorLeft);

    otDoorRight = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.9, 0.08), doorLeafMat);
    otDoorRight.position.set(2.0, 1.5, -3.8);
    environmentGroup.add(otDoorRight);

    // Door Security Light Indicator
    const secLightGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const secLightMat = new THREE.MeshBasicMaterial({ color: 0xff3344 });
    doorSecurityLight = new THREE.Mesh(secLightGeo, secLightMat);
    doorSecurityLight.position.set(1.5, 3.3, -3.6);
    environmentGroup.add(doorSecurityLight);

    // Wall Sign: OPERATION THEATRE 04
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.fillStyle = '#00d2ff';
    sCtx.font = 'bold 36px sans-serif';
    sCtx.fillText('WARD B4 • OT-04', 30, 55);
    sCtx.fillStyle = '#94a3b8';
    sCtx.font = '22px sans-serif';
    sCtx.fillText('RESTRICTED ACCESS • AUTHORIZATION REQUIRED', 30, 95);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 0.5),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(1.5, 3.7, -3.79);
    environmentGroup.add(signMesh);

    // RFID Wall Badge Scanner Terminal
    const terminalGeo = new THREE.BoxGeometry(0.25, 0.4, 0.1);
    const terminalMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    accessTerminalMesh = new THREE.Mesh(terminalGeo, terminalMat);
    accessTerminalMesh.position.set(2.8, 1.5, -3.7);
    environmentGroup.add(accessTerminalMesh);

    // Floating Staff RFID Keycard
    const cardGeo = new THREE.BoxGeometry(0.3, 0.2, 0.02);
    const cardMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3 });
    cardBadgeMesh = new THREE.Mesh(cardGeo, cardMat);
    cardBadgeMesh.position.set(2.8, 1.5, -3.4);
    environmentGroup.add(cardBadgeMesh);

    // Emergency Dispatch Beacon (Ward B4 Pulse Ring)
    const beaconRingGeo = new THREE.RingGeometry(0.8, 1.0, 32);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0
    });
    priorityTargetBeacon = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    priorityTargetBeacon.rotation.x = -Math.PI / 2;
    priorityTargetBeacon.position.set(1.5, 0.03, -2.5);
    environmentGroup.add(priorityTargetBeacon);
  }

  /* ==========================================================================
     4. NOVAMINDS ROBOT MODEL (PRECISE CAD REPRESENTATION)
     ========================================================================== */
  function buildNovaMindsRobot() {
    robotGroup.position.set(0, 0, 0);

    // 1. Lower Chassis (Dark Metallic)
    const chassisGeo = new THREE.BoxGeometry(1.2, 0.25, 1.6);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.3
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 0.22;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    robotGroup.add(chassis);

    // 2. Four Drive Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7 });
    const wheelPositions = [
      { x: -0.62, y: 0.16, z: 0.55 },
      { x: 0.62, y: 0.16, z: 0.55 },
      { x: -0.62, y: 0.16, z: -0.55 },
      { x: 0.62, y: 0.16, z: -0.55 }
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      robotGroup.add(wheel);
      wheels.push(wheel);
    });

    // 3. Outer Medical-White Main Enclosure (Outer Shell Group)
    const bodyGeo = new THREE.BoxGeometry(1.15, 1.0, 1.45);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.15,
      transparent: true,
      opacity: 1.0
    });
    mainBodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    mainBodyMesh.position.y = 0.85;
    mainBodyMesh.castShadow = true;
    outerShellGroup.add(mainBodyMesh);

    // Top Hood with Bevel
    const hoodGeo = new THREE.BoxGeometry(1.18, 0.12, 1.48);
    const hoodMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.4,
      roughness: 0.25,
      transparent: true,
      opacity: 1.0
    });
    topHoodMesh = new THREE.Mesh(hoodGeo, hoodMat);
    topHoodMesh.position.y = 1.41;
    outerShellGroup.add(topHoodMesh);

    // Red Cross Medical Livery Side Emblems
    const crossTex = createCrossTexture();
    const crossMat = new THREE.MeshBasicMaterial({ map: crossTex, transparent: true });
    const crossLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), crossMat);
    crossLeft.position.set(-0.58, 0.9, 0);
    crossLeft.rotation.y = -Math.PI / 2;
    outerShellGroup.add(crossLeft);

    const crossRight = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), crossMat);
    crossRight.position.set(0.58, 0.9, 0);
    crossRight.rotation.y = Math.PI / 2;
    outerShellGroup.add(crossRight);

    // Motorized Front Intake Door
    const doorGeo = new THREE.BoxGeometry(0.7, 0.4, 0.04);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.2 });
    frontDoorMesh = new THREE.Mesh(doorGeo, doorMat);
    frontDoorMesh.position.set(0, 0.6, 0.74);
    outerShellGroup.add(frontDoorMesh);

    // Front Smart UI Screen
    frontDisplayCanvas = document.createElement('canvas');
    frontDisplayCanvas.width = 512;
    frontDisplayCanvas.height = 256;
    frontDisplayTexture = new THREE.CanvasTexture(frontDisplayCanvas);
    updateFrontDisplay('READY', 'IDLE', '#00d2ff');

    const dispMeshMat = new THREE.MeshBasicMaterial({ map: frontDisplayTexture });
    frontDisplayMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.32), dispMeshMat);
    frontDisplayMesh.position.set(0, 1.12, 0.735);
    outerShellGroup.add(frontDisplayMesh);

    robotGroup.add(outerShellGroup);

    // 4. Internal Components (Cutaway Group)
    buildRobotInternals();
    robotGroup.add(internalGroup);

    // 5. Top 360° LiDAR Sensor Turret
    const lidarBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.1, 24);
    const lidarBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
    const lidarBase = new THREE.Mesh(lidarBaseGeo, lidarBaseMat);
    lidarBase.position.set(0, 1.52, -0.3);
    robotGroup.add(lidarBase);

    const lidarHeadGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.14, 24);
    const lidarHeadMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, metalness: 0.8, roughness: 0.2 });
    lidarHead = new THREE.Mesh(lidarHeadGeo, lidarHeadMat);
    lidarHead.position.set(0, 1.64, -0.3);
    robotGroup.add(lidarHead);

    // LiDAR Scanning Laser Cone / Rays
    const laserRayGeo = new THREE.RingGeometry(0.2, 2.5, 32);
    const laserRayMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    lidarLaserRays = new THREE.Mesh(laserRayGeo, laserRayMat);
    lidarLaserRays.rotation.x = Math.PI / 2;
    lidarLaserRays.position.set(0, 1.64, -0.3);
    robotGroup.add(lidarLaserRays);

    // Status Halo LED Ring
    const statusGeo = new THREE.TorusGeometry(0.2, 0.02, 16, 32);
    const statusMat = new THREE.MeshBasicMaterial({ color: 0x00f5a0 });
    statusLightMesh = new THREE.Mesh(statusGeo, statusMat);
    statusLightMesh.rotation.x = Math.PI / 2;
    statusLightMesh.position.set(0, 1.48, 0.4);
    robotGroup.add(statusLightMesh);
  }

  /* ==========================================================================
     5. INTERNAL MECHANISMS (HOPPER, CONVEYOR, RE-SCAN SPOT, 2 ROBOTIC ARMS, BINS)
     ========================================================================== */
  function buildRobotInternals() {
    // 1. Internal Waste Hopper Funnel
    const hopperGeo = new THREE.ConeGeometry(0.4, 0.35, 4);
    const hopperMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
    const hopper = new THREE.Mesh(hopperGeo, hopperMat);
    hopper.rotation.y = Math.PI / 4;
    hopper.position.set(0, 0.95, 0.35);
    internalGroup.add(hopper);

    // 2. Slow Feed Conveyor Belt
    const conveyorGeo = new THREE.BoxGeometry(0.4, 0.06, 0.65);
    const conveyorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    conveyorBeltMesh = new THREE.Mesh(conveyorGeo, conveyorMat);
    conveyorBeltMesh.position.set(0, 0.8, 0.05);
    internalGroup.add(conveyorBeltMesh);

    // 3. AI Camera Gantry & Vision Laser Cone
    const camGantryGeo = new THREE.BoxGeometry(0.45, 0.06, 0.06);
    const camGantryMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const camGantry = new THREE.Mesh(camGantryGeo, camGantryMat);
    camGantry.position.set(0, 1.2, 0.1);
    internalGroup.add(camGantry);

    const laserConeGeo = new THREE.ConeGeometry(0.25, 0.4, 16, 1, true);
    const laserConeMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    laserScanCone = new THREE.Mesh(laserConeGeo, laserConeMat);
    laserScanCone.position.set(0, 1.0, 0.1);
    laserScanCone.rotation.x = Math.PI;
    internalGroup.add(laserScanCone);

    // 4. INNOVATION 02: DEDICATED RE-SCAN SPOT PLATE
    const rescanGeo = new THREE.BoxGeometry(0.25, 0.03, 0.25);
    const rescanMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.5,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.3
    });
    rescanPlateMesh = new THREE.Mesh(rescanGeo, rescanMat);
    rescanPlateMesh.position.set(0.32, 0.82, 0.05);
    internalGroup.add(rescanPlateMesh);

    // Re-scan Target Reticle Ring
    const rescanRingGeo = new THREE.RingGeometry(0.08, 0.11, 16);
    const rescanRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const rescanRing = new THREE.Mesh(rescanRingGeo, rescanRingMat);
    rescanRing.rotation.x = -Math.PI / 2;
    rescanRing.position.set(0.32, 0.84, 0.05);
    internalGroup.add(rescanRing);

    // 5. INNOVATION 05: TWO ROBOTIC HANDS (Articulated Pick-and-Place Arms)
    const armMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.3 });

    // Left Arm (Handles Primary Sorting to Red/Yellow)
    leftArmMesh = new THREE.Group();
    const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1), armMat);
    const lLink1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), armMat);
    lLink1.position.set(0, 0.1, 0);
    const lGripper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), armMat);
    lGripper.position.set(0, 0.22, 0);
    leftArmMesh.add(lBase);
    leftArmMesh.add(lLink1);
    leftArmMesh.add(lGripper);
    leftArmMesh.position.set(-0.25, 0.85, -0.05);
    internalGroup.add(leftArmMesh);

    // Right Arm (Handles Re-scan Transfer & Blue/White sorting)
    rightArmMesh = new THREE.Group();
    const rBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1), armMat);
    const rLink1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), armMat);
    rLink1.position.set(0, 0.1, 0);
    const rGripper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), armMat);
    rGripper.position.set(0, 0.22, 0);
    rightArmMesh.add(rBase);
    rightArmMesh.add(rLink1);
    rightArmMesh.add(rGripper);
    rightArmMesh.position.set(0.25, 0.85, -0.05);
    internalGroup.add(rightArmMesh);

    // 6. Test Waste Sample (Syringe / Gauze Package)
    const wasteGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 12);
    const wasteMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.4 });
    wasteSampleMesh = new THREE.Mesh(wasteGeo, wasteMat);
    wasteSampleMesh.rotation.z = Math.PI / 2;
    wasteSampleMesh.position.set(0, 0.86, 0.2);
    internalGroup.add(wasteSampleMesh);

    // 7. Four Color-Coded CPCB Waste Compartments & Gravity Chutes
    const binSpecs = [
      { id: 'yellow', color: 0xfacc15, name: 'YELLOW (Anatomical/Soiled)', x: -0.28, z: -0.4 },
      { id: 'red', color: 0xef4444, name: 'RED (Contaminated Plastic)', x: 0.28, z: -0.4 },
      { id: 'white', color: 0xe2e8f0, name: 'WHITE (Sharps & Needles)', x: -0.28, z: -0.1 },
      { id: 'blue', color: 0x3b82f6, name: 'BLUE (Glassware & Medicine)', x: 0.28, z: -0.1 }
    ];

    binSpecs.forEach((spec) => {
      const binBoxGeo = new THREE.BoxGeometry(0.44, 0.45, 0.28);
      const binBoxMat = new THREE.MeshStandardMaterial({
        color: spec.color,
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      const binMesh = new THREE.Mesh(binBoxGeo, binBoxMat);
      binMesh.position.set(spec.x, 0.48, spec.z);
      binMesh.castShadow = true;
      internalGroup.add(binMesh);
      colorBins[spec.id] = binMesh;

      // Gravity Chute
      const chuteGeo = new THREE.BoxGeometry(0.18, 0.25, 0.08);
      const chuteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
      const chute = new THREE.Mesh(chuteGeo, chuteMat);
      chute.rotation.x = Math.PI / 6;
      chute.position.set(spec.x, 0.74, spec.z + 0.12);
      internalGroup.add(chute);
    });
  }

  /* ==========================================================================
     6. DATA STREAMS & FLOATING CALLOUT LABELS
     ========================================================================== */
  function buildDataParticles() {
    const particleCount = 40;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 2;
      pPos[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0x00f5a0,
      size: 0.05,
      transparent: true,
      opacity: 0.7
    });
    const points = new THREE.Points(pGeo, pMat);
    dataParticlesGroup.add(points);
  }

  function buildFloatingLabels() {
    const labelsData = [
      { text: '01. AUTH RFID SCANNER', pos: new THREE.Vector3(2.8, 1.8, -3.7) },
      { text: '02. RE-SCAN DEDICATED SPOT', pos: new THREE.Vector3(0.35, 1.1, 0.05) },
      { text: '03. EMERGENCY CALL DISPATCH', pos: new THREE.Vector3(0, 1.9, 0) },
      { text: '04. DIGITAL TELEMETRY & AUDIT', pos: new THREE.Vector3(-0.8, 1.4, 0) },
      { text: '05. TWO HIGH-RELIABILITY ARMS', pos: new THREE.Vector3(0, 0.95, -0.1) }
    ];

    labelsData.forEach((ld, idx) => {
      const sprite = createTextSprite(ld.text);
      sprite.position.copy(ld.pos);
      sprite.visible = showLabels;
      labelsGroup.add(sprite);
      labelSprites.push(sprite);
    });
  }

  function createTextSprite(message) {
    const fontface = 'Space Grotesk, sans-serif';
    const fontsize = 32;
    const borderThickness = 3;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.font = 'bold ' + fontsize + 'px ' + fontface;

    // Background pill
    context.fillStyle = 'rgba(10, 16, 29, 0.85)';
    context.strokeStyle = '#00d2ff';
    context.lineWidth = borderThickness;

    roundRect(context, borderThickness, borderThickness, 500, 100, 16);

    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(message, 256, 54);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.4, 0.35, 1.0);
    return sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function createCrossTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(48, 16, 32, 96);
    ctx.fillRect(16, 48, 96, 32);
    return new THREE.CanvasTexture(canvas);
  }

  function updateFrontDisplay(statusText, subText, colorHex) {
    if (!frontDisplayCanvas) return;
    const ctx = frontDisplayCanvas.getContext('2d');
    ctx.fillStyle = '#060d19';
    ctx.fillRect(0, 0, 512, 256);

    // Frame
    ctx.strokeStyle = colorHex || '#00d2ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 236);

    // Title
    ctx.fillStyle = colorHex || '#00d2ff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(statusText, 256, 95);

    // Subtitle
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(subText, 256, 160);

    // Battery Bar
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(156, 195, 200, 20);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(156, 195, 200, 20);

    if (frontDisplayTexture) frontDisplayTexture.needsUpdate = true;
  }

  /* ==========================================================================
     7. STAGE CONTROLLER & OVERLAYS
     ========================================================================== */
  function setStage(index, instant = false) {
    currentStageIndex = (index + STAGES.length) % STAGES.length;
    stageTimer = 0.0;
    const stage = STAGES[currentStageIndex];

    // Update HUD Text
    if (stagePillText) stagePillText.textContent = `${stage.num} — ${stage.tag}`;
    if (headlineEl) headlineEl.textContent = stage.title;
    if (descEl) descEl.textContent = stage.desc;
    if (innovationTag) innovationTag.textContent = stage.tag;

    // Update Timeline Tabs & Companion Cards
    scenePills.forEach((pill, i) => {
      pill.classList.toggle('active', i === currentStageIndex);
    });

    companionCards.forEach((card, i) => {
      // 0 is intro, cards are 1..5
      if (currentStageIndex === 0) {
        card.classList.remove('active-focus');
      } else {
        card.classList.toggle('active-focus', i === currentStageIndex - 1);
      }
    });

    // Toggle Specific Dynamic Overlays
    if (overlayAuth) overlayAuth.classList.toggle('visible', currentStageIndex === 1);
    if (overlayRescan) overlayRescan.classList.toggle('visible', currentStageIndex === 2);
    if (overlayEmergency) overlayEmergency.classList.toggle('visible', currentStageIndex === 3);
    if (overlayRecord) overlayRecord.classList.toggle('visible', currentStageIndex === 4);
    if (overlaySimple) overlaySimple.classList.toggle('visible', currentStageIndex === 5);

    // Cutaway mode syncing
    applyCutaway(stage.cutaway || isCutaway);

    // Camera Framing Animation
    if (instant) {
      camera.position.set(stage.camPos.x, stage.camPos.y, stage.camPos.z);
      controls.target.set(stage.target.x, stage.target.y, stage.target.z);
      controls.update();
    }
  }

  function applyCutaway(cutawayState) {
    const opacity = cutawayState ? 0.18 : 1.0;
    const transparent = cutawayState;

    if (mainBodyMesh) {
      mainBodyMesh.material.opacity = opacity;
      mainBodyMesh.material.transparent = transparent;
      mainBodyMesh.material.wireframe = cutawayState;
    }
    if (topHoodMesh) {
      topHoodMesh.material.opacity = cutawayState ? 0.25 : 1.0;
      topHoodMesh.material.transparent = transparent;
    }

    if (btnCutaway) {
      btnCutaway.classList.toggle('active', cutawayState);
    }
  }

  /* ==========================================================================
     8. SIMULATION DYNAMICS (STAGE BY STAGE)
     ========================================================================== */
  function updateSimulation(delta) {
    const stage = STAGES[currentStageIndex];
    const progress = Math.min(stageTimer / stage.duration, 1.0);

    // Scrubber fill update
    const totalCycle = STAGES.reduce((acc, s) => acc + s.duration, 0);
    let elapsedPrior = 0;
    for (let i = 0; i < currentStageIndex; i++) elapsedPrior += STAGES[i].duration;
    const globalProgress = (elapsedPrior + stageTimer) / totalCycle;

    if (timelineFill) timelineFill.style.width = `${globalProgress * 100}%`;
    if (timelineHandle) timelineHandle.style.left = `${globalProgress * 100}%`;

    // Standard Rotations
    if (lidarHead) lidarHead.rotation.y += delta * 5.0;
    if (lidarLaserRays) lidarLaserRays.rotation.z += delta * 2.0;

    // Smooth Camera Transition towards stage preset
    if (!controls.state || controls.state === -1) {
      camera.position.lerp(new THREE.Vector3(stage.camPos.x, stage.camPos.y, stage.camPos.z), 0.04);
      controls.target.lerp(new THREE.Vector3(stage.target.x, stage.target.y, stage.target.z), 0.04);
    }

    // -------------------------------------------------------------
    // STAGE 0: INTRO
    // -------------------------------------------------------------
    if (currentStageIndex === 0) {
      robotGroup.position.set(0, 0, Math.sin(stageTimer * 0.8) * 0.4);
      robotGroup.rotation.y = 0;
      updateFrontDisplay('NOVAMINDS', 'PATROL ACTIVE', '#00d2ff');
      statusLightMesh.material.color.setHex(0x00f5a0);
      otDoorLeft.position.x = 1.0;
      otDoorRight.position.x = 2.0;
      doorSecurityLight.material.color.setHex(0xff3344);
      cardBadgeMesh.position.set(2.8, 1.5, -3.4);
      priorityTargetBeacon.material.opacity = 0.0;
    }

    // -------------------------------------------------------------
    // STAGE 1: 01 — ACKNOWLEDGEMENT BEFORE ENTRY
    // -------------------------------------------------------------
    else if (currentStageIndex === 1) {
      // Robot arrives at Ward Doorway
      robotGroup.position.x = THREE.MathUtils.lerp(-1.5, 0.4, Math.min(progress * 1.5, 1.0));
      robotGroup.position.z = THREE.MathUtils.lerp(0.5, -2.2, Math.min(progress * 1.5, 1.0));
      robotGroup.rotation.y = -Math.PI / 6;

      if (progress < 0.45) {
        // Step 1: Door is Locked, Waiting for Auth
        updateFrontDisplay('LOCKED', 'TAP BADGE TO ENTER', '#ef4444');
        statusLightMesh.material.color.setHex(0xef4444);
        doorSecurityLight.material.color.setHex(0xff3344);
        otDoorLeft.position.x = 1.0;
        otDoorRight.position.x = 2.0;
        cardBadgeMesh.position.set(2.8, 1.5 + Math.sin(stageTimer * 4) * 0.05, -3.4);
      } else if (progress < 0.7) {
        // Step 2: Staff taps badge at terminal
        cardBadgeMesh.position.lerp(new THREE.Vector3(2.8, 1.5, -3.65), 0.15);
        updateFrontDisplay('VERIFYING', 'RFID READ: NURSE #402', '#f59e0b');
        doorSecurityLight.material.color.setHex(0xf59e0b);
        statusLightMesh.material.color.setHex(0xf59e0b);
      } else {
        // Step 3: Access Granted -> Door Slides Open -> Robot Enters
        updateFrontDisplay('AUTHORIZED', 'WARD B4 GRANTED', '#22c55e');
        doorSecurityLight.material.color.setHex(0x22c55e);
        statusLightMesh.material.color.setHex(0x22c55e);

        // Slide doors open
        otDoorLeft.position.x = THREE.MathUtils.lerp(otDoorLeft.position.x, 0.4, 0.08);
        otDoorRight.position.x = THREE.MathUtils.lerp(otDoorRight.position.x, 2.6, 0.08);

        // Robot advances safely into ward
        robotGroup.position.z = THREE.MathUtils.lerp(robotGroup.position.z, -3.2, 0.05);
      }
    }

    // -------------------------------------------------------------
    // STAGE 2: 02 — RE-SCAN SPOT (ZERO-GUESSING)
    // -------------------------------------------------------------
    else if (currentStageIndex === 2) {
      robotGroup.position.set(0, 0, 0);
      robotGroup.rotation.y = 0;

      if (progress < 0.25) {
        // Step 1: Intake into Hopper & initial feed
        updateFrontDisplay('AI SCANNING', 'OPTICAL CONE ACTIVE', '#00d2ff');
        laserScanCone.material.color.setHex(0x00d2ff);
        wasteSampleMesh.position.set(0, 0.86, 0.1);
        rescanPlateMesh.material.emissiveIntensity = 0.2;
      } else if (progress < 0.5) {
        // Step 2: LOW CONFIDENCE detected (Zero-guessing rule)
        updateFrontDisplay('UNCERTAIN', 'LOW CONFIDENCE 61%', '#ef4444');
        laserScanCone.material.color.setHex(0xef4444);

        // Right arm picks and moves sample onto RE-SCAN SPOT
        rightArmMesh.rotation.y = THREE.MathUtils.lerp(rightArmMesh.rotation.y, -Math.PI / 3, 0.1);
        wasteSampleMesh.position.lerp(new THREE.Vector3(0.32, 0.86, 0.05), 0.1);
        rescanPlateMesh.material.emissiveIntensity = 0.8;
      } else if (progress < 0.75) {
        // Step 3: Re-Scan Verification in progress
        updateFrontDisplay('RE-SCANNING', 'MULTI-ANGLE CHECK', '#f59e0b');
        laserScanCone.position.set(0.32, 1.0, 0.05);
        laserScanCone.material.color.setHex(0xf59e0b);
        rescanPlateMesh.material.emissiveIntensity = 1.0;
      } else {
        // Step 4: AI Confirms -> Sorted to Red Compartment cleanly
        updateFrontDisplay('CONFIRMED', 'RED: INFECTIOUS PLASTIC', '#22c55e');
        laserScanCone.material.color.setHex(0x22c55e);

        // Left arm takes confirmed item to Red chute
        leftArmMesh.rotation.y = THREE.MathUtils.lerp(leftArmMesh.rotation.y, Math.PI / 4, 0.1);
        wasteSampleMesh.position.lerp(new THREE.Vector3(0.28, 0.55, -0.35), 0.08);
      }
    }

    // -------------------------------------------------------------
    // STAGE 3: 03 — EMERGENCY CALL CODES (B4 PRIORITY)
    // -------------------------------------------------------------
    else if (currentStageIndex === 3) {
      // Beacon Pulses
      priorityTargetBeacon.material.opacity = (Math.sin(stageTimer * 6) + 1.0) * 0.45;

      if (progress < 0.3) {
        // Normal Route A -> C
        robotGroup.position.set(-2.5 + stageTimer * 0.4, 0, 1.2);
        robotGroup.rotation.y = -Math.PI / 4;
        updateFrontDisplay('ROUTE: NORMAL', 'WARD A -> WARD C', '#00d2ff');
      } else if (progress < 0.55) {
        // PRIORITY CODE RECEIVED: "B4"
        updateFrontDisplay('PRIORITY: B4', 'EMERGENCY OVERRIDE', '#ef4444');
        statusLightMesh.material.color.setHex(0xef4444);
        robotGroup.rotation.y = THREE.MathUtils.lerp(robotGroup.rotation.y, Math.PI / 3, 0.08);
      } else {
        // Dynamic reroute towards Ward B4 beacon
        robotGroup.position.lerp(new THREE.Vector3(1.5, 0, -2.0), 0.04);
        updateFrontDisplay('EN ROUTE: B4', 'PRIORITY DISPATCH', '#f59e0b');
        statusLightMesh.material.color.setHex(0xf59e0b);
      }
    }

    // -------------------------------------------------------------
    // STAGE 4: 04 — REAL-TIME DIGITAL RECORD
    // -------------------------------------------------------------
    else if (currentStageIndex === 4) {
      robotGroup.position.set(0, 0, 0);
      robotGroup.rotation.y = Math.sin(stageTimer * 0.5) * 0.2;
      updateFrontDisplay('CPCB AUDIT', 'HASH: 0x8F9C2B...', '#00f5a0');
      statusLightMesh.material.color.setHex(0x00f5a0);

      // Animate floating telemetry data particles
      const posAttr = dataParticlesGroup.children[0].geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i);
        y += delta * 0.4;
        if (y > 2.2) y = 0.5;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    // -------------------------------------------------------------
    // STAGE 5: 05 — SIMPLE DESIGN & PRACTICAL ENGINEERING
    // -------------------------------------------------------------
    else if (currentStageIndex === 5) {
      robotGroup.position.set(0, 0, 0);
      robotGroup.rotation.y = -Math.PI / 5;
      updateFrontDisplay('SIMPLE DESIGN', '2 ARMS • GRAVITY CHUTES', '#38bdf8');

      // Animate dual arms and gravity sorting
      leftArmMesh.rotation.y = Math.sin(stageTimer * 2.5) * 0.4;
      rightArmMesh.rotation.y = -Math.sin(stageTimer * 2.5) * 0.4;
    }
  }

  /* ==========================================================================
     9. EVENT LISTENERS & UI INTERACTIVITY
     ========================================================================== */
  function setupEventListeners() {
    // Play / Pause Toggle
    if (btnPlayPause) {
      btnPlayPause.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (iconPlay) iconPlay.style.display = isPlaying ? 'none' : 'inline-block';
        if (iconPause) iconPause.style.display = isPlaying ? 'inline-block' : 'none';
        if (textPlayPause) textPlayPause.textContent = isPlaying ? 'PAUSE' : 'PLAY';
      });
    }

    // Restart
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        setStage(0, true);
        isPlaying = true;
        if (iconPlay) iconPlay.style.display = 'none';
        if (iconPause) iconPause.style.display = 'inline-block';
        if (textPlayPause) textPlayPause.textContent = 'PAUSE';
      });
    }

    // Previous Stage
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        setStage(currentStageIndex - 1);
      });
    }

    // Next Stage
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        setStage(currentStageIndex + 1);
      });
    }

    // Reset View Camera
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        const stage = STAGES[currentStageIndex];
        camera.position.set(stage.camPos.x, stage.camPos.y, stage.camPos.z);
        controls.target.set(stage.target.x, stage.target.y, stage.target.z);
        controls.update();
      });
    }

    // Cutaway Mode
    if (btnCutaway) {
      btnCutaway.addEventListener('click', () => {
        isCutaway = !isCutaway;
        applyCutaway(isCutaway);
      });
    }

    // Show/Hide Labels
    if (btnLabels) {
      btnLabels.addEventListener('click', () => {
        showLabels = !showLabels;
        labelsGroup.children.forEach((sprite) => {
          sprite.visible = showLabels;
        });
        btnLabels.classList.toggle('active', showLabels);
      });
    }

    // Speed Selector (1x -> 1.5x -> 2x)
    if (btnSpeed) {
      btnSpeed.addEventListener('click', () => {
        if (playbackSpeed === 1.0) playbackSpeed = 1.5;
        else if (playbackSpeed === 1.5) playbackSpeed = 2.0;
        else playbackSpeed = 1.0;
        if (speedText) speedText.textContent = `${playbackSpeed}x`;
      });
    }

    // Timeline Stage Pills
    scenePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const stageIdx = parseInt(pill.getAttribute('data-stage'), 10);
        if (!isNaN(stageIdx)) {
          setStage(stageIdx);
        }
      });
    });

    // Companion Interactive Innovation Cards
    companionCards.forEach((card) => {
      card.addEventListener('click', () => {
        const cardStageIdx = parseInt(card.getAttribute('data-stage'), 10);
        if (!isNaN(cardStageIdx)) {
          setStage(cardStageIdx);
          container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  /* ==========================================================================
     10. WINDOW RESIZE & ANIMATION LOOP
     ========================================================================== */
  function onResize() {
    if (!container || !renderer || !camera) return;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 520;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (isPlaying) {
      stageTimer += delta * playbackSpeed;
      if (stageTimer >= STAGES[currentStageIndex].duration) {
        setStage(currentStageIndex + 1);
      }
    }

    updateSimulation(delta);

    controls.update();
    renderer.render(scene, camera);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
