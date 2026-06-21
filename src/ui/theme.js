// src/ui/theme.js
// Global design tokens — single source of truth for colors, typography, and button styles.
// Reference: IngredientSelectionScene.js DOM overlay + Tailwind config in index.html.

// ─── COLOR PALETTE (CSS strings for Phaser text fill / DOM) ───
export const COLORS = {
  surfaceDim: '#151121',
  surfaceContainer: '#211d2e',
  surfaceContainerHigh: '#2c2738',
  surfaceContainerLow: '#1d1929',
  surfaceContainerLowest: '#100c1b',
  surfaceVariant: '#373244',

  primary: '#ffb68a',
  primaryContainer: '#f47d20',
  onPrimary: '#522300',
  onPrimaryContainer: '#592700',
  onPrimaryFixed: '#321300',
  inversePrimary: '#984700',

  secondary: '#97d4af',
  secondaryContainer: '#135135',
  onSecondaryContainer: '#86c29e',

  tertiary: '#e9c400',
  tertiaryContainer: '#b99c00',

  error: '#ffb4ab',

  onSurface: '#e7dff6',
  onSurfaceVariant: '#dec1b1',
  outlineVariant: '#574236',
  outline: '#a58b7d',
};

// ─── COLOR PALETTE (Phaser hex for Graphics.fillStyle) ───
export const HEX = {
  surfaceDim: 0x151121,
  surfaceContainer: 0x211d2e,
  surfaceContainerHigh: 0x2c2738,
  surfaceContainerLow: 0x1d1929,
  surfaceContainerLowest: 0x100c1b,
  surfaceVariant: 0x373244,

  primary: 0xffb68a,
  primaryContainer: 0xf47d20,
  onPrimaryContainer: 0x592700,
  inversePrimary: 0x984700,

  secondary: 0x97d4af,
  secondaryContainer: 0x135135,

  tertiary: 0xe9c400,
  tertiaryContainer: 0xb99c00,

  error: 0xffb4ab,

  onSurface: 0xe7dff6,
  onSurfaceVariant: 0xdec1b1,
  outlineVariant: 0x574236,
  outline: 0xa58b7d,

  white: 0xffffff,
  black: 0x000000,
};

// ─── FONT FAMILIES ───
export const FONTS = {
  heading: 'Bricolage Grotesque, Chelsea Market, sans-serif',
  body: 'Plus Jakarta Sans, Barlow, sans-serif',
  label: 'Space Grotesk, sans-serif',
};

// ─── TYPOGRAPHY PRESETS (Phaser text style objects) ───
export const TYPOGRAPHY = {
  displayLg:     { fontFamily: FONTS.heading, fontSize: '40px', fontWeight: '800' },
  headlineLg:    { fontFamily: FONTS.heading, fontSize: '28px', fontWeight: '700' },
  headlineMobile:{ fontFamily: FONTS.heading, fontSize: '24px', fontWeight: '700' },
  sectionTitle:  { fontFamily: FONTS.heading, fontSize: '18px', fontWeight: '700' },
  sectionSm:     { fontFamily: FONTS.heading, fontSize: '15px', fontWeight: '700' },
  body:          { fontFamily: FONTS.body,    fontSize: '16px', fontWeight: '500' },
  bodySm:        { fontFamily: FONTS.body,    fontSize: '14px', fontWeight: '500' },
  bodyXs:        { fontFamily: FONTS.body,    fontSize: '12px', fontWeight: '500' },
  label:         { fontFamily: FONTS.label,   fontSize: '14px', fontWeight: '700' },
  labelSm:       { fontFamily: FONTS.label,   fontSize: '11px', fontWeight: '700' },
  labelXs:       { fontFamily: FONTS.label,   fontSize: '9px',  fontWeight: '700' },
  stats:         { fontFamily: FONTS.label,   fontSize: '20px', fontWeight: '700' },
  buttonPrimary: { fontFamily: FONTS.heading, fontSize: '22px', fontWeight: '800' },
  buttonSm:      { fontFamily: FONTS.heading, fontSize: '16px', fontWeight: '700' },
};

// ─── BUTTON PRESETS ───
export const BUTTON = {
  primary: {
    width: 380, height: 64, radius: 16,
    bg: HEX.primaryContainer, shadow: HEX.inversePrimary, shadowDepth: 6,
    textFill: COLORS.onPrimaryContainer, fontSize: '22px',
  },
  secondary: {
    width: 380, height: 56, radius: 14,
    bg: HEX.secondary, shadow: 0x135135, shadowDepth: 4,
    textFill: '#002112', fontSize: '18px',
  },
  compact: {
    width: 320, height: 50, radius: 12,
    bg: HEX.primaryContainer, shadow: HEX.inversePrimary, shadowDepth: 4,
    textFill: COLORS.onPrimaryContainer, fontSize: '16px',
  },
};

// ─── LAYOUT CONSTANTS ───
export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, containerPadding: 20 };
export const APP_BAR_HEIGHT = 58;
export const CARD_RADIUS = 14;
export const CANVAS = { width: 480, height: 854 };

// ─── HELPERS ───

export function textStyle(preset, overrides = {}) {
  return { ...(TYPOGRAPHY[preset] || {}), ...overrides };
}

export function createButton(scene, x, y, label, options = {}) {
  const p = BUTTON[options.preset || 'primary'];
  const width      = options.width      ?? p.width;
  const height     = options.height     ?? p.height;
  const radius     = options.radius     ?? p.radius;
  const bg         = options.bg         ?? p.bg;
  const shadowClr  = options.shadow     ?? p.shadow;
  const shadowD    = options.shadowDepth?? p.shadowDepth;
  const textFill   = options.textFill   ?? p.textFill;
  const fontSize   = options.fontSize   ?? p.fontSize;
  const icon       = options.icon       || '';
  const depth      = options.depth      ?? 0;

  const bx = x - width / 2;
  const by = y - height / 2;

  const shadow = scene.add.graphics();
  shadow.fillStyle(shadowClr, 1);
  shadow.fillRoundedRect(bx, by + shadowD, width, height, radius);
  shadow.setDepth(depth);

  const face = scene.add.graphics();
  face.fillStyle(bg, 1);
  face.fillRoundedRect(bx, by, width, height, radius);
  face.setDepth(depth);

  const display = icon ? `${icon}  ${label}` : label;
  const text = scene.add.text(x, y, display, {
    ...TYPOGRAPHY.buttonPrimary, fontSize, fill: textFill,
  }).setOrigin(0.5).setDepth(depth + 1);

  const zone = scene.add.zone(x, y, width, height)
    .setInteractive({ useHandCursor: true }).setDepth(depth + 2);

  return { shadow, face, text, zone };
}

export function drawBackground(scene, w = CANVAS.width, h = CANVAS.height) {
  const bg = scene.add.graphics();
  bg.fillStyle(HEX.surfaceDim, 1);
  bg.fillRect(0, 0, w, h);

  const mesh = scene.add.graphics();
  mesh.fillStyle(0x0c0a1a, 0.4);
  mesh.fillCircle(0, 0, 350);
  mesh.fillStyle(0x1a2d55, 0.12);
  mesh.fillCircle(w / 2, 0, 300);
  mesh.fillStyle(0x3d1a30, 0.08);
  mesh.fillCircle(w, 0, 300);

  const dots = scene.add.graphics();
  dots.setAlpha(0.04);
  for (let x = 8; x < w; x += 16) {
    for (let y = 8; y < h; y += 16) {
      dots.fillStyle(HEX.white, 1);
      dots.fillRect(x, y, 1, 1);
    }
  }
}

export function drawAppBar(scene, w = CANVAS.width) {
  const bar = scene.add.graphics();
  bar.fillStyle(HEX.surfaceContainerHigh, 1);
  bar.fillRect(0, 0, w, APP_BAR_HEIGHT);
  bar.lineStyle(1, 0x000000, 0.2);
  bar.lineBetween(0, APP_BAR_HEIGHT, w, APP_BAR_HEIGHT);
  bar.setDepth(50);

  scene.add.text(20, 10, '🍽️', { fontSize: '22px' }).setDepth(51);
  scene.add.text(52, 6, 'Efo Egusi:\nCooking My Way!', {
    ...TYPOGRAPHY.sectionTitle, fill: COLORS.primary, lineSpacing: -2,
  }).setDepth(51);
  scene.add.text(448, 18, '⚙️', { fontSize: '18px' }).setOrigin(0.5).setDepth(51);
}

export function drawCard(scene, x, y, w, h, options = {}) {
  const bg      = options.bg          ?? HEX.surfaceContainer;
  const bgAlpha = options.bgAlpha     ?? 1;
  const border  = options.borderColor ?? HEX.white;
  const bAlpha  = options.borderAlpha ?? 0.05;
  const radius  = options.radius      ?? CARD_RADIUS;

  const gfx = scene.add.graphics();
  gfx.fillStyle(bg, bgAlpha);
  gfx.fillRoundedRect(x, y, w, h, radius);
  if (bAlpha > 0) {
    gfx.lineStyle(1, border, bAlpha);
    gfx.strokeRoundedRect(x, y, w, h, radius);
  }
  return gfx;
}
