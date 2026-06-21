// ============================================
// SpriteGameMap.js
// Complete mapping of every sprite to its game usage
// ============================================

export const SPRITE_GAME_MAP = {
  // ─────────────────────────────────────────────
  // COOKING SPRITES USAGE
  // ─────────────────────────────────────────────
  cooking: {
    IDLE: {
      frame: 'IDLE',
      gameUsage: [
        { screen: 'Kitchen Hub', context: 'Player standing at station entrance' },
        { screen: 'Market Dash', context: 'Player stationary in maze' },
        { screen: 'Utensil Selection', context: 'Character shown next to selected tools' },
      ],
      animation: 'Static with engine-driven vertical bob (sin wave, 2s cycle, 3px amplitude)',
      transitionTo: ['WALK_UP', 'WALK_DOWN', 'WALK_LEFT', 'WALK_RIGHT', 'WAVE']
    },

    WAVE: {
      frame: 'WAVE',
      gameUsage: [
        { screen: 'Loading Screen', context: 'Character waves during load. Loops: wave 1.5s → idle 2s → repeat' },
        { screen: 'Market Dash', context: 'Trader waves back at player near zone entrance' }, // mirrored for NPCs
        { screen: 'Results', context: 'Brief wave on high scores' },
      ],
      animation: 'One-shot (1.5s) or looping with idle pause',
      transitionTo: ['IDLE']
    },

    WALK_UP: {
      frame: 'WALK_UP',
      gameUsage: [
        { screen: 'Kitchen Hub', context: 'Player walking upward between stations' },
        { screen: 'Market Dash', context: 'Player navigating market maze upward' },
      ],
      animation: '2-frame cycle (bounce between WALK_UP and IDLE position). 150ms per frame.',
      transitionTo: ['IDLE', 'WALK_LEFT', 'WALK_RIGHT', 'WALK_DOWN']
    },

    WALK_DOWN: {
      frame: 'WALK_DOWN',
      gameUsage: [
        { screen: 'Kitchen Hub', context: 'Player walking downward between stations' },
        { screen: 'Market Dash', context: 'Player navigating market maze downward' },
      ],
      animation: '2-frame cycle with slight apron sway. 150ms per frame.',
      transitionTo: ['IDLE', 'WALK_LEFT', 'WALK_RIGHT', 'WALK_UP']
    },

    WALK_LEFT: {
      frame: 'WALK_LEFT',
      gameUsage: [
        { screen: 'Kitchen Hub', context: 'Player walking left between stations' },
        { screen: 'Market Dash', context: 'Player navigating market maze left' },
      ],
      animation: '2-frame cycle. Can be engine-mirrored from WALK_RIGHT if needed. 150ms per frame.',
      transitionTo: ['IDLE', 'WALK_UP', 'WALK_DOWN', 'WALK_RIGHT']
    },

    WALK_RIGHT: {
      frame: 'WALK_RIGHT',
      gameUsage: [
        { screen: 'Kitchen Hub', context: 'Player walking right between stations' },
        { screen: 'Market Dash', context: 'Player navigating market maze right' },
      ],
      animation: '2-frame cycle. 150ms per frame.',
      transitionTo: ['IDLE', 'WALK_UP', 'WALK_DOWN', 'WALK_LEFT']
    },

    PICK_UP: {
      frame: 'IDLE', // Legacy action mapped to IDLE
      gameUsage: [
        { screen: 'Market Dash', context: 'Player selecting ingredient from trader stall' },
        { screen: 'Utensil Selection', context: 'Player choosing a utensil card' },
        { screen: 'Kitchen Hub', context: 'Player grabbing ingredient from shelf' },
        { screen: 'Prep Station', context: 'Reaching for next item to prep' },
      ],
      animation: 'No animation, mapped to IDLE.',
      transitionTo: ['IDLE']
    },

    CHOP: {
      frame: 'IDLE', // Legacy action mapped to IDLE
      gameUsage: [
        { screen: 'Prep Station (Task 1)', context: 'Player slicing vegetables on cutting board' },
      ],
      animation: 'No animation, mapped to IDLE.',
      transitionTo: ['IDLE']
    },

    STIR: {
      frame: 'IDLE', // Legacy action mapped to IDLE
      gameUsage: [
        { screen: 'Cooking Stove', context: 'Player stirring the egusi pot' },
        { screen: 'Cooking Stove', context: 'During simmer phase, continuous stirring' },
      ],
      animation: 'No animation, mapped to IDLE.',
      transitionTo: ['IDLE']
    },

    TASTE: {
      frame: 'IDLE', // Legacy action mapped to IDLE
      gameUsage: [
        { screen: 'Taste & Score', context: 'THE moment. Player tastes finished egusi before scoring' },
        { screen: 'Cooking Stove', context: 'Optional: taste during cooking (random event: visitor asks for taste)' },
      ],
      animation: 'No animation, mapped to IDLE.',
      transitionTo: ['IDLE']
    },

    SERVE: {
      frame: 'IDLE', // Legacy action mapped to IDLE
      gameUsage: [
        { screen: 'Results', context: 'Player proudly presenting finished dish' },
        { screen: 'Serving Counter', context: 'Plating the final dish' },
      ],
      animation: 'No animation, mapped to IDLE.',
      transitionTo: ['IDLE']
    },

    PANIC: {
      frame: 'IDLE', // Legacy action mapped to IDLE
      gameUsage: [
        { screen: 'Cooking Stove', context: 'Random event: Pepper is too much!' },
        { screen: 'Cooking Stove', context: 'Random event: Power outage!' },
        { screen: 'Washing Area', context: 'Timer expired: vegetables still dirty' },
        { screen: 'Market Dash', context: 'Timer running out (< 30s warning)' },
      ],
      animation: 'No animation, mapped to IDLE.',
      transitionTo: ['IDLE']
    },
  },

  // ─────────────────────────────────────────────
  // BASIC SPRITES USAGE (NPCs, Traders, Judges)
  // ─────────────────────────────────────────────
  basic: {
    // --- FRONT VIEWS (Row 1) ---
    FRONT_NEUTRAL: {
      frame: 0,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader idle expression when player first approaches zone' },
        { screen: 'Results', context: 'Judge neutral face before delivering verdict' },
        { screen: 'Kitchen Hub', context: 'NPC visitor at kitchen entrance (neutral)' },
      ]
    },
    FRONT_SMILE: {
      frame: 1,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader warm greeting when player enters zone' },
        { screen: 'Market Dash', context: 'Trader approving correct ingredient choice' },
        { screen: 'Results', context: 'Judge giving positive verdict' },
      ]
    },
    FRONT_TALKING: {
      frame: 2,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader speaking dialogue lines' },
        { screen: 'Cooking Stove', context: 'Visitor giving cooking advice' },
        { screen: 'Results', context: 'Judge delivering verdict verbally' },
        { screen: 'Loading Screen', context: 'Could animate a narrator/announcer' },
      ]
    },
    FRONT_HAPPY: {
      frame: 3,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader celebrating correct rare ingredient choice' },
        { screen: 'Results', context: 'Judge extremely impressed (90+ score)' },
        { screen: 'Checkout', context: 'Mama Iyabo happy with complete basket' },
      ]
    },

    // --- 3/4 LEFT VIEWS (Row 2) ---
    THREEQ_LEFT_NEUTRAL: {
      frame: 4,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader at stall, 3/4 angle behind counter' },
      ]
    },
    THREEQ_LEFT_SMILE: {
      frame: 5,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader friendly greeting from behind stall' },
      ]
    },
    THREEQ_LEFT_TALKING: {
      frame: 6,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader explaining produce to player' },
        { screen: 'Cooking Stove', context: 'Visitor leaning in to give taste opinion' },
      ]
    },
    THREEQ_LEFT_HAPPY: {
      frame: 7,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader excited about player's premium choice (snail!)' },
      ]
    },

    // --- SIDE LEFT PROFILES (Row 3) ---
    SIDE_LEFT_NEUTRAL: {
      frame: 8,
      gameUsage: [
        { screen: 'Cooking Stove', context: 'Visitor watching from kitchen doorway' },
      ]
    },
    SIDE_LEFT_SMILE: {
      frame: 9,
      gameUsage: [
        { screen: 'Cooking Stove', context: 'Visitor enjoying the aroma from kitchen' },
      ]
    },
    SIDE_LEFT_TALKING: {
      frame: 10,
      gameUsage: [
        { screen: 'Cooking Stove', context: 'Visitor chatting while leaning on counter' },
      ]
    },
    SIDE_LEFT_HAPPY: {
      frame: 11,
      gameUsage: [
        { screen: 'Results', context: 'Could show judge's side profile reacting to great score' },
      ]
    },

    // --- BACK VIEWS (Row 4) ---
    BACK_NEUTRAL: {
      frame: 12,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader turned around restocking shelf (rare/idle anim)' },
        { screen: 'Kitchen Hub', context: 'Player walking away from camera (alt to WALK_UP)' },
      ]
    },
    BACK_THREEQ: {
      frame: 13,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader walking back to their stall' },
      ]
    },
    BACK_SLIGHT_TURN: {
      frame: 14,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader glancing over shoulder as player approaches' },
      ]
    },
    BACK_VARIANT: {
      frame: 15,
      gameUsage: [
        { screen: 'Market Dash', context: 'Trader organizing back shelves, slight variation' },
        { screen: 'Kitchen Hub', context: 'NPC leaving the kitchen' },
      ]
    },
  }
};