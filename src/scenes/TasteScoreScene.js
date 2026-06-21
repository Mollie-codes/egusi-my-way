// src/scenes/TasteScoreScene.js
// Screen 5: Tasting animation bridge between ServingScene and Results - DOM overlay matching grindegusi.html
import Phaser from 'phaser';
import { showSettingsModal } from '../ui/SettingsModal.js';

function createCharacterSpriteCanvas(scene, frameKey) {
  const texture = scene.textures.get('sprites-cooking');
  if (!texture) return null;
  const frame = texture.get(frameKey);
  if (!frame) return null;
  const cutX = frame.cutX !== undefined ? frame.cutX : frame.x;
  const cutY = frame.cutY !== undefined ? frame.cutY : frame.y;
  const cutWidth = frame.cutWidth || frame.width;
  const cutHeight = frame.cutHeight || frame.height;
  if (!cutWidth || !cutHeight) return null;
  const canvas = document.createElement('canvas');
  canvas.width = cutWidth;
  canvas.height = cutHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(frame.source.image, cutX, cutY, cutWidth, cutHeight, 0, 0, cutWidth, cutHeight);
  return canvas;
}

export class TasteScoreScene extends Phaser.Scene {
  constructor() {
    super('TasteScoreScene');
    this.overlay = null;
    this._resizeHandler = null;
    this._messageInterval = null;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0b14');

    // ─── CREATE DOM OVERLAY ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'taste-score-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>
      <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <!-- Top App Bar -->
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-lg">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Efo Egusi: <span class="text-on-surface-variant">Cooking My Way!</span></h1>
        </div>
        <button id="taste-settings-btn" class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">settings</button>
      </header>

      <main class="relative z-10 flex-1 overflow-y-auto px-container-padding pt-lg pb-32 no-scrollbar flex flex-col items-center">
        <!-- Screen Title Section -->
        <div class="text-center mb-lg">
          <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-primary uppercase tracking-wider mb-xs">The Moment of Truth</h2>
          <p class="font-body-md text-on-surface-variant italic">Time to taste what you've created...</p>
        </div>

        <!-- Hero Bowl Area -->
        <div class="relative w-full max-w-xs aspect-square flex items-center justify-center mb-xl">
          <!-- Steam effects -->
          <div class="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
            <span class="material-symbols-outlined text-on-surface-variant text-4xl steam-effect" style="animation-delay: 0.2s;">cloud</span>
            <span class="material-symbols-outlined text-on-surface-variant text-2xl steam-effect" style="animation-delay: 0.8s;">cloud</span>
            <span class="material-symbols-outlined text-on-surface-variant text-5xl steam-effect" style="animation-delay: 0.5s;">cloud</span>
          </div>

          <!-- Result Bowl Container -->
          <div class="w-64 h-64 glass-panel rounded-full flex items-center justify-center shadow-2xl relative">
            <div class="absolute inset-2 border-2 border-dashed border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div class="w-16 h-16 object-contain drop-shadow-[0_20px_50px_rgba(244,125,32,0.4)] flex items-center justify-center" id="bowl-sprite"></div>
          </div>
        </div>

        <!-- Character Sprite & Status -->
        <div class="flex flex-col items-center gap-md">
          <div class="h-40 overflow-hidden flex items-center justify-center relative">
            <!-- Character Sprite Clipping -->
            <div class="relative w-32 h-32 overflow-hidden rounded-xl border border-primary/10 bg-surface-container-low p-2" id="char-sprite-container"></div>
            <!-- Thinking Bubble -->
            <div class="absolute -top-4 -right-4 bg-primary-container text-on-primary-container rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">restaurant</span>
            </div>
          </div>

          <!-- Status Text -->
          <div class="text-center">
            <div class="inline-flex items-center gap-sm px-lg py-sm bg-surface-container-highest rounded-full shadow-md border border-outline-variant/30">
              <span class="material-symbols-outlined text-secondary animate-spin-slow">pending</span>
              <p class="font-label-bold text-label-bold text-secondary tracking-widest pulsing uppercase" id="status-text">...considering the flavors...</p>
            </div>
          </div>
        </div>
      </main>

      <!-- CTA Button -->
      <div class="absolute bottom-20 left-0 w-full px-container-padding z-40 pointer-events-none">
        <button id="verdict-btn" class="pointer-events-auto w-full h-14 bg-secondary-container text-on-secondary-container font-headline-lg-mobile text-headline-lg-mobile rounded-xl shadow-[0_4px_0px_#003822] active:shadow-none active:translate-y-[4px] transition-all duration-75 uppercase tracking-wide cursor-pointer flex items-center justify-center gap-sm hidden opacity-0" style="visibility: hidden;">
          <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>emoji_events</span>
          SEE THE VERDICT
        </button>
      </div>

      <!-- Bottom Navigation -->
      <nav class="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-md pb-lg pt-sm bg-surface-container-highest shadow-[0_-4px_12px_rgba(0,0,0,0.4)] rounded-t-xl">
        <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg px-4 py-1 cursor-pointer">
          <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>skillet</span>
          <span class="font-label-bold text-[10px]">Kitchen</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="font-label-bold text-[10px]">Pantry</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
          <span class="material-symbols-outlined">storefront</span>
          <span class="font-label-bold text-[10px]">Market</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
          <span class="material-symbols-outlined">emoji_events</span>
          <span class="font-label-bold text-[10px]">Awards</span>
        </div>
      </nav>

      <style>
        @keyframes steam {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.3; }
          50% { transform: translateY(-10px) scaleX(1.1); opacity: 0.6; }
        }
        .steam-effect {
          animation: steam 3s ease-in-out infinite;
        }
        .pulsing {
          animation: pulse-text 1.5s ease-in-out infinite;
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .glass-panel {
          background: rgba(37, 33, 49, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      </style>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // ─── OVERLAY SCALING ───
    this._resizeHandler = () => {
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
    this._resizeHandler();
    this.sys.game.scale.on('resize', this._resizeHandler);

    // ─── RENDER SOUP BOWL ───
    const bowlContainer = this.overlay.querySelector('#bowl-sprite');
    if (this.textures.exists('cooking-states')) {
      const soupCanvas = this.createCookingStateCanvas(this, 'egusi_soup');
      if (soupCanvas) {
        soupCanvas.className = 'w-48 h-48 object-contain';
        bowlContainer.appendChild(soupCanvas);
      }
    } else {
      bowlContainer.innerHTML = '<span class="text-8xl">🍲</span>';
    }

    // ─── RENDER CHARACTER SPRITE ───
    const charContainer = this.overlay.querySelector('#char-sprite-container');
    if (this.textures.exists('sprites-cooking')) {
      const charCanvas = createCharacterSpriteCanvas(this, 'IDLE');
      if (charCanvas) {
        charCanvas.style.width = '100%';
        charCanvas.style.height = '100%';
        charCanvas.style.objectFit = 'contain';
        charContainer.appendChild(charCanvas);
      }
    } else {
      charContainer.innerHTML = '<span class="text-6xl">🧑🏾‍🍳</span>';
    }

    // ─── SETTINGS BUTTON ───
    this.overlay.querySelector('#taste-settings-btn').addEventListener('click', () => {
      showSettingsModal(this);
    });

    // ─── TASTING MESSAGE CYCLE ───
    const messages = [
      '...considering the flavors...',
      '...evaluating seasoning...',
      '...checking texture...',
      '...almost ready...'
    ];
    let msgIndex = 0;
    const statusEl = this.overlay.querySelector('#status-text');

    this._messageInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      statusEl.style.opacity = '0';
      setTimeout(() => {
        statusEl.textContent = messages[msgIndex];
        statusEl.style.opacity = '1';
      }, 300);
    }, 3000);

    // ─── VERDICT BUTTON ───
    const verdictBtn = this.overlay.querySelector('#verdict-btn');
    this.time.delayedCall(6500, () => {
      verdictBtn.style.visibility = 'visible';
      verdictBtn.classList.remove('hidden');
      verdictBtn.classList.add('flex');
      verdictBtn.style.opacity = '0';
      verdictBtn.style.transition = 'opacity 0.5s ease';
      setTimeout(() => { verdictBtn.style.opacity = '1'; }, 50);

      verdictBtn.addEventListener('click', () => {
        verdictBtn.disabled = true;
        this.overlay.style.transition = 'opacity 0.3s ease';
        this.overlay.style.opacity = '0';
        setTimeout(() => {
          this.scene.start('ResultsScene');
        }, 300);
      });
    });

    // ─── AUTO-ADVANCE ───
    this.time.delayedCall(10000, () => {
      if (this.scene.isActive('TasteScoreScene')) {
        this.overlay.style.transition = 'opacity 0.3s ease';
        this.overlay.style.opacity = '0';
        setTimeout(() => {
          this.scene.start('ResultsScene');
        }, 300);
      }
    });

    // ─── CLEANUP ───
    this.events.once('shutdown', () => {
      this.sys.game.scale.off('resize', this._resizeHandler);
      this.shutdown();
    }, this);
    this.events.once('destroy', () => {
      this.sys.game.scale.off('resize', this._resizeHandler);
      this.shutdown();
    }, this);
  }

  createCookingStateCanvas(scene, frameKey) {
    const texture = scene.textures.get('cooking-states');
    if (!texture) return null;
    const frame = texture.get(frameKey);
    if (!frame) return null;
    const cutX = frame.cutX !== undefined ? frame.cutX : frame.x;
    const cutY = frame.cutY !== undefined ? frame.cutY : frame.y;
    const cutWidth = frame.cutWidth || frame.width;
    const cutHeight = frame.cutHeight || frame.height;
    if (!cutWidth || !cutHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = cutWidth;
    canvas.height = cutHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(frame.source.image, cutX, cutY, cutWidth, cutHeight, 0, 0, cutWidth, cutHeight);
    return canvas;
  }

  shutdown() {
    if (this._messageInterval) {
      clearInterval(this._messageInterval);
      this._messageInterval = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
