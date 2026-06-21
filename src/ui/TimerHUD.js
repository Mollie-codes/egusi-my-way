// src/ui/TimerHUD.js
// Timer HUD element - pill-shaped, top-right corner.
// Turns red and pulses when < 30 seconds remaining.

import Phaser from 'phaser';

export class TimerHUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} [config]
   * @param {number} [config.x=420] - X position
   * @param {number} [config.y=35] - Y position
   * @param {number} [config.depth=60] - Render depth
   * @param {number} [config.warningThreshold=30] - Seconds threshold for red pulse
   */
  constructor(scene, config = {}) {
    this.scene = scene;
    this.x = config.x ?? 420;
    this.y = config.y ?? 35;
    this.depth = config.depth ?? 60;
    this.warningThreshold = config.warningThreshold ?? 30;

    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.isWarning = false;
    this.onComplete = null;
    this.updateEvent = null;
    this.pulseTween = null;

    this.container = scene.add.container(this.x, this.y);
    this.container.setDepth(this.depth);

    this._build();
  }

  _build() {
    // Pill-shaped background
    this.bgGraphics = this.scene.add.graphics();
    this._drawBg(false);
    this.container.add(this.bgGraphics);

    // Clock icon
    this.clockIcon = this.scene.add.text(-32, 0, '🕐', {
      fontSize: '16px',
    }).setOrigin(0.5);
    this.container.add(this.clockIcon);

    // Time text
    this.timeText = this.scene.add.text(8, 0, '0:00', {
      fontFamily: 'Chelsea Market',
      fontSize: '18px',
      fontWeight: '800',
      fill: '#ffffff',
    }).setOrigin(0.5);
    this.container.add(this.timeText);
  }

  _drawBg(isWarning) {
    this.bgGraphics.clear();
    if (isWarning) {
      this.bgGraphics.fillStyle(0xCC2222, 0.85);
      this.bgGraphics.lineStyle(2, 0xFF4444, 1);
    } else {
      this.bgGraphics.fillStyle(0x000000, 0.7);
      this.bgGraphics.lineStyle(1, 0xffffff, 0.15);
    }
    this.bgGraphics.fillRoundedRect(-48, -16, 96, 32, 16);
    this.bgGraphics.strokeRoundedRect(-48, -16, 96, 32, 16);
  }

  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Start the timer counting down from the given duration.
   * @param {number} durationSeconds - Total seconds to count down
   * @param {Function} [onComplete] - Called when timer reaches zero
   */
  start(durationSeconds, onComplete) {
    this.totalSeconds = durationSeconds;
    this.remainingSeconds = durationSeconds;
    this.isRunning = true;
    this.isPaused = false;
    this.onComplete = onComplete;
    this.isWarning = false;

    this.timeText.setText(this._formatTime(this.remainingSeconds));
    this._drawBg(false);

    // Stop existing update event
    if (this.updateEvent) {
      this.updateEvent.destroy();
    }

    // Update every 100ms for smooth countdown
    this.updateEvent = this.scene.time.addEvent({
      delay: 100,
      callback: () => this._tick(0.1),
      loop: true,
    });
  }

  /**
   * Start counting UP (elapsed time display).
   */
  startCountUp() {
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.isRunning = true;
    this.isPaused = false;

    this.timeText.setText(this._formatTime(0));

    if (this.updateEvent) {
      this.updateEvent.destroy();
    }

    this.updateEvent = this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.isPaused) {
          this.remainingSeconds += 0.1;
          this.timeText.setText(this._formatTime(this.remainingSeconds));
        }
      },
      loop: true,
    });
  }

  _tick(delta) {
    if (this.isPaused || !this.isRunning) return;

    this.remainingSeconds -= delta;

    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      this.isRunning = false;
      this.timeText.setText('0:00');
      if (this.updateEvent) {
        this.updateEvent.destroy();
        this.updateEvent = null;
      }
      if (this.onComplete) this.onComplete();
      return;
    }

    this.timeText.setText(this._formatTime(this.remainingSeconds));

    // Warning state
    if (this.remainingSeconds <= this.warningThreshold && !this.isWarning) {
      this.isWarning = true;
      this._drawBg(true);
      this.timeText.setFill('#ffffff');

      // Start pulse animation
      this.pulseTween = this.scene.tweens.add({
        targets: this.container,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Pause the timer.
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume a paused timer.
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Stop the timer completely.
   */
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.updateEvent) {
      this.updateEvent.destroy();
      this.updateEvent = null;
    }
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
      this.container.setScale(1);
    }
  }

  /**
   * Get remaining seconds.
   * @returns {number}
   */
  getRemaining() {
    return this.remainingSeconds;
  }

  /**
   * Set visibility.
   */
  setVisible(visible) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.stop();
    this.container.destroy();
  }
}
