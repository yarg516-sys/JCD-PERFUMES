/* ==========================================================================
   JCD PERFUMES - 3D Interactive WebGL Perfume Engine (Three.js)
   Renders a luxury hand-polished silver & faceted sapphire crystal flacon
   with real-time reflections, refraction, mist physics, and 360° controls.
   ========================================================================== */

(function () {
  'use strict';

  let scene, camera, renderer;
  let perfumeGroup, bottleMesh, liquidMesh, capGroup, capMesh, gemMesh, plaqueMesh, collarMesh;
  let mistParticles, mistGeo, mistMat;
  let ambientParticles, ambientGeo, ambientMat;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let targetRotation = { x: 0.1, y: 0.35 };
  let currentRotation = { x: 0.1, y: 0.35 };
  let targetTilt = { x: 0, y: 0 };
  let isSpraying = false;
  let sprayTimer = 0;
  let sprayVelocities = [];
  let clock;

  // Colorways configuration
  const colorways = {
    sapphire: {
      name: 'Silver & Sapphire Imperial',
      bottleColor: 0x0a2d7a,
      liquidColor: 0x1e40af,
      capColor: 0xf1f5f9,
      gemColor: 0x2563eb,
      metalness: 0.98,
      roughness: 0.12,
      particleColor: 0x60a5fa,
      glowColor: '#2563eb'
    },
    noir: {
      name: 'Midnight Noir Oud',
      bottleColor: 0x050508,
      liquidColor: 0x18181b,
      capColor: 0x334155,
      gemColor: 0x09090b,
      metalness: 0.95,
      roughness: 0.25,
      particleColor: 0x94a3b8,
      glowColor: '#64748b'
    },
    platinum: {
      name: "L'Éclat de Platine",
      bottleColor: 0x1e293b,
      liquidColor: 0x38bdf8,
      capColor: 0xffffff,
      gemColor: 0xbae6fd,
      metalness: 1.0,
      roughness: 0.08,
      particleColor: 0xe0f2fe,
      glowColor: '#38bdf8'
    },
    amber: {
      name: 'Crown Amber Absolu',
      bottleColor: 0x78350f,
      liquidColor: 0xb45309,
      capColor: 0xfbbf24,
      gemColor: 0xd97706,
      metalness: 0.92,
      roughness: 0.15,
      particleColor: 0xfef08a,
      glowColor: '#f59e0b'
    }
  };

  let currentColorway = colorways.sapphire;

  function init() {
    const container = document.getElementById('perfume-canvas-container');
    if (!container) return;

    clock = new THREE.Clock();

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.04);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
    camera.position.set(0, 0.8, 8.5);

    // Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('perfume-canvas'),
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    setupLighting();

    // Environment reflections
    setupPerfumeBottle();

    // Ambient floating particles
    setupAmbientParticles();

    // Atomizer mist system
    setupMistSystem();

    // Event listeners
    setupControls(container);

    // Start loop
    animate();

    window.addEventListener('resize', onWindowResize);
  }

  function setupLighting() {
    // Ambient base light
    const ambientLight = new THREE.AmbientLight(0x0a1636, 1.4);
    scene.add(ambientLight);

    // Key front light (crisp silver highlight)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    // Royal Sapphire Rim Light (from behind left)
    const rimLightBlue = new THREE.DirectionalLight(0x2563eb, 4.5);
    rimLightBlue.position.set(-5, 4, -4);
    scene.add(rimLightBlue);

    // Cyan / Platinum Rim Light (from behind right)
    const rimLightCyan = new THREE.DirectionalLight(0x38bdf8, 3.2);
    rimLightCyan.position.set(5, -2, -3);
    scene.add(rimLightCyan);

    // Point Light inside / beneath the flacon for ethereal inner glow
    const pointLight = new THREE.PointLight(0x1d4ed8, 2.0, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
  }

  function createPlaqueTexture(title, subtitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Silver brushed background
    const gradient = ctx.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, '#f1f5f9');
    gradient.addColorStop(0.3, '#cbd5e1');
    gradient.addColorStop(0.7, '#94a3b8');
    gradient.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);

    // Metallic border
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 476, 220);

    // Brand text
    ctx.textAlign = 'center';
    ctx.fillStyle = '#050b1e';
    ctx.font = 'bold 38px "Cinzel", Georgia, serif';
    ctx.fillText('J C D', 256, 75);

    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 42px "Cinzel", Georgia, serif';
    ctx.fillText('P E R F U M E S', 256, 130);

    ctx.fillStyle = '#334155';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('IMPERIAL EXTRAIT • 35%', 256, 175);

    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 16px "Cormorant Garamond", serif';
    ctx.fillText('Hand-Polished Silver Flacon', 256, 210);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;
    return texture;
  }

  function setupPerfumeBottle() {
    perfumeGroup = new THREE.Group();

    // 1. Faceted Crystal Bottle Body (Octagonal Diamond Cylinder)
    // Radius top: 1.5, radius bottom: 1.6, height: 3.4, segments: 8
    const bottleGeo = new THREE.CylinderGeometry(1.45, 1.55, 3.4, 8, 2, false);
    
    const bottleMat = new THREE.MeshPhysicalMaterial({
      color: currentColorway.bottleColor,
      metalness: 0.15,
      roughness: 0.06,
      transmission: 0.88,
      thickness: 1.8,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      attenuationColor: new THREE.Color(0x1e40af),
      attenuationDistance: 1.0,
      transparent: true,
      opacity: 0.95
    });

    bottleMesh = new THREE.Mesh(bottleGeo, bottleMat);
    bottleMesh.position.y = -0.3;
    bottleMesh.castShadow = true;
    bottleMesh.receiveShadow = true;
    perfumeGroup.add(bottleMesh);

    // 2. Liquid Core inside the bottle
    const liquidGeo = new THREE.CylinderGeometry(1.28, 1.35, 2.8, 8);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: currentColorway.liquidColor,
      metalness: 0.05,
      roughness: 0.15,
      transmission: 0.75,
      thickness: 1.2,
      transparent: true,
      opacity: 0.8
    });
    liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = -0.45;
    perfumeGroup.add(liquidMesh);

    // 3. Thick Crystal Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.65, 1.7, 0.45, 8);
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x0e245c,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.9,
      clearcoat: 1.0
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -2.15;
    perfumeGroup.add(baseMesh);

    // 4. Heavy Silver Flacon Neck / Collar
    const collarGeo = new THREE.CylinderGeometry(0.72, 0.85, 0.5, 32);
    const silverMat = new THREE.MeshStandardMaterial({
      color: currentColorway.capColor,
      metalness: currentColorway.metalness,
      roughness: currentColorway.roughness,
      envMapIntensity: 2.0
    });
    collarMesh = new THREE.Mesh(collarGeo, silverMat);
    collarMesh.position.y = 1.6;
    collarMesh.castShadow = true;
    perfumeGroup.add(collarMesh);

    // Ribbed ring on collar
    const ribbedRingGeo = new THREE.TorusGeometry(0.76, 0.07, 16, 48);
    const ribbedRing = new THREE.Mesh(ribbedRingGeo, silverMat);
    ribbedRing.rotation.x = Math.PI / 2;
    ribbedRing.position.y = 1.65;
    perfumeGroup.add(ribbedRing);

    // 5. Heavy Sculptural Silver Cap (The Imperial Cap)
    capGroup = new THREE.Group();
    capGroup.position.y = 2.25;

    // Lower tier of cap
    const capLowerGeo = new THREE.CylinderGeometry(0.88, 0.82, 0.7, 8);
    capMesh = new THREE.Mesh(capLowerGeo, silverMat);
    capMesh.castShadow = true;
    capGroup.add(capMesh);

    // Upper crown block of cap
    const capUpperGeo = new THREE.BoxGeometry(1.4, 0.55, 1.4);
    const capUpper = new THREE.Mesh(capUpperGeo, silverMat);
    capUpper.position.y = 0.55;
    capUpper.castShadow = true;
    capGroup.add(capUpper);

    // Inset Sapphire Gemstone on the summit of the cap
    const gemGeo = new THREE.DodecahedronGeometry(0.35, 1);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: currentColorway.gemColor,
      metalness: 0.1,
      roughness: 0.02,
      transmission: 0.95,
      ior: 1.77, // Sapphire refractive index
      clearcoat: 1.0,
      emissive: new THREE.Color(currentColorway.gemColor),
      emissiveIntensity: 0.35
    });
    gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.position.y = 0.92;
    capGroup.add(gemMesh);

    perfumeGroup.add(capGroup);

    // 6. Masterpiece Embossed Front Plaque
    const plaqueGeo = new THREE.PlaneGeometry(1.65, 0.85);
    const plaqueTexture = createPlaqueTexture('JCD PERFUMES', 'IMPERIAL EXTRAIT');
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTexture,
      metalness: 0.9,
      roughness: 0.22,
      bumpScale: 0.05
    });
    plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.position.set(0, -0.2, 1.48);
    perfumeGroup.add(plaqueMesh);

    // Back Plaque with serial number
    const backPlaqueMesh = plaqueMesh.clone();
    backPlaqueMesh.position.set(0, -0.2, -1.48);
    backPlaqueMesh.rotation.y = Math.PI;
    perfumeGroup.add(backPlaqueMesh);

    // Atomizer nozzle hole at top
    const nozzleGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.set(0, 3.4, 0);
    perfumeGroup.add(nozzle);

    // Subtle initial angle
    perfumeGroup.rotation.x = currentRotation.x;
    perfumeGroup.rotation.y = currentRotation.y;

    scene.add(perfumeGroup);
  }

  function setupAmbientParticles() {
    const particleCount = 140;
    ambientGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      scales[i] = Math.random() * 0.08 + 0.02;
    }

    ambientGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(96, 165, 250, 0.9)');
    grad.addColorStop(0.7, 'rgba(37, 99, 235, 0.4)');
    grad.addColorStop(1, 'rgba(3, 7, 18, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const particleTexture = new THREE.CanvasTexture(canvas);

    ambientMat = new THREE.PointsMaterial({
      size: 0.22,
      map: particleTexture,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    ambientParticles = new THREE.Points(ambientGeo, ambientMat);
    scene.add(ambientParticles);
  }

  function setupMistSystem() {
    const mistCount = 350;
    mistGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(mistCount * 3);
    sprayVelocities = [];

    for (let i = 0; i < mistCount; i++) {
      // Start hidden inside cap
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
      sprayVelocities.push({ x: 0, y: 0, z: 0, life: 0, maxLife: 1 });
    }

    mistGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Soft mist cloud texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.4, 'rgba(186, 230, 253, 0.6)');
    grad.addColorStop(0.8, 'rgba(37, 99, 235, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const mistTexture = new THREE.CanvasTexture(canvas);

    mistMat = new THREE.PointsMaterial({
      size: 0.5,
      map: mistTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    mistParticles = new THREE.Points(mistGeo, mistMat);
    scene.add(mistParticles);
  }

  // Trigger Atomizer Spray animation
  window.triggerPerfumeSpray = function () {
    isSpraying = true;
    sprayTimer = 0;

    // Micro cap bounce animation
    if (capGroup) {
      capGroup.position.y = 2.05;
      setTimeout(() => {
        capGroup.position.y = 2.25;
      }, 160);
    }

    // Play synthesized luxury chime sound if audio API is available
    if (window.playLuxuryChime) {
      window.playLuxuryChime();
    }

    // Re-initialize particles at cap tip
    const positions = mistGeo.attributes.position.array;
    for (let i = 0; i < sprayVelocities.length; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = 3.2; // Cap tip height
      positions[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.2;

      // Spray upward and outward in a conical mist
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.08 + 0.04;
      const spread = Math.random() * 0.05 + 0.02;

      sprayVelocities[i] = {
        x: Math.cos(angle) * spread,
        y: speed + 0.03,
        z: Math.sin(angle) * spread + 0.04,
        life: 0,
        maxLife: Math.random() * 60 + 50
      };
    }
    mistGeo.attributes.position.needsUpdate = true;
  };

  // Colorway switcher
  window.switchPerfumeColorway = function (name) {
    if (!colorways[name]) return;
    currentColorway = colorways[name];

    bottleMesh.material.color.setHex(currentColorway.bottleColor);
    liquidMesh.material.color.setHex(currentColorway.liquidColor);
    capMesh.material.color.setHex(currentColorway.capColor);
    collarMesh.material.color.setHex(currentColorway.capColor);
    gemMesh.material.color.setHex(currentColorway.gemColor);
    gemMesh.material.emissive.setHex(currentColorway.gemColor);

    // Dynamic label update
    const badge = document.getElementById('edition-badge-text');
    if (badge) {
      badge.textContent = currentColorway.name.toUpperCase();
    }
  };

  function setupControls(container) {
    // Mouse / Touch Drag Rotation
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        targetRotation.y += deltaX * 0.007;
        targetRotation.x += deltaY * 0.005;

        // Clamp x rotation to avoid flipping upside down
        targetRotation.x = Math.max(-0.4, Math.min(0.4, targetRotation.x));

        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        // Subtle parallax tilt following cursor
        const rect = container.getBoundingClientRect();
        const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        targetTilt.x = normY * 0.12;
        targetTilt.y = normX * 0.18;
      }
    });

    // Touch support for mobile devices
    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    container.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        targetRotation.y += deltaX * 0.009;
        targetRotation.x += deltaY * 0.006;
        targetRotation.x = Math.max(-0.4, Math.min(0.4, targetRotation.x));

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });
  }

  function onWindowResize() {
    const container = document.getElementById('perfume-canvas-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock ? clock.getElapsedTime() : 0;

    // Idle gentle floating and rotation
    if (!isDragging) {
      targetRotation.y += 0.0025; // Gentle constant turn
    }

    // Smooth damping / interpolation
    currentRotation.x += (targetRotation.x + targetTilt.x - currentRotation.x) * 0.08;
    currentRotation.y += (targetRotation.y + targetTilt.y - currentRotation.y) * 0.08;

    if (perfumeGroup) {
      perfumeGroup.rotation.x = currentRotation.x;
      perfumeGroup.rotation.y = currentRotation.y;
      // Gentle floating levitation
      perfumeGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;
    }

    // Animate ambient floating dust particles
    if (ambientParticles) {
      ambientParticles.rotation.y = elapsedTime * 0.03;
      ambientParticles.rotation.x = Math.sin(elapsedTime * 0.02) * 0.05;
    }

    // Animate atomizer spray particles
    if (isSpraying && mistGeo) {
      const positions = mistGeo.attributes.position.array;
      let activeCount = 0;

      for (let i = 0; i < sprayVelocities.length; i++) {
        const p = sprayVelocities[i];
        if (p.life < p.maxLife) {
          p.life++;
          activeCount++;

          // Physics updates: expansion, drag, upward drift
          positions[i * 3] += p.x;
          positions[i * 3 + 1] += p.y;
          positions[i * 3 + 2] += p.z;

          // Drag / air resistance
          p.x *= 0.96;
          p.y *= 0.97;
          p.z *= 0.96;
        } else {
          // Hide particle after life expires
          positions[i * 3 + 1] = -100;
        }
      }

      mistGeo.attributes.position.needsUpdate = true;

      if (activeCount === 0) {
        isSpraying = false;
      }
    }

    renderer.render(scene, camera);
  }

  // Initialize on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
