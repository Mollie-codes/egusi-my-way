import { SpriteManager } from './SpriteManager.js';
import { PlayerAnimator } from './PlayerAnimator.js';

// ─── Initialize Sprite System ───
export const spriteManager = new SpriteManager();
export const playerAnimator = new PlayerAnimator(spriteManager);

// ─── Game States & Their Sprite Mappings ───
export const GAME_STATE_SPRITES = {
  // SCREEN 1: Loading
  loading: {
    player: { sheet: 'cooking', frame: 'WAVE', anim: 'looping_wave' },
    background: null // CSS gradient
  },

  // SCREEN 2: Market Dash
  marketDash: {
    player: {
      idle:    { sheet: 'cooking', frame: 'IDLE' },
      walkUp:  { sheet: 'cooking', frame: 'WALK_UP' },
      walkDown:{ sheet: 'cooking', frame: 'WALK_DOWN' },
      walkLeft:{ sheet: 'cooking', frame: 'WALK_LEFT' },
      walkRight:{ sheet: 'cooking', frame: 'WALK_RIGHT' },
      pickup:  { sheet: 'cooking', frame: 'IDLE', duration: 800 },
      panic:   { sheet: 'cooking', frame: 'IDLE' },
    },
    traders: {
      // Each trader uses basic sprite sheet with different frames
      mamaNkechi: {
        idle:    { sheet: 'basic', frame: 'THREEQ_LEFT_NEUTRAL' },
        greet:   { sheet: 'basic', frame: 'THREEQ_LEFT_SMILE' },
        talking: { sheet: 'basic', frame: 'THREEQ_LEFT_TALKING' },
        happy:   { sheet: 'basic', frame: 'THREEQ_LEFT_HAPPY' },
      },
      iyaIbeji: {
        idle:    { sheet: 'basic', frame: 'FRONT_NEUTRAL' },
        greet:   { sheet: 'basic', frame: 'FRONT_SMILE' },
        talking: { sheet: 'basic', frame: 'FRONT_TALKING' },
        happy:   { sheet: 'basic', frame: 'FRONT_HAPPY' },
      },
      alhajiTanko: {
        idle:    { sheet: 'basic', frame: 'THREEQ_LEFT_NEUTRAL' },
        greet:   { sheet: 'basic', frame: 'THREEQ_LEFT_SMILE' },
        talking: { sheet: 'basic', frame: 'THREEQ_LEFT_TALKING' },
        happy:   { sheet: 'basic', frame: 'THREEQ_LEFT_HAPPY' },
      },
      mamaBose: {
        idle:    { sheet: 'basic', frame: 'SIDE_LEFT_NEUTRAL' },
        greet:   { sheet: 'basic', frame: 'SIDE_LEFT_SMILE' },
        talking: { sheet: 'basic', frame: 'SIDE_LEFT_TALKING' },
        happy:   { sheet: 'basic', frame: 'SIDE_LEFT_HAPPY' },
      },
      chiefOkonkwo: {
        idle:    { sheet: 'basic', frame: 'FRONT_NEUTRAL' },
        greet:   { sheet: 'basic', frame: 'FRONT_SMILE' },
        talking: { sheet: 'basic', frame: 'FRONT_TALKING' },
        happy:   { sheet: 'basic', frame: 'FRONT_HAPPY' },
      },
      mallamGambo: {
        idle:    { sheet: 'basic', frame: 'THREEQ_LEFT_NEUTRAL' },
        greet:   { sheet: 'basic', frame: 'THREEQ_LEFT_SMILE' },
        talking: { sheet: 'basic', frame: 'THREEQ_LEFT_TALKING' },
        happy:   { sheet: 'basic', frame: 'THREEQ_LEFT_HAPPY' },
      },
    }
  },

  // SCREEN 3: Utensil Selection (no character walking, just UI)
  utensilSelection: {
    player: { sheet: 'cooking', frame: 'IDLE' },
  },

  // SCREEN 4: Kitchen Hub
  kitchenHub: {
    player: {
      idle:    { sheet: 'cooking', frame: 'IDLE' },
      walkUp:  { sheet: 'cooking', frame: 'WALK_UP' },
      walkDown:{ sheet: 'cooking', frame: 'WALK_DOWN' },
      walkLeft:{ sheet: 'cooking', frame: 'WALK_LEFT' },
      walkRight:{ sheet: 'cooking', frame: 'WALK_RIGHT' },
      pickup:  { sheet: 'cooking', frame: 'IDLE', duration: 800 },
    },
    visitor: {
      idle:    { sheet: 'basic', frame: 'SIDE_LEFT_NEUTRAL' },
      talking: { sheet: 'basic', frame: 'SIDE_LEFT_TALKING' },
      smile:   { sheet: 'basic', frame: 'SIDE_LEFT_SMILE' },
    }
  },

  // SCREEN 4a: Washing Area
  washingArea: {
    player: {
      wash: { sheet: 'cooking', frame: 'IDLE' }, // Reusing IDLE for wash motion
      panic:{ sheet: 'cooking', frame: 'IDLE' },
    }
  },

  // SCREEN 4b: Prep Station
  prepStation: {
    player: {
      chop: { sheet: 'cooking', frame: 'IDLE', anim: 'looping' },
      pickup:{ sheet: 'cooking', frame: 'IDLE', duration: 500 },
      panic:{ sheet: 'cooking', frame: 'IDLE' },
    }
  },

  // SCREEN 4c: Cooking Stove
  cookingStove: {
    player: {
      stir:  { sheet: 'cooking', frame: 'IDLE', anim: 'looping' },
      taste: { sheet: 'cooking', frame: 'IDLE', duration: 1200 },
      serve: { sheet: 'cooking', frame: 'IDLE', duration: 2000 },
      panic: { sheet: 'cooking', frame: 'IDLE', anim: 'looping' },
    }
  },

  // SCREEN 5: Taste & Score
  tasteScore: {
    player: {
      taste: { sheet: 'cooking', frame: 'IDLE', duration: 1500 },
      serve: { sheet: 'cooking', frame: 'IDLE', duration: 2500 },
    }
  },

  // SCREEN 6: Results
  results: {
    player: {
      serve:  { sheet: 'cooking', frame: 'IDLE', duration: 3000 },
      wave:   { sheet: 'cooking', frame: 'WAVE', duration: 1500 },
    },
    judges: {
      grandma:       { sheet: 'basic', frame: 'FRONT_SMILE', talking: 'FRONT_TALKING', happy: 'FRONT_HAPPY' },
      foodBlogger:   { sheet: 'basic', frame: 'FRONT_SMILE', talking: 'FRONT_TALKING', happy: 'FRONT_HAPPY' },
      hungryStudent: { sheet: 'basic', frame: 'FRONT_NEUTRAL', talking: 'FRONT_TALKING', happy: 'FRONT_HAPPY' },
      restaurantOwner:{ sheet: 'basic', frame: 'FRONT_SMILE', talking: 'FRONT_TALKING', happy: 'FRONT_HAPPY' },
    }
  },
};

// ─── Game Loop Integration Example ───
class Game {
  constructor() {
    this.currentScreen = 'loading';
    this.playerX = 400;
    this.playerY = 300;
    this.playerDirection = 'down';
    this.keys = {};
  }

  async start() {
    await spriteManager.init();
    console.log('✅ Game sprites ready');
    this.gameLoop(0);
  }

  gameLoop(timestamp) {
    const deltaTime = this.lastTimestamp ? timestamp - this.lastTimestamp : 16;
    this.lastTimestamp = timestamp;

    this.handleInput();
    this.update(deltaTime);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  handleInput() {
    const state = GAME_STATE_SPRITES[this.currentScreen];
    if (!state?.player?.walkUp) return; // Screen doesn't support walking

    let walking = false;

    if (this.keys['ArrowUp'] || this.keys['w']) {
      playerAnimator.walk('up');
      this.playerY -= 2;
      walking = true;
    }
    if (this.keys['ArrowDown'] || this.keys['s']) {
      playerAnimator.walk('down');
      this.playerY += 2;
      walking = true;
    }
    if (this.keys['ArrowLeft'] || this.keys['a']) {
      playerAnimator.walk('left');
      this.playerX -= 2;
      walking = true;
    }
    if (this.keys['ArrowRight'] || this.keys['d']) {
      playerAnimator.walk('right');
      this.playerX += 2;
      walking = true;
    }

    if (!walking) {
      playerAnimator.idle(this.playerDirection);
    }
  }

  update(deltaTime) {
    playerAnimator.update(deltaTime);
  }

  render() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background (screen-specific)
    this.drawBackground(ctx);
    
    // Draw player
    playerAnimator.draw(ctx, this.playerX, this.playerY, 2);
    
    // Draw screen-specific elements (traders, UI, etc.)
    this.drawScreenElements(ctx);
  }

  // Example: Trigger taste animation
  tasteDish() {
    playerAnimator.playAction('taste', 1500, () => {
      console.log('Tasting complete! Proceeding to results...');
      this.transitionToScreen('results');
    });
  }

  // Example: Trigger panic
  triggerPanic() {
    playerAnimator.setPanic(true);
    setTimeout(() => playerAnimator.setPanic(false), 3000);
  }
}