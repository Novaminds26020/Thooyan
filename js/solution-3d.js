/**
 * NOVAMINDS — OUR SOLUTION (Cinematic Interactive 3D Product Demonstration)
 * Complete Multi-Scene Innovation Engine
 * Step-by-Step Interactive 3D Demonstration:
 * Hospital Corridor -> Autonomous Ward Round -> Staff Authorization -> Common Bin Intake ->
 * AI Identification & Sorting -> Four Sealed Compartments -> Digital Tracking -> Auto Dump & Charge
 */

(function () {
  'use strict';

  // DOM Elements
  const container = document.getElementById('solutionViewport');
  const canvas = document.getElementById('solutionRobotCanvas');
  if (!container || !canvas) return;

  // HUD & Telemetry Elements
  const stagePillText = document.getElementById('solStagePillText');
  const headlineEl = document.getElementById('solHeadline');
  const descEl = document.getElementById('solDesc');
  const innovationTag = document.getElementById('solInnovationTag');
  const telState = document.getElementById('solTelState');
  const telNav = document.getElementById('solTelNav');
  const telAuth = document.getElementById('solTelAuth');
  const telAi = document.getElementById('solTelAi');
  const telArm = document.getElementById('solTelArm');
  const telBatteryVal = document.getElementById('solTelBatteryVal');
  const telBatteryBar = document.getElementById('solTelBatteryBar');
  const trackingOverlay = document.getElementById('solTrackingOverlay');
  const aiReticleOverlay = document.getElementById('solAiReticle');
  const timelineFill = document.getElementById('solTimelineFill');
  const timelineHandle = document.getElementById('solTimelineHandle');

  // Control Buttons
  const btnPlayPause = document.getElementById('solBtnPlayPause');
  const iconPlay = document.getElementById('solIconPlay');
  const iconPause = document.getElementById('solIconPause');
  const textPlayPause = document.getElementById('solTextPlayPause');
  const btnRestart = document.getElementById('solBtnRestart');
  const btnPrev = document.getElementById('solBtnPrev');
  const btnNext = document.getElementById('solBtnNext');
  const btnResetView = document.getElementById('solBtnResetView');
  const btnCutaway = document.getElementById('solBtnCutaway');
  const btnSpeed = document.getElementById('solBtnSpeed');
  const speedText = document.getElementById('solSpeedText');
  const scenePills = document.querySelectorAll('.sol-scene-tab');
  const camPresetBtns = document.querySelectorAll('.btn-sol-cam');

  // 3D Scene Variables
  let scene, camera, renderer, controls;
  const clock = new THREE.Clock();

  // Model Groups
  const robotGroup = new THREE.Group();
  const outerShellGroup = new THREE.Group();
  const internalGroup = new THREE.Group();
  const hospitalGroup = new THREE.Group();
  const dataParticlesGroup = new THREE.Group();

  // Robot Parts
  let wheels = [];
  let lidarPuck;
  let frontHatch;
  let conveyorBelt;
  let aiLaserCone;
  let roboticArms = [];
  let compartments = [];
  let wasteItems = [];
  let batteryPackMesh;
  let batteryLed;
  let wardStationGroup, staffBadgeMesh, statusScreenMesh;
  let centralDumpStation, chargingRingMesh;
  let commonWardBinGroup;

  // Materials & Cutaway Trackers
  let shellMaterials = [];
  let wireframeShells = [];
  let isCutaway = false;

  // Animation State
  const SCENE_COUNT = 8;
  const SCENE_DURATION = 4.5; // 4.5 seconds per scene
  const TOTAL_CYCLE_TIME = SCENE_COUNT * SCENE_DURATION; // 36 seconds total

  let currentTime = 0.0;
  let currentSceneIndex = 0;
  let isPlaying = true;
  let playbackSpeed = 1.0;
  let activeCameraPreset = 'cinematic';

  // Camera Targets
  const defaultCamPos = new THREE.Vector3(-5.2, 2.8, 6.2);
  const defaultCamTarget = new THREE.Vector3(0, 1.1, 0);
  const camTargetPos = defaultCamPos.clone();
  const camTargetLookAt = defaultCamTarget.clone();

  // Scene Definitions
  const SCENES_DATA = [
    {
      id: 0,
      pill: "INTRODUCTION",
      tag: "INNOVATION ARCHITECTURE",
      title: "Smart Mobile Medical-Waste Collection & Segregation Robot",
      desc: "An intelligent, battery-electric autonomous robotic platform eliminating human exposure through integrated collection, real-time AI classification, dual robotic sorting, and digital traceability.",
      nav: "Stationary Standby",
      auth: "STANDBY",
      authColor: "#94a3b8",
      ai: "YOLO-BioMed v9 Ready",
      arm: "Standby / Calibrated",
      battery: "96%",
      batteryNum: 96,
      batteryColor: "#10b981",
      cat: null
    },
    {
      id: 1,
      pill: "01 — AUTONOMOUS WARD ROUND",
      tag: "AUTONOMOUS MOBILE COLLECTION",
      title: "Scheduled Autonomous Ward Rounds",
      desc: "Scheduled rounds allow the robot to collect biomedical waste automatically without requiring nurses or housekeeping staff to transport hazardous materials manually.",
      nav: "SLAM Corridor Navigation (Floor 3)",
      auth: "APPROACHING WARD 3B",
      authColor: "#38bdf8",
      ai: "LiDAR Obstacle Avoidance",
      arm: "Locked in Travel Pose",
      battery: "92%",
      batteryNum: 92,
      batteryColor: "#10b981",
      cat: null
    },
    {
      id: 2,
      pill: "02 — AUTHORIZED ACCESS",
      tag: "SAFETY & ACCESS CONTROL",
      title: "Staff Badge Authorization",
      desc: "Collection begins only after authorized hospital staff confirmation via a quick contactless RFID badge tap or button press. Zero complicated operations required.",
      nav: "Halted at Ward Station",
      auth: "AUTHORIZED (Dr. Badge #284)",
      authColor: "#10b981",
      ai: "Staff Face & RFID Match",
      arm: "Ready for Intake",
      battery: "89%",
      batteryNum: 89,
      batteryColor: "#10b981",
      cat: null
    },
    {
      id: 3,
      pill: "03 — COMMON-BIN COLLECTION",
      tag: "NO ADDITIONAL STAFF TRAINING",
      title: "Single Common-Bin Ward Reception",
      desc: "Doctors and nurses continue using ONE common ward bin as they do today. The robot docks and receives all biomedical waste with zero sorting burden on medical staff.",
      nav: "Common Bin Docked",
      auth: "INTAKE CHAMBER OPEN",
      authColor: "#f59e0b",
      ai: "Volume Metering Active",
      arm: "Hopper Feed Active",
      battery: "85%",
      batteryNum: 85,
      batteryColor: "#10b981",
      cat: "yellow"
    },
    {
      id: 4,
      pill: "04 — AI IDENTIFICATION & SORTING",
      tag: "YOLO-BioMed v9 & DUAL ROBOTIC HANDS",
      title: "Real-Time AI Computer Vision & Robotic Picking",
      desc: "Dual optical cameras scan waste items along the conveyor. YOLO-BioMed deep learning classifies items into 4 BMW streams with 99.4% accuracy while robotic arms segregate without human touch.",
      nav: "Internal Processing",
      auth: "SORTING IN PROGRESS",
      authColor: "#00d2ff",
      ai: "Yellow Biohazard (99.4%)",
      arm: "Arm #1 Segregating",
      battery: "78%",
      batteryNum: 78,
      batteryColor: "#00d2ff",
      cat: "yellow"
    },
    {
      id: 5,
      pill: "05 — FOUR SEALED COMPARTMENTS",
      tag: "HERMETIC ISOLATION & UV-C STERILIZATION",
      title: "4 Isolated Sealed Bins with UV-C Disinfection",
      desc: "Waste drops down dedicated gravity chutes into four hermetically sealed bins (Yellow, Red, White, Blue). Continuous UV-C germicidal LEDs kill hospital pathogens and prevent odor emission.",
      nav: "Compartments Sealed",
      auth: "HERMETIC LOCK ENGAGED",
      authColor: "#a855f7",
      ai: "Cross-Contamination: 0.0%",
      arm: "Discharge Completed",
      battery: "65%",
      batteryNum: 65,
      batteryColor: "#a855f7",
      cat: null
    },
    {
      id: 6,
      pill: "06 — DIGITAL LOGGING & TRACKING",
      tag: "END-TO-END HOSPITAL TRACEABILITY",
      title: "Cloud EMR Audit Trail & CPCB Compliance",
      desc: "Waste weight per category is logged with ward ID, timestamp, and cryptographic hash, automatically syncing with hospital ERP/CPCB portals for 100% regulatory audit compliance.",
      nav: "Cloud Telemetry Sync",
      auth: "CPCB CERTIFIED HASH",
      authColor: "#10b981",
      ai: "Telemetry Synced (14.2 kg)",
      arm: "Standby",
      battery: "52%",
      batteryNum: 52,
      batteryColor: "#10b981",
      cat: null
    },
    {
      id: 7,
      pill: "07 — AUTO DUMP & INDUCTIVE CHARGE",
      tag: "24/7 CONTINUOUS AUTONOMY",
      title: "Autonomous Central Dumping & Wireless Docking",
      desc: "When compartments reach capacity, the robot autonomously navigates to central disposal bins, dumps waste into primary hoppers, and docks onto the wireless inductive pad to recharge.",
      nav: "Docked at Charging Station",
      auth: "INDUCTIVE CHARGE ACTIVE",
      authColor: "#10b981",
      ai: "Next Run: 18:00 hrs",
      arm: "Parked / Power Saved",
      battery: "26% (Charging +24W)",
      batteryNum: 26,
      batteryColor: "#10b981",
      cat: null
    }
  ];

  /* ==========================================================================
     1. INITIALIZATION
     ========================================================================== */
  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b12);
    scene.fog = new THREE.FogExp2(0x070b12, 0.038);

    // Camera
    const rect = container.getBoundingClientRect();
    const aspect = (rect.width || 800) / (rect.height || 520);
    camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 80);
    camera.position.copy(defaultCamPos);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(rect.width || 800, rect.height || 520);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 2.4;
    controls.maxDistance = 16;
    controls.target.copy(defaultCamTarget);

    // Build World
    setupLighting();
    buildHospitalCorridor();
    buildNovamindsRobot();
    buildInternalMechanisms();
    buildDataStreamParticles();

    scene.add(hospitalGroup);
    scene.add(robotGroup);
    scene.add(dataParticlesGroup);

    // Initial State
    updateSceneUI(0);
    setCutawayMode(false);

    // Event Handlers
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
    const ambientLight = new THREE.AmbientLight(0xddeeff, 0.75);
    scene.add(ambientLight);

    // Main Studio Light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.35);
    mainLight.position.set(8, 14, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    // Medical Cyan Fill
    const cyanLight = new THREE.DirectionalLight(0x00d2ff, 0.6);
    cyanLight.position.set(-8, 6, -6);
    scene.add(cyanLight);

    // Crisp Blue Backlight
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(0, 10, -10);
    scene.add(rimLight);

    // Floor Bounce
    const floorBounce = new THREE.PointLight(0x0284c7, 0.45, 16);
    floorBounce.position.set(0, 0.3, 0);
    scene.add(floorBounce);
  }

  /* ==========================================================================
     3. HOSPITAL CORRIDOR & STATIONS
     ========================================================================== */
  function buildHospitalCorridor() {
    // Floor
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0e1422,
      roughness: 0.2,
      metalness: 0.35
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    hospitalGroup.add(floor);

    // High-Tech Floor Grid
    const grid = new THREE.GridHelper(50, 50, 0x00d2ff, 0x1e293b);
    grid.position.y = 0.006;
    hospitalGroup.add(grid);

    // Cyan Navigation LED Tracks
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.7 });
    [-1.6, 1.6].forEach(x => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 36), stripMat);
      strip.position.set(x, 0.012, 0);
      hospitalGroup.add(strip);
    });

    // Hospital Ward Station at z = -3.8
    wardStationGroup = new THREE.Group();
    wardStationGroup.position.set(-2.6, 0, -3.8);

    const postMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 1.6, 20),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
    );
    postMesh.position.y = 0.8;
    postMesh.castShadow = true;
    wardStationGroup.add(postMesh);

    // Status / RFID Terminal Box
    const termBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.35, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
    );
    termBox.position.set(0.26, 1.35, 0);
    wardStationGroup.add(termBox);

    // Staff RFID Hologram Disc
    staffBadgeMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.04, 0.11, 24),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    );
    staffBadgeMesh.position.set(0.38, 1.35, 0);
    staffBadgeMesh.rotation.y = Math.PI / 2;
    wardStationGroup.add(staffBadgeMesh);

    // Terminal Screen
    statusScreenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    statusScreenMesh.position.set(0.26, 1.35, 0.112);
    wardStationGroup.add(statusScreenMesh);

    // Ward Door Indicator
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 2.4, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
    );
    doorFrame.position.set(-1.2, 1.2, 0);
    wardStationGroup.add(doorFrame);

    hospitalGroup.add(wardStationGroup);

    // Common Hospital Ward Waste Bin (Scene 4)
    commonWardBinGroup = new THREE.Group();
    commonWardBinGroup.position.set(-2.0, 0, -3.8);

    const binBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.22, 0.75, 20),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.2 })
    );
    binBody.position.y = 0.38;
    binBody.castShadow = true;
    commonWardBinGroup.add(binBody);

    const binLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.28, 0.08, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 })
    );
    binLid.position.y = 0.78;
    commonWardBinGroup.add(binLid);

    hospitalGroup.add(commonWardBinGroup);

    // Central Dump Station & Inductive Pad (Scene 8, at z = 4.0)
    centralDumpStation = new THREE.Group();
    centralDumpStation.position.set(0, 0, 4.0);

    const dockPad = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.1, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    );
    dockPad.position.y = 0.05;
    dockPad.receiveShadow = true;
    centralDumpStation.add(dockPad);

    // Inductive Charging Coil
    chargingRingMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.035, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x00d2ff, emissive: 0x00d2ff, emissiveIntensity: 0.9 })
    );
    chargingRingMesh.rotation.x = Math.PI / 2;
    chargingRingMesh.position.y = 0.12;
    centralDumpStation.add(chargingRingMesh);

    // Main Central Bin Station
    const mainBinTower = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.7, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 })
    );
    mainBinTower.position.set(0, 0.85, 0.95);
    mainBinTower.castShadow = true;
    centralDumpStation.add(mainBinTower);

    // Central Station Green LED
    const dockLed = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.06, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    dockLed.position.set(0, 1.4, 0.72);
    centralDumpStation.add(dockLed);

    hospitalGroup.add(centralDumpStation);
  }

  /* ==========================================================================
     4. ROBOT MODEL (Precise NOVAMINDS Design)
     ========================================================================== */
  function buildNovamindsRobot() {
    // 1. Mobile Base Chassis
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x181e29,
      metalness: 0.85,
      roughness: 0.35
    });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.28, 2.6), chassisMat);
    chassis.position.y = 0.32;
    chassis.castShadow = true;
    robotGroup.add(chassis);

    // 4 Heavy-duty Differential Wheels
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
      opacity: 0.95
    });
    shellMaterials.push(medicalWhiteMat);

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      roughness: 0.35,
      metalness: 0.6,
      transparent: true,
      opacity: 0.95
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
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.95 });
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
      opacity: 0.95
    });
    shellMaterials.push(doorMat);

    frontHatch = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.08), doorMat);
    frontHatch.position.set(0, 1.22, -1.24);
    outerShellGroup.add(frontHatch);

    // Cyan Ghost Wireframe for Cutaway
    const wireGeo = new THREE.EdgesGeometry(hoodGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.0 });
    wireframeShells.push(wireMat);
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    wireframe.position.copy(mainHood.position);
    outerShellGroup.add(wireframe);

    robotGroup.add(outerShellGroup);
  }

  /* ==========================================================================
     5. INTERNAL MECHANISMS (Cutaway Mechanisms)
     ========================================================================== */
  function buildInternalMechanisms() {
    // 1. Stainless Steel Intake Hopper
    const steelMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const hopper = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 0.55), steelMat);
    hopper.position.set(0, 1.18, -0.85);
    hopper.rotation.x = Math.PI / 10;
    hopper.castShadow = true;
    internalGroup.add(hopper);

    // 2. Motorized Conveyor Belt System with Rollers
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.4 });
    const conveyorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.12, 1.6), frameMat);
    conveyorFrame.position.set(0, 1.02, 0.2);
    internalGroup.add(conveyorFrame);

    const beltMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7, metalness: 0.1 });
    conveyorBelt = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.02, 1.55), beltMat);
    conveyorBelt.position.set(0, 1.09, 0.2);
    internalGroup.add(conveyorBelt);

    // Rollers
    [-0.5, -0.1, 0.3, 0.7, 0.95].forEach(z => {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 16), steelMat);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 1.01, z);
      internalGroup.add(roller);
    });

    // 3. AI Vision Camera Gantry Arch & Volumetric Laser Cone
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });
    const gantryArch = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.08), gantryMat);
    gantryArch.position.set(0, 1.55, -0.35);
    internalGroup.add(gantryArch);

    [-0.38, 0.38].forEach(x => {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.05), gantryMat);
      strut.position.set(x, 1.3, -0.35);
      internalGroup.add(strut);
    });

    const aiCamHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.11, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 })
    );
    aiCamHousing.position.set(0, 1.5, -0.35);
    internalGroup.add(aiCamHousing);

    // Dual Optical Lenses
    [-0.06, 0.06].forEach(x => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16), new THREE.MeshBasicMaterial({ color: 0x00d2ff }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(x, 1.5, -0.27);
      internalGroup.add(lens);
    });

    // Volumetric Laser Projection Cone
    const coneGeo = new THREE.ConeGeometry(0.32, 0.55, 24, 1, true);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });
    aiLaserCone = new THREE.Mesh(coneGeo, laserMat);
    aiLaserCone.position.set(0, 1.22, -0.35);
    aiLaserCone.rotation.x = Math.PI;
    internalGroup.add(aiLaserCone);

    // 4. Dual Multi-Axis Robotic Sorting Arms (Left & Right)
    const armColors = [0xf59e0b, 0xef4444];
    const armZPositions = [0.05, 0.45];

    for (let i = 0; i < 2; i++) {
      const isLeft = (i === 0);
      const armGroup = new THREE.Group();
      armGroup.position.set(isLeft ? -0.42 : 0.42, 1.08, armZPositions[i]);

      const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
      );
      armGroup.add(turret);

      const shoulder = new THREE.Group();
      shoulder.position.y = 0.06;

      const servoMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 16, 16),
        new THREE.MeshStandardMaterial({ color: armColors[i], metalness: 0.6, roughness: 0.3 })
      );
      shoulder.add(servoMesh);

      const upperArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.26, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
      );
      upperArm.position.y = 0.13;
      shoulder.add(upperArm);

      const elbow = new THREE.Group();
      elbow.position.y = 0.26;

      const elbowServo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), servoMesh.material);
      elbow.add(elbowServo);

      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.22, 0.035), upperArm.material);
      forearm.position.y = 0.11;
      elbow.add(forearm);

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

      internalGroup.add(armGroup);

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

    // 5. Four Gravity Chutes & Sealed Compartments
    const chuteZPositions = [-0.3, 0.1, 0.5, 0.85];
    const binColors = [0xf59e0b, 0xef4444, 0xf8fafc, 0x3b82f6];

    for (let i = 0; i < 4; i++) {
      const isLeft = (i % 2 === 0);

      // Chute
      const chute = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.14, 0.48, 16, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide })
      );
      chute.position.set(isLeft ? -0.5 : 0.5, 0.82, chuteZPositions[i]);
      chute.rotation.z = isLeft ? Math.PI / 5.5 : -Math.PI / 5.5;
      internalGroup.add(chute);

      // Sealed Tank
      const binGroup = new THREE.Group();
      binGroup.position.set(isLeft ? -0.5 : 0.5, 0.48, chuteZPositions[i]);

      const tank = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.38, 0.32),
        new THREE.MeshStandardMaterial({ color: binColors[i], metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.85 })
      );
      tank.castShadow = true;
      binGroup.add(tank);

      // UV-C LED
      const uvc = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xa855f7 })
      );
      uvc.position.set(0, 0.15, 0);
      binGroup.add(uvc);

      internalGroup.add(binGroup);
      compartments.push({ group: binGroup, tank: tank, uvc: uvc, color: binColors[i] });
    }

    // 6. LiFePO4 Battery & BMS Electronics Bay
    const battGroup = new THREE.Group();
    battGroup.position.set(0, 0.4, 0.85);

    batteryPackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.22, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    battGroup.add(batteryPackMesh);

    const bms = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.04, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4 })
    );
    bms.position.y = 0.13;
    battGroup.add(bms);

    batteryLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    batteryLed.position.set(0, 0.17, 0);
    battGroup.add(batteryLed);

    internalGroup.add(battGroup);

    // 7. Waste Items
    createWasteItems();

    robotGroup.add(internalGroup);
  }

  /* ==========================================================================
     6. WASTE ITEMS
     ========================================================================== */
  function createWasteItems() {
    const yellow = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.08, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 })
    );
    yellow.position.set(0, 1.15, -0.85);
    internalGroup.add(yellow);

    const red = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.14, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 })
    );
    red.rotation.z = Math.PI / 2;
    red.position.set(0, 1.15, -1.1);
    internalGroup.add(red);

    wasteItems = [
      { mesh: yellow, startZ: -0.85, type: 'yellow', name: 'Yellow: Infectious' },
      { mesh: red, startZ: -1.1, type: 'red', name: 'Red: Recyclable Plastic' }
    ];
  }

  /* ==========================================================================
     7. DATA STREAM PARTICLES (Holographic Tracking Effect)
     ========================================================================== */
  function buildDataStreamParticles() {
    const count = 90;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.0;
      positions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.0;

      colors[i * 3] = 0.0;
      colors[i * 3 + 1] = 0.82;
      colors[i * 3 + 2] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    dataParticlesGroup.add(particles);
    dataParticlesGroup.visible = false;
  }

  /* ==========================================================================
     8. ANIMATION ENGINE (Evaluating 8 Scenes in Sequence)
     ========================================================================== */
  function evaluateSimulation(t) {
    const sceneIdx = Math.min(SCENE_COUNT - 1, Math.floor(t / SCENE_DURATION));
    const sceneP = (t % SCENE_DURATION) / SCENE_DURATION; // 0.0 to 1.0 within scene

    // Update UI on scene change
    if (currentSceneIndex !== sceneIdx) {
      currentSceneIndex = sceneIdx;
      updateSceneUI(sceneIdx);
    }

    // Continuous Wheel & LiDAR Animation
    if (lidarPuck) lidarPuck.rotation.y += 0.05;
    if (batteryLed) batteryLed.scale.setScalar(1.0 + Math.sin(t * 8) * 0.2);

    // ------------------------------------------------------------------------
    // SCENE 0: INTRODUCTION (Wide corridor view, compact robot)
    // ------------------------------------------------------------------------
    if (sceneIdx === 0) {
      const p = sceneP;
      robotGroup.position.set(0, 0, 0);
      robotGroup.rotation.y = 0;

      // Gentle forward movement showcase
      robotGroup.position.z = -0.3 + p * 0.6;
      wheels.forEach(w => w.children[0].rotation.x += 0.03);

      frontHatch.position.y = 1.22;
      aiLaserCone.material.opacity = 0.0;
      aiReticleOverlay.classList.remove('visible');
      trackingOverlay.classList.remove('visible');
      dataParticlesGroup.visible = false;
      setCutawayMode(false);

      if (activeCameraPreset === 'cinematic') {
        // Slow wide zoom into robot
        camTargetPos.set(-4.8 + (1 - p) * 1.5, 2.8 - (1 - p) * 0.4, 6.2 + (1 - p) * 1.8);
        camTargetLookAt.set(0, 1.1, robotGroup.position.z);
      }
    }

    // ------------------------------------------------------------------------
    // SCENE 1: AUTONOMOUS WARD ROUND (SLAM Corridor Navigation)
    // ------------------------------------------------------------------------
    else if (sceneIdx === 1) {
      const p = sceneP;
      // Leaving dock and approaching ward
      robotGroup.position.set(-1.8 * p, 0, 1.5 - p * 5.3);
      robotGroup.rotation.y = 0;
      wheels.forEach(w => w.children[0].rotation.x += 0.06);

      frontHatch.position.y = 1.22;
      aiLaserCone.material.opacity = 0.0;
      aiReticleOverlay.classList.remove('visible');
      trackingOverlay.classList.remove('visible');
      dataParticlesGroup.visible = false;
      setCutawayMode(false);

      if (activeCameraPreset === 'cinematic') {
        camTargetPos.set(robotGroup.position.x - 3.8, 2.4, robotGroup.position.z + 4.2);
        camTargetLookAt.set(robotGroup.position.x, 1.1, robotGroup.position.z);
      }
    }

    // ------------------------------------------------------------------------
    // SCENE 2: STAFF AUTHORIZATION (RFID Badge Tap, Status Locked -> Authorized)
    // ------------------------------------------------------------------------
    else if (sceneIdx === 2) {
      const p = sceneP;
      robotGroup.position.set(-1.8, 0, -3.8);
      robotGroup.rotation.y = 0;

      // Staff RFID Badge pulsing
      staffBadgeMesh.scale.setScalar(1.0 + Math.sin(t * 14) * 0.4);

      // Screen changes from green pulse
      statusScreenMesh.material.color.setHex(p < 0.3 ? 0xef4444 : 0x10b981);

      frontHatch.position.y = 1.22;
      aiLaserCone.material.opacity = 0.0;
      aiReticleOverlay.classList.remove('visible');
      trackingOverlay.classList.remove('visible');
      dataParticlesGroup.visible = false;
      setCutawayMode(false);

      if (activeCameraPreset === 'cinematic') {
        camTargetPos.set(robotGroup.position.x + 2.4, 1.8, robotGroup.position.z - 2.0);
        camTargetLookAt.set(robotGroup.position.x, 1.25, robotGroup.position.z - 0.5);
      }
    }

    // ------------------------------------------------------------------------
    // SCENE 3: COMMON-BIN COLLECTION (Motorized Intake Hatch Receives Waste)
    // ------------------------------------------------------------------------
    else if (sceneIdx === 3) {
      const p = sceneP;
      robotGroup.position.set(-1.8, 0, -3.8);

      // Motorized Door Opens
      const doorOpen = Math.min(1.0, p * 2.2);
      frontHatch.position.y = 1.22 + doorOpen * 0.45;

      // Waste enters hopper
      wasteItems[0].mesh.position.set(0, 1.22 - p * 0.1, -1.2 + p * 0.35);

      aiLaserCone.material.opacity = 0.0;
      aiReticleOverlay.classList.remove('visible');
      trackingOverlay.classList.remove('visible');
      dataParticlesGroup.visible = false;
      setCutawayMode(p > 0.4); // Automatically show internal intake in cutaway

      if (activeCameraPreset === 'cinematic') {
        camTargetPos.set(robotGroup.position.x - 2.6, 2.2, robotGroup.position.z - 1.8);
        camTargetLookAt.set(robotGroup.position.x, 1.2, robotGroup.position.z - 0.6);
      }
    }

    // ------------------------------------------------------------------------
    // SCENE 4: AI IDENTIFICATION & ROBOTIC SORTING (Camera Scan & Arm Segregation)
    // ------------------------------------------------------------------------
    else if (sceneIdx === 4) {
      const p = sceneP;
      robotGroup.position.set(-1.8, 0, -3.8);
      frontHatch.position.y = 1.22;

      setCutawayMode(true); // Full Cutaway View

      // Laser Cone Active Scanning
      aiLaserCone.material.opacity = 0.45 + Math.sin(t * 16) * 0.25;
      aiLaserCone.rotation.y += 0.04;

      aiReticleOverlay.classList.add('visible');
      trackingOverlay.classList.remove('visible');
      dataParticlesGroup.visible = false;

      // Arm 1 Picks & Places
      const arm = roboticArms[0];
      const isLeft = arm.isLeft;

      if (p < 0.3) {
        // Position under camera
        wasteItems[0].mesh.position.set(0, 1.15, -0.35);
        arm.shoulder.rotation.z = arm.homeShoulder + 0.3 * (p / 0.3);
        arm.elbow.rotation.z = arm.homeElbow - 0.3 * (p / 0.3);
      } else if (p < 0.7) {
        // Lift and swivel
        const f = (p - 0.3) / 0.4;
        arm.group.rotation.y = -Math.PI / 3.2 * f;
        wasteItems[0].mesh.position.set(-f * 0.42, 1.26 - f * 0.15, arm.targetZ);
      } else {
        // Slide down chute
        const f = (p - 0.7) / 0.3;
        wasteItems[0].mesh.position.set(-0.5, 1.1 - f * 0.55, arm.targetZ);
      }

      if (activeCameraPreset === 'cinematic') {
        camTargetPos.set(robotGroup.position.x - 2.2, 2.2, robotGroup.position.z + 0.3);
        camTargetLookAt.set(robotGroup.position.x, 1.15, robotGroup.position.z - 0.1);
      }
    }

    // ------------------------------------------------------------------------
    // SCENE 5: FOUR SEALED COMPARTMENTS (UV-C Hermetic Sterilization)
    // ------------------------------------------------------------------------
    else if (sceneIdx === 5) {
      const p = sceneP;
      robotGroup.position.set(-1.8, 0, -3.8);

      setCutawayMode(true);
      aiLaserCone.material.opacity = 0.0;
      aiReticleOverlay.classList.remove('visible');
      trackingOverlay.classList.remove('visible');
      dataParticlesGroup.visible = false;

      // Arms reset
      roboticArms.forEach(a => {
        a.shoulder.rotation.z = a.homeShoulder;
        a.elbow.rotation.z = a.homeElbow;
        a.group.rotation.y = 0;
      });

      // Settle waste in 4 sealed tanks
      wasteItems[0].mesh.position.set(-0.5, 0.45, -0.3);
      wasteItems[1].mesh.position.set(0.5, 0.45, 0.1);

      // UV-C LEDs Pulsing Purple
      compartments.forEach((comp, idx) => {
        comp.uvc.scale.setScalar(1.0 + Math.sin(t * 10 + idx) * 0.45);
      });

      if (activeCameraPreset === 'cinematic') {
        camTargetPos.set(robotGroup.position.x - 2.5, 1.4, robotGroup.position.z + 0.6);
        camTargetLookAt.set(robotGroup.position.x, 0.6, robotGroup.position.z + 0.3);
      }
    }

    // ------------------------------------------------------------------------
    // SCENE 6: DIGITAL LOGGING & TRACKING (Holographic Audit Dashboard)
    // ------------------------------------------------------------------------
    else if (sceneIdx === 6) {
      const p = sceneP;
      robotGroup.position.set(-1.8, 0, -3.8);

      setCutawayMode(false); // Shell Solid
      aiLaserCone.material.opacity = 0.0;
      aiReticleOverlay.classList.remove('visible');
      trackingOverlay.classList.add('visible'); // Digital Tracking HUD Active
      dataParticlesGroup.visible = true;

      // Animate floating data particles
      const positions = dataParticlesGroup.children[0].geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += 0.015;
        if (positions[i * 3 + 1] > 3.0) positions[i * 3 + 1] = 0.5;
      }
      dataParticlesGroup.children[0].geometry.attributes.position.needsUpdate = true;

      if (activeCameraPreset === 'cinematic') {
        camTargetPos.set(robotGroup.position.x - 3.2, 2.0, robotGroup.position.z + 3.0);
        camTargetLookAt.set(robotGroup.position.x, 1.2, robotGroup.position.z);
      }
    }

    // ------------------------------------------------------------------------
    // SCENE 7: AUTO DUMP & INDUCTIVE CHARGE (Recharging & Docking)
    // ------------------------------------------------------------------------
    else if (sceneIdx === 7) {
      const p = sceneP;

      // Robot travels to central dump and charging station (z = 4.0)
      const curZ = -3.8 + p * 7.8;
      robotGroup.position.set(-1.8 * (1 - p), 0, Math.min(4.0, curZ));
      wheels.forEach(w => w.children[0].rotation.x += 0.05);

      setCutawayMode(false);
      aiLaserCone.material.opacity = 0.0;
      aiReticleOverlay.classList.remove('visible');
      trackingOverlay.classList.remove('visible');
      dataParticlesGroup.visible = false;

      // Inductive Charging Coil Glow Pulses
      chargingRingMesh.material.emissiveIntensity = 1.0 + Math.sin(t * 12) * 0.6;

      if (activeCameraPreset === 'cinematic') {
        const orbitA = p * Math.PI * 0.5 + 0.4;
        const rad = 4.8;
        camTargetPos.set(Math.sin(orbitA) * rad, 1.8 + Math.sin(p * Math.PI) * 0.3, 4.0 + Math.cos(orbitA) * rad);
        camTargetLookAt.set(0, 1.0, 4.0);
      }
    }

    // Smooth Camera Interpolation
    camera.position.lerp(camTargetPos, 0.065);
    controls.target.lerp(camTargetLookAt, 0.065);

    // Progress Bar
    const progressPct = (t / TOTAL_CYCLE_TIME) * 100;
    timelineFill.style.width = `${progressPct}%`;
    timelineHandle.style.left = `${progressPct}%`;
  }

  /* ==========================================================================
     9. CUTAWAY CONTROLLER
     ========================================================================== */
  function setCutawayMode(active) {
    isCutaway = active;
    btnCutaway.classList.toggle('active', active);

    const shellOpacity = active ? 0.22 : 0.95;
    shellMaterials.forEach(m => {
      m.opacity = shellOpacity;
      m.transparent = true;
    });

    const wireOpacity = active ? 0.75 : 0.0;
    wireframeShells.forEach(m => {
      m.opacity = wireOpacity;
    });
  }

  /* ==========================================================================
     10. UPDATE SCENE UI & TELEMETRY
     ========================================================================== */
  function updateSceneUI(sceneIdx) {
    const data = SCENES_DATA[sceneIdx];
    if (!data) return;

    // Header Pill & Text
    stagePillText.innerText = data.pill;
    innovationTag.innerText = data.tag;
    headlineEl.innerText = data.title;
    descEl.innerText = data.desc;

    // Telemetry Panel
    telState.innerText = data.pill.split('—')[0].trim();
    telNav.innerText = data.nav;
    telAuth.innerText = data.auth;
    telAuth.style.color = data.authColor;
    telAi.innerText = data.ai;
    telArm.innerText = data.arm;
    telBatteryVal.innerText = data.battery;
    telBatteryVal.style.color = data.batteryColor;
    telBatteryBar.style.width = `${data.batteryNum}%`;
    telBatteryBar.style.backgroundColor = data.batteryColor;

    // Highlight Active Scene Tab
    scenePills.forEach(pill => {
      const idx = parseInt(pill.getAttribute('data-scene'), 10);
      pill.classList.toggle('active', idx === sceneIdx);
    });

    // 4 Category Legend Highlighting
    document.querySelectorAll('.sol-wcat-item').forEach(el => {
      const cat = el.getAttribute('data-cat');
      el.classList.toggle('active', cat === data.cat);
    });
  }

  /* ==========================================================================
     11. CAMERA PRESETS
     ========================================================================== */
  function setCameraPreset(mode) {
    activeCameraPreset = mode;
    camPresetBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-cam') === mode));

    if (mode === 'cinematic') {
      camTargetPos.copy(defaultCamPos);
      camTargetLookAt.copy(defaultCamTarget);
    } else if (mode === 'corridor') {
      camTargetPos.set(robotGroup.position.x - 4.5, 1.8, robotGroup.position.z + 3.5);
      camTargetLookAt.set(robotGroup.position.x, 1.1, robotGroup.position.z);
    } else if (mode === 'cutaway') {
      setCutawayMode(true);
      camTargetPos.set(robotGroup.position.x - 3.6, 2.0, robotGroup.position.z + 0.2);
      camTargetLookAt.set(robotGroup.position.x, 1.15, robotGroup.position.z);
    } else if (mode === 'deck') {
      setCutawayMode(true);
      camTargetPos.set(robotGroup.position.x, 5.8, robotGroup.position.z + 0.1);
      camTargetLookAt.set(robotGroup.position.x, 1.0, robotGroup.position.z);
    } else if (mode === 'dock') {
      camTargetPos.set(0, 2.2, 7.2);
      camTargetLookAt.set(0, 1.0, 4.0);
    }
  }

  /* ==========================================================================
     12. EVENT LISTENERS & CONTROLS
     ========================================================================== */
  function setupEvents() {
    function togglePlay() {
      isPlaying = !isPlaying;
      iconPlay.style.display = isPlaying ? 'none' : 'block';
      iconPause.style.display = isPlaying ? 'block' : 'none';
      textPlayPause.innerText = isPlaying ? 'Pause' : 'Play';
    }

    btnPlayPause.addEventListener('click', togglePlay);

    btnRestart.addEventListener('click', () => {
      currentTime = 0.0;
      isPlaying = true;
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      textPlayPause.innerText = 'Pause';
      evaluateSimulation(0);
    });

    btnPrev.addEventListener('click', () => {
      const prev = currentSceneIndex > 0 ? currentSceneIndex - 1 : SCENE_COUNT - 1;
      jumpToScene(prev);
    });

    btnNext.addEventListener('click', () => {
      const next = currentSceneIndex < SCENE_COUNT - 1 ? currentSceneIndex + 1 : 0;
      jumpToScene(next);
    });

    btnResetView.addEventListener('click', () => {
      setCameraPreset('cinematic');
      camera.position.copy(defaultCamPos);
      controls.target.copy(defaultCamTarget);
    });

    btnCutaway.addEventListener('click', () => {
      setCutawayMode(!isCutaway);
    });

    // Speed Selector (1.0x -> 1.5x -> 2.0x -> 0.5x)
    const speeds = [1.0, 1.5, 2.0, 0.5];
    let sIdx = 0;
    btnSpeed.addEventListener('click', () => {
      sIdx = (sIdx + 1) % speeds.length;
      playbackSpeed = speeds[sIdx];
      speedText.innerText = `${playbackSpeed.toFixed(1)}x`;
    });

    // Scene Navigation Tabs
    scenePills.forEach(pill => {
      pill.addEventListener('click', () => {
        const idx = parseInt(pill.getAttribute('data-scene'), 10);
        jumpToScene(idx);
      });
    });

    // Camera Preset Buttons
    camPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setCameraPreset(btn.getAttribute('data-cam'));
      });
    });

    // Timeline Scrubbing
    const timelineBar = document.getElementById('solTimelineBar');
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
  }

  function jumpToScene(idx) {
    currentTime = idx * SCENE_DURATION + 0.1;
    evaluateSimulation(currentTime);
  }

  /* ==========================================================================
     13. RESIZE & LOOP
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
      currentTime += delta * playbackSpeed;
      if (currentTime >= TOTAL_CYCLE_TIME) {
        currentTime = 0.0;
      }
      evaluateSimulation(currentTime);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
