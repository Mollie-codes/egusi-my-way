// src/scenes/CookingStoveScene.js
// Screen 4c: Cooking Stove — Tap ingredients into pot in order, track cooking method
import Phaser from 'phaser';
import { resolveFrame } from '../utils/ItemData.js';
import { showSettingsModal } from '../ui/SettingsModal.js';

const INGREDIENT_FRAME_MAP = {
  egusi: 'EGUSI_SEEDS', egusi_seeds: 'EGUSI_SEEDS', palm_oil: 'PALM_OIL_BOTTLE',
  onions: 'ONIONS_WHOLE', pepper: 'SCOTCH_BONNET', scotch_bonnet: 'SCOTCH_BONNET',
  tomatoes: 'TOMATOES_FRESH', tomato_paste: 'TOMATO_PASTE', locust_beans: 'LOCUST_BEANS',
  goat_meat: 'GOAT_MEAT', cow_meat: 'COW_MEAT', chicken: 'CHICKEN', turkey: 'TURKEY',
  fresh_fish: 'FRESH_FISH', stockfish: 'STOCKFISH', dried_fish: 'DRIED_FISH',
  cow_skin: 'COW_SKIN', snail: 'SNAIL', shaki: 'SHAKI',
  efo_shoko: 'EFO_SHOKO', spinach: 'SPINACH', bitter_leaf: 'BITTER_LEAF', ugwu: 'UGWU',
  water_leaf: 'WATER_LEAF', scent_leaf: 'SCENT_LEAF', okra: 'OKRA', bell_pepper: 'BELL_PEPPER',
  crayfish: 'CRAYFISH_GROUND', seasoning_cubes: 'SEASONING_CUBES', salt: 'SALT',
  dry_pepper: 'DRY_PEPPER', curry_powder: 'CURRY_POWDER', ogiri: 'OGIRI',
  mushrooms: 'MUSHROOMS', sweet_corn: 'SWEET_CORN', plantain: 'PLANTAIN',
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

export class CookingStoveScene extends Phaser.Scene {
  constructor() {
    super('CookingStoveScene');
    this.overlay = null;
    this._resizeHandler = null;
    this.sequenceList = [];
    this.timerSeconds = 0;
    this._timerInterval = null;
    this.isCooking = false;
  }

  create() {
    this.sequenceList = [];
    this.timerSeconds = 0;
    this.isCooking = false;
    this.cameras.main.setBackgroundColor('#0d0b14');

    const state = this.game.gameState;
    const utensils = state.selectedUtensils || [];
    const isCharcoal = utensils.includes('charcoal_stove');

    this.overlay = document.createElement('div');
    this.overlay.id = 'cooking-stove-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>

      <!-- Header -->
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50">
        <div class="flex justify-between items-center w-full px-container-padding py-lg">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
            <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">COOKING STOVE</h1>
          </div>
          <div class="flex items-center gap-md">
            <div class="bg-surface-container-highest px-md py-xs rounded-full flex items-center gap-xs border border-outline-variant">
              <span class="material-symbols-outlined text-tertiary text-[18px]" style='font-variation-settings: "FILL" 1;'>timer</span>
              <span class="font-stats-number text-stats-number text-on-surface" id="cook-timer">0:00</span>
            </div>
            <button id="cook-settings-btn" class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 cursor-pointer">settings</button>
          </div>
        </div>
        <div class="bg-primary/10 py-xs text-center border-b border-primary/20">
          <p class="font-label-bold text-label-bold text-primary">Tap ingredients to add to the pot in order.</p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col relative px-container-padding overflow-hidden">
        <div class="flex-1 flex flex-col md:flex-row gap-sm overflow-hidden">
          <!-- Pot Area -->
          <div class="flex-1 flex flex-col items-center justify-center relative">
            <div class="absolute w-48 h-16 bg-primary/20 blur-3xl rounded-full bottom-16"></div>
            <div class="relative pot-bob">
              <!-- Steam -->
              <div class="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 pointer-events-none">
                <div class="steam-particle absolute left-1/4 bottom-0 w-6 h-6 bg-on-surface/10 blur-xl rounded-full" style="animation-delay: 0s"></div>
                <div class="steam-particle absolute left-1/2 bottom-0 w-8 h-8 bg-on-surface/10 blur-xl rounded-full" style="animation-delay: 1s"></div>
                <div class="steam-particle absolute left-3/4 bottom-0 w-5 h-5 bg-on-surface/10 blur-xl rounded-full" style="animation-delay: 2s"></div>
              </div>
              <!-- Pot body -->
              <div class="relative w-56 h-48">
                <div class="absolute inset-0 bg-surface-container-highest rounded-[40%_40%_20%_20%] border-4 border-outline-variant shadow-2xl overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent"></div>
                  <div id="pot-liquid" class="absolute bottom-0 left-0 right-0 h-0 bg-gradient-to-t from-primary/30 to-primary/10 transition-all duration-500"></div>
                </div>
                <div class="absolute -left-6 top-1/3 w-10 h-5 bg-surface-container-high rounded-full border-4 border-outline-variant"></div>
                <div class="absolute -right-6 top-1/3 w-10 h-5 bg-surface-container-high rounded-full border-4 border-outline-variant"></div>
              </div>
              <div class="text-center mt-xs">
                <span class="font-label-bold text-[10px] text-on-surface-variant uppercase tracking-wider">${isCharcoal ? 'Charcoal Stove' : 'Gas Cooker'}</span>
              </div>
            </div>
          </div>

          <!-- Pot Contents Sidebar -->
          <aside class="w-full md:w-72 bg-surface-container-low rounded-xl border border-outline-variant flex flex-col shadow-xl z-20 max-h-[240px]">
            <div class="p-sm border-b border-outline-variant bg-surface-container rounded-t-xl">
              <h2 class="font-label-bold text-label-bold text-on-surface-variant flex items-center gap-xs uppercase tracking-widest text-[11px]">
                <span class="material-symbols-outlined text-[16px]">list_alt</span> Pot Contents:
              </h2>
            </div>
            <div class="flex-1 p-sm space-y-xs overflow-y-auto no-scrollbar" id="contents-list">
              <div class="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-md">
                <span class="material-symbols-outlined text-3xl mb-xs">hourglass_empty</span>
                <p class="text-[11px]">Waiting for ingredients...</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <!-- Bottom: Ingredient Tray + Controls -->
      <footer class="px-container-padding pt-sm pb-lg bg-surface-container-highest/80 backdrop-blur-md rounded-t-2xl border-t border-outline-variant shadow-[0_-8px_24px_rgba(0,0,0,0.4)] z-30">
        <div class="flex flex-col gap-sm">
          <span class="font-label-bold text-label-bold text-on-surface-variant text-[11px] uppercase tracking-widest">Ingredient Tray</span>
          <div class="flex gap-sm overflow-x-auto pb-xs no-scrollbar" id="ingredient-tray"></div>
          <div class="flex items-center gap-sm">
            <button id="reset-btn" class="flex-1 py-sm rounded-xl bg-error-container text-on-error-container font-label-bold flex items-center justify-center gap-xs shadow-[0_3px_0_rgba(147,0,10,1)] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer text-xs">
              <span class="material-symbols-outlined text-sm">refresh</span> RESET
            </button>
            <button id="cook-btn" class="flex-[2] py-md rounded-xl bg-secondary-container text-on-secondary-container font-headline-lg-mobile text-headline-lg-mobile flex items-center justify-center gap-sm shadow-[0_5px_0_rgba(19,81,53,1)] active:shadow-none active:translate-y-[5px] transition-all cursor-pointer">
              <span class="material-symbols-outlined text-2xl" style='font-variation-settings: "FILL" 1;'>local_fire_department</span> COOK!
            </button>
          </div>
        </div>
      </footer>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // ─── OVERLAY SCALING ───
    this._resizeHandler = () => {
      if (!this.overlay) return;
      const canvas = this.sys.game.canvas;
      if (!canvas) return;
      const cb = canvas.getBoundingClientRect();
      const cont = document.getElementById('game-container').getBoundingClientRect();
      const scale = cb.width / 480;
      this.overlay.style.width = '480px';
      this.overlay.style.height = '854px';
      this.overlay.style.transform = `scale(${scale})`;
      this.overlay.style.transformOrigin = 'top left';
      this.overlay.style.left = `${cb.left - cont.left}px`;
      this.overlay.style.top = `${cb.top - cont.top}px`;
    };
    this._resizeHandler();
    this.sys.game.scale.on('resize', this._resizeHandler);

    // ─── RENDER INGREDIENTS ───
    this.renderIngredientTray();

    // ─── TIMER ───
    this._timerInterval = setInterval(() => {
      this.timerSeconds++;
      const m = Math.floor(this.timerSeconds / 60);
      const s = this.timerSeconds % 60;
      const el = this.overlay?.querySelector('#cook-timer');
      if (el) el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    }, 1000);

    // ─── BIND EVENTS ───
    this.overlay.querySelector('#cook-settings-btn').addEventListener('click', () => showSettingsModal(this));
    this.overlay.querySelector('#cook-btn').addEventListener('click', () => this.startCooking());
    this.overlay.querySelector('#reset-btn').addEventListener('click', () => this.resetSequence());

    // ─── CLEANUP ───
    this.events.once('shutdown', () => { this.sys.game.scale.off('resize', this._resizeHandler); this.shutdown(); }, this);
    this.events.once('destroy', () => { this.sys.game.scale.off('resize', this._resizeHandler); this.shutdown(); }, this);
  }

  renderIngredientTray() {
    const tray = this.overlay.querySelector('#ingredient-tray');
    tray.innerHTML = '';

    const ids = this.game.gameState.selectedIngredients;
    const ingredients = this.game.gameState.contentPack.ingredients;
    const hasAtlas = !this.game.gameState.emojiMode && this.textures.exists('items');

    ids.forEach(id => {
      if (this.sequenceList.some(s => s.ingredient === id)) return;

      let item = null;
      let catKey = '';
      for (const [k, cat] of Object.entries(ingredients.categories)) {
        const found = cat.items.find(i => i.id === id);
        if (found) { item = found; catKey = k; break; }
      }
      if (!item) return;

      const card = document.createElement('button');
      card.className = 'flex-shrink-0 w-20 h-24 game-card pressed-effect cursor-pointer relative';
      card.style.padding = '8px 4px';

      const frameKey = INGREDIENT_FRAME_MAP[id];
      let visualHTML = '';
      if (hasAtlas && frameKey) {
        card.dataset.hasSprite = 'true';
        card.dataset.frameKey = frameKey;
      }

      card.innerHTML = `
        <div class="w-12 h-12 flex items-center justify-center mx-auto" id="tray-img-${id}"></div>
        <span class="font-label-bold text-[9px] text-on-surface text-center block mt-1 leading-tight">${item.name.split(' ')[0]}</span>
      `;

      tray.appendChild(card);

      const imgC = card.querySelector(`#tray-img-${id}`);
      if (hasAtlas && frameKey) {
        const canvas = createTextureCanvas(this, 'items', resolveFrame(frameKey));
        if (canvas) { canvas.className = 'w-10 h-10 object-contain'; imgC.appendChild(canvas); }
      } else {
        imgC.innerHTML = `<span class="text-2xl">${item.icon}</span>`;
      }

      card.addEventListener('click', () => {
        if (this.isCooking) return;
        this.addToSequence(id, item.name, item.icon, catKey);
        card.remove();
      });
    });
  }

  addToSequence(id, name, icon, catKey) {
    let action = 'add_ingredient';
    if (id === 'palm_oil') action = 'heat_oil';
    else if (id === 'onions' || id === 'pepper' || id === 'scotch_bonnet') action = 'fry_aromatics';
    else if (id === 'egusi' || id === 'egusi_seeds') action = 'fry_egusi';
    else if (catKey === 'proteins') action = 'add_protein';
    else if (catKey === 'vegetables') action = 'add_vegetables';

    this.sequenceList.push({ order: this.sequenceList.length + 1, action, ingredient: id, label: `Added ${name}` });

    // Update pot liquid level
    const liquid = this.overlay.querySelector('#pot-liquid');
    if (liquid) {
      const pct = Math.min(60, this.sequenceList.length * 10);
      liquid.style.height = `${pct}%`;
    }

    // Update contents list
    const list = this.overlay.querySelector('#contents-list');
    if (this.sequenceList.length === 1) list.innerHTML = '';

    const entry = document.createElement('div');
    entry.className = 'flex items-center gap-sm p-xs bg-surface-container-high rounded-lg border border-outline-variant/30';
    entry.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center flex-shrink-0">
        <span class="font-label-bold text-xs text-primary">${this.sequenceList.length}</span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-label-bold text-[11px] text-on-surface truncate">${name}</p>
        <p class="text-[9px] text-on-surface-variant uppercase">${action.replace(/_/g, ' ')}</p>
      </div>
    `;
    list.appendChild(entry);
    list.scrollTop = list.scrollHeight;
  }

  resetSequence() {
    this.sequenceList = [];
    const liquid = this.overlay.querySelector('#pot-liquid');
    if (liquid) liquid.style.height = '0%';

    const list = this.overlay.querySelector('#contents-list');
    list.innerHTML = `<div class="flex-1 flex flex-col items-center justify-center text-center opacity-30 py-md">
      <span class="material-symbols-outlined text-3xl mb-xs">hourglass_empty</span>
      <p class="text-[11px]">Waiting for ingredients...</p>
    </div>`;

    this.renderIngredientTray();
  }

  startCooking() {
    if (this.isCooking) return;
    if (this.sequenceList.length === 0) {
      this.showPopup('EMPTY POT', "You can't cook hot water! Add some ingredients first.", 'cooking');
      return;
    }

    this.isCooking = true;
    const cookBtn = this.overlay.querySelector('#cook-btn');
    cookBtn.innerHTML = `<span class="material-symbols-outlined text-2xl animate-spin">progress_activity</span> SIMMERING...`;
    cookBtn.disabled = true;

    // Append simmer step
    this.sequenceList.push({ order: this.sequenceList.length + 1, action: 'simmer', ingredient: null, label: 'Simmered' });

    // Auto-add vegetables last if selected but not added
    const state = this.game.gameState;
    const vegIds = ['efo_shoko', 'spinach', 'bitter_leaf', 'ugwu', 'water_leaf', 'scent_leaf'];
    const hasVegs = state.selectedIngredients.some(id => vegIds.includes(id));
    const addedVeg = this.sequenceList.some(s => s.action === 'add_vegetables');
    if (hasVegs && !addedVeg) {
      this.sequenceList.push({ order: this.sequenceList.length + 1, action: 'add_vegetables', ingredient: 'leafy_greens', label: 'Added Vegetables Last' });
    }

    // Cooking events chain
    let progress = 0;
    const cookInterval = setInterval(() => {
      progress += 2;

      // Aunty Bose at 30%
      if (progress === 30) {
        clearInterval(cookInterval);
        this.triggerEvent('visitor_enters', () => {
          const resumed = setInterval(() => {
            progress += 2;
            if (progress === 70 && state.selectedUtensils.includes('blender')) {
              clearInterval(resumed);
              this.triggerEvent('power_outage', () => {
                const final = setInterval(() => { progress += 2; if (progress >= 100) { clearInterval(final); this.finishCooking(); } }, 50);
              });
            } else if (progress >= 100) { clearInterval(resumed); this.finishCooking(); }
          }, 50);
        });
        return;
      }

      if (progress >= 100) { clearInterval(cookInterval); this.finishCooking(); }
    }, 50);
  }

  triggerEvent(eventId, onDone) {
    const data = this.game.gameState.contentPack.randomEvents.events.find(e => e.id === eventId);
    if (!data) { onDone(); return; }
    this.showEventPopup(data, (choice) => {
      this.game.gameState.eventChoices.push({ eventId: data.id, choiceId: choice.id, choiceObj: choice });
      onDone();
    });
  }

  showEventPopup(data, onSelect) {
    const modal = document.createElement('div');
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/85 modal-blur';

    modal.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container border border-primary rounded-2xl shadow-2xl overflow-hidden">
        <div class="p-md text-center">
          <span class="text-4xl mb-sm block">${data.icon}</span>
          <h2 class="font-headline-lg text-headline-lg-mobile text-primary mb-xs">${data.name.toUpperCase()}</h2>
          <p class="text-on-surface font-body-md text-sm leading-relaxed">${data.message}</p>
        </div>
        <div class="px-md pb-md flex flex-col gap-sm" id="event-choices"></div>
      </div>
    `;

    this.overlay.appendChild(modal);

    const choicesContainer = modal.querySelector('#event-choices');
    data.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'game-card card-glow cursor-pointer';
      btn.style.flexDirection = 'row';
      btn.style.padding = '10px 14px';
      btn.style.textAlign = 'left';
      btn.innerHTML = `<span class="font-label-bold text-on-surface text-xs">${choice.label}</span>`;

      btn.addEventListener('click', () => {
        modal.remove();
        this.showToast(choice.message);
        onSelect(choice);
      });

      choicesContainer.appendChild(btn);
    });
  }

  determineCookingMethod() {
    const sequences = this.game.gameState.contentPack.recipeSequences.sequences;
    const playerActions = this.sequenceList.map(s => s.action);

    // Check fry-first: palm oil → aromatics → egusi early
    const oilIdx = playerActions.indexOf('heat_oil');
    const fryIdx = playerActions.indexOf('fry_aromatics');
    const egusiIdx = playerActions.indexOf('fry_egusi');
    const proteinIdx = playerActions.indexOf('add_protein');

    let method;
    if (oilIdx !== -1 && oilIdx < 3 && (egusiIdx !== -1 && egusiIdx < 5)) {
      method = sequences.find(s => s.id === 'traditional_fry_first');
    } else if (proteinIdx !== -1 && proteinIdx < 2 && (oilIdx === -1 || oilIdx > proteinIdx)) {
      method = sequences.find(s => s.id === 'boil_first_method');
    } else {
      method = sequences.find(s => s.id === 'chaotic_neutral');
    }

    return method;
  }

  finishCooking() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }

    const method = this.determineCookingMethod();
    const state = this.game.gameState;
    state.cookingSequence = this.sequenceList;
    state.cookingMethod = method;

    // Show method feedback
    const methodName = method?.name || 'Chaotic Neutral Method';
    const methodDesc = method?.description || 'No discernible order. Just vibes and hope.';

    this.showPopup(
      methodName.toUpperCase(),
      methodDesc,
      method?.id === 'traditional_fry_first' ? 'local_fire_department' :
        method?.id === 'boil_first_method' ? 'water_drop' : 'shuffle',
      () => {
        this.overlay.style.transition = 'opacity 0.3s ease';
        this.overlay.style.opacity = '0';
        setTimeout(() => this.scene.start('KitchenMapScene'), 300);
      }
    );
  }

  showPopup(title, message, icon, onDismiss = null) {
    const modal = document.createElement('div');
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/75 modal-blur';
    modal.innerHTML = `
      <div class="w-full max-w-xs bg-surface-container border border-primary rounded-xl shadow-2xl p-md text-center">
        <span class="material-symbols-outlined text-3xl text-primary mb-sm block" style='font-variation-settings: "FILL" 1;'>${icon}</span>
        <h2 class="font-headline-lg text-headline-lg-mobile text-primary mb-sm">${title}</h2>
        <p class="text-on-surface font-body-md text-sm mb-md leading-relaxed">${message}</p>
        <button class="w-full h-10 bg-primary-container text-on-primary-container font-label-bold rounded-lg uppercase tracking-widest cursor-pointer active:scale-95 transition-transform">GOT IT</button>
      </div>
    `;
    this.overlay.appendChild(modal);
    modal.querySelector('button').addEventListener('click', () => { modal.remove(); if (onDismiss) onDismiss(); });
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); if (onDismiss) onDismiss(); } });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'absolute bottom-36 left-1/2 -translate-x-1/2 z-[110] bg-surface-container border border-primary/50 rounded-lg px-md py-sm shadow-xl text-on-surface text-xs font-body-md text-center max-w-[80%]';
    toast.textContent = message;
    this.overlay.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  shutdown() {
    if (this._timerInterval) { clearInterval(this._timerInterval); this._timerInterval = null; }
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
  }
}
