// src/scenes/ServingScene.js
// Accompaniment selection screen — choose eba, iyan, or amala to serve with egusi soup
import Phaser from 'phaser';
import { showSettingsModal } from '../ui/SettingsModal.js';

const ACCOMPANIMENTS = [
  { id: 'eba', name: 'Eba', frame: 'eba', description: 'Cassava flour swallow. The everyday champion.' },
  { id: 'iyan', name: 'Pounded Yam', frame: 'iyan', description: 'Smooth, stretchy, and elite. Sunday lunch royalty.' },
  { id: 'amala', name: 'Amala', frame: 'amala', description: 'Dark yam flour swallow. An acquired taste of the wise.' },
];

function createCookingStateCanvas(scene, frameKey) {
  const texture = scene.textures.get('cooking-states');
  if (!texture) return null;
  const frame = texture.get(frameKey);
  if (!frame) return null;
  const cutX = frame.cutX !== undefined ? frame.cutX : frame.x;
  const cutY = frame.cutY !== undefined ? frame.cutY : frame.y;
  const cutWidth = frame.cutWidth || frame.width;
  const cutHeight = frame.cutHeight || frame.height;
  if (!cutWidth || !cutHeight) return null;
  const canvas = document.createElement('canvas');
  canvas.width = cutWidth;
  canvas.height = cutHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(frame.source.image, cutX, cutY, cutWidth, cutHeight, 0, 0, cutWidth, cutHeight);
  return canvas;
}

export class ServingScene extends Phaser.Scene {
  constructor() {
    super('ServingScene');
    this.overlay = null;
    this._resizeHandler = null;
    this.selectedAccompaniment = null;
  }

  create() {
    this.selectedAccompaniment = null;
    this.cameras.main.setBackgroundColor('#0d0b14');

    this.overlay = document.createElement('div');
    this.overlay.id = 'serving-scene-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';

    this.overlay.innerHTML = `
      <div class="absolute inset-0 egusi-pattern pointer-events-none"></div>
      <div class="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-tertiary/5 to-transparent pointer-events-none"></div>

      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-lg">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Efo Egusi: <span class="text-on-surface-variant">Cooking My Way!</span></h1>
        </div>
        <button id="serving-settings-btn" class="material-symbols-outlined text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-150 cursor-pointer">settings</button>
      </header>

      <main class="relative z-10 flex-1 overflow-y-auto px-container-padding pt-lg pb-32 no-scrollbar flex flex-col items-center">
        <!-- Title -->
        <section class="text-center mb-lg">
          <h2 class="font-display-lg text-headline-lg-mobile text-on-surface uppercase mb-xs tracking-wider">Serve Your Dish</h2>
          <p class="text-on-surface-variant font-body-md text-sm">Your Egusi soup is ready! Choose what to serve it with.</p>
        </section>

        <!-- Soup Display -->
        <div class="relative w-48 h-48 flex items-center justify-center mb-lg">
          <div class="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
          <div class="relative z-10 animate-float-boot" id="soup-sprite-container"></div>
        </div>

        <div class="flex items-center gap-xs mb-md">
          <span class="material-symbols-outlined text-tertiary text-[18px]" style='font-variation-settings: "FILL" 1;'>restaurant</span>
          <h3 class="font-label-bold text-label-bold text-tertiary uppercase tracking-wider">Choose Accompaniment</h3>
        </div>

        <!-- Accompaniment Cards -->
        <div class="grid grid-cols-3 gap-sm w-full" id="accompaniment-grid"></div>
      </main>

      <!-- CTA -->
      <div class="absolute left-0 w-full px-container-padding z-40 pointer-events-none" style="bottom: 46px;">
        <button id="serve-btn" class="pointer-events-auto w-full h-14 bg-secondary-container text-on-secondary-container font-headline-lg-mobile text-headline-lg-mobile rounded-xl shadow-[0_4px_0px_#003822] active:shadow-none active:translate-y-[4px] transition-all duration-75 uppercase tracking-wide cursor-pointer flex items-center justify-center gap-sm opacity-50" disabled>
          <span class="material-symbols-outlined">restaurant</span>
          SERVE & JUDGE
        </button>
      </div>

      <nav class="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-md pb-lg pt-sm bg-surface-container-lowest rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.4)]">
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined">storefront</span>
          <span class="font-label-bold text-label-bold">Market</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="font-label-bold text-label-bold">Pantry</span>
        </div>
        <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg px-4 py-1 active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined" style='font-variation-settings: "FILL" 1;'>skillet</span>
          <span class="font-label-bold text-label-bold">Kitchen</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 duration-200 cursor-pointer">
          <span class="material-symbols-outlined">emoji_events</span>
          <span class="font-label-bold text-label-bold">Scoring</span>
        </div>
      </nav>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // ─── SCALING ───
    this._resizeHandler = () => {
      if (!this.overlay) return;
      const canvas = this.sys.game.canvas;
      if (!canvas) return;
      const cb = canvas.getBoundingClientRect();
      const cont = document.getElementById('game-container').getBoundingClientRect();
      const scale = cb.width / 480;
      this.overlay.style.width = '480px';
      this.overlay.style.height = '854px';
      this.overlay.style.transform = `scale(${scale})`;
      this.overlay.style.transformOrigin = 'top left';
      this.overlay.style.left = `${cb.left - cont.left}px`;
      this.overlay.style.top = `${cb.top - cont.top}px`;
    };
    this._resizeHandler();
    this.sys.game.scale.on('resize', this._resizeHandler);

    // ─── RENDER SOUP SPRITE ───
    const soupContainer = this.overlay.querySelector('#soup-sprite-container');
    if (this.textures.exists('cooking-states')) {
      const canvas = createCookingStateCanvas(this, 'egusi_soup');
      if (canvas) {
        canvas.className = 'w-24 h-24 object-contain drop-shadow-2xl';
        soupContainer.appendChild(canvas);
      }
    } else {
      soupContainer.innerHTML = '<span class="text-7xl">🍲</span>';
    }

    // ─── RENDER ACCOMPANIMENT CARDS ───
    this.renderAccompaniments();

    // ─── EVENTS ───
    this.overlay.querySelector('#serving-settings-btn').addEventListener('click', () => showSettingsModal(this));

    this.overlay.querySelector('#serve-btn').addEventListener('click', () => {
      if (!this.selectedAccompaniment) return;
      this.game.gameState.selectedAccompaniment = this.selectedAccompaniment;
      this.overlay.style.transition = 'opacity 0.3s ease';
      this.overlay.style.opacity = '0';
      setTimeout(() => this.scene.start('TasteScoreScene'), 300);
    });

    // ─── CLEANUP ───
    this.events.once('shutdown', () => { this.sys.game.scale.off('resize', this._resizeHandler); this.shutdown(); }, this);
    this.events.once('destroy', () => { this.sys.game.scale.off('resize', this._resizeHandler); this.shutdown(); }, this);
  }

  renderAccompaniments() {
    const grid = this.overlay.querySelector('#accompaniment-grid');
    grid.innerHTML = '';

    ACCOMPANIMENTS.forEach(acc => {
      const isSelected = this.selectedAccompaniment === acc.id;

      const card = document.createElement('button');
      card.className = `game-card pressed-effect card-glow relative cursor-pointer${isSelected ? ' selected-card' : ''}`;

      card.innerHTML = `
        ${isSelected ? '<span class="absolute top-1 right-1 text-xs z-10">✅</span>' : ''}
        <div class="w-16 h-16 flex items-center justify-center" id="acc-img-${acc.id}"></div>
        <span class="font-label-bold text-xs text-on-surface leading-tight">${acc.name}</span>
        <span class="text-[9px] text-on-surface-variant leading-tight text-center">${acc.description}</span>
      `;

      grid.appendChild(card);

      const imgC = card.querySelector(`#acc-img-${acc.id}`);
      if (this.textures.exists('cooking-states')) {
        const canvas = createCookingStateCanvas(this, acc.frame);
        if (canvas) {
          canvas.className = 'w-14 h-14 object-contain drop-shadow-lg';
          imgC.appendChild(canvas);
        }
      } else {
        const fallback = { eba: '🟡', iyan: '⚪', amala: '🟤' };
        imgC.innerHTML = `<span class="text-3xl">${fallback[acc.id]}</span>`;
      }

      card.addEventListener('click', () => {
        this.selectedAccompaniment = acc.id;
        this.renderAccompaniments();

        const btn = this.overlay.querySelector('#serve-btn');
        btn.disabled = false;
        btn.classList.remove('opacity-50');
        btn.classList.add('opacity-100');
      });
    });
  }

  shutdown() {
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
  }
}
