// ============================================
// ItemData.js
// Engine-agnostic item data layer + atlas reconciliation.
//
// This module is the single source of truth for:
//   - resolving frame names against the refreshed atlas (items-sprite.json)
//   - substituting placeholders for frames whose art was dropped (old row 7)
//   - validating that every referenced frame is renderable at startup
//   - item lookups (name, scores, flags, category/zone queries)
//
// It replaces the *data* responsibilities of the old canvas-based
// ItemGameIntegration.js. Rendering now lives in Phaser (StickerEffect.js).
// ============================================

import { ITEM_CATEGORIES } from './ItemCategories.js';
import { ITEM_GAME_ALLOCATION } from './ItemGameAllocation.js';

// --------------------------------------------------------------------------
// Frames that existed on the dropped row 7 and have no art in the current
// atlas. Each maps to an existing atlas frame used as a temporary placeholder.
// Remove an entry once real art for that key is packed into the atlas.
// --------------------------------------------------------------------------
export const FRAME_FALLBACKS = {
  WASHED_EGUSI:       'EGUSI_SEEDS',
  CHOPPED_VEGETABLES: 'EFO_SHOKO',
  BLENDED_MIX:        'BLENDED_PEPPER',
  BOILING_POT:        'POT_LARGE',
  FRYING_PAN:         'POT_LARGE',
  FRIED_EGUSI:        'GROUND_EGUSI',
  COOKED_MEAT:        'GOAT_MEAT',
  FINISHED_EGUSI:     'POT_LARGE',
  EBA:                'MIXING_BOWL',
  POUNDED_YAM:        'MIXING_BOWL',
  AMALA:              'MIXING_BOWL',
  SERVING_SPOON:      'WOODEN_SPOON',
  TAKEAWAY_PACK:      'MIXING_BOWL',
};

// Keys that appear in data as non-rendered identifiers (never drawn) and so
// should be ignored by validation.
const NON_FRAME_KEYS = new Set(['CHARCOAL_STOVE']); // used only as a `conflicts` id

/**
 * Resolve a logical frame key to an actual atlas frame name.
 * Falls back to a placeholder for dropped-row-7 frames.
 * @param {string} key
 * @returns {string} an atlas frame name
 */
export function resolveFrame(key) {
  return FRAME_FALLBACKS[key] || key;
}

/**
 * Collect every frame key referenced across the category and allocation data.
 * @returns {Set<string>}
 */
export function collectReferencedFrames() {
  const refs = new Set();

  // Categories: every item.key
  for (const list of Object.values(ITEM_CATEGORIES)) {
    for (const item of list) refs.add(item.key);
  }

  // Allocation: walk the structure and pull UPPER_SNAKE_CASE string values.
  const walk = (node) => {
    if (typeof node === 'string') {
      if (/^[A-Z][A-Z0-9_]{2,}$/.test(node)) refs.add(node);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === 'object') {
      Object.values(node).forEach(walk);
    }
  };
  walk(ITEM_GAME_ALLOCATION);

  return refs;
}

/**
 * Validate that every referenced frame is renderable.
 * A reference is OK if it is in the atlas, OR has a fallback that is in the
 * atlas, OR is a known non-frame identifier. Throws listing any that are not.
 *
 * Call once after the atlas loads, e.g.:
 *   validateAtlasReferences(scene.textures.get('items').getFrameNames());
 *
 * @param {string[]} atlasFrameNames - frame names present in the loaded atlas
 * @throws {Error} if any referenced frame cannot be resolved to a real frame
 */
export function validateAtlasReferences(atlasFrameNames) {
  const atlas = new Set(atlasFrameNames);
  const refs = collectReferencedFrames();

  const missing = [];
  const danglingFallbacks = [];

  for (const key of refs) {
    if (NON_FRAME_KEYS.has(key)) continue;
    if (atlas.has(key)) continue;
    const fb = FRAME_FALLBACKS[key];
    if (fb) {
      if (!atlas.has(fb)) danglingFallbacks.push(`${key} -> ${fb}`);
      continue; // resolvable via placeholder
    }
    missing.push(key);
  }

  // Also sanity-check the fallback map itself.
  for (const [key, fb] of Object.entries(FRAME_FALLBACKS)) {
    if (!atlas.has(fb)) danglingFallbacks.push(`${key} -> ${fb}`);
  }

  const errors = [];
  if (missing.length) {
    errors.push(`Frames referenced but not in atlas and with no fallback: ${[...new Set(missing)].sort().join(', ')}`);
  }
  if (danglingFallbacks.length) {
    errors.push(`Fallback targets missing from atlas: ${[...new Set(danglingFallbacks)].sort().join(', ')}`);
  }
  if (errors.length) {
    throw new Error(`[ItemData] Atlas validation failed.\n  ${errors.join('\n  ')}`);
  }

  const pending = Object.keys(FRAME_FALLBACKS).filter((k) => refs.has(k));
  if (pending.length) {
    console.warn(`[ItemData] ${pending.length} frame(s) rendering as placeholders (pending art): ${pending.sort().join(', ')}`);
  }
  return true;
}

// --------------------------------------------------------------------------
// Lookups (ported from the old ItemGameIntegration.js, engine-agnostic)
// --------------------------------------------------------------------------

function findItem(itemKey) {
  for (const list of Object.values(ITEM_CATEGORIES)) {
    const item = list.find((i) => i.key === itemKey);
    if (item) return item;
  }
  return null;
}

export function getItemName(itemKey)        { return findItem(itemKey)?.name ?? itemKey; }
export function getItemScores(itemKey)      { return findItem(itemKey)?.scores ?? {}; }
export function isControversial(itemKey)     { return findItem(itemKey)?.controversial ?? false; }
export function isRequired(itemKey)          { return findItem(itemKey)?.required ?? false; }
export function getCategoryItems(category)   { return ITEM_CATEGORIES[category] ?? []; }
export function getUtensils()                { return ITEM_CATEGORIES.utensils; }

/**
 * Items for a Market Dash zone, enriched with metadata.
 * @param {string} zoneId
 */
export function getMarketZoneItems(zoneId) {
  const zone = ITEM_GAME_ALLOCATION.marketDash[zoneId];
  if (!zone) return [];
  return zone.items.map((key) => ({
    key,
    frame: resolveFrame(key),
    name: getItemName(key),
    isRecommended: zone.recommended.includes(key),
    scores: getItemScores(key),
    controversial: isControversial(key),
  }));
}
