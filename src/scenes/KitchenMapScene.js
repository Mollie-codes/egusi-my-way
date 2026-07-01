// src/scenes/KitchenMapScene.js
// Screen 4: Kitchen Hub — Top-down navigation to stations
import Phaser from 'phaser';
import { resolveFrame } from '../utils/ItemData.js';
import { showSettingsModal, toggleMusic, isMusicEnabled } from '../ui/SettingsModal.js';

const INGREDIENT_FRAME_MAP = {
  egusi: 'EGUSI_SEEDS', egusi_seeds: 'EGUSI_SEEDS', ground_egusi: 'GROUND_EGUSI',
  palm_oil: 'PALM_OIL_BOTTLE', onions: 'ONIONS_WHOLE', pepper: 'SCOTCH_BONNET',
  scotch_bonnet: 'SCOTCH_BONNET', tomatoes: 'TOMATOES_FRESH', tomato_paste: 'TOMATO_PASTE',
  locust_beans: 'LOCUST_BEANS', goat_meat: 'GOAT_MEAT', cow_meat: 'COW_MEAT',
  chicken: 'CHICKEN', turkey: 'TURKEY', fresh_fish: 'FRESH_FISH', stockfish: 'STOCKFISH',
  dried_fish: 'DRIED_FISH', cow_skin: 'COW_SKIN', snail: 'SNAIL', shaki: 'SHAKI',
  efo_shoko: 'EFO_SHOKO', spinach: 'SPINACH', bitter_leaf: 'BITTER_LEAF', ugwu: 'UGWU',
  water_leaf: 'WATER_LEAF', scent_leaf: 'SCENT_LEAF', okra: 'OKRA', bell_pepper: 'BELL_PEPPER',
  crayfish: 'CRAYFISH_GROUND', crayfish_ground: 'CRAYFISH_GROUND', crayfish_whole: 'CRAYFISH_WHOLE',
  seasoning_cubes: 'SEASONING_CUBES', salt: 'SALT', dry_pepper: 'DRY_PEPPER',
  curry_powder: 'CURRY_POWDER', ogiri: 'OGIRI', cameroon_pepper: 'CAMEROON_PEPPER',
  mushrooms: 'MUSHROOMS', sweet_corn: 'SWEET_CORN', green_peas: 'GREEN_PEAS',
  potatoes: 'POTATOES', plantain: 'PLANTAIN', butter: 'BUTTER', cheese: 'CHEESE',
  honey: 'HONEY', hot_sauce: 'HOT_SAUCE', feta_cheese: 'FETA_CHEESE',
  mystery_paste: 'MYSTERY_PASTE', tabasco: 'TABASCO', pickled_pepper: 'PICKLED_PEPPER',
  carrots: 'CARROTS', green_beans: 'GREEN_BEANS',
};

const STATION_ICONS = {
  washing_area: 'water_drop',
  prep_station: 'skillet',
  cooking_stove: 'cooking',
  serving_counter: 'restaurant',
};

const STATION_LABELS = {
  washing_area: 'Wash',
  prep_station: 'Prep',
  cooking_stove: 'Cook',
  serving_counter: 'Serve',
};

const MODERN_ZONES = {
  washing_area:    { left: '77%', top: '31%', width: '16%', height: '27%' },
  prep_station:    { left: '3%',  top: '54%', width: '44%', height: '18%' },
  cooking_stove:   { left: '19%', top: '20%', width: '14%', height: '19%' },
  serving_counter: { left: '56%', top: '72%', width: '25%', height: '25%' },
};

const TRADITIONAL_ZONES = {
  washing_area:    { left: '10%', top: '15%', width: '28%', height: '20%' },
  prep_station:    { left: '10%', top: '50%', width: '15%', height: '25%' },
  cooking_stove:   { left: '60%', top: '22%', width: '28%', height: '18%' },
  serving_counter: { left: '60%', top: '58%', width: '30%', height: '25%' },
};

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

export class KitchenMapScene extends Phaser.Scene {
  constructor() {
    super('KitchenMapScene');
    this.overlay = null;
    this._resizeHandler = null;
    this.chefElement = null;
    this.chefPosPercent = { x: 50, y: 50 };
    this.isMoving = false;
  }

  create() {
    const state = this.game.gameState;
    const isCharcoal = state.selectedUtensils.includes('charcoal_stove');
    this.isTraditional = isCharcoal;
    this.cameras.main.setBackgroundColor('#0d0b14');

    // Build guide text
    let guideText = 'Go to the <span class="text-primary font-bold">Washing Area</span> to prepare vegetables.';
    if (state.washingOutcome && !state.grindingPerformance) {
      guideText = 'Head to the <span class="text-primary font-bold">Prep Station</span> to chop and grind ingredients.';
    } else if (state.washingOutcome && state.grindingPerformance && state.cookingSequence.length === 0) {
      guideText = 'Proceed to the <span class="text-primary font-bold">Cooking Stove</span> to start cooking.';
    } else if (state.cookingSequence.length > 0) {
      guideText = 'Take the pot to the <span class="text-primary font-bold">Serving Counter</span> for judging!';
    }

    // Progress steps
    const steps = [
      { id: 'washing_area', label: 'Wash', icon: 'water_drop', done: !!state.washingOutcome },
      { id: 'prep_station', label: 'Prep', icon: 'skillet', done: !!state.grindingPerformance },
      { id: 'cooking_stove', label: 'Cook', icon: 'cooking', done: state.cookingSequence.length > 0 },
      { id: 'serving_counter', label: 'Serve', icon: 'restaurant', done: false },
    ];
    const completed = steps.filter(s => s.done).length;
    const activeIdx = steps.findIndex(s => !s.done);

    const mapImage = isCharcoal ? 'assets/traditional_kitchen_map.png' : 'assets/modern_kitchen_map.png';

    // ─── CREATE DOM OVERLAY ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'kitchen-map-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>

      <!-- Top App Bar -->
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-lg">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight uppercase">Kitchen Area</h1>
        </div>
        <div class="flex items-center gap-xs">
          <button id="kitchen-music-btn" class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">music_note</button>
          <button id="kitchen-settings-btn" class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">settings</button>
        </div>
      </header>

      <main class="relative z-10 flex-1 overflow-y-auto px-container-padding pb-32 no-scrollbar">
        <!-- Progress Stepper -->
        <section class="mt-md bg-surface-container-low rounded-xl p-md flex flex-col gap-sm">
          <div class="flex justify-between items-center">
            <span class="font-label-bold text-label-bold text-secondary uppercase tracking-widest">Cooking Phase</span>
            <span class="font-stats-number text-stats-number text-primary">${completed}/4</span>
          </div>
          <div class="flex justify-between items-center relative py-sm">
            <div class="absolute top-1/2 left-0 w-full h-1 bg-surface-container-highest -translate-y-1/2 z-0"></div>
            ${steps.map((step, i) => {
              const isActive = i === activeIdx;
              const bgClass = step.done
                ? 'bg-secondary-container text-secondary border-2 border-secondary shadow-lg'
                : isActive
                  ? 'bg-primary-container text-on-primary-container border-2 border-primary shadow-lg'
                  : 'bg-surface-container-highest text-on-surface-variant border-2 border-outline-variant';
              const labelClass = step.done ? 'text-secondary' : isActive ? 'text-primary' : 'text-on-surface-variant';
              const wiggle = isActive ? 'icon-wiggle' : '';
              return `
                <div class="flex flex-col items-center gap-xs z-10">
                  <div class="w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${wiggle}">
                    <span class="material-symbols-outlined ${step.done ? 'active-icon' : ''}" style='font-variation-settings: "FILL" ${step.done || isActive ? 1 : 0};'>${step.done ? 'check_circle' : step.icon}</span>
                  </div>
                  <span class="font-label-bold text-label-bold ${labelClass} uppercase">${step.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- Instruction Banner -->
        <div class="glass-panel rounded-xl p-md flex items-center gap-md border-l-4 border-primary shadow-xl mt-md">
          <div class="bg-primary-container/20 p-sm rounded-lg">
            <span class="material-symbols-outlined text-primary">info</span>
          </div>
          <p class="font-body-md text-on-surface leading-tight text-sm">${guideText}</p>
        </div>

        <!-- Kitchen Map -->
        <div class="relative w-full aspect-square bg-surface-container-low rounded-2xl border-2 border-surface-container-highest shadow-inner overflow-hidden mt-md">
          <div class="relative w-full h-full" id="kitchen-map-container">
            <img alt="Kitchen Floor Plan" class="w-full h-full object-cover rounded-xl" src="${mapImage}">
            <!-- Interactive Zones rendered dynamically -->
            <div id="kitchen-zones"></div>
            <!-- Chef Sprite -->
            <div id="chef-sprite" class="absolute z-20 pointer-events-none transition-all duration-[1200ms] ease-out" style="left: 50%; top: 50%; transform: translate(-50%, -50%); width: 48px; height: 96px;"></div>
          </div>
        </div>

        <!-- Basket / Inventory -->
        <section class="flex flex-col gap-sm mt-md">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-tertiary" style='font-variation-settings: "FILL" 1;'>shopping_basket</span>
            <h3 class="font-headline-lg-mobile text-[18px] text-on-surface uppercase tracking-tight">Basket</h3>
          </div>
          <div class="bg-surface-container-highest p-sm rounded-2xl flex gap-sm overflow-x-auto no-scrollbar shadow-lg" id="basket-scroll"></div>
        </section>

        <!-- Change Ingredients -->
        <button id="change-ingredients-btn" class="mt-md w-full bg-secondary-container text-on-secondary-container py-4 rounded-2xl font-display-lg text-[20px] shadow-[0_4px_0_#135135] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-md cursor-pointer">
          <span class="material-symbols-outlined">sync</span>
          CHANGE INGREDIENTS
        </button>
      </main>

      <!-- Bottom Navigation Bar -->
      <nav class="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-md pb-lg pt-sm bg-surface-container-lowest rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.4)]">
        <div class="flex flex-col items-center justify-center text-on-surface-variant">
          <span class="material-symbols-outlined">storefront</span>
          <span class="font-label-bold text-label-bold">Market</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="font-label-bold text-label-bold">Pantry</span>
        </div>
        <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg px-4 py-1">
          <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>skillet</span>
          <span class="font-label-bold text-label-bold">Kitchen</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant">
          <span class="material-symbols-outlined">emoji_events</span>
          <span class="font-label-bold text-label-bold">Scoring</span>
        </div>
      </nav>
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

    // ─── RENDER DYNAMIC ELEMENTS ───
    this.renderInteractiveZones();
    this.renderChefSprite();
    this.renderBasket();

    // ─── BIND EVENTS ───
    this.overlay.querySelector('#change-ingredients-btn').addEventListener('click', () => {
      this.overlay.style.transition = 'opacity 0.3s ease';
      this.overlay.style.opacity = '0';
      setTimeout(() => this.scene.start('IngredientSelectionScene'), 300);
    });

    // Music Toggle
    const musicBtn = this.overlay.querySelector('#kitchen-music-btn');
    const updateMusicButton = () => {
      const enabled = isMusicEnabled();
      musicBtn.textContent = enabled ? 'music_note' : 'music_off';
    };
    updateMusicButton();
    musicBtn.addEventListener('click', () => {
      toggleMusic(this);
      updateMusicButton();
    });

    this.overlay.querySelector('#kitchen-settings-btn').addEventListener('click', () => {
      showSettingsModal(this);
    });

    // Keyboard controls for chef movement
    this._keyHandler = (event) => {
      if (this.isMoving) return;
      let dx = 0, dy = 0;
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') dy = -8;
      else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') dy = 8;
      else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') dx = -8;
      else if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') dx = 8;
      if (dx !== 0 || dy !== 0) {
        this.moveChef(this.chefPosPercent.x + dx, this.chefPosPercent.y + dy);
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // ─── CLEANUP ───
    this.events.once('shutdown', () => {
      this.sys.game.scale.off('resize', this._resizeHandler);
      document.removeEventListener('keydown', this._keyHandler);
      this.shutdown();
    }, this);
    this.events.once('destroy', () => {
      this.sys.game.scale.off('resize', this._resizeHandler);
      document.removeEventListener('keydown', this._keyHandler);
      this.shutdown();
    }, this);
  }

  renderInteractiveZones() {
    const zonesContainer = this.overlay.querySelector('#kitchen-zones');
    zonesContainer.innerHTML = '';
    const state = this.game.gameState;
    const zones = this.isTraditional ? TRADITIONAL_ZONES : MODERN_ZONES;
    const manifest = state.contentPack.manifest;

    manifest.kitchenMap.stations.forEach(station => {
      const zonePos = zones[station.id];
      if (!zonePos) return;

      const status = this.getStationStatus(station.id, state);
      const zone = document.createElement('div');
      zone.className = 'absolute z-20 cursor-pointer rounded-lg transition-all duration-300';
      zone.style.left = zonePos.left;
      zone.style.top = zonePos.top;
      zone.style.width = zonePos.width;
      zone.style.height = zonePos.height;

      if (status === 'active') {
        zone.style.background = 'rgba(255, 182, 138, 0.15)';
        zone.style.boxShadow = '0 0 20px rgba(255, 182, 138, 0.3)';
        zone.style.border = '2px solid rgba(255, 182, 138, 0.4)';
      } else if (status === 'completed') {
        zone.style.background = 'rgba(151, 212, 175, 0.1)';
        zone.style.border = '2px solid rgba(151, 212, 175, 0.3)';
      } else if (status === 'locked') {
        zone.style.background = 'rgba(0, 0, 0, 0.2)';
        zone.style.border = '1px dashed rgba(255,255,255,0.1)';
      }

      zone.addEventListener('click', () => {
        const cx = parseFloat(zonePos.left) + parseFloat(zonePos.width) / 2;
        const cy = parseFloat(zonePos.top) + parseFloat(zonePos.height) / 2;
        this.moveChef(cx, cy, () => {
          this.interactWithStation(station.id);
        });
      });

      zonesContainer.appendChild(zone);
    });
  }

  renderChefSprite() {
    const chefEl = this.overlay.querySelector('#chef-sprite');
    this.chefElement = chefEl;

    if (!this.game.gameState.emojiMode && this.textures.exists('sprites-cooking')) {
      const canvas = createChefSpriteCanvas(this, 'IDLE');
      if (canvas) {
        canvas.className = 'w-full h-full object-contain drop-shadow-lg';
        chefEl.appendChild(canvas);
        this.chefCanvas = canvas;
        return;
      }
    }

    const emoji = document.createElement('span');
    emoji.className = 'text-4xl';
    emoji.textContent = '🧑🏾‍🍳';
    chefEl.appendChild(emoji);
  }

  updateChefFrame(frameName) {
    if (!this.chefCanvas || !this.textures.exists('sprites-cooking')) return;
    const canvas = createChefSpriteCanvas(this, frameName);
    if (canvas) {
      canvas.className = 'w-full h-full object-contain drop-shadow-lg';
      this.chefElement.innerHTML = '';
      this.chefElement.appendChild(canvas);
      this.chefCanvas = canvas;
    }
  }

  moveChef(targetX, targetY, onComplete = null) {
    if (this.isMoving) return;

    targetX = Math.max(5, Math.min(95, targetX));
    targetY = Math.max(5, Math.min(95, targetY));

    const dx = targetX - this.chefPosPercent.x;
    const dy = targetY - this.chefPosPercent.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.updateChefFrame(dx > 0 ? 'WALK_RIGHT' : 'WALK_LEFT');
    } else {
      this.updateChefFrame(dy > 0 ? 'WALK_DOWN' : 'WALK_UP');
    }

    this.isMoving = true;
    this.chefPosPercent = { x: targetX, y: targetY };
    this.chefElement.style.left = `${targetX}%`;
    this.chefElement.style.top = `${targetY}%`;

    setTimeout(() => {
      this.isMoving = false;
      this.updateChefFrame('IDLE');
      if (onComplete) onComplete();
    }, 1200);
  }

  renderBasket() {
    const container = this.overlay.querySelector('#basket-scroll');
    container.innerHTML = '';

    const state = this.game.gameState;
    const ingredientIds = state.selectedIngredients;
    const ingredientsData = state.contentPack.ingredients;
    const emojiMode = state.emojiMode;
    const hasAtlas = !emojiMode && this.textures.exists('items');

    ingredientIds.forEach(id => {
      const slot = document.createElement('div');
      slot.className = 'w-14 h-14 flex-shrink-0 rounded-full bg-surface-container border-2 border-outline-variant flex items-center justify-center shadow-inner';

      const frameKey = INGREDIENT_FRAME_MAP[id];
      if (hasAtlas && frameKey) {
        const canvas = createTextureCanvas(this, 'items', resolveFrame(frameKey));
        if (canvas) {
          canvas.className = 'w-10 h-10 object-contain';
          slot.appendChild(canvas);
        }
      } else {
        let icon = '🟡';
        if (ingredientsData) {
          for (const cat of Object.values(ingredientsData.categories)) {
            const found = cat.items.find(item => item.id === id);
            if (found) { icon = found.icon; break; }
          }
        }
        const emoji = document.createElement('span');
        emoji.className = 'text-xl';
        emoji.textContent = icon;
        slot.appendChild(emoji);
      }

      container.appendChild(slot);
    });

    if (ingredientIds.length === 0) {
      container.innerHTML = '<p class="text-on-surface-variant text-sm italic px-sm">No ingredients selected</p>';
    }
  }

  getStationStatus(stationId, state) {
    if (stationId === 'washing_area') {
      return state.washingOutcome ? 'completed' : 'active';
    } else if (stationId === 'prep_station') {
      if (state.grindingPerformance) return 'completed';
      if (state.washingOutcome) return 'active';
      return 'locked';
    } else if (stationId === 'cooking_stove') {
      if (state.cookingSequence.length > 0) return 'completed';
      if (state.grindingPerformance) return 'active';
      return 'locked';
    } else if (stationId === 'serving_counter') {
      if (state.cookingSequence.length > 0) return 'active';
      return 'locked';
    }
    return 'available';
  }

  interactWithStation(stationId) {
    const state = this.game.gameState;

    const goTo = (sceneName) => {
      this.overlay.style.transition = 'opacity 0.2s ease';
      this.overlay.style.opacity = '0';
      setTimeout(() => this.scene.start(sceneName), 200);
    };

    const status = this.getStationStatus(stationId, state);

    if (status === 'completed') {
      const labels = { washing_area: 'Washing', prep_station: 'Prep', cooking_stove: 'Cooking', serving_counter: 'Serving' };
      this.showPopup('ALREADY DONE', `${labels[stationId] || 'This step'} has already been completed!`, 'check_circle');
      return;
    }

    if (stationId === 'washing_area') {
      goTo('WashingAreaScene');
    } else if (stationId === 'prep_station') {
      if (!state.washingOutcome) {
        this.showPopup('WASH FIRST!', 'You cannot prep vegetables that are covered in dirt. Go wash them first!', 'water_drop');
      } else {
        goTo('PrepStationScene');
      }
    } else if (stationId === 'cooking_stove') {
      if (!state.washingOutcome || !state.grindingPerformance) {
        this.showPopup('PREPARATION NEEDED', "Clean and chop/grind your ingredients first. Don't rush the ancestors!", 'lock');
      } else {
        goTo('CookingStoveScene');
      }
    } else if (stationId === 'serving_counter') {
      if (state.cookingSequence.length === 0) {
        this.showPopup('POT IS EMPTY', 'You have nothing to serve yet. Go cook something!', 'cooking');
      } else {
        goTo('ServingScene');
      }
    }
  }

  showPopup(title, message, icon) {
    const existing = document.getElementById('kitchen-popup');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'kitchen-popup';
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/75 modal-blur';

    modal.innerHTML = `
      <div class="w-full max-w-xs bg-surface-container border border-error rounded-xl shadow-2xl p-md text-center">
        <h2 class="font-headline-lg text-headline-lg-mobile text-error mb-sm flex items-center justify-center gap-sm">
          <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>${icon || 'warning'}</span>
          ${title}
        </h2>
        <p class="text-on-surface font-body-md text-sm mb-md leading-relaxed">${message}</p>
        <button id="kitchen-popup-ok" class="w-full h-10 bg-primary-container text-on-primary-container font-label-bold rounded-lg uppercase tracking-widest cursor-pointer active:scale-95 transition-transform">
          GOT IT
        </button>
      </div>
    `;

    this.overlay.appendChild(modal);
    modal.querySelector('#kitchen-popup-ok').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  shutdown() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    const popup = document.getElementById('kitchen-popup');
    if (popup) popup.remove();
  }
}
