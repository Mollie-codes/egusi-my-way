// src/scenes/BootScene.js
// Orange-gradient boot/splash screen with logo, waving chef, cycling messages
import Phaser from 'phaser';

function createChefSpriteCanvas(scene, frameName) {
  const texture = scene.textures.get('sprites-cooking');
  if (!texture) return null;
  const frame = texture.get(frameName);
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

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
    this.overlay = null;
    this._resizeHandler = null;
    this._messageInterval = null;
  }

  preload() {
    this.cameras.main.setBackgroundColor('#f47d20');

    this.load.json('game-config', 'content-packs/game-config.json');
    this.load.image('title-logo', 'assets/title-logo.png');
    this.load.atlas('sprites-cooking', 'assets/sprites-cooking.png', 'assets/cooking-sprite.json');
  }

  create() {
    const gameConfig = this.cache.json.get('game-config');
    this.game.gameState.gameConfig = gameConfig;
    this.game.gameState.activePackId = gameConfig.activeContentPack;

    // Load pack-manifest and messages in parallel
    this.load.once('complete', () => {
      this.buildSplashScreen();
    });

    this.load.json('pack-manifest', `content-packs/${gameConfig.activeContentPack}/pack-manifest.json`);
    this.load.json('messages', `content-packs/${gameConfig.activeContentPack}/messages.json`);
    this.load.start();
  }

  buildSplashScreen() {
    const messages = this.cache.json.get('messages');
    const loadingMessages = messages?.loadingScreen || [
      "Somebody's grandmother is already judging your ingredient choices."
    ];

    // ─── CREATE DOM OVERLAY ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'boot-scene-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <main class="relative h-full w-full orange-gradient-bg flex flex-col items-center justify-between py-xl px-container-padding">
        <!-- Dot texture -->
        <div class="absolute inset-0 dot-pattern pointer-events-none opacity-40"></div>

        <!-- Top spacing -->
        <div class="w-full pt-md"></div>

        <!-- Center content -->
        <div class="flex flex-col items-center gap-lg w-full max-w-md relative z-10">
          <!-- Logo -->
          <div class="w-72 transition-transform duration-500" id="boot-logo-container"></div>

          <!-- Chef sprite -->
          <div class="flex items-end justify-center gap-lg mt-sm">
            <div class="w-32 animate-float-boot" id="boot-chef-container"></div>
          </div>

          <!-- Speech bubble -->
          <div class="mt-lg w-full relative">
            <div class="speech-bubble bg-[#fff9f5] border-2 border-primary-container/20 rounded-3xl p-md shadow-xl text-center">
              <p id="boot-message" class="text-primary-container font-body-md font-bold italic opacity-90 leading-snug text-sm">
                "${loadingMessages[0]}"
              </p>
            </div>
          </div>

          <!-- Pagination dots -->
          <div class="flex gap-sm mt-md" id="boot-dots">
            ${loadingMessages.map((_, i) => `
              <div class="w-2 h-2 rounded-full ${i === 0 ? 'w-6 bg-primary-container shadow-sm' : 'bg-on-primary-container/30'} transition-all duration-300"></div>
            `).join('')}
          </div>
        </div>

        <!-- Bottom loading -->
        <div class="w-full max-w-sm flex flex-col items-center gap-sm pb-lg z-10">
          <div class="flex items-center gap-xs">
            <span class="font-label-bold text-label-bold text-on-primary-fixed tracking-widest uppercase">Loading...</span>
            <span class="font-stats-number text-stats-number text-on-primary-fixed" id="boot-percent">0%</span>
          </div>
          <div class="w-full h-5 bg-surface-container-low/40 rounded-full p-1 overflow-hidden backdrop-blur-sm border border-white/10">
            <div class="h-full bg-secondary rounded-full loading-glow relative overflow-hidden transition-all duration-500 ease-out" id="boot-progress" style="width: 0%;">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent shimmer-bar"></div>
            </div>
          </div>
        </div>
      </main>
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

    // ─── RENDER LOGO ───
    const logoContainer = this.overlay.querySelector('#boot-logo-container');
    if (this.textures.exists('title-logo')) {
      const img = document.createElement('img');
      img.src = 'assets/title-logo.png';
      img.className = 'w-full drop-shadow-2xl';
      logoContainer.appendChild(img);
    } else {
      logoContainer.innerHTML = `
        <h2 class="font-display-lg text-display-lg text-on-primary-fixed text-center tracking-tight drop-shadow-lg">EFO EGUSI:</h2>
        <h3 class="font-headline-lg text-headline-lg text-on-primary-fixed text-center drop-shadow-md">COOKING MY WAY!</h3>
      `;
    }

    // ─── RENDER CHEF SPRITE ───
    const chefContainer = this.overlay.querySelector('#boot-chef-container');
    if (this.textures.exists('sprites-cooking')) {
      const chefCanvas = createChefSpriteCanvas(this, 'WAVE');
      if (chefCanvas) {
        chefCanvas.className = 'w-full drop-shadow-xl';
        chefContainer.appendChild(chefCanvas);
      }
    } else {
      chefContainer.innerHTML = '<span class="text-7xl drop-shadow-lg">🧑🏾‍🍳</span>';
    }

    // ─── CYCLE MESSAGES ───
    let msgIdx = 0;
    const messageEl = this.overlay.querySelector('#boot-message');
    const dotsContainer = this.overlay.querySelector('#boot-dots');

    this._messageInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      messageEl.style.opacity = '0';
      messageEl.style.transition = 'opacity 0.3s ease';

      setTimeout(() => {
        messageEl.textContent = `"${loadingMessages[msgIdx]}"`;
        messageEl.style.opacity = '1';

        // Update dots
        const dots = dotsContainer.children;
        for (let i = 0; i < dots.length; i++) {
          if (i === msgIdx) {
            dots[i].className = 'w-6 h-2 rounded-full bg-primary-container shadow-sm transition-all duration-300';
          } else {
            dots[i].className = 'w-2 h-2 rounded-full bg-on-primary-container/30 transition-all duration-300';
          }
        }
      }, 300);
    }, 2500);

    // ─── LOADING PROGRESS (7-8 seconds) ───
    const progressBar = this.overlay.querySelector('#boot-progress');
    const percentText = this.overlay.querySelector('#boot-percent');
    const totalDuration = 7500;
    const startTime = Date.now();

    const updateProgress = () => {
      if (!this.overlay) return;
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));

      progressBar.style.width = `${pct}%`;
      percentText.textContent = `${pct}%`;

      if (pct < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        // Done — transition to LoadingScene
        setTimeout(() => {
          this.overlay.style.transition = 'opacity 0.5s ease';
          this.overlay.style.opacity = '0';
          setTimeout(() => {
            this.scene.start('LoadingScene');
          }, 500);
        }, 400);
      }
    };
    requestAnimationFrame(updateProgress);

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
