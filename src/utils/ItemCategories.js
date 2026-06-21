// ============================================
// ItemCategories.js
// Groups items by game usage and assigns metadata
// ============================================

export const ITEM_CATEGORIES = {
  // ──────────────────────────────────────
  // UTENSILS - Used in Screen 3 (Utensil Selection)
  // ──────────────────────────────────────
  utensils: [
    { key: 'POT_LARGE',       name: 'Large Aluminum Pot',  required: true,  scores: { execution: 10 } },
    { key: 'WOODEN_SPOON',    name: 'Wooden Spoon',        required: true,  scores: { execution: 5 } },
    { key: 'KNIFE',           name: 'Kitchen Knife',       required: true,  scores: { execution: 5 } },
    { key: 'CUTTING_BOARD',   name: 'Cutting Board',       required: true,  scores: { execution: 5 } },
    { key: 'MIXING_BOWL',     name: 'Mixing Bowl',         required: false, scores: { efficiency: 5 } },
    { key: 'SIEVE',           name: 'Sieve (for Egusi)',   required: false, scores: { execution: 10, creativity: 5 } },
    { key: 'MORTAR',          name: 'Mortar (Odo)',        required: false, scores: { tradition: 20, execution: 15, efficiency: -15 }, conflicts: 'BLENDER' },
    { key: 'PESTLE',          name: 'Pestle (Omo Odo)',    required: false, scores: { tradition: 5 }, requires: 'MORTAR' },
    { key: 'BLENDER',         name: 'Electric Blender',    required: false, scores: { efficiency: 20, tradition: -10, execution: -5 }, conflicts: 'MORTAR' },
    { key: 'GAS_BURNER',      name: 'Gas Cooker',          required: false, scores: { efficiency: 15, execution: 5 }, conflicts: 'CHARCOAL_STOVE' },
  ],

  // ──────────────────────────────────────
  // BASE INGREDIENTS - Market Dash / Cooking
  // ──────────────────────────────────────
  baseIngredients: [
    { key: 'EGUSI_SEEDS',      name: 'Egusi Seeds',         category: 'base', required: true,  scores: { tradition: 25, creativity: -5 } },
    { key: 'GROUND_EGUSI',     name: 'Ground Egusi',         category: 'base', required: false, scores: { efficiency: 10 } },
    { key: 'PALM_OIL_BOTTLE',  name: 'Palm Oil',             category: 'oil',  required: true,  scores: { tradition: 20, creativity: -10, execution: 5 } },
    { key: 'ONIONS_WHOLE',     name: 'Onions',               category: 'base', required: true,  scores: { tradition: 10, execution: 5 } },
    { key: 'ONIONS_CHOPPED',   name: 'Chopped Onions',       category: 'prep', required: false, scores: { efficiency: 10 } },
    { key: 'SCOTCH_BONNET',    name: 'Scotch Bonnet Pepper', category: 'base', required: true,  scores: { tradition: 10, execution: 5 } },
    { key: 'BLENDED_PEPPER',   name: 'Blended Pepper',       category: 'prep', required: false, scores: { efficiency: 10 } },
    { key: 'TOMATOES_FRESH',   name: 'Fresh Tomatoes',       category: 'wildcard', required: false, scores: { tradition: -25, creativity: 15, execution: -5 }, controversial: true },
    { key: 'TOMATO_PASTE',     name: 'Tomato Paste',         category: 'wildcard', required: false, scores: { tradition: -20, creativity: 5 }, controversial: true },
    { key: 'LOCUST_BEANS',     name: 'Locust Beans (Iru)',   category: 'seasoning', required: false, scores: { tradition: 15 } },
  ],

  // ──────────────────────────────────────
  // PROTEINS - Market Dash
  // ──────────────────────────────────────
  proteins: [
    { key: 'GOAT_MEAT',   name: 'Goat Meat',    scores: { tradition: 15, efficiency: -5 } },
    { key: 'COW_MEAT',    name: 'Cow Meat',     scores: { tradition: 10, creativity: -5, execution: 5 } },
    { key: 'CHICKEN',     name: 'Chicken',      scores: { tradition: 0, creativity: 5, efficiency: 5 } },
    { key: 'TURKEY',      name: 'Turkey',       scores: { tradition: 5, creativity: 10 } },
    { key: 'FRESH_FISH',  name: 'Fresh Fish',   scores: { tradition: 10, creativity: 5, execution: -5 } },
    { key: 'STOCKFISH',   name: 'Stockfish',    scores: { tradition: 20, creativity: 5, efficiency: -10, execution: 10 } },
    { key: 'DRIED_FISH',  name: 'Dried Fish',   scores: { tradition: 15, efficiency: -5 } },
    { key: 'COW_SKIN',    name: 'Cow Skin (Ponmo)', scores: { tradition: 10, creativity: 5 } },
    { key: 'SNAIL',       name: 'Giant Snail',  scores: { tradition: 5, creativity: 20, efficiency: -5, execution: -5 }, premium: true },
    { key: 'SHAKI',       name: 'Shaki (Tripe)', scores: { tradition: 10, creativity: 5 } },
  ],

  // ──────────────────────────────────────
  // VEGETABLES & LEAFY GREENS - Market Dash
  // ──────────────────────────────────────
  vegetables: [
    { key: 'EFO_SHOKO',   name: 'Efo Shoko',       scores: { tradition: 15, creativity: -5, execution: 5 }, recommended: true },
    { key: 'SPINACH',     name: 'Foreign Spinach',  scores: { tradition: -10, efficiency: 10, execution: -5 }, controversial: true },
    { key: 'BITTER_LEAF', name: 'Bitter Leaf',      scores: { tradition: 20, creativity: 10, efficiency: -15 } },
    { key: 'UGWU',        name: 'Ugwu (Pumpkin Leaves)', scores: { tradition: 10, creativity: 5 } },
    { key: 'WATER_LEAF',  name: 'Water Leaf',       scores: { tradition: 5, efficiency: 5 } },
    { key: 'SCENT_LEAF',  name: 'Scent Leaf (Efirin)', scores: { tradition: 15, creativity: 10 } },
    { key: 'OKRA',        name: 'Okra',             scores: { tradition: -5, creativity: 10 }, controversial: true },
    { key: 'BELL_PEPPER', name: 'Bell Pepper (Tatashe)', scores: { tradition: 5, creativity: 0 } },
    { key: 'CARROTS',     name: 'Carrots',          scores: { tradition: -15, creativity: 15, efficiency: 5 }, controversial: true },
    { key: 'GREEN_BEANS', name: 'Green Beans',      scores: { tradition: -10, creativity: 10 }, controversial: true },
  ],

  // ──────────────────────────────────────
  // SEASONINGS - Market Dash
  // ──────────────────────────────────────
  seasonings: [
    { key: 'CRAYFISH_GROUND', name: 'Ground Crayfish',   scores: { tradition: 10, execution: 5 }, recommended: true },
    { key: 'CRAYFISH_WHOLE',  name: 'Whole Crayfish',    scores: { tradition: 15, execution: 5 } },
    { key: 'SEASONING_CUBES', name: 'Seasoning Cubes',   scores: { tradition: -5, efficiency: 10 }, controversial: true },
    { key: 'SALT',            name: 'Salt',              scores: { execution: 5 }, required: true },
    { key: 'DRY_PEPPER',      name: 'Dry Ground Pepper', scores: { tradition: 10 } },
    { key: 'CURRY_POWDER',    name: 'Curry Powder',      scores: { tradition: -5, creativity: 10 }, controversial: true },
    { key: 'THYME',           name: 'Thyme',             scores: { tradition: 0, creativity: 5 } },
    { key: 'NUTMEG',          name: 'Nutmeg',            scores: { tradition: -5, creativity: 15 }, controversial: true },
    { key: 'OGIRI',           name: 'Ogiri',             scores: { tradition: 20, creativity: 5, execution: -5 } },
    { key: 'CAMEROON_PEPPER', name: 'Cameroon Pepper',   scores: { tradition: 10, execution: 5 } },
  ],

  // ──────────────────────────────────────
  // OILS & LIQUIDS - Market Dash
  // ──────────────────────────────────────
  oils: [
    { key: 'GROUNDNUT_OIL',    name: 'Groundnut Oil',   scores: { tradition: -10, creativity: 5 }, controversial: true },
    { key: 'COCONUT_OIL',      name: 'Coconut Oil',     scores: { tradition: -20, creativity: 20 }, controversial: true },
    { key: 'VEGETABLE_OIL',    name: 'Vegetable Oil',   scores: { tradition: -15 }, controversial: true },
    { key: 'PALM_OIL_JERRYCAN',name: 'Palm Oil (Jerrycan)', scores: { tradition: 20, execution: 5 }, recommended: true },
    { key: 'MEAT_STOCK',       name: 'Meat Stock/Broth', scores: { execution: 10 } },
    { key: 'WATER',            name: 'Water',           scores: { efficiency: 5 } },
    { key: 'COCONUT_MILK',     name: 'Coconut Milk',    scores: { tradition: -30, creativity: 25, execution: -10 }, controversial: true },
  ],

  // ──────────────────────────────────────
  // WILDCARD ITEMS - Market Dash (Wildcard Alley)
  // ──────────────────────────────────────
  wildcards: [
    { key: 'MUSHROOMS',    name: 'Button Mushrooms', scores: { tradition: -10, creativity: 20 }, controversial: true },
    { key: 'SWEET_CORN',   name: 'Sweet Corn',       scores: { tradition: -15, creativity: 15 }, controversial: true },
    { key: 'GREEN_PEAS',   name: 'Green Peas',       scores: { tradition: -15, creativity: 10 }, controversial: true },
    { key: 'POTATOES',     name: 'Potatoes',         scores: { tradition: -20, creativity: 10 }, controversial: true },
    { key: 'PLANTAIN',     name: 'Ripe Plantain',    scores: { tradition: -25, creativity: 15 }, controversial: true },
    { key: 'BUTTER',       name: 'Butter',           scores: { tradition: -30, creativity: 20 }, controversial: true },
    { key: 'CHEESE',       name: 'Cheese',           scores: { tradition: -35, creativity: 25 }, controversial: true, chaotic: true },
    { key: 'HONEY',        name: 'Honey',            scores: { tradition: -20, creativity: 15 }, controversial: true },
    { key: 'HOT_SAUCE',    name: 'Hot Sauce',        scores: { tradition: -15, creativity: 10 }, controversial: true },
    { key: 'FETA_CHEESE',  name: 'Feta Cheese',      scores: { tradition: -35, creativity: 25 }, controversial: true, chaotic: true },
    // New row-5 (oils & liquids) additions from the refreshed atlas
    { key: 'MYSTERY_PASTE',  name: 'Mystery Paste',    scores: { tradition: -25, creativity: 20 }, controversial: true },
    { key: 'TABASCO',        name: 'Tabasco',          scores: { tradition: -15, creativity: 10 }, controversial: true },
    { key: 'PICKLED_PEPPER', name: 'Pickled Pepper',   scores: { tradition: -10, creativity: 10 }, controversial: true },
  ],

  // ──────────────────────────────────────
  // PREPARED/COOKING STATES - Visual feedback
  // ──────────────────────────────────────
  // NOTE: These frames lived on the old row 7, which was dropped from the
  // refreshed atlas (clean-start-sprite.png / items-sprite.json). Until
  // dedicated art is produced, each entry carries `pendingArt: true` and a
  // `fallback` pointing at an existing atlas frame so the game renders a
  // sensible placeholder instead of nothing. resolveFrame() in ItemData.js
  // applies the fallback automatically.
  cookingStates: [
    { key: 'BOILING_POT',        name: 'Boiling Pot',         usage: 'Cooking phase - simmer indicator',      pendingArt: true, fallback: 'POT_LARGE' },
    { key: 'FRYING_PAN',         name: 'Frying Pan',          usage: 'Cooking phase - frying indicator',      pendingArt: true, fallback: 'POT_LARGE' },
    { key: 'CHOPPED_VEGETABLES', name: 'Chopped Vegetables',  usage: 'Prep Station completion feedback',      pendingArt: true, fallback: 'EFO_SHOKO' },
    { key: 'BLENDED_MIX',        name: 'Blended Mix',         usage: 'Prep Station - blender result',         pendingArt: true, fallback: 'BLENDED_PEPPER' },
    { key: 'WASHED_EGUSI',       name: 'Washed Egusi',        usage: 'Washing Area completion feedback',      pendingArt: true, fallback: 'EGUSI_SEEDS' },
    { key: 'FRIED_EGUSI',        name: 'Fried Egusi',         usage: 'Cooking phase - egusi frying complete', pendingArt: true, fallback: 'GROUND_EGUSI' },
    { key: 'COOKED_MEAT',        name: 'Cooked Meat',         usage: 'Cooking phase - meat cooked indicator', pendingArt: true, fallback: 'GOAT_MEAT' },
    { key: 'FINISHED_EGUSI',     name: 'Finished Egusi Soup', usage: 'Taste & Score / Results screen',        pendingArt: true, fallback: 'POT_LARGE' },
    { key: 'EBA',                name: 'Eba (Garri)',         usage: 'Serving suggestion / Results',          pendingArt: true, fallback: 'MIXING_BOWL' },
    { key: 'POUNDED_YAM',        name: 'Pounded Yam',         usage: 'Serving suggestion / Results',          pendingArt: true, fallback: 'MIXING_BOWL' },
    { key: 'AMALA',              name: 'Amala',               usage: 'Serving suggestion / Results',          pendingArt: true, fallback: 'MIXING_BOWL' },
    { key: 'SERVING_SPOON',      name: 'Serving Spoon',       usage: 'Serving / Results plating visual',      pendingArt: true, fallback: 'WOODEN_SPOON' },
    { key: 'TAKEAWAY_PACK',      name: 'Takeaway Pack',       usage: 'Share / "Take it home" CTA visual',     pendingArt: true, fallback: 'MIXING_BOWL' },
  ],
};