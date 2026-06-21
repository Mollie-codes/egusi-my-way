// src/scenes/PrepStationScene.js
// Screen 4b: Prep Station — 2-task sequential mini-games (Slice Vegs → Grind Egusi)
import Phaser from 'phaser';
import { resolveFrame } from '../utils/ItemData.js';
import { showSettingsModal } from '../ui/SettingsModal.js';

const PREP_STAGES = [
  { id: 'slice_vegs', label: 'Slice Vegs', icon: 'content_cut' },
  { id: 'grind_egusi', label: 'Grind Egusi', icon: 'grain' },
];

function createTextureCanvas(scene, textureKey, frameKey) {
  const texture = scene.textures.get(textureKey);
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

export class PrepStationScene extends Phaser.Scene {
  constructor() {
    super('PrepStationScene');
    this.currentTaskIndex = 0;
    this.overlay = null;
    this._resizeHandler = null;
    this._keyHandler = null;

    this.rhythmIndicator = null;
    this.indicatorPos = 0;
    this.indicatorDir = 1;
    this.indicatorSpeed = 0.8;
    this.slicingHits = 0;
    this.slicingAttempts = 0;
    this.slicingNeeded = 5;

    this.grindTaps = 0;
    this.grindNeeded = 10;
  }

  create() {
    this.currentTaskIndex = 0;
    this.slicingHits = 0;
    this.slicingAttempts = 0;
    this.grindTaps = 0;
    this.cameras.main.setBackgroundColor('#0d0b14');

    this.overlay = document.createElement('div');
    this.overlay.id = 'prep-station-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-lg">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">PREP STATION</h1>
        </div>
        <button class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">settings</button>
      </header>
      <main class="flex-1 flex flex-col items-center px-container-padding pt-md pb-28 max-w-md mx-auto w-full relative overflow-y-auto no-scrollbar">
        <div id="prep-content" class="w-full flex flex-col items-center"></div>
      </main>
      <nav class="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-md pb-lg pt-sm bg-surface-container-lowest rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.4)]">
        <div class="flex flex-col items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined">storefront</span><span class="font-label-bold text-label-bold">Market</span></div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined">inventory_2</span><span class="font-label-bold text-label-bold">Pantry</span></div>
        <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg px-4 py-1"><span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>skillet</span><span class="font-label-bold text-label-bold">Kitchen</span></div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined">emoji_events</span><span class="font-label-bold text-label-bold">Scoring</span></div>
      </nav>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

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

    this._keyHandler = (e) => { if (e.code === 'Space') { e.preventDefault(); this.handleAction(); } };
    document.addEventListener('keydown', this._keyHandler);

    this.overlay.querySelector('header button').addEventListener('click', () => showSettingsModal(this));

    this.renderCurrentStage();

    this.events.once('shutdown', () => { this.sys.game.scale.off('resize', this._resizeHandler); document.removeEventListener('keydown', this._keyHandler); this.shutdown(); }, this);
    this.events.once('destroy', () => { this.sys.game.scale.off('resize', this._resizeHandler); document.removeEventListener('keydown', this._keyHandler); this.shutdown(); }, this);
  }

  renderCurrentStage() {
    const content = this.overlay.querySelector('#prep-content');
    content.innerHTML = '';
    this.rhythmIndicator = null;

    const progressPct = this.currentTaskIndex > 0 ? 100 : 0;

    let stepperHTML = `<div class="w-full mb-md"><div class="flex items-center justify-between relative px-xl">
      <div class="absolute top-4 left-0 w-full h-[2px] bg-surface-variant -z-10"></div>
      <div class="absolute top-4 left-0 h-[2px] bg-tertiary -z-10 transition-all duration-500" style="width: ${progressPct}%"></div>`;

    PREP_STAGES.forEach((stage, i) => {
      const isDone = i < this.currentTaskIndex;
      const isActive = i === this.currentTaskIndex;
      let circleClass, labelClass, inner;
      if (isDone) {
        circleClass = 'bg-tertiary text-on-tertiary border-2 border-tertiary';
        labelClass = 'text-tertiary';
        inner = `<span class="material-symbols-outlined text-[18px]" style='font-variation-settings: "FILL" 1;'>check</span>`;
      } else if (isActive) {
        circleClass = 'bg-surface-container-high text-primary border-2 border-primary animate-pulse';
        labelClass = 'text-primary';
        inner = `${i + 1}`;
      } else {
        circleClass = 'bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant';
        labelClass = 'text-on-surface-variant';
        inner = `${i + 1}`;
      }
      stepperHTML += `<div class="flex flex-col items-center gap-xs"><div class="w-8 h-8 rounded-full ${circleClass} flex items-center justify-center font-bold">${inner}</div><span class="font-label-bold text-label-bold ${labelClass}">${stage.label}</span></div>`;
    });

    stepperHTML += '</div></div>';
    content.insertAdjacentHTML('beforeend', stepperHTML);

    if (this.currentTaskIndex === 0) this.renderSlicingStage(content);
    else this.renderGrindingStage(content);
  }

  // ─── STAGE 1: RHYTHM SLICING ───

  renderSlicingStage(container) {
    this.slicingHits = 0;
    this.slicingAttempts = 0;
    this.indicatorPos = 0;
    this.indicatorDir = 1;

    const el = document.createElement('div');
    el.className = 'flex flex-col items-center text-center w-full';
    el.innerHTML = `
      <div class="flex items-center gap-xs mb-xs">
        <span class="material-symbols-outlined text-tertiary" style='font-variation-settings: "FILL" 1;'>content_cut</span>
        <h2 class="font-display-lg text-[28px] text-tertiary uppercase">SLICE VEGS</h2>
      </div>
      <p class="text-on-surface-variant font-label-bold mb-sm text-xs">Tap when the indicator is in the green zone!</p>
      <div class="inline-flex items-center gap-xs bg-surface-container-highest px-md py-xs rounded-full border border-outline-variant mb-md">
        <span class="material-symbols-outlined text-secondary text-sm" style='font-variation-settings: "FILL" 1;'>target</span>
        <span class="font-label-bold text-xs text-secondary uppercase tracking-wider" id="hit-tracker">Hits: 0 / ${this.slicingNeeded}</span>
      </div>
      <div class="relative w-32 h-32 flex items-center justify-center mb-md">
        <div class="absolute inset-0 bg-secondary/10 blur-3xl rounded-full"></div>
        <div class="relative z-10" id="slice-visual"></div>
      </div>
      <div class="w-full mb-sm">
        <div class="text-center mb-xs"><span class="font-label-bold text-xs text-secondary uppercase tracking-wider">HIT ZONE</span></div>
        <div class="relative h-8 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant">
          <div class="absolute h-full bg-secondary/30 border-x-2 border-secondary" style="left: 35%; width: 30%;"></div>
          <div id="rhythm-indicator" class="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg z-10" style="left: 0%;"></div>
        </div>
      </div>
      <div id="chop-feedback" class="h-5 font-label-bold text-sm"></div>
      <button id="action-btn" class="group relative w-full max-w-[260px] bg-primary-container text-on-primary-container font-headline-lg-mobile py-md rounded-full shadow-[0_6px_0_0_#984700] active:shadow-none active:translate-y-[6px] transition-all duration-75 flex items-center justify-center gap-md cursor-pointer mt-4">
        <span class="material-symbols-outlined text-2xl" style='font-variation-settings: "FILL" 1;'>content_cut</span>
        <span class="uppercase">CHOP!</span>
      </button>
      <div class="mt-sm flex items-center gap-xs text-on-surface-variant opacity-80">
        <span class="material-symbols-outlined text-tertiary text-sm">lightbulb</span>
        <p class="font-label-bold text-[11px]">Press SPACE or tap the button in rhythm!</p>
      </div>
    `;

    container.appendChild(el);
    this.rhythmIndicator = el.querySelector('#rhythm-indicator');

    const visual = el.querySelector('#slice-visual');
    if (!this.game.gameState.emojiMode && this.textures.exists('items')) {
      const canvas = createTextureCanvas(this, 'items', resolveFrame('KNIFE'));
      if (canvas) {
        canvas.className = 'w-16 h-16 object-contain drop-shadow-2xl';
        canvas.id = 'stage-asset';
        visual.appendChild(canvas);
        return el.querySelector('#action-btn').addEventListener('click', () => this.doChop());
      }
    }
    visual.innerHTML = '<span id="stage-asset" class="material-symbols-outlined text-5xl text-secondary" style=\'font-variation-settings: "FILL" 1;\'>content_cut</span>';
    el.querySelector('#action-btn').addEventListener('click', () => this.doChop());
  }

  doChop() {
    if (document.getElementById('prep-result-modal')) return;
    if (this.slicingHits >= this.slicingNeeded) return;

    this.slicingAttempts++;
    const isHit = this.indicatorPos >= 35 && this.indicatorPos <= 65;
    const feedback = this.overlay.querySelector('#chop-feedback');
    const tracker = this.overlay.querySelector('#hit-tracker');
    const asset = this.overlay.querySelector('#stage-asset');

    if (isHit) {
      this.slicingHits++;
      tracker.textContent = `Hits: ${this.slicingHits} / ${this.slicingNeeded}`;
      feedback.textContent = 'NICE CUT!';
      feedback.className = 'h-5 mb-xs font-label-bold text-sm text-secondary';
      if (asset) { asset.style.transition = 'transform 0.1s'; asset.style.transform = 'scale(1.2) rotate(10deg)'; setTimeout(() => { asset.style.transform = ''; }, 100); }

      if (this.slicingHits >= this.slicingNeeded) {
        const accuracy = Math.round((this.slicingHits / this.slicingAttempts) * 100);
        let perfMsg, perfLevel;
        if (accuracy >= 80) { perfMsg = 'Uniform cuts. Masterful knife work.'; perfLevel = 'perfect'; }
        else if (accuracy >= 50) { perfMsg = 'Decent cuts, but some pieces are uneven. Room for improvement.'; perfLevel = 'good'; }
        else { perfMsg = "Those chunks are... aggressively rustic. Your grandma would have words."; perfLevel = 'poor'; }
        this.game.gameState.slicingPerformance = perfLevel;
        this.showTaskResult('SLICING COMPLETE!', `${perfMsg}\n\nAccuracy: ${accuracy}%`, 'check_circle');
      }
    } else {
      feedback.textContent = 'MISSED!';
      feedback.className = 'h-5 mb-xs font-label-bold text-sm text-error';
    }
    setTimeout(() => { if (feedback) feedback.textContent = ''; }, 500);
  }

  // ─── STAGE 2: GRINDING ───

  renderGrindingStage(container) {
    this.grindTaps = 0;
    this.rhythmIndicator = null;

    const isBlender = this.game.gameState.selectedUtensils.includes('blender');
    const data = this.game.gameState.contentPack.miniGames.prepArea;
    const toolKey = isBlender ? 'blender' : 'mortar_pestle';
    this._grindConfig = data.tasks[1].dependsOnTool[toolKey];
    this.grindNeeded = this._grindConfig.requiredTaps;

    const subtitle = isBlender ? 'Tap fast to blend!' : 'Pound the pestle to crush!';
    const toolLabel = isBlender ? 'Blender (Easy Mode)' : 'Mortar & Pestle (Hard Mode)';
    const toolIcon = isBlender ? 'bolt' : 'hardware';
    const actionLabel = isBlender ? 'BLEND' : 'POUND';
    const spriteFrame = isBlender ? 'BLENDER' : 'MORTAR';

    const el = document.createElement('div');
    el.className = 'flex flex-col items-center text-center w-full';
    el.innerHTML = `
      <div class="flex items-center gap-xs mb-xs">
        <span class="material-symbols-outlined text-tertiary" style='font-variation-settings: "FILL" 1;'>grain</span>
        <h2 class="font-display-lg text-[28px] text-tertiary uppercase">GRIND EGUSI</h2>
      </div>
      <p class="text-on-surface-variant font-label-bold mb-sm text-xs">${subtitle}</p>
      <div class="inline-flex items-center gap-xs bg-surface-container-highest px-md py-xs rounded-full border border-outline-variant mb-md">
        <span class="material-symbols-outlined text-primary text-sm">${toolIcon}</span>
        <span class="font-label-bold text-xs text-primary uppercase tracking-wider">${toolLabel}</span>
      </div>
      <div class="relative w-40 h-40 flex items-center justify-center mb-md">
        <div class="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
        <div class="relative z-10" id="grind-visual"></div>
        <div class="absolute inset-0 pointer-events-none" id="particle-container"></div>
      </div>
      <div class="w-full mb-sm">
        <div class="flex justify-between items-end mb-xs">
          <span class="font-label-bold text-on-surface text-xs">Progress: <span class="text-primary" id="progress-text">0%</span></span>
          <span class="font-label-bold text-on-surface-variant text-[11px]" id="tap-count">0 / ${this.grindNeeded} taps</span>
        </div>
        <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant">
          <div class="h-full bg-primary-container progress-glow transition-all duration-300" id="progress-bar" style="width: 0%;"></div>
        </div>
      </div>
      <button id="action-btn" class="group relative w-full max-w-[260px] bg-primary-container text-on-primary-container font-headline-lg-mobile py-md rounded-full shadow-[0_6px_0_0_#984700] active:shadow-none active:translate-y-[6px] transition-all duration-75 flex items-center justify-center gap-md cursor-pointer mt-4">
        <span class="material-symbols-outlined text-2xl" style='font-variation-settings: "FILL" 1;'>${toolIcon}</span>
        <span class="uppercase">${actionLabel}</span>
      </button>
      <div class="mt-sm flex items-center gap-xs text-on-surface-variant opacity-80">
        <span class="material-symbols-outlined text-tertiary text-sm">lightbulb</span>
        <p class="font-label-bold text-[11px]">${isBlender ? 'Tap fast! But beware of NEPA...' : 'Each pound counts. Keep going!'}</p>
      </div>
    `;

    container.appendChild(el);

    const visual = el.querySelector('#grind-visual');
    if (!this.game.gameState.emojiMode && this.textures.exists('items')) {
      const canvas = createTextureCanvas(this, 'items', resolveFrame(spriteFrame));
      if (canvas) { canvas.className = 'w-20 h-20 object-contain drop-shadow-2xl'; canvas.id = 'stage-asset'; visual.appendChild(canvas); }
    }
    if (!visual.querySelector('#stage-asset')) {
      visual.innerHTML = `<span id="stage-asset" class="material-symbols-outlined text-5xl text-primary" style='font-variation-settings: "FILL" 1;'>${toolIcon}</span>`;
    }
    el.querySelector('#action-btn').addEventListener('click', () => this.doGrind());
  }

  doGrind() {
    if (document.getElementById('prep-result-modal')) return;
    if (this.grindTaps >= this.grindNeeded) return;

    this.grindTaps++;
    const pct = Math.min(100, Math.round((this.grindTaps / this.grindNeeded) * 100));
    const bar = this.overlay.querySelector('#progress-bar');
    const pctText = this.overlay.querySelector('#progress-text');
    const tapText = this.overlay.querySelector('#tap-count');
    const asset = this.overlay.querySelector('#stage-asset');
    const btn = this.overlay.querySelector('#action-btn');

    bar.style.width = `${pct}%`;
    pctText.textContent = `${pct}%`;
    tapText.textContent = `${this.grindTaps} / ${this.grindNeeded} taps`;

    if (asset) { asset.classList.add('pestle-pounding'); setTimeout(() => asset.classList.remove('pestle-pounding'), 200); }
    this.createParticles();
    if (navigator.vibrate) navigator.vibrate(20);

    if (this.grindTaps >= this.grindNeeded) {
      btn.disabled = true;
      btn.classList.replace('bg-primary-container', 'bg-secondary-container');
      btn.style.boxShadow = '0 6px 0 0 #003822';
      btn.innerHTML = `<span class="material-symbols-outlined text-2xl" style='font-variation-settings: "FILL" 1;'>task_alt</span><span class="uppercase">DONE!</span>`;
      setTimeout(() => this.showTaskResult('GRINDING COMPLETE!', this._grindConfig.perfectMessage, 'check_circle'), 400);
    }
  }

  createParticles() {
    const container = this.overlay.querySelector('#particle-container');
    if (!container) return;
    for (let i = 0; i < 4; i++) {
      const p = document.createElement('div');
      p.className = 'absolute w-2 h-2 bg-primary rounded-full pointer-events-none';
      p.style.left = '50%'; p.style.top = '50%';
      container.appendChild(p);
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      let x = 0, y = 0, opacity = 1;
      const tick = () => { x += Math.cos(angle) * speed; y += Math.sin(angle) * speed; opacity -= 0.03; p.style.transform = `translate(${x}px, ${y}px)`; p.style.opacity = opacity; if (opacity > 0) requestAnimationFrame(tick); else p.remove(); };
      tick();
    }
  }

  handleAction() {
    if (document.getElementById('prep-result-modal')) return;
    if (this.currentTaskIndex === 0) this.doChop();
    else this.doGrind();
  }

  showTaskResult(title, message, icon) {
    const existing = document.getElementById('prep-result-modal');
    if (existing) existing.remove();

    const isLast = this.currentTaskIndex >= PREP_STAGES.length - 1;
    const nextLabel = isLast ? 'RETURN TO MAP' : `NEXT: ${PREP_STAGES[this.currentTaskIndex + 1].label.toUpperCase()} →`;
    const nextIcon = isLast ? 'map' : 'arrow_forward';

    const modal = document.createElement('div');
    modal.id = 'prep-result-modal';
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/80 modal-blur';
    modal.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container border border-secondary rounded-2xl shadow-2xl p-md text-center">
        <div class="flex items-center justify-center gap-sm mb-sm">
          <span class="material-symbols-outlined text-3xl text-secondary" style='font-variation-settings: "FILL" 1;'>${icon}</span>
          <h2 class="font-headline-lg text-headline-lg-mobile text-secondary">${title}</h2>
        </div>
        <p class="text-on-surface font-body-md text-sm mb-lg leading-relaxed whitespace-pre-line">${message}</p>
        <button id="prep-result-ok" class="w-full h-12 bg-primary-container text-on-primary-container font-label-bold rounded-xl shadow-[0_3px_0_#743500] active:shadow-none active:translate-y-[3px] transition-all uppercase tracking-widest cursor-pointer flex items-center justify-center gap-sm">
          <span class="material-symbols-outlined">${nextIcon}</span> ${nextLabel}
        </button>
      </div>
    `;
    this.overlay.appendChild(modal);
    modal.querySelector('#prep-result-ok').addEventListener('click', () => {
      modal.remove();
      this.currentTaskIndex++;
      if (this.currentTaskIndex >= PREP_STAGES.length) {
        this.game.gameState.grindingPerformance = 'completed';
        this.overlay.style.transition = 'opacity 0.3s ease';
        this.overlay.style.opacity = '0';
        setTimeout(() => this.scene.start('KitchenMapScene'), 300);
      } else {
        this.renderCurrentStage();
      }
    });
  }

  update() {
    if (this.currentTaskIndex === 0 && this.rhythmIndicator) {
      this.indicatorPos += this.indicatorSpeed * this.indicatorDir;
      if (this.indicatorPos >= 95) { this.indicatorPos = 95; this.indicatorDir = -1; }
      if (this.indicatorPos <= 0) { this.indicatorPos = 0; this.indicatorDir = 1; }
      this.rhythmIndicator.style.left = `calc(${this.indicatorPos}% - 10px)`;
    }
  }

  shutdown() {
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    this.rhythmIndicator = null;
    const modal = document.getElementById('prep-result-modal');
    if (modal) modal.remove();
  }
}
