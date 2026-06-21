// src/scenes/TasteScoreScene.js
// Screen 5: Tasting animation bridge between ServingScene and Results.
import Phaser from 'phaser';
import { createCharacterStickerSprite } from '../utils/StickerEffect.js';
import { COLORS, HEX, FONTS, textStyle } from '../ui/theme.js';

function createCookingStateCanvas(scene, frameKey) {
  const texture = scene.textures.get('cooking-states');
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

export class TasteScoreScene extends Phaser.Scene {
  constructor() {
    super('TasteScoreScene');
  }

  create() {
    const gfx = this.add.graphics();
    const w = 480, h = 854;
    const topColor = Phaser.Display.Color.HexStringToColor('#2D1B00');
    const bottomColor = Phaser.Display.Color.HexStringToColor('#0d0b14');
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Phaser.Math.Linear(topColor.red, bottomColor.red, t);
      const g = Phaser.Math.Linear(topColor.green, bottomColor.green, t);
      const b = Phaser.Math.Linear(topColor.blue, bottomColor.blue, t);
      gfx.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      gfx.fillRect(0, y, w, 1);
    }

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ─── BACK BUTTON ───
    const backBtn = this.add.text(40, 30, '← Back', {
      fontFamily: FONTS.label,
      fontSize: '14px',
      fontWeight: '700',
      fill: COLORS.onSurfaceVariant,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ServingScene');
      });
    });

    // ─── HEADER ───
    this.add.text(240, 50, '🍽️ THE MOMENT OF TRUTH', {
      fontFamily: FONTS.heading,
      fontSize: '22px',
      fontWeight: '800',
      fill: COLORS.primary,
    }).setOrigin(0.5);

    this.add.text(240, 85, 'Time to taste what you\'ve created...', {
      fontFamily: FONTS.body,
      fontSize: '15px',
      fontStyle: 'italic',
      fill: COLORS.onSurfaceVariant,
    }).setOrigin(0.5);

    // ─── EGUSI SOUP VISUAL ───
    const potBg = this.add.graphics();
    potBg.fillStyle(0x191428, 0.6);
    potBg.fillRoundedRect(130, 130, 220, 200, 16);

    // Render egusi_soup sprite from cooking-states atlas
    if (this.textures.exists('cooking-states')) {
      const soupCanvas = createCookingStateCanvas(this, 'egusi_soup');
      if (soupCanvas) {
        const soupTex = this.textures.addCanvas('egusi-soup-taste', soupCanvas);
        const soupSprite = this.add.image(240, 215, 'egusi-soup-taste');
        soupSprite.setDisplaySize(100, 100);
      }
    } else {
      this.add.text(240, 210, '🍲', { fontSize: '80px' }).setOrigin(0.5);
    }

    // Steam
    this.time.addEvent({
      delay: 200,
      callback: () => {
        const sx = 240 + (Math.random() * 60 - 30);
        const sy = 170;
        const steam = this.add.text(sx, sy, '~', {
          fontSize: '18px', fill: COLORS.onSurface,
        }).setOrigin(0.5).setAlpha(0.3);
        this.tweens.add({
          targets: steam, y: sy - 60, alpha: 0, scaleX: 1.5,
          duration: 1200, ease: 'Power1', onComplete: () => steam.destroy(),
        });
      },
      loop: true,
    });

    // ─── PLAYER CHARACTER ───
    let playerSprite = null;
    const emojiMode = this.game.gameState.emojiMode;

    if (!emojiMode && this.textures.exists('sprites-cooking')) {
      playerSprite = createCharacterStickerSprite(this, 240, 470, 'IDLE', { width: 70, height: 150 });
      this.tweens.add({ targets: playerSprite, y: 465, duration: 800, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
    } else {
      playerSprite = this.add.text(240, 470, '🧑🏾‍🍳', { fontSize: '80px' }).setOrigin(0.5);
      this.tweens.add({ targets: playerSprite, y: 465, duration: 800, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
    }

    // ─── TASTING SEQUENCE ───
    const tastingMessages = [
      { text: 'Taking a spoonful...', delay: 0 },
      { text: '...chewing thoughtfully...', delay: 1500 },
      { text: '...considering the flavors...', delay: 3000 },
    ];

    const tastingText = this.add.text(240, 580, '', {
      fontFamily: FONTS.body, fontSize: '15px', fontStyle: 'italic', fill: COLORS.onSurface, align: 'center',
    }).setOrigin(0.5);

    tastingMessages.forEach(msg => {
      this.time.delayedCall(msg.delay, () => {
        this.tweens.add({
          targets: tastingText, alpha: 0, duration: 200,
          onComplete: () => {
            tastingText.setText(msg.text);
            this.tweens.add({ targets: tastingText, alpha: 1, duration: 300 });
          },
        });
      });
    });

    // ─── SCORE TEASE ───
    this.time.delayedCall(4500, () => {
      this.cameras.main.flash(300, 255, 215, 0, 0.15);
      this.tweens.add({ targets: tastingText, alpha: 0, duration: 200 });

      const verdictTease = this.add.text(240, 580, '🤔 Hmm...', {
        fontFamily: FONTS.heading, fontSize: '24px', fontWeight: '800', fill: COLORS.primary,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: verdictTease, alpha: 1, scaleX: 1.1, scaleY: 1.1,
        duration: 500, yoyo: true, hold: 800, ease: 'Back.easeOut',
      });

      if (!emojiMode && this.textures.exists('sprites-cooking') && playerSprite.setFrame) {
        playerSprite.setFrame('IDLE');
      }
    });

    // ─── CONTINUE BUTTON ───
    this.time.delayedCall(6500, () => {
      const btnBg = this.add.graphics();
      btnBg.fillStyle(HEX.primary, 1);
      btnBg.fillRoundedRect(80, 680, 320, 54, 14);
      btnBg.setAlpha(0);

      const btnText = this.add.text(240, 707, '⚖️  SEE THE VERDICT', {
        fontFamily: FONTS.heading, fontSize: '16px', fontWeight: '800', fill: COLORS.onPrimaryContainer,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: [btnBg, btnText], alpha: 1, duration: 500, ease: 'Power2' });
      this.tweens.add({ targets: btnText, scaleX: 1.04, scaleY: 1.04, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

      const btnZone = this.add.zone(240, 707, 320, 54).setInteractive({ useHandCursor: true });
      btnZone.on('pointerdown', () => {
        btnZone.disableInteractive();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('ResultsScene'); });
      });
    });

    // Auto-advance
    this.time.delayedCall(10000, () => {
      if (this.scene.isActive('TasteScoreScene')) {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('ResultsScene'); });
      }
    });

    // Floating ingredients
    ['🧅', '🌶️', '🥬', '🍅', '🧄'].forEach((emoji, i) => {
      const fx = 40 + Math.random() * 400;
      const fy = 650 + Math.random() * 150;
      const floater = this.add.text(fx, fy, emoji, { fontSize: '16px' }).setOrigin(0.5).setAlpha(0.15);
      this.tweens.add({ targets: floater, y: fy - 30, alpha: 0.08, duration: 3000 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }
}
