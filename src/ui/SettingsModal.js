// src/ui/SettingsModal.js
// Global settings modal — music toggle, restart, return to boot, feedback

let bgMusic = null;
let musicEnabled = false;
let _lastScene = null;

export function initMusic(scene) {
  _lastScene = scene;
  if (bgMusic) {
    if (musicEnabled && !bgMusic.isPlaying) bgMusic.play();
    return;
  }
  if (!scene.cache.audio.exists('bgm')) {
    scene.load.audio('bgm', 'assets/bgm-afrobeat-loop.mp3');
    scene.load.once('complete', () => {
      bgMusic = scene.sound.add('bgm', { loop: true, volume: 0.35 });
      if (musicEnabled) bgMusic.play();
    });
    scene.load.start();
  } else {
    bgMusic = scene.sound.add('bgm', { loop: true, volume: 0.35 });
    if (musicEnabled) bgMusic.play();
  }
}

export function isMusicEnabled() {
  return musicEnabled;
}

export function toggleMusic(scene) {
  musicEnabled = !musicEnabled;
  const activeScene = scene || _lastScene;
  if (musicEnabled) {
    if (bgMusic) {
      if (!bgMusic.isPlaying) bgMusic.play();
    } else if (activeScene) {
      initMusic(activeScene);
    }
  } else {
    if (bgMusic) bgMusic.pause();
  }
  return musicEnabled;
}

export function showSettingsModal(scene) {
  const existing = document.getElementById('settings-modal');
  if (existing) { existing.remove(); return; }

  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.className = 'absolute inset-0 z-[200] flex items-center justify-center p-container-padding bg-black/80 modal-blur';

  modal.innerHTML = `
    <div class="w-full max-w-sm bg-surface-container border border-outline-variant rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="bg-surface-container-high px-md py-sm flex items-center justify-between border-b border-outline-variant/30">
        <div class="flex items-center gap-sm">
          <span class="material-symbols-outlined text-primary" style='font-variation-settings: "FILL" 1;'>settings</span>
          <h2 class="font-headline-lg-mobile text-headline-lg-mobile text-primary">Settings</h2>
        </div>
        <button id="settings-close" class="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer text-2xl active:scale-90">close</button>
      </div>

      <!-- Options -->
      <div class="p-md flex flex-col gap-sm">
        <!-- Music Toggle -->
        <button id="settings-music" class="game-card card-glow flex-row cursor-pointer" style="flex-direction: row; padding: 12px 16px; text-align: left;">
          <span class="material-symbols-outlined text-2xl text-tertiary" style='font-variation-settings: "FILL" 1;'>${musicEnabled ? 'music_note' : 'music_off'}</span>
          <div class="flex flex-col flex-1 ml-3">
            <span class="font-label-bold text-on-surface">Background Music</span>
            <span class="text-[11px] text-on-surface-variant">${musicEnabled ? 'Playing — tap to mute' : 'Muted — tap to play'}</span>
          </div>
          <div class="w-11 h-6 rounded-full ${musicEnabled ? 'bg-secondary' : 'bg-surface-variant'} flex items-center px-0.5 transition-colors">
            <div class="w-5 h-5 rounded-full bg-white shadow transition-transform ${musicEnabled ? 'translate-x-5' : 'translate-x-0'}"></div>
          </div>
        </button>

        <!-- Restart Game -->
        <button id="settings-restart" class="game-card card-glow flex-row cursor-pointer" style="flex-direction: row; padding: 12px 16px; text-align: left;">
          <span class="material-symbols-outlined text-2xl text-primary" style='font-variation-settings: "FILL" 1;'>restart_alt</span>
          <div class="flex flex-col flex-1 ml-3">
            <span class="font-label-bold text-on-surface">Restart Game</span>
            <span class="text-[11px] text-on-surface-variant">Start a new cooking session</span>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>

        <!-- Return to Title -->
        <button id="settings-title" class="game-card card-glow flex-row cursor-pointer" style="flex-direction: row; padding: 12px 16px; text-align: left;">
          <span class="material-symbols-outlined text-2xl text-secondary" style='font-variation-settings: "FILL" 1;'>home</span>
          <div class="flex flex-col flex-1 ml-3">
            <span class="font-label-bold text-on-surface">Return to Title</span>
            <span class="text-[11px] text-on-surface-variant">Go back to the start screen</span>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>

        <!-- Provide Feedback -->
        <button id="settings-feedback" class="game-card card-glow flex-row cursor-pointer" style="flex-direction: row; padding: 12px 16px; text-align: left;">
          <span class="material-symbols-outlined text-2xl text-error" style='font-variation-settings: "FILL" 1;'>feedback</span>
          <div class="flex flex-col flex-1 ml-3">
            <span class="font-label-bold text-on-surface">Provide Feedback</span>
            <span class="text-[11px] text-on-surface-variant">Report bugs or share ideas</span>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant">open_in_new</span>
        </button>
      </div>
    </div>
  `;

  const container = document.getElementById('game-container');
  modal.style.width = '480px';
  modal.style.height = '854px';

  const canvas = scene.sys.game.canvas;
  if (canvas) {
    const canvasBounds = canvas.getBoundingClientRect();
    const containerBounds = container.getBoundingClientRect();
    const scale = canvasBounds.width / 480;
    const offsetX = canvasBounds.left - containerBounds.left;
    const offsetY = canvasBounds.top - containerBounds.top;
    modal.style.transform = `scale(${scale})`;
    modal.style.transformOrigin = 'top left';
    modal.style.left = `${offsetX}px`;
    modal.style.top = `${offsetY}px`;
  }

  container.appendChild(modal);

  // Close
  modal.querySelector('#settings-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  // Music toggle
  modal.querySelector('#settings-music').addEventListener('click', () => {
    const enabled = toggleMusic(scene);
    modal.remove();
    showSettingsModal(scene);
  });

  // Restart
  modal.querySelector('#settings-restart').addEventListener('click', () => {
    modal.remove();
    // Clean up any DOM overlays
    ['boot-scene-overlay', 'loading-scene-overlay', 'ingredient-selection-overlay', 'utensil-selection-overlay', 'kitchen-map-overlay',
     'prep-station-overlay', 'cooking-stove-overlay', 'serving-scene-overlay', 'detail-modal', 'utensil-team-popup', 'utensil-error-popup',
     'kitchen-popup', 'prep-result-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    resetGameState(scene.game);
    scene.scene.start('LoadingScene');
  });

  // Return to title
  modal.querySelector('#settings-title').addEventListener('click', () => {
    modal.remove();
    ['ingredient-selection-overlay', 'utensil-selection-overlay', 'kitchen-map-overlay',
     'prep-station-overlay', 'detail-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    resetGameState(scene.game);
    scene.scene.start('BootScene');
  });

  // Feedback
  modal.querySelector('#settings-feedback').addEventListener('click', () => {
    window.open('https://github.com/anthropics/claude-code/issues', '_blank');
  });
}

function resetGameState(game) {
  game.gameState.selectedIngredients = [];
  game.gameState.selectedUtensils = [];
  game.gameState.washingOutcome = null;
  game.gameState.chopThenWash = null;
  game.gameState.grindingPerformance = null;
  game.gameState.slicingPerformance = null;
  game.gameState.cookingSequence = [];
  game.gameState.eventChoices = [];
  game.gameState.selectedAccompaniment = null;
  game.gameState.finalScores = null;
}
