// src/scenes/ResultsScene.js
// Screen 6: Results — Redesigned bento-grid DOM overlay with Judges, Scorecard, Remix CTA, and Builder Funnel
import Phaser from 'phaser';
import { ScoringEngine } from '../ScoringEngine';
import { showSettingsModal } from '../ui/SettingsModal.js';

/**
 * Slices a frame from a preloaded Phaser texture atlas and renders it to a HTML5 canvas.
 */
function createJudgeCanvas(scene, judgeId, score) {
  let judgeKey = '';
  if (judgeId === 'grandma') judgeKey = 'grandma';
  else if (judgeId === 'food_blogger') judgeKey = 'food_blogger';
  else if (judgeId === 'hungry_student') judgeKey = 'hungry_student';
  else if (judgeId === 'restaurant_owner') judgeKey = 'restaurant_owner';
  else return null;

  const textureKey = `${judgeKey}-judge-sprite`;
  const texture = scene.textures.get(textureKey);
  if (!texture) {
    console.error(`[createJudgeCanvas] Texture not found: ${textureKey}`);
    return null;
  }

  // Determine frame based on score thresholds per guidelines:
  // Smiling for >= 90, Neutral for 50-89, Stern for below 50.
  let frameKey = 'NEUTRAL';
  if (score >= 90) frameKey = 'SMILING';
  else if (score < 50) frameKey = 'STERN';

  const frameObj = texture.get(frameKey);
  if (!frameObj) {
    console.error(`[createJudgeCanvas] Frame not found: ${frameKey} in ${textureKey}`);
    return null;
  }

  const cutX = frameObj.cutX !== undefined ? frameObj.cutX : frameObj.x;
  const cutY = frameObj.cutY !== undefined ? frameObj.cutY : frameObj.y;
  const cutWidth = frameObj.cutWidth || frameObj.width;
  const cutHeight = frameObj.cutHeight || frameObj.height;

  const canvas = document.createElement('canvas');
  canvas.width = cutWidth;
  canvas.height = cutHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    frameObj.source.image,
    cutX, cutY, cutWidth, cutHeight,
    0, 0, cutWidth, cutHeight
  );
  return canvas;
}

/**
 * Slices the chef's head from the sprites-cooking texture sheet.
 */
function createChefAvatarCanvas(scene) {
  const texture = scene.textures.get('sprites-cooking');
  if (!texture) return null;
  const frameObj = texture.get('WAVE') || texture.get('IDLE');
  if (!frameObj) return null;

  const cutX = frameObj.cutX !== undefined ? frameObj.cutX : frameObj.x;
  const cutY = frameObj.cutY !== undefined ? frameObj.cutY : frameObj.y;
  const cutWidth = frameObj.cutWidth || frameObj.width;

  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  
  // Crop the head area (top square portion of character strip)
  const cropSize = cutWidth;
  ctx.drawImage(
    frameObj.source.image,
    cutX, cutY + 10, cropSize, cropSize,
    0, 0, 120, 120
  );
  return canvas;
}

export class ResultsScene extends Phaser.Scene {
  constructor() {
    super('ResultsScene');
    this.scoringEngine = null;
    this.overlay = null;
    this.activeSubScreen = 'judges'; // 'judges' | 'scorecard' | 'remix' | 'builder'
    this.resizeOverlayRef = null;
    
    // Cached score calculation
    this.scoreCalculation = null;
  }

  create() {
    this.activeSubScreen = 'judges';

    // Calculate final scores
    this.runScoringEngine();
    this.scoreCalculation = this.scoringEngine.calculateFinalScore();

    // ─── PHASER FADE EFFECT ───
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ─── OVERLAY STRUCTURE CREATION ───
    this.overlay = document.createElement('div');
    this.overlay.id = 'results-overlay';
    this.overlay.className = 'absolute inset-0 z-50 flex flex-col h-full w-full bg-surface-dim text-on-surface font-body-md overflow-hidden select-none pointer-events-auto';
    this.overlay.innerHTML = `
      <style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .fill-icon {
            font-variation-settings: 'FILL' 1;
        }
        .bento-card {
            background: #252131;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card {
            background: rgba(37, 33, 49, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .progress-glow {
            box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.2);
        }
        @keyframes float-gentle {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        .animate-float {
            animation: float-gentle 3.5s ease-in-out infinite;
        }
        .button-3d {
            box-shadow: 0 4px 0 0 rgba(0, 0, 0, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.15);
        }
        .button-3d:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 0 rgba(0, 0, 0, 0.35);
        }
        .pressed-3d-green {
            box-shadow: 0 4px 0 #003822;
        }
        .pressed-3d-green:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #003822;
        }
        .pressed-3d-red {
            box-shadow: 0 4px 0 #690005;
        }
        .pressed-3d-red:active {
            transform: translateY(2px);
            box-shadow: 0 2px 0 #690005;
        }
        .egusi-pattern {
            background-image: radial-gradient(#373244 1px, transparent 1px);
            background-size: 16px 16px;
        }
        .recipe-scroll::-webkit-scrollbar {
            display: none;
        }
        .recipe-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .bento-stagger {
            animation: slideUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            opacity: 0;
        }
        @keyframes slideUp {
            from { transform: translateY(16px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
      </style>

      <!-- App Header -->
      <header class="bg-surface-container-high shadow-sm w-full top-0 sticky z-50 flex justify-between items-center px-container-padding py-sm flex-shrink-0">
        <div class="flex items-center gap-sm">
          <button id="results-back-btn" class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors active:scale-95 cursor-pointer mr-xs">arrow_back</button>
          <span class="material-symbols-outlined text-primary text-2xl" style='font-variation-settings: "FILL" 1;'>restaurant_menu</span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">Efo Egusi: <span class="text-on-surface-variant">Cooking My Way!</span></h1>
        </div>
        <button id="results-settings-btn" class="hover:opacity-80 transition-opacity active:scale-95 cursor-pointer">
          <span class="material-symbols-outlined text-on-surface-variant">settings</span>
        </button>
      </header>

      <!-- Scrollable Main View -->
      <main id="results-content" class="flex-grow flex flex-col items-center px-container-padding pt-lg pb-[120px] max-w-lg mx-auto w-full overflow-y-auto no-scrollbar z-10 egusi-pattern">
        <!-- Inner panels loaded dynamically -->
      </main>

      <!-- Fixed Navigation Footer Decoration -->
      <nav class="absolute bottom-0 left-0 w-full z-50 flex justify-around items-center px-md pb-lg pt-sm bg-surface-container-highest shadow-[0_-4px_12px_rgba(0,0,0,0.4)] rounded-t-xl select-none">
        <div class="flex flex-col items-center justify-center text-on-surface-variant opacity-60">
          <span class="material-symbols-outlined">skillet</span>
          <span class="font-label-bold text-label-bold mt-1">Kitchen</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant opacity-60">
          <span class="material-symbols-outlined">inventory_2</span>
          <span class="font-label-bold text-label-bold mt-1">Pantry</span>
        </div>
        <div class="flex flex-col items-center justify-center text-on-surface-variant opacity-60">
          <span class="material-symbols-outlined">storefront</span>
          <span class="font-label-bold text-label-bold mt-1">Market</span>
        </div>
        <div class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg px-4 py-1.5">
          <span class="material-symbols-outlined fill-icon" style='font-variation-settings: "FILL" 1;'>emoji_events</span>
          <span class="font-label-bold text-label-bold mt-1">Scoring</span>
        </div>
      </nav>
    `;

    document.getElementById('game-container').appendChild(this.overlay);

    // Viewport scaling handler
    const resizeOverlay = () => {
      if (!this.overlay) return;
      const canvas = this.sys.game.canvas;
      if (!canvas) return;

      const canvasBounds = canvas.getBoundingClientRect();
      const containerBounds = document.getElementById('game-container').getBoundingClientRect();

      const scale = canvasBounds.width / 480;
      const offsetX = canvasBounds.left - containerBounds.left;
      const offsetY = canvasBounds.top - containerBounds.top;

      this.overlay.style.width = '480px';
      this.overlay.style.height = '854px';
      this.overlay.style.transform = `scale(${scale})`;
      this.overlay.style.transformOrigin = 'top left';
      this.overlay.style.left = `${offsetX}px`;
      this.overlay.style.top = `${offsetY}px`;
    };

    resizeOverlay();
    this.sys.game.scale.on('resize', resizeOverlay);
    this.resizeOverlayRef = resizeOverlay;

    // Bind header buttons
    this.overlay.querySelector('#results-back-btn').addEventListener('click', () => {
      this.shutdown();
      this.scene.start('TasteScoreScene');
    });
    this.overlay.querySelector('#results-settings-btn').addEventListener('click', () => showSettingsModal(this));

    // Load first screen
    this.showSubScreen(this.activeSubScreen);

    // Unmount safe events
    this.events.once('shutdown', this.shutdown, this);
    this.events.once('destroy', this.shutdown, this);
  }

  runScoringEngine() {
    const state = this.game.gameState;
    const pack = state.contentPack;
    this.scoringEngine = new ScoringEngine(state.gameConfig, pack);

    // 1. Ingredients
    state.selectedIngredients.forEach(id => this.scoringEngine.applyIngredientScore(id));

    // 2. Utensils
    state.selectedUtensils.forEach(id => this.scoringEngine.applyUtensilScore(id));

    // 3. Washing Minigame
    if (state.washingOutcome) {
      this.scoringEngine.applyMiniGameOutcome(state.washingOutcome, pack.miniGames.washingArea);
    }
    if (state.chopThenWash) {
      const isWashFirst = state.chopThenWash.includes('WASH THEN CHOP');
      const hygieneConfig = pack.miniGames.washingArea.decisionPopUp.options[isWashFirst ? 0 : 1];
      if (hygieneConfig && hygieneConfig.scores) {
        for (let [criteria, value] of Object.entries(hygieneConfig.scores)) {
          if (this.scoringEngine.scores[criteria] !== undefined) {
            this.scoringEngine.scores[criteria] += value;
          }
        }
      }
    }

    // 4. Prep Minigame
    const prepData = pack.miniGames.prepArea;
    const sliceOutcome = state.slicingPerformance === 'perfect' ? 'perfect' : 'fail';
    const sliceConfig = prepData.tasks.find(t => t.id === 'slice_vegetables');
    if (sliceConfig && sliceConfig.scores[sliceOutcome]) {
      for (let [criteria, value] of Object.entries(sliceConfig.scores[sliceOutcome])) {
        if (this.scoringEngine.scores[criteria] !== undefined) {
          this.scoringEngine.scores[criteria] += value;
        }
      }
    }
    const isBlender = state.selectedUtensils.includes('blender');
    const grindToolKey = isBlender ? 'blender' : 'mortar_pestle';
    const grindConfig = prepData.tasks.find(t => t.id === 'grind_egusi').dependsOnTool[grindToolKey];
    if (grindConfig && grindConfig.scores.perfect) {
      for (let [criteria, value] of Object.entries(grindConfig.scores.perfect)) {
        if (this.scoringEngine.scores[criteria] !== undefined) {
          this.scoringEngine.scores[criteria] += value;
        }
      }
    }

    // 5. Cooking sequences
    this.scoringEngine.calculateRecipeMatch(state.cookingSequence);
    this.scoringEngine.applyCriticalRules(state.cookingSequence, state.selectedIngredients);

    // 6. Random Events
    state.eventChoices.forEach(choice => {
      this.scoringEngine.applyEventChoiceScore(choice.choiceObj);
    });
  }

  showSubScreen(screenName) {
    this.activeSubScreen = screenName;
    const content = this.overlay.querySelector('#results-content');
    if (!content) return;

    content.innerHTML = '';
    content.scrollTop = 0;

    if (screenName === 'judges') {
      this.renderJudgesScreen(content);
    } else if (screenName === 'scorecard') {
      this.renderScorecardScreen(content);
    } else if (screenName === 'remix') {
      this.renderRemixScreen(content);
    } else if (screenName === 'builder') {
      this.renderBuilderScreen(content);
    }
  }

  // ─── SCREEN 1: JUDGES FEEDBACK ───
  renderJudgesScreen(container) {
    const judgeResults = this.scoringEngine.applyJudgeMultipliers();

    // Page title layout
    const headerSec = document.createElement('header');
    headerSec.className = 'text-center space-y-1 mb-md bento-stagger w-full';
    headerSec.style.animationDelay = '0.05s';
    headerSec.innerHTML = `
      <h2 class="font-display-lg text-display-lg text-primary uppercase tracking-tighter">THE VERDICT</h2>
      <p class="text-on-surface-variant font-body-md text-xs italic">Hear what the table has to say about your pot...</p>
    `;
    container.appendChild(headerSec);

    // Bento cards deck
    const deck = document.createElement('div');
    deck.className = 'grid grid-cols-1 gap-md w-full';
    container.appendChild(deck);

    judgeResults.forEach((res, idx) => {
      const judgeData = this.scoringEngine.judges.judges[idx];
      const judgeId = judgeData.id;
      const scoreVal = res.score;
      const rating = (scoreVal / 10).toFixed(1);

      // Determine color themes for scorecard rating badge
      let badgeBg = 'bg-primary-container text-on-primary-container';
      if (scoreVal >= 90) badgeBg = 'bg-tertiary text-on-tertiary font-bold';
      else if (scoreVal >= 70) badgeBg = 'bg-secondary-container text-on-secondary-container';
      else if (scoreVal < 50) badgeBg = 'bg-error-container text-on-error-container';

      const card = document.createElement('article');
      card.className = `bento-stagger bg-surface-container rounded-2xl p-md flex gap-md items-start shadow-lg border border-white/5`;
      card.style.animationDelay = `${0.1 + idx * 0.1}s`;
      card.innerHTML = `
        <div class="judge-avatar-box w-20 h-20 bg-surface-variant rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-outline-variant/30">
          <!-- Sliced canvas will be appended here -->
        </div>
        <div class="flex-grow space-y-1">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-label-bold text-label-bold text-primary font-bold text-sm leading-tight">${judgeData.name}</h3>
              <p class="text-[10px] text-on-surface-variant uppercase tracking-widest font-label-bold">${judgeData.title}</p>
            </div>
            <div class="${badgeBg} px-2.5 py-1 rounded-lg font-stats-number text-stats-number text-xs leading-none shadow-sm">
              ${rating}
            </div>
          </div>
          <p class="text-on-surface italic font-body-md text-xs pt-1 leading-relaxed">"${res.verdict}"</p>
        </div>
      `;

      deck.appendChild(card);

      // Render sliced judge canvas avatar
      const avatarBox = card.querySelector('.judge-avatar-box');
      const judgeCanvas = createJudgeCanvas(this, judgeId, scoreVal);
      if (judgeCanvas && avatarBox) {
        judgeCanvas.className = 'w-full h-full object-contain p-1 scale-[1.3]';
        avatarBox.appendChild(judgeCanvas);
      }
    });

    // Continue CTA action button
    const btnBox = document.createElement('div');
    btnBox.className = 'mt-lg bento-stagger w-full';
    btnBox.style.animationDelay = `${0.1 + judgeResults.length * 0.1}s`;
    btnBox.innerHTML = `
      <button class="w-full bg-tertiary text-on-tertiary font-label-bold text-label-bold py-lg rounded-full flex items-center justify-center gap-sm button-3d uppercase tracking-wider cursor-pointer">
        SEE FINAL SCORECARD 
        <span class="material-symbols-outlined font-bold">arrow_forward</span>
      </button>
    `;
    container.appendChild(btnBox);

    btnBox.querySelector('button').addEventListener('click', () => {
      this.showSubScreen('scorecard');
    });
  }

  // ─── SCREEN 2: FINAL SCORECARD ───
  renderScorecardScreen(container) {
    const totalScore = this.scoreCalculation.weightedTotal;
    const verdictText = this.scoreCalculation.verdict;
    const violatedRules = this.scoreCalculation.violatedRules;
    const meme = this.scoreCalculation.meme || 'confident_wrong';

    // Map rank configurations
    const badgeMap = {
      approving_grandma_smirk: { emoji: '😏', label: 'approving_grandma' },
      side_eye_confusion: { emoji: '😒', label: 'side_eye_confusion' },
      whatsapp_war: { emoji: '📱', label: 'whatsapp_war' },
      confident_wrong: { emoji: '🤔', label: 'confident_wrong' }
    };
    const badge = badgeMap[meme] || { emoji: '🍲', label: meme };

    // Breakdown metrics
    const traditionScore = this.scoreCalculation.breakdown.tradition || 0;
    const creativityScore = this.scoreCalculation.breakdown.creativity || 0;
    const efficiencyScore = this.scoreCalculation.breakdown.efficiency || 0;
    const executionScore = this.scoreCalculation.breakdown.execution || 0;

    // Header Title
    const headerSec = document.createElement('section');
    headerSec.className = 'text-center w-full mb-md bento-stagger';
    headerSec.style.animationDelay = '0.05s';
    headerSec.innerHTML = `
      <h2 class="font-display-lg text-display-lg text-primary tracking-tight">THE VERDICT</h2>
      <p class="font-body-md text-xs text-on-surface-variant mt-1">Hear what the table has to say about your pot...</p>
    `;
    container.appendChild(headerSec);

    // Main Score Card Bento Panel
    const scoreCard = document.createElement('div');
    scoreCard.className = 'bento-card rounded-2xl p-lg relative overflow-hidden flex flex-col items-center text-center w-full bento-stagger';
    scoreCard.style.animationDelay = '0.15s';
    scoreCard.innerHTML = `
      <div class="z-10 flex flex-col items-center w-full">
        <div class="animate-float py-12">
          <span id="score-counter" class="font-display-lg text-[80px] leading-none text-primary mb-2 block font-extrabold">0</span>
        </div>
        <div class="bg-primary-container/20 text-primary px-4 py-1 rounded-full flex items-center gap-1.5 mb-md border border-primary/20 shadow-sm text-xs font-bold font-label-bold uppercase">
          <span class="text-sm">${badge.emoji}</span>
          <span>${badge.label}</span>
        </div>
        <p class="font-body-md text-xs italic text-on-surface leading-relaxed max-w-[280px]">
          "${verdictText}"
        </p>
      </div>
    `;
    container.appendChild(scoreCard);

    // Count-up overall score animation
    const scoreCounter = scoreCard.querySelector('#score-counter');
    let currentCount = 0;
    const stepVal = Math.ceil(totalScore / 40);
    const countTimer = this.time.addEvent({
      delay: 20,
      callback: () => {
        currentCount += stepVal;
        if (currentCount >= totalScore) {
          currentCount = totalScore;
          countTimer.destroy();
        }
        if (scoreCounter) scoreCounter.textContent = `${currentCount}`;
      },
      loop: true
    });

    // Breakdown Bento Card
    const breakdownCard = document.createElement('div');
    breakdownCard.className = 'bento-card rounded-2xl p-md flex flex-col gap-md w-full bento-stagger mt-md';
    breakdownCard.style.animationDelay = '0.25s';
    breakdownCard.innerHTML = `
      <h3 class="font-label-bold text-[10px] text-primary tracking-widest uppercase font-bold text-left">Ingredient Breakdown</h3>
      
      <!-- Tradition -->
      <div class="flex flex-col gap-1 w-full text-left">
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span>👵</span>
            <span class="font-body-md font-medium">Tradition</span>
          </div>
          <span class="font-stats-number text-stats-number text-secondary text-xs">${traditionScore}%</span>
        </div>
        <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full bg-secondary progress-glow rounded-full" style="width: ${traditionScore}%"></div>
        </div>
      </div>

      <!-- Creativity -->
      <div class="flex flex-col gap-1 w-full text-left">
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span>🎨</span>
            <span class="font-body-md font-medium">Creativity</span>
          </div>
          <span class="font-stats-number text-stats-number text-tertiary text-xs">${creativityScore}%</span>
        </div>
        <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full bg-tertiary progress-glow rounded-full" style="width: ${creativityScore}%"></div>
        </div>
      </div>

      <!-- Efficiency -->
      <div class="flex flex-col gap-1 w-full text-left">
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span>⏱️</span>
            <span class="font-body-md font-medium">Efficiency</span>
          </div>
          <span class="font-stats-number text-stats-number text-error text-xs">${efficiencyScore}%</span>
        </div>
        <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full bg-error progress-glow rounded-full" style="width: ${efficiencyScore}%"></div>
        </div>
      </div>

      <!-- Execution -->
      <div class="flex flex-col gap-1 w-full text-left">
        <div class="flex justify-between items-center text-xs">
          <div class="flex items-center gap-1">
            <span>🔪</span>
            <span class="font-body-md font-medium">Execution</span>
          </div>
          <span class="font-stats-number text-stats-number text-primary text-xs">${executionScore}%</span>
        </div>
        <div class="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
          <div class="h-full bg-primary progress-glow rounded-full" style="width: ${executionScore}%"></div>
        </div>
      </div>
    `;
    container.appendChild(breakdownCard);

    // Rule penalties boxes
    if (violatedRules && violatedRules.length > 0) {
      const penaltyBox = document.createElement('div');
      penaltyBox.className = 'w-full flex flex-col gap-2 mt-md bento-stagger';
      penaltyBox.style.animationDelay = '0.35s';
      violatedRules.forEach(rule => {
        penaltyBox.innerHTML += `
          <div class="bg-error-container/20 border-l-4 border-error p-md rounded-xl flex gap-md items-start text-left">
            <span class="text-xl">⚠️</span>
            <div>
              <p class="font-body-md text-xs text-on-error-container leading-relaxed">
                ${rule}
              </p>
            </div>
          </div>
        `;
      });
      container.appendChild(penaltyBox);
    }

    // CTA buttons
    const actions = document.createElement('div');
    actions.className = 'flex flex-col gap-md pt-md w-full bento-stagger';
    actions.style.animationDelay = '0.45s';
    actions.innerHTML = `
      <button id="share-card-btn" class="w-full bg-[#3f51b5] text-white font-label-bold text-label-bold py-lg rounded-xl button-shadow flex items-center justify-center gap-sm active:translate-y-1 transition-all cursor-pointer button-3d">
        <span class="material-symbols-outlined">share</span>
        COPY SCORECARD TO SHARE
      </button>
      <button id="proceed-remix-btn" class="w-full bg-tertiary text-on-tertiary-fixed font-label-bold text-label-bold py-lg rounded-xl button-shadow flex items-center justify-center gap-sm active:translate-y-1 transition-all cursor-pointer button-3d">
        IS THIS YOUR KIND OF EGUSI? 
        <span class="material-symbols-outlined font-bold">arrow_forward</span>
      </button>
    `;
    container.appendChild(actions);

    actions.querySelector('#share-card-btn').addEventListener('click', () => {
      // Formulate shared content scorecard text
      const shareText = `🍲 Efo Egusi: Cooking My Way! Scorecard 🍲\nOverall Remix Quality: ${totalScore}/100 (${badge.emoji} ${badge.label})\n"${verdictText}"\n\n- Tradition: ${traditionScore}%\n- Creativity: ${creativityScore}%\n- Efficiency: ${efficiencyScore}%\n- Execution: ${executionScore}%\n\nCan you beat my recipe? http://localhost:8083/`;
      navigator.clipboard.writeText(shareText).then(() => {
        this.showToast('📋 Scorecard copied to clipboard!');
      }).catch(() => {
        this.showToast('⚠️ Copy failed. Try again!');
      });
    });

    actions.querySelector('#proceed-remix-btn').addEventListener('click', () => {
      this.showSubScreen('remix');
    });
  }

  // ─── SCREEN 3: REMIX CTA ───
  renderRemixScreen(container) {
    const totalScore = this.scoreCalculation.weightedTotal;
    const verdictText = this.scoreCalculation.verdict;
    const traditionScore = this.scoreCalculation.breakdown.tradition || 0;
    const creativityScore = this.scoreCalculation.breakdown.creativity || 0;

    // Header Title
    const headerSec = document.createElement('section');
    headerSec.className = 'text-center w-full mb-md bento-stagger';
    headerSec.style.animationDelay = '0.05s';
    headerSec.innerHTML = `
      <h2 class="font-display-lg text-headline-lg mb-2 text-on-background uppercase tracking-wider font-extrabold">
        IS THIS YOUR KIND OF EGUSI?
      </h2>
    `;
    container.appendChild(headerSec);

    // Verdict Glass Card
    const glassCard = document.createElement('div');
    glassCard.className = 'glass-card rounded-[32px] p-lg shadow-xl mb-xl border border-outline-variant w-full relative overflow-hidden bento-stagger';
    glassCard.style.animationDelay = '0.15s';
    glassCard.innerHTML = `
      <div class="absolute top-0 right-0 p-md opacity-[0.03] pointer-events-none">
        <span class="material-symbols-outlined text-[120px]">restaurant</span>
      </div>
      <!-- Chef Avatar Circle -->
      <div class="flex flex-col items-center mb-md">
        <div class="chef-avatar-container w-36 h-36 bg-surface-variant rounded-full flex items-center justify-center mb-md animate-float border-4 border-primary/20 shadow-lg overflow-hidden">
          <!-- Canvas avatar will append here -->
        </div>
        <div class="relative bg-surface-container-highest px-md py-sm rounded-xl border-l-4 border-tertiary max-w-[280px]">
          <p class="italic font-label-bold text-on-surface-variant text-sm">
            "${verdictText}"
          </p>
        </div>
      </div>
      <!-- Stats row -->
      <div class="grid grid-cols-2 gap-sm mt-md">
        <div class="bg-surface-container-low p-sm rounded-xl flex flex-col items-center">
          <span class="text-secondary font-stats-number text-stats-number font-bold text-sm">${creativityScore}%</span>
          <span class="font-label-bold text-[8px] text-on-surface-variant uppercase tracking-widest mt-1">Creativity</span>
        </div>
        <div class="bg-surface-container-low p-sm rounded-xl flex flex-col items-center">
          <span class="text-tertiary font-stats-number text-stats-number font-bold text-sm">${traditionScore}%</span>
          <span class="font-label-bold text-[8px] text-on-surface-variant uppercase tracking-widest mt-1">Tradition</span>
        </div>
      </div>
    `;
    container.appendChild(glassCard);

    // Append Chef Avatar Head Canvas
    const chefContainer = glassCard.querySelector('.chef-avatar-container');
    const chefCanvas = createChefAvatarCanvas(this);
    if (chefCanvas && chefContainer) {
      chefCanvas.className = 'w-full h-full object-contain p-1 scale-[1.3]';
      chefContainer.appendChild(chefCanvas);
    }

    // Actions block
    const actions = document.createElement('div');
    actions.className = 'flex flex-col gap-md w-full mb-lg bento-stagger';
    actions.style.animationDelay = '0.25s';
    actions.innerHTML = `
      <button id="yes-soup-btn" class="bg-secondary-fixed text-on-secondary-fixed font-headline-lg-mobile text-headline-lg-mobile py-lg rounded-full w-full pressed-3d-green transition-all hover:brightness-110 flex items-center justify-center gap-sm cursor-pointer button-3d">
        <span class="material-symbols-outlined fill-icon" style='font-variation-settings: "FILL" 1;'>check_circle</span>
        YES. THIS IS SOUP PERFECTION.
      </button>
      <button id="no-style-btn" class="bg-error-container text-on-error-container font-headline-lg-mobile text-headline-lg-mobile py-lg rounded-full w-full pressed-3d-red transition-all hover:brightness-110 flex items-center justify-center gap-sm cursor-pointer button-3d">
        <span class="material-symbols-outlined fill-icon" style='font-variation-settings: "FILL" 1;'>cancel</span>
        NO. THIS IS NOT MY STYLE.
      </button>
      <button id="replay-btn" class="group flex items-center justify-center gap-sm text-on-surface-variant hover:text-primary transition-colors py-sm mx-auto cursor-pointer">
        <span class="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">replay</span>
        <span class="font-label-bold text-label-bold uppercase tracking-widest text-xs">REPLAY REMIX</span>
      </button>
    `;
    container.appendChild(actions);

    actions.querySelector('#yes-soup-btn').addEventListener('click', () => {
      this.showToast('👵 Grandma is pleased. Go eat some real Egusi now!');
    });

    actions.querySelector('#no-style-btn').addEventListener('click', () => {
      this.showSubScreen('builder');
    });

    actions.querySelector('#replay-btn').addEventListener('click', () => {
      this.handleReplay();
    });
  }

  // ─── SCREEN 4: BUILDER FUNNEL ───
  renderBuilderScreen(container) {
    const totalScore = this.scoreCalculation.weightedTotal;

    // Header Title
    const headerSec = document.createElement('section');
    headerSec.className = 'text-center w-full mb-md bento-stagger';
    headerSec.style.animationDelay = '0.05s';
    headerSec.innerHTML = `
      <h2 class="font-display-lg text-display-lg text-primary uppercase font-extrabold tracking-tight">CHALLENGE ACCEPTED!</h2>
      <p class="font-body-md text-xs text-on-surface-variant mt-1 leading-normal px-4">
        Build your own recipe logic with our no-code builder. Here are other simulators built by chefs like you:
      </p>
    `;
    container.appendChild(headerSec);

    // Search bar mock
    const searchBar = document.createElement('div');
    searchBar.className = 'relative w-full bento-stagger';
    searchBar.style.animationDelay = '0.15s';
    searchBar.innerHTML = `
      <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input class="w-full bg-surface-container text-on-surface pl-12 pr-4 py-3 rounded-full border-none focus:outline-none text-xs font-body-md shadow-inner pointer-events-none" placeholder="Find a dish..." type="text"/>
    `;
    container.appendChild(searchBar);

    // Category pills mock list
    const filters = document.createElement('div');
    filters.className = 'flex gap-2 overflow-x-auto w-full recipe-scroll pb-1 bento-stagger';
    filters.style.animationDelay = '0.2s';
    filters.innerHTML = `
      <button class="bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap active:scale-95 transition-transform flex-shrink-0 cursor-pointer">All Recipes</button>
      <button class="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap hover:bg-surface-variant transition-colors flex-shrink-0 cursor-pointer">Soups</button>
      <button class="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap hover:bg-surface-variant transition-colors flex-shrink-0 cursor-pointer">Rice Dishes</button>
      <button class="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap hover:bg-surface-variant transition-colors flex-shrink-0 cursor-pointer">Snacks</button>
      <button class="bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap hover:bg-surface-variant transition-colors flex-shrink-0 cursor-pointer">Grilled</button>
    `;
    container.appendChild(filters);

    // Add category click highlight handler
    const filterBtns = filters.querySelectorAll('button');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.className = 'bg-surface-container text-on-surface-variant px-4 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap hover:bg-surface-variant transition-colors flex-shrink-0 cursor-pointer';
        });
        btn.className = 'bg-primary-container text-on-primary-container px-4 py-1.5 rounded-full font-label-bold text-xs whitespace-nowrap active:scale-95 transition-transform flex-shrink-0 cursor-pointer';
      });
    });

    // Recipes Showcase Grid Panel
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-md w-full pb-md bento-stagger';
    grid.style.animationDelay = '0.25s';
    grid.innerHTML = `
      <!-- Efo Egusi Card -->
      <div class="glass-card rounded-xl overflow-hidden shadow-lg flex flex-col text-left">
        <div class="h-28 relative overflow-hidden bg-[#2a233c] flex items-center justify-center">
          <span class="text-4xl">🍲</span>
          <div class="absolute top-2 right-2 bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-[9px] font-label-bold shadow-md">
            Mastered
          </div>
        </div>
        <div class="p-md flex-grow flex flex-col justify-between space-y-2">
          <div class="flex justify-between items-start">
            <h3 class="font-headline-lg text-sm text-on-surface font-bold">Efo Egusi</h3>
            <div class="flex text-tertiary">
              <span class="material-symbols-outlined text-sm fill-icon" style='font-variation-settings: "FILL" 1;'>local_fire_department</span>
              <span class="material-symbols-outlined text-sm fill-icon" style='font-variation-settings: "FILL" 1;'>local_fire_department</span>
              <span class="material-symbols-outlined text-sm">local_fire_department</span>
            </div>
          </div>
          <div class="flex items-center justify-between text-on-surface-variant text-[10px]">
            <span class="font-label-bold">Best Score: ${totalScore}%</span>
            <div class="flex items-center gap-0.5 opacity-60">
              <span class="material-symbols-outlined text-xs">history</span>
              <span>1 time</span>
            </div>
          </div>
          <div class="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div class="h-full bg-secondary rounded-full" style="width: ${totalScore}%"></div>
          </div>
        </div>
        <div class="bg-secondary/10 px-md py-1.5 border-t border-secondary/20 flex justify-center text-[10px] text-secondary font-label-bold tracking-widest font-bold">
          CHEF SPECIALTY
        </div>
      </div>

      <!-- Party Jollof Card -->
      <div class="glass-card rounded-xl overflow-hidden shadow-lg flex flex-col text-left">
        <div class="h-28 relative overflow-hidden bg-[#2a233c] flex items-center justify-center">
          <span class="text-4xl">🌾</span>
          <div class="absolute top-2 right-2 bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full text-[9px] font-label-bold shadow-md">
            75% Complete
          </div>
        </div>
        <div class="p-md flex-grow flex flex-col justify-between space-y-2">
          <div class="flex justify-between items-start">
            <h3 class="font-headline-lg text-sm text-on-surface font-bold">Party Jollof</h3>
            <div class="flex text-tertiary">
              <span class="material-symbols-outlined text-sm fill-icon" style='font-variation-settings: "FILL" 1;'>local_fire_department</span>
              <span class="material-symbols-outlined text-sm fill-icon" style='font-variation-settings: "FILL" 1;'>local_fire_department</span>
              <span class="material-symbols-outlined text-sm fill-icon" style='font-variation-settings: "FILL" 1;'>local_fire_department</span>
            </div>
          </div>
          <div class="flex items-center justify-between text-on-surface-variant text-[10px]">
            <span class="font-label-bold">Target: Master smoky flavor</span>
          </div>
          <div class="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div class="h-full bg-primary-container rounded-full" style="width: 75%"></div>
          </div>
        </div>
        <div class="bg-primary-container/10 px-md py-1.5 border-t border-primary-container/20 flex justify-center text-[10px] text-primary-container font-label-bold tracking-widest font-bold">
          CONTINUE COOKING
        </div>
      </div>

      <!-- Beef Suya Card -->
      <div class="glass-card rounded-xl overflow-hidden shadow-lg flex flex-col text-left opacity-50 grayscale relative">
        <div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
          <span class="material-symbols-outlined text-3xl text-white mb-1">lock</span>
          <p class="font-label-bold text-[10px] text-white uppercase tracking-widest font-bold">Locked</p>
          <p class="text-[8px] text-on-surface-variant mt-0.5">Unlock at Chef Level 10</p>
        </div>
        <div class="h-28 bg-[#2a233c] flex items-center justify-center">
          <span class="text-4xl">🍖</span>
        </div>
        <div class="p-md space-y-2">
          <div class="flex justify-between items-start">
            <h3 class="font-headline-lg text-sm text-on-surface font-bold">Beef Suya</h3>
          </div>
          <div class="w-full h-1.5 bg-surface-variant rounded-full"></div>
        </div>
      </div>

      <!-- Puff Puff Card -->
      <div class="glass-card rounded-xl overflow-hidden shadow-lg flex flex-col text-left">
        <div class="h-28 relative overflow-hidden bg-[#2a233c] flex items-center justify-center">
          <span class="text-4xl">🥯</span>
          <div class="absolute top-2 right-2 bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full text-[9px] font-label-bold shadow-md">
            Mastered
          </div>
        </div>
        <div class="p-md flex-grow flex flex-col justify-between space-y-2">
          <div class="flex justify-between items-start">
            <h3 class="font-headline-lg text-sm text-on-surface font-bold">Puff Puff</h3>
            <div class="flex text-tertiary">
              <span class="material-symbols-outlined text-sm fill-icon" style='font-variation-settings: "FILL" 1;'>local_fire_department</span>
              <span class="material-symbols-outlined text-sm">local_fire_department</span>
              <span class="material-symbols-outlined text-sm">local_fire_department</span>
            </div>
          </div>
          <div class="flex items-center justify-between text-on-surface-variant text-[10px]">
            <span class="font-label-bold">Best Score: 100%</span>
          </div>
          <div class="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div class="h-full bg-secondary rounded-full" style="width: 100%"></div>
          </div>
        </div>
        <div class="bg-secondary/10 px-md py-1.5 border-t border-secondary/20 flex justify-center text-[10px] text-secondary font-label-bold tracking-widest font-bold">
          PERFECT 100
        </div>
      </div>
    `;
    container.appendChild(grid);

    // Launch Builder button at bottom
    const ctaSec = document.createElement('div');
    ctaSec.className = 'w-full pt-sm bento-stagger';
    ctaSec.style.animationDelay = '0.35s';
    ctaSec.innerHTML = `
      <button class="w-full bg-secondary-fixed text-on-secondary-fixed font-headline-lg-mobile text-headline-lg-mobile py-lg rounded-full flex items-center justify-center gap-sm button-3d cursor-pointer uppercase tracking-wider font-bold">
        LAUNCH RECIPE BUILDER (FREE)
        <span class="material-symbols-outlined font-bold">rocket_launch</span>
      </button>
    `;
    container.appendChild(ctaSec);

    ctaSec.querySelector('button').addEventListener('click', () => {
      this.showToast('🚀 Launching no-code builder onboarding. Get ready to cook!');
      this.time.delayedCall(2000, () => {
        this.handleReplay();
      });
    });
  }

  // ─── UTILITY HELPERS ───
  showToast(message) {
    const existing = this.overlay.querySelector('#toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-surface-container-highest/95 border border-primary/40 text-on-surface px-md py-sm rounded-xl text-center font-label-bold text-xs uppercase tracking-wide shadow-2xl z-[150] animate-in fade-in slide-in-from-bottom duration-300';
    toast.textContent = message;

    this.overlay.appendChild(toast);

    this.time.delayedCall(3000, () => {
      if (toast.parentNode) {
        toast.remove();
      }
    });
  }

  handleReplay() {
    // Reset game states cleanly
    const state = this.game.gameState;
    state.selectedIngredients = [];
    state.selectedUtensils = [];
    state.washingOutcome = null;
    state.chopThenWash = null;
    state.grindingPerformance = null;
    state.slicingPerformance = null;
    state.cookingSequence = [];
    state.eventChoices = [];
    state.finalScores = null;

    // Fade out and route to title
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('LoadingScene');
    });
  }

  shutdown() {
    // Safely remove overlay DOM elements
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    // Clean up scale events
    if (this.resizeOverlayRef) {
      this.sys.game.scale.off('resize', this.resizeOverlayRef);
      this.resizeOverlayRef = null;
    }
  }
}

