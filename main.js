/* ==========================================================================
   JCD PERFUMES - Core Interactive Engine
   Handles: Animated Fog Background, 3D Card Tilt, Web Audio Synth,
   Shopping Bag Drawer, Bespoke Flacon Lab, Scent Matcher Quiz, and Modals.
   ========================================================================== */

(function () {
  'use strict';

  // --- 1. LUXURY AUDIO SYNTHESIZER (Web Audio API - 100% Offline) ---
  let audioCtx = null;
  let isSoundMuted = true;
  let ambientDroneNode = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  window.playLuxuryChime = function () {
    if (isSoundMuted) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      // Elegant crystal chord frequencies (F# Pentatonic)
      const freqs = [370.0, 554.37, 740.0, 1108.73];

      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        // Soft shimmer envelope
        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + idx * 0.04 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 1.6);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 1.8);
      });
    } catch (e) {
      console.warn('Audio chime warning:', e);
    }
  };

  function toggleAudio() {
    isSoundMuted = !isSoundMuted;
    const soundToggle = document.getElementById('sound-toggle-btn');
    const soundWaves = document.getElementById('sound-waves');
    const soundText = document.getElementById('sound-status-text');

    if (!isSoundMuted) {
      initAudio();
      window.playLuxuryChime();
      if (soundWaves) soundWaves.classList.remove('opacity-30');
      if (soundText) soundText.textContent = 'SOUND: ON';
      if (soundToggle) soundToggle.classList.add('border-blue-400');
    } else {
      if (soundWaves) soundWaves.classList.add('opacity-30');
      if (soundText) soundText.textContent = 'SOUND: OFF';
      if (soundToggle) soundToggle.classList.remove('border-blue-400');
    }
  }

  // --- 2. ANIMATED VOLUMETRIC FOG & PARTICLES BACKGROUND ---
  function setupFogCanvas() {
    const canvas = document.getElementById('fog-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Fog cloud entities
    const clouds = [];
    const cloudCount = 14;

    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 320 + 200,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.09 + 0.04,
        hue: Math.random() > 0.6 ? 215 : 225 // Royal sapphire blue tones
      });
    }

    // Floating Stardust motes
    const stardust = [];
    const dustCount = 45;

    for (let i = 0; i < dustCount; i++) {
      stardust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.8,
        vy: -(Math.random() * 0.4 + 0.15),
        vx: (Math.random() - 0.5) * 0.2,
        alpha: Math.random() * 0.7 + 0.3,
        pulseSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }

    function renderFog() {
      ctx.clearRect(0, 0, width, height);

      // Render drifting sapphire fog puffs
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.x += c.vx;
        c.y += c.vy;

        // Wrap around bounds
        if (c.x < -c.radius) c.x = width + c.radius;
        if (c.x > width + c.radius) c.x = -c.radius;
        if (c.y < -c.radius) c.y = height + c.radius;
        if (c.y > height + c.radius) c.y = -c.radius;

        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius);
        grad.addColorStop(0, `hsla(${c.hue}, 85%, 55%, ${c.alpha})`);
        grad.addColorStop(0.5, `hsla(${c.hue}, 80%, 45%, ${c.alpha * 0.5})`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render rising silver/sapphire dust motes
      for (let i = 0; i < stardust.length; i++) {
        const d = stardust[i];
        d.y += d.vy;
        d.x += d.vx;
        d.phase += d.pulseSpeed;

        if (d.y < 0) {
          d.y = height + 10;
          d.x = Math.random() * width;
        }

        const currentAlpha = (Math.sin(d.phase) * 0.5 + 0.5) * d.alpha;
        ctx.fillStyle = `rgba(226, 232, 240, ${currentAlpha})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      requestAnimationFrame(renderFog);
    }

    renderFog();
  }

  // --- 3. AMBIENT CURSOR GLOW FOLLOWER ---
  function setupAmbientGlow() {
    const glow = document.querySelector('.ambient-glow');
    if (!glow) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function updateGlow() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      glow.style.left = `${currentX}px`;
      glow.style.top = `${currentY}px`;
      requestAnimationFrame(updateGlow);
    }
    updateGlow();
  }

  // --- 4. 3D TILT EFFECT FOR PRODUCT CARDS & IMAGES ---
  function setup3DTilt() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach((card) => {
      const inner = card.querySelector('.tilt-inner') || card;
      let glare = card.querySelector('.tilt-glare');

      if (!glare) {
        glare = document.createElement('div');
        glare.className = 'tilt-glare';
        card.appendChild(glare);
      }

      card.addEventListener('mouseenter', () => {
        glare.style.opacity = '1';
      });

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -12; // Max 12 deg
        const rotateY = ((x - centerX) / centerX) * 12;

        inner.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;

        // Dynamic glare position
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.28) 0%, transparent 65%)`;
      });

      card.addEventListener('mouseleave', () => {
        inner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        glare.style.opacity = '0';
      });
    });
  }

  // --- 5. SHOPPING BAG & ROYAL VAULT CART MANAGEMENT ---
  const cartState = {
    items: [
      {
        id: 'imperial-sapphire',
        name: 'Silver & Sapphire Imperial Edition',
        concentration: 'Extrait de Parfum (35% Oil)',
        size: '100ml / 3.4 FL.OZ',
        price: 380,
        qty: 1,
        image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80',
        cap: 'Hand-Polished Silver Alloy',
        box: 'Midnight Sapphire Velvet Casket'
      }
    ],
    complimentarySample: 'Midnight Noir Oud (5ml Mini-Flacon)',
    giftWrap: true
  };

  function updateCartUI() {
    const cartCountBadges = document.querySelectorAll('.cart-count-badge');
    const cartItemsContainer = document.getElementById('cart-items-list');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartTotalEl = document.getElementById('cart-total');

    const totalQty = cartState.items.reduce((acc, item) => acc + item.qty, 0);
    cartCountBadges.forEach((badge) => {
      badge.textContent = totalQty;
      badge.classList.remove('scale-125');
      void badge.offsetWidth;
      badge.classList.add('scale-125');
      setTimeout(() => badge.classList.remove('scale-125'), 200);
    });

    const subtotal = cartState.items.reduce((acc, item) => acc + item.price * item.qty, 0);
    if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toLocaleString()}`;
    if (cartTotalEl) cartTotalEl.textContent = `$${subtotal.toLocaleString()}`;

    if (!cartItemsContainer) return;

    if (cartState.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="py-16 text-center text-slate-400">
          <div class="text-4xl mb-3">🗝️</div>
          <p class="font-cinzel text-lg text-white mb-2">Your Royal Casket is Empty</p>
          <p class="text-xs text-slate-400 mb-6">Explore the Vault to acquire an imperial flacon.</p>
          <button onclick="window.toggleCartDrawer(false)" class="px-6 py-2 border border-blue-500/40 text-blue-400 text-xs tracking-widest uppercase hover:bg-blue-600/10">Browse Vault</button>
        </div>
      `;
      return;
    }

    cartItemsContainer.innerHTML = cartState.items
      .map(
        (item) => `
        <div class="flex gap-4 p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 backdrop-blur-sm relative group">
          <div class="w-20 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-700/50 flex-shrink-0">
            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start">
                <h4 class="font-cinzel text-sm font-semibold text-white leading-tight">${item.name}</h4>
                <button onclick="window.removeCartItem('${item.id}')" class="text-slate-500 hover:text-red-400 text-xs ml-2">✕</button>
              </div>
              <p class="text-[11px] text-blue-300 mt-1">${item.concentration}</p>
              <p class="text-[10px] text-slate-400">${item.cap}</p>
            </div>
            <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-800">
              <div class="flex items-center gap-2 border border-slate-700/60 rounded px-2 py-0.5 bg-black/40">
                <button onclick="window.updateCartQty('${item.id}', -1)" class="text-slate-400 hover:text-white text-xs px-1">-</button>
                <span class="text-xs font-mono text-white px-1">${item.qty}</span>
                <button onclick="window.updateCartQty('${item.id}', 1)" class="text-slate-400 hover:text-white text-xs px-1">+</button>
              </div>
              <span class="font-cinzel text-sm font-bold text-slate-100">$${(item.price * item.qty).toLocaleString()}</span>
            </div>
          </div>
        </div>
      `
      )
      .join('');
  }

  window.toggleCartDrawer = function (open) {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer || !overlay) return;

    if (open) {
      overlay.classList.remove('hidden');
      setTimeout(() => {
        overlay.classList.remove('opacity-0');
        drawer.classList.remove('translate-x-full');
      }, 10);
      window.playLuxuryChime();
    } else {
      drawer.classList.add('translate-x-full');
      overlay.classList.add('opacity-0');
      setTimeout(() => {
        overlay.classList.add('hidden');
      }, 350);
    }
  };

  window.updateCartQty = function (id, delta) {
    const item = cartState.items.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cartState.items = cartState.items.filter((i) => i.id !== id);
    }
    updateCartUI();
  };

  window.removeCartItem = function (id) {
    cartState.items = cartState.items.filter((i) => i.id !== id);
    updateCartUI();
  };

  window.addToCart = function (product) {
    const existing = cartState.items.find((i) => i.id === product.id);
    if (existing) {
      existing.qty++;
    } else {
      cartState.items.push({
        id: product.id,
        name: product.name,
        concentration: product.concentration || 'Extrait de Parfum (35% Oil)',
        size: product.size || '100ml / 3.4 FL.OZ',
        price: product.price,
        qty: 1,
        image: product.image,
        cap: product.cap || 'Solid Silver Alloy Cap',
        box: 'Midnight Sapphire Velvet Casket'
      });
    }
    updateCartUI();
    window.toggleCartDrawer(true);
  };

  // --- 6. PACKAGING ART MODAL ---
  window.togglePackagingModal = function (open) {
    const modal = document.getElementById('packaging-modal');
    if (!modal) return;
    if (open) {
      modal.classList.remove('hidden');
      setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('.modal-content')?.classList.remove('scale-95');
      }, 10);
      window.playLuxuryChime();
    } else {
      modal.classList.add('opacity-0');
      modal.querySelector('.modal-content')?.classList.add('scale-95');
      setTimeout(() => {
        modal.classList.add('hidden');
      }, 300);
    }
  };

  // --- 7. CHECKOUT SIMULATION MODAL ---
  window.openCheckoutModal = function () {
    window.toggleCartDrawer(false);
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
    }, 10);
  };

  window.closeCheckoutModal = function () {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  };

  window.completeImperialOrder = function (e) {
    e.preventDefault();
    const form = document.getElementById('checkout-form');
    const successView = document.getElementById('order-success-view');
    if (form && successView) {
      form.classList.add('hidden');
      successView.classList.remove('hidden');
      window.playLuxuryChime();
      cartState.items = [];
      updateCartUI();
    }
  };

  // --- 8. BESPOKE FLACON LAB (CUSTOMIZER) ---
  const customizerState = {
    cap: 'silver',
    crystal: 'sapphire',
    engraving: 'JCD',
    concentration: 35,
    basePrice: 380
  };

  window.updateCustomizer = function (type, value) {
    customizerState[type] = value;

    // Update 3D scene if Three.js function is available
    if (type === 'crystal') {
      if (window.switchPerfumeColorway) {
        window.switchPerfumeColorway(value);
      }
    }

    // Update UI highlights
    document.querySelectorAll(`[data-custom-${type}]`).forEach((btn) => {
      if (btn.getAttribute(`data-custom-${type}`) === String(value)) {
        btn.classList.add('border-blue-400', 'bg-blue-600/30', 'ring-2', 'ring-blue-400/50');
      } else {
        btn.classList.remove('border-blue-400', 'bg-blue-600/30', 'ring-2', 'ring-blue-400/50');
      }
    });

    // Update Monogram preview
    const monogramPreview = document.getElementById('engraving-preview-text');
    if (monogramPreview) {
      monogramPreview.textContent = (customizerState.engraving || 'JCD').toUpperCase();
    }

    // Recalculate price
    let finalPrice = customizerState.basePrice;
    if (customizerState.cap === 'gold') finalPrice += 75;
    if (customizerState.concentration === 45) finalPrice += 95;
    if (customizerState.concentration === 25) finalPrice -= 40;

    const priceEl = document.getElementById('customizer-final-price');
    if (priceEl) priceEl.textContent = `$${finalPrice}`;
  };

  // --- 9. SCENT MATCHMAKER QUIZ ---
  let quizStep = 1;
  const quizAnswers = {};

  window.selectQuizOption = function (step, key, val) {
    quizAnswers[key] = val;

    const stepEl = document.getElementById(`quiz-step-${step}`);
    const nextStepEl = document.getElementById(`quiz-step-${step + 1}`);

    if (step < 3) {
      if (stepEl) stepEl.classList.add('hidden');
      if (nextStepEl) nextStepEl.classList.remove('hidden');
      quizStep++;
    } else {
      // Show result
      if (stepEl) stepEl.classList.add('hidden');
      const resultEl = document.getElementById('quiz-result');
      if (resultEl) {
        resultEl.classList.remove('hidden');
        window.playLuxuryChime();
      }
    }
  };

  window.resetQuiz = function () {
    quizStep = 1;
    for (let i = 1; i <= 3; i++) {
      const step = document.getElementById(`quiz-step-${i}`);
      if (step) {
        if (i === 1) step.classList.remove('hidden');
        else step.classList.add('hidden');
      }
    }
    const resultEl = document.getElementById('quiz-result');
    if (resultEl) resultEl.classList.add('hidden');
  };

  // --- 10. OLFACTORY PYRAMID INTERACTIVE TABS ---
  window.switchScentNoteTab = function (tier) {
    const tabs = ['top', 'heart', 'base'];
    tabs.forEach((t) => {
      const content = document.getElementById(`scent-tier-${t}`);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (t === tier) {
        if (content) content.classList.remove('hidden');
        if (btn) {
          btn.classList.add('border-blue-400', 'text-white', 'bg-blue-600/20');
          btn.classList.remove('border-slate-800', 'text-slate-400');
        }
      } else {
        if (content) content.classList.add('hidden');
        if (btn) {
          btn.classList.remove('border-blue-400', 'text-white', 'bg-blue-600/20');
          btn.classList.add('border-slate-800', 'text-slate-400');
        }
      }
    });
  };

  // --- INITIALIZE ALL ON DOM READY ---
  document.addEventListener('DOMContentLoaded', () => {
    setupFogCanvas();
    setupAmbientGlow();
    setup3DTilt();
    updateCartUI();

    // Sound toggle event
    const soundToggle = document.getElementById('sound-toggle-btn');
    if (soundToggle) {
      soundToggle.addEventListener('click', toggleAudio);
    }

    // Engraving input listener
    const engravingInput = document.getElementById('engraving-input');
    if (engravingInput) {
      engravingInput.addEventListener('input', (e) => {
        window.updateCustomizer('engraving', e.target.value.substring(0, 5));
      });
    }

    // Atomizer spray button
    const sprayBtn = document.getElementById('btn-test-spray');
    if (sprayBtn) {
      sprayBtn.addEventListener('click', () => {
        if (window.triggerPerfumeSpray) {
          window.triggerPerfumeSpray();
        }
      });
    }
  });
})();
