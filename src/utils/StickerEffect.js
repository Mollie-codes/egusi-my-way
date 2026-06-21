// src/utils/StickerEffect.js
// Renders sprites with a thick white border "sticker" effect
// by drawing offset white-tinted copies behind the original sprite.

import Phaser from 'phaser';

/**
 * Creates a sprite with a thick white border (sticker effect).
 * Draws 8 white-tinted copies at offsets around the sprite, then the original on top.
 *
 * @param {Phaser.Scene} scene - The scene to add the sticker sprite to
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} textureKey - The texture atlas/spritesheet key
 * @param {number|string} frame - Frame index or name
 * @param {object} [options] - Configuration options
 * @param {number} [options.displayWidth=64] - Display width
 * @param {number} [options.displayHeight=96] - Display height
 * @param {number} [options.borderWidth=3] - White border thickness in pixels
 * @param {number} [options.borderColor=0xffffff] - Border tint color
 * @param {number} [options.borderAlpha=1] - Border opacity
 * @returns {Phaser.GameObjects.Container} Container with sticker sprite
 */
export function createStickerSprite(scene, x, y, textureKey, frame, options = {}) {
  const {
    displayWidth = 64,
    displayHeight = 96,
    borderWidth = 3,
    borderColor = 0xffffff,
    borderAlpha = 1,
  } = options;

  const container = scene.add.container(x, y);

  // 8 directional offsets for the border
  const offsets = [
    { x: -borderWidth, y: 0 },
    { x: borderWidth, y: 0 },
    { x: 0, y: -borderWidth },
    { x: 0, y: borderWidth },
    { x: -borderWidth, y: -borderWidth },
    { x: borderWidth, y: -borderWidth },
    { x: -borderWidth, y: borderWidth },
    { x: borderWidth, y: borderWidth },
  ];

  // Draw white-tinted offset copies (the border)
  offsets.forEach(offset => {
    const borderSprite = scene.add.sprite(offset.x, offset.y, textureKey, frame);
    borderSprite.setDisplaySize(displayWidth, displayHeight);
    borderSprite.setTint(borderColor);
    borderSprite.setAlpha(borderAlpha);
    borderSprite.setOrigin(0.5);
    container.add(borderSprite);
  });

  // Draw the original sprite on top
  const mainSprite = scene.add.sprite(0, 0, textureKey, frame);
  mainSprite.setDisplaySize(displayWidth, displayHeight);
  mainSprite.setOrigin(0.5);
  container.add(mainSprite);

  // Store reference to main sprite for frame changes
  container.mainSprite = mainSprite;
  container.borderSprites = container.list.slice(0, 8);
  container.textureKey = textureKey;

  /**
   * Change the displayed frame on both the main sprite and all border copies.
   * @param {number|string} newFrame
   */
  container.setFrame = function (newFrame) {
    mainSprite.setFrame(newFrame);
    container.borderSprites.forEach(bs => bs.setFrame(newFrame));
  };

  /**
   * Update the display size of main + border sprites.
   * @param {number} w
   * @param {number} h
   */
  container.setSpriteSize = function (w, h) {
    mainSprite.setDisplaySize(w, h);
    container.borderSprites.forEach(bs => bs.setDisplaySize(w, h));
  };

  /**
   * Set alpha on the main sprite (not the border).
   * @param {number} alpha
   */
  container.setSpriteAlpha = function (alpha) {
    mainSprite.setAlpha(alpha);
  };

  return container;
}

/**
 * Creates a sticker-effect sprite from the items-sprite sheet.
 * Convenience wrapper with item-appropriate defaults.
 */
export function createItemStickerSprite(scene, x, y, frame, size = 48) {
  return createStickerSprite(scene, x, y, 'items', frame, {
    displayWidth: size,
    displayHeight: size,
    borderWidth: 2,
  });
}

/**
 * Creates a sticker-effect character sprite from the cooking sprite sheet.
 * Convenience wrapper with character-appropriate defaults.
 */
export function createCharacterStickerSprite(scene, x, y, frame, options = {}) {
  const { width = 90, height = 134 } = options;
  return createStickerSprite(scene, x, y, 'sprites-cooking', frame, {
    displayWidth: width,
    displayHeight: height,
    borderWidth: 3,
  });
}

/**
 * Creates a sticker-effect NPC sprite from the basic sprite sheet.
 * Convenience wrapper for judges, traders, etc.
 */
export function createNPCStickerSprite(scene, x, y, frame, options = {}) {
  const { width = 64, height = 96 } = options;
  return createStickerSprite(scene, x, y, 'sprites-basic', frame, {
    displayWidth: width,
    displayHeight: height,
    borderWidth: 3,
  });
}
