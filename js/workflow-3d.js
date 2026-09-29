/**
 * NOVAMINDS — HOW OUR ROBOT WORKS (3D Interactive Workflow Simulator)
 * 8-Stage Biomedical Waste Lifecycle Simulation Engine
 * Three.js + OrbitControls + Real-time Telemetry + Component Cutaway
 */

(function () {
  'use strict';

  // DOM Elements
  const container = document.getElementById('workflowViewport');
  const canvas = document.getElementById('workflow3dCanvas');
  if (!container || !canvas) return;

  // HUD & Telemetry Elements
  const stagePillText = document.getElementById('workflowStagePillText');
  const headlineEl = document.getElementById('workflowHeadline');
  const descEl = document.getElementById('workflowDesc');
  const telState = document.getElementById('telemetryState');
  const telAction = document.getElementById('telAction');
  const telSensors = document.getElementById('telSensors');
  const telAi = document.getElementById('telAi');
  const telArmState = document.getElementById('telArmState');
  const telBatteryVal = document.getElementById('telBatteryVal');
  const telBatteryBar = document.getElementById('telBatteryBar');
  const timelineFill = document.getElementById('workflowTimelineFill');
  const timelineHandle = document.getElementById('workflowTimelineHandle');
  const aiScanReticle = document.getElementById('aiScanReticle');
  const aiDetectedTag = document.getElementById('aiDetectedTag');
  const labelsOverlay = document.getElementById('workflowLabelsOverlay');

  // Buttons
  const btnPlayPause = document.getElementById('btnPlayPause');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  const textPlayPause = document.getElementById('textPlayPause');
  const btnRestart = document.getElementById('btnRestart');
  const btnPrevStage = document.getElementById('btnPrevStage');
  const btnNextStage = document.getElementById('btnNextStage');
  const btnResetView = document.getElementById('btnResetView');
  const btnCutawayToggle = document.getElementById('btnCutawayToggle');
  const btnLabelsToggle = document.getElementById('btnLabelsToggle');
  const btnFlowToggle = document.getElementById('btnFlowToggle');
  const btnSpeedToggle = document.getElementById('btnSpeedToggle');
  const speedValText = document.getElementById('speedValText');
  const stageCards = document.querySelectorAll('.wf-stage-card');
  const camPresetBtns = document.querySelectorAll('.btn-cam-preset');

  // Annotation Pins
  const pinHopper = document.getElementById('pinHopper');
  const pinConveyor = document.getElementById('pinConveyor');
  const pinAiCam = document.getElementById('pinAiCam');
  const pinArms = document.getElementById('pinArms');
  const pinChutes = document.getElementById('pinChutes');
  const pinBins = document.getElementById('pinBins');
  const pinBattery = document.getElementById('pinBattery');

  // 3D Scene Variables
  let scene, camera, renderer, controls;
  const clock = new THREE.Clock();

  // Robot Model Hierarchy
  const robotGroup = new THREE.Group();
  const outerShellGroup = new THREE.Group();
  const internalMechanismGroup = new THREE.Group();
  const hospitalEnvironmentGroup = new THREE.Group();
  const flowStreamGroup = new THREE.Group();

  // Moving / Dynamic Parts
  let wheels = [];
  let lidarPuck;
  let frontDoor;
  let hopperGate;
  let conveyorBelt;
  let laserProjectorCone;
  let roboticArms = [];
  let gravityChutes = [];
  let compartments = [];
  let wasteItems = [];
  let batteryElectronicsMesh;
  let batteryPulseLed;
  let wardStationGroup, rfidBadgeMesh;
  let dumpStationGroup, chargingCoilMesh;

  // Materials & Transparency Trackers
  let shellMaterials = [];
  let wireframeShells = [];

  // Flow Particles
  let flowParticles;

  // Simulation State
  const STAGE_COUNT = 8;
  const STAGE_DURATION = 4.0; // 4 seconds per stage
  const TOTAL_CYCLE_TIME = STAGE_COUNT * STAGE_DURATION; // 32 seconds total cycle

  let currentTime = 0.0;
  let currentStage = 1;
  let isPlaying = true;
  let playbackSpeed = 1.0;
  let isCutawayActive = true;
  let showLabels = true;
  let showFlow = true;
  let activeCameraPreset = 'default';

  // Camera Target Interpolation
  const defaultCamPos = new THREE.Vector3(-4.8, 3.2, 5.8);
  const defaultCamTarget = new THREE.Vector3(0, 1.1, 0);
  const camTargetPos = defaultCamPos.clone();
  const camTargetLookAt = defaultCamTarget.clone();

  // Stage Metadata Definitions
  const STAGES_DATA = [
    {
      stage: 1,
      name: "Ward Rounds",
      badge: "TRANSIT",
      desc: "Differential-drive robot navigates hospital corridors twice daily and communicates with smart elevators for multi-floor transit.",
      action: "Corridor SLAM Navigation",
      sensors: "360° LiDAR + Sonar + IMU",
      ai: "Obstacle Avoidance Active",
      arm: "Standby / Locked",
      battery: "94%",
      batteryNum: 94,
      batteryColor: "#10b981",
      cat: null
    },
    {
      stage: 2,
      name: "Acknowledgement",
      badge: "SAFETY",
      desc: "Before entering patient zones, the robot halts and waits for NFC/RFID badge authentication from authorized hospital staff.",
      action: "Waiting Badge Tap",
      sensors: "NFC/RFID Terminal + Dual Cameras",
      ai: "Staff Face & Badge Verify",
      arm: "Standby",
      battery: "91%",
      batteryNum: 91,
      batteryColor: "#10b981",
      cat: null
    },
    {
      stage: 3,
      name: "Waste Collection",
      badge: "INTAKE",
      desc: "Upon authentication, the motorized intake hatch opens smoothly to collect pre-bagged hospital ward biomedical waste safely.",
      action: "Motorized Intake Hatch Open",
      sensors: "Optical Intake Proximity",
      ai: "Intake Volume Metering",
      arm: "Standby",
      battery: "88%",
      batteryNum: 88,
      batteryColor: "#10b981",
      cat: null
    },
    {
      stage: 4,
      name: "Controlled Feeding",
      badge: "FEEDING",
      desc: "Waste enters the stainless steel hopper where a vibrating metering gate feeds individual items onto the motorized conveyor belt.",
      action: "Hopper Metering & Conveyor Run",
      sensors: "Weight Sensors + Feed Speed Encoder",
      ai: "Singulation Detection",
      arm: "Pre-Positioning (Arm 1-4)",
      battery: "82%",
      batteryNum: 82,
      batteryColor: "#10b981",
      cat: "yellow"
    },
    {
      stage: 5,
      name: "AI Identification",
      badge: "AI SCAN",
      desc: "High-resolution AI dual cameras and volumetric structured laser scan items in motion with YOLO-BioMed deep learning classification.",
      action: "YOLO-BioMed Classification",
      sensors: "Dual RGB-D Cameras + Laser Fan",
      ai: "YOLO-BioMed v9 (99.4% Acc)",
      arm: "Tracking Target Coordinates",
      battery: "76%",
      batteryNum: 76,
      batteryColor: "#00d2ff",
      cat: "yellow"
    },
    {
      stage: 6,
      name: "Robotic Sorting",
      badge: "ROBOTICS",
      desc: "Precision multi-axis robotic arms with custom pneumatic/servo grippers pick classified waste items and pivot towards corresponding chutes.",
      action: "Multi-Axis Pick & Place",
      sensors: "Gripper Force Sensor + Joint Encoders",
      ai: "Trajectory Planning Active",
      arm: "Arm #1 Sorting (Yellow Stream)",
      battery: "68%",
      batteryNum: 68,
      batteryColor: "#38bdf8",
      cat: "yellow"
    },
    {
      stage: 7,
      name: "Sealed Compartments",
      badge: "STORAGE",
      desc: "Waste slides down gravity chutes into 4 hermetically isolated bins (Yellow, Red, White, Blue) with continuous UV-C sterilization.",
      action: "Gravity Drop & UV-C Disinfection",
      sensors: "Bin Fill Ultrasonic + Seal Pressure",
      ai: "Volume & Biohazard Safety Check",
      arm: "Resetting to Ready Pose",
      battery: "55%",
      batteryNum: 55,
      batteryColor: "#a855f7",
      cat: null
    },
    {
      stage: 8,
      name: "Auto Dump & Charge",
      badge: "COMPLETE",
      desc: "When compartments are full or battery is low, the robot docks at central bins for auto-dumping and connects to inductive charging.",
      action: "Auto-Dumping & Inductive Charging",
      sensors: "Dock IR Guidance + Power Receiver",
      ai: "Dock Alignment Complete",
      arm: "Parked / Power Off",
      battery: "24% (Recharging +15W)",
      batteryNum: 24,
      batteryColor: "#10b981",
      cat: null
    }
  ];

  /* ==========================================================================
     1. INITIALIZATION & SETUP
     ========================================================================== */
  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.04);

    // Camera
    const rect = container.getBoundingClientRect();
    const aspect = (rect.width || 800) / (rect.height || 520);
    camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 80);
    camera.position.copy(defaultCamPos);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false
    });
    renderer.setSize(rect.width || 800, rect.height || 520);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minDistance = 2.5;
    controls.maxDistance = 18;
    controls.target.copy(defaultCamTarget);

    // Build Scene Graph
    setupLighting();
    buildHospitalEnvironment();
    buildMedicalRobot();
    buildInternalCutawayMechanisms();
    buildFlowStream();

    scene.add(hospitalEnvironmentGroup);
    scene.add(robotGroup);
    scene.add(flowStreamGroup);

    // Initial State
    setCutawayState(true);
    setLabelsVisibility(true);
    setFlowVisibility(true);
    updateStageUI(1);

    // Listeners
    setupEvents();
    window.addEventListener('resize', onResize);
    onResize();

    // Start Loop
    animate();
  }

  /* ==========================================================================
     2. LIGHTING SETUP
     ========================================================================== */
  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.7);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(7, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Medical Cyan Fill Light
    const cyanFill = new THREE.DirectionalLight(0x00d2ff, 0.55);
    cyanFill.position.set(-8, 6, -5);
    scene.add(cyanFill);

    // Rim Light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(0, 8, -10);
    scene.add(rimLight);

    // Soft Blue Floor Accent
    const floorGlow = new THREE.PointLight(0x0284c7, 0.4, 15);
    floorGlow.position.set(0, 0.2, 0);
    scene.add(floorGlow);
  }

  /* ==========================================================================
     3. HOSPITAL ENVIRONMENT (Corridor, Ward RFID Station, Charging Dock)
     ========================================================================== */
  function buildHospitalEnvironment() {
    // Floor Plane
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.3
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    hospitalEnvironmentGroup.add(floor);

    // Cyan High-Tech Floor Grid
    const grid = new THREE.GridHelper(40, 40, 0x00d2ff, 0x1e293b);
    grid.position.y = 0.005;
    hospitalEnvironmentGroup.add(grid);

    // Hospital Corridor Guideline LED Strips
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.6 });
    [-1.8, 1.8].forEach(x => {
      const lineMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.01, 30), lineMat);
      lineMesh.position.set(x, 0.01, 0);
      hospitalEnvironmentGroup.add(lineMesh);
    });

    // Ward Collection Station (at z = -3.5)
    wardStationGroup = new THREE.Group();
    wardStationGroup.position.set(-2.8, 0, -3.5);

    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.5, 20), postMat);
    postMesh.position.y = 0.75;
    postMesh.castShadow = true;
    wardStationGroup.add(postMesh);

    const terminalBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
    );
    terminalBox.position.set(0.25, 1.35, 0);
    wardStationGroup.add(terminalBox);

    // NFC / RFID Badge Ring
    rfidBadgeMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.1, 24),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    rfidBadgeMesh.position.set(0.36, 1.35, 0);
    rfidBadgeMesh.rotation.y = Math.PI / 2;
    wardStationGroup.add(rfidBadgeMesh);

    hospitalEnvironmentGroup.add(wardStationGroup);

    // Inductive Charging & Central Dump Station (at z = 3.5)
    dumpStationGroup = new THREE.Group();
    dumpStationGroup.position.set(0, 0, 4.2);

    const dockBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const dockBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 2.0), dockBaseMat);
    dockBase.position.y = 0.05;
    dockBase.receiveShadow = true;
    dumpStationGroup.add(dockBase);

    // Charging Pad Coil Ring
    chargingCoilMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.03, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 0.8 })
    );
    chargingCoilMesh.rotation.x = Math.PI / 2;
    chargingCoilMesh.position.y = 0.12;
    dumpStationGroup.add(chargingCoilMesh);

    // Station Tower Back
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 });
    const stationTower = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 0.4), towerMat);
    stationTower.position.set(0, 0.8, 0.9);
    dumpStationGroup.add(stationTower);

    // Station Status LED Light
    const stationLed = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    stationLed.position.set(0, 1.35, 0.68);
    dumpStationGroup.add(stationLed);

    hospitalEnvironmentGroup.add(dumpStationGroup);
  }

  /* ==========================================================================
     4. ROBOT MODEL (Precise NOVAMINDS Design)
     ========================================================================== */
  function buildMedicalRobot() {
    // 1. Heavy-duty Chassis Frame
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x181e29,
      metalness: 0.85,
      roughness: 0.35
    });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.28, 2.6), chassisMat);
    chassis.position.y = 0.32;
    chassis.castShadow = true;
    robotGroup.add(chassis);

    // 4 Wheels
    const wheelPositions = [
      [-0.9, 0.24, 0.8],
      [0.9, 0.24, 0.8],
      [-0.9, 0.24, -0.8],
      [0.9, 0.24, -0.8]
    ];
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });

    wheelPositions.forEach(pos => {
      const wGroup = new THREE.Group();
      wGroup.position.set(pos[0], pos[1], pos[2]);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 24), wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.17, 16), rimMat);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      robotGroup.add(wGroup);
      wheels.push(wGroup);
    });

    // 2. 360° Top LiDAR Turret
    const lidarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    );
    lidarBase.position.set(0, 1.95, -0.9);
    robotGroup.add(lidarBase);

    lidarPuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.9, roughness: 0.1 })
    );
    lidarPuck.position.set(0, 2.08, -0.9);
    const lidarLaser = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.14), new THREE.MeshBasicMaterial({ color: 0x00d2ff }));
    lidarLaser.position.set(0.11, 0, 0);
    lidarPuck.add(lidarLaser);
    robotGroup.add(lidarPuck);

    // 3. Medical Outer Shell (White polymer body + Anthracite skirt + Red Cross Livery)
    const medicalWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.2
    });
    shellMaterials.push(medicalWhiteMat);

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      roughness: 0.35,
      metalness: 0.6,
      transparent: true,
      opacity: 0.2
    });
    shellMaterials.push(darkAccentMat);

    // Main Hood
    const hoodGeo = new THREE.BoxGeometry(1.6, 1.35, 2.45);
    const mainHood = new THREE.Mesh(hoodGeo, medicalWhiteMat);
    mainHood.position.set(0, 1.15, 0);
    mainHood.castShadow = true;
    outerShellGroup.add(mainHood);

    // Skirting
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.22, 2.49), darkAccentMat);
    skirt.position.set(0, 0.52, 0);
    outerShellGroup.add(skirt);

    // Medical Red Cross Livery on sides
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.2 });
    shellMaterials.push(crossMat);

    [-0.81, 0.81].forEach(x => {
      const ch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.28), crossMat);
      ch.position.set(x, 1.3, 0.7);
      outerShellGroup.add(ch);

      const cv = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.08), crossMat);
      cv.position.set(x, 1.3, 0.7);
      outerShellGroup.add(cv);
    });

    // Front Motorized Intake Door / Hatch
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x003366,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.25
    });
    shellMaterials.push(doorMat);

    frontDoor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.08), doorMat);
    frontDoor.position.set(0, 1.22, -1.24);
    outerShellGroup.add(frontDoor);

    // Wireframe Edges (Cyan Ghost outline for Cutaway mode)
    const wireGeo = new THREE.EdgesGeometry(hoodGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.7 });
    wireframeShells.push(wireMat);
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    wireframe.position.copy(mainHood.position);
    outerShellGroup.add(wireframe);

    robotGroup.add(outerShellGroup);
  }

  /* ==========================================================================
     5. INTERNAL MECHANISMS (Cutaway: Hopper, Conveyor, AI Camera, Arms, Chutes, Bins, Battery)
     ========================================================================== */
  function buildInternalCutawayMechanisms() {
    // 1. (HOPPER) Stainless Steel Intake Hopper & Metering Gate
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const hopper = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 0.55), steelMat);
    hopper.position.set(0, 1.18, -0.85);
    hopper.rotation.x = Math.PI / 10;
    hopper.castShadow = true;
    internalMechanismGroup.add(hopper);

    hopperGate = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 })
    );
    hopperGate.position.set(0, 1.05, -0.6);
    internalMechanismGroup.add(hopperGate);

    // 2. (CONVEYOR) Motorized Conveyor Belt System with Rollers
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.4 });
    const conveyorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 1.6), frameMat);
    conveyorFrame.position.set(0, 1.02, 0.2);
    internalMechanismGroup.add(conveyorFrame);

    const beltMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7, metalness: 0.1 });
    conveyorBelt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 1.55), beltMat);
    conveyorBelt.position.set(0, 1.09, 0.2);
    internalMechanismGroup.add(conveyorBelt);

    // Rollers
    [-0.5, -0.1, 0.3, 0.7, 0.95].forEach(z => {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 16), steelMat);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 1.01, z);
      internalMechanismGroup.add(roller);
    });

    // 3. (AI CAMERA GANTRY) Dual Vision Housing & Volumetric Laser Projector Cone
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });
    const gantryArch = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.08), gantryMat);
    gantryArch.position.set(0, 1.55, -0.35);
    internalMechanismGroup.add(gantryArch);

    [-0.38, 0.38].forEach(x => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), gantryMat);
      strut.position.set(x, 1.3, -0.35);
      internalMechanismGroup.add(strut);
    });

    const aiCamHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.11, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    aiCamHousing.position.set(0, 1.5, -0.35);
    internalMechanismGroup.add(aiCamHousing);

    // Dual Optical Lenses
    [-0.06, 0.06].forEach(x => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16), new THREE.MeshBasicMaterial({ color: 0x00d2ff }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, 1.5, -0.27);
      internalMechanismGroup.add(lens);
    });

    // Volumetric Laser Projection Cone (Scans waste on Stage 5)
    const coneGeo = new THREE.ConeGeometry(0.32, 0.55, 24, 1, true);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    laserProjectorCone = new THREE.Mesh(coneGeo, laserMat);
    laserProjectorCone.position.set(0, 1.22, -0.35);
    laserProjectorCone.rotation.x = Math.PI;
    internalMechanismGroup.add(laserProjectorCone);

    // 4. (ROBOTIC ARMS) 2 Multi-Axis Sorting Arms (Left and Right)
    const armCategoryColors = [0xf59e0b, 0xef4444, 0xf8fafc, 0x3b82f6];
    const armZPositions = [0.05, 0.45];

    for (let i = 0; i < 2; i++) {
      const isLeft = (i === 0);
      const armGroup = new THREE.Group();
      armGroup.position.set(isLeft ? -0.42 : 0.42, 1.08, armZPositions[i]);

      // Base Turret
      const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
      );
      armGroup.add(turret);

      // Shoulder
      const shoulder = new THREE.Group();
      shoulder.position.y = 0.06;

      const servoMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 16, 16),
        new THREE.MeshStandardMaterial({ color: armCategoryColors[i], metalness: 0.6, roughness: 0.3 })
      );
      shoulder.add(servoMesh);

      const upperArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.26, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
      );
      upperArm.position.y = 0.13;
      shoulder.add(upperArm);

      // Elbow
      const elbow = new THREE.Group();
      elbow.position.y = 0.26;

      const elbowServo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), servoMesh.material);
      elbow.add(elbowServo);

      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.035), upperArm.material);
      forearm.position.y = 0.11;
      elbow.add(forearm);

      // Wrist & Gripper
      const wrist = new THREE.Group();
      wrist.position.y = 0.22;

      const clawMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
      const clawL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), clawMat);
      clawL.position.set(-0.025, 0.035, 0);
      const clawR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.07, 0.03), clawMat);
      clawR.position.set(0.025, 0.035, 0);
      wrist.add(clawL);
      wrist.add(clawR);

      elbow.add(wrist);
      shoulder.add(elbow);
      armGroup.add(shoulder);

      internalMechanismGroup.add(armGroup);

      roboticArms.push({
        group: armGroup,
        shoulder: shoulder,
        elbow: elbow,
        wrist: wrist,
        isLeft: isLeft,
        targetZ: armZPositions[i],
        homeShoulder: isLeft ? 0.3 : -0.3,
        homeElbow: -0.5
      });
    }

    // 5. (GRAVITY CHUTES) 4 Angled Chutes Leading Down to Compartments
    const chuteZPositions = [-0.3, 0.1, 0.5, 0.85];
    for (let i = 0; i < 4; i++) {
      const isLeft = (i % 2 === 0);
      const chuteGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.48, 16, 1, true);
      const chuteMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.8,
        roughness: 0.3,
        side: THREE.DoubleSide
      });
      const chute = new THREE.Mesh(chuteGeo, chuteMat);
      chute.position.set(isLeft ? -0.5 : 0.5, 0.82, chuteZPositions[i]);
      chute.rotation.z = isLeft ? Math.PI / 5.5 : -Math.PI / 5.5;
      internalMechanismGroup.add(chute);
      gravityChutes.push(chute);
    }

    // 6. (FOUR SEALED COMPARTMENTS) With UV-C Germicidal LEDs
    const binColors = [0xf59e0b, 0xef4444, 0xf8fafc, 0x3b82f6];
    for (let i = 0; i < 4; i++) {
      const isLeft = (i % 2 === 0);
      const binGroup = new THREE.Group();
      binGroup.position.set(isLeft ? -0.5 : 0.5, 0.48, chuteZPositions[i]);

      const tankGeo = new THREE.BoxGeometry(0.44, 0.38, 0.32);
      const tankMat = new THREE.MeshStandardMaterial({
        color: binColors[i],
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.85
      });
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.castShadow = true;
      binGroup.add(tank);

      // UV-C Germicidal LED
      const uvc = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
      uvc.position.set(0, 0.15, 0);
      binGroup.add(uvc);

      internalMechanismGroup.add(binGroup);
      compartments.push({ group: binGroup, tank: tank, uvc: uvc, color: binColors[i] });
    }

    // 7. (BATTERY / ELECTRONICS BAY) Located at base rear
    const battGroup = new THREE.Group();
    battGroup.position.set(0, 0.4, 0.85);

    // LiFePO4 Battery Block
    const battGeo = new THREE.BoxGeometry(0.6, 0.22, 0.4);
    const battMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    batteryElectronicsMesh = new THREE.Mesh(battGeo, battMat);
    battGroup.add(batteryElectronicsMesh);

    // BMS Circuit Board & Copper Terminals
    const bmsGeo = new THREE.BoxGeometry(0.5, 0.04, 0.3);
    const bmsMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4 });
    const bms = new THREE.Mesh(bmsGeo, bmsMat);
    bms.position.y = 0.13;
    battGroup.add(bms);

    // Pulsing Energy Status LED
    batteryPulseLed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    batteryPulseLed.position.set(0, 0.17, 0);
    battGroup.add(batteryPulseLed);

    internalMechanismGroup.add(battGroup);

    // 8. (WASTE ITEMS) 4 Representative Biomedical Waste Objects
    createWasteItems();

    robotGroup.add(internalMechanismGroup);
  }

  /* ==========================================================================
     6. WASTE ITEMS CREATION
     ========================================================================== */
  function createWasteItems() {
    // Yellow Biohazard Pouch
    const yellow = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
    );
    yellow.position.set(0, 1.15, -0.85);
    internalMechanismGroup.add(yellow);

    // Red Plastic Container
    const red = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 })
    );
    red.rotation.z = Math.PI / 2;
    red.position.set(0, 1.15, -1.1);
    internalMechanismGroup.add(red);

    // White Sharps Container
    const white = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
    );
    white.position.set(0, 1.15, -1.35);
    internalMechanismGroup.add(white);

    // Blue Glass Ampoule
    const blue = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.1 })
    );
    blue.position.set(0, 1.15, -1.6);
    internalMechanismGroup.add(blue);

    wasteItems = [
      { mesh: yellow, startZ: -0.85, type: 'yellow', name: 'Yellow: Infectious' },
      { mesh: red, startZ: -1.1, type: 'red', name: 'Red: Recyclable Plastic' },
      { mesh: white, startZ: -1.35, type: 'white', name: 'White: Sharps Container' },
      { mesh: blue, startZ: -1.6, type: 'blue', name: 'Blue: Glass Vial' }
    ];
  }

  /* ==========================================================================
     7. FLOW STREAM PARTICLES (Visualizing Process Route)
     ========================================================================== */
  function buildFlowStream() {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = 1.1 + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = -1.0 + Math.random() * 2.0;

      colors[i * 3] = 0.0;
      colors[i * 3 + 1] = 0.82;
      colors[i * 3 + 2] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    flowParticles = new THREE.Points(geometry, material);
    flowStreamGroup.add(flowParticles);
  }

  /* ==========================================================================
     8. ANIMATION ENGINE (Evaluating 8 Stages: 0 to 32 Seconds)
     ========================================================================== */
  function evaluateSimulation(t) {
    const stageIndex = Math.min(7, Math.floor(t / STAGE_DURATION));
    const stageProgress = (t % STAGE_DURATION) / STAGE_DURATION; // 0.0 to 1.0 within stage
    const activeStage = stageIndex + 1;

    // Continuous Wheel Rotation
    wheels.forEach(w => w.children[0].rotation.x += 0.04);
    if (lidarPuck) lidarPuck.rotation.y += 0.05;

    // Battery Pulse LED
    if (batteryPulseLed) {
      batteryPulseLed.scale.setScalar(1.0 + Math.sin(t * 8) * 0.25);
    }

    // Update Stage UI when stage changes
    if (currentStage !== activeStage) {
      currentStage = activeStage;
      updateStageUI(activeStage);
    }

    // ------------------------------------------------------------------------
    // STAGE 1: WARD ROUNDS (Transit along corridor)
    // ------------------------------------------------------------------------
    if (activeStage === 1) {
      const p = stageProgress;
      // Moving from z = 2.0 to z = -3.5 (approaching ward bin)
      robotGroup.position.set(-1.8 * p, 0, 2.0 - p * 5.5);
      robotGroup.rotation.y = 0;

      frontDoor.position.y = 1.22;
      laserProjectorCone.material.opacity = 0.0;
      aiScanReticle.classList.remove('visible');
      resetWastePositions();

      if (activeCameraPreset === 'default') {
        camTargetPos.set(robotGroup.position.x - 3.8, 2.4, robotGroup.position.z + 4.2);
        camTargetLookAt.set(robotGroup.position.x, 1.1, robotGroup.position.z);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 2: ACKNOWLEDGEMENT (Safety Badge Verification)
    // ------------------------------------------------------------------------
    else if (activeStage === 2) {
      const p = stageProgress;
      robotGroup.position.set(-1.8, 0, -3.5);
      robotGroup.rotation.y = 0;

      // RFID Badge Pulsing
      rfidBadgeMesh.scale.setScalar(1.0 + Math.sin(t * 14) * 0.35);

      frontDoor.position.y = 1.22;
      laserProjectorCone.material.opacity = 0.0;
      aiScanReticle.classList.remove('visible');

      if (activeCameraPreset === 'default') {
        camTargetPos.set(robotGroup.position.x + 2.2, 1.6, robotGroup.position.z - 2.2);
        camTargetLookAt.set(robotGroup.position.x, 1.2, robotGroup.position.z - 0.6);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 3: WASTE COLLECTION (Intake Door Opens & Waste Received)
    // ------------------------------------------------------------------------
    else if (activeStage === 3) {
      const p = stageProgress;
      robotGroup.position.set(-1.8, 0, -3.5);

      // Door Rises Up
      const doorOpen = Math.min(1.0, p * 2.0);
      frontDoor.position.y = 1.22 + doorOpen * 0.45;

      // Waste Enters Hopper
      wasteItems[0].mesh.position.set(0, 1.25 - p * 0.1, -1.25 + p * 0.4);

      laserProjectorCone.material.opacity = 0.0;
      aiScanReticle.classList.remove('visible');

      if (activeCameraPreset === 'default') {
        camTargetPos.set(robotGroup.position.x - 2.8, 2.0, robotGroup.position.z - 1.8);
        camTargetLookAt.set(robotGroup.position.x, 1.2, robotGroup.position.z - 0.6);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 4: CONTROLLED FEEDING (Hopper Gate Vibration & Conveyor Transfer)
    // ------------------------------------------------------------------------
    else if (activeStage === 4) {
      const p = stageProgress;
      robotGroup.position.set(-1.8, 0, -3.5);

      frontDoor.position.y = 1.22; // Door closes
      hopperGate.position.y = 1.05 + Math.sin(t * 20) * 0.03; // Gate vibrating

      // Waste items slide down hopper onto moving conveyor
      wasteItems[0].mesh.position.set(0, 1.15, -0.85 + p * 0.4);
      wasteItems[1].mesh.position.set(0, 1.15, -1.1 + p * 0.4);

      laserProjectorCone.material.opacity = 0.0;
      aiScanReticle.classList.remove('visible');

      if (activeCameraPreset === 'default') {
        camTargetPos.set(robotGroup.position.x - 2.6, 2.5, robotGroup.position.z + 1.2);
        camTargetLookAt.set(robotGroup.position.x, 1.1, robotGroup.position.z);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 5: AI IDENTIFICATION (Vision Camera & Laser Beam Scan)
    // ------------------------------------------------------------------------
    else if (activeStage === 5) {
      const p = stageProgress;
      robotGroup.position.set(-1.8, 0, -3.5);

      // Waste positioned directly under camera gantry
      wasteItems[0].mesh.position.set(0, 1.15, -0.35);

      // Active Laser Cone Scan Effect
      laserProjectorCone.material.opacity = 0.45 + Math.sin(t * 16) * 0.25;
      laserProjectorCone.rotation.y += 0.03;

      aiScanReticle.classList.add('visible');
      aiDetectedTag.innerText = p < 0.5 ? "AI SCANNING..." : "IDENTIFIED: YELLOW INFECTIOUS (99.4%)";

      if (activeCameraPreset === 'default') {
        camTargetPos.set(robotGroup.position.x - 2.2, 2.2, robotGroup.position.z - 0.1);
        camTargetLookAt.set(robotGroup.position.x, 1.25, robotGroup.position.z - 0.35);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 6: ROBOTIC SORTING (Pick & Swivel to Gravity Chute)
    // ------------------------------------------------------------------------
    else if (activeStage === 6) {
      const p = stageProgress;
      robotGroup.position.set(-1.8, 0, -3.5);

      laserProjectorCone.material.opacity = 0.1;
      aiScanReticle.classList.remove('visible');

      const arm = roboticArms[0];
      const isLeft = arm.isLeft;

      if (p < 0.3) {
        // Reach & Grip
        const f = p / 0.3;
        arm.shoulder.rotation.z = arm.homeShoulder + (isLeft ? 0.3 : -0.3) * f;
        arm.elbow.rotation.z = arm.homeElbow - 0.35 * f;
        wasteItems[0].mesh.position.set(0, 1.15, arm.targetZ);
      } else if (p < 0.7) {
        // Lift & Swivel toward chute
        const f = (p - 0.3) / 0.4;
        arm.group.rotation.y = (isLeft ? -Math.PI / 3.2 : Math.PI / 3.2) * f;
        const dropX = isLeft ? -f * 0.45 : f * 0.45;
        wasteItems[0].mesh.position.set(dropX, 1.28 - f * 0.2, arm.targetZ);
      } else {
        // Drop down chute
        const f = (p - 0.7) / 0.3;
        const finalX = isLeft ? -0.5 : 0.5;
        wasteItems[0].mesh.position.set(finalX, 1.08 - f * 0.5, arm.targetZ);
      }

      if (activeCameraPreset === 'default') {
        camTargetPos.set(robotGroup.position.x - 2.0, 2.0, robotGroup.position.z + 0.8);
        camTargetLookAt.set(robotGroup.position.x, 1.1, robotGroup.position.z + 0.1);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 7: SEALED COMPARTMENTS (UV-C Sterilization in Hermetic Tanks)
    // ------------------------------------------------------------------------
    else if (activeStage === 7) {
      const p = stageProgress;
      robotGroup.position.set(-1.8, 0, -3.5);

      // Arms reset
      roboticArms.forEach(a => {
        a.shoulder.rotation.z = a.homeShoulder;
        a.elbow.rotation.z = a.homeElbow;
        a.group.rotation.y = 0;
      });

      // Waste items settled in 4 tanks
      wasteItems[0].mesh.position.set(-0.5, 0.45, -0.3);
      wasteItems[1].mesh.position.set(0.5, 0.45, 0.1);
      wasteItems[2].mesh.position.set(-0.5, 0.45, 0.5);
      wasteItems[3].mesh.position.set(0.5, 0.45, 0.85);

      // UV-C LEDs Pulsing Purple
      compartments.forEach((comp, idx) => {
        comp.uvc.scale.setScalar(1.0 + Math.sin(t * 10 + idx) * 0.45);
      });

      aiScanReticle.classList.remove('visible');

      if (activeCameraPreset === 'default') {
        camTargetPos.set(robotGroup.position.x - 2.4, 1.4, robotGroup.position.z + 0.6);
        camTargetLookAt.set(robotGroup.position.x, 0.6, robotGroup.position.z + 0.3);
      }
    }

    // ------------------------------------------------------------------------
    // STAGE 8: AUTO DUMP & CHARGE (Docking & Inductive Recharging)
    // ------------------------------------------------------------------------
    else if (activeStage === 8) {
      const p = stageProgress;

      // Robot travels to docking station (z = 4.2)
      const currentZ = -3.5 + p * 7.7;
      robotGroup.position.set(-1.8 * (1 - p), 0, Math.min(4.2, currentZ));

      // Inductive Coil Glow Pulses
      chargingCoilMesh.material.emissiveIntensity = 1.0 + Math.sin(t * 12) * 0.6;

      aiScanReticle.classList.remove('visible');

      if (activeCameraPreset === 'default') {
        const orbitAngle = p * Math.PI * 0.5 + 0.5;
        const rad = 4.8;
        camTargetPos.set(Math.sin(orbitAngle) * rad, 2.0, 4.2 + Math.cos(orbitAngle) * rad);
        camTargetLookAt.set(0, 1.0, 4.2);
      }
    }

    // Animate Flow Particles
    if (showFlow && flowParticles) {
      const positions = flowParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 2] += 0.02 * playbackSpeed;
        if (positions[i * 3 + 2] > 1.2) {
          positions[i * 3 + 2] = -1.0;
        }
      }
      flowParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Smooth Camera Interpolation
    camera.position.lerp(camTargetPos, 0.06);
    controls.target.lerp(camTargetLookAt, 0.06);

    // Update Progress Bar
    const cyclePct = (t / TOTAL_CYCLE_TIME) * 100;
    timelineFill.style.width = `${cyclePct}%`;
    timelineHandle.style.left = `${cyclePct}%`;

    // Update 3D Component Annotation Pins
    if (showLabels) {
      updateComponentPins();
    }
  }

  /* ==========================================================================
     9. RESET WASTE POSITIONS
     ========================================================================== */
  function resetWastePositions() {
    wasteItems.forEach(item => {
      item.mesh.position.set(0, 1.15, item.startZ);
    });
    roboticArms.forEach(a => {
      a.shoulder.rotation.z = a.homeShoulder;
      a.elbow.rotation.z = a.homeElbow;
      a.group.rotation.y = 0;
    });
  }

  /* ==========================================================================
     10. UPDATE STAGE UI & TELEMETRY
     ========================================================================== */
  function updateStageUI(stageNum) {
    const data = STAGES_DATA[stageNum - 1];
    if (!data) return;

    // Header HUD
    stagePillText.innerText = `STAGE 0${data.stage} / 08 • ${data.name.toUpperCase()}`;
    headlineEl.innerText = `${data.stage}. ${data.name}`;
    descEl.innerText = data.desc;

    // Telemetry Box
    telState.innerText = data.badge;
    telAction.innerText = data.action;
    telSensors.innerText = data.sensors;
    telAi.innerText = data.ai;
    telArmState.innerText = data.arm;
    telBatteryVal.innerText = data.battery;
    telBatteryVal.style.color = data.batteryColor;
    telBatteryBar.style.width = `${data.batteryNum}%`;
    telBatteryBar.style.backgroundColor = data.batteryColor;

    // Highlight Active Category in Legend
    document.querySelectorAll('.wcat-item').forEach(el => {
      const cat = el.getAttribute('data-cat');
      el.classList.toggle('active', cat === data.cat);
    });

    // Highlight Active Stage Card
    stageCards.forEach(card => {
      const s = parseInt(card.getAttribute('data-stage'), 10);
      card.classList.toggle('active', s === stageNum);
    });
  }

  /* ==========================================================================
     11. 3D COMPONENT ANNOTATION PINS PROJECTION
     ========================================================================== */
  function updateComponentPins() {
    const pinsMap = [
      { el: pinHopper, pos: new THREE.Vector3(0, 1.25, -0.85) },
      { el: pinConveyor, pos: new THREE.Vector3(0, 1.1, 0.2) },
      { el: pinAiCam, pos: new THREE.Vector3(0, 1.6, -0.35) },
      { el: pinArms, pos: new THREE.Vector3(-0.45, 1.3, 0.1) },
      { el: pinChutes, pos: new THREE.Vector3(0.5, 0.85, 0.4) },
      { el: pinBins, pos: new THREE.Vector3(-0.5, 0.45, 0.5) },
      { el: pinBattery, pos: new THREE.Vector3(0, 0.45, 0.85) }
    ];

    const tempV = new THREE.Vector3();
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    pinsMap.forEach(item => {
      if (!item.el) return;

      // Transform local robot position to world
      tempV.copy(item.pos).applyMatrix4(robotGroup.matrixWorld);

      // Project to 2D screen coordinates
      tempV.project(camera);

      // Check if in front of camera
      if (tempV.z > 1) {
        item.el.style.display = 'none';
        return;
      }

      const x = (tempV.x * 0.5 + 0.5) * width;
      const y = (-(tempV.y * 0.5) + 0.5) * height;

      item.el.style.display = 'flex';
      item.el.style.left = `${x}px`;
      item.el.style.top = `${y}px`;
    });
  }

  /* ==========================================================================
     12. TOGGLE MODES (Cutaway, Labels, Flow)
     ========================================================================== */
  function setCutawayState(active) {
    isCutawayActive = active;
    btnCutawayToggle.classList.toggle('active', active);

    const opacity = active ? 0.2 : 0.95;
    shellMaterials.forEach(m => {
      m.opacity = opacity;
      m.transparent = true;
    });

    const wireOpacity = active ? 0.75 : 0.0;
    wireframeShells.forEach(m => {
      m.opacity = wireOpacity;
    });
  }

  function setLabelsVisibility(show) {
    showLabels = show;
    btnLabelsToggle.classList.toggle('active', show);
    labelsOverlay.style.display = show ? 'block' : 'none';
  }

  function setFlowVisibility(show) {
    showFlow = show;
    btnFlowToggle.classList.toggle('active', show);
    flowStreamGroup.visible = show;
  }

  /* ==========================================================================
     13. CAMERA PRESET HANDLER
     ========================================================================== */
  function setCameraPreset(mode) {
    activeCameraPreset = mode;
    camPresetBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-view') === mode));

    if (mode === 'default') {
      camTargetPos.set(robotGroup.position.x - 4.8, 3.2, robotGroup.position.z + 5.8);
      camTargetLookAt.set(robotGroup.position.x, 1.1, robotGroup.position.z);
    } else if (mode === 'cutaway') {
      camTargetPos.set(robotGroup.position.x - 3.8, 1.8, robotGroup.position.z + 0.2);
      camTargetLookAt.set(robotGroup.position.x, 1.1, robotGroup.position.z + 0.1);
    } else if (mode === 'top') {
      camTargetPos.set(robotGroup.position.x, 6.2, robotGroup.position.z + 0.1);
      camTargetLookAt.set(robotGroup.position.x, 1.0, robotGroup.position.z);
    } else if (mode === 'chutes') {
      camTargetPos.set(robotGroup.position.x + 3.2, 1.2, robotGroup.position.z + 0.6);
      camTargetLookAt.set(robotGroup.position.x, 0.6, robotGroup.position.z + 0.3);
    }
  }

  /* ==========================================================================
     14. USER CONTROLS & EVENT LISTENERS
     ========================================================================== */
  function setupEvents() {
    // Play / Pause Toggle
    function togglePlay() {
      isPlaying = !isPlaying;
      iconPlay.style.display = isPlaying ? 'none' : 'block';
      iconPause.style.display = isPlaying ? 'block' : 'none';
      textPlayPause.innerText = isPlaying ? 'Pause' : 'Play';
    }

    btnPlayPause.addEventListener('click', togglePlay);

    // Restart
    btnRestart.addEventListener('click', () => {
      currentTime = 0.0;
      isPlaying = true;
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      textPlayPause.innerText = 'Pause';
      evaluateSimulation(0);
    });

    // Previous Stage
    btnPrevStage.addEventListener('click', () => {
      const prev = currentStage > 1 ? currentStage - 1 : STAGE_COUNT;
      jumpToStage(prev);
    });

    // Next Stage
    btnNextStage.addEventListener('click', () => {
      const next = currentStage < STAGE_COUNT ? currentStage + 1 : 1;
      jumpToStage(next);
    });

    // Reset View
    btnResetView.addEventListener('click', () => {
      setCameraPreset('default');
      camera.position.copy(defaultCamPos);
      controls.target.copy(defaultCamTarget);
    });

    // Cutaway Mode Toggle
    btnCutawayToggle.addEventListener('click', () => {
      setCutawayState(!isCutawayActive);
    });

    // Labels Toggle
    btnLabelsToggle.addEventListener('click', () => {
      setLabelsVisibility(!showLabels);
    });

    // Flow Toggle
    btnFlowToggle.addEventListener('click', () => {
      setFlowVisibility(!showFlow);
    });

    // Speed Toggle (1.0x -> 1.5x -> 2.0x -> 0.5x -> 1.0x)
    const speeds = [1.0, 1.5, 2.0, 0.5];
    let speedIdx = 0;
    btnSpeedToggle.addEventListener('click', () => {
      speedIdx = (speedIdx + 1) % speeds.length;
      playbackSpeed = speeds[speedIdx];
      speedValText.innerText = `${playbackSpeed.toFixed(1)}x`;
    });

    // Stage Card Click Handlers
    stageCards.forEach(card => {
      card.addEventListener('click', () => {
        const stageNum = parseInt(card.getAttribute('data-stage'), 10);
        jumpToStage(stageNum);
      });
    });

    // Camera Preset Buttons
    camPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setCameraPreset(btn.getAttribute('data-view'));
      });
    });

    // Timeline Bar Scrubbing
    const timelineBar = document.getElementById('workflowTimelineBar');
    let isScrubbing = false;

    function scrub(e) {
      const rect = timelineBar.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const fraction = clickX / rect.width;
      currentTime = fraction * TOTAL_CYCLE_TIME;
      evaluateSimulation(currentTime);
    }

    timelineBar.addEventListener('mousedown', e => {
      isScrubbing = true;
      scrub(e);
    });
    window.addEventListener('mousemove', e => {
      if (isScrubbing) scrub(e);
    });
    window.addEventListener('mouseup', () => {
      isScrubbing = false;
    });

    // Keyboard Shortcuts (Space: Play/Pause, Left/Right: Stages, R: Restart, C: Cutaway)
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        btnPrevStage.click();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        btnNextStage.click();
      } else if (e.code === 'KeyR') {
        btnRestart.click();
      } else if (e.code === 'KeyC') {
        btnCutawayToggle.click();
      }
    });
  }

  function jumpToStage(stageNum) {
    currentTime = (stageNum - 1) * STAGE_DURATION + 0.1;
    evaluateSimulation(currentTime);
  }

  /* ==========================================================================
     15. RESIZE HANDLER
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

  /* ==========================================================================
     16. ANIMATION LOOP
     ========================================================================== */
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (isPlaying) {
      currentTime += delta * playbackSpeed;
      if (currentTime >= TOTAL_CYCLE_TIME) {
        currentTime = 0.0;
      }
      evaluateSimulation(currentTime);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
