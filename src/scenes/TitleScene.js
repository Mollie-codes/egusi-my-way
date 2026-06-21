// src/scenes/TitleScene.js
// Bridging screen between Splash → Game. Shows cultural context, emoji toggle, and START button.
// Loads sprite sheet assets when player taps START (in high-quality mode).
import Phaser from 'phaser';
import { createCharacterStickerSprite } from '../utils/StickerEffect.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const manifest = this.game.gameState.contentPack.manifest;
    const config = this.game.gameState.gameConfig;

    // ─── WARM GRADIENT BACKGROUND (same palette as splash) ───
    const gfx = this.add.graphics();
    const w = 480;
    const h = 854;
    const topColor = Phaser.Display.Color.HexStringToColor('#ffffff');    // Deep warm brown
    const bottomColor = Phaser.Display.Color.HexStringToColor('#e8e9ee'); // Dark base
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Phaser.Math.Linear(topColor.red, bottomColor.red, t);
      const g = Phaser.Math.Linear(topColor.green, bottomColor.green, t);
      const b = Phaser.Math.Linear(topColor.blue, bottomColor.blue, t);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      gfx.fillRect(0, y, w, 1);
    }

    // Fade in from black (matching LoadingScene fadeOut)
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ─── TITLE (Logo image or text fallback) ───
    if (this.textures.exists('title-logo')) {
      const logo = this.add.image(240, 60, 'title-logo');
      const logoScale = Math.min(420 / logo.width, 140 / logo.height);
      logo.setScale(logoScale);
      logo.setOrigin(0.5);
    } else {
      this.add.text(240, 50, manifest.displayName.toUpperCase(), {
        fontFamily: 'Chelsea Market',
        fontSize: '26px',
        fontWeight: '800',
        fill: '#ffd700',
        align: 'center',
        wordWrap: { width: 400 },
        stroke: '#8D5524',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }

    // Alternate Title / Subtitle
    this.add.text(240, 110, `"${manifest.alternateTitle}"`, {
      fontFamily: 'Chelsea Market',
      fontSize: '15px',
      fontStyle: 'italic',
      fill: '#ff6b6b',
      align: 'center',
      wordWrap: { width: 400 },
    }).setOrigin(0.5);

    // ─── CULTURAL CONTEXT CARD (Glassmorphism) ───
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0x191428, 0.85);
    cardBg.lineStyle(1, 0xffffff, 0.1);
    cardBg.fillRoundedRect(30, 145, 420, 240, 16);
    cardBg.strokeRoundedRect(30, 145, 420, 240, 16);

    this.add.text(50, 165, '💡 CULTURAL CONTEXT & FACTS', {
      fontFamily: 'Chelsea Market',
      fontSize: '15px',
      fontWeight: '700',
      fill: '#ffd700',
    });

    // Random controversial fact
    const fact = Phaser.Utils.Array.GetRandom(manifest.culturalContext.controversialFacts);
    this.add.text(50, 200, fact, {
      fontFamily: 'Barlow',
      fontSize: '15px',
      fill: '#ffffff',
      wordWrap: { width: 380 },
      lineSpacing: 5,
    });

    // Origin info
    this.add.text(50, 310, `🌍 Origin: ${manifest.culturalContext.origin}`, {
      fontFamily: 'Barlow',
      fontSize: '15px',
      fill: '#a0aec0',
    });

    // Difficulty rating
    const difficultyStars = '⭐'.repeat(manifest.culturalContext.difficulty || 3);
    this.add.text(50, 340, `🔥 Difficulty: ${difficultyStars}`, {
      fontFamily: 'Barlow',
      fontSize: '15px',
      fill: '#a0aec0',
    });

    // ─── LOW BANDWIDTH MODE TOGGLE ───
    const toggleBg = this.add.graphics();
    toggleBg.fillStyle(0x2d2346, 0.8);
    toggleBg.lineStyle(1, 0xffffff, 0.05);
    toggleBg.fillRoundedRect(30, 405, 420, 80, 12);
    toggleBg.strokeRoundedRect(30, 405, 420, 80, 12);

    this.add.text(55, 425, '⚡ Low-Bandwidth Mode (Emoji Only)', {
      fontFamily: 'Barlow',
      fontSize: '15px',
      fontWeight: '600',
      fill: '#ffffff',
    });

    this.add.text(55, 449, 'Disables PNG graphics, loads instantly.', {
      fontFamily: 'Barlow',
      fontSize: '15px',
      fill: '#a0aec0',
    });

    // Checkbox
    const checkboxBorder = this.add.graphics();
    checkboxBorder.lineStyle(2, 0xffd700, 1);
    checkboxBorder.strokeRoundedRect(400, 425, 32, 32, 6);

    const checkFill = this.add.graphics();

    // Toggle interactive zone
    const toggleZone = this.add.zone(240, 445, 420, 80).setInteractive({ useHandCursor: true });

    let emojiMode = this.game.gameState.emojiMode || false;
    const updateCheckbox = () => {
      checkFill.clear();
      if (emojiMode) {
        checkFill.fillStyle(0xffd700, 1);
        checkFill.fillRoundedRect(404, 429, 24, 24, 4);
        checkFill.fillStyle(0x0d0b14, 1);
        // Draw checkmark as two lines
        checkFill.lineStyle(3, 0x0d0b14, 1);
        checkFill.lineBetween(409, 441, 414, 447);
        checkFill.lineBetween(414, 447, 424, 435);
      }
    };
    updateCheckbox();

    toggleZone.on('pointerdown', () => {
      emojiMode = !emojiMode;
      this.game.gameState.emojiMode = emojiMode;
      updateCheckbox();
    });

    // ─── SCORING CRITERIA PREVIEW ───
    const criteriaY = 505;
    const criteriaBg = this.add.graphics();
    criteriaBg.fillStyle(0x191428, 0.6);
    criteriaBg.fillRoundedRect(30, criteriaY, 420, 100, 12);

    this.add.text(50, criteriaY + 12, 'SCORING CRITERIA:', {
      fontFamily: 'Chelsea Market',
      fontSize: '15px',
      fontWeight: '700',
      fill: '#a0aec0',
    });

    config.scoringCriteria.forEach((c, i) => {
      const cx = 50 + (i * 100);
      const cy = criteriaY + 40;
      this.add.text(cx, cy, `${c.icon}`, { fontSize: '20px' });
      this.add.text(cx + 28, cy + 2, c.label, {
        fontFamily: 'Barlow',
        fontSize: '15px',
        fill: '#ffffff',
      });
      this.add.text(cx, cy + 28, `${Math.round(c.weight * 100)}%`, {
        fontFamily: 'Chelsea Market',
        fontSize: '15px',
        fontWeight: '700',
        fill: '#ffd700',
      });
    });

    // ─── PLAY BUTTON ───
    const playBtnBg = this.add.graphics();
    playBtnBg.fillStyle(0x2D6A4F, 1); // Leaf Green
    playBtnBg.fillRoundedRect(30, 640, 420, 58, 14);

    // Subtle glow effect behind button
    const glowBg = this.add.graphics();
    glowBg.fillStyle(0x2D6A4F, 0.2);
    glowBg.fillRoundedRect(24, 634, 432, 70, 18);
    glowBg.setDepth(-1);
    playBtnBg.setDepth(0);

    const playText = this.add.text(240, 669, '🍳  START COOKING', {
      fontFamily: 'Chelsea Market',
      fontSize: '20px',
      fontWeight: '800',
      fill: '#ffffff',
    }).setOrigin(0.5).setDepth(1);

    // Gentle pulse
    this.tweens.add({
      targets: playText,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const playZone = this.add.zone(240, 669, 420, 58).setInteractive({ useHandCursor: true });
    playZone.setDepth(2);

    playZone.on('pointerdown', () => {
      playZone.disableInteractive();
      toggleZone.disableInteractive();

      if (emojiMode) {
        // Instant transition in emoji mode
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('IngredientSelectionScene');
        });
      } else {
        // High Quality: load sprite assets
        playText.setText('⏳ LOADING SPRITES...');
        playText.setFontSize('14px');

        // Progress bar inside button
        const loadBar = this.add.graphics();
        loadBar.setDepth(1);

        this.load.on('progress', (value) => {
          loadBar.clear();
          loadBar.fillStyle(0xffffff, 0.15);
          loadBar.fillRoundedRect(30, 640, 420 * value, 58, 14);

          const pct = Math.round(value * 100);
          playText.setText(`⏳ LOADING SPRITES... ${pct}%`);
        });

        this.load.on('complete', () => {
          playText.setText('✅ READY!');
          this.time.delayedCall(300, () => {
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
              this.scene.start('IngredientSelectionScene');
            });
          });
        });

        // Load PNG Sprite sheets
        this.load.spritesheet('sprites-basic', 'assets/sprites-basic.png', { frameWidth: 256, frameHeight: 384 });
        this.load.atlas('sprites-cooking', 'assets/sprites-cooking.png', 'assets/cooking-sprite.json');
        this.load.atlas('items', 'assets/items-sprite.png', 'assets/items-sprite.json');

        // Load Judge Sprites
        this.load.atlas('grandma-judge-sprite', 'assets/grandma-judge-sprite.png', 'assets/grandma-judge-sprite.json');
        this.load.atlas('food_blogger-judge-sprite', 'assets/food_blogger-judge-sprite.png', 'assets/food_blogger-judge-sprite.json');
        this.load.atlas('hungry_student-judge-sprite', 'assets/hungry_student-judge-sprite.png', 'assets/hungry_student-judge-sprite.json');
        this.load.atlas('restaurant_owner-judge-sprite', 'assets/restaurant_owner-judge-sprite.png', 'assets/restaurant_owner-judge-sprite.json');

        // Load scorecard backgrounds and CTA promo
        this.load.image('scorecard-gold', 'assets/scorecard-gold.png');
        this.load.image('scorecard-modern', 'assets/scorecard-modern.png');
        this.load.image('scorecard-chaotic', 'assets/scorecard-chaotic.png');
        this.load.image('cta-promo', 'assets/cta-promo.png');

        this.load.start();
      }
    });

    // ─── ATTRIBUTION ───
    this.add.text(240, 790, 'A tribute to Nigerian culinary traditions 🇳🇬', {
      fontFamily: 'Barlow',
      fontSize: '15px',
      fill: '#4a3f70',
    }).setOrigin(0.5);
  }
}
