// src/scenes/LoadingScene.js
// Dark-themed loading & title screen — DOM overlay with global card styling
import Phaser from 'phaser';
import { COLORS, HEX, FONTS, CANVAS } from '../ui/theme.js';
import { showSettingsModal, initMusic } from '../ui/SettingsModal.js';

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super('LoadingScene');
    this.overlay = null;
    this._resizeHandler = null;
  }

  preload() {
    const activePack = this.game.gameState.activePackId;

    // Load content pack data
    this.load.json('ingredients', `content-packs/${activePack}/ingredients.json`);
    this.load.json('utensils', `content-packs/${activePack}/utensils.json`);
    this.load.json('recipe-sequences', `content-packs/${activePack}/recipe-sequences.json`);
    this.load.json('mini-games', `content-packs/${activePack}/mini-games.json`);
    this.load.json('random-events', `content-packs/${activePack}/random-events.json`);
    this.load.json('judges', `content-packs/${activePack}/judges.json`);
    this.load.json('verdicts', `content-packs/${activePack}/verdicts.json`);
    this.load.json('messages', `content-packs/${activePack}/messages.json`);
  }

  create() {
    const manifest = this.cache.json.get('pack-manifest');
    const gameConfig = this.game.gameState.gameConfig;

    this.game.gameState.contentPack = {
      manifest: this.cache.json.get('pack-manifest'),
      ingredients: this.cache.json.get('ingredients'),
      utensils: this.cache.json.get('utensils'),
      recipeSequences: this.cache.json.get('recipe-sequences'),
      miniGames: this.cache.json.get('mini-games'),
      randomEvents: this.cache.json.get('random-events'),
      judges: this.cache.json.get('judges'),
      verdicts: this.cache.json.get('verdicts'),
      messages: this.cache.json.get('messages'),
    };

    this.cameras.main.setBackgroundColor('#0d0b14');

    const originLabel = manifest?.culturalContext?.origin || 'Yoruba, SW Nigeria';
    const diff = manifest?.culturalContext?.difficulty || 3;
    const stars = '⭐'.repeat(diff);
    const fact = manifest
      ? Phaser.Utils.Array.GetRandom(manifest.culturalContext.controversialFacts)
      : 'Some add ogiri (fermented locust beans), others consider it an abomination.';

    // Scoring criteria
    const criteria = gameConfig.scoringCriteria || [];
    const criteriaIcons = { tradition: 'history_edu', creativity: 'palette', efficiency: 'timer', execution: 'construction' };
    const criteriaColors = { tradition: 'text-secondary', creativity: 'text-tertiary', efficiency: 'text-error', execution: 'text-primary' };
    const criteriaBgColors = { tradition: 'bg-secondary', creativity: 'bg-tertiary', efficiency: 'bg-error', execution: 'bg-primary' };

    let criteriaHTML = criteria.map(c => {
      const icon = criteriaIcons[c.id] || 'star';
      const color = criteriaColors[c.id] || 'text-primary';
      const barBg = criteriaBgColors[c.id] || 'bg-primary';
      const pct = Math.round(c.weight * 100);
      return `
        <div class="flex flex-col gap-1">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-sm ${color}" style='font-variation-settings: "FILL" 1;'>${icon}</span>
              <span class="font-label-bold text-[11px] ${color}">${c.label}</span>
            </div>
            <span class="font-stats-number text-[11px] ${color}">${pct}%</span>
          </div>
          <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div class="h-full ${barBg} rounded-full" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');

    // ─── CREATE DOM OVERLAY ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'loading-scene-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>
      <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <!-- Top App Bar -->
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-sm">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Efo Egusi: <span class="text-on-surface-variant">Cooking My Way!</span></h1>
        </div>
        <button id="loading-settings-btn" class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">settings</button>
      </header>

      <main class="relative z-10 flex-1 overflow-y-auto px-container-padding pt-md pb-32 no-scrollbar flex flex-col items-center">
        <!-- Logo -->
        <div class="mb-md flex flex-col items-center">
          <div id="logo-container" class="mb-sm"></div>
        </div>

        <!-- Origin + Difficulty Pills -->
        <div class="flex gap-sm w-full mb-md">
          <div class="game-card flex-1 flex-row gap-sm" style="flex-direction: row; padding: 10px 12px; text-align: left;">
            <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>public</span>
            <div class="flex flex-col">
              <span class="font-label-bold text-[9px] text-on-surface-variant uppercase tracking-wider">Origin</span>
              <span class="font-label-bold text-[12px] text-on-surface">${originLabel}</span>
            </div>
          </div>
          <div class="game-card flex-1 flex-row gap-sm" style="flex-direction: row; padding: 10px 12px; text-align: left;">
            <span class="material-symbols-outlined text-error" style='font-variation-settings: "FILL" 1;'>local_fire_department</span>
            <div class="flex flex-col">
              <span class="font-label-bold text-[9px] text-on-surface-variant uppercase tracking-wider">Difficulty</span>
              <span class="text-[12px]">${stars}</span>
            </div>
          </div>
        </div>

        <!-- Scoring Criteria Card -->
        <div class="game-card w-full mb-md" style="text-align: left; align-items: stretch;">
          <div class="flex items-center gap-xs mb-sm">
            <span class="material-symbols-outlined text-secondary text-[16px]" style='font-variation-settings: "FILL" 1;'>emoji_events</span>
            <span class="font-label-bold text-[11px] text-secondary uppercase tracking-wider">Scoring Criteria</span>
          </div>
          <div class="grid grid-cols-2 gap-sm">
            ${criteriaHTML}
          </div>
        </div>

        <!-- Cultural Context Card -->
        <div class="game-card w-full mb-md" style="text-align: left; align-items: stretch;">
          <div class="flex items-center gap-xs mb-xs">
            <span class="material-symbols-outlined text-tertiary text-[16px]" style='font-variation-settings: "FILL" 1;'>lightbulb</span>
            <span class="font-label-bold text-[9px] text-on-surface-variant uppercase tracking-wider">Cultural Context</span>
          </div>
          <p class="text-[13px] text-on-surface leading-relaxed">${fact}</p>
        </div>

        <!-- Low-Bandwidth Toggle -->
        <div class="game-card w-full mb-md flex-row justify-between" style="flex-direction: row; padding: 12px 16px;">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-tertiary" style='font-variation-settings: "FILL" 1;'>bolt</span>
            <div class="flex flex-col">
              <span class="font-label-bold text-[13px] text-on-surface">Low-Bandwidth Mode</span>
              <span class="text-[11px] text-on-surface-variant">Emoji-only UI, instant loading</span>
            </div>
          </div>
          <button id="emoji-toggle" class="w-11 h-6 rounded-full bg-surface-variant flex items-center px-0.5 transition-colors cursor-pointer">
            <div id="emoji-knob" class="w-5 h-5 rounded-full bg-white shadow transition-transform translate-x-0"></div>
          </button>
        </div>
      </main>

      <!-- Progress / Start Button Area -->
      <div class="absolute bottom-0 left-0 w-full z-40 px-container-padding pb-lg pt-md bg-gradient-to-t from-surface-dim via-surface-dim to-transparent flex flex-col items-center gap-sm">
        <div id="progress-area" class="w-full flex flex-col items-center gap-xs">
          <span id="progress-label" class="font-label-bold text-[11px] text-on-surface-variant uppercase tracking-wider">Loading...</span>
          <div class="h-3 w-full max-w-sm bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant">
            <div id="progress-bar" class="h-full bg-secondary rounded-full transition-all duration-200" style="width: 0%;"></div>
          </div>
        </div>
        <button id="start-btn" class="hidden w-full max-w-sm h-14 bg-secondary-container text-on-secondary-container font-headline-lg-mobile text-headline-lg-mobile rounded-xl shadow-[0_4px_0px_#003822] active:shadow-none active:translate-y-[4px] transition-all duration-75 uppercase tracking-wide cursor-pointer flex items-center justify-center gap-sm">
          <span class="material-symbols-outlined">skillet</span>
          START COOKING
        </button>
        <p class="text-on-surface-variant font-body-md text-[13px] opacity-60 text-center">A tribute to Nigerian culinary traditions 🇳🇬</p>
      </div>
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
    const logoContainer = this.overlay.querySelector('#logo-container');
    if (this.textures.exists('title-logo')) {
      const img = document.createElement('img');
      img.src = 'assets/title-logo.png';
      img.className = 'w-[300px] h-auto object-contain drop-shadow-2xl';
      logoContainer.appendChild(img);
    } else {
      logoContainer.innerHTML = `
        <h2 class="font-display-lg text-display-lg text-primary text-center tracking-tight">EFO EGUSI:</h2>
        <h3 class="font-headline-lg text-headline-lg text-primary text-center">COOKING MY WAY!</h3>
      `;
    }

    // ─── EMOJI TOGGLE ───
    let emojiMode = this.game.gameState.emojiMode || false;
    const toggle = this.overlay.querySelector('#emoji-toggle');
    const knob = this.overlay.querySelector('#emoji-knob');
    const updateToggle = () => {
      if (emojiMode) {
        toggle.classList.replace('bg-surface-variant', 'bg-secondary');
        knob.classList.add('translate-x-5');
        knob.classList.remove('translate-x-0');
      } else {
        toggle.classList.replace('bg-secondary', 'bg-surface-variant');
        knob.classList.add('translate-x-0');
        knob.classList.remove('translate-x-5');
      }
    };
    updateToggle();
    toggle.addEventListener('click', () => {
      emojiMode = !emojiMode;
      this.game.gameState.emojiMode = emojiMode;
      updateToggle();
    });

    // ─── SETTINGS ───
    this.overlay.querySelector('#loading-settings-btn').addEventListener('click', () => {
      showSettingsModal(this);
    });

    // ─── SHOW START BUTTON ───
    this.time.delayedCall(400, () => this.showStartButton());

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

  showStartButton() {
    const progressArea = this.overlay.querySelector('#progress-area');
    const startBtn = this.overlay.querySelector('#start-btn');

    progressArea.classList.add('hidden');
    startBtn.classList.remove('hidden');
    startBtn.classList.add('flex');

    startBtn.addEventListener('click', () => {
      startBtn.disabled = true;

      if (this.game.gameState.emojiMode) {
        this.overlay.style.transition = 'opacity 0.3s ease';
        this.overlay.style.opacity = '0';
        setTimeout(() => {
          initMusic(this);
          this.scene.start('IngredientSelectionScene');
        }, 300);
      } else {
        startBtn.innerHTML = `
          <span class="material-symbols-outlined animate-spin">progress_activity</span>
          LOADING SPRITES...
        `;

        this.load.on('progress', (value) => {
          startBtn.innerHTML = `
            <span class="material-symbols-outlined animate-spin">progress_activity</span>
            LOADING... ${Math.round(value * 100)}%
          `;
        });

        this.load.on('complete', () => {
          startBtn.innerHTML = `
            <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>check_circle</span>
            READY!
          `;
          this.time.delayedCall(300, () => {
            this.overlay.style.transition = 'opacity 0.3s ease';
            this.overlay.style.opacity = '0';
            setTimeout(() => {
              initMusic(this);
              this.scene.start('IngredientSelectionScene');
            }, 300);
          });
        });

        this.load.spritesheet('sprites-basic', 'assets/sprites-basic.png', { frameWidth: 256, frameHeight: 384 });
        this.load.atlas('sprites-cooking', 'assets/sprites-cooking.png', 'assets/cooking-sprite.json');
        this.load.atlas('items', 'assets/items-sprite.png', 'assets/items-sprite.json');
        this.load.atlas('grandma-judge-sprite', 'assets/grandma-judge-sprite.png', 'assets/grandma-judge-sprite.json');
        this.load.atlas('food_blogger-judge-sprite', 'assets/food_blogger-judge-sprite.png', 'assets/food_blogger-judge-sprite.json');
        this.load.atlas('hungry_student-judge-sprite', 'assets/hungry_student-judge-sprite.png', 'assets/hungry_student-judge-sprite.json');
        this.load.atlas('restaurant_owner-judge-sprite', 'assets/restaurant_owner-judge-sprite.png', 'assets/restaurant_owner-judge-sprite.json');
        this.load.atlas('cooking-states', 'assets/cooking-state-sprite.png', 'assets/cooking-state-map.json');
        this.load.image('scorecard-gold', 'assets/scorecard-gold.png');
        this.load.image('scorecard-modern', 'assets/scorecard-modern.png');
        this.load.image('scorecard-chaotic', 'assets/scorecard-chaotic.png');
        this.load.image('cta-promo', 'assets/cta-promo.png');
        this.load.start();
      }
    });
  }

  shutdown() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    const settings = document.getElementById('settings-modal');
    if (settings) settings.remove();
  }
}
