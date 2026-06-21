// ============================================
// PlayerAnimator.js
// Maps game states to sprite frames and handles animation
// ============================================

export class PlayerAnimator {
  constructor(spriteManager) {
    this.sm = spriteManager;
    
    // Current state
    this.currentSheet = 'cooking';
    this.currentFrame = 'IDLE';
    this.direction = 'down';
    this.isWalking = false;
    this.isPanicking = false;
    
    // Animation timing
    this.frameTimer = 0;
    this.frameRate = 150; // ms per frame for walk cycle
    this.walkFrame = 0;
    
    // Bob animation for idle
    this.bobTimer = 0;
    this.bobOffset = 0;
    this.bobSpeed = 2000; // ms for full bob cycle
    this.bobAmount = 3;   // pixels
    
    // One-shot animation state
    this.oneShot = null;
    this.oneShotTimer = 0;
    this.oneShotDuration = 1000;
    this.onOneShotComplete = null;
  }

  /**
   * Update animation state (call every frame with deltaTime in ms)
   */
  update(deltaTime) {
    // Handle one-shot animations first
    if (this.oneShot) {
      this.oneShotTimer += deltaTime;
      if (this.oneShotTimer >= this.oneShotDuration) {
        this.oneShot = null;
        this.oneShotTimer = 0;
        if (this.onOneShotComplete) {
          const callback = this.onOneShotComplete;
          this.onOneShotComplete = null;
          callback();
        }
      }
      return; // Don't update other animations during one-shot
    }
    
    // Update walk cycle
    if (this.isWalking) {
      this.frameTimer += deltaTime;
      if (this.frameTimer >= this.frameRate) {
        this.frameTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % 2; // 2-frame walk cycle
      }
      this.bobTimer = 0;
    } else {
      // Idle bob
      this.bobTimer += deltaTime;
      this.bobOffset = Math.sin(this.bobTimer / this.bobSpeed * Math.PI * 2) * this.bobAmount;
      this.walkFrame = 0;
    }
  }

  /**
   * Set walking state
   */
  walk(direction) {
    this.isWalking = true;
    this.direction = direction;
    this.currentSheet = 'cooking';
    
    switch (direction) {
      case 'up':    this.currentFrame = 'WALK_UP'; break;
      case 'down':  this.currentFrame = 'WALK_DOWN'; break;
      case 'left':  this.currentFrame = 'WALK_LEFT'; break;
      case 'right': this.currentFrame = 'WALK_RIGHT'; break;
    }
  }

  /**
   * Set idle state
   */
  idle(direction = null) {
    this.isWalking = false;
    if (direction) this.direction = direction;
    this.currentSheet = 'cooking';
    this.currentFrame = 'IDLE';
  }

  /**
   * Play a one-shot animation (overrides walk/idle temporarily)
   */
  playAction(action, duration = 1000, onComplete = null) {
    this.oneShot = action;
    this.oneShotTimer = 0;
    this.oneShotDuration = duration;
    this.onOneShotComplete = onComplete;
    this.currentSheet = 'cooking';
    
    switch (action) {
      case 'wave':   this.currentFrame = 'WAVE'; break;
      case 'pickup': this.currentFrame = 'IDLE'; break;
      case 'chop':   this.currentFrame = 'IDLE'; break;
      case 'stir':   this.currentFrame = 'IDLE'; break;
      case 'taste':  this.currentFrame = 'IDLE'; break;
      case 'serve':  this.currentFrame = 'IDLE'; break;
      case 'panic':  this.currentFrame = 'IDLE'; break;
    }
  }

  /**
   * Set panic mode (persistent until cleared)
   */
  setPanic(panicking = true) {
    this.isPanicking = panicking;
    if (panicking) {
      this.currentSheet = 'cooking';
      this.currentFrame = 'IDLE';
      this.isWalking = false;
    }
  }

  /**
   * Get the current frame to render
   */
  getCurrentFrame() {
    if (this.oneShot) {
      return { sheetId: this.currentSheet, frameKey: this.currentFrame };
    }
    
    if (this.isPanicking) {
      return { sheetId: 'cooking', frameKey: 'IDLE' };
    }
    
    return {
      sheetId: this.currentSheet,
      frameKey: this.currentFrame
    };
  }

  /**
   * Draw the player at the given position
   */
  draw(ctx, x, y, scale = 2) {
    const frame = this.getCurrentFrame();
    const flipH = this.direction === 'left';
    
    // Apply idle bob offset
    const drawY = y + (this.bobOffset * scale);
    
    this.sm.drawFrame(ctx, frame.sheetId, frame.frameKey, x, drawY, {
      scale: scale,
      flipHorizontal: flipH,
      centered: true
    });
  }
}