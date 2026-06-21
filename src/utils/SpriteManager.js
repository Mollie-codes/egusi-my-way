import { SPRITE_CONFIG } from './spriteConfig.js';

export class SpriteManager {
  constructor() {
    this.sheets = {};
    this.loadedCount = 0;
    this.totalSheets = 0;
    this.onAllLoaded = null;
    this.loadingPromises = [];
  }

  /**
   * Register a sprite sheet from config
   */
  registerSheet(sheetId, config) {
    this.totalSheets++;
    
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.sheets[sheetId] = {
          image: img,
          frameWidth: config.frameWidth,
          frameHeight: config.frameHeight,
          columns: config.columns,
          rows: config.rows,
          totalFrames: config.totalFrames,
          frames: config.frames
        };
        
        this.loadedCount++;
        console.log(`✅ Loaded: ${config.file} (${sheetId}) - ${this.loadedCount}/${this.totalSheets}`);
        
        if (this.loadedCount >= this.totalSheets) {
          console.log('🎉 All sprite sheets loaded!');
          if (this.onAllLoaded) this.onAllLoaded();
        }
        
        resolve(this.sheets[sheetId]);
      };
      
      img.onerror = () => {
        console.error(`❌ Failed to load: ${config.file}`);
        reject(new Error(`Failed to load sprite sheet: ${config.file}`));
      };
      
      img.src = config.file;
    });
    
    this.loadingPromises.push(promise);
    return promise;
  }

  /**
   * Initialize all game sprites
   */
  async init() {
    console.log('📦 Loading sprite sheets...');
    
    this.registerSheet('cooking', SPRITE_CONFIG.cooking);
    this.registerSheet('basic', SPRITE_CONFIG.basic);
    
    try {
      await Promise.all(this.loadingPromises);
      return true;
    } catch (error) {
      console.error('Sprite loading failed:', error);
      return false;
    }
  }

  /**
   * Get frame data for a specific sprite
   */
  getFrame(sheetId, frameKey) {
    const sheet = this.sheets[sheetId];
    if (!sheet) {
      console.warn(`Sheet not found: ${sheetId}`);
      return null;
    }
    
    const frameIndex = sheet.frames[frameKey];
    if (frameIndex === undefined) {
      console.warn(`Frame key not found: ${frameKey} in sheet ${sheetId}`);
      return null;
    }
    
    const col = frameIndex % sheet.columns;
    const row = Math.floor(frameIndex / sheet.columns);
    
    return {
      image: sheet.image,
      sx: col * sheet.frameWidth,
      sy: row * sheet.frameHeight,
      sw: sheet.frameWidth,
      sh: sheet.frameHeight,
      frameWidth: sheet.frameWidth,
      frameHeight: sheet.frameHeight
    };
  }

  /**
   * Draw a specific frame to canvas
   */
  drawFrame(ctx, sheetId, frameKey, x, y, options = {}) {
    const {
      scale = 1,
      flipHorizontal = false,
      flipVertical = false,
      rotation = 0,
      alpha = 1,
      centered = true
    } = options;
    
    const frame = this.getFrame(sheetId, frameKey);
    if (!frame) return;
    
    const destWidth = frame.sw * scale;
    const destHeight = frame.sh * scale;
    const drawX = centered ? x - destWidth / 2 : x;
    const drawY = centered ? y - destHeight / 2 : y;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (flipHorizontal || flipVertical || rotation !== 0) {
      ctx.translate(x, y);
      
      if (rotation !== 0) {
        ctx.rotate(rotation);
      }
      
      const scaleX = flipHorizontal ? -1 : 1;
      const scaleY = flipVertical ? -1 : 1;
      ctx.scale(scaleX, scaleY);
      
      if (centered) {
        ctx.drawImage(
          frame.image,
          frame.sx, frame.sy, frame.sw, frame.sh,
          -destWidth / 2, -destHeight / 2, destWidth, destHeight
        );
      } else {
        ctx.drawImage(
          frame.image,
          frame.sx, frame.sy, frame.sw, frame.sh,
          0, 0, destWidth, destHeight
        );
      }
    } else {
      ctx.drawImage(
        frame.image,
        frame.sx, frame.sy, frame.sw, frame.sh,
        drawX, drawY, destWidth, destHeight
      );
    }
    
    ctx.restore();
  }

  /**
   * Check if a specific frame exists
   */
  hasFrame(sheetId, frameKey) {
    const sheet = this.sheets[sheetId];
    return sheet && sheet.frames[frameKey] !== undefined;
  }
}