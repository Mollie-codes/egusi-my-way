// src/ui/DialogueBox.js
// Reusable themed dialogue box component for the Efo Egusi game.
// Variants: trader (green), judge (gold), warning (red + shake), narration (blue)

import Phaser from 'phaser';

/**
 * @typedef {'trader'|'judge'|'warning'|'narration'|'default'} DialogueVariant
 */

const VARIANT_STYLES = {
  default: {
    fillColor: 0xFFF8E7,      // Warm cream
    fillAlpha: 0.95,
    borderColor: 0x333333,     // Dark brown
    borderAlpha: 1,
    borderWidth: 2,
    textColor: '#333333',
    nameColor: '#8D5524',
    cornerTickColor: 0x333333,
  },
  trader: {
    fillColor: 0xF0FFF0,
    fillAlpha: 0.95,
    borderColor: 0x2D6A4F,     // Green
    borderAlpha: 1,
    borderWidth: 2,
    textColor: '#333333',
    nameColor: '#2D6A4F',
    cornerTickColor: 0x2D6A4F,
  },
  judge: {
    fillColor: 0xFFF8E0,
    fillAlpha: 0.95,
    borderColor: 0xDAA520,     // Gold
    borderAlpha: 1,
    borderWidth: 2,
    textColor: '#333333',
    nameColor: '#DAA520',
    cornerTickColor: 0xDAA520,
  },
  warning: {
    fillColor: 0xFFF0F0,
    fillAlpha: 0.95,
    borderColor: 0xCC3333,     // Red
    borderAlpha: 1,
    borderWidth: 2,
    textColor: '#333333',
    nameColor: '#CC3333',
    cornerTickColor: 0xCC3333,
  },
  narration: {
    fillColor: 0xF0F4FF,
    fillAlpha: 0.95,
    borderColor: 0x3366CC,     // Blue
    borderAlpha: 1,
    borderWidth: 2,
    textColor: '#333333',
    nameColor: '#3366CC',
    cornerTickColor: 0x3366CC,
  },
};

export class DialogueBox {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [config]
   * @param {number} [config.x=240] - Center X
   * @param {number} [config.y=750] - Center Y
   * @param {number} [config.width=400] - Box width
   * @param {number} [config.height=80] - Box height
   * @param {number} [config.depth=200] - Render depth
   * @param {DialogueVariant} [config.variant='default']
   * @param {'left'|'right'|'center'|'none'} [config.tailPosition='left']
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.x = config.x ?? 240;
    this.y = config.y ?? 750;
    this.width = config.width ?? 400;
    this.height = config.height ?? 80;
    this.depth = config.depth ?? 200;
    this.variant = config.variant ?? 'default';
    this.tailPosition = config.tailPosition ?? 'left';
    this.padding = 20;

    this.container = scene.add.container(this.x, this.y);
    this.container.setDepth(this.depth);
    this.container.setAlpha(0);

    this.elements = [];
    this.isVisible = false;
    this.typewriteTimer = null;

    this._build();
  }

  _getStyle() {
    return VARIANT_STYLES[this.variant] || VARIANT_STYLES.default;
  }

  _build() {
    const s = this._getStyle();
    const hw = this.width / 2;
    const hh = this.height / 2;

    // Inner shadow (subtle darker rect behind)
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.06);
    shadow.fillRoundedRect(-hw + 2, -hh + 2, this.width, this.height, 12);
    this.container.add(shadow);

    // Main fill
    this.bgGraphics = this.scene.add.graphics();
    this.bgGraphics.fillStyle(s.fillColor, s.fillAlpha);
    this.bgGraphics.fillRoundedRect(-hw, -hh, this.width, this.height, 12);
    this.bgGraphics.lineStyle(s.borderWidth, s.borderColor, s.borderAlpha);
    this.bgGraphics.strokeRoundedRect(-hw, -hh, this.width, this.height, 12);
    this.container.add(this.bgGraphics);

    // Corner ticks (decorative)
    const tickG = this.scene.add.graphics();
    tickG.lineStyle(2, s.cornerTickColor, 0.6);
    const tickLen = 10;
    // Top-left
    tickG.lineBetween(-hw - 2, -hh + tickLen, -hw - 2, -hh - 2);
    tickG.lineBetween(-hw - 2, -hh - 2, -hw + tickLen, -hh - 2);
    // Top-right
    tickG.lineBetween(hw + 2, -hh + tickLen, hw + 2, -hh - 2);
    tickG.lineBetween(hw + 2, -hh - 2, hw - tickLen, -hh - 2);
    // Bottom-left
    tickG.lineBetween(-hw - 2, hh - tickLen, -hw - 2, hh + 2);
    tickG.lineBetween(-hw - 2, hh + 2, -hw + tickLen, hh + 2);
    // Bottom-right
    tickG.lineBetween(hw + 2, hh - tickLen, hw + 2, hh + 2);
    tickG.lineBetween(hw + 2, hh + 2, hw - tickLen, hh + 2);
    this.container.add(tickG);

    // Tail triangle
    if (this.tailPosition !== 'none') {
      const tailG = this.scene.add.graphics();
      tailG.fillStyle(s.fillColor, s.fillAlpha);
      tailG.lineStyle(s.borderWidth, s.borderColor, s.borderAlpha);

      let tx = 0;
      if (this.tailPosition === 'left') tx = -hw + 40;
      else if (this.tailPosition === 'right') tx = hw - 40;

      // Small triangle pointing down
      tailG.fillTriangle(tx - 8, hh, tx + 8, hh, tx, hh + 12);
      // Stroke only the two angled sides
      tailG.lineBetween(tx - 8, hh, tx, hh + 12);
      tailG.lineBetween(tx + 8, hh, tx, hh + 12);
      this.container.add(tailG);
    }

    // Speaker name text (optional, set via show())
    this.nameText = this.scene.add.text(-hw + this.padding, -hh + 8, '', {
      fontFamily: 'Chelsea Market',
      fontSize: '15px',
      fontWeight: '800',
      fill: s.nameColor,
    });
    this.container.add(this.nameText);

    // Message text
    this.messageText = this.scene.add.text(-hw + this.padding, -hh + 32, '', {
      fontFamily: 'Barlow',
      fontSize: '16px',
      fill: s.textColor,
      wordWrap: { width: this.width - this.padding * 2 },
      lineSpacing: 3,
    });
    this.container.add(this.messageText);
  }

  /**
   * Show the dialogue box with text.
   * @param {string} message - The dialogue text
   * @param {object} [opts]
   * @param {string} [opts.speaker] - Speaker name (shown in bold above message)
   * @param {boolean} [opts.typewrite=false] - Whether to typewrite the text
   * @param {number} [opts.typewriteSpeed=30] - ms per character
   * @param {Function} [opts.onComplete] - Called when typewrite finishes or immediately if not typewriting
   */
  show(message, opts = {}) {
    const { speaker, typewrite = false, typewriteSpeed = 30, onComplete } = opts;

    this.isVisible = true;

    if (speaker) {
      this.nameText.setText(speaker.toUpperCase());
    } else {
      this.nameText.setText('');
    }

    if (typewrite) {
      this.messageText.setText('');
      this._typewrite(message, typewriteSpeed, onComplete);
    } else {
      this.messageText.setText(message);
      if (onComplete) onComplete();
    }

    // Fade in
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      y: this.y,
      duration: 250,
      ease: 'Back.easeOut',
    });

    // Warning variant gets a shake
    if (this.variant === 'warning') {
      this.scene.tweens.add({
        targets: this.container,
        x: this.x - 4,
        duration: 50,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          this.container.x = this.x;
        },
      });
    }
  }

  /**
   * Typewrite text character by character.
   */
  _typewrite(fullText, speed, onComplete) {
    if (this.typewriteTimer) {
      this.typewriteTimer.destroy();
    }

    let charIndex = 0;
    this.typewriteTimer = this.scene.time.addEvent({
      delay: speed,
      callback: () => {
        charIndex++;
        this.messageText.setText(fullText.substring(0, charIndex));
        if (charIndex >= fullText.length) {
          this.typewriteTimer.destroy();
          this.typewriteTimer = null;
          if (onComplete) onComplete();
        }
      },
      loop: true,
    });
  }

  /**
   * Hide the dialogue box.
   * @param {Function} [onComplete] - Called after fade out
   */
  hide(onComplete) {
    if (this.typewriteTimer) {
      this.typewriteTimer.destroy();
      this.typewriteTimer = null;
    }
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.isVisible = false;
        if (onComplete) onComplete();
      },
    });
  }

  /**
   * Change the variant style and rebuild.
   * @param {DialogueVariant} variant
   */
  setVariant(variant) {
    this.variant = variant;
    this.container.removeAll(true);
    this._build();
  }

  /**
   * Update position.
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y);
  }

  /**
   * Destroy the dialogue box and all its elements.
   */
  destroy() {
    if (this.typewriteTimer) {
      this.typewriteTimer.destroy();
    }
    this.container.destroy();
  }
}
