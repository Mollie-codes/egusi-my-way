// ============================================
// spriteConfig.js
// Central configuration for all sprite sheets
// ============================================

export const SPRITE_CONFIG = {
    // ─────────────────────────────────────────
    // COOKING SPRITES (12 frames, horizontal strip)
    // File: sprites-cooking.png
    // Layout: Single row, 12 frames × 92×206px
    // Total: 1107×206px
    // ─────────────────────────────────────────
    cooking: {
        file: 'public/assets/sprites-cooking.png',
        atlas: 'public/assets/cooking-sprite.json',
        frames: {
            IDLE: 'IDLE',
            WALK_UP: 'WALK_UP',
            WALK_DOWN: 'WALK_DOWN',
            WALK_LEFT: 'WALK_LEFT',
            WALK_RIGHT: 'WALK_RIGHT',
            WAVE: 'WAVE',
            PICK_UP: 'IDLE',   // Legacy action poses mapped to IDLE
            CHOP: 'IDLE',
            STIR: 'IDLE',
            TASTE: 'IDLE',
            SERVE: 'IDLE',
            PANIC: 'IDLE'
        }
    },

    // ─────────────────────────────────────────
    // BASIC SPRITES (16 tiles, 4×4 grid)
    // File: sprites-basic.png
    // Layout: 4 columns × 4 rows
    // Total: 1024×1536px
    // ─────────────────────────────────────────
    basic: {
        file: 'public/assets/sprites-basic.png',
        frameWidth: 256,
        frameHeight: 384,
        columns: 4,
        rows: 4,
        totalFrames: 16,
        frames: {
            // Row 1: Front views
            FRONT_NEUTRAL: 0,   // Col 1, Row 1
            FRONT_SMILE: 1,   // Col 2, Row 1
            FRONT_TALKING: 2,   // Col 3, Row 1
            FRONT_HAPPY: 3,   // Col 4, Row 1

            // Row 2: 3/4 Left views
            THREEQ_LEFT_NEUTRAL: 4,   // Col 1, Row 2
            THREEQ_LEFT_SMILE: 5,   // Col 2, Row 2
            THREEQ_LEFT_TALKING: 6,   // Col 3, Row 2
            THREEQ_LEFT_HAPPY: 7,   // Col 4, Row 2

            // Row 3: Side Left profiles
            SIDE_LEFT_NEUTRAL: 8,   // Col 1, Row 3
            SIDE_LEFT_SMILE: 9,   // Col 2, Row 3
            SIDE_LEFT_TALKING: 10,  // Col 3, Row 3
            SIDE_LEFT_HAPPY: 11,  // Col 4, Row 3

            // Row 4: Back views
            BACK_NEUTRAL: 12,  // Col 1, Row 4
            BACK_THREEQ: 13,  // Col 2, Row 4
            BACK_SLIGHT_TURN: 14,  // Col 3, Row 4
            BACK_VARIANT: 15,  // Col 4, Row 4
        }
    }
};