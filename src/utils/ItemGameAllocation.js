// ============================================
// ItemGameAllocation.js
// Maps every item to specific game screens and contexts
// ============================================
//
// PENDING-ART NOTE: The washing / prep / cooking / results screens below
// reference process & dish frames that lived on the dropped row 7
// (WASHED_EGUSI, CHOPPED_VEGETABLES, BLENDED_MIX, BOILING_POT, FRIED_EGUSI,
// COOKED_MEAT, FINISHED_EGUSI, EBA, POUNDED_YAM, etc.). These are NOT in the
// current atlas. Always pass these keys through resolveFrame() (ItemData.js)
// before drawing — it substitutes an existing placeholder frame until the
// real art is added. validateAtlasReferences() will pass for these because
// they resolve via the fallback map; it throws only for truly unknown keys.

export const ITEM_GAME_ALLOCATION = {
  // ═══════════════════════════════════════════
  // SCREEN 2: MARKET DASH
  // ═══════════════════════════════════════════
  marketDash: {
    pepperZone: {
      trader: 'Mama Nkechi',
      items: ['SCOTCH_BONNET', 'BELL_PEPPER', 'DRY_PEPPER', 'CAMEROON_PEPPER'],
      recommended: ['SCOTCH_BONNET'],
      displayStyle: 'on_stall',
    },
    leafyGreensZone: {
      trader: 'Iya Ibeji',
      items: ['EFO_SHOKO', 'SPINACH', 'BITTER_LEAF', 'UGWU', 'WATER_LEAF', 'SCENT_LEAF'],
      recommended: ['EFO_SHOKO', 'BITTER_LEAF'],
      displayStyle: 'in_baskets',
    },
    oilsZone: {
      trader: 'Alhaji Tanko',
      items: ['PALM_OIL_BOTTLE', 'PALM_OIL_JERRYCAN', 'GROUNDNUT_OIL', 'COCONUT_OIL', 'VEGETABLE_OIL'],
      recommended: ['PALM_OIL_BOTTLE', 'PALM_OIL_JERRYCAN'],
      displayStyle: 'on_shelves',
    },
    seasoningsZone: {
      trader: 'Mama Bose',
      items: ['LOCUST_BEANS', 'CRAYFISH_GROUND', 'CRAYFISH_WHOLE', 'SEASONING_CUBES', 'SALT', 'CURRY_POWDER', 'THYME', 'NUTMEG', 'OGIRI'],
      recommended: ['LOCUST_BEANS', 'CRAYFISH_GROUND', 'SALT'],
      displayStyle: 'in_small_bowls',
    },
    proteinZone: {
      trader: 'Chief Okonkwo',
      items: ['GOAT_MEAT', 'COW_MEAT', 'CHICKEN', 'TURKEY', 'FRESH_FISH', 'STOCKFISH', 'DRIED_FISH', 'COW_SKIN', 'SNAIL', 'SHAKI'],
      recommended: ['GOAT_MEAT', 'STOCKFISH'],
      displayStyle: 'on_butcher_table',
    },
    wildcardAlley: {
      trader: 'Mallam Gambo',
      items: ['TOMATOES_FRESH', 'TOMATO_PASTE', 'CARROTS', 'MUSHROOMS', 'SWEET_CORN', 'GREEN_PEAS', 'POTATOES', 'PLANTAIN', 'BUTTER', 'CHEESE', 'HONEY', 'HOT_SAUCE', 'FETA_CHEESE', 'MYSTERY_PASTE', 'TABASCO', 'PICKLED_PEPPER', 'OKRA', 'GREEN_BEANS'],
      recommended: [], // Nothing recommended here
      displayStyle: 'mysterious_stall',
      warningMessage: '⚠️ Enter at your own risk. Not everything here belongs in egusi.',
    },
    basketDisplay: {
      // Items that appear in the basket HUD
      showCorrectIndicator: true,   // ✅ green sparkle
      showWrongIndicator: true,     // ❌ red shake
      showControversialIndicator: true, // ⚠️ yellow flash
    }
  },

  // ═══════════════════════════════════════════
  // SCREEN 3: UTENSIL SELECTION
  // ═══════════════════════════════════════════
  utensilSelection: {
    essentialTools: ['POT_LARGE', 'WOODEN_SPOON', 'KNIFE', 'CUTTING_BOARD'],
    grindingChoice: {
      prompt: 'Team Mortar or Team Blender?',
      options: [
        { key: 'MORTAR', companion: 'PESTLE', label: 'Mortar & Pestle', tagline: 'Respect the old ways' },
        { key: 'BLENDER', label: 'Electric Blender', tagline: "We're in 2026!" },
      ],
    },
    heatSourceChoice: {
      options: [
        { key: 'GAS_BURNER', label: 'Gas Cooker', tagline: 'Reliable & efficient' },
        // Note: CHARCOAL_STOVE not in sprite sheet - see gap analysis
      ],
    },
    optionalTools: ['MIXING_BOWL', 'SIEVE'],
    toolCardLayout: '2_rows_of_4_cards',
  },

  // ═══════════════════════════════════════════
  // SCREEN 4a: WASHING AREA
  // ═══════════════════════════════════════════
  washingArea: {
    vegetablesToWash: ['EFO_SHOKO', 'SPINACH', 'BITTER_LEAF', 'UGWU'], // Based on player selection
    waterVisual: 'WATER',
    completionFeedback: 'WASHED_EGUSI', // Show after washing egusi
    cleanVegFeedback: 'CHOPPED_VEGETABLES', // Show clean chopped veg
  },

  // ═══════════════════════════════════════════
  // SCREEN 4b: PREP STATION
  // ═══════════════════════════════════════════
  prepStation: {
    tasks: [
      {
        name: 'Slice Vegetables',
        inputItem: 'EFO_SHOKO', // Or whatever green was selected
        outputItem: 'CHOPPED_VEGETABLES',
        toolUsed: 'KNIFE',
        surface: 'CUTTING_BOARD',
        miniGame: 'rhythm',
      },
      {
        name: 'Blend Pepper',
        inputItem: 'SCOTCH_BONNET',
        outputItem: 'BLENDED_PEPPER',
        toolUsed: 'BLENDER', // or MORTAR+PESTLE
        miniGame: 'hold_release',
      },
      {
        name: 'Grind Egusi',
        inputItem: 'EGUSI_SEEDS',
        outputItem: 'GROUND_EGUSI',
        toolUsed: 'BLENDER', // or MORTAR+PESTLE
        miniGame: 'mash',
      },
    ],
    visualFeedback: {
      beforeTask: 'EGUSI_SEEDS',     // Show whole seeds before grinding
      afterTask: 'GROUND_EGUSI',     // Show powder after
      choppedResult: 'CHOPPED_VEGETABLES',
      blendedResult: 'BLENDED_MIX',
    }
  },

  // ═══════════════════════════════════════════
  // SCREEN 4c: COOKING STOVE
  // ═══════════════════════════════════════════
  cookingStove: {
    potDisplay: 'POT_LARGE',         // Empty pot at start
    cookingProgress: {
      heatingOil: 'PALM_OIL_BOTTLE', // Pouring oil visual
      fryingOnions: 'ONIONS_CHOPPED',
      addingPepper: 'BLENDED_PEPPER',
      addingMeat: 'GOAT_MEAT',        // Or whichever protein selected
      addingStock: 'MEAT_STOCK',
      addingEgusi: 'GROUND_EGUSI',
      simmering: 'BOILING_POT',       // Bubbling pot state
      fryingEgusi: 'FRIED_EGUSI',     // If fry-first method
      addingVegetables: 'CHOPPED_VEGETABLES',
      meatCooked: 'COOKED_MEAT',
      almostDone: 'BOILING_POT',      // Final simmer
    },
    finalDish: 'FINISHED_EGUSI',
    sideOptions: ['EBA', 'POUNDED_YAM'], // Serving suggestions
  },

  // ═══════════════════════════════════════════
  // SCREEN 5: TASTE & SCORE
  // ═══════════════════════════════════════════
  tasteScore: {
    heroDish: 'FINISHED_EGUSI',
    steamAnimation: true,
    scoringBreakdown: {
      // Icons shown next to each score category
      tradition: 'MORTAR',        // Represents traditional methods
      creativity: 'MUSHROOMS',    // Represents creative choices
      efficiency: 'BLENDER',      // Represents modern efficiency
      execution: 'KNIFE',         // Represents technical skill
    }
  },

  // ═══════════════════════════════════════════
  // SCREEN 6: RESULTS
  // ═══════════════════════════════════════════
  results: {
    heroDish: 'FINISHED_EGUSI',
    servedWith: ['EBA', 'POUNDED_YAM'],
    shareImage: 'FINISHED_EGUSI', // For social sharing
  },
};