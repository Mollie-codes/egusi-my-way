// src/ui/BasketHUD.js
// Horizontal basket panel HUD showing selected ingredients as sprite icons.
// 90% screen width, 60px height, dark semi-transparent background.

import Phaser from 'phaser';
import { resolveFrame } from '../utils/ItemData.js';

/**
 * Ingredient ID → items atlas frame name mapping.
 * Maps content-pack ingredient IDs (lowercase) to atlas frame keys (UPPER_SNAKE_CASE).
 * resolveFrame() handles fallback substitution for pending-art frames.
 */
const INGREDIENT_FRAME_MAP = {
  // Base ingredients
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
};

export class BasketHUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [config]
   * @param {number} [config.y=790] - Y position (bottom of screen)
   * @param {number} [config.maxSlots=8] - Max visible slots
   * @param {number} [config.depth=50] - Render depth
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.y = config.y ?? 790;
    this.maxSlots = config.maxSlots ?? 8;
    this.depth = config.depth ?? 50;

    this.panelWidth = 480 * 0.9; // 90% of screen width
    this.panelHeight = 60;
    this.panelX = 240; // center
    this.slotSize = 48;

    this.container = scene.add.container(this.panelX, this.y);
    this.container.setDepth(this.depth);
    this.itemContainers = [];

    this._buildPanel();
  }

  _buildPanel() {
    const hw = this.panelWidth / 2;
    const hh = this.panelHeight / 2;

    // Dark semi-transparent background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRoundedRect(-hw, -hh, this.panelWidth, this.panelHeight, 10);
    this.container.add(bg);

    // Slot dividers
    const dividers = this.scene.add.graphics();
    dividers.lineStyle(1, 0xffffff, 0.08);
    const slotSpacing = this.panelWidth / this.maxSlots;
    for (let i = 1; i < this.maxSlots; i++) {
      const dx = -hw + i * slotSpacing;
      dividers.lineBetween(dx, -hh + 6, dx, hh - 6);
    }
    this.container.add(dividers);

    // "BASKET" label
    const label = this.scene.add.text(-hw + 8, -hh - 18, '🧺 BASKET', {
      fontFamily: 'Chelsea Market',
      fontSize: '15px',
      fontWeight: '700',
      fill: '#a0aec0',
    });
    this.container.add(label);
  }

  /**
   * Update basket display with current ingredient list.
   * @param {string[]} ingredientIds - Array of ingredient IDs
   * @param {object} ingredientsData - The ingredients content pack data
   */
  update(ingredientIds, ingredientsData) {
    // Clear existing item sprites
    this.itemContainers.forEach(c => c.destroy());
    this.itemContainers = [];

    const hw = this.panelWidth / 2;
    const slotSpacing = this.panelWidth / this.maxSlots;
    const useSpriteSheet = this.scene.textures.exists('items');

    ingredientIds.forEach((id, index) => {
      if (index >= this.maxSlots) return;

      const sx = -hw + index * slotSpacing + slotSpacing / 2;
      const sy = 0;

      const frameKey = INGREDIENT_FRAME_MAP[id];

      if (useSpriteSheet && frameKey) {
        // Use sprite from items atlas with subtle glow
        const frameName = resolveFrame(frameKey);
        const glowG = this.scene.add.graphics();
        glowG.fillStyle(0xffd700, 0.08);
        glowG.fillCircle(sx, sy, this.slotSize / 2 + 2);
        this.container.add(glowG);
        this.itemContainers.push(glowG);

        const sprite = this.scene.add.sprite(sx, sy, 'items', frameName);
        sprite.setDisplaySize(this.slotSize - 8, this.slotSize - 8);
        this.container.add(sprite);
        this.itemContainers.push(sprite);
      } else {
        // Fallback: find emoji from content pack
        let icon = '🟡';
        if (ingredientsData) {
          for (const cat of Object.values(ingredientsData.categories)) {
            const found = cat.items.find(item => item.id === id);
            if (found) { icon = found.icon; break; }
          }
        }
        const emojiText = this.scene.add.text(sx, sy, icon, {
          fontSize: '24px',
        }).setOrigin(0.5);
        this.container.add(emojiText);
        this.itemContainers.push(emojiText);
      }
    });

    // Fill remaining slots with empty indicators
    for (let i = ingredientIds.length; i < this.maxSlots; i++) {
      const sx = -hw + i * slotSpacing + slotSpacing / 2;
      const emptySlot = this.scene.add.graphics();
      emptySlot.lineStyle(1, 0xffffff, 0.06);
      emptySlot.strokeRoundedRect(sx - 18, -18, 36, 36, 4);
      this.container.add(emptySlot);
      this.itemContainers.push(emptySlot);
    }
  }

  /**
   * Flash an item slot to indicate it was just added.
   * @param {number} slotIndex
   */
  flashSlot(slotIndex) {
    if (slotIndex < this.itemContainers.length) {
      const target = this.itemContainers[slotIndex];
      this.scene.tweens.add({
        targets: target,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
  }

  /**
   * Show/hide the basket panel.
   */
  setVisible(visible) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }
}
