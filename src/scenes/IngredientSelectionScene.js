// src/scenes/IngredientSelectionScene.js
import Phaser from 'phaser';
import { resolveFrame } from '../utils/ItemData.js';
import { showSettingsModal } from '../ui/SettingsModal.js';

/**
 * Content-pack ingredient IDs → items atlas frame keys.
 */
const INGREDIENT_FRAME_MAP = {
  // Base ingredients
  egusi: 'EGUSI_SEEDS',
  egusi_seeds: 'EGUSI_SEEDS',
  ground_egusi: 'GROUND_EGUSI',
  palm_oil: 'PALM_OIL_BOTTLE',
  onions: 'ONIONS_WHOLE',
  pepper: 'SCOTCH_BONNET',
  scotch_bonnet: 'SCOTCH_BONNET',
  tomatoes: 'TOMATOES_FRESH',
  tomato_paste: 'TOMATO_PASTE',
  locust_beans: 'LOCUST_BEANS',

  // Proteins
  goat_meat: 'GOAT_MEAT',
  cow_meat: 'COW_MEAT',
  chicken: 'CHICKEN',
  turkey: 'TURKEY',
  fresh_fish: 'FRESH_FISH',
  stockfish: 'STOCKFISH',
  dried_fish: 'DRIED_FISH',
  cow_skin: 'COW_SKIN',
  snail: 'SNAIL',
  shaki: 'SHAKI',

  // Vegetables
  efo_shoko: 'EFO_SHOKO',
  spinach: 'SPINACH',
  bitter_leaf: 'BITTER_LEAF',
  ugwu: 'UGWU',
  water_leaf: 'WATER_LEAF',
  scent_leaf: 'SCENT_LEAF',
  okra: 'OKRA',
  bell_pepper: 'BELL_PEPPER',

  // Seasonings
  crayfish: 'CRAYFISH_GROUND',
  crayfish_ground: 'CRAYFISH_GROUND',
  crayfish_whole: 'CRAYFISH_WHOLE',
  seasoning_cubes: 'SEASONING_CUBES',
  salt: 'SALT',
  dry_pepper: 'DRY_PEPPER',
  curry_powder: 'CURRY_POWDER',
  ogiri: 'OGIRI',
  cameroon_pepper: 'CAMEROON_PEPPER',

  // Wildcards
  mushrooms: 'MUSHROOMS',
  sweet_corn: 'SWEET_CORN',
  green_peas: 'GREEN_PEAS',
  potatoes: 'POTATOES',
  plantain: 'PLANTAIN',
  butter: 'BUTTER',
  cheese: 'CHEESE',
  honey: 'HONEY',
  hot_sauce: 'HOT_SAUCE',
  feta_cheese: 'FETA_CHEESE',
  mystery_paste: 'MYSTERY_PASTE',
  tabasco: 'TABASCO',
  pickled_pepper: 'PICKLED_PEPPER',
  carrots: 'CARROTS',
  green_beans: 'GREEN_BEANS',
};

/**
 * Maps rarity identifiers to style metadata matching the mockup's visual language.
 */
const RARITY_THEMES = {
  essential: {
    name: 'ESSENTIAL',
    badge: 'bg-primary/10 text-primary border-primary/40',
    gradient: 'from-primary/10',
    hoverBorder: 'hover:border-primary/50',
    color: 'text-primary',
    bgDot: '#ffb68a'
  },
  legendary: {
    name: 'LEGENDARY',
    badge: 'bg-purple-900 text-purple-400 border-purple-500/40',
    gradient: 'from-purple-500/10',
    hoverBorder: 'hover:border-purple-500/50',
    color: 'text-purple-400',
    bgDot: '#dec1d1'
  },
  rare: {
    name: 'RARE',
    badge: 'bg-blue-900 text-blue-400 border-blue-500/40',
    gradient: 'from-blue-500/10',
    hoverBorder: 'hover:border-blue-500/50',
    color: 'text-blue-400',
    bgDot: '#dec1b1'
  },
  uncommon: {
    name: 'UNCOMMON',
    badge: 'bg-secondary-container text-secondary border-secondary-container',
    gradient: 'from-secondary/10',
    hoverBorder: 'hover:border-secondary/50',
    color: 'text-secondary',
    bgDot: '#dec1b1'
  },
  common: {
    name: 'COMMON',
    badge: 'bg-surface-container-high/80 text-on-surface border-outline-variant',
    gradient: 'from-outline/10',
    hoverBorder: 'hover:border-outline/50',
    color: 'text-on-surface',
    bgDot: '#dec1b1'
  }
};

const CATEGORY_TABS_ORDER = ['proteins', 'vegetables', 'bases', 'wildcards'];

const CATEGORY_TAB_INFO = {
  proteins: { label: 'Proteins', icon: 'flatware' },
  vegetables: { label: 'Leaves', icon: 'eco' },
  bases: { label: 'Base', icon: 'grain' },
  wildcards: { label: 'Wildcard', icon: 'auto_awesome' }
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

  console.log(`[createTextureCanvas] Rendering ${frameKey}:`, {
    cutX, cutY, cutWidth, cutHeight,
    x: frame.x, y: frame.y, width: frame.width, height: frame.height
  });

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

/**
 * Extracts and crops the chef's head from the sprites-cooking texture for an avatar profile.
 */
function createChefAvatarCanvas(scene) {
  const texture = scene.textures.get('sprites-cooking');
  if (!texture) return null;
  const frameObj = texture.get('WAVE') || texture.get('IDLE');
  if (!frameObj) return null;

  const cutX = frameObj.cutX !== undefined ? frameObj.cutX : frameObj.x;
  const cutY = frameObj.cutY !== undefined ? frameObj.cutY : frameObj.y;
  const cutWidth = frameObj.cutWidth || frameObj.width;

  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  
  // Crop head (the top square portion of the character sprite)
  const cropSize = cutWidth;
  ctx.drawImage(
    frameObj.source.image,
    cutX, cutY + 10, cropSize, cropSize,
    0, 0, 48, 48
  );
  return canvas;
}

export class IngredientSelectionScene extends Phaser.Scene {
  constructor() {
    super('IngredientSelectionScene');
    this.selectedIds = [];
    this.activeCategory = 'bases';
    this.overlay = null;
  }

  create() {
    this.selectedIds = [...this.game.gameState.selectedIngredients];
    this.cameras.main.setBackgroundColor('#0d0b14');

    // ─── CREATE DOM OVERLAY ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'ingredient-selection-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';
    this.overlay.innerHTML = `
      <!-- Background Decoration -->
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>
      <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <!-- Top App Bar -->
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-lg">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Efo Egusi: <span class="text-on-surface-variant">Cooking My Way!</span></h1>
        </div>
        <button id="ingredient-settings-btn" class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">settings</button>
      </header>

      <main class="relative z-10 flex-1 overflow-y-auto px-container-padding pt-lg pb-32 no-scrollbar">
        <!-- Page Header -->
        <div class="mb-lg text-center">
          <h2 class="font-display-lg text-headline-lg-mobile mb-xs uppercase tracking-wider flex items-center justify-center gap-sm">
            <div id="chef-avatar-container" class="w-10 h-10 overflow-hidden rounded-full border-2 border-primary bg-surface-container-high flex items-center justify-center"></div>
            SELECT INGREDIENTS
          </h2>
          <p class="text-on-surface-variant font-body-md">Tap ingredients to add to your recipe.</p>
        </div>

        <!-- Category Tabs -->
        <div class="flex gap-sm overflow-x-auto pb-md no-scrollbar" id="category-tabs"></div>

        <!-- Ingredient Grid -->
        <div class="grid grid-cols-3 gap-sm mt-md" id="ingredient-grid"></div>
      </main>

      <!-- Bottom Navigation Bar -->
      <nav class="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-md pb-lg pt-sm bg-surface-container-lowest dark:bg-surface-container-lowest rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.4)]">
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined">storefront</span>
          <span class="font-label-bold text-label-bold">Market</span>
        </div>
        <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg px-4 py-1 active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>inventory_2</span>
          <span class="font-label-bold text-label-bold">Pantry</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined">skillet</span>
          <span class="font-label-bold text-label-bold">Kitchen</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined">emoji_events</span>
          <span class="font-label-bold text-label-bold">Scoring</span>
        </div>
      </nav>

      <!-- CTA Button Area -->
      <div class="absolute bottom-24 left-0 w-full px-container-padding z-40 pointer-events-none">
        <button id="next-button" class="pointer-events-auto w-full py-lg rounded-2xl bg-primary-container text-on-primary-fixed font-display-lg text-headline-lg-mobile flex items-center justify-center gap-sm shadow-lg button-3d active:scale-95 uppercase tracking-widest cursor-pointer">
          CHOOSE UTENSILS
          <span class="material-symbols-outlined font-bold">arrow_forward</span>
        </button>
      </div>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // Dynamic overlay scaling to match Phaser FIT scale
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

    // Append Chef Avatar Head to Header
    const avatarContainer = this.overlay.querySelector('#chef-avatar-container');
    const chefAvatar = createChefAvatarCanvas(this);
    if (chefAvatar) {
      chefAvatar.className = 'w-full h-full object-cover';
      avatarContainer.appendChild(chefAvatar);
    }

    // Bind footer next button
    this.overlay.querySelector('#next-button').addEventListener('click', () => {
      this.validateAndProceed();
    });

    // Settings
    this.overlay.querySelector('#ingredient-settings-btn').addEventListener('click', () => {
      showSettingsModal(this);
    });

    // Render components
    this.renderCategoryTabs();
    this.renderIngredientGrid();

    // Register safe cleanup
    this.events.once('shutdown', () => {
      this.sys.game.scale.off('resize', resizeOverlay);
      this.shutdown();
    }, this);
    this.events.once('destroy', () => {
      this.sys.game.scale.off('resize', resizeOverlay);
      this.shutdown();
    }, this);
  }

  renderCategoryTabs() {
    const tabsContainer = this.overlay.querySelector('#category-tabs');
    tabsContainer.innerHTML = '';

    const categories = this.game.gameState.contentPack.ingredients.categories;

    CATEGORY_TABS_ORDER.forEach(key => {
      const cat = categories[key];
      if (!cat) return;

      const tabInfo = CATEGORY_TAB_INFO[key] || { label: cat.label, icon: 'flatware' };
      const isActive = this.activeCategory === key;

      const tabBtn = document.createElement('button');
      if (isActive) {
        tabBtn.className = 'flex items-center gap-xs px-md py-2 rounded-full bg-tertiary text-on-tertiary-fixed font-bold shadow-lg whitespace-nowrap active:scale-95 transition-all border border-tertiary-container cursor-pointer';
      } else {
        tabBtn.className = 'flex items-center gap-xs px-md py-2 rounded-full bg-surface-container-high text-on-surface border border-outline-variant/30 hover:bg-surface-variant transition-all whitespace-nowrap active:scale-95 cursor-pointer';
      }

      tabBtn.innerHTML = `
        <span class="material-symbols-outlined text-sm" ${isActive ? 'style="font-variation-settings: \'FILL\' 1;"' : ''}>${tabInfo.icon}</span>
        <span class="font-label-bold text-xs uppercase tracking-wider">${tabInfo.label}</span>
      `;

      tabBtn.addEventListener('click', () => {
        this.activeCategory = key;
        this.renderCategoryTabs();
        this.renderIngredientGrid();
      });

      tabsContainer.appendChild(tabBtn);
    });
  }

  renderIngredientGrid() {
    const grid = this.overlay.querySelector('#ingredient-grid');
    grid.innerHTML = '';

    const category = this.game.gameState.contentPack.ingredients.categories[this.activeCategory];
    const items = category.items;
    const emojiMode = this.game.gameState.emojiMode;
    const hasAtlas = !emojiMode && this.textures.exists('items');

    items.forEach(item => {
      const isSelected = this.selectedIds.includes(item.id);
      const rarity = RARITY_THEMES[item.rarity] || RARITY_THEMES.common;

      const card = document.createElement('div');
      card.className = `ingredient-card bg-surface-container-high rounded-lg flex flex-col items-center overflow-hidden shadow-md relative transition-all duration-200 cursor-pointer border ${isSelected ? 'border-primary ring-1 ring-primary/20 scale-[1.02]' : 'border-outline-variant/50 ' + rarity.hoverBorder}`;
      card.dataset.id = item.id;

      card.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-b ${rarity.gradient} to-transparent ${isSelected ? 'opacity-100' : 'opacity-0'} transition-opacity pointer-events-none"></div>
        <div class="pt-md pb-xs relative z-10 flex items-center justify-center min-h-[58px]" id="img-container-${item.id}">
          <!-- Sprites Canvas or Emoji fallback -->
        </div>
        <h3 class="font-label-bold text-xs mb-xs relative z-10 text-center px-1 leading-tight">${item.name}</h3>
        <div class="w-full flex justify-center pb-sm mt-auto relative z-10">
          <span class="${rarity.badge} px-2 py-0.5 rounded-full font-label-bold text-[9px] uppercase tracking-wider border">
            ${rarity.name}
          </span>
        </div>
      `;

      grid.appendChild(card);

      const imgContainer = card.querySelector(`#img-container-${item.id}`);
      const frameKey = INGREDIENT_FRAME_MAP[item.id];

      if (hasAtlas && frameKey) {
        const frameName = resolveFrame(frameKey);
        const canvas = createTextureCanvas(this, 'items', frameName);
        if (canvas) {
          canvas.className = 'w-14 h-14 object-contain drop-shadow-lg';
          imgContainer.appendChild(canvas);
        }
      } else {
        const emoji = document.createElement('span');
        emoji.className = 'text-3xl drop-shadow-md';
        emoji.textContent = item.icon;
        imgContainer.appendChild(emoji);
      }

      card.addEventListener('click', () => {
        this.toggleSelection(item);
      });
    });

    if (items.length < 3) {
      const lockSlot = document.createElement('div');
      lockSlot.className = 'ingredient-card bg-surface-container-low border border-dashed border-outline-variant/30 flex flex-col items-center justify-center p-sm opacity-40 rounded-lg';
      lockSlot.innerHTML = `
        <span class="material-symbols-outlined text-xl mb-xs">add_circle</span>
        <span class="font-label-bold text-[8px] uppercase tracking-widest text-center">More</span>
      `;
      grid.appendChild(lockSlot);
    }
  }

  toggleSelection(item) {
    const index = this.selectedIds.indexOf(item.id);
    if (index === -1) {
      this.selectedIds.push(item.id);

      // Trigger high-fidelity detail modal reactions
      if (item.onSelect && item.onSelect.message) {
        this.showDetailModal(item, item.onSelect.message);
      }
    } else {
      this.selectedIds.splice(index, 1);
    }

    this.renderIngredientGrid();
  }

  /**
   * Renders the details modal matching the design of ingredient_detail.html
   */
  showDetailModal(item, descriptionMessage = null, onCloseCallback = null) {
    // Remove existing modal if any
    const existing = document.getElementById('detail-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'detail-modal';
    modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-container-padding bg-black/60 modal-blur';

    const rarity = RARITY_THEMES[item.rarity] || RARITY_THEMES.common;
    const frameKey = INGREDIENT_FRAME_MAP[item.id];
    const emojiMode = this.game.gameState.emojiMode;
    const hasAtlas = !emojiMode && this.textures.exists('items');

    modal.innerHTML = `
      <div class="w-full max-w-[200px] bg-surface-container border border-outline-variant rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <!-- Modal Header / Image Section -->
        <div class="relative h-24 common-gradient flex items-center justify-center overflow-hidden">
          <!-- Decorative Pattern -->
          <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(${rarity.bgDot} 1px, transparent 1px); background-size: 10px 10px;"></div>

          <div id="modal-image-container" class="w-16 h-16 flex items-center justify-center transform transition-transform duration-300">
             <!-- Canvas or Emoji goes here -->
          </div>

          <!-- Rarity Chip -->
          <div class="absolute top-1 left-1 bg-surface-container-high/80 backdrop-blur-sm border border-outline-variant px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <div class="w-1.5 h-1.5 rounded-full ${rarity.color.replace('text-', 'bg-')}"></div>
            <span class="font-label-bold text-[8px] text-on-surface tracking-wider uppercase">${rarity.name}</span>
          </div>
        </div>
        <!-- Modal Body -->
        <div class="px-sm pt-3 pb-4 flex flex-col gap-2 text-center">
          <div class="flex flex-col gap-1">
            <h2 class="font-label-bold text-sm text-primary uppercase tracking-wider">${item.name}</h2>
            <div class="h-0.5 w-8 bg-primary mx-auto rounded-full"></div>
          </div>
          <p class="text-[10px] text-on-surface-variant leading-snug">
            "${descriptionMessage || item.tooltip || item.onSelect?.message || 'A fresh and delicious ingredient for your egusi.'}"
          </p>
          <button id="modal-close-btn" class="w-full bg-primary-container text-on-primary-container font-label-bold text-xs py-1.5 rounded-lg shadow-[0_3px_0_#984700] hover:shadow-[0_1px_0_#984700] transition-all transform active:translate-y-0.5 active:shadow-none pressed-effect cursor-pointer uppercase tracking-widest mt-1">
            OKAY
          </button>
        </div>
      </div>
    `;

    document.getElementById('game-container').appendChild(modal);

    // Render texture canvas or emoji in modal
    const imgContainer = modal.querySelector('#modal-image-container');
    if (hasAtlas && frameKey) {
      const frameName = resolveFrame(frameKey);
      const canvas = createTextureCanvas(this, 'items', frameName);
      if (canvas) {
        canvas.className = 'w-16 h-16 object-contain drop-shadow-2xl';
        imgContainer.appendChild(canvas);

        let angle = 0;
        const animInterval = setInterval(() => {
          if (!document.getElementById('detail-modal')) {
            clearInterval(animInterval);
            return;
          }
          angle += 0.05;
          canvas.style.transform = `translateY(${Math.sin(angle) * 3}px)`;
        }, 20);
      }
    } else {
      const emoji = document.createElement('span');
      emoji.className = 'text-3xl drop-shadow-lg';
      emoji.textContent = item.icon;
      imgContainer.appendChild(emoji);
    }

    // Modal click events
    modal.querySelector('#modal-close-btn').addEventListener('click', () => {
      modal.remove();
      if (onCloseCallback) onCloseCallback();
    });

    // Also close on overlay background tap
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
        if (onCloseCallback) onCloseCallback();
      }
    });
  }

  validateAndProceed() {
    const ingredientsData = this.game.gameState.contentPack.ingredients;

    // Check if Egusi is selected
    const hasEgusi = this.selectedIds.includes('egusi');
    if (!hasEgusi) {
      const egusiItem = ingredientsData.categories.bases.items.find(i => i.id === 'egusi');
      const errorMsg = egusiItem ? egusiItem.requiredMessage : 'Egusi is required!';
      this.showDetailModal(egusiItem, errorMsg);
      return;
    }

    // Collect warnings dynamically to show in sequence
    const warnings = [];

    // Check if Palm Oil is selected
    const hasOil = this.selectedIds.includes('palm_oil');
    if (!hasOil) {
      const oilItem = ingredientsData.categories.bases.items.find(i => i.id === 'palm_oil');
      warnings.push({
        item: oilItem,
        msg: 'Egusi cooked without Palm Oil is a kitchen felony. Continue at your own risk!'
      });
    }

    // Check if Onions are selected
    const hasOnions = this.selectedIds.includes('onions');
    if (!hasOnions) {
      const onionsItem = ingredientsData.categories.bases.items.find(i => i.id === 'onions');
      if (onionsItem && onionsItem.onSkip) {
        warnings.push({
          item: onionsItem,
          msg: onionsItem.onSkip.message
        });
      }
    }

    const goToNext = () => {
      this.game.gameState.selectedIngredients = this.selectedIds;
      this.scene.start('UtensilSelectionScene');
    };

    // Chain warning modals sequentially
    if (warnings.length > 0) {
      const showNextWarning = (index) => {
        if (index >= warnings.length) {
          goToNext();
          return;
        }
        const w = warnings[index];
        this.showDetailModal(w.item, w.msg, () => {
          showNextWarning(index + 1);
        });
      };
      showNextWarning(0);
    } else {
      goToNext();
    }
  }

  shutdown() {
    // Remove the HTML selection overlay element to prevent leaks
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    // Remove active modals
    const modal = document.getElementById('detail-modal');
    if (modal) {
      modal.remove();
    }
  }
}
