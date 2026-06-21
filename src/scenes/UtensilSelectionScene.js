// src/scenes/UtensilSelectionScene.js
// Screen 3: Utensil Selection — Choose grinding tool and heat source
import Phaser from 'phaser';
import { resolveFrame } from '../utils/ItemData.js';
import { showSettingsModal } from '../ui/SettingsModal.js';

const UTENSIL_FRAME_MAP = {
  pot: 'POT_LARGE',
  mortar_pestle: 'MORTAR',
  blender: 'BLENDER',
  gas_cooker: 'GAS_BURNER',
  charcoal_stove: 'GAS_BURNER',
  wooden_spoon: 'WOODEN_SPOON',
  knife: 'KNIFE',
  cutting_board: 'CUTTING_BOARD',
  mixing_bowl: 'MIXING_BOWL',
  sieve: 'SIEVE',
  pestle: 'PESTLE',
};

const CATEGORY_META = {
  grinding_tools: {
    label: 'Grinding Method',
    icon: 'settings_suggest',
    iconColor: 'text-primary',
    labelColor: 'text-primary',
    description: 'How do you want to grind your egusi and pepper?',
  },
  heat_sources: {
    label: 'Heat Source',
    icon: 'local_fire_department',
    iconColor: 'text-error',
    labelColor: 'text-error',
    description: 'What will you cook with?',
  },
};

const UTENSIL_META = {
  mortar_pestle: { subtitle: 'Slow • High Quality', icon: 'fitness_center', iconColor: 'text-tertiary' },
  blender: { subtitle: 'Fast • NEPA-dependent', icon: 'bolt', iconColor: 'text-error' },
  gas_cooker: { subtitle: 'Standard Control', icon: 'grid_view', iconColor: 'text-secondary' },
  charcoal_stove: { subtitle: 'Smoky Flavor', icon: 'mode_heat', iconColor: 'text-primary' },
};

const SUMMARY_ICONS = {
  pot: 'cooking',
  mortar_pestle: 'flatware',
  blender: 'blender',
  gas_cooker: 'local_fire_department',
  charcoal_stove: 'mode_heat',
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

export class UtensilSelectionScene extends Phaser.Scene {
  constructor() {
    super('UtensilSelectionScene');
    this.selectedIds = [];
    this.overlay = null;
    this.hasShownTeamPopup = false;
    this._resizeHandler = null;
  }

  create() {
    this.selectedIds = [...this.game.gameState.selectedUtensils];
    this.hasShownTeamPopup = false;

    if (!this.selectedIds.includes('pot')) {
      this.selectedIds.push('pot');
    }

    this.cameras.main.setBackgroundColor('#0d0b14');

    // ─── CREATE DOM OVERLAY ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'utensil-selection-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <!-- Background Decoration -->
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>
      <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <!-- Top App Bar -->
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-sm">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Efo Egusi: <span class="text-on-surface-variant">Cooking My Way!</span></h1>
        </div>
        <button class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">settings</button>
      </header>

      <main class="relative z-10 flex-1 overflow-y-auto px-container-padding pt-lg pb-32 no-scrollbar">
        <!-- Page Header -->
        <section class="text-center mb-lg">
          <h2 class="font-display-lg text-display-lg text-on-surface uppercase mb-xs">Select Utensils</h2>
          <p class="text-on-surface-variant font-body-md opacity-80">Choose your grinding and cooking tools wisely.</p>
        </section>

        <!-- Essential Tool (Locked) -->
        <section class="mb-lg">
          <div class="flex items-center gap-xs mb-sm">
            <span class="material-symbols-outlined text-tertiary text-[18px]">verified</span>
            <h3 class="font-label-bold text-label-bold text-tertiary uppercase tracking-wider">Essential</h3>
          </div>
          <div class="bg-secondary-container/20 border border-secondary-container rounded-xl p-md flex items-center justify-between shadow-sm relative overflow-hidden">
            <div class="flex items-center gap-md">
              <div id="pot-sprite-container" class="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant"></div>
              <div>
                <p class="font-label-bold text-on-surface">Large Cooking Pot</p>
                <p class="text-[12px] text-secondary font-semibold">Essential • Auto-selected</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-tertiary" style='font-variation-settings: "FILL" 1;'>lock</span>
          </div>
        </section>

        <!-- Dynamic Category Sections (Grinding + Heat) -->
        <div id="utensil-category-sections"></div>

        <!-- Selected Summary Bar -->
        <div id="utensil-summary-bar" class="bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/30 rounded-lg p-sm flex items-center justify-center gap-md mt-lg"></div>
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

      <!-- CTA Button -->
      <div class="absolute bottom-24 left-0 w-full px-container-padding z-40 pointer-events-none">
        <button id="utensil-next-btn" class="pointer-events-auto w-full h-14 bg-primary-container text-on-primary-container font-headline-lg-mobile text-headline-lg-mobile flex items-center justify-center gap-sm rounded-xl shadow-[0_4px_0px_#743500] active:shadow-none active:translate-y-[4px] transition-all duration-75 uppercase tracking-wide cursor-pointer">
          Enter Kitchen Map
          <span class="material-symbols-outlined">trending_flat</span>
        </button>
      </div>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // ─── OVERLAY SCALING (match Phaser FIT scale) ───
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

    // ─── RENDER COMPONENTS ───
    this.renderPotSprite();
    this.renderCategories();
    this.renderSummaryBar();

    // ─── BIND EVENTS ───
    this.overlay.querySelector('#utensil-next-btn').addEventListener('click', () => {
      this.validateAndProceed();
    });

    this.overlay.querySelector('header button').addEventListener('click', () => {
      showSettingsModal(this);
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

  renderPotSprite() {
    const container = this.overlay.querySelector('#pot-sprite-container');
    const emojiMode = this.game.gameState.emojiMode;

    if (!emojiMode && this.textures.exists('items')) {
      const canvas = createTextureCanvas(this, 'items', resolveFrame(UTENSIL_FRAME_MAP.pot));
      if (canvas) {
        canvas.className = 'w-10 h-10 object-contain';
        container.appendChild(canvas);
        return;
      }
    }

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined text-2xl text-secondary';
    icon.style.fontVariationSettings = '"FILL" 1';
    icon.textContent = 'cooking';
    container.appendChild(icon);
  }

  renderCategories() {
    const container = this.overlay.querySelector('#utensil-category-sections');
    container.innerHTML = '';

    const utensils = this.game.gameState.contentPack.utensils;
    const emojiMode = this.game.gameState.emojiMode;
    const hasAtlas = !emojiMode && this.textures.exists('items');

    Object.entries(CATEGORY_META).forEach(([catKey, meta]) => {
      const cat = utensils.categories[catKey];
      if (!cat) return;

      const section = document.createElement('section');
      section.className = 'mb-lg';
      section.innerHTML = `
        <div class="flex items-center gap-xs mb-sm">
          <span class="material-symbols-outlined ${meta.iconColor} text-[18px]">${meta.icon}</span>
          <h3 class="font-label-bold text-label-bold ${meta.labelColor} uppercase tracking-wider">${meta.label}</h3>
        </div>
        <p class="text-on-surface-variant text-[14px] mb-md italic">${meta.description}</p>
        <div class="grid grid-cols-2 gap-md" id="utensil-grid-${catKey}"></div>
      `;
      container.appendChild(section);

      const grid = section.querySelector(`#utensil-grid-${catKey}`);

      cat.items.forEach(item => {
        const isSelected = this.selectedIds.includes(item.id);
        const uMeta = UTENSIL_META[item.id] || { subtitle: '', icon: '', iconColor: '' };

        const card = document.createElement('button');
        card.className = `game-card pressed-effect card-glow relative${isSelected ? ' selected-card' : ''}`;

        card.innerHTML = `
          ${isSelected ? '<span class="absolute top-1.5 right-1.5 text-sm z-10">✅</span>' : ''}
          <div class="w-16 h-16 flex items-center justify-center" id="utensil-sprite-${item.id}"></div>
          <div class="flex flex-col gap-xs">
            <span class="font-label-bold text-on-surface leading-tight">${item.name}</span>
            <div class="flex items-center justify-center gap-1">
              <span class="text-[11px] text-on-surface-variant font-medium">${uMeta.subtitle}</span>
              ${uMeta.icon ? `<span class="material-symbols-outlined text-[14px] ${uMeta.iconColor}" style='font-variation-settings: "FILL" 1;'>${uMeta.icon}</span>` : ''}
            </div>
          </div>
        `;

        grid.appendChild(card);

        // Render sprite or Material icon fallback
        const imgContainer = card.querySelector(`#utensil-sprite-${item.id}`);
        const frameKey = UTENSIL_FRAME_MAP[item.id];

        if (hasAtlas && frameKey) {
          const canvas = createTextureCanvas(this, 'items', resolveFrame(frameKey));
          if (canvas) {
            canvas.className = 'w-14 h-14 object-contain';
            imgContainer.appendChild(canvas);
          }
        } else {
          const fallback = document.createElement('span');
          fallback.className = 'material-symbols-outlined text-4xl text-on-surface-variant';
          fallback.style.fontVariationSettings = '"FILL" 1';
          fallback.textContent = uMeta.icon || 'build';
          imgContainer.appendChild(fallback);
        }

        card.addEventListener('click', () => {
          this.selectUtensil(catKey, item);
        });
      });
    });
  }

  renderSummaryBar() {
    const bar = this.overlay.querySelector('#utensil-summary-bar');
    if (!bar) return;

    const utensils = this.game.gameState.contentPack.utensils;
    let html = `
      <span class="text-[11px] font-label-bold uppercase text-on-surface-variant tracking-widest">Selected:</span>
      <div class="flex items-center gap-xs">
        <span class="material-symbols-outlined text-[16px] text-primary" style='font-variation-settings: "FILL" 1;'>cooking</span>
        <span class="text-[12px] font-bold text-on-surface">Pot</span>
      </div>
    `;

    this.selectedIds.forEach(id => {
      if (id === 'pot') return;
      let found = null;
      for (const cat of Object.values(utensils.categories)) {
        found = cat.items.find(i => i.id === id);
        if (found) break;
      }
      if (!found) return;

      const icon = SUMMARY_ICONS[id] || 'build';
      const shortName = found.name.split(' ')[0];
      html += `
        <span class="text-outline-variant text-[12px]">•</span>
        <div class="flex items-center gap-xs">
          <span class="material-symbols-outlined text-[16px] text-primary" style='font-variation-settings: "FILL" 1;'>${icon}</span>
          <span class="text-[12px] font-bold text-on-surface">${shortName}</span>
        </div>
      `;
    });

    bar.innerHTML = html;
  }

  selectUtensil(catKey, item) {
    const utensils = this.game.gameState.contentPack.utensils.categories[catKey];

    utensils.items.forEach(other => {
      const idx = this.selectedIds.indexOf(other.id);
      if (idx !== -1) this.selectedIds.splice(idx, 1);
    });
    this.selectedIds.push(item.id);

    if (catKey === 'grinding_tools' && !this.hasShownTeamPopup) {
      this.hasShownTeamPopup = true;
      this.showTeamPopup(item);
    } else {
      this.renderCategories();
      this.renderSummaryBar();
    }
  }

  showTeamPopup(selectedItem) {
    const grindingTools = this.game.gameState.contentPack.utensils.categories.grinding_tools;
    const config = grindingTools.decisionPopUp;

    const existing = document.getElementById('utensil-team-popup');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'utensil-team-popup';
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/85 modal-blur';

    const quoteText = selectedItem.onSelect ? `“${selectedItem.onSelect.message}”` : '';

    modal.innerHTML = `
      <div class="w-full max-w-sm bg-surface-container border border-primary rounded-2xl shadow-2xl overflow-hidden">
        <div class="p-md text-center">
          <h2 class="font-headline-lg text-headline-lg-mobile text-primary mb-xs">⚔️ THE GREAT DEBATE ⚔️</h2>
          <h3 class="font-label-bold text-label-bold text-error uppercase tracking-wider mb-md">${config.title.toUpperCase()}</h3>
          <p class="text-on-surface font-body-md text-sm leading-relaxed">${config.message}</p>
        </div>

        <div class="flex items-center justify-center py-xs">
          <span class="font-headline-lg text-xl text-error font-extrabold animate-pulse">VS</span>
        </div>

        <div class="px-md pb-sm flex flex-col gap-sm" id="team-popup-options"></div>

        ${quoteText ? `<p class="text-center text-on-surface-variant italic text-sm px-md pb-sm">${quoteText}</p>` : ''}

        <div class="px-md pb-md">
          <button id="team-popup-confirm" class="w-full h-12 bg-primary-container text-on-primary-container font-label-bold rounded-xl shadow-[0_3px_0_#743500] active:shadow-none active:translate-y-[3px] transition-all uppercase tracking-widest cursor-pointer">
            CONFIRM SELECTION
          </button>
        </div>
      </div>
    `;

    this.overlay.appendChild(modal);

    const optionsContainer = modal.querySelector('#team-popup-options');

    config.options.forEach((opt, idx) => {
      const isChosen = opt.toolId === selectedItem.id;
      const optIcon = idx === 0 ? 'fitness_center' : 'bolt';
      const optIconColor = idx === 0 ? 'text-tertiary' : 'text-error';
      const tagText = idx === 0
        ? 'Authentic • More taps required'
        : 'Modern • Fewer taps, NEPA risk';

      const optBtn = document.createElement('button');
      optBtn.className = `game-card card-glow${isChosen ? ' selected-card' : ''} cursor-pointer`;
      optBtn.style.flexDirection = 'row';
      optBtn.style.padding = '12px 16px';
      optBtn.style.textAlign = 'left';

      optBtn.innerHTML = `
        <span class="material-symbols-outlined text-2xl ${optIconColor}" style='font-variation-settings: "FILL" 1;'>${optIcon}</span>
        <div class="flex flex-col gap-xs flex-1">
          <span class="font-label-bold text-on-surface">${opt.label}</span>
          <span class="text-[11px] ${isChosen ? 'text-on-surface' : 'text-on-surface-variant'}">${tagText}</span>
        </div>
      `;

      optBtn.addEventListener('click', () => {
        const matchingItem = grindingTools.items.find(i => i.id === opt.toolId);
        grindingTools.items.forEach(other => {
          const i = this.selectedIds.indexOf(other.id);
          if (i !== -1) this.selectedIds.splice(i, 1);
        });
        this.selectedIds.push(matchingItem.id);
        modal.remove();

        const reaction = matchingItem.onSelect ? matchingItem.onSelect.message : `You chose ${matchingItem.name}!`;
        this.showToast(reaction);
        this.renderCategories();
        this.renderSummaryBar();
      });

      optionsContainer.appendChild(optBtn);
    });

    modal.querySelector('#team-popup-confirm').addEventListener('click', () => {
      modal.remove();
      this.renderCategories();
      this.renderSummaryBar();
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'absolute bottom-36 left-1/2 -translate-x-1/2 z-[110] bg-surface-container border border-primary/50 rounded-lg px-md py-sm shadow-xl text-on-surface text-sm font-body-md text-center max-w-[80%]';
    toast.textContent = message;
    this.overlay.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  validateAndProceed() {
    const grindingTools = this.game.gameState.contentPack.utensils.categories.grinding_tools.items.map(i => i.id);
    const hasGrinding = this.selectedIds.some(id => grindingTools.includes(id));

    const heatSources = this.game.gameState.contentPack.utensils.categories.heat_sources.items.map(i => i.id);
    const hasHeat = this.selectedIds.some(id => heatSources.includes(id));

    if (!hasGrinding || !hasHeat) {
      this.showErrorPopup();
      return;
    }

    this.game.gameState.selectedUtensils = this.selectedIds;
    this.overlay.style.transition = 'opacity 0.3s ease';
    this.overlay.style.opacity = '0';
    setTimeout(() => {
      this.scene.start('KitchenMapScene');
    }, 300);
  }

  showErrorPopup() {
    const existing = document.getElementById('utensil-error-popup');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'utensil-error-popup';
    modal.className = 'absolute inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/70 modal-blur';

    modal.innerHTML = `
      <div class="w-full max-w-xs bg-surface-container border border-error rounded-xl shadow-2xl p-md text-center">
        <h2 class="font-headline-lg text-headline-lg-mobile text-error mb-sm flex items-center justify-center gap-sm">
          <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>warning</span>
          INCOMPLETE
        </h2>
        <p class="text-on-surface font-body-md text-sm mb-md leading-relaxed">Please select a grinding tool AND heat source before entering the kitchen.</p>
        <button id="utensil-error-ok" class="w-full h-10 bg-error text-on-error font-label-bold rounded-lg uppercase tracking-widest cursor-pointer active:scale-95 transition-transform">
          GOT IT
        </button>
      </div>
    `;

    this.overlay.appendChild(modal);
    modal.querySelector('#utensil-error-ok').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  shutdown() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    const teamPopup = document.getElementById('utensil-team-popup');
    if (teamPopup) teamPopup.remove();
    const errorPopup = document.getElementById('utensil-error-popup');
    if (errorPopup) errorPopup.remove();
  }
}
