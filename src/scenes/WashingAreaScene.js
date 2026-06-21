// src/scenes/WashingAreaScene.js
// Screen 4a: Washing Area — Hold-release mini-game with bento overlay and selected vegetable rendering
import Phaser from 'phaser';
import { resolveFrame } from '../utils/ItemData.js';

const VEGETABLE_FRAME_MAP = {
  efo_shoko: 'EFO_SHOKO',
  spinach: 'SPINACH',
  bitter_leaf: 'BITTER_LEAF',
};

/**
 * Slices a frame from a preloaded Phaser texture atlas and renders it to a HTML5 canvas.
 */
function createTextureCanvas(scene, textureKey, frameKey) {
  const texture = scene.textures.get(textureKey);
  if (!texture) {
    console.error(`[createTextureCanvas] Texture not found: ${textureKey}`);
    return null;
  }
  const frame = texture.get(frameKey);
  if (!frame) {
    console.error(`[createTextureCanvas] Frame not found: ${frameKey} in texture: ${textureKey}`);
    return null;
  }

  const cutX = frame.cutX !== undefined ? frame.cutX : frame.x;
  const cutY = frame.cutY !== undefined ? frame.cutY : frame.y;
  const cutWidth = frame.cutWidth || frame.width;
  const cutHeight = frame.cutHeight || frame.height;

  if (!cutWidth || !cutHeight) {
    console.error(`[createTextureCanvas] Zero dimensions for frame: ${frameKey}`);
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = cutWidth;
  canvas.height = cutHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    frame.source.image,
    cutX, cutY, cutWidth, cutHeight,
    0, 0, cutWidth, cutHeight
  );
  return canvas;
}

export class WashingAreaScene extends Phaser.Scene {
  constructor() {
    super('WashingAreaScene');
    this.overlay = null;
    this.isHolding = false;
    this.elapsedTime = 0;
    this.maxTime = 8.0;
    this.optimalStart = 3.0;
    this.optimalEnd = 5.0;

    // Elements cache
    this.timerTextElement = null;
    this.statusTextElement = null;
    this.needleElement = null;
    this.perfectZoneBar = null;
    this.efficiencyElement = null;
    this.qualityElement = null;

    this.vegBobElements = [];
    this.bubbleTimer = null;
  }

  create() {
    this.isHolding = false;
    this.elapsedTime = 0;
    this.vegBobElements = [];

    // Retrieve metrics from minigames config dynamically
    const data = this.game.gameState.contentPack.miniGames.washingArea;
    this.optimalStart = data.timer?.optimalStart || 3.0;
    this.optimalEnd = data.timer?.optimalEnd || 5.0;
    this.maxTime = data.timer?.maxTime || 8.0;

    // ─── GRADIENT BACKGROUND (Phaser visual depth) ───
    const gfx = this.add.graphics();
    const topColor = Phaser.Display.Color.HexStringToColor('#0c091b');
    const bottomColor = Phaser.Display.Color.HexStringToColor('#0d0b14');
    for (let y = 0; y < 854; y++) {
      const t = y / 854;
      const r = Phaser.Math.Linear(topColor.red, bottomColor.red, t);
      const g = Phaser.Math.Linear(topColor.green, bottomColor.green, t);
      const b = Phaser.Math.Linear(topColor.blue, bottomColor.blue, t);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      gfx.fillRect(0, y, 480, 1);
    }

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ─── DOM OVERLAY INJECTION ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'washing-area-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';
    this.overlay.innerHTML = `
      <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48;
        }
        .fill-icon {
            font-variation-settings: 'FILL' 1;
        }
        @keyframes pulse-gentle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(0.97); }
        }
        .animate-pulse-gentle {
            animation: pulse-gentle 2.2s ease-in-out infinite;
        }
        @keyframes bubble-float {
            0% { transform: translateY(0) scale(0.8); opacity: 0; }
            30% { opacity: 0.7; }
            100% { transform: translateY(-160px) scale(1.6); opacity: 0; }
        }
        .bubble {
            position: absolute;
            background: rgba(151, 212, 175, 0.35);
            border-radius: 50%;
            pointer-events: none;
            animation: bubble-float 2.5s infinite ease-out;
            box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.4);
        }
        .inner-glow {
            box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05), inset 0 -10px 30px rgba(21, 101, 192, 0.15);
        }
        .perfect-zone-glow {
            box-shadow: 0 0 16px rgba(151, 212, 175, 0.7);
        }
      </style>

      <!-- Top App Bar -->
      <header class="w-full bg-surface-container-high shadow-sm flex justify-between items-center px-container-padding py-sm z-30">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Efo Egusi: <span class="text-on-surface-variant">Cooking My Way!</span></h1>
        </div>
        <button class="material-symbols-outlined text-on-surface-variant hover:opacity-85 transition-opacity active:scale-95 cursor-pointer">settings</button>
      </header>

      <!-- Main Game View -->
      <main class="flex-1 px-container-padding pb-32 pt-lg flex flex-col gap-md items-center max-w-lg mx-auto w-full z-10 overflow-y-auto no-scrollbar">
        <!-- Status Bar -->
        <div class="w-full flex justify-between items-end mb-xs">
          <div class="flex flex-col gap-xs">
            <span class="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-widest text-xs">Current Task</span>
            <h2 class="font-headline-lg text-headline-lg text-on-surface uppercase tracking-wider">${data.label}</h2>
          </div>
          <div class="text-right">
            <div id="timer-box" class="font-stats-number text-stats-number text-on-surface bg-surface-container/60 border border-outline-variant/30 px-md py-xs rounded-xl transition-all duration-300">
              0.0s
            </div>
            <span id="status-text" class="font-label-bold text-[10px] text-on-surface-variant/60 uppercase tracking-wider block mt-1">Ready</span>
          </div>
        </div>

        <!-- Central Water Basin Bowl -->
        <div class="relative w-full aspect-square rounded-[32px] bg-surface-container-low inner-glow overflow-hidden border border-white/5 flex items-center justify-center group shadow-2xl" style="background: radial-gradient(circle, rgba(29, 39, 68, 0.9) 0%, rgba(21, 19, 36, 0.98) 100%);">
          <!-- Translucent Water Caustics Effect -->
          <div class="absolute inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(circle at 50% 50%, #2196f3 1px, transparent 100px); background-size: 80px 80px;"></div>
          <!-- Bubble particle container -->
          <div class="absolute inset-0 z-0 overflow-hidden" id="bubble-container"></div>
          
          <!-- Bobbing Canvas Vegetables container -->
          <div class="relative z-10 w-4/5 h-4/5 flex items-center justify-center" id="vegetable-container"></div>

          <!-- Splash sparkle elements overlay -->
          <div class="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            <span class="material-symbols-outlined text-secondary text-5xl opacity-25 animate-ping absolute top-1/4 left-1/4">spark</span>
            <span class="material-symbols-outlined text-secondary text-4xl opacity-20 animate-ping absolute bottom-1/3 right-1/4" style="animation-delay: 0.6s">water_drop</span>
          </div>
        </div>

        <!-- Precision Gauge Section -->
        <div class="w-full bg-surface-container rounded-2xl p-md flex flex-col gap-sm shadow-xl border border-outline-variant/20 mt-xs">
          <div class="flex justify-between items-center">
            <span class="font-label-bold text-label-bold text-on-surface-variant">Precision Meter</span>
            <span id="zone-badge" class="text-[10px] font-label-bold text-on-surface-variant/40 bg-surface-variant/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider transition-all duration-200">HOLD BUTTON</span>
          </div>
          
          <!-- Gauge Bar Container -->
          <div class="relative h-6 w-full bg-surface-variant rounded-full overflow-hidden border border-outline-variant/30">
            <!-- Zones -->
            <div class="absolute left-0 top-0 h-full w-[37.5%] bg-error/15"></div>
            <!-- Perfect Zone (37.5% to 62.5%) -->
            <div id="perfect-zone" class="absolute left-[37.5%] top-0 h-full w-[25%] bg-secondary/15 flex items-center justify-center transition-all duration-300">
              <span class="text-[8px] font-bold text-secondary/70">PERFECT</span>
            </div>
            <div class="absolute left-[62.5%] top-0 h-full w-[37.5%] bg-error/15"></div>
            <!-- Needle Pointer -->
            <div id="needle" class="absolute left-0 top-0 h-full w-1 bg-on-surface shadow-[0_0_8px_white] z-30 transform -translate-x-1/2 transition-all duration-75">
              <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-on-surface rotate-45 rounded-sm"></div>
            </div>
          </div>

          <div class="flex justify-between text-[10px] font-label-bold text-on-surface-variant/60 tracking-wider">
            <span>TOO FAST</span>
            <span class="text-secondary/70">IDEAL (3-5s)</span>
            <span>TOO SLOW</span>
          </div>
        </div>

        <!-- Realtime stats summary cards -->
        <div class="grid grid-cols-2 gap-md w-full">
          <div class="bg-surface-container-high p-md rounded-2xl flex items-center gap-md border border-outline-variant/20 shadow-md">
            <div class="p-2 bg-primary/10 rounded-xl">
              <span class="material-symbols-outlined text-primary fill-icon">temp_preferences_custom</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-on-surface-variant uppercase tracking-wider font-label-bold">Efficiency</span>
              <span id="efficiency-stat" class="font-stats-number text-stats-number text-primary transition-all duration-300">0%</span>
            </div>
          </div>
          <div class="bg-surface-container-high p-md rounded-2xl flex items-center gap-md border border-outline-variant/20 shadow-md">
            <div class="p-2 bg-tertiary/10 rounded-xl">
              <span class="material-symbols-outlined text-tertiary fill-icon">award_star</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-on-surface-variant uppercase tracking-wider font-label-bold">Est. Quality</span>
              <span id="quality-stat" class="font-stats-number text-stats-number text-tertiary transition-all duration-300">D</span>
            </div>
          </div>
        </div>

        <!-- Interactive 3D Button Area -->
        <div class="w-full mt-sm">
          <button id="wash-button" class="w-full bg-primary-container text-on-primary-container py-lg rounded-full font-display-lg text-display-lg shadow-[0_8px_0_#984700] active:translate-y-[8px] active:shadow-none transition-all flex items-center justify-center gap-md uppercase tracking-wider cursor-pointer select-none">
            <span class="material-symbols-outlined text-4xl">waves</span>
            HOLD TO WASH
          </button>
        </div>
      </main>

      <!-- Bottom Nav Bar decoration (Mockup style) -->
      <nav class="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-md pb-lg pt-sm bg-surface-container-highest shadow-[0_-4px_12px_rgba(0,0,0,0.4)] rounded-t-xl select-none pointer-events-none opacity-80">
        <div class="flex flex-col items-center justify-center bg-primary-container/20 text-primary rounded-full px-4 py-1">
          <span class="material-symbols-outlined fill-icon">skillet</span>
          <span class="font-label-bold text-label-bold text-xs">Kitchen</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="font-label-bold text-label-bold text-xs">Pantry</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant">
          <span class="material-symbols-outlined">storefront</span>
          <span class="font-label-bold text-label-bold text-xs">Market</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant">
          <span class="material-symbols-outlined">emoji_events</span>
          <span class="font-label-bold text-label-bold text-xs">Scoring</span>
        </div>
      </nav>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // Viewport scaling listener definition
    const resizeOverlay = () => {
      if (!this.overlay) return;
      const canvas = this.sys.game.canvas;
      if (!canvas) return;

      const canvasBounds = canvas.getBoundingClientRect();
      const containerBounds = document.getElementById('game-container').getBoundingClientRect();

      const scale = canvasBounds.width / 480;
      const offsetX = canvasBounds.left - containerBounds.left;
      const offsetY = canvasBounds.top - containerBounds.top;

      this.overlay.style.width = '480px';
      this.overlay.style.height = '854px';
      this.overlay.style.transform = `scale(${scale})`;
      this.overlay.style.transformOrigin = 'top left';
      this.overlay.style.left = `${offsetX}px`;
      this.overlay.style.top = `${offsetY}px`;
    };

    resizeOverlay();
    this.sys.game.scale.on('resize', resizeOverlay);
    this.resizeOverlayRef = resizeOverlay;

    // Cache element references
    this.timerBoxElement = this.overlay.querySelector('#timer-box');
    this.statusTextElement = this.overlay.querySelector('#status-text');
    this.zoneBadgeElement = this.overlay.querySelector('#zone-badge');
    this.needleElement = this.overlay.querySelector('#needle');
    this.perfectZoneBar = this.overlay.querySelector('#perfect-zone');
    this.efficiencyElement = this.overlay.querySelector('#efficiency-stat');
    this.qualityElement = this.overlay.querySelector('#quality-stat');

    // Display hygiene popup modal first
    this.showHygienePopup(data.decisionPopUp);

    // Cleanup events registration
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  showHygienePopup(config) {
    const modal = document.createElement('div');
    modal.id = 'hygiene-modal';
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/60 modal-blur';
    modal.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        <!-- Modal Header -->
        <div class="p-lg border-b border-outline-variant/30 flex flex-col gap-xs text-center">
          <h2 class="font-headline-lg text-headline-lg text-primary uppercase tracking-wider">${config.title}</h2>
          <div class="h-1 w-12 bg-primary mx-auto rounded-full mt-sm"></div>
        </div>
        <!-- Modal Body -->
        <div class="p-lg flex flex-col gap-md">
          <p class="font-body-md text-on-surface-variant text-center leading-relaxed italic text-sm">
            "${config.message}"
          </p>
          
          <!-- Option Buttons -->
          <div class="flex flex-col gap-sm mt-sm">
            ${config.options.map((opt, idx) => `
              <button class="option-btn w-full bg-surface-container-high hover:bg-surface-variant border-2 border-outline-variant/50 hover:border-primary/50 text-left p-md rounded-xl flex items-center gap-md active:scale-98 transition-all cursor-pointer" data-index="${idx}">
                <span class="material-symbols-outlined text-3xl text-primary" style='font-variation-settings: "FILL" 1;'>${idx === 0 ? 'clean_hands' : 'content_cut'}</span>
                <div class="flex flex-col flex-1">
                  <span class="font-label-bold text-xs text-on-surface tracking-wide uppercase font-bold">${opt.label}</span>
                  <span class="text-[10px] text-on-surface-variant mt-1 leading-normal">${opt.message}</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="px-lg pb-lg text-center">
          <span class="text-[10px] font-label-bold text-on-surface-variant/60 uppercase tracking-widest">💡 affects tradition & execution scores</span>
        </div>
      </div>
    `;

    this.overlay.appendChild(modal);

    // Add listeners to decision buttons
    const buttons = modal.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index);
        const opt = config.options[idx];

        // Save selection
        this.game.gameState.chopThenWash = opt.label;
        
        // Push choice score details
        if (opt.scores) {
          this.game.gameState.eventChoices.push({
            id: 'washing_choice',
            choiceObj: { scores: opt.scores }
          });
        }

        // Close modal
        modal.remove();

        // Show choice toast notification
        this.showToast(`${idx === 0 ? '🧼' : '🔪'} ${opt.message}`);

        // Initialize minigame
        this.initWashingMiniGame();
      });
    });
  }

  initWashingMiniGame() {
    // Generate bubbles background loop
    this.bubbleTimer = this.time.addEvent({
      delay: 160,
      callback: () => this.createBubble(),
      loop: true
    });

    // Draw bobbing selected vegetables inside container
    const container = this.overlay.querySelector('#vegetable-container');
    container.innerHTML = '';

    const selectedIngredients = this.game.gameState.selectedIngredients || [];
    const ingredientsData = this.game.gameState.contentPack.ingredients;
    const vegetables = ingredientsData.categories.vegetables?.items.map(i => i.id) || [];

    const chosenVegs = selectedIngredients.filter(id => vegetables.includes(id));
    if (chosenVegs.length === 0) {
      chosenVegs.push('efo_shoko'); // Lagos Spinach fallback
    }

    this.vegBobElements = [];
    chosenVegs.forEach((vegId, index) => {
      const frameKey = VEGETABLE_FRAME_MAP[vegId] || 'EFO_SHOKO';
      const frameName = resolveFrame(frameKey);
      const canvas = createTextureCanvas(this, 'items', frameName);
      if (canvas) {
        canvas.className = 'absolute w-32 h-32 object-contain drop-shadow-2xl transition-all duration-75 select-none pointer-events-none';
        
        // Align and offset canvases horizontally
        const offsetPctX = (index - (chosenVegs.length - 1) / 2) * 26;
        canvas.style.left = `calc(50% - 64px + ${offsetPctX}%)`;
        canvas.style.top = 'calc(50% - 64px)';
        
        container.appendChild(canvas);
        this.vegBobElements.push({
          element: canvas,
          phase: index * 1.6,
          speed: 0.95 + Math.random() * 0.4
        });
      }
    });

    // Set up interactive hold button
    const washBtn = this.overlay.querySelector('#wash-button');
    
    const onPointerDown = (e) => {
      if (e) e.preventDefault();
      if (this.isHolding || this.elapsedTime >= this.maxTime) return;

      this.isHolding = true;
      this.zoneBadgeElement.textContent = 'WASHING...';
      this.zoneBadgeElement.className = 'text-xs font-label-bold text-secondary bg-secondary/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider perfect-zone-glow';
      
      washBtn.innerHTML = `
        <span class="material-symbols-outlined text-4xl animate-spin">waves</span>
        WASHING...
      `;
      washBtn.className = 'w-full bg-secondary-container text-on-secondary-container py-lg rounded-full font-display-lg text-display-lg shadow-none translate-y-[8px] transition-all flex items-center justify-center gap-md uppercase tracking-wider cursor-pointer select-none';
    };

    const onPointerUp = () => {
      if (this.isHolding) {
        this.isHolding = false;
        this.zoneBadgeElement.textContent = 'DONE';
        this.zoneBadgeElement.className = 'text-xs font-label-bold text-on-surface-variant/40 bg-surface-variant/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider';

        washBtn.innerHTML = `
          <span class="material-symbols-outlined text-4xl">check_circle</span>
          FINISHED
        `;
        washBtn.className = 'w-full bg-surface-variant text-on-surface-variant/40 py-lg rounded-full font-display-lg text-display-lg shadow-none translate-y-[8px] transition-all flex items-center justify-center gap-md uppercase tracking-wider select-none pointer-events-none';
        
        this.evaluateOutcome();
      }
    };

    // Store references to deregister later
    this.onPointerDownRef = onPointerDown;
    this.onPointerUpRef = onPointerUp;

    washBtn.addEventListener('pointerdown', onPointerDown);
    washBtn.addEventListener('touchstart', onPointerDown);
    
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
  }

  createBubble() {
    const container = this.overlay ? this.overlay.querySelector('#bubble-container') : null;
    if (!container) return;

    const bubble = document.createElement('div');
    const size = Math.random() * 18 + 6 + 'px';
    bubble.className = 'bubble';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.top = '110%';
    bubble.style.width = size;
    bubble.style.height = size;
    bubble.style.animationDuration = Math.random() * 1.5 + 1.8 + 's';
    bubble.style.opacity = Math.random() * 0.45;

    container.appendChild(bubble);

    // Safe deletion after animation
    this.time.delayedCall(2500, () => {
      if (bubble.parentNode) {
        bubble.remove();
      }
    });
  }

  update(time, delta) {
    // Water bobbing physics for vegetable canvases
    if (this.vegBobElements.length > 0) {
      const bobIntensity = this.isHolding ? 1.6 : 0.45;
      this.vegBobElements.forEach((veg) => {
        const yOffset = Math.sin(time / 200 * veg.speed + veg.phase) * (8 * bobIntensity);
        const rotateAngle = Math.cos(time / 300 * veg.speed + veg.phase) * (6 * bobIntensity);
        veg.element.style.transform = `translateY(${yOffset}px) rotate(${rotateAngle}deg)`;
      });
    }

    if (this.isHolding) {
      this.elapsedTime += delta / 1000;

      // Handle limit cap
      if (this.elapsedTime >= this.maxTime) {
        this.elapsedTime = this.maxTime;
        if (this.onPointerUpRef) this.onPointerUpRef();
      }

      // Update timer textbox
      if (this.timerBoxElement) {
        this.timerBoxElement.textContent = `${this.elapsedTime.toFixed(1)}s`;
      }

      // Precision indicator translation
      if (this.needleElement) {
        const percent = (this.elapsedTime / this.maxTime) * 100;
        this.needleElement.style.left = `${Math.min(100, percent)}%`;
      }

      // Update color variables and badge status in real time
      const isPerfect = this.elapsedTime >= this.optimalStart && this.elapsedTime <= this.optimalEnd;
      if (isPerfect) {
        this.timerBoxElement.className = 'font-stats-number text-stats-number text-secondary bg-secondary-container/20 border border-secondary/40 px-md py-xs rounded-xl transition-all duration-300 perfect-zone-glow';
        this.statusTextElement.textContent = 'Perfect!';
        this.statusTextElement.className = 'font-label-bold text-[10px] text-secondary uppercase tracking-widest block mt-1';
        this.perfectZoneBar.className = 'absolute left-[37.5%] top-0 h-full w-[25%] bg-secondary flex items-center justify-center perfect-zone-glow transition-all duration-200';
        this.perfectZoneBar.querySelector('span').className = 'text-[8px] font-bold text-on-secondary';
      } else if (this.elapsedTime < this.optimalStart) {
        this.timerBoxElement.className = 'font-stats-number text-stats-number text-error bg-error-container/20 border border-error/40 px-md py-xs rounded-xl transition-all duration-300';
        this.statusTextElement.textContent = 'Too Fast';
        this.statusTextElement.className = 'font-label-bold text-[10px] text-error uppercase tracking-widest block mt-1';
        this.perfectZoneBar.className = 'absolute left-[37.5%] top-0 h-full w-[25%] bg-secondary/15 flex items-center justify-center transition-all duration-200';
        this.perfectZoneBar.querySelector('span').className = 'text-[8px] font-bold text-secondary/70';
      } else {
        this.timerBoxElement.className = 'font-stats-number text-stats-number text-primary bg-primary-container/20 border border-primary/40 px-md py-xs rounded-xl transition-all duration-300';
        this.statusTextElement.textContent = 'Too Slow';
        this.statusTextElement.className = 'font-label-bold text-[10px] text-primary uppercase tracking-widest block mt-1';
        this.perfectZoneBar.className = 'absolute left-[37.5%] top-0 h-full w-[25%] bg-secondary/15 flex items-center justify-center transition-all duration-200';
        this.perfectZoneBar.querySelector('span').className = 'text-[8px] font-bold text-secondary/70';
      }

      // Real-time efficiency statistics
      let efficiency = 0;
      if (this.elapsedTime < this.optimalStart) {
        efficiency = Math.round((this.elapsedTime / this.optimalStart) * 94);
      } else if (isPerfect) {
        efficiency = 100;
      } else {
        const overtime = this.elapsedTime - this.optimalEnd;
        const fadeScale = this.maxTime - this.optimalEnd;
        efficiency = Math.max(48, Math.round(100 - (overtime / fadeScale) * 52));
      }
      this.efficiencyElement.textContent = `${efficiency}%`;

      // Real-time Quality grade assessment
      let grade = 'D';
      if (isPerfect) {
        grade = 'S+';
      } else if (this.elapsedTime < this.optimalStart) {
        if (this.elapsedTime >= 2.0) grade = 'C';
        else if (this.elapsedTime >= 1.0) grade = 'D';
        else grade = 'F';
      } else {
        if (this.elapsedTime <= 6.5) grade = 'B';
        else if (this.elapsedTime <= 7.5) grade = 'C';
        else grade = 'F';
      }
      this.qualityElement.textContent = grade;
    }
  }

  evaluateOutcome() {
    const data = this.game.gameState.contentPack.miniGames.washingArea;
    let selectedOutcome = null;

    if (this.elapsedTime >= this.optimalStart && this.elapsedTime <= this.optimalEnd) {
      selectedOutcome = data.outcomes.find(o => o.id === 'perfect');
    } else if (this.elapsedTime < this.optimalStart) {
      selectedOutcome = data.outcomes.find(o => o.id === 'too_fast');
    } else {
      selectedOutcome = data.outcomes.find(o => o.id === 'too_slow');
    }

    this.game.gameState.washingOutcome = selectedOutcome.id;

    // ─── OUTCOME MODAL RENDER ───
    const modal = document.createElement('div');
    modal.id = 'outcome-modal';
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/60 modal-blur';

    const headerColors = {
      perfect: 'text-secondary border-secondary/40 bg-secondary-container/20',
      too_fast: 'text-error border-error/40 bg-error-container/20',
      too_slow: 'text-primary border-primary/40 bg-primary-container/20'
    };

    const headerTitles = {
      perfect: '✨ PERFECT WASH!',
      too_fast: '⚡ TOO FAST!',
      too_slow: '🐢 OVER-SOAKED!'
    };

    modal.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
        <!-- Result image header -->
        <div class="p-lg border-b border-outline-variant/30 flex flex-col gap-md items-center text-center">
          <span class="text-5xl drop-shadow-md select-none">${selectedOutcome.id === 'perfect' ? '🧼' : '😬'}</span>
          <h2 class="font-headline-lg text-headline-lg ${headerColors[selectedOutcome.id].split(' ')[0]} uppercase tracking-wider">${headerTitles[selectedOutcome.id]}</h2>
          <div class="h-1 w-12 bg-primary rounded-full"></div>
        </div>
        <!-- Result breakdown -->
        <div class="p-lg flex flex-col gap-md text-center">
          <div class="flex justify-center gap-sm">
            <span class="font-stats-number text-stats-number text-primary ${headerColors[selectedOutcome.id]} border px-md py-xs rounded-xl">
              ${this.elapsedTime.toFixed(1)}s
            </span>
          </div>
          <p class="font-body-md text-on-surface-variant leading-relaxed text-sm px-sm">
            "${selectedOutcome.message}"
          </p>
          <button id="return-btn" class="w-full bg-primary text-on-primary font-display-lg py-md rounded-xl shadow-[0_4px_0_#984700] hover:shadow-[0_2px_0_#984700] transition-all transform active:translate-y-1 active:shadow-none cursor-pointer uppercase tracking-widest font-bold">
            🗺️ RETURN TO MAP
          </button>
        </div>
      </div>
    `;

    this.overlay.appendChild(modal);

    modal.querySelector('#return-btn').addEventListener('click', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('KitchenMapScene');
      });
    });
  }

  showToast(message) {
    // Remove existing toast if any
    const existing = document.getElementById('toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-surface-container-highest/95 border border-primary/40 text-on-surface px-md py-sm rounded-xl text-center font-label-bold text-xs uppercase tracking-wide shadow-2xl z-[150] animate-in fade-in slide-in-from-bottom duration-300';
    toast.textContent = message;

    this.overlay.appendChild(toast);

    // Auto dismiss
    this.time.delayedCall(3000, () => {
      if (toast.parentNode) {
        toast.remove();
      }
    });
  }

  shutdown() {
    // Safely remove overlay
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Clean up scale events
    if (this.resizeOverlayRef) {
      this.sys.game.scale.off('resize', this.resizeOverlayRef);
      this.resizeOverlayRef = null;
    }

    // Clean up window listeners
    if (this.onPointerUpRef) {
      window.removeEventListener('pointerup', this.onPointerUpRef);
      window.removeEventListener('touchend', this.onPointerUpRef);
      this.onPointerUpRef = null;
    }

    // Clean up Phaser timers
    if (this.bubbleTimer) {
      this.bubbleTimer.destroy();
      this.bubbleTimer = null;
    }
  }
}
