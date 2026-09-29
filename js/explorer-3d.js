/**
 * NOVAMINDS — DESIGNED FOR THE REAL WORLD
 * Interactive 3D Engineering Design Explorer
 * 
 * Engineering Review Console:
 * - CAD / Blueprint technical studio environment
 * - Exploded Assembly Mode (multi-layer separation)
 * - Cutaway / X-Ray Inspection Mode
 * - Interactive 10-Component Inspector (Camera focus, spotlighting, CAD specs)
 * - 10 Core Engineering Design Decisions & Feature Demonstrations
 * - Turning Radius & Lift Clearance Dimensioning
 */

(function () {
  'use strict';

  // DOM Elements
  const container = document.getElementById('explorerViewport');
  const canvas = document.getElementById('explorerRobotCanvas');
  if (!container || !canvas) return;

  // HUD & Telemetry Elements
  const expModePill = document.getElementById('expModePill');
  const expTitleEl = document.getElementById('expTitle');
  const expDescEl = document.getElementById('expDesc');
  const expCategoryEl = document.getElementById('expCategory');
  const expSpecBox = document.getElementById('expSpecBox');
  const expSpecTitle = document.getElementById('expSpecTitle');
  const expSpecDetails = document.getElementById('expSpecDetails');
  const expSpecClose = document.getElementById('expSpecClose');

  // Control Buttons
  const btnExplode = document.getElementById('expBtnExplode');
  const btnCutaway = document.getElementById('expBtnCutaway');
  const btnLabels = document.getElementById('expBtnLabels');
  const btnDimensions = document.getElementById('expBtnDimensions');
  const btnResetView = document.getElementById('expBtnResetView');
  const btnAutoRotate = document.getElementById('expBtnAutoRotate');

  // Component Inspector Buttons
  const compButtons = document.querySelectorAll('.exp-comp-btn');
  const featureTabs = document.querySelectorAll('.exp-feature-tab');

  // 3D Scene Variables
  let scene, camera, renderer, controls;
  const clock = new THREE.Clock();

  // Root Groups
  const studioGroup = new THREE.Group();
  const robotRootGroup = new THREE.Group();
  const dimensionsGroup = new THREE.Group();
  const labelsGroup = new THREE.Group();

  // Sub-Assembly Groups for Exploded View
  const subAssemblies = {
    topSensor: new THREE.Group(),
    upperHood: new THREE.Group(),
    outerShell: new THREE.Group(),
    hopper: new THREE.Group(),
    conveyor: new THREE.Group(),
    aiCamera: new THREE.Group(),
    roboticHands: new THREE.Group(),
    chutes: new THREE.Group(),
    compartments: new THREE.Group(),
    battery: new THREE.Group(),
    controlElectronics: new THREE.Group(),
    chassis: new THREE.Group(),
    wheels: new THREE.Group()
  };

  // Exploded Offsets (X, Y, Z displacement targets)
  const explodedTargets = {
    topSensor: { x: 0, y: 1.2, z: 0 },
    upperHood: { x: 0, y: 0.9, z: 0 },
    outerShell: { x: 0, y: 0.5, z: 0.8 },
    hopper: { x: 0, y: 0.6, z: 0.3 },
    conveyor: { x: 0, y: 0.4, z: 0 },
    aiCamera: { x: 0, y: 0.7, z: -0.2 },
    roboticHands: { x: 0.6, y: 0.3, z: 0 },
    chutes: { x: -0.6, y: 0.1, z: 0 },
    compartments: { x: 0, y: -0.4, z: -0.8 },
    battery: { x: 0, y: -0.6, z: 0.3 },
    controlElectronics: { x: 0, y: -0.5, z: -0.4 },
    chassis: { x: 0, y: -0.7, z: 0 },
    wheels: { x: 0, y: -0.85, z: 0 }
  };

  // Discrete Meshes for Component Isolation & Materials
  const componentMeshes = {};
  const wheelsArray = [];
  const labelSprites = [];

  // State Management
  let isExploded = false;
  let explodeProgress = 0.0; // 0 (assembled) to 1 (fully exploded)
  let isCutaway = false;
  let showLabels = true;
  let showDimensions = false;
  let autoRotate = true;
  let autoRotateTimer = 8.0; // Automatically stop auto-rotation after 8s engineering intro
  let activeComponent = null; // null or component key
  let activeFeatureIndex = 0; // 0..9

  // 10 Core Engineering Features
  const FEATURES = [
    {
      id: 'body',
      num: '01',
      tag: 'STRUCTURAL ERGONOMICS',
      title: 'COMPACT MODULAR BODY',
      desc: 'Modular exterior panels optimize tight corridor clearances and facilitate effortless module separation during maintenance.',
      focusComp: 'upperHood',
      camPos: { x: 3.2, y: 2.2, z: 3.6 },
      target: { x: 0, y: 0.8, z: 0 },
      explode: 0.2,
      cutaway: false,
      specs: {
        title: 'MODULAR ENCLOSURE SPECIFICATIONS',
        items: [
          { k: 'Material:', v: 'Medical-grade antimicrobial ABS / Polycarbonate' },
          { k: 'Door Clearance:', v: 'Fits standard 850mm hospital doorways' },
          { k: 'Form Factor:', v: 'Compact aerodynamic footprint with zero sharp corners' },
          { k: 'Maintenance:', v: '4-point quick-release latches for instant servicing' }
        ]
      }
    },
    {
      id: 'mobility',
      num: '02',
      tag: 'DRIVETRAIN KINEMATICS',
      title: 'FOUR-WHEEL MOBILE PLATFORM',
      desc: 'Differential-drive 4-wheel architecture provides tight turning radius and smooth zero-vibration transport across floor thresholds.',
      focusComp: 'wheels',
      camPos: { x: 2.2, y: 0.6, z: 2.2 },
      target: { x: 0, y: 0.25, z: 0 },
      explode: 0.0,
      cutaway: false,
      specs: {
        title: '4-WHEEL MOBILITY CHASSIS',
        items: [
          { k: 'Drivetrain:', v: 'Dual high-torque brushless DC hub motors' },
          { k: 'Steering:', v: 'Differential zero-turn radius capability' },
          { k: 'Tires:', v: 'Non-marking polyurethane rubber for silent ward operation' },
          { k: 'Thresholds:', v: 'Smooth crossing of 15mm elevator & door gaps' }
        ]
      }
    },
    {
      id: 'no-stairs',
      num: '03',
      tag: 'ARCHITECTURAL INTEGRATION',
      title: 'NO STAIR MECHANISM (LIFT COMPATIBLE)',
      desc: 'Multi-floor hospital navigation leverages existing automated lift integration instead of heavy, fragile stair-climbing tracks.',
      focusComp: 'chassis',
      camPos: { x: 3.8, y: 2.4, z: 4.0 },
      target: { x: 0, y: 0.6, z: 0 },
      explode: 0.0,
      cutaway: false,
      specs: {
        title: 'ELEVATOR DISPATCH ARCHITECTURE',
        items: [
          { k: 'Lift Interface:', v: 'Encrypted IoT / MQTT elevator call protocol' },
          { k: 'Weight Saving:', v: 'Eliminates 38kg of redundant stair track hardware' },
          { k: 'Center of Mass:', v: 'Ultra-low center of gravity eliminates tip-over risk' },
          { k: 'Reliability:', v: '99.4% MTBF improvement over tracked stair climbers' }
        ]
      }
    },
    {
      id: 'arms',
      num: '04',
      tag: 'MANIPULATION DYNAMICS',
      title: 'TWO-HAND SORTING ARCHITECTURE',
      desc: 'Dual articulated pick-and-place manipulators provide balanced sorting throughput with low mechanical complexity.',
      focusComp: 'roboticHands',
      camPos: { x: 1.4, y: 1.4, z: 1.6 },
      target: { x: 0, y: 0.9, z: 0 },
      explode: 0.0,
      cutaway: true,
      specs: {
        title: 'DUAL ROBOTIC MANIPULATORS',
        items: [
          { k: 'Actuation:', v: 'Precision servo actuators with encoder feedback' },
          { k: 'End Effectors:', v: 'Soft-touch adaptive silicone suction/pinch grippers' },
          { k: 'Reach Envelope:', v: '320mm spherical radius covering entire conveyor width' },
          { k: 'Redundancy:', v: 'Either arm can handle primary bins if one is serviced' }
        ]
      }
    },
    {
      id: 'chutes',
      num: '05',
      tag: 'PASSIVE PHYSICS TRANSFER',
      title: 'GRAVITY-ASSISTED CHUTES',
      desc: 'Passive 45-degree low-friction chutes guide sorted items cleanly into sealed bins with zero extra motorized ejectors.',
      focusComp: 'chutes',
      camPos: { x: -1.6, y: 1.3, z: 1.8 },
      target: { x: 0, y: 0.7, z: 0 },
      explode: 0.0,
      cutaway: true,
      specs: {
        title: 'PASSIVE GRAVITY CHUTE SYSTEM',
        items: [
          { k: 'Incline Angle:', v: '45° optimized slide angle with PTFE liner' },
          { k: 'Motor Count:', v: '0 motors required (pure gravitational drop)' },
          { k: 'Anti-Jamming:', v: 'Wide-mouth flared entries with non-stick coating' },
          { k: 'One-Way Baffles:', v: 'Seals aerosol backflow from reaching conveyor' }
        ]
      }
    },
    {
      id: 'compartments',
      num: '06',
      tag: 'BIOHAZARD CONTAINMENT',
      title: 'FOUR SEALED COMPARTMENTS',
      desc: 'Hermetically isolated Yellow, Red, White, and Blue bins slide outward for rapid sanitation and CPCB compliant disposal.',
      focusComp: 'compartments',
      camPos: { x: 0.0, y: 1.2, z: 2.8 },
      target: { x: 0, y: 0.5, z: 0 },
      explode: 0.4,
      cutaway: true,
      specs: {
        title: 'CPCB 4-COLOR SEGREGATION BINS',
        items: [
          { k: 'Yellow:', v: 'Soiled/Anatomical waste (Double hermetic seal)' },
          { k: 'Red:', v: 'Contaminated recyclables & tubing' },
          { k: 'White:', v: 'Puncture-proof translucent sharps canister' },
          { k: 'Blue:', v: 'Glassware, vials & metallic implants' }
        ]
      }
    },
    {
      id: 'internal',
      num: '07',
      tag: 'FULL CAD ARCHITECTURE',
      title: 'COMPREHENSIVE INTERNAL LAYOUT',
      desc: 'All 10 internal electromechanical subsystems arranged in a balanced, high-efficiency vertical stack.',
      focusComp: null,
      camPos: { x: 2.6, y: 2.0, z: 3.2 },
      target: { x: 0, y: 0.8, z: 0 },
      explode: 0.0,
      cutaway: true,
      specs: {
        title: 'SUBSYSTEM INTEGRATION MATRIX',
        items: [
          { k: 'Top Stack:', v: '360° LiDAR & Dual Multispectral AI Vision' },
          { k: 'Mid Stack:', v: 'Metering Hopper, Conveyor & Dual Manipulators' },
          { k: 'Lower Stack:', v: '4 Sealed Bins, LiFePO4 Battery & Drive Axles' },
          { k: 'Cooling:', v: 'Filtered negative-pressure ventilation duct' }
        ]
      }
    },
    {
      id: 'service',
      num: '08',
      tag: 'MAINTAINABILITY & UPTIME',
      title: 'EASY COMPONENT ACCESS & SERVICE',
      desc: 'Designed for fast field technician access with quick-swap modular sub-assemblies and standardized fasteners.',
      focusComp: 'controlElectronics',
      camPos: { x: -2.2, y: 1.8, z: 2.6 },
      target: { x: 0, y: 0.7, z: 0 },
      explode: 0.7,
      cutaway: false,
      specs: {
        title: 'SERVICEABILITY METRICS',
        items: [
          { k: 'Tool Requirement:', v: 'Single 4mm hex key for all exterior panels' },
          { k: 'Quick-Swap Battery:', v: 'Side-loading LiFePO4 tray (< 60s swap)' },
          { k: 'Bin Ejection:', v: 'Foot-pedal / electronic lock release mechanism' },
          { k: 'Diagnostics:', v: 'Integrated CAN bus diagnostic port & Wi-Fi telemetry' }
        ]
      }
    },
    {
      id: 'stability',
      num: '09',
      tag: 'PHYSICS & STRUCTURAL INTEGRITY',
      title: 'CHASSIS & STABILITY (DESIGN CONCEPT)',
      desc: 'Ultra-low center of mass (CoM) placed below axle centerline ensures high tipping margins even under maximum 40kg payload.',
      focusComp: 'chassis',
      camPos: { x: 3.4, y: 1.2, z: 2.8 },
      target: { x: 0, y: 0.35, z: 0 },
      explode: 0.0,
      cutaway: false,
      specs: {
        title: 'STRUCTURAL STABILITY CONCEPT',
        items: [
          { k: 'Center of Mass:', v: '185mm above ground (bottom 25% of chassis)' },
          { k: 'Tipping Angle:', v: 'Calculated static stability margin > 35° incline' },
          { k: 'Frame Material:', v: 'CNC Aluminum 6061-T6 space-frame skeleton' },
          { k: 'Payload Rating:', v: 'Engineered for up to 40kg segregated biomedical load' }
        ]
      }
    },
    {
      id: 'mfg',
      num: '10',
      tag: 'DESIGN FOR MANUFACTURING',
      title: 'DESIGNED FOR MANUFACTURING (DFM)',
      desc: 'Engineered with off-the-shelf industrial components, sheet metal press-braking, and injection-molded outer shells.',
      focusComp: null,
      camPos: { x: 4.2, y: 3.2, z: 4.6 },
      target: { x: 0, y: 0.6, z: 0 },
      explode: 1.0,
      cutaway: false,
      specs: {
        title: 'DFM & SCALABILITY BLUEPRINT',
        items: [
          { k: 'Standardization:', v: 'ISO standard metric fasteners and bearings' },
          { k: 'Sourcing:', v: 'Commercial off-the-shelf motors and optical sensors' },
          { k: 'Assembly Time:', v: 'Targeted sub-assembly manufacturing < 4 hours' },
          { k: 'Scalability:', v: 'Zero bespoke tooling required for initial batch production' }
        ]
      }
    }
  ];

  /* ==========================================================================
     1. INITIALIZATION & THREE.JS SETUP
     ========================================================================== */
  function init() {
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1322);

    // 2. Camera
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 540;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.8, 2.5, 4.4);

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
    renderer.toneMappingExposure = 1.1;

    // 4. Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.minDistance = 1.2;
    controls.maxDistance = 10;
    controls.target.set(0, 0.8, 0);

    // Stop auto-rotation when user interacts
    controls.addEventListener('start', () => {
      autoRotate = false;
      if (btnAutoRotate) btnAutoRotate.classList.remove('active');
    });

    // 5. Lighting
    setupLighting();

    // 6. Build CAD Blueprint Studio
    buildEngineeringStudio();

    // 7. Build Robot Model with Modular Sub-Assemblies
    buildRobotAssembly();

    // 8. Build Dimension Guides & Labels
    buildDimensions();
    buildComponentLabels();

    // Add groups to scene
    scene.add(studioGroup);
    scene.add(robotRootGroup);
    scene.add(dimensionsGroup);
    scene.add(labelsGroup);

    // 9. Event Listeners
    setupEventListeners();

    // 10. Start at Feature 0
    selectFeature(0, true);

    window.addEventListener('resize', onResize);
    animate();
  }

  /* ==========================================================================
     2. LIGHTING (CAD TECHNICAL STUDIO)
     ========================================================================== */
  function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill Light (Cool CAD Cyan)
    const fillLight = new THREE.DirectionalLight(0x00d2ff, 0.5);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    // Rim Light (Sharp Top Light)
    const topRimLight = new THREE.PointLight(0xffffff, 0.8, 12);
    topRimLight.position.set(0, 5, 0);
    scene.add(topRimLight);
  }

  /* ==========================================================================
     3. CAD BLUEPRINT STUDIO ENVIRONMENT
     ========================================================================== */
  function buildEngineeringStudio() {
    // 1. Engineering Floor with Coordinate Grid
    const floorGeo = new THREE.PlaneGeometry(18, 18);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    studioGroup.add(floor);

    // Primary & Secondary CAD Grid
    const gridMajor = new THREE.GridHelper(18, 18, 0x00d2ff, 0x1e293b);
    gridMajor.position.y = 0.002;
    studioGroup.add(gridMajor);

    const gridMinor = new THREE.GridHelper(18, 72, 0x0ea5e9, 0x141f36);
    gridMinor.position.y = 0.001;
    studioGroup.add(gridMinor);

    // 2. Blueprint Measurement Circular Scale Marks
    const circleGeo = new THREE.RingGeometry(2.0, 2.02, 64);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, side: THREE.DoubleSide, opacity: 0.3, transparent: true });
    const circleRing = new THREE.Mesh(circleGeo, circleMat);
    circleRing.rotation.x = -Math.PI / 2;
    circleRing.position.y = 0.003;
    studioGroup.add(circleRing);

    const circleOuterGeo = new THREE.RingGeometry(3.5, 3.52, 64);
    const circleOuterRing = new THREE.Mesh(circleOuterGeo, circleMat);
    circleOuterRing.rotation.x = -Math.PI / 2;
    circleOuterRing.position.y = 0.003;
    studioGroup.add(circleOuterRing);

    // 3. Technical Coordinate Crosshairs
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, opacity: 0.4, transparent: true });
    const xPoints = [new THREE.Vector3(-8, 0.004, 0), new THREE.Vector3(8, 0.004, 0)];
    const zPoints = [new THREE.Vector3(0, 0.004, -8), new THREE.Vector3(0, 0.004, 8)];
    
    const xLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(xPoints), lineMat);
    const zLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(zPoints), lineMat);
    studioGroup.add(xLine);
    studioGroup.add(zLine);
  }

  /* ==========================================================================
     4. ROBOT ASSEMBLY (MODULAR LAYER-BY-LAYER HIERARCHY)
     ========================================================================== */
  function buildRobotAssembly() {
    // Shared Materials
    const darkChassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
    const medWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.15, transparent: true, opacity: 1.0 });
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.4, roughness: 0.25, transparent: true, opacity: 1.0 });
    const armMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const wheelRubberMat = new THREE.MeshStandardMaterial({ color: 0x0b0f19, roughness: 0.7 });

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 1: LOWER CHASSIS
    // -------------------------------------------------------------
    const chassisGeo = new THREE.BoxGeometry(1.2, 0.24, 1.6);
    const chassisMesh = new THREE.Mesh(chassisGeo, darkChassisMat);
    chassisMesh.position.y = 0.22;
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    subAssemblies.chassis.add(chassisMesh);
    componentMeshes['chassis'] = chassisMesh;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 2: FOUR DRIVE WHEELS
    // -------------------------------------------------------------
    const wheelGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24);
    const wheelPositions = [
      { id: 'FL', x: -0.62, y: 0.16, z: 0.55 },
      { id: 'FR', x: 0.62, y: 0.16, z: 0.55 },
      { id: 'RL', x: -0.62, y: 0.16, z: -0.55 },
      { id: 'RR', x: 0.62, y: 0.16, z: -0.55 }
    ];
    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelRubberMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.castShadow = true;
      subAssemblies.wheels.add(wheel);
      wheelsArray.push(wheel);
    });
    componentMeshes['wheels'] = subAssemblies.wheels;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 3: LiFePO4 BATTERY PACK & BMS
    // -------------------------------------------------------------
    const batteryGeo = new THREE.BoxGeometry(0.7, 0.18, 0.6);
    const batteryMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.5, roughness: 0.3 });
    const batteryMesh = new THREE.Mesh(batteryGeo, batteryMat);
    batteryMesh.position.set(0, 0.38, 0.3);
    subAssemblies.battery.add(batteryMesh);
    componentMeshes['battery'] = batteryMesh;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 4: CONTROL ELECTRONICS & MOTOR DRIVERS
    // -------------------------------------------------------------
    const ctrlGeo = new THREE.BoxGeometry(0.7, 0.16, 0.5);
    const ctrlMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.6, roughness: 0.3 });
    const ctrlMesh = new THREE.Mesh(ctrlGeo, ctrlMat);
    ctrlMesh.position.set(0, 0.38, -0.35);
    subAssemblies.controlElectronics.add(ctrlMesh);
    componentMeshes['controlElectronics'] = ctrlMesh;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 5: FOUR COLOR-CODED SEALED COMPARTMENTS
    // -------------------------------------------------------------
    const binSpecs = [
      { id: 'yellow', color: 0xfacc15, x: -0.28, z: -0.4 },
      { id: 'red', color: 0xef4444, x: 0.28, z: -0.4 },
      { id: 'white', color: 0xe2e8f0, x: -0.28, z: -0.1 },
      { id: 'blue', color: 0x3b82f6, x: 0.28, z: -0.1 }
    ];
    binSpecs.forEach((b) => {
      const binMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.42, 0.28),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.92 })
      );
      binMesh.position.set(b.x, 0.58, b.z);
      binMesh.castShadow = true;
      subAssemblies.compartments.add(binMesh);
    });
    componentMeshes['compartments'] = subAssemblies.compartments;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 6: GRAVITY CHUTES
    // -------------------------------------------------------------
    binSpecs.forEach((b) => {
      const chute = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.22, 0.08),
        metalMat
      );
      chute.rotation.x = Math.PI / 6;
      chute.position.set(b.x, 0.78, b.z + 0.1);
      subAssemblies.chutes.add(chute);
    });
    componentMeshes['chutes'] = subAssemblies.chutes;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 7: SLOW FEED CONVEYOR BELT
    // -------------------------------------------------------------
    const conveyorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.06, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 })
    );
    conveyorMesh.position.set(0, 0.82, 0.05);
    subAssemblies.conveyor.add(conveyorMesh);
    componentMeshes['conveyor'] = conveyorMesh;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 8: INTAKE HOPPER FUNNEL
    // -------------------------------------------------------------
    const hopperMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.38, 0.3, 4),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 })
    );
    hopperMesh.rotation.y = Math.PI / 4;
    hopperMesh.position.set(0, 0.96, 0.38);
    subAssemblies.hopper.add(hopperMesh);
    componentMeshes['hopper'] = hopperMesh;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 9: TWO ARTICULATED ROBOTIC HANDS
    // -------------------------------------------------------------
    // Left Arm
    const leftArm = createRoboticArmMesh(armMat);
    leftArm.position.set(-0.25, 0.85, -0.05);
    subAssemblies.roboticHands.add(leftArm);

    // Right Arm
    const rightArm = createRoboticArmMesh(armMat);
    rightArm.position.set(0.25, 0.85, -0.05);
    subAssemblies.roboticHands.add(rightArm);

    componentMeshes['roboticHands'] = subAssemblies.roboticHands;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 10: AI CAMERA GANTRY
    // -------------------------------------------------------------
    const aiGantry = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.06, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 })
    );
    aiGantry.position.set(0, 1.22, 0.1);
    subAssemblies.aiCamera.add(aiGantry);
    componentMeshes['aiCamera'] = aiGantry;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 11: OUTER MEDICAL-WHITE BODY SHELL
    // -------------------------------------------------------------
    const bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.0, 1.45),
      medWhiteMat
    );
    bodyMesh.position.y = 0.85;
    bodyMesh.castShadow = true;
    subAssemblies.outerShell.add(bodyMesh);

    // Front Smart UI Screen
    const dispMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    dispMesh.position.set(0, 1.12, 0.735);
    subAssemblies.outerShell.add(dispMesh);
    componentMeshes['outerShell'] = bodyMesh;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 12: UPPER HOOD WITH BEVEL
    // -------------------------------------------------------------
    const hoodMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.12, 1.48),
      hoodMat
    );
    hoodMesh.position.y = 1.41;
    subAssemblies.upperHood.add(hoodMesh);
    componentMeshes['upperHood'] = hoodMesh;

    // -------------------------------------------------------------
    // SUB-ASSEMBLY 13: TOP 360° LIDAR TURRET
    // -------------------------------------------------------------
    const lidarBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    lidarBase.position.set(0, 1.52, -0.3);
    subAssemblies.topSensor.add(lidarBase);

    const lidarHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0x00d2ff, metalness: 0.8, roughness: 0.2 })
    );
    lidarHead.position.set(0, 1.64, -0.3);
    subAssemblies.topSensor.add(lidarHead);
    componentMeshes['topSensor'] = subAssemblies.topSensor;

    // Mount all Sub-Assemblies into robotRootGroup
    Object.keys(subAssemblies).forEach((k) => {
      robotRootGroup.add(subAssemblies[k]);
    });
  }

  function createRoboticArmMesh(material) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08), material);
    const link = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), material);
    link.position.set(0, 0.12, 0);
    const gripper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.08), material);
    gripper.position.set(0, 0.25, 0);
    group.add(base);
    group.add(link);
    group.add(gripper);
    return group;
  }

  /* ==========================================================================
     5. DIMENSION GUIDES & CLEARANCE ENVELOPES
     ========================================================================== */
  function buildDimensions() {
    dimensionsGroup.visible = false;

    // 1. Hospital Doorway Clearance Box (850mm wide x 2000mm high representation)
    const doorOutlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 2.1, 0.1));
    const doorOutlineMat = new THREE.LineBasicMaterial({ color: 0x00f5a0, opacity: 0.6, transparent: true });
    const doorOutline = new THREE.LineSegments(doorOutlineGeo, doorOutlineMat);
    doorOutline.position.set(0, 1.05, 0);
    dimensionsGroup.add(doorOutline);

    // 2. Robot Dimension Lines
    const dimMat = new THREE.LineBasicMaterial({ color: 0x00d2ff });

    // Height Dimension
    const hPoints = [new THREE.Vector3(0.75, 0, 0.75), new THREE.Vector3(0.75, 1.72, 0.75)];
    const hLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(hPoints), dimMat);
    dimensionsGroup.add(hLine);

    // Width Dimension
    const wPoints = [new THREE.Vector3(-0.65, 0.02, 0.85), new THREE.Vector3(0.65, 0.02, 0.85)];
    const wLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wPoints), dimMat);
    dimensionsGroup.add(wLine);

    // Length Dimension
    const lPoints = [new THREE.Vector3(0.75, 0.02, -0.8), new THREE.Vector3(0.75, 0.02, 0.8)];
    const lLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(lPoints), dimMat);
    dimensionsGroup.add(lLine);
  }

  /* ==========================================================================
     6. 10 COMPONENT ANNOTATION LABELS (3D SPRITES)
     ========================================================================== */
  function buildComponentLabels() {
    const labelsData = [
      { text: '01. 360° LiDAR SENSOR', pos: new THREE.Vector3(0, 1.8, -0.3) },
      { text: '02. INTAKE HOPPER', pos: new THREE.Vector3(0, 1.15, 0.55) },
      { text: '03. CONVEYOR FEED', pos: new THREE.Vector3(-0.45, 0.9, 0.05) },
      { text: '04. AI CAMERA GANTRY', pos: new THREE.Vector3(0, 1.35, 0.1) },
      { text: '05. DUAL ROBOTIC ARMS', pos: new THREE.Vector3(0.45, 0.95, -0.05) },
      { text: '06. GRAVITY CHUTES', pos: new THREE.Vector3(-0.45, 0.75, -0.2) },
      { text: '07. 4 SEALED BINS', pos: new THREE.Vector3(0.45, 0.55, -0.35) },
      { text: '08. LiFePO4 BATTERY', pos: new THREE.Vector3(0, 0.38, 0.55) },
      { text: '09. CHASSIS PLATFORM', pos: new THREE.Vector3(-0.7, 0.22, 0) },
      { text: '10. 4 DRIVE WHEELS', pos: new THREE.Vector3(0.75, 0.16, 0.55) }
    ];

    labelsData.forEach((ld) => {
      const sprite = createCadSprite(ld.text);
      sprite.position.copy(ld.pos);
      sprite.visible = showLabels;
      labelsGroup.add(sprite);
      labelSprites.push(sprite);
    });
  }

  function createCadSprite(message) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 28px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(8, 13, 26, 0.88)';
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 3;

    // Pill background
    roundRect(ctx, 4, 4, 504, 112, 14);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, 256, 58);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.1, 0.26, 1.0);
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

  /* ==========================================================================
     7. FEATURE NAVIGATION & SELECTION
     ========================================================================== */
  function selectFeature(idx, instant = false) {
    activeFeatureIndex = (idx + FEATURES.length) % FEATURES.length;
    const feat = FEATURES[activeFeatureIndex];

    // Update Top HUD
    if (expModePill) expModePill.textContent = `${feat.num} — ${feat.tag}`;
    if (expCategoryEl) expCategoryEl.textContent = feat.tag;
    if (expTitleEl) expTitleEl.textContent = feat.title;
    if (expDescEl) expDescEl.textContent = feat.desc;

    // Update Feature Navigation Tabs
    featureTabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === activeFeatureIndex);
    });

    // Update Component Inspector Sidebar Selection
    compButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-comp') === feat.focusComp);
    });

    // Update Exploded View & Cutaway State
    setExplodeTarget(feat.explode);
    setCutaway(feat.cutaway);

    // Show Specs Card
    if (expSpecBox && feat.specs) {
      if (expSpecTitle) expSpecTitle.textContent = feat.specs.title;
      if (expSpecDetails) {
        expSpecDetails.innerHTML = feat.specs.items
          .map((it) => `<div class="spec-row"><span class="spec-k">${it.k}</span><span class="spec-v">${it.v}</span></div>`)
          .join('');
      }
      expSpecBox.classList.add('visible');
    }

    // Camera Framing
    if (instant) {
      camera.position.set(feat.camPos.x, feat.camPos.y, feat.camPos.z);
      controls.target.set(feat.target.x, feat.target.y, feat.target.z);
      controls.update();
    }
  }

  /* ==========================================================================
     8. COMPONENT ISOLATION & SPOTLIGHTING
     ========================================================================== */
  function isolateComponent(compKey) {
    activeComponent = compKey;

    compButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-comp') === compKey);
    });

    // Find if a feature maps to this component
    const mappedFeatIdx = FEATURES.findIndex((f) => f.focusComp === compKey);
    if (mappedFeatIdx !== -1) {
      selectFeature(mappedFeatIdx);
    }
  }

  function resetIsolation() {
    activeComponent = null;
    compButtons.forEach((btn) => btn.classList.remove('active'));
    selectFeature(0);
  }

  /* ==========================================================================
     9. EXPLODED & CUTAWAY MODES
     ========================================================================== */
  function setExplodeTarget(targetValue) {
    explodeProgress = targetValue;
    isExploded = explodeProgress > 0.05;
    if (btnExplode) {
      btnExplode.classList.toggle('active', isExploded);
      const textSpan = btnExplode.querySelector('span');
      if (textSpan) textSpan.textContent = isExploded ? 'Reset Assembly' : 'Exploded View';
    }
  }

  function toggleExplode() {
    if (isExploded) {
      setExplodeTarget(0.0);
    } else {
      setExplodeTarget(1.0);
    }
  }

  function setCutaway(cutawayState) {
    isCutaway = cutawayState;
    const opacity = isCutaway ? 0.2 : 1.0;
    const transparent = isCutaway;

    if (componentMeshes['outerShell']) {
      componentMeshes['outerShell'].material.opacity = opacity;
      componentMeshes['outerShell'].material.transparent = transparent;
      componentMeshes['outerShell'].material.wireframe = isCutaway;
    }
    if (componentMeshes['upperHood']) {
      componentMeshes['upperHood'].material.opacity = isCutaway ? 0.25 : 1.0;
      componentMeshes['upperHood'].material.transparent = transparent;
    }

    if (btnCutaway) {
      btnCutaway.classList.toggle('active', isCutaway);
    }
  }

  /* ==========================================================================
     10. EVENT LISTENERS
     ========================================================================== */
  function setupEventListeners() {
    // Explode Toggle
    if (btnExplode) {
      btnExplode.addEventListener('click', toggleExplode);
    }

    // Cutaway Toggle
    if (btnCutaway) {
      btnCutaway.addEventListener('click', () => setCutaway(!isCutaway));
    }

    // Labels Toggle
    if (btnLabels) {
      btnLabels.addEventListener('click', () => {
        showLabels = !showLabels;
        labelsGroup.children.forEach((s) => (s.visible = showLabels));
        btnLabels.classList.toggle('active', showLabels);
      });
    }

    // Dimensions Toggle
    if (btnDimensions) {
      btnDimensions.addEventListener('click', () => {
        showDimensions = !showDimensions;
        dimensionsGroup.visible = showDimensions;
        btnDimensions.classList.toggle('active', showDimensions);
      });
    }

    // Reset View
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        setExplodeTarget(0.0);
        setCutaway(false);
        selectFeature(0, true);
        autoRotate = false;
        if (btnAutoRotate) btnAutoRotate.classList.remove('active');
      });
    }

    // Auto Rotate Toggle
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => {
        autoRotate = !autoRotate;
        btnAutoRotate.classList.toggle('active', autoRotate);
      });
    }

    // Feature Tabs
    featureTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const featIdx = parseInt(tab.getAttribute('data-feature'), 10);
        if (!isNaN(featIdx)) {
          selectFeature(featIdx);
        }
      });
    });

    // Component Buttons
    compButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const comp = btn.getAttribute('data-comp');
        if (comp === 'all') {
          resetIsolation();
        } else {
          isolateComponent(comp);
        }
      });
    });

    // Spec Box Close
    if (expSpecClose) {
      expSpecClose.addEventListener('click', () => {
        if (expSpecBox) expSpecBox.classList.remove('visible');
      });
    }
  }

  /* ==========================================================================
     11. ANIMATION LOOP & KINEMATICS
     ========================================================================== */
  function onResize() {
    if (!container || !renderer || !camera) return;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 540;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Auto Rotation for Initial Engineering Review
    if (autoRotate) {
      robotRootGroup.rotation.y += delta * 0.4;
      autoRotateTimer -= delta;
      if (autoRotateTimer <= 0) {
        autoRotate = false;
        if (btnAutoRotate) btnAutoRotate.classList.remove('active');
      }
    } else {
      robotRootGroup.rotation.y = THREE.MathUtils.lerp(robotRootGroup.rotation.y, 0, 0.05);
    }

    // Smoothly apply Exploded Sub-Assembly Offsets
    Object.keys(subAssemblies).forEach((k) => {
      const group = subAssemblies[k];
      const target = explodedTargets[k] || { x: 0, y: 0, z: 0 };
      group.position.x = THREE.MathUtils.lerp(group.position.x, target.x * explodeProgress, 0.08);
      group.position.y = THREE.MathUtils.lerp(group.position.y, target.y * explodeProgress, 0.08);
      group.position.z = THREE.MathUtils.lerp(group.position.z, target.z * explodeProgress, 0.08);
    });

    // Smooth Camera Transition to Feature Preset
    const feat = FEATURES[activeFeatureIndex];
    if (!controls.state || controls.state === -1) {
      camera.position.lerp(new THREE.Vector3(feat.camPos.x, feat.camPos.y, feat.camPos.z), 0.04);
      controls.target.lerp(new THREE.Vector3(feat.target.x, feat.target.y, feat.target.z), 0.04);
    }

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
